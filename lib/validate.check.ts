// 자체 점검: 응모 폼 검증 + 프롬프트 조립
import assert from "node:assert/strict";
import { validateEntry, hasErrors, isValidPhone, normalizePhone } from "./validate";
import { buildPrompt, applyPreset, fillFromPreset, EMPTY_BUILDER } from "./prompt";
import { BUILDER_PRESETS } from "../content/templates";
import { TOOLS } from "../content/tools";
import { TASKS } from "../content/tasks";
import { GUIDES } from "../content/guides";
import { STEPS } from "../content/steps";

// ── 전화번호 ──────────────────────────────────────────────
for (const ok of [
  "010-1234-5678",
  "01012345678",
  "010 1234 5678",
  "011-234-5678",
  "0161234567",
]) {
  assert.equal(isValidPhone(ok), true, `유효해야 함: ${ok}`);
}
for (const bad of [
  "",
  "0101234",
  "02-123-4567",
  "010-1234-56789",
  "0201234567",
  "abc",
  "010-1234-567a", // 문자를 걸러낸 뒤 자릿수가 모자람
]) {
  assert.equal(isValidPhone(bad), false, `거부해야 함: ${bad}`);
}
assert.equal(normalizePhone("010-1234-5678"), "01012345678", "하이픈 제거");

// ── 폼 전체 ───────────────────────────────────────────────
const good = { name: "홍길동", phone: "010-1234-5678", consent: true };
assert.equal(hasErrors(validateEntry(good)), false, "정상 입력 통과");

// 동의 없이는 절대 통과하면 안 된다
assert.ok(validateEntry({ ...good, consent: false }).consent, "미동의 거부");
assert.ok(validateEntry({ ...good, name: "김" }).name, "1자 이름 거부");
assert.ok(validateEntry({ ...good, name: "  " }).name, "공백 이름 거부");
assert.ok(
  validateEntry({ ...good, name: "가".repeat(21) }).name,
  "21자 이름 거부"
);
assert.ok(validateEntry({ ...good, phone: "123" }).phone, "잘못된 번호 거부");

// ── 프롬프트 조립 ─────────────────────────────────────────
assert.equal(buildPrompt(EMPTY_BUILDER), "", "전부 비면 빈 문자열");

assert.equal(
  buildPrompt({ ...EMPTY_BUILDER, role: "  한국사 교수  " }),
  "너는 한국사 교수야.",
  "역할만 있을 때 공백이 정리된다"
);

// 공백만 든 칸은 없는 것으로 친다 (빈 줄이 끼지 않아야 함)
const partial = buildPrompt({
  ...EMPTY_BUILDER,
  role: "튜터",
  context: "   ",
  task: "요약해줘",
  format: "표로",
});
assert.equal(partial, "너는 튜터야.\n\n요약해줘\n\n조건:\n표로", "빈 칸 제외");
assert.equal(partial.includes("\n\n\n"), false, "빈 줄이 겹치지 않는다");

// ── 과제 유형 전환 ────────────────────────────────────────
const report = BUILDER_PRESETS.find((p) => p.id === "report")!;
const exam = BUILDER_PRESETS.find((p) => p.id === "exam")!;

// 빈 상태에서 유형을 고르면 네 칸이 예시로 채워진다
const filled = applyPreset(EMPTY_BUILDER, "report");
assert.equal(filled.preset, "report", "preset 갱신");
assert.equal(filled.task, report.task, "빈 칸이 예시로 채워짐");

// 회귀 방지: 예시가 채워진 뒤 유형을 바꾸면 반드시 새 예시로 바뀌어야 한다
const switched = applyPreset(filled, "exam");
assert.equal(switched.preset, "exam", "preset 전환");
assert.equal(switched.role, exam.role, "역할이 새 유형 예시로 교체");
assert.equal(switched.context, exam.context, "맥락이 새 유형 예시로 교체");
assert.equal(switched.task, exam.task, "작업이 새 유형 예시로 교체");
assert.equal(switched.format, exam.format, "형식이 새 유형 예시로 교체");
assert.notEqual(switched.task, report.task, "이전 유형 예시가 남지 않는다");

// 직접 고쳐 쓴 칸은 유형을 바꿔도 지켜진다
const edited = { ...filled, role: "내가 직접 쓴 역할" };
const afterSwitch = applyPreset(edited, "exam");
assert.equal(afterSwitch.role, "내가 직접 쓴 역할", "사용자 입력 보존");
assert.equal(afterSwitch.task, exam.task, "안 건드린 칸은 그대로 교체");

// 없는 유형 id 는 아무것도 바꾸지 않는다
assert.deepEqual(applyPreset(filled, "없는유형"), filled, "알 수 없는 preset 무시");

// 예시로 다시 채우기는 직접 쓴 것까지 덮어쓴다 (네 칸을 다 고쳤을 때의 탈출구)
const refilled = fillFromPreset({
  preset: "exam",
  role: "내가 쓴 역할",
  context: "내가 쓴 맥락",
  task: "내가 쓴 작업",
  format: "내가 쓴 형식",
});
assert.equal(refilled.role, exam.role, "예시로 강제 재채움");
assert.equal(refilled.format, exam.format, "네 칸 모두 덮어씀");
assert.equal(refilled.preset, "exam", "유형은 유지");

// 모든 프리셋의 네 칸이 비어 있지 않아야 한다 (빈 예시는 채워도 티가 안 난다)
for (const p of BUILDER_PRESETS) {
  for (const k of ["role", "context", "task", "format"] as const) {
    assert.ok(p[k].trim().length > 0, `프리셋 ${p.id} 의 ${k} 가 비어 있음`);
  }
}

// ── 콘텐츠 참조 무결성 ────────────────────────────────────
// id 를 잘못 쓰면 링크가 404 가 되거나 추천 단계가 조용히 사라진다.
const toolIds = new Set(TOOLS.map((t) => t.id));
const guideIds = new Set(GUIDES.map((g) => g.id));

for (const task of TASKS) {
  assert.ok(task.steps.length >= 2, `작업 ${task.id} 는 단계가 2개 이상이어야 함`);
  const seen = new Set<string>();
  for (const s of task.steps) {
    assert.ok(toolIds.has(s.toolId), `작업 ${task.id} 가 없는 도구를 가리킴: ${s.toolId}`);
    assert.ok(!seen.has(s.toolId), `작업 ${task.id} 에 ${s.toolId} 가 중복`);
    seen.add(s.toolId);
    assert.ok(s.why.trim().length > 0, `작업 ${task.id} / ${s.toolId} 에 이유가 없음`);
  }
  assert.ok(task.watchOut.trim().length > 0, `작업 ${task.id} 에 주의사항이 없음`);
}

for (const t of TOOLS) {
  if (!t.guideHref) continue;
  const id = t.guideHref.replace("/tools/", "");
  assert.ok(guideIds.has(id), `도구 ${t.id} 의 가이드 링크가 깨짐: ${t.guideHref}`);
}

for (const s of STEPS) {
  if (!s.more) continue;
  const id = s.more.href.replace("/tools/", "");
  assert.ok(guideIds.has(id), `스텝 ${s.id} 의 가이드 링크가 깨짐: ${s.more.href}`);
}

for (const g of GUIDES) {
  if (!g.fromStep) continue;
  assert.ok(
    STEPS.some((s) => s.id === g.fromStep!.id),
    `가이드 ${g.id} 가 없는 스텝을 가리킴: ${g.fromStep.id}`
  );
}

console.log("validate.ts / prompt.ts / 콘텐츠 참조 자체 점검 통과");

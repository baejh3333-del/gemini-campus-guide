// 자체 점검: npm run check
// parseProgress 는 "어떤 쓰레기가 들어와도 앱을 죽이지 않는다"가 유일한 계약이다.
import assert from "node:assert/strict";
import { parseProgress, emptyProgress, canTakeQuiz, markDone } from "./progress";

const empty = emptyProgress();

// 없거나 깨진 입력 -> 초기 상태
assert.deepEqual(parseProgress(null), empty, "null");
assert.deepEqual(parseProgress(""), empty, "빈 문자열");
assert.deepEqual(parseProgress("{{{"), empty, "잘못된 JSON");
assert.deepEqual(parseProgress("null"), empty, "JSON null");
assert.deepEqual(parseProgress('"문자열"'), empty, "객체가 아님");
assert.deepEqual(parseProgress("[1,2]"), empty, "배열");

// 버전이 다르면 마이그레이션 대신 초기화 (캠페인 중 스키마 변경 대비)
assert.deepEqual(
  parseProgress(JSON.stringify({ version: 99, completed: ["prompt"] })),
  empty,
  "버전 불일치"
);

// 타입이 틀린 필드는 통째로 버리지 않고 그 필드만 무시한다
const messy = parseProgress(
  JSON.stringify({
    version: 1,
    completed: ["prompt", "존재하지않는스텝", 42, null],
    checks: { prompt: true, gem: "yes" },
    builder: { role: "학생", junk: 5 },
    quiz: { passed: "true", attempts: 2 },
    startedAt: 12345,
    stepTimes: { prompt: 174, gem: NaN },
    signup: "hacked",
    certName: 12345,
  })
);
assert.deepEqual(messy.completed, ["prompt"], "알 수 없는 스텝 제거");
assert.deepEqual(messy.checks, { prompt: true }, "boolean 아닌 check 제거");
assert.deepEqual(messy.builder, { role: "학생" }, "string 아닌 builder 값 제거");
assert.equal(messy.quiz.passed, false, "boolean 아닌 passed 무시");
assert.equal(messy.quiz.attempts, 2, "유효한 attempts 유지");
assert.equal(messy.startedAt, null, "string 아닌 startedAt 무시");
assert.deepEqual(messy.stepTimes, { prompt: 174 }, "NaN 시간 제거");
assert.equal(messy.signup, "none", "허용되지 않은 signup 값 무시");
assert.equal(messy.certName, "", "string 아닌 certName 무시");

// 수료증 이름은 길이를 자른다 (레이아웃이 깨지지 않게)
assert.equal(
  parseProgress(JSON.stringify({ version: 1, certName: "가".repeat(50) })).certName
    .length,
  20,
  "certName 20자로 절단"
);

// 정상 데이터는 그대로 살아남는다 (왕복)
const good = emptyProgress();
markDone(good, "prompt");
good.checks.prompt = true;
good.signup = "done";
good.startedAt = "2026-09-21T00:00:00.000Z";
assert.deepEqual(parseProgress(JSON.stringify(good)), good, "정상 데이터 왕복");

// 퀴즈 자격: benefit 은 선택이므로 없어도 통과해야 한다
const p = emptyProgress();
assert.equal(canTakeQuiz(p), false, "아무것도 안 했으면 불가");
for (const id of ["prompt", "research", "notebook"] as const) markDone(p, id);
assert.equal(canTakeQuiz(p), false, "gem 남았으면 불가");
markDone(p, "gem");
assert.equal(canTakeQuiz(p), true, "benefit 없이도 통과");

// 중복 완료가 쌓이지 않는다
markDone(p, "gem");
assert.deepEqual(p.completed.filter((x) => x === "gem").length, 1, "중복 방지");

console.log("progress.ts 자체 점검 통과");

import { BUILDER_PRESETS } from "@/content/templates";

export type BuilderState = {
  preset: string;
  role: string;
  context: string;
  task: string;
  format: string;
};

export const FIELD_KEYS = ["role", "context", "task", "format"] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export const EMPTY_BUILDER: BuilderState = {
  preset: "report",
  role: "",
  context: "",
  task: "",
  format: "",
};

/**
 * 과제 유형을 바꿨을 때의 새 상태.
 *
 * 비어 있거나 "이전 유형의 예시 그대로"인 칸은 새 유형의 예시로 갈아끼운다.
 * 직접 고쳐 쓴 칸만 지킨다 — 예전에는 빈 칸만 채워서, 한 번 채워진 뒤에는
 * 유형을 바꿔도 아무것도 안 바뀌는 것처럼 보였다.
 */
export function applyPreset(current: BuilderState, nextId: string): BuilderState {
  const next = BUILDER_PRESETS.find((p) => p.id === nextId);
  if (!next) return current;
  const prev = BUILDER_PRESETS.find((p) => p.id === current.preset);

  const swap = (key: FieldKey) => {
    const cur = current[key];
    if (!cur.trim()) return next[key];
    if (prev && cur === prev[key]) return next[key];
    return cur;
  };

  return {
    preset: nextId,
    role: swap("role"),
    context: swap("context"),
    task: swap("task"),
    format: swap("format"),
  };
}

/** 현재 유형의 예시로 네 칸을 통째로 덮어쓴다. 직접 고친 내용도 지워진다. */
export function fillFromPreset(current: BuilderState): BuilderState {
  const p = BUILDER_PRESETS.find((x) => x.id === current.preset);
  if (!p) return current;
  return {
    preset: current.preset,
    role: p.role,
    context: p.context,
    task: p.task,
    format: p.format,
  };
}

/** 4블록 -> 하나의 프롬프트. 빈 칸은 통째로 빠진다. */
export function buildPrompt(s: BuilderState): string {
  const parts: string[] = [];
  if (s.role.trim()) parts.push(`너는 ${s.role.trim()}야.`);
  if (s.context.trim()) parts.push(s.context.trim());
  if (s.task.trim()) parts.push(s.task.trim());
  if (s.format.trim()) parts.push(`조건:\n${s.format.trim()}`);
  return parts.join("\n\n");
}

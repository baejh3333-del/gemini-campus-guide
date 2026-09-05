"use client";

import { useEffect, useState } from "react";
import { BUILDER_PRESETS } from "@/content/templates";
import { loadProgress, updateProgress } from "@/lib/progress";
import {
  buildPrompt,
  applyPreset,
  fillFromPreset,
  EMPTY_BUILDER as EMPTY,
  type BuilderState,
} from "@/lib/prompt";
import { CopyButton, PromptBox } from "./ui";

const FIELDS = [
  { key: "role", label: "역할", hint: "누구로서 답해야 하나요?" },
  { key: "context", label: "맥락", hint: "내 상황과 가진 자료는?" },
  { key: "task", label: "작업", hint: "정확히 무엇을 시키나요?" },
  { key: "format", label: "형식·제약", hint: "어떤 모양으로 받고 싶나요?" },
] as const;

export function PromptBuilder({ persist = true }: { persist?: boolean }) {
  const [s, setS] = useState<BuilderState>(EMPTY);
  const [ready, setReady] = useState(false);

  // 저장해 둔 입력 복원 (앱 전환 후 돌아와도 날아가지 않게)
  useEffect(() => {
    if (!persist) {
      setReady(true);
      return;
    }
    const saved = loadProgress().builder;
    setS({
      preset: saved.preset || EMPTY.preset,
      role: saved.role || "",
      context: saved.context || "",
      task: saved.task || "",
      format: saved.format || "",
    });
    setReady(true);
  }, [persist]);

  function set(key: keyof BuilderState, value: string) {
    const next = { ...s, [key]: value };
    setS(next);
    if (persist) updateProgress((p) => void (p.builder = { ...next }));
  }

  function commit(next: BuilderState) {
    setS(next);
    if (persist) updateProgress((pr) => void (pr.builder = { ...next }));
  }

  const preview = buildPrompt(s);
  const active = BUILDER_PRESETS.find((p) => p.id === s.preset);

  if (!ready) return <div className="h-64" aria-hidden />;

  return (
    <div className="space-y-4">
      <div>
        <div className="label mb-2">1. 어떤 과제인가요?</div>
        <div className="flex flex-wrap gap-2">
          {BUILDER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => commit(applyPreset(s, p.id))}
              style={{
                transition:
                  "transform .18s var(--ease-press), background-color .22s var(--ease-kinetic), box-shadow .28s var(--ease-kinetic)",
              }}
              className={`min-h-11 rounded-full border px-4 text-sm font-bold active:scale-[0.97] ${
                s.preset === p.id
                  ? "border-transparent bg-[linear-gradient(135deg,#2b7cf0,var(--color-brand)_44%,var(--color-brand-deep))] text-white shadow-[0_10px_24px_-14px_rgba(26,115,232,.9)]"
                  : "border-[var(--color-line)] bg-white/74 text-[var(--color-ink)] backdrop-blur-md"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="text-xs leading-relaxed text-[var(--color-muted)]">
            유형을 누르면 예시가 채워집니다. 직접 고쳐 쓴 칸은 그대로 두니까,
            내 상황으로 바꿔 쓰세요.
          </p>
          <button
            type="button"
            onClick={() => commit(fillFromPreset(s))}
            className="shrink-0 text-xs whitespace-nowrap text-[var(--color-brand)] underline underline-offset-2"
          >
            예시로 다시 채우기
          </button>
        </div>
      </div>

      <div>
        <div className="label mb-2">2. 네 칸을 채웁니다</div>
        <div className="space-y-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-sm font-bold">
                {f.label}
                <span className="ml-2 font-normal text-[var(--color-muted)]">
                  {f.hint}
                </span>
              </span>
              <textarea
                value={s[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={active?.[f.key] ?? ""}
                rows={f.key === "role" ? 1 : 2}
                className="w-full resize-y rounded-[14px] border-[1.5px] border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-[15px] leading-relaxed transition-[border-color,box-shadow] duration-200 focus:border-[var(--color-brand-mid)] focus:shadow-[0_0_0_4px_rgba(66,133,244,.14)] focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="label mb-2">3. 완성된 프롬프트</div>
        {preview ? (
          <PromptBox text={preview} />
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-sm text-[var(--color-muted)]">
            위 칸을 채우면 여기에 프롬프트가 만들어집니다
          </p>
        )}
      </div>

      <CopyButton
        text={preview}
        label="이 프롬프트 복사하기"
        event="prompt_copy"
        eventParams={{ source: "builder", preset: s.preset }}
        disabled={!preview}
        className="btn-primary w-full"
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { GEM_TEMPLATES } from "@/content/templates";
import { loadProgress } from "@/lib/progress";
import { buildPrompt } from "@/lib/prompt";
import { CopyButton, PromptBox } from "./ui";

export function GemTemplates() {
  // 15분 트랙이라 전부 접어 둔다. 하나만 골라 쓰면 되므로 셋을 다 읽을 이유가 없다.
  const [open, setOpen] = useState<string | null>(null);
  const [mine, setMine] = useState("");

  // STEP 1에서 만든 프롬프트를 그대로 Gem 지시문으로 재활용한다.
  useEffect(() => {
    const b = loadProgress().builder;
    setMine(
      buildPrompt({
        preset: b.preset || "",
        role: b.role || "",
        context: b.context || "",
        task: b.task || "",
        format: b.format || "",
      })
    );
  }, []);

  return (
    <div className="space-y-3">
      {mine && (
        <div className="rounded-[18px] border-[1.5px] border-[var(--color-brand-mid)] bg-[linear-gradient(135deg,var(--color-brand-soft),#f4f9ff)] p-4">
          <div className="label mb-1 text-[var(--color-brand-dark)]">
            STEP 1에서 만든 내 프롬프트
          </div>
          <p className="mb-3 text-sm text-[var(--color-brand-dark)]">
            이것도 그대로 Gem 지시문이 됩니다.
          </p>
          <PromptBox text={mine} />
          <div className="mt-3">
            <CopyButton
              text={mine}
              label="내 프롬프트 복사"
              event="prompt_copy"
              eventParams={{ source: "gem-mine" }}
              className="btn-primary w-full"
            />
          </div>
        </div>
      )}

      {GEM_TEMPLATES.map((t) => {
        const isOpen = open === t.id;
        return (
          <div
            key={t.id}
            className="overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-[var(--color-paper)]"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : t.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <span>
                <span className="block text-[15px] font-bold">{t.title}</span>
                <span className="block text-[13px] text-[var(--color-muted)]">
                  {t.desc}
                </span>
              </span>
              <span
                aria-hidden
                className={`shrink-0 text-[var(--color-muted)] transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-[var(--color-line)] p-4">
                <PromptBox text={t.instruction} />
                <div className="mt-3">
                  <CopyButton
                    text={t.instruction}
                    label="지시문 복사"
                    event="prompt_copy"
                    eventParams={{ source: "gem-template", template: t.id }}
                    className="btn-ghost w-full"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

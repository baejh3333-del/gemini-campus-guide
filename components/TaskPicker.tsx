"use client";

import { useState } from "react";
import Link from "next/link";
import { TASKS } from "@/content/tasks";
import { TOOLS } from "@/content/tools";
import { track } from "@/lib/analytics";

const toolById = (id: string) => TOOLS.find((t) => t.id === id);

export function TaskPicker() {
  const [openId, setOpenId] = useState<string | null>(null);
  const task = TASKS.find((t) => t.id === openId);

  return (
    <section className="card border-2 border-[var(--color-ink)]">
      <h2 className="text-[17px] font-extrabold">지금 뭘 하려고 하세요?</h2>
      <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-muted)]">
        고르면 어떤 기능을 어떤 순서로 쓰면 되는지 알려드릴게요.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TASKS.map((t) => {
          const active = openId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const next = active ? null : t.id;
                setOpenId(next);
                if (next) track("task_pick", { task: t.id });
              }}
              style={{
                transition:
                  "transform .18s var(--ease-press), background-color .22s var(--ease-kinetic), box-shadow .28s var(--ease-kinetic)",
              }}
              className={`min-h-11 rounded-full border px-4 text-sm font-bold active:scale-[0.97] ${
                active
                  ? "border-transparent bg-[linear-gradient(135deg,#2b7cf0,var(--color-brand)_44%,var(--color-brand-deep))] text-white shadow-[0_10px_24px_-14px_rgba(26,115,232,.9)]"
                  : "border-[var(--color-line)] bg-white/74 text-[var(--color-ink)] backdrop-blur-md"
              }`}
            >
              <span className="mr-1.5">{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {task && (
        <div className="mt-5 border-t border-[var(--color-line)] pt-5">
          <p className="text-[13px] text-[var(--color-muted)]">{task.when}</p>

          <ol className="mt-4 space-y-3">
            {task.steps.map((s, i) => {
              const tool = toolById(s.toolId);
              if (!tool) return null;
              return (
                <li key={s.toolId} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(160deg,var(--color-brand-mid),var(--color-brand-deep))] text-xs font-extrabold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="text-[15px] font-bold">
                        {tool.emoji} {tool.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          tool.plan === "Pro"
                            ? "bg-[linear-gradient(135deg,var(--color-brand-mid),var(--color-brand-deep))] text-white"
                            : "border border-[var(--color-line)] bg-white/70 text-[var(--color-muted)]"
                        }`}
                      >
                        {tool.plan}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-muted)]">
                      {s.why}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      <a
                        href={`#tool-${tool.id}`}
                        className="text-[12px] text-[var(--color-brand)] underline underline-offset-2"
                      >
                        사용법 보기
                      </a>
                      {tool.guideHref && (
                        <Link
                          href={tool.guideHref}
                          className="text-[12px] text-[var(--color-brand)] underline underline-offset-2"
                        >
                          완전 가이드
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 rounded-[16px] bg-[var(--color-warn-soft)] p-3.5">
            <div className="label mb-1 text-[var(--color-warn)]">이것만 조심</div>
            <p className="text-[13px] leading-relaxed text-[var(--color-warn)]">
              {task.watchOut}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

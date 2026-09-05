"use client";

import { useState } from "react";
import type { Block } from "@/content/steps";
import { track, type EventName } from "@/lib/analytics";

/** 인앱 브라우저(에브리타임·카카오톡)에서는 navigator.clipboard 가 없을 수 있다. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 아래 폴백으로 */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CopyButton({
  text,
  label = "프롬프트 복사",
  event,
  eventParams,
  disabled = false,
  className = "btn-primary w-full",
}: {
  text: string;
  label?: string;
  event?: EventName;
  eventParams?: Record<string, string | number | boolean>;
  disabled?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");

  return (
    <div>
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={async () => {
          const ok = await copyText(text);
          setState(ok ? "ok" : "fail");
          if (ok && event) track(event, eventParams);
          // 성공 표시만 되돌린다. 실패 안내는 읽고 직접 복사해야 하므로 남겨 둔다.
          if (ok) setTimeout(() => setState("idle"), 2500);
        }}
      >
        {state === "ok" ? "✓ 복사했습니다" : state === "fail" ? "복사 실패" : label}
      </button>
      {state === "fail" && (
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-warn)]">
          이 브라우저에서는 자동 복사가 막혀 있어요.{" "}
          <b>위 글상자를 길게 눌러</b> 직접 복사해 주세요. 잘 안 되면 오른쪽 위 메뉴에서
          크롬이나 사파리로 열어 보세요.
        </p>
      )}
    </div>
  );
}

export function OpenButton({
  href,
  label,
  step,
  event = "gemini_open",
  className = "btn-go w-full",
}: {
  href: string;
  label: string;
  step?: string;
  event?: EventName;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track(event, step ? { step } : {})}
    >
      {label} ↗
    </a>
  );
}

export function PromptBox({ text }: { text: string }) {
  return (
    <pre className="promptbox rounded-xl border border-[var(--color-line)] bg-[var(--color-ground)] p-4 text-[13px] leading-relaxed text-[var(--color-ink)]">
      {text}
    </pre>
  );
}

export function TeachBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.t === "p") {
          return (
            <p key={i} className="prose-body">
              {b.text}
            </p>
          );
        }
        if (b.t === "callout") {
          return (
            <p
              key={i}
              className="rounded-xl bg-[var(--color-brand-soft)] p-4 text-[15px] leading-relaxed font-semibold text-[var(--color-brand-dark)]"
            >
              {b.text}
            </p>
          );
        }
        if (b.t === "list") {
          return (
            <ul key={i} className="space-y-2.5">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2.5 prose-body">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]"
                  />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <div key={i} className="space-y-3">
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-ground)] p-4">
              <div className="label mb-2 text-[var(--color-warn)]">이렇게 물으면</div>
              <p className="text-[14px] text-[var(--color-muted)]">{b.bad}</p>
            </div>
            <div className="rounded-xl border-2 border-[var(--color-go)] bg-[var(--color-go-soft)] p-4">
              <div className="label mb-2 text-[var(--color-go)]">이렇게 시키면</div>
              <pre className="promptbox text-[13px] leading-relaxed">{b.good}</pre>
            </div>
          </div>
        );
      })}
    </div>
  );
}

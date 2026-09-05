"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STEPS, type Step } from "@/content/steps";
import {
  loadProgress,
  updateProgress,
  markDone,
  type Progress,
} from "@/lib/progress";
import { track } from "@/lib/analytics";
import { CopyButton, OpenButton, PromptBox, TeachBlocks } from "./ui";
import { PromptBuilder } from "./PromptBuilder";
import { GemTemplates } from "./GemTemplates";
import { Sparkle } from "./Sparkle";

export function StepRunner({ step }: { step: Step }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);
  const startedAt = useRef(Date.now());

  const [atEnd, setAtEnd] = useState(false);
  // 하단 바 높이는 건너뛰기 안내 유무와 버튼 줄바꿈에 따라 달라진다.
  // 고정값을 쓰면 바가 본문을 덮으므로 실측해서 여백을 맞춘다.
  const navRef = useRef<HTMLElement | null>(null);
  const [navH, setNavH] = useState(88);
  const [barW, setBarW] = useState(0);

  const idx = STEPS.findIndex((s) => s.id === step.id);
  const prev = idx > 0 ? STEPS[idx - 1] : null;
  const next = idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
  const done = progress?.completed.includes(step.id) ?? false;

  useEffect(() => {
    setProgress(loadProgress());
    startedAt.current = Date.now();
    track("step_start", { step: step.id });
    window.scrollTo(0, 0);
    setAtEnd(false);

    // 진행바를 0에서 차오르게 해서 "한 칸 나아갔다"를 눈으로 알린다
    setBarW(0);
    const t = setTimeout(
      () => setBarW(Math.round(((idx + 1) / STEPS.length) * 100)),
      80
    );
    return () => clearTimeout(t);
  }, [step.id, idx]);

  // 스크롤 최하단 도착 감지. 임계값을 넘을 때만 상태를 바꾼다 —
  // 스크롤마다 setState 하면 렌더가 튄다.
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const remaining = el.scrollHeight - window.scrollY - window.innerHeight;
      setAtEnd((was) => {
        const now = remaining < 64;
        return now === was ? was : now;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [step.id]);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const measure = () => setNavH(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function complete(answerIndex: number) {
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    const p = updateProgress((pr) => {
      markDone(pr, step.id);
      pr.checks[step.id] = true;
      pr.stepTimes[step.id] = seconds;
      if (step.id === "benefit") {
        // 0=완료, 1=이미 사용중, 2=나중에
        pr.signup = answerIndex === 2 ? "clicked" : "done";
      }
    });
    setProgress(p);
    track("step_complete", { step: step.id, seconds });
    if (step.id === "benefit" && answerIndex !== 2) track("signup_confirmed");
  }

  function submit() {
    if (picked === null) return;
    if (step.check.answer === null || picked === step.check.answer) {
      setWrong(false);
      complete(picked);
    } else {
      setWrong(true);
    }
  }

  function goNext() {
    router.push(next ? `/learn/${next.id}` : "/quiz");
  }

  const needsSignupNudge =
    step.id === "research" && progress !== null && progress.signup !== "done";

  return (
    <main style={{ paddingBottom: navH + 24 }}>
      {/* 진행 바 */}
      <div className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-paper)]/95 backdrop-blur">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <Link href="/" className="text-sm text-[var(--color-muted)]">
            ← 처음으로
          </Link>
          <span className="text-sm font-semibold text-[var(--color-muted)]">
            STEP {step.n} · 약 {step.minutes}분
          </span>
        </div>
        <div className="h-[3px] w-full bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)]">
          {/* 선명한 앞머리가 뒤로 번지는 진행바 */}
          <div
            className="h-full rounded-r-full bg-[linear-gradient(90deg,var(--color-brand-deep),var(--color-brand-mid)_62%,var(--color-brand-lite))] shadow-[0_0_12px_rgba(66,133,244,.55)]"
            style={{
              width: `${barW}%`,
              transition: "width .9s var(--ease-kinetic)",
            }}
          />
        </div>
      </div>

      <div className="stagger space-y-5 px-5 pt-6">
        <header>
          <span className="label flex items-center gap-1.5 text-[var(--color-brand)]">
            <Sparkle size={13} />
            {step.subtitle}
          </span>
          <h1 className="mt-2 text-[28px] leading-[1.18] font-extrabold tracking-[-0.022em]">
            {step.title}
          </h1>
          <div className="ink-panel mt-4 rounded-[22px] p-[18px_20px]">
            <span className="label mb-1.5 block text-white/60">이 단계 목표</span>
            <p className="text-[15px] leading-relaxed font-semibold">{step.goal}</p>
          </div>
        </header>

        <section className="card">
          <div className="label mb-2">왜 필요한가</div>
          <p className="prose-body">{step.why}</p>
        </section>

        <section className="card">
          <TeachBlocks blocks={step.teach} />
        </section>

        {needsSignupNudge && (
          <div className="rounded-xl border border-[var(--color-warn)] bg-[var(--color-warn-soft)] p-4">
            <p className="mb-3 text-sm leading-relaxed font-semibold text-[var(--color-warn)]">
              여기서부터는 Pro 기능을 씁니다. 아직 12개월 무료 혜택을 안 받으셨다면
              지금 받는 게 좋아요.
            </p>
            <Link href="/learn/benefit" className="btn-ghost w-full">
              STEP 0으로 가서 혜택 받기
            </Link>
          </div>
        )}

        {/* 실습 */}
        <section className="card border-2 border-[var(--color-ink)]">
          <div className="label mb-3 text-[var(--color-ink)]">직접 해보기</div>

          <ol className="mb-4 space-y-2">
            {step.practice.instructions.map((t, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>

          {step.practice.widget === "prompt-builder" && (
            <div className="mb-4">
              <PromptBuilder />
            </div>
          )}
          {step.practice.widget === "gem-templates" && (
            <div className="mb-4">
              <GemTemplates />
            </div>
          )}

          {step.practice.prompt && (
            <div className="mb-4 space-y-3">
              <PromptBox text={step.practice.prompt} />
              <CopyButton
                text={step.practice.prompt}
                event="prompt_copy"
                eventParams={{ source: step.id }}
              />
            </div>
          )}

          {step.practice.sampleAsset && (
            <a
              href={step.practice.sampleAsset.href}
              className="btn-ghost mb-3 w-full"
              download
            >
              ⬇ {step.practice.sampleAsset.label}
            </a>
          )}

          <OpenButton
            href={step.practice.openUrl}
            label={step.practice.openLabel}
            step={step.id}
            event={step.id === "benefit" ? "signup_click" : "gemini_open"}
          />
          <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
            새 창에서 열립니다. 실습이 끝나면 이 화면으로 돌아오세요 — 진행 상황은
            저장돼 있습니다.
          </p>

          {/* 자주 막히는 지점. <details> 라 자바스크립트 없이도 열린다 */}
          {step.faq && (
            <div className="mt-5 border-t border-[var(--color-line)] pt-4">
              <div className="label mb-2">잘 안 되나요?</div>
              <div className="space-y-2">
                {step.faq.map((f, i) => (
                  <details
                    key={i}
                    className="rounded-[16px] border border-[var(--color-line)] bg-[var(--color-ground)] px-4"
                  >
                    <summary className="cursor-pointer list-none py-3 text-[14px] font-semibold marker:hidden">
                      <span className="mr-2 text-[var(--color-brand)]">＋</span>
                      {f.q}
                    </summary>
                    <p className="pb-4 text-[14px] leading-relaxed text-[var(--color-muted)]">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 확인 */}
        <section className="card">
          <div className="label mb-3">돌아오셨나요? 확인 한 문제</div>
          <p className="mb-4 text-[16px] leading-relaxed font-bold">
            {step.check.q}
          </p>

          <div className="space-y-2">
            {step.check.options.map((opt, i) => {
              const selected = picked === i;
              const isAnswer = done && step.check.answer === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={done}
                  onClick={() => {
                    setPicked(i);
                    setWrong(false);
                  }}
                  style={{
                    transition:
                      "transform .18s var(--ease-press), border-color .22s var(--ease-kinetic), background-color .22s var(--ease-kinetic), box-shadow .28s var(--ease-kinetic)",
                  }}
                  className={`w-full rounded-2xl border-[1.5px] p-[15px_17px] text-left text-[15px] leading-relaxed active:not-disabled:scale-[0.988] ${
                    isAnswer
                      ? "border-[var(--color-go)] bg-[var(--color-go-soft)] font-bold"
                      : selected
                        ? "border-[var(--color-brand-mid)] bg-[var(--color-brand-soft)] font-bold shadow-[0_10px_26px_-18px_rgba(26,115,232,.9)]"
                        : "border-[var(--color-line)] bg-[var(--color-paper)]"
                  } ${done && !isAnswer ? "opacity-50" : ""}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {wrong && (
            <p className="mt-3 rounded-xl bg-[var(--color-warn-soft)] p-3 text-sm leading-relaxed text-[var(--color-warn)]">
              아직 아니에요. 실습을 다시 확인해 보세요. {step.check.hint}
            </p>
          )}

          {done ? (
            <div className="pop mt-4 rounded-[16px] bg-[var(--color-go-soft)] p-4">
              <p className="text-sm leading-relaxed font-semibold text-[var(--color-go)]">
                ✓ STEP {step.n} 완료 · {step.check.hint}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={picked === null}
              className="btn-primary mt-4 w-full"
            >
              확인
            </button>
          )}
        </section>

        {/* 심화 가이드 — 15분 트랙을 방해하지 않게 맨 아래 */}
        {step.more && (
          <Link
            href={step.more.href}
            className="block rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
          >
            <div className="label mb-1 text-[var(--color-brand)]">
              더 깊이 알고 싶다면
            </div>
            <p className="text-[16px] font-extrabold">
              {step.more.label} <span aria-hidden>→</span>
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-muted)]">
              {step.more.desc}
            </p>
          </Link>
        )}
      </div>

      {/* 스크롤 최하단 도착 — 블룸이 차오르고 칩이 떠오른다 */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-[-160px] left-1/2 z-[2] h-[380px] w-[min(620px,150vw)] blur-[10px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(66,133,244,.5), rgba(138,180,248,.22) 52%, transparent 76%)",
          opacity: atEnd ? 1 : 0,
          transform: `translateX(-50%) scale(${atEnd ? 1 : 0.86})`,
          transition:
            "opacity .7s var(--ease-kinetic), transform .9s var(--ease-kinetic)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 z-[21] inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-brand)_22%,transparent)] bg-white/80 px-4 py-2 text-[12.5px] font-bold text-[var(--color-brand-deep)] shadow-[0_10px_26px_-16px_rgba(8,66,160,.6)] backdrop-blur-md"
        style={{
          bottom: navH + 12,
          opacity: atEnd ? 1 : 0,
          transform: `translateX(-50%) translateY(${atEnd ? 0 : 10}px)`,
          transition:
            "opacity .5s var(--ease-kinetic), transform .6s var(--ease-kinetic)",
        }}
      >
        <Sparkle size={12} className="twinkle" />
        {done ? "다 읽었어요 — 다음으로" : "확인 문제를 풀어 보세요"}
      </div>

      {/* 하단 고정 이동 바 */}
      <nav ref={navRef} className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[560px] border-t border-[var(--color-line)] bg-[var(--color-paper)]/92 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="flex gap-3">
          {prev ? (
            <Link href={`/learn/${prev.id}`} className="btn-ghost flex-1">
              이전
            </Link>
          ) : (
            <Link href="/" className="btn-ghost flex-1">
              처음
            </Link>
          )}
          {/* 확인 문제를 풀기 전에는 이 버튼으로 넘어갈 수 없다. 넘어가려면 아래 건너뛰기. */}
          <button
            type="button"
            onClick={goNext}
            disabled={!done}
            className="btn-primary flex-[2]"
            style={
              atEnd && done
                ? {
                    boxShadow:
                      "0 2px 6px rgba(8,66,160,.3), 0 18px 44px -18px rgba(26,115,232,1)",
                  }
                : undefined
            }
          >
            {next ? `다음 · ${next.title}` : "최종 퀴즈 풀기"}
          </button>
        </div>

        {!done && (
          <div className="mt-2">
            <button
              type="button"
              onClick={goNext}
              className="w-full py-1 text-xs text-[var(--color-muted)] underline underline-offset-2"
            >
              {step.optional ? "나중에 받을게요, 건너뛰기" : "이 단계 건너뛰기"}
            </button>
            <p className="mt-1 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
              {step.optional
                ? "이 단계는 건너뛰어도 수료할 수 있어요."
                : "건너뛰면 경품 응모를 할 수 없어요. 최종 퀴즈는 STEP 1~4를 모두 마쳐야 열립니다."}
            </p>
          </div>
        )}
      </nav>
    </main>
  );
}

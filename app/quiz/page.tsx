"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QUIZ, PASS_SCORE } from "@/content/quiz";
import { STEPS, stepById } from "@/content/steps";
import {
  loadProgress,
  updateProgress,
  canTakeQuiz,
  type Progress,
} from "@/lib/progress";
import { track } from "@/lib/analytics";
import { Sparkle } from "@/components/Sparkle";

export default function QuizPage() {
  const router = useRouter();
  const [p, setP] = useState<Progress | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => QUIZ.map(() => null)
  );
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    setP(loadProgress());
    window.scrollTo(0, 0);
  }, []);

  if (p === null) return <main className="min-h-dvh" />;

  if (!canTakeQuiz(p)) {
    const remaining = STEPS.filter(
      (s) => !s.optional && !p.completed.includes(s.id)
    );
    return (
      <main className="px-5 py-12">
        <h1 className="text-2xl font-extrabold">아직 남은 단계가 있어요</h1>
        <p className="prose-body mt-3">
          최종 퀴즈는 실습을 마친 뒤에 풀 수 있습니다. 남은 단계를 끝내고 오세요.
        </p>
        <ul className="mt-5 space-y-2">
          {remaining.map((s) => (
            <li key={s.id}>
              <Link href={`/learn/${s.id}`} className="btn-ghost w-full">
                STEP {s.n}. {s.title}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  const allAnswered = answers.every((a) => a !== null);
  const wrongItems = QUIZ.map((q, i) => ({ q, i })).filter(
    ({ q, i }) => answers[i] !== q.answer
  );

  function submit() {
    const score = QUIZ.filter((q, i) => answers[i] === q.answer).length;
    setResult(score);
    track("quiz_submit", { score });

    const passed = score >= PASS_SCORE;
    updateProgress((p) => {
      p.quiz.attempts += 1;
      if (passed) p.quiz.passed = true;
    });
    if (passed) {
      track("quiz_pass", { score });
      router.push("/done");
    } else {
      window.scrollTo(0, 0);
    }
  }

  return (
    <main className="stagger px-5 pt-8 pb-16">
      <p className="label flex items-center gap-1.5 text-[var(--color-brand)]">
        <Sparkle size={14} />
        마지막 관문
      </p>
      <h1 className="mt-2 text-[30px] leading-[1.18] font-extrabold tracking-[-0.024em]">
        최종 <span className="grad-text">퀴즈</span>
      </h1>
      <p className="prose-body mt-3">
        {QUIZ.length}문제 중 {PASS_SCORE}개 이상 맞히면 수료입니다. 실습을 했다면
        어렵지 않아요.
      </p>

      {result !== null && result < PASS_SCORE && (
        <div className="mt-5 rounded-[20px] border border-[var(--color-warn)] bg-[var(--color-warn-soft)] p-4 shadow-[0_10px_28px_-22px_rgba(180,83,9,.6)]">
          <p className="font-bold text-[var(--color-warn)]">
            {QUIZ.length}문제 중 {result}개 정답 — 조금만 더!
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-warn)]">
            틀린 문제의 해당 단계를 다시 보고 오세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...new Set(wrongItems.map(({ q }) => q.from))].map((id) => {
              const s = stepById(id);
              return (
                <Link
                  key={id}
                  href={`/learn/${id}`}
                  className="rounded-full border border-[color-mix(in_srgb,var(--color-warn)_28%,transparent)] bg-white/80 px-4 py-2 text-sm font-bold backdrop-blur-md"
                >
                  STEP {s?.n}. {s?.title}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <ol className="mt-8 space-y-8">
        {QUIZ.map((q, i) => {
          const graded = result !== null;
          return (
            <li key={i}>
              <p className="text-[16px] leading-relaxed font-bold">
                {i + 1}. {q.q}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, j) => {
                  const selected = answers[i] === j;
                  const showRight = graded && j === q.answer;
                  const showWrong = graded && selected && j !== q.answer;
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => {
                        const next = [...answers];
                        next[i] = j;
                        setAnswers(next);
                      }}
                      style={{
                        transition:
                          "transform .18s var(--ease-press), border-color .22s var(--ease-kinetic), background-color .22s var(--ease-kinetic), box-shadow .28s var(--ease-kinetic)",
                      }}
                      className={`w-full rounded-2xl border-[1.5px] p-[15px_17px] text-left text-[15px] leading-relaxed active:scale-[0.988] ${
                        showRight
                          ? "border-[var(--color-go)] bg-[var(--color-go-soft)] font-semibold"
                          : showWrong
                            ? "border-[var(--color-warn)] bg-[var(--color-warn-soft)]"
                            : selected
                              ? "border-[var(--color-brand-mid)] bg-[var(--color-brand-soft)] font-bold shadow-[0_10px_26px_-18px_rgba(26,115,232,.9)]"
                              : "border-[var(--color-line)] bg-[var(--color-paper)]"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {graded && answers[i] !== q.answer && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {q.why}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={submit}
        disabled={!allAnswered}
        className="btn-primary mt-8 w-full text-base"
      >
        {allAnswered
          ? result === null
            ? "채점하기"
            : "다시 채점하기"
          : `${answers.filter((a) => a !== null).length}/${QUIZ.length} 답변함`}
      </button>
    </main>
  );
}

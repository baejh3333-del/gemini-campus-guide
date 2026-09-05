"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STEPS, TOTAL_MINUTES } from "@/content/steps";
import { loadProgress, canTakeQuiz, type Progress } from "@/lib/progress";
import { ResetButton } from "@/components/ResetButton";
import { Sparkle } from "@/components/Sparkle";

export default function Home() {
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => setP(loadProgress()), []);

  const doneCount = p?.completed.length ?? 0;
  const started = doneCount > 0;
  // 아직 안 끝낸 첫 스텝으로 보낸다. 다 끝냈으면 퀴즈로.
  const nextStep = STEPS.find((s) => !p?.completed.includes(s.id));
  const resumeHref = p && canTakeQuiz(p)
    ? p.quiz.passed
      ? "/done"
      : "/quiz"
    : `/learn/${nextStep?.id ?? "benefit"}`;

  return (
    <main className="stagger px-5 pt-10 pb-8">
      <p className="label flex items-center gap-1.5 text-[var(--color-brand)]">
        <Sparkle size={14} />
        강원대 AI 마스터 챌린지
      </p>
      <h1 className="mt-3 text-[38px] leading-[1.13] font-extrabold tracking-[-0.033em]">
        15분 만에
        <br />
        <span className="grad-text">제미나이 정복하기</span>
      </h1>
      <p className="prose-body mt-4">
        레포트, 시험공부, 발표. 학교에서 진짜 쓰는 것만 골랐습니다. 읽고 끝내는
        강의가 아니라, 옆 창에 제미나이를 켜놓고 같이 해보는 실습이에요.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          `총 ${TOTAL_MINUTES}분`,
          "실습형",
          "수료 시 경품 응모",
          "재학생 12개월 무료",
        ].map((t) => (
          <span
            key={t}
            className="rounded-full border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-white/72 px-3.5 py-2 text-[12.5px] font-bold text-[var(--color-brand-deep)] backdrop-blur-md"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <Link href={resumeHref} className="btn-primary w-full text-base">
          {started ? "이어서 하기" : "시작하기"}
        </Link>
        {started && (
          <>
            <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
              {doneCount}/{STEPS.length}단계 완료 — 진행 상황이 저장돼 있어요
            </p>
            <div className="mt-1">
              <ResetButton />
            </div>
          </>
        )}
      </div>

      {/* 커리큘럼 */}
      <section className="mt-10">
        <h2 className="text-lg font-extrabold">무엇을 배우나요</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((s) => {
            const isDone = p?.completed.includes(s.id) ?? false;
            return (
              <li key={s.id}>
                <Link
                  href={`/learn/${s.id}`}
                  style={{
                    transition:
                      "transform .22s var(--ease-press), box-shadow .3s var(--ease-kinetic)",
                  }}
                  className={`flex items-start gap-4 rounded-[18px] border p-4 shadow-[0_1px_2px_rgba(16,24,40,.03),0_10px_26px_-20px_rgba(8,66,160,.4)] backdrop-blur-md active:scale-[0.99] ${
                    isDone
                      ? "border-[var(--color-go)] bg-[var(--color-go-soft)]"
                      : "border-[var(--color-line)] bg-white/82"
                  }`}
                >
                  <span
                    className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[13px] text-[13px] font-extrabold text-white ${
                      isDone
                        ? "bg-[linear-gradient(160deg,#12b46b,var(--color-go))]"
                        : "bg-[linear-gradient(160deg,#2b2f38,#14161b)]"
                    }`}
                  >
                    {isDone ? "✓" : `0${s.n}`}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">
                      {s.title}
                      <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">
                        {s.minutes}분
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--color-muted)]">
                      {s.subtitle}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 준비물 */}
      <section className="card mt-8">
        <h2 className="text-base font-extrabold">시작 전에</h2>
        <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          <li>· 구글 계정과 본인 학교 이메일(ex. @kangwon.ac.kr)이 필요합니다.</li>
          <li>
            · 제미나이를 <b className="text-[var(--color-ink)]">다른 창이나 앱</b>으로
            열어두고, 이 페이지와 오가며 진행합니다. 여기서 AI가 답을 만들어 주지는
            않아요.
          </li>
          <li>· 컴퓨터라면 화면을 좌우로 나눠두면 훨씬 편합니다.</li>
          <li>· 강의 PDF가 있으면 STEP 3에서 씁니다. 없으면 샘플을 드려요.</li>
        </ul>
      </section>

      {/* 경품 */}
      <section className="ink-panel mt-4 rounded-[22px] p-5">
        <h2 className="text-base font-extrabold">수료하면 응모할 수 있어요</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-white/80">
          5단계를 마치고 최종 퀴즈를 통과하면 경품 추첨에 응모할 수 있습니다.
          커피 기프티콘 100명.
        </p>
        <p className="mt-3 text-xs text-white/60">
          응모에는 이름과 전화번호가 필요하며, 경품 지급 안내 목적으로만 쓰고 지급
          완료 후 파기합니다.{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            처리방침 보기
          </Link>
        </p>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/tools" className="btn-ghost">
          기능 사전
        </Link>
        <Link href="/tools/prompt-builder" className="btn-ghost">
          프롬프트 빌더
        </Link>
      </div>
    </main>
  );
}

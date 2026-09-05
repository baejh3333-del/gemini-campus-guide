"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadProgress, updateProgress, type Progress } from "@/lib/progress";
import { track } from "@/lib/analytics";
import { EntryForm } from "@/components/EntryForm";
import { ResetButton } from "@/components/ResetButton";
import { Sparkle } from "@/components/Sparkle";
import { TOOLS } from "@/content/tools";

const SHARE_TEXT =
  "15분 만에 제미나이 정복하기 챌린지 수료했어요. 레포트·시험에 바로 쓰는 것만 알려줌.";

export default function DonePage() {
  const [p, setP] = useState<Progress | null>(null);
  const [name, setName] = useState("");
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const saved = loadProgress();
    setP(saved);
    setName(saved.certName);
    window.scrollTo(0, 0);
  }, []);

  function editName(v: string) {
    const trimmed = v.slice(0, 20);
    setName(trimmed);
    updateProgress((pr) => void (pr.certName = trimmed));
  }

  if (p === null) return <main className="min-h-dvh" />;

  if (!p.quiz.passed) {
    return (
      <main className="px-5 py-12">
        <h1 className="text-2xl font-extrabold">아직 수료 전이에요</h1>
        <p className="prose-body mt-3">
          최종 퀴즈를 통과하면 수료증과 응모 화면이 열립니다.
        </p>
        <Link href="/quiz" className="btn-primary mt-6 w-full">
          최종 퀴즈 풀러 가기
        </Link>
      </main>
    );
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function share() {
    track("cert_share");
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI 마스터 챌린지", text: SHARE_TEXT, url });
        return;
      }
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      /* 사용자가 공유를 취소한 경우 — 아무것도 하지 않는다 */
    }
  }

  return (
    <main className="stagger px-5 pt-8 pb-16">
      <p className="label flex items-center gap-1.5 text-[var(--color-go)]">
        <Sparkle size={14} />
        수료 완료
      </p>
      <h1 className="mt-2 text-[28px] leading-tight font-extrabold">
        축하합니다, 이제 제미나이를 <br />
        학업에 쓸 수 있어요
      </h1>

      {/* 수료증 카드 */}
      <div className="ink-panel sheen mt-6 rounded-[26px] p-6 shadow-[0_26px_56px_-28px_rgba(8,66,160,.9)]">
        <p className="text-xs font-bold tracking-widest text-white/50 uppercase">
          Certificate of Completion
        </p>
        <p className="mt-4 text-[22px] leading-snug font-extrabold">
          15분 만에
          <br />
          제미나이 정복하기
        </p>
        <div className="my-5 h-px bg-white/20" />
        <input
          value={name}
          onChange={(e) => editName(e.target.value)}
          maxLength={20}
          placeholder="여기에 이름을 넣어보세요"
          className="w-full border-b border-white/30 bg-transparent pb-2 text-[20px] font-bold text-white placeholder:text-[15px] placeholder:font-normal placeholder:text-white/40 focus:border-white focus:outline-none"
        />
        <p className="mt-4 text-sm text-white/60">{today} · 강원대 AI 마스터 챌린지</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["프롬프트 4블록", "Deep Research", "NotebookLM", "Gems"].map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <button type="button" onClick={share} className="btn-ghost mt-3 w-full">
        {shared ? "✓ 링크를 복사했어요" : "친구에게 공유하기"}
      </button>
      <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
        위 카드를 캡처해서 에브리타임이나 단톡방에 올려도 좋아요.
      </p>

      <div className="mt-8">
        <EntryForm />
      </div>

      {/* 다음에 뭘 보면 되는지 */}
      <section className="mt-10">
        <h2 className="text-lg font-extrabold">여기서 끝내지 마세요</h2>
        <p className="prose-body mt-2">
          다음 과제 때 다시 찾아올 수 있게, 자주 쓰는 것만 정리해 뒀습니다.
        </p>
        <div className="mt-4 space-y-2">
          <Link href="/tools/prompt-builder" className="btn-ghost w-full">
            프롬프트 빌더 다시 쓰기
          </Link>
          <Link href="/tools" className="btn-ghost w-full">
            기능 사전 ({TOOLS.length}개) 보기
          </Link>
        </div>
      </section>

      {/* 공용 PC 에서 이름·입력 내용을 남기지 않고 나가고 싶을 때도 쓴다 */}
      <div className="mt-10 border-t border-[var(--color-line)] pt-5">
        <ResetButton
          label="이 기기에서 내 기록 지우기 / 처음부터 하기"
          note="이 브라우저에 저장된 진행 상황, 프롬프트 빌더 입력, 수료증 이름이 지워집니다. 이미 제출한 응모는 취소되지 않습니다."
        />
      </div>
    </main>
  );
}

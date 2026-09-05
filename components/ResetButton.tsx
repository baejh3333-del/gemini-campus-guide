"use client";

import { useState } from "react";
import { resetProgress } from "@/lib/progress";
import { track } from "@/lib/analytics";

/**
 * 진행 상황 초기화. 되돌릴 수 없으므로 2단계로 받는다.
 * window.confirm 은 일부 인앱 브라우저에서 막히거나 어색하게 뜨므로 쓰지 않는다.
 */
export function ResetButton({
  label = "처음부터 하기",
  note = "완료한 단계, 프롬프트 빌더에 입력한 내용, 퀴즈 결과, 수료증 이름이 모두 지워집니다.",
}: {
  label?: string;
  note?: string;
}) {
  const [arming, setArming] = useState(false);

  if (!arming) {
    return (
      <button
        type="button"
        onClick={() => setArming(true)}
        className="w-full py-2 text-xs text-[var(--color-muted)] underline underline-offset-2"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-warn)] bg-[var(--color-warn-soft)] p-4">
      <p className="text-sm leading-relaxed font-semibold text-[var(--color-warn)]">
        정말 처음부터 시작할까요?
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-warn)]">{note}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setArming(false)}
          className="btn-ghost flex-1"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => {
            track("progress_reset");
            resetProgress();
            // 전체 새로고침이라 화면 어디에도 옛 상태가 남지 않는다.
            window.location.href = "/";
          }}
          className="btn flex-1 bg-[var(--color-warn)] text-white"
        >
          지우고 시작
        </button>
      </div>
    </div>
  );
}

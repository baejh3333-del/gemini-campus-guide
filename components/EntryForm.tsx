"use client";

import { useState } from "react";
import Link from "next/link";
import { loadProgress, updateProgress } from "@/lib/progress";
import {
  validateEntry,
  hasErrors,
  formatPhone,
  type EntryErrors,
} from "@/lib/validate";
import { track } from "@/lib/analytics";

// 폰 스크린샷은 원본이 수 MB 라 긴 변 2000px JPEG 로 줄여 보낸다. 글자는 충분히 읽힌다.
// PNG·HEIC 등 무엇을 골라도 JPEG 로 바뀌어 서버 검증이 단순해진다.
async function toJpeg(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    // decode() 는 탭이 가려져 있으면 끝나지 않는 브라우저가 있어 onload 로 기다린다
    await new Promise((ok, fail) => {
      img.onload = ok;
      img.onerror = fail;
      img.src = url;
    });
    const scale = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function EntryForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<EntryErrors>({});
  // 이미 응모한 기기에서는 폼 대신 완료 화면. 초기화해야 다시 응모할 수 있다.
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    () => (loadProgress().entered ? "done" : "idle")
  );
  const [serverMsg, setServerMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateEntry({ name, phone, image, consent });
    setErrors(errs);
    if (hasErrors(errs)) return;

    setState("sending");
    setServerMsg("");
    try {
      const p = loadProgress();
      const res = await fetch("/api/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          image,
          consent,
          // 추첨 전 이상치를 눈으로 거르기 위한 학습 기록
          progress: {
            completed: p.completed,
            stepTimes: p.stepTimes,
            quizAttempts: p.quiz.attempts,
            signup: p.signup,
            startedAt: p.startedAt,
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setState("error");
        setServerMsg(data.error || "잠시 후 다시 시도해 주세요.");
        return;
      }
      updateProgress((pr) => void (pr.entered = true));
      setState("done");
      track("entry_submit");
    } catch {
      setState("error");
      setServerMsg("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  if (state === "done") {
    return (
      <div className="card border-2 border-[var(--color-go)] bg-[var(--color-go-soft)] text-center">
        <p className="text-lg font-extrabold text-[var(--color-go)]">
          응모 완료!
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          당첨자는 캠페인 종료 후 입력하신 번호로 개별 안내드립니다. 수고하셨어요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-extrabold">경품 응모하기</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          올리브영 5만 원권 2명 · 배민 2만 원권 5명 · 배민·올리브영 5천 원권 20명
        </p>
        <p className="mt-2 rounded-xl bg-[var(--color-ground)] p-3 text-[13px] leading-relaxed">
          첨부한 <b>Google AI Plus 가입 화면 캡처</b>로 이번 캠페인 기간에 새로
          가입했는지 확인합니다. 확인되지 않으면 당첨이 취소되고 다음 순번에게
          넘어갑니다.
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-bold">이름</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="w-full min-h-[50px] rounded-[14px] border-[1.5px] border-[var(--color-line)] px-4 text-[16px] transition-[border-color,box-shadow] duration-200 focus:border-[var(--color-brand-mid)] focus:shadow-[0_0_0_4px_rgba(66,133,244,.14)] focus:outline-none"
          placeholder="홍길동"
        />
        {errors.name && (
          <span className="mt-1 block text-xs text-[var(--color-warn)]">
            {errors.name}
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-bold">휴대폰 번호</span>
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          autoComplete="tel"
          className="w-full min-h-[50px] rounded-[14px] border-[1.5px] border-[var(--color-line)] px-4 text-[16px] transition-[border-color,box-shadow] duration-200 focus:border-[var(--color-brand-mid)] focus:shadow-[0_0_0_4px_rgba(66,133,244,.14)] focus:outline-none"
          placeholder="010-1234-5678"
        />
        {errors.phone && (
          <span className="mt-1 block text-xs text-[var(--color-warn)]">
            {errors.phone}
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-bold">가입 화면 캡처</span>
        <span className="mb-2 block text-xs text-[var(--color-muted)]">
          요금제 이름(Google AI Plus)과 가입 날짜가 보이게. 이메일 등 다른 정보는
          가려도 됩니다.
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            setImage("");
            if (!f) return;
            try {
              setImage(await toJpeg(f));
              setErrors((er) => ({ ...er, image: undefined }));
            } catch {
              setErrors((er) => ({
                ...er,
                image: "이미지를 읽지 못했어요. 다른 캡처 파일로 다시 골라 주세요.",
              }));
            }
          }}
          className="block w-full text-sm file:mr-3 file:min-h-[44px] file:rounded-[12px] file:border-0 file:bg-[var(--color-ground)] file:px-4 file:font-bold"
        />
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="첨부한 가입 화면 캡처 미리보기"
            className="mt-2 max-h-48 rounded-xl border border-[var(--color-line)]"
          />
        )}
        {errors.image && (
          <span className="mt-1 block text-xs text-[var(--color-warn)]">
            {errors.image}
          </span>
        )}
      </label>

      <div className="rounded-xl bg-[var(--color-ground)] p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-brand)]"
          />
          <span className="text-[13px] leading-relaxed">
            <b>[필수]</b> 개인정보 수집·이용에 동의합니다.
            <br />
            수집 항목: 이름, 휴대폰 번호, 혜택 가입 화면 캡처 · 목적:
            경품 추첨, 당첨 자격 확인 및 지급 안내 · 보유기간:
            경품 지급 완료 후 즉시 파기(2026년 10월 31일 이전).
            <br />
            동의를 거부할 수 있으며, 이 경우 경품 응모만 제한되고 학습 내용은 계속
            이용할 수 있습니다.{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              전문 보기
            </Link>
          </span>
        </label>
        {errors.consent && (
          <span className="mt-2 block text-xs text-[var(--color-warn)]">
            {errors.consent}
          </span>
        )}
      </div>

      {state === "error" && (
        <p className="rounded-xl bg-[var(--color-warn-soft)] p-3 text-sm text-[var(--color-warn)]">
          {serverMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="btn-primary w-full text-base"
      >
        {state === "sending" ? "제출 중…" : "응모하기"}
      </button>
    </form>
  );
}

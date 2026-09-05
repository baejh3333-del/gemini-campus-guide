"use client";

import { useState } from "react";
import Link from "next/link";
import { loadProgress } from "@/lib/progress";
import { validateEntry, hasErrors, type EntryErrors } from "@/lib/validate";
import { track } from "@/lib/analytics";

export function EntryForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<EntryErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [serverMsg, setServerMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateEntry({ name, phone, consent });
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
          커피 기프티콘 100명
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
          onChange={(e) => setPhone(e.target.value)}
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
            수집 항목: 이름, 휴대폰 번호 · 목적: 경품 추첨 및 지급 안내 · 보유기간:
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

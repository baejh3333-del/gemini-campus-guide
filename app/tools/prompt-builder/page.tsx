import Link from "next/link";
import { PromptBuilder } from "@/components/PromptBuilder";

export const metadata = { title: "프롬프트 빌더 | 15분 제미나이" };

export default function PromptBuilderPage() {
  return (
    <main className="px-5 pt-8 pb-12">
      <Link href="/" className="text-sm text-[var(--color-muted)]">
        ← 처음으로
      </Link>
      <h1 className="mt-3 text-[28px] leading-tight font-extrabold">
        프롬프트 빌더
      </h1>
      <p className="prose-body mt-3">
        과제가 생길 때마다 여기서 만들어 쓰세요. 역할 · 맥락 · 작업 · 형식 네 칸만
        채우면 됩니다. 입력한 내용은 이 기기에만 저장됩니다.
      </p>

      <div className="card mt-6">
        <PromptBuilder />
      </div>

      <div className="mt-6 rounded-xl bg-[var(--color-brand-soft)] p-4 text-[14px] leading-relaxed text-[var(--color-brand-dark)]">
        <b>한 번에 다 시키지 마세요.</b> 목차 → 개요 → 본문 순으로 나눠서 시키면
        결과가 훨씬 좋아집니다. 자료를 붙여넣을 땐 지시와 자료를 구분선으로
        나누세요.
      </div>

      <Link href="/tools" className="btn-ghost mt-6 w-full">
        기능 사전 보기
      </Link>
    </main>
  );
}

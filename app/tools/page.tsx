import Link from "next/link";
import { TOOLS } from "@/content/tools";
import { GUIDES } from "@/content/guides";
import { TaskPicker } from "@/components/TaskPicker";
import { Sparkle } from "@/components/Sparkle";

export const metadata = { title: "제미나이 기능 사전 | 15분 제미나이" };

export default function ToolsPage() {
  return (
    <main className="stagger px-5 pt-8 pb-12">
      <Link href="/" className="text-sm text-[var(--color-muted)]">
        ← 처음으로
      </Link>
      <p className="label mt-4 flex items-center gap-1.5 text-[var(--color-brand)]">
        <Sparkle size={14} />
        제미나이에만 있는 것
      </p>
      <h1 className="mt-2 text-[30px] leading-[1.18] font-extrabold tracking-[-0.024em]">
        기능 <span className="grad-text">사전</span>
      </h1>
      <p className="prose-body mt-3">
        제미나이에만 있는 기능들. 뭘 쓸지 헷갈릴 때 여기서 찾아보세요.
      </p>

      <div className="mt-6">
        <TaskPicker />
      </div>

      <div className="mt-6">
        <div className="label mb-2">깊이 파는 가이드</div>
        <div className="space-y-2">
          {GUIDES.map((g) => (
            <Link
              key={g.id}
              href={`/tools/${g.id}`}
              style={{
                transition:
                  "transform .22s var(--ease-press), box-shadow .3s var(--ease-kinetic)",
              }}
              className="block rounded-[18px] border border-[var(--color-line)] bg-white/82 p-4 shadow-[0_1px_2px_rgba(16,24,40,.03),0_10px_26px_-20px_rgba(8,66,160,.4)] backdrop-blur-md active:scale-[0.99]"
            >
              <span className="block text-[15px] font-bold">
                {g.title} <span aria-hidden>→</span>
              </span>
              <span className="mt-0.5 block text-[13px] text-[var(--color-muted)]">
                {g.subtitle}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {TOOLS.map((t) => (
          <article key={t.id} id={`tool-${t.id}`} className="card scroll-mt-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-extrabold">
                <span className="mr-2">{t.emoji}</span>
                {t.name}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  t.plan === "Pro"
                    ? "bg-[linear-gradient(135deg,var(--color-brand-mid),var(--color-brand-deep))] text-white"
                    : "border border-[var(--color-line)] bg-white/70 text-[var(--color-muted)]"
                }`}
              >
                {t.plan}
              </span>
            </div>
            <p className="mt-1.5 text-[15px] font-semibold">{t.oneLiner}</p>

            <dl className="mt-4 space-y-3 text-[14px] leading-relaxed">
              <div>
                <dt className="label">언제 쓰나</dt>
                <dd className="mt-0.5">{t.when}</dd>
              </div>
              <div>
                <dt className="label">어디 있나</dt>
                <dd className="mt-0.5 text-[var(--color-muted)]">{t.where}</dd>
              </div>
              <div>
                <dt className="label">3단계 사용법</dt>
                <dd className="mt-1">
                  <ol className="space-y-1.5">
                    {t.how.map((h, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(160deg,var(--color-brand-mid),var(--color-brand-deep))] text-[11px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ol>
                </dd>
              </div>
              <div>
                <dt className="label">학업 활용 예시</dt>
                <dd className="mt-1">
                  <ul className="space-y-1.5">
                    {t.examples.map((e, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden className="text-[var(--color-brand)]">
                          ·
                        </span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2">
              {t.guideHref && (
                <Link href={t.guideHref} className="btn-primary w-full">
                  {t.name} 완전 가이드 보기
                </Link>
              )}
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost w-full"
              >
                {t.name} 열기 ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

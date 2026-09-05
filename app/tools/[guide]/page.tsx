import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, guideById } from "@/content/guides";
import { stepById } from "@/content/steps";
import { Sparkle } from "@/components/Sparkle";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ guide: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guide: string }>;
}) {
  const { guide } = await params;
  const g = guideById(guide);
  if (!g) return { title: "가이드" };
  return {
    title: `${g.title} | 15분 제미나이`,
    description: `${g.subtitle} — ${g.intro.slice(0, 90)}`,
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ guide: string }>;
}) {
  const { guide } = await params;
  const g = guideById(guide);
  if (!g) notFound();

  const step = g.fromStep ? stepById(g.fromStep.id) : undefined;
  // 본문 섹션 번호는 데이터에 박지 않고 여기서 매긴다
  const workflowNo = g.groups.length + 1;
  const pitfallNo = g.groups.length + 2;

  return (
    <main className="stagger px-5 pt-8 pb-12">
      <Link href="/tools" className="text-sm text-[var(--color-muted)]">
        ← 기능 사전
      </Link>

      <p className="label mt-4 flex items-center gap-1.5 text-[var(--color-brand)]">
        <Sparkle size={14} />
        완전 가이드
      </p>
      <h1 className="mt-2 text-[30px] leading-[1.18] font-extrabold tracking-[-0.024em]">
        {g.title}
      </h1>
      <p className="mt-1 text-[15px] text-[var(--color-muted)]">{g.subtitle}</p>
      <p className="prose-body mt-4">{g.intro}</p>

      <a
        href={g.openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-go mt-5 w-full"
      >
        {g.openLabel} ↗
      </a>

      {g.groups.map((group, gi) => (
        <section key={group.id} className="mt-10">
          <h2 className="text-xl font-extrabold">
            {gi + 1}. {group.title}
          </h2>
          <p className="prose-body mt-2">{group.lead}</p>

          <div className="mt-4 space-y-3">
            {group.features.map((f) => (
              <article key={f.id} className="card">
                <h3 className="text-[17px] font-extrabold">
                  <span className="mr-2">{f.emoji}</span>
                  {f.name}
                </h3>
                <p className="prose-body mt-2">{f.what}</p>

                <div className="mt-3 rounded-[16px] border border-[var(--color-line)] bg-[var(--color-ground)] p-3.5">
                  <div className="label mb-1">학생은 이렇게</div>
                  <p className="text-[14px] leading-relaxed">{f.use}</p>
                </div>

                {f.tip && (
                  <div className="mt-2 rounded-[16px] bg-[linear-gradient(135deg,var(--color-brand-soft),#f4f9ff)] p-3.5">
                    <div className="label mb-1 text-[var(--color-brand-dark)]">
                      잘 쓰는 법
                    </div>
                    <p className="text-[14px] leading-relaxed text-[var(--color-brand-dark)]">
                      {f.tip}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="text-xl font-extrabold">
          {workflowNo}. {g.workflow.title}
        </h2>
        <p className="prose-body mt-2">{g.workflow.lead}</p>
        <ol className="mt-4 space-y-3">
          {g.workflow.steps.map((w, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(160deg,var(--color-brand-mid),var(--color-brand-deep))] text-xs font-extrabold text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">{w.when}</span>
                <span className="mt-0.5 block text-[14px] leading-relaxed text-[var(--color-muted)]">
                  {w.do}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold">{pitfallNo}. 흔한 실수</h2>
        <div className="mt-4 space-y-2">
          {g.pitfalls.map((p, i) => (
            <details
              key={i}
              className="rounded-[16px] border border-[var(--color-line)] bg-[var(--color-paper)] px-4 shadow-[0_1px_2px_rgba(16,24,40,.03)]"
            >
              <summary className="cursor-pointer list-none py-3.5 text-[15px] font-semibold marker:hidden">
                <span className="mr-2 text-[var(--color-warn)]">⚠</span>
                {p.q}
              </summary>
              <p className="pb-4 text-[14px] leading-relaxed text-[var(--color-muted)]">
                {p.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-base font-extrabold">더 알아보기</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
          이 도구는 기능이 빠르게 바뀝니다. 이 문서는 {g.checkedAt} 기준이며, 화면과
          다르면 공식 도움말을 우선하세요.
        </p>
        <ul className="mt-3 space-y-1.5">
          {g.sources.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[var(--color-brand)] underline underline-offset-2"
              >
                {s.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* 다른 가이드로 */}
      <section className="mt-12">
        <h2 className="text-base font-extrabold">다른 도구 가이드</h2>
        <div className="mt-3 space-y-2">
          {GUIDES.filter((o) => o.id !== g.id).map((o) => (
            <Link
              key={o.id}
              href={`/tools/${o.id}`}
              style={{
                transition:
                  "transform .22s var(--ease-press), box-shadow .3s var(--ease-kinetic)",
              }}
              className="block rounded-[18px] border border-[var(--color-line)] bg-white/82 p-4 shadow-[0_1px_2px_rgba(16,24,40,.03),0_10px_26px_-20px_rgba(8,66,160,.4)] backdrop-blur-md active:scale-[0.99]"
            >
              <span className="block text-[15px] font-bold">
                {o.title} <span aria-hidden>→</span>
              </span>
              <span className="mt-0.5 block text-[13px] text-[var(--color-muted)]">
                {o.subtitle}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/tools" className="btn-ghost">
          기능 사전
        </Link>
        {g.fromStep && step ? (
          <Link href={`/learn/${step.id}`} className="btn-ghost">
            {g.fromStep.label}
          </Link>
        ) : (
          <Link href="/" className="btn-ghost">
            처음으로
          </Link>
        )}
      </div>
    </main>
  );
}

import { Fragment } from "react";
import { notFound } from "next/navigation";
import { getPrompt, listPrompts } from "@/lib/prompt-library";
import { LibraryHeader, LibraryFooter } from "@/components/LibraryChrome";
import { LibraryCopy } from "@/components/LibraryCopy";
import { SignupLink } from "@/components/SignupLink";

export async function generateStaticParams() {
  return (await listPrompts()).map((prompt) => ({ slug: prompt.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const prompt = await getPrompt((await params).slug);
  return { title: prompt ? `${prompt.title} | GSA 프롬프트 저장소` : "프롬프트를 찾을 수 없어요" };
}

function renderHighlightedBody(text: string) {
  const parts = text.split(/(\[[^[\]\n]{1,20}\])/g);
  return parts.map((part, index) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <mark key={index} className="prompt-var">
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
}

export default async function PromptDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const prompt = await getPrompt((await params).slug);
  if (!prompt) notFound();
  const hasOverview = !prompt.repoUrl?.startsWith("https://github.com/") && Boolean(prompt.outcomes?.length);
  const from = (await searchParams).from;
  const returnTo = from === "/" || (typeof from === "string" && from.startsWith("/?")) ? from : "/";
  return (
    <main className="library-page library-detail">
      <LibraryHeader back={returnTo} />
      <section className="library-intro detail-hero">
        <p className="library-eyebrow">
          {prompt.category} ·{" "}
          {prompt.source
            ? `${prompt.source.kind} #${prompt.source.number}`
            : prompt.kind === "gem"
              ? "Gem 템플릿"
              : prompt.kind === "skill"
                ? "Skill · MD"
                : "프롬프트"}
        </p>
        <h1>{prompt.title}</h1>
      </section>
      <div className="library-sheet">
        <article>
          <section className="detail-section">
            <h2>어떤 기능이에요?</h2>
            <p>{prompt.description}</p>
            {prompt.skillNote && <p>{prompt.skillNote}</p>}
          </section>
          <section className="detail-section">
            {hasOverview ? (
              <>
                <h2>이런 도움을 받을 수 있어요</h2>
                <ul className="prompt-outcomes">
                  {prompt.outcomes?.map((outcome) => <li key={outcome}>{outcome}</li>)}
                </ul>
              </>
            ) : (
              <>
                <h2>이렇게 쓰세요</h2>
                <ol className="library-steps">
                  {prompt.steps.map((step, index) => (
                    <li key={step}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
          <section className="detail-section library-prompt-section">
            <div className="library-section-heading">
              <h2>{prompt.kind === "skill" ? "SKILL.md 파일 받기 & 사용" : "바로 쓰는 프롬프트"}</h2>
              <span>
                {prompt.kind === "skill"
                  ? `SKILL.md 전문 (${prompt.body.length.toLocaleString("ko-KR")}자)`
                  : hasOverview
                    ? "복사해 AI 대화창에 붙여넣으면 시작돼요"
                    : prompt.copyCount === null
                      ? "파란 표시 [항목]을 내 상황에 맞게 바꿔보세요"
                      : `${prompt.copyCount.toLocaleString("ko-KR")}회 복사`}
              </span>
            </div>
            {hasOverview ? (
              <details id="prompt-full-text" className="skill-raw-details prompt-full-details">
                <summary>
                  <span>자세히보기 · 프롬프트 전문</span>
                  <span className="details-toggle-hint"><span className="prompt-show-label">펼치기</span><span className="prompt-hide-label">접기</span> ▾</span>
                </summary>
                <pre className="library-prompt-text">{renderHighlightedBody(prompt.body)}</pre>
              </details>
            ) : prompt.kind !== "skill" && (
              <pre className="library-prompt-text">{renderHighlightedBody(prompt.body)}</pre>
            )}
            <LibraryCopy
              body={prompt.body}
              kind={prompt.kind}
              skillName={prompt.skillName}
              fullTextId={hasOverview ? "prompt-full-text" : undefined}
            />
            {prompt.kind === "skill" && (
              <details className="skill-raw-details">
                <summary>
                  <span>SKILL.md 내용 펼쳐보기 ({prompt.body.length.toLocaleString("ko-KR")}자)</span>
                  <span className="details-toggle-hint">클릭하여 열기 / 닫기 ▾</span>
                </summary>
                <pre className="library-prompt-text">{prompt.body}</pre>
              </details>
            )}
            {prompt.repoUrl && (
              <a href={prompt.repoUrl} target="_blank" rel="noopener noreferrer" className="open-gemini">
                GitHub 스킬 원본 보기 ↗
              </a>
            )}
            {prompt.source && (
              <a href={prompt.source.url} target="_blank" rel="noopener noreferrer" className="open-gemini">
                {prompt.source.kind} #{prompt.source.number} 원본 보기 ↗
              </a>
            )}
            <SignupLink
              source="prompt_detail"
              className="library-student-subscribe"
            >
              <span>학생 Gemini 무료로 구독하기</span>
              <span aria-hidden="true">↗</span>
            </SignupLink>
          </section>
        </article>
        <LibraryFooter />
      </div>
    </main>
  );
}

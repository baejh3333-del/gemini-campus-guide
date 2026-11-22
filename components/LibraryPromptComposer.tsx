"use client";

import { useRef, useState } from "react";
import PromptDraftAssistant from "./PromptDraftAssistant";
import { CATEGORIES, type Category, type LibraryPrompt } from "@/lib/prompt-library";
import { VISUAL_VARIANTS, type PlaygroundPrompt } from "@/lib/playground";
import { LibraryVisual } from "./LibraryVisual";

export function LibraryPromptComposer({
  onCreated,
  onClose,
}: {
  onCreated: (prompt: PlaygroundPrompt) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<Category>("릴스·카드뉴스");
  const [variant, setVariant] = useState<LibraryPrompt["thumbnail"]["variant"]>("orbit");
  const [body, setBody] = useState("");
  const [artwork, setArtwork] = useState<string | undefined>(undefined);
  const [artBusy, setArtBusy] = useState(false);
  const artPending = useRef(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Re-submitting the same content reuses its requestId, so a retry after a slow 503
  // (the sheet may already have the row) is de-duplicated by the server.
  const createAttempt = useRef<{ payload: string; id: string } | null>(null);
  const createPending = useRef(false);

  function insertFourBlockTemplate() {
    const template = `당신은 [전공·역할] 전문가입니다.
저는 [학년·상황] 학생이고, 주제는 [주제]입니다.

요청:
- [해결하고 싶은 작업 1]
- [해결하고 싶은 작업 2]

조건:
- [원하는 출력 형식 (예: 표, 글자수, 개조식)]
- 모르는 사실이나 출처는 지어내지 말고 [확인 필요]로 표시해 주세요.`;
    setBody((prev) => (prev.trim() ? `${prev}\n\n${template}` : template));
  }

  function insertVariableChip() {
    setBody((prev) => `${prev}${prev.endsWith(" ") || !prev ? "" : " "}[바꿔 쓸 항목]`);
  }

  async function generateArtwork() {
    if (artPending.current) return;
    artPending.current = true;
    setArtBusy(true);
    setFormError("");
    try {
      const res = await fetch("/api/prompt-artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, mode: "image" }),
        signal: AbortSignal.timeout(115000),
      });
      const data = (await res.json().catch(() => ({}))) as { artwork?: string; error?: string };
      if (!res.ok || !data.artwork) throw new Error(data.error || "이미지를 만들지 못했어요.");
      setArtwork(data.artwork);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "이미지를 만들지 못했어요.");
    } finally {
      artPending.current = false;
      setArtBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (createPending.current) return;
    setFormError("");
    if (title.trim().length < 2) {
      setFormError("제목을 2자 이상 입력해 주세요.");
      return;
    }
    if (body.trim().length < 10) {
      setFormError("프롬프트 본문을 10자 이상 입력해 주세요.");
      return;
    }

    const fields = {
      action: "create",
      title,
      description,
      author: author.trim() || "익명 학우",
      category,
      variant,
      artwork,
      body,
    };
    const payload = JSON.stringify(fields);
    if (createAttempt.current?.payload !== payload) {
      createAttempt.current = { payload, id: crypto.randomUUID() };
    }

    createPending.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, requestId: createAttempt.current.id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        prompt?: PlaygroundPrompt;
        error?: string;
      };
      if (!res.ok || !data.prompt) {
        setFormError(data.error || "등록 중 오류가 발생했습니다.");
        return;
      }
      createAttempt.current = null;
      onCreated(data.prompt);
    } catch {
      setFormError("네트워크 오류가 발생했습니다.");
    } finally {
      createPending.current = false;
      setSubmitting(false);
    }
  }

  const previewPrompt: LibraryPrompt = {
    id: "preview",
    title: title || "내 프롬프트 제목",
    description: description || "설명 미리보기",
    body: body || "",
    steps: [],
    category,
    kind: "prompt",
    thumbnail: { variant, src: artwork },
    copyCount: 0,
  };

  return (
    <form className="playground-composer" onSubmit={handleSubmit}>
      <div className="composer-head">
        <div>
          <h3>나만의 AI 프롬프트 만들고 등록</h3>
          <p>주제만 입력하면 AI가 프롬프트를 초안해 주고, 저장소에 바로 등록됩니다.</p>
        </div>
        <button type="button" className="composer-close" onClick={onClose} aria-label="작성창 닫기">
          ✕
        </button>
      </div>

      <PromptDraftAssistant
        onApply={(d) => {
          setTitle(d.title);
          setDescription(d.description);
          setCategory(d.category);
          setBody(d.body);
          setFormError("");
        }}
      />

      <div className="composer-grid">
        <div className="composer-fields">
          <div className="composer-row">
            <label className="composer-field">
              <span>프롬프트 제목 *</span>
              <input
                type="text"
                placeholder="예: 영문 논문 3줄 요약 + 예상 질문 뽑기"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
              />
            </label>
            <label className="composer-field composer-field-sm">
              <span>작성자 (학번/닉네임)</span>
              <input
                type="text"
                placeholder="예: 경영 23"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={20}
              />
            </label>
          </div>

          <div className="composer-row">
            <label className="composer-field">
              <span>한 줄 설명</span>
              <input
                type="text"
                placeholder="어떤 상황에서 쓰면 좋은 프롬프트인지 짧게 소개해 주세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={140}
              />
            </label>
            <label className="composer-field composer-field-sm">
              <span>카테고리</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="composer-field">
            <div className="composer-label-bar">
              <span>프롬프트 본문 *</span>
              <div className="composer-helpers">
                <button type="button" onClick={insertFourBlockTemplate}>
                  ＋ 4블록 뼈대 넣기
                </button>
                <button type="button" onClick={insertVariableChip}>
                  ＋ [변수] 넣기
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              placeholder="당신은 ... 입니다. [주제]에 대해 ... 해 주세요."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>

        <div className="composer-preview-col">
          <span className="composer-preview-label">카드 커버 만들기</span>
          <p className="artwork-help">제목과 본문을 바탕으로 AI가 이미지를 만들어요.</p>
          <button
            type="button"
            className="artwork-generate"
            disabled={artBusy || submitting || !title.trim() || body.trim().length < 10}
            onClick={generateArtwork}
          >
            {artBusy ? "AI가 커버를 만들고 있어요…" : `AI 이미지 ${artwork ? "다시 만들기" : "만들기"}`}
          </button>
          <div className="composer-preview-card">
            <LibraryVisual prompt={previewPrompt} />
          </div>
          <div className="composer-variant-grid" role="group" aria-label="기본 스타일">
            {VISUAL_VARIANTS.map((v) => (
              <button
                type="button"
                key={v.id}
                aria-pressed={!artwork && variant === v.id}
                disabled={artBusy || submitting}
                onClick={() => {
                  setVariant(v.id);
                  setArtwork(undefined);
                  setFormError("");
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {formError && <p className="composer-error">{formError}</p>}

      <div className="composer-footer">
        <span className="composer-hint">
          팁: <code>[주제]</code>처럼 대괄호를 넣으면 저장소에서 파란 입력 항목으로 표시됩니다.
        </span>
        <button type="submit" className="composer-submit" disabled={submitting}>
          {submitting ? "저장소에 등록 중..." : "저장소에 등록하기 ↗"}
        </button>
      </div>
    </form>
  );
}

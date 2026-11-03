"use client";

import PromptDraftAssistant from "./PromptDraftAssistant";
import { Fragment, useEffect, useRef, useState } from "react";
import { CATEGORIES, type Category, type LibraryPrompt } from "@/lib/prompt-library";
import {
  SEED_PLAYGROUND_PROMPTS,
  VISUAL_VARIANTS,
  extractVariables,
  type PlaygroundPrompt,
} from "@/lib/playground";
import { LibraryVisual } from "./LibraryVisual";

let cachedPrompts: PlaygroundPrompt[] | null = null;
let pendingPrompts: Promise<{ prompts?: PlaygroundPrompt[] }> | null = null;

export function preloadPlayground() {
  if (!pendingPrompts) {
    pendingPrompts = fetch("/api/playground")
      .then((res) => { if (!res.ok) throw new Error("목록 로딩 실패"); return res.json(); })
      .then((data: { prompts?: PlaygroundPrompt[] }) => {
        if (Array.isArray(data.prompts)) {
          cachedPrompts = data.prompts;
          try { sessionStorage.setItem("playground-list", JSON.stringify(data.prompts)); } catch {}
        }
        return data;
      })
      .finally(() => { pendingPrompts = null; });
  }
  return pendingPrompts;
}

const LOCAL_CUSTOM_KEY = "gsa-playground-custom:v1";
const LOCAL_OWNED_KEY = "gsa-playground-owned:v1";
const LOCAL_LIKED_KEY = "gsa-playground-liked:v1";

function toLibraryPrompt(item: PlaygroundPrompt): LibraryPrompt {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    body: item.body,
    steps: [],
    category: item.category,
    kind: "prompt",
    thumbnail: { variant: item.variant, src: item.artwork },
    copyCount: item.copies,
  };
}

export function PlaygroundSection({ query }: { query: string }) {
  const [items, setItems] = useState<PlaygroundPrompt[]>(cachedPrompts ?? SEED_PLAYGROUND_PROMPTS);
  const [filterCat, setFilterCat] = useState<string>("전체");
  const [sortBy, setSortBy] = useState<"popular" | "latest">("popular");
  const [showComposer, setShowComposer] = useState(false);
  const [activeItem, setActiveItem] = useState<PlaygroundPrompt | null>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  // Composer form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<Category>("릴스·카드뉴스");
  const [variant, setVariant] = useState<LibraryPrompt["thumbnail"]["variant"]>("orbit");
  const [body, setBody] = useState("");
  const [artwork, setArtwork] = useState<string>();
  const [artBusy, setArtBusy] = useState(false);
  const artPending = useRef(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const owned = JSON.parse(localStorage.getItem(LOCAL_OWNED_KEY) || "[]");
      if (Array.isArray(owned)) setOwnedIds(owned);
      const liked = JSON.parse(localStorage.getItem(LOCAL_LIKED_KEY) || "[]");
      if (Array.isArray(liked)) setLikedIds(liked);
    } catch {
      // ignore storage errors
    }

    try {
      const cached = JSON.parse(sessionStorage.getItem("playground-list") || "null");
      if (Array.isArray(cached)) setItems(cached);
    } catch {}
    preloadPlayground()
      .then((data: { prompts?: PlaygroundPrompt[] }) => {
        if (Array.isArray(data.prompts) && data.prompts.length > 0) {
          // Merge with any locally saved custom prompts not yet on server
          try {
            const localCustom: PlaygroundPrompt[] = JSON.parse(
              localStorage.getItem(LOCAL_CUSTOM_KEY) || "[]"
            );
            const serverIds = new Set(data.prompts.map((p) => p.id));
            const merged = [
              ...localCustom.filter((p) => !serverIds.has(p.id)),
              ...data.prompts,
            ];
            setItems(merged);
          } catch {
            setItems(data.prompts);
          }
        }
      })
      .catch(() => {
        // Fallback to seed + localStorage
        try {
          const localCustom: PlaygroundPrompt[] = JSON.parse(
            localStorage.getItem(LOCAL_CUSTOM_KEY) || "[]"
          );
          if (localCustom.length > 0) {
            setItems([...localCustom, ...SEED_PLAYGROUND_PROMPTS]);
          }
        } catch {
          // ignore
        }
      });
  }, []);

  function openRunner(item: PlaygroundPrompt) {
    setActiveItem(item);
    setVarValues({});
    setCopiedId(null);
  }

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
    artPending.current = true; setArtBusy(true); setFormError("");
    try {
      const r = await fetch("/api/prompt-artwork", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body }), signal: AbortSignal.timeout(115000) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setArtwork(data.artwork);
    } catch(e) { setFormError(e instanceof Error ? e.message : "이미지를 만들지 못했어요."); }
    finally { artPending.current = false; setArtBusy(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (title.trim().length < 2) {
      setFormError("제목을 2자 이상 입력해 주세요.");
      return;
    }
    if (body.trim().length < 10) {
      setFormError("프롬프트 본문을 10자 이상 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title,
          description,
          author: author.trim() || "익명 학우",
          category,
          variant,
          artwork,
          body,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; prompt?: PlaygroundPrompt; error?: string };
      if (!res.ok || !data.prompt) {
        setFormError(data.error || "등록 중 오류가 발생했습니다.");
        setSubmitting(false);
        return;
      }

      const created = data.prompt;
      setItems((prev) => [created, ...prev]);

      // Save to localStorage for persistence
      try {
        const localCustom: PlaygroundPrompt[] = JSON.parse(
          localStorage.getItem(LOCAL_CUSTOM_KEY) || "[]"
        );
        localStorage.setItem(LOCAL_CUSTOM_KEY, JSON.stringify([created, ...localCustom]));
        const nextOwned = [created.id, ...ownedIds];
        setOwnedIds(nextOwned);
        localStorage.setItem(LOCAL_OWNED_KEY, JSON.stringify(nextOwned));
      } catch {
        // ignore
      }

      setArtwork(undefined);
      setTitle("");
      setDescription("");
      setBody("");
      setShowComposer(false);
      setActiveItem(created);
      setVarValues({});
    } catch {
      setFormError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(item: PlaygroundPrompt, e: React.MouseEvent) {
    e.stopPropagation();
    if (likedIds.includes(item.id)) return;
    const nextLiked = [...likedIds, item.id];
    setLikedIds(nextLiked);
    try {
      localStorage.setItem(LOCAL_LIKED_KEY, JSON.stringify(nextLiked));
    } catch {
      // ignore
    }
    setItems((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, likes: p.likes + 1 } : p))
    );
    if (activeItem?.id === item.id) {
      setActiveItem((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null));
    }
    fetch("/api/playground", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", id: item.id }),
    }).catch(() => {});
  }

  async function handleDelete(item: PlaygroundPrompt) {
    setItems((prev) => prev.filter((p) => p.id !== item.id));
    setActiveItem(null);
    try {
      const localCustom: PlaygroundPrompt[] = JSON.parse(
        localStorage.getItem(LOCAL_CUSTOM_KEY) || "[]"
      );
      localStorage.setItem(
        LOCAL_CUSTOM_KEY,
        JSON.stringify(localCustom.filter((p) => p.id !== item.id))
      );
    } catch {
      // ignore
    }
    fetch("/api/playground", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: item.id }),
    }).catch(() => {});
  }

  function buildFilledBody(item: PlaygroundPrompt): string {
    let out = item.body;
    for (const [k, v] of Object.entries(varValues)) {
      if (v.trim()) {
        out = out.split(`[${k}]`).join(v.trim());
      }
    }
    return out;
  }

  async function handleCopyPrompt(item: PlaygroundPrompt) {
    const textToCopy = buildFilledBody(item);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((prev) => (prev === item.id ? null : prev)), 3000);
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, copies: p.copies + 1 } : p))
      );
      if (activeItem?.id === item.id) {
        setActiveItem((prev) => (prev ? { ...prev, copies: prev.copies + 1 } : null));
      }
      fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "copy", id: item.id }),
      }).catch(() => {});
    } catch {
      // ignore clipboard errors
    }
  }

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = items
    .filter((item) => {
      const hay = `${item.title} ${item.description} ${item.category} ${item.author} ${item.body}`.toLowerCase();
      return (
        hay.includes(trimmedQuery) &&
        (filterCat === "전체" || item.category === filterCat)
      );
    })
    .sort((a, b) =>
      sortBy === "popular"
        ? b.copies + b.likes * 2 - (a.copies + a.likes * 2)
        : b.createdAt.localeCompare(a.createdAt)
    );

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

  const activeVars = activeItem ? extractVariables(activeItem.body) : [];

  return (
    <section className="playground-section">
      {/* Top Filter & Share CTA Bar */}
      <div className="playground-toolbar">
        <div className="library-filters playground-filters" aria-label="플레이그라운드 카테고리 필터">
          {["전체", ...CATEGORIES].map((label) => (
            <button
              type="button"
              key={label}
              aria-pressed={filterCat === label}
              onClick={() => setFilterCat(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="playground-actions">
          <div className="playground-sort" role="group" aria-label="정렬 기준">
            <button
              type="button"
              aria-pressed={sortBy === "popular"}
              onClick={() => setSortBy("popular")}
            >
              인기순
            </button>
            <button
              type="button"
              aria-pressed={sortBy === "latest"}
              onClick={() => setSortBy("latest")}
            >
              최신순
            </button>
          </div>
          <button
            type="button"
            className={`playground-share-btn ${showComposer ? "is-open" : ""}`}
            onClick={() => setShowComposer((prev) => !prev)}
          >
            <span>{showComposer ? "✕ 닫기" : "＋ 내 프롬프트 공유하기·만들기"}</span>
          </button>
        </div>
      </div>

      {/* Prompt Composer Drawer */}
      {showComposer && (
        <form className="playground-composer" onSubmit={handleCreate}>
          <div className="composer-header">
            <div>
              <h3>나만의 프롬프트 공유하기·만들기</h3>
              <p>
                바꿔 쓸 부분에 <code>[수업명]</code>, <code>[주제]</code>처럼 대괄호를 넣으면 다른 학우들이 빈칸을 바로 채워 쓸 수 있어요.
              </p>
            </div>
          </div>

          <PromptDraftAssistant onApply={draft => { setTitle(draft.title); setDescription(draft.description); setBody(draft.body); setCategory(draft.category); }} />
          <div className="composer-grid">
            <div className="composer-fields">
              <div className="composer-row">
                <label className="composer-field">
                  <span>제목 *</span>
                  <input
                    type="text"
                    placeholder="예: 교수님 성적 문의 메일 10초 완성"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={60}
                  />
                </label>
                <label className="composer-field composer-field-sm">
                  <span>작성자 (선택)</span>
                  <input
                    type="text"
                    placeholder="익명 학우 (예: 컴공 23)"
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

            {/* Live Card Artwork Picker */}
            <div className="composer-preview-col">
              <span className="composer-preview-label">프롬프트에 맞는 AI 아트워크</span>
              <button type="button" className="artwork-generate" disabled={artBusy || submitting || !title.trim() || body.trim().length < 10} onClick={generateArtwork}>{artBusy ? "AI가 아트워크를 그리고 있어요…" : artwork ? "✦ AI 아트워크 다시 만들기" : "✦ 내용에 맞춰 AI 아트워크 만들기"}</button>
              <p className="artwork-help">제목과 본문을 작성한 뒤 생성하세요. 내용 수정 후 다시 만들 수 있어요.</p>
              {artwork && <button type="button" onClick={() => setArtwork(undefined)}>기본 아트워크로 돌아가기</button>}
              <div className="composer-preview-card">
                <LibraryVisual prompt={previewPrompt} />
              </div>
              <div className="composer-variant-grid">
                {VISUAL_VARIANTS.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    aria-pressed={variant === v.id}
                    onClick={() => setVariant(v.id)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {formError && <p className="composer-error">{formError}</p>}

          <div className="composer-footer">
            <button
              type="button"
              className="composer-cancel"
              onClick={() => setShowComposer(false)}
            >
              취소
            </button>
            <button type="submit" className="composer-submit" disabled={submitting || artBusy}>
              {submitting ? "공유 중..." : "플레이그라운드에 올리기 ↗"}
            </button>
          </div>
        </form>
      )}

      {/* Interactive Playground Runner Modal */}
      {activeItem && (
        <div
          className="playground-runner-backdrop"
          onClick={() => setActiveItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeItem.title} 실행기`}
        >
          <div className="playground-runner" onClick={(e) => e.stopPropagation()}>
            <div className="runner-top">
              <div>
                <span className="runner-eyebrow">
                  {activeItem.category} · @{activeItem.author} · {activeItem.createdAt}
                </span>
                <h3>{activeItem.title}</h3>
                <p>{activeItem.description}</p>
              </div>
              <button
                type="button"
                className="runner-close"
                onClick={() => setActiveItem(null)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            {activeVars.length > 0 && (
              <div className="runner-vars">
                <span className="runner-vars-title">
                  내 상황에 맞게 빈칸 채우기 <span>(입력하면 아래 프롬프트에 바로 반영돼요)</span>
                </span>
                <div className="runner-vars-grid">
                  {activeVars.map((v) => (
                    <label key={v} className="runner-var-input">
                      <span>[{v}]</span>
                      <input
                        type="text"
                        placeholder={`${v} 입력...`}
                        value={varValues[v] ?? ""}
                        onChange={(e) =>
                          setVarValues((prev) => ({ ...prev, [v]: e.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="runner-prompt-box">
              <div className="runner-prompt-meta">
                <span>실시간 프롬프트 미리보기</span>
                <div className="runner-stats">
                  <button
                    type="button"
                    className={`runner-like-btn ${likedIds.includes(activeItem.id) ? "is-liked" : ""}`}
                    onClick={(e) => handleLike(activeItem, e)}
                  >
                    ♥ 추천 {activeItem.likes}
                  </button>
                  <span>⧉ {activeItem.copies}회 복사</span>
                  {ownedIds.includes(activeItem.id) && (
                    <button
                      type="button"
                      className="runner-delete-btn"
                      onClick={() => handleDelete(activeItem)}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <pre className="library-prompt-text">
                {activeItem.body.split(/(\[[^[\]\n]{1,24}\])/g).map((part, idx) => {
                  if (part.startsWith("[") && part.endsWith("]")) {
                    const key = part.slice(1, -1).trim();
                    const filled = varValues[key]?.trim();
                    return (
                      <mark key={idx} className={`prompt-var ${filled ? "is-filled" : ""}`}>
                        {filled || part}
                      </mark>
                    );
                  }
                  return <Fragment key={idx}>{part}</Fragment>;
                })}
              </pre>
            </div>

            <div className="library-primary-cta runner-cta">
              <button
                type="button"
                className={`runner-copy-btn ${copiedId === activeItem.id ? "is-done" : ""}`}
                onClick={() => handleCopyPrompt(activeItem)}
              >
                {copiedId === activeItem.id ? "복사 완료! ✓" : "완성된 프롬프트 복사하기 ⧉"}
              </button>
              <a
                href={`https://gemini.google.com/app?q=${encodeURIComponent(buildFilledBody(activeItem))}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`open-gemini-btn ${copiedId === activeItem.id ? "is-ready" : ""}`}
                onClick={() => handleCopyPrompt(activeItem)}
              >
                자동 복사 후 Gemini 열기 <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Section Heading */}
      <div className="library-section-heading">
        <h2>학우들이 직접 만들고 공유한 프롬프트</h2>
        <span aria-live="polite">{filtered.length}개의 공유 프롬프트</span>
      </div>

      {/* Cards Grid */}
      {filtered.length > 0 ? (
        <div className="library-grid">
          {filtered.map((item) => {
            const vars = extractVariables(item.body);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className="library-card playground-card"
                onClick={() => openRunner(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openRunner(item);
                  }
                }}
              >
                <div className="playground-visual-wrap">
                  <LibraryVisual prompt={toLibraryPrompt(item)} />
                  <span className="playground-author-badge">@{item.author}</span>
                </div>
                <div className="library-card-info">
                  <h3>{item.title}</h3>
                  <p className="library-card-desc">{item.description}</p>
                  {vars.length > 0 && (
                    <div className="playground-var-pills" aria-label="입력 가능한 변수">
                      {vars.slice(0, 3).map((v) => (
                        <span key={v} className="playground-var-pill">
                          [{v}]
                        </span>
                      ))}
                      {vars.length > 3 && (
                        <span className="playground-var-pill">+{vars.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="library-card-meta playground-card-meta">
                    <span className="meta-category">{item.category}</span>
                    <div className="playground-meta-right">
                      <button
                        type="button"
                        className={`card-like-chip ${likedIds.includes(item.id) ? "is-liked" : ""}`}
                        onClick={(e) => handleLike(item, e)}
                        aria-label={`추천 ${item.likes}`}
                      >
                        ♥ {item.likes}
                      </button>
                      <span>⧉ {item.copies}회</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="library-empty">
          <span className="empty-orbs" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <h3>조건에 맞는 공유 프롬프트가 없어요</h3>
          <p>첫 번째로 나만의 프롬프트를 만들어 학우들과 공유해 보세요!</p>
          <button
            type="button"
            className="playground-share-btn"
            onClick={() => setShowComposer(true)}
          >
            ＋ 내 프롬프트 공유하기·만들기
          </button>
        </div>
      )}
    </section>
  );
}

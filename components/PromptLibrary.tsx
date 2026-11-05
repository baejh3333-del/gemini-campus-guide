"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LIBRARY_FILTERS, matchesLibraryFilters, type LibraryPrompt } from "@/lib/prompt-library";
import { searchLibrary } from "@/lib/library-search";
import { LibraryVisual } from "./LibraryVisual";
import { LibraryHeader, LibraryFooter, BenefitStrip } from "./LibraryChrome";
import { PlaygroundSection, preloadPlayground } from "./PlaygroundSection";
import { CapsuleMachineSection } from "./CapsuleMachineSection";
import { SkillGuideModal } from "./SkillGuideModal";
import { LoadingOrb } from "./LoadingOrb";

const TABS = [
  { id: "posts", label: "프롬프트 저장소" },
  { id: "playground", label: "플레이그라운드" },
  { id: "capsule", label: "프롬프트 캡슐" },
  { id: "ranking", label: "랭킹" },
  { id: "more", label: "기타" },
];
const TOOLS = [
  { href: "/learn", n: "01", title: "15분 Gemini 실습", text: "짧은 실습으로 익히는 나의 첫 AI 활용법", label: "챌린지 홈 열기" },
  { href: "/tools/prompt-builder", n: "02", title: "프롬프트 빌더", text: "역할·맥락·작업·형식으로 내 상황에 딱 맞게", label: "만들러 가기" },
];

const HERO_TYPING_STEPS: { text: string; dot?: boolean; wait: number }[] = [
  { text: "", wait: 1900 },
  { text: "", wait: 260 },
  { text: "ㅍ", wait: 70 },
  { text: "프", wait: 80 },
  { text: "프ㄹ", wait: 60 },
  { text: "프로", wait: 70 },
  { text: "프롬", wait: 90 },
  { text: "프롬ㅍ", wait: 65 },
  { text: "프롬프", wait: 80 },
  { text: "프롬프트", wait: 105 },
  { text: "프롬프트 ", wait: 120 },
  { text: "프롬프트 ㅈ", wait: 70 },
  { text: "프롬프트 저", wait: 80 },
  { text: "프롬프트 저장", wait: 90 },
  { text: "프롬프트 저장ㅅ", wait: 65 },
  { text: "프롬프트 저장소", wait: 180 },
  { text: "프롬프트 저장소", dot: true, wait: 0 },
];

export function PromptLibrary({ prompts }: { prompts: LibraryPrompt[] }) {
  const params = useSearchParams();
  const rawTab = params.get("tab");
  const normalizedTab = rawTab === "categories" ? "posts" : rawTab;
  const paramTab = TABS.some((item) => item.id === normalizedTab) ? normalizedTab! : "posts";
  const paramQuery = params.get("q") ?? "";
  const paramCategory = (params.get("category") ?? "").split(",").filter((value) => LIBRARY_FILTERS.includes(value as (typeof LIBRARY_FILTERS)[number])).join(",");

  const [tab, setTab] = useState(paramTab);
  const [query, setQuery] = useState(paramQuery);
  const [category, setCategory] = useState(paramCategory);
  const selectedCategories = category ? category.split(",") : [];
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [period, setPeriod] = useState("오늘");
  const [typingIndex, setTypingIndex] = useState(0);
  const [guideModalPrompt, setGuideModalPrompt] = useState<LibraryPrompt | null>(null);
  const [guideBannerOpen, setGuideBannerOpen] = useState(false);

  useEffect(() => { void preloadPlayground().catch(() => {}); }, []);

  const navRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const introInitialized = useRef(false);

  useLayoutEffect(() => {
    if (!introInitialized.current) {
      introInitialized.current = true;
      const introKey = "prompt-library-intro-seen";
      if (window.sessionStorage.getItem(introKey)) {
        setTypingIndex(1);
      } else {
        window.sessionStorage.setItem(introKey, "true");
      }
    }

    const replayTypingOnRestore = (event: PageTransitionEvent) => {
      if (event.persisted) setTypingIndex(1);
    };
    window.addEventListener("pageshow", replayTypingOnRestore);
    return () => window.removeEventListener("pageshow", replayTypingOnRestore);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypingIndex(HERO_TYPING_STEPS.length - 1);
      return;
    }
    if (typingIndex >= HERO_TYPING_STEPS.length - 1) return;
    const skipIntro = () => setTypingIndex(HERO_TYPING_STEPS.length - 1);
    const blockClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("click", blockClick, true);
    window.addEventListener("dblclick", skipIntro);
    const timer = window.setTimeout(() => {
      setTypingIndex((prev) => Math.min(prev + 1, HERO_TYPING_STEPS.length - 1));
    }, HERO_TYPING_STEPS[typingIndex].wait);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("click", blockClick, true);
      window.removeEventListener("dblclick", skipIntro);
    };
  }, [typingIndex]);

  useEffect(() => {
    setTab(paramTab);
    setQuery(paramQuery);
    setCategory(paramCategory);
  }, [paramTab, paramQuery, paramCategory]);

  // The tab spotlight glides behind the pills; it is measured from the active tab, so it also follows resizes.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const updateScrollHints = () => {
      const maxScroll = nav.scrollWidth - nav.clientWidth;
      if (maxScroll <= 4) {
        nav.removeAttribute("data-fade-left");
        nav.removeAttribute("data-fade-right");
      } else {
        if (nav.scrollLeft > 8) nav.setAttribute("data-fade-left", "");
        else nav.removeAttribute("data-fade-left");
        if (nav.scrollLeft < maxScroll - 8) nav.setAttribute("data-fade-right", "");
        else nav.removeAttribute("data-fade-right");
      }

      // Brighten items that are within the visible horizontal scroll viewport, dim items peeking at the corner
      const navRect = nav.getBoundingClientRect();
      const links = nav.querySelectorAll<HTMLElement>("a");
      links.forEach((link) => {
        if (maxScroll <= 4) {
          link.removeAttribute("data-edge-dim");
          return;
        }
        const r = link.getBoundingClientRect();
        const visibleLeft = Math.max(r.left, navRect.left);
        const visibleRight = Math.min(r.right, navRect.right);
        const visibleRatio = Math.max(0, visibleRight - visibleLeft) / Math.max(1, r.width);
        if (visibleRatio < 0.78 && !link.hasAttribute("aria-current")) {
          link.setAttribute("data-edge-dim", "");
        } else {
          link.removeAttribute("data-edge-dim");
        }
      });
    };

    const place = () => {
      const active = nav.querySelector<HTMLElement>("[aria-current]");
      if (!active) return;
      nav.style.setProperty("--spot-x", `${active.offsetLeft}px`);
      nav.style.setProperty("--spot-y", `${active.offsetTop}px`);
      nav.style.setProperty("--spot-w", `${active.offsetWidth}px`);
      nav.style.setProperty("--spot-h", `${active.offsetHeight}px`);
      updateScrollHints();
    };
    place();
    const activeEl = nav.querySelector<HTMLElement>("[aria-current]");
    if (activeEl && nav.scrollWidth > nav.clientWidth + 4) {
      const targetLeft = activeEl.offsetLeft - (nav.clientWidth - activeEl.offsetWidth) / 2;
      nav.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
    }
    const frame = requestAnimationFrame(() => {
      nav.setAttribute("data-ready", "");
      updateScrollHints();
    });
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    nav.addEventListener("scroll", updateScrollHints, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      nav.removeEventListener("scroll", updateScrollHints);
    };
  }, [tab]);

  function syncUrl(values: Record<string, string>) {
    const next = new URLSearchParams(window.location.search);
    Object.entries(values).forEach(([key, value]) =>
      value && value !== "전체" ? next.set(key, value) : next.delete(key)
    );
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    syncUrl({ q: value });
  }

  function handleFilterSelect(label: string) {
    if (tab === "ranking") {
      setPeriod(label);
    } else {
      const next = label === "전체" ? [] : selectedCategories.includes(label)
        ? selectedCategories.filter((value) => value !== label)
        : [...selectedCategories, label];
      setCategory(next.join(","));
      syncUrl({ category: next.join(",") });
    }
  }

  function resetAll() {
    setTab("posts");
    setQuery("");
    setCategory("");
    setTypingIndex(1);
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadSkillDirect(prompt: LibraryPrompt) {
    const blob = new Blob([prompt.body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SKILL.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const currentTyping = HERO_TYPING_STEPS[typingIndex];

  const trimmedQuery = query.trim().toLowerCase();

  const result = searchLibrary(
    tab === "posts" ? prompts.filter((prompt) => matchesLibraryFilters(prompt, selectedCategories)) : prompts,
    trimmedQuery,
    (prompt) => `${prompt.description} ${prompt.category} ${prompt.skillName ?? ""} ${prompt.source ? `${prompt.source.kind} #${prompt.source.number}` : ""}`,
  );

  const matchedTools = searchLibrary(TOOLS, trimmedQuery, (item) => item.text);

  const currentSearch = new URLSearchParams();
  if (tab !== "posts") currentSearch.set("tab", tab);
  if (query) currentSearch.set("q", query);
  if (!!category) currentSearch.set("category", category);
  const returnTo = currentSearch.toString() ? `/?${currentSearch.toString()}` : "/";

  return (
    <main className={`library-page ${typingIndex === 0 ? "is-powering-on" : currentTyping.dot ? "is-lit" : "is-typing"}`}>
      {typingIndex === 0 && <LoadingOrb />}
      <LibraryHeader onHomeClick={resetAll} />
      <section className="library-intro">
        <div className="hero-aurora-stage" aria-hidden="true">
          <span className="aurora-orb aurora-orb-1" />
          <span className="aurora-orb aurora-orb-2" />
          <span className="aurora-orb aurora-orb-3" />
          <span className="hero-light-beam" />
        </div>
        <h1 className="hero-enter hero-enter-1 hero-typing-title" aria-label="프롬프트 저장소.">
          <span className="typing-text" aria-hidden="true">
            {currentTyping.text}
          </span>
          <span
            className={`typing-morph-cursor ${currentTyping.dot ? "is-dot" : ""}`}
            aria-hidden="true"
          />
        </h1>
        <p>발견하고, 복사하고, 내 Gemini에서 시작하세요.</p>
      </section>

      <div className="library-sheet" ref={sheetRef}>
        <nav className="library-tabs" aria-label="저장소 탐색" data-tab={tab} ref={navRef}>
          <span className="tab-spot" aria-hidden="true" />
          {TABS.map((item) => (
            <Link
              key={item.id}
              href={query ? `/?tab=${item.id}&q=${encodeURIComponent(query)}` : `/?tab=${item.id}`}
              scroll={false}
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <label className="library-search">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <div className="search-input-stage">
            <div className="search-mirror" aria-hidden="true">
              {query ? (
                <>
                  <span className="search-mirror-text">{query}</span>
                  <span className="search-gradient-caret is-active" />
                </>
              ) : (
                <>
                  <span className="search-gradient-caret" />
                  <span className="search-mirror-placeholder">제목, 키워드, GitHub Skill 이름으로 찾아보세요</span>
                </>
              )}
            </div>
            <input
              aria-label="프롬프트 검색"
              type="search"
              placeholder="제목, 키워드, GitHub Skill 이름으로 찾아보세요"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
            />
          </div>
          {query && (
            <button type="button" onClick={() => handleQueryChange("")} aria-label="검색어 지우기">
              ×
            </button>
          )}
        </label>

        {tab === "playground" ? (
          <PlaygroundSection query={query} />
        ) : tab === "capsule" ? (
          <CapsuleMachineSection />
        ) : tab === "more" ? (
          <section className="library-tools">
            <div className="library-section-heading">
              <h2>배우고, 직접 만들어 보세요</h2>
              <span>{matchedTools.length}개의 도구</span>
            </div>
            {matchedTools.map((item) => (
              <Link className="library-tool" key={item.href} href={item.href}>
                <span className="tool-number">{item.n}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <span className="tool-action">{item.label} ↗</span>
                </div>
                <span className="tool-hemisphere" aria-hidden="true" />
              </Link>
            ))}
            {!matchedTools.length && <EmptyState onReset={resetAll} />}
          </section>
        ) : (
          <>
            {tab !== "ranking" && (
              <button type="button" className="mobile-filter-toggle" aria-expanded={filtersOpen} aria-controls="library-category-filters" onClick={() => setFiltersOpen(!filtersOpen)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M3 4h18l-7 8v7l-4 2v-9z" /></svg>
                필터 검색{!!category && <span className="mobile-filter-dot" aria-label="필터 적용 중" />}
              </button>
            )}
            <div
              id="library-category-filters"
              className={`library-filters ${tab === "ranking" ? "is-period-filters" : "is-category-filters"} ${filtersOpen ? "is-expanded" : ""}`}
              aria-label={tab === "ranking" ? "집계 기간" : "카테고리 필터"}
            >
              {(tab === "ranking" ? ["오늘", "이번 주", "이번 달"] : ["전체", ...LIBRARY_FILTERS]).map((label) => (
                <button
                  type="button"
                  key={label}
                  aria-pressed={tab === "ranking" ? period === label : label === "전체" ? !selectedCategories.length : selectedCategories.includes(label)}
                  onClick={() => handleFilterSelect(label)}
                >
                  <span className="filter-label-full">{label}</span>
                  <span className="filter-label-mobile">{label.replace(/\s*\([^)]*\)/g, "")}</span>
                </button>
              ))}
            </div>

            <div className="library-section-heading">
              <h2>
                {tab === "ranking" && !trimmedQuery
                  ? `${period} 인기 TOP 5`
                  : !!category
                    ? selectedCategories.map((value) => value.replace(/\s*\([^)]*\)/g, "")).join(" · ")
                    : "릴스·카드뉴스 & GitHub 인기 Skill"}
              </h2>
              {(tab !== "ranking" || trimmedQuery) && <span aria-live="polite">{result.length}개의 프롬프트·스킬</span>}
            </div>
            {tab === "ranking" && !trimmedQuery ? (
              <div className="library-empty">
                <span className="empty-orbs" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <h3>인기 프롬프트를 기다리고 있어요</h3>
                <p>복사 집계가 연결되면 {period} 많이 사용된 프롬프트를 보여드릴게요.</p>
                <Link href="/?tab=posts" scroll={false} onClick={() => setTab("posts")}>
                  프롬프트 둘러보기 →
                </Link>
              </div>
            ) : result.length ? (
              <div className="library-grid" key={`${tab}-${category}`}>
                {result.map((prompt) => (
                  <div className="library-card-wrapper" key={prompt.id}>
                    <Link
                      className="library-card"
                      href={`/prompts/${prompt.id}?from=${encodeURIComponent(returnTo)}`}
                    >
                      <LibraryVisual prompt={prompt} />
                      <div className="library-card-info">
                        <div className="library-card-badges">
                          <span className={`kind-badge is-${prompt.kind}`}>
                            {prompt.kind === "skill"
                              ? `SKILL.md · ${prompt.skillName}`
                              : prompt.kind === "gem"
                                ? "Gem 템플릿"
                                : "프롬프트"}
                          </span>
                        </div>
                        <h3>{prompt.title}</h3>
                        <p className="library-card-desc">{prompt.description}</p>
                        <p className="library-card-meta">
                          <span className="meta-category">{prompt.category}</span>
                          <span className="meta-dot" aria-hidden="true">·</span>
                          <span className="meta-action">
                            {prompt.kind === "skill" ? "복사 / SKILL.md 받기 ↗" : "프롬프트 열기 ↗"}
                          </span>
                        </p>
                      </div>
                    </Link>
                    {prompt.kind === "skill" && (
                      <div className="card-skill-quick-actions">
                        <button
                          type="button"
                          className="card-skill-dl-btn"
                          onClick={() => downloadSkillDirect(prompt)}
                        >
                          SKILL.md 바로 다운로드 ↓
                        </button>
                        <button
                          type="button"
                          className="card-skill-guide-btn"
                          onClick={() => setGuideModalPrompt(prompt)}
                        >
                          ❓ 추가 설명서
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState onReset={resetAll} />
            )}
          </>
        )}
        <BenefitStrip />
        <LibraryFooter />
      </div>

      <SkillGuideModal
        open={guideBannerOpen || Boolean(guideModalPrompt)}
        onClose={() => {
          setGuideBannerOpen(false);
          setGuideModalPrompt(null);
        }}
        skillName={guideModalPrompt?.skillName}
        skillBody={guideModalPrompt?.body}
      />
    </main>
  );
}

function EmptyState({ posts = false, onReset }: { posts?: boolean; onReset: () => void }) {
  return (
    <div className="library-empty">
      <span className="empty-orbs" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <h3>{posts ? "게시물 프롬프트를 준비하고 있어요" : "일치하는 결과가 없어요"}</h3>
      <p>{posts ? "전체 목록에서 먼저 프롬프트를 만나보세요." : "다른 검색어나 카테고리로 찾아보세요."}</p>
      <Link href="/" scroll={false} onClick={onReset}>
        전체 프롬프트 보기 →
      </Link>
    </div>
  );
}

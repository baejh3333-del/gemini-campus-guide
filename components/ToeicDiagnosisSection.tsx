"use client";

import "@/app/toeic.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  TOEIC_QUESTIONS,
  TARGET_KEYS,
  TOEIC_TARGET_PLANS,
  DDAY_OPTIONS,
  calculateToeicDiagnosis,
  getGoalGapSummary,
  formatSecondsToMMSS,
  formatDurationKorean,
  buildDiagnosisCopyText,
  loadToeicHistory,
  saveToeicHistory,
  type TargetScoreKey,
  type DiagnosisResult,
  type DdayOption,
  type ToeicHistoryEntry,
} from "@/content/toeic-diagnosis";
import { downloadToeicShareCard, type ShareCardFormat } from "@/lib/toeic-share-card";
import { LibraryCopy } from "./LibraryCopy";
import { SignupLink } from "./SignupLink";

type Phase = "intro" | "quiz" | "analyzing" | "result";

type AiDrillPhase = "ready" | "loading" | "active" | "locked";

interface AiDrillQuestion {
  part: string;
  skillName: string;
  prompt: string;
  options: { label: "A" | "B" | "C" | "D"; text: string }[];
  correctIndex: number;
  explanation: string;
  collocationTip: string;
}

interface AiDrillData {
  focusSummary: string;
  questions: AiDrillQuestion[];
}

const AI_DRILL_STORAGE_KEY = "gsa-toeic-ai-drill-used-v1";
const PART_GROUPS = ["Part 5", "Part 6", "Part 7"] as const;

function formatShortDate(timestamp: number): string {
  const d = new Date(timestamp);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

function StudyMethodIcon({ icon }: { icon: "vocab" | "grammar" | "listening" | "time" }) {
  switch (icon) {
    case "vocab":
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case "grammar":
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "listening":
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      );
    case "time":
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export function ToeicDiagnosisSection() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(TOEIC_QUESTIONS.length).fill(null),
  );
  const [guessedFlags, setGuessedFlags] = useState<boolean[]>(() =>
    Array(TOEIC_QUESTIONS.length).fill(false),
  );
  const [elapsedSec, setElapsedSec] = useState(0);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [displayScore, setDisplayScore] = useState(400);
  const [selectedTarget, setSelectedTarget] = useState<TargetScoreKey>(800);
  const [selectedDday, setSelectedDday] = useState<DdayOption>("4w");
  const [openReviews, setOpenReviews] = useState<boolean[]>([]);
  const [history, setHistory] = useState<ToeicHistoryEntry[]>([]);
  const [savingCard, setSavingCard] = useState<ShareCardFormat | null>(null);
  const [savedCard, setSavedCard] = useState<ShareCardFormat | null>(null);
  const [drillPhase, setDrillPhase] = useState<AiDrillPhase>("ready");
  const [drillData, setDrillData] = useState<AiDrillData | null>(null);
  const [drillAnswers, setDrillAnswers] = useState<(number | null)[]>([]);
  const [drillError, setDrillError] = useState<string | null>(null);
  const [drillCopiedNote, setDrillCopiedNote] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const questionTimesMsRef = useRef<number[]>(Array(TOEIC_QUESTIONS.length).fill(0));
  const questionStartRef = useRef<number>(0);
  const quizStartRef = useRef<number>(0);
  const savedCardTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setHistory(loadToeicHistory());
    try {
      if (window.localStorage.getItem(AI_DRILL_STORAGE_KEY) === "1") {
        setDrillPhase("locked");
      }
    } catch {
      // ignore storage errors
    }
    return () => {
      if (savedCardTimerRef.current !== null) {
        window.clearTimeout(savedCardTimerRef.current);
      }
    };
  }, []);

  const scrollToSectionTop = useCallback(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Live elapsed timer during quiz
  useEffect(() => {
    if (phase !== "quiz") return;
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - quizStartRef.current) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [phase]);

  // Brief analyzing transition (~500ms) -> result
  useEffect(() => {
    if (phase !== "analyzing") return;
    const id = window.setTimeout(() => {
      setPhase("result");
      scrollToSectionTop();
    }, 520);
    return () => window.clearTimeout(id);
  }, [phase, scrollToSectionTop]);

  // Score count-up animation when entering result screen
  useEffect(() => {
    if (phase !== "result" || !diagnosis) return;
    const target = diagnosis.finalScore;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayScore(target);
      return;
    }

    const startVal = 400;
    const duration = 650;
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [phase, diagnosis]);

  const flushCurrentQuestionTime = useCallback((index: number) => {
    const now = Date.now();
    if (questionStartRef.current > 0) {
      questionTimesMsRef.current[index] += Math.max(0, now - questionStartRef.current);
    }
    questionStartRef.current = now;
  }, []);

  const finishQuizAndAnalyze = useCallback(
    (finalAnswers: (number | null)[], finalGuessed: boolean[]) => {
      const questionTimesSec = questionTimesMsRef.current.map((ms) =>
        Math.max(1, Math.round(ms / 1000)),
      );
      const result = calculateToeicDiagnosis(finalAnswers, questionTimesSec, finalGuessed);
      const updatedHistory = saveToeicHistory(result);
      setHistory(updatedHistory);
      setDiagnosis(result);
      setSelectedTarget(result.defaultTarget);
      setOpenReviews(
        result.details.map((d) => !d.isCorrect || d.isGuessed || d.isSkipped),
      );
      setPhase("analyzing");
    },
    [],
  );

  const handleStartQuiz = useCallback(() => {
    const now = Date.now();
    questionTimesMsRef.current = Array(TOEIC_QUESTIONS.length).fill(0);
    questionStartRef.current = now;
    quizStartRef.current = now;
    setAnswers(Array(TOEIC_QUESTIONS.length).fill(null));
    setGuessedFlags(Array(TOEIC_QUESTIONS.length).fill(false));
    setCurrentIndex(0);
    setElapsedSec(0);
    setDiagnosis(null);
    setSavedCard(null);
    setPhase("quiz");
    scrollToSectionTop();
  }, [scrollToSectionTop]);

  const handleSelectOption = useCallback((optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  }, [currentIndex]);

  const handleToggleGuessed = useCallback(() => {
    setGuessedFlags((prev) => {
      const next = [...prev];
      next[currentIndex] = !next[currentIndex];
      return next;
    });
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    flushCurrentQuestionTime(currentIndex);
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = -1;
    const nextGuessed = [...guessedFlags];
    nextGuessed[currentIndex] = false;
    setAnswers(nextAnswers);
    setGuessedFlags(nextGuessed);

    if (currentIndex < TOEIC_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    finishQuizAndAnalyze(nextAnswers, nextGuessed);
  }, [answers, guessedFlags, currentIndex, flushCurrentQuestionTime, finishQuizAndAnalyze]);

  const handlePrev = useCallback(() => {
    if (currentIndex === 0) return;
    flushCurrentQuestionTime(currentIndex);
    setCurrentIndex((prev) => prev - 1);
  }, [currentIndex, flushCurrentQuestionTime]);

  const handleNext = useCallback(() => {
    if (answers[currentIndex] === null) return;
    flushCurrentQuestionTime(currentIndex);

    if (currentIndex < TOEIC_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    finishQuizAndAnalyze(answers, guessedFlags);
  }, [answers, guessedFlags, currentIndex, flushCurrentQuestionTime, finishQuizAndAnalyze]);

  const handleDownloadCard = useCallback(
    async (format: ShareCardFormat) => {
      if (!diagnosis || savingCard) return;
      setSavingCard(format);
      try {
        await downloadToeicShareCard(diagnosis, format);
        setSavedCard(format);
        if (savedCardTimerRef.current !== null) {
          window.clearTimeout(savedCardTimerRef.current);
        }
        savedCardTimerRef.current = window.setTimeout(() => {
          setSavedCard(null);
          savedCardTimerRef.current = null;
        }, 2200);
      } finally {
        setSavingCard(null);
      }
    },
    [diagnosis, savingCard],
  );

  // Keyboard shortcuts during quiz: 1~4 select option, Enter goes next
  useEffect(() => {
    if (phase !== "quiz") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key >= "1" && e.key <= "4") {
        e.preventDefault();
        handleSelectOption(Number(e.key) - 1);
      } else if (e.key === "Enter" && answers[currentIndex] !== null) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, answers, currentIndex, handleSelectOption, handleNext]);

  const handleToggleReview = useCallback((index: number) => {
    setOpenReviews((prev) => prev.map((open, i) => (i === index ? !open : open)));
  }, []);

  const allReviewsOpen = openReviews.length > 0 && openReviews.every(Boolean);

  const handleToggleAllReviews = useCallback(() => {
    setOpenReviews((prev) => prev.map(() => !allReviewsOpen));
  }, [allReviewsOpen]);

  const handleRetry = useCallback(() => {
    setPhase("intro");
    setDiagnosis(null);
    setAnswers(Array(TOEIC_QUESTIONS.length).fill(null));
    setGuessedFlags(Array(TOEIC_QUESTIONS.length).fill(false));
    setCurrentIndex(0);
    setElapsedSec(0);
    setSavedCard(null);
    setDrillData(null);
    setDrillAnswers([]);
    setDrillError(null);
    setDrillCopiedNote(false);
    try {
      setDrillPhase(window.localStorage.getItem(AI_DRILL_STORAGE_KEY) === "1" ? "locked" : "ready");
    } catch {
      setDrillPhase("ready");
    }
    scrollToSectionTop();
  }, [scrollToSectionTop]);

  const currentQuestion = TOEIC_QUESTIONS[currentIndex];
  const currentAnswer = answers[currentIndex];
  const currentGuessed = guessedFlags[currentIndex] ?? false;
  const progressPercent = ((currentIndex + 1) / TOEIC_QUESTIONS.length) * 100;

  const activePlan = diagnosis ? TOEIC_TARGET_PLANS[selectedTarget] : null;
  const activeDday = DDAY_OPTIONS.find((opt) => opt.id === selectedDday) ?? DDAY_OPTIONS[0];
  const goalGap = diagnosis ? getGoalGapSummary(diagnosis.finalScore, selectedTarget) : null;
  const tutorPromptText = diagnosis
    ? buildDiagnosisCopyText(diagnosis, selectedTarget, selectedDday)
    : "";
  const gaugePercent = diagnosis
    ? Math.max(4, Math.min(100, ((diagnosis.finalScore - 400) / (990 - 400)) * 100))
    : 0;

  const latestHistory = history[0] ?? null;
  const previousHistory = history.length >= 2 ? history[1] : null;
  const recentHistory = history.slice(0, 5);

  const weakSkillList = diagnosis
    ? Array.from(
        new Set([
          ...diagnosis.details.filter((d) => !d.isCorrect).map((d) => d.question.skillName),
          ...diagnosis.details.filter((d) => d.isGuessed).map((d) => d.question.skillName),
        ]),
      )
    : [];
  const weakSummaryLabel =
    weakSkillList.length > 0 ? weakSkillList.slice(0, 2).join(" · ") : "900+ 실전 변별력";
  const targetGap = diagnosis ? selectedTarget - diagnosis.finalScore : 0;

  const handleGenerateAiDrill = useCallback(async () => {
    if (!diagnosis || drillPhase === "loading") return;
    setDrillPhase("loading");
    setDrillError(null);

    const wrongTopics = diagnosis.details
      .filter((d) => !d.isCorrect)
      .map((d) => `${d.question.part} · ${d.question.skillName}`);
    const guessedTopics = diagnosis.details
      .filter((d) => d.isGuessed)
      .map((d) => `${d.question.part} · ${d.question.skillName}`);

    try {
      const res = await fetch("/api/toeic-drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalScore: diagnosis.finalScore,
          targetScore: selectedTarget,
          weakSkills: weakSkillList.length > 0 ? weakSkillList : ["900+ 실전 변별력"],
          wrongTopics,
          guessedTopics,
          ddayLabel: activeDday?.label,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            code?: string;
            error?: string;
            focusSummary?: string;
            questions?: AiDrillQuestion[];
          }
        | null;

      if (res.status === 429 && data?.code === "TRIAL_USED") {
        try {
          window.localStorage.setItem(AI_DRILL_STORAGE_KEY, "1");
        } catch {
          // ignore
        }
        setDrillPhase("locked");
        return;
      }

      if (!res.ok || !data?.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        setDrillError(
          data?.error ??
            "AI 문제 생성 중 일시적인 오류가 발생했어요. 아래 버튼으로 Gemini에서 바로 이어서 풀어보세요!",
        );
        setDrillPhase("ready");
        return;
      }

      try {
        window.localStorage.setItem(AI_DRILL_STORAGE_KEY, "1");
      } catch {
        // ignore
      }
      setDrillData({
        focusSummary: data.focusSummary ?? `${weakSummaryLabel} 집중 변형 3문항`,
        questions: data.questions,
      });
      setDrillAnswers(Array(data.questions.length).fill(null));
      setDrillPhase("active");
    } catch {
      setDrillError(
        "네트워크 오류로 AI 문제를 불러오지 못했어요. 아래 버튼으로 Gemini에서 바로 이어서 풀어보세요!",
      );
      setDrillPhase("ready");
    }
  }, [diagnosis, drillPhase, selectedTarget, weakSkillList, activeDday, weakSummaryLabel]);

  const handleSelectDrillOption = useCallback((qIdx: number, optIdx: number) => {
    setDrillAnswers((prev) => {
      if (prev[qIdx] !== null) return prev;
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  }, []);

  const handleCopyAndOpenGemini = useCallback(() => {
    if (!tutorPromptText) return;
    void navigator.clipboard
      ?.writeText(tutorPromptText)
      .then(() => setDrillCopiedNote(true))
      .catch(() => {});
  }, [tutorPromptText]);

  const drillAnsweredCount = drillAnswers.filter((a) => a !== null).length;
  const drillAllAnswered =
    drillData !== null && drillData.questions.length > 0 && drillAnsweredCount === drillData.questions.length;
  const drillCorrectCount =
    drillData !== null
      ? drillData.questions.reduce(
          (acc, q, idx) => acc + (drillAnswers[idx] === q.correctIndex ? 1 : 0),
          0,
        )
      : 0;

  const partSummary = diagnosis
    ? PART_GROUPS.map((part) => {
        const items = diagnosis.details.filter((d) => d.question.part === part);
        const correct = items.filter((d) => d.isCorrect).length;
        const total = items.length;
        const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { part, correct, total, rate };
      }).filter((row) => row.total > 0)
    : [];

  return (
    <section ref={sectionRef} className="toeic-section" aria-label="토익 10문제 정밀 진단">
      {/* ==================== 1. INTRO SCREEN ==================== */}
      {phase === "intro" && (
        <div className="toeic-stack">
          <div className="toeic-card toeic-card-hero">
            <div className="toeic-hero-top">
              <div className="toeic-eyebrow">
                <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                소요시간 약 3~4분 · Part 5~7 10문항 정밀 진단
              </div>

              {latestHistory && (
                <div className="toeic-intro-history-pill">
                  <span className="toeic-intro-history-dot" aria-hidden="true" />
                  최근 진단 기록: {latestHistory.finalScore}점 ({formatShortDate(latestHistory.timestamp)})
                </div>
              )}

              <h2 className="toeic-hero-title">
                10문제로 알아보는
                <br />
                <span className="toeic-hero-accent">내 예상 토익 점수</span>와 맞춤 처방
              </h2>

              <p className="toeic-hero-desc">
                기초 문법부터 어휘, 문장 구조, 문맥 논리, 실전 패러프레이징·추론 독해까지 단계별 10문항으로 현재 실력을 정밀 진단합니다.
                정답률과 풀이 속도를 함께 분석해 <strong>점수 원인 · 목표 로드맵 · 집중 파트</strong>를 바로 정리해 드려요.
              </p>

              <div className="toeic-hero-cta-wrap">
                <button type="button" className="toeic-btn-primary" onClick={handleStartQuiz}>
                  <span>진단 시작하기</span>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="toeic-feature-grid">
              <div className="toeic-feature-item">
                <div className="toeic-feature-icon toeic-feature-icon--blue">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3>점수 산출 &amp; 원인 분석</h3>
                <p>어떤 영역과 풀이 속도 때문에 현재 점수가 나왔는지 정확히 짚어드립니다.</p>
              </div>

              <div className="toeic-feature-item">
                <div className="toeic-feature-icon toeic-feature-icon--emerald">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3>목표 점수별 전략 변경</h3>
                <p>600점부터 950+까지 목표를 고르면 공부법과 RC 75분 시간 배분이 맞춤 변경됩니다.</p>
              </div>

              <div className="toeic-feature-item">
                <div className="toeic-feature-icon toeic-feature-icon--purple">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3>집중 파트 &amp; 오답 해설</h3>
                <p>가장 효율적으로 점수가 오르는 LC·RC 우선순위 파트와 10문항 상세 해설을 제공합니다.</p>
              </div>
            </div>
          </div>

          <div className="toeic-card">
            <h3 className="toeic-overview-heading">
              <span className="toeic-overview-bar" aria-hidden="true" />
              진단 문항 구성 (10문항 · 난이도 점진 상승)
            </h3>
            <div className="toeic-overview-grid">
              {TOEIC_QUESTIONS.map((q) => (
                <div key={q.id} className="toeic-overview-chip">
                  <span className="toeic-overview-q">Q{q.id}</span>
                  <span className="toeic-overview-name">{q.skillName}</span>
                  <span className="toeic-overview-meta">
                    {q.part} · {q.targetLevel.replace(/\s*검증$/, "")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. QUIZ SCREEN ==================== */}
      {phase === "quiz" && currentQuestion && (
        <div className="toeic-stack">
          <div className="toeic-card toeic-quiz-topbar">
            <div className="toeic-quiz-meta-row">
              <div className="toeic-quiz-meta-left">
                <span className="toeic-quiz-counter">
                  문제 {currentIndex + 1} / {TOEIC_QUESTIONS.length}
                </span>
                <span className="toeic-quiz-sep" aria-hidden="true">|</span>
                <span className="toeic-quiz-part">
                  {currentQuestion.part} · {currentQuestion.skillName}
                </span>
              </div>

              <div className="toeic-quiz-meta-right">
                <span className="toeic-diff-badge">{currentQuestion.difficultyLabel}</span>
                <span className="toeic-timer-pill" aria-label="경과 시간">
                  <span className="toeic-timer-dot" aria-hidden="true" />
                  {formatSecondsToMMSS(elapsedSec)}
                </span>
              </div>
            </div>

            <div className="toeic-progress-track" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={TOEIC_QUESTIONS.length}>
              <div className="toeic-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="toeic-card">
            {currentQuestion.passage && (
              <div className="toeic-passage">
                <div className="toeic-passage-header">{currentQuestion.passage.header}</div>
                <div className="toeic-passage-body">
                  {currentQuestion.passage.paragraphs.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            <p className="toeic-question-instruction">{currentQuestion.instruction}</p>
            <h3 className="toeic-question-prompt">{currentQuestion.prompt}</h3>

            <div className="toeic-options" role="radiogroup" aria-label="정답 선택지">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = currentAnswer === idx;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`toeic-option${isSelected ? " toeic-option--selected" : ""}`}
                    onClick={() => handleSelectOption(idx)}
                  >
                    <span className="toeic-option-badge">{opt.label}</span>
                    <span className="toeic-option-text">{opt.text}</span>
                    <span className="toeic-option-key" aria-hidden="true">{idx + 1}</span>
                  </button>
                );
              })}
            </div>

            <div className="toeic-quiz-helpers">
              <button
                type="button"
                className="toeic-guess-toggle"
                aria-pressed={currentGuessed}
                onClick={handleToggleGuessed}
              >
                <span>{currentGuessed ? "✓ 확신 없음 · 찍음 체크됨" : "확신 없음 · 찍음 체크"}</span>
              </button>

              <button
                type="button"
                className="toeic-skip-btn"
                onClick={handleSkip}
              >
                모르겠음 (건너뛰기) →
              </button>
            </div>

            <div className="toeic-quiz-actions">
              <button
                type="button"
                className="toeic-btn-secondary"
                disabled={currentIndex === 0}
                onClick={handlePrev}
              >
                이전 문제
              </button>

              <button
                type="button"
                className="toeic-btn-primary"
                disabled={currentAnswer === null}
                onClick={handleNext}
              >
                <span>{currentIndex === TOEIC_QUESTIONS.length - 1 ? "결과 분석하기" : "다음 문제"}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <p className="toeic-quiz-hint">
            키보드 1~4로 선택하고 Enter로 다음 문항으로 이동할 수 있습니다. 풀이 시간도 함께 분석됩니다.
          </p>
        </div>
      )}

      {/* ==================== 3. ANALYZING TRANSITION ==================== */}
      {phase === "analyzing" && (
        <div className="toeic-card toeic-analyzing" role="status" aria-live="polite">
          <div className="toeic-spinner-wrap">
            <div className="toeic-spinner" />
          </div>
          <h2>예상 토익 점수를 정밀 분석하고 있어요</h2>
          <p>문항별 난이도 가중치, 취약 파트, 풀이 속도를 종합해 맞춤 리포트를 생성 중입니다...</p>
        </div>
      )}

      {/* ==================== 4. RESULT DASHBOARD ==================== */}
      {phase === "result" && diagnosis && activePlan && goalGap && (
        <div className="toeic-stack">
          {/* 4-1. Estimated Score Card */}
          <div className="toeic-card toeic-card-hero">
            <div className="toeic-score-top">
              <div className="toeic-score-header-row">
                <span className="toeic-tier-badge">{diagnosis.tierTitle}</span>
                <span className="toeic-score-cap">990점 만점 기준 예측</span>
              </div>

              <div className="toeic-score-main-row">
                <div>
                  <p className="toeic-score-label">당신의 예상 토익 점수는</p>
                  <div className="toeic-score-value-row">
                    <span className="toeic-score-number">{displayScore}</span>
                    <span className="toeic-score-unit">점</span>
                    <span className="toeic-score-range">(±25점 오차 범위)</span>
                  </div>
                </div>

                <div className="toeic-stats-grid">
                  <div className="toeic-stat-box">
                    <p className="toeic-stat-label">정답 수</p>
                    <p className="toeic-stat-value">
                      {diagnosis.correctCount}/{TOEIC_QUESTIONS.length}
                    </p>
                  </div>
                  <div className="toeic-stat-box">
                    <p className="toeic-stat-label">총 시간</p>
                    <p className="toeic-stat-value">{formatDurationKorean(diagnosis.totalTime)}</p>
                  </div>
                  <div className="toeic-stat-box">
                    <p className="toeic-stat-label">풀이 속도</p>
                    <p className="toeic-stat-value">{diagnosis.speedLabel}</p>
                  </div>
                </div>
              </div>

              <div className="toeic-gauge-wrap">
                <div className="toeic-gauge-track">
                  <div className="toeic-gauge-fill" style={{ width: `${gaugePercent}%` }} />
                </div>
                <div className="toeic-gauge-scale">
                  <span>400</span>
                  <span>600</span>
                  <span>750</span>
                  <span>850</span>
                  <span>990</span>
                </div>
              </div>

              <div className="toeic-roast-banner">
                <span className="toeic-roast-tag">한 줄 팩폭</span>
                <p className="toeic-roast-text">{diagnosis.roastComment}</p>
              </div>

              <div className="toeic-share-row">
                <button
                  type="button"
                  className={`toeic-share-btn${savedCard === "square" ? " toeic-share-btn--done" : ""}`}
                  disabled={savingCard !== null}
                  onClick={() => handleDownloadCard("square")}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  <span>
                    {savingCard === "square"
                      ? "카드 생성 중..."
                      : savedCard === "square"
                        ? "저장 완료! (1:1)"
                        : "에타·카톡 카드 저장 (1:1)"}
                  </span>
                </button>

                <button
                  type="button"
                  className={`toeic-share-btn${savedCard === "story" ? " toeic-share-btn--done" : ""}`}
                  disabled={savingCard !== null}
                  onClick={() => handleDownloadCard("story")}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  <span>
                    {savingCard === "story"
                      ? "스토리 생성 중..."
                      : savedCard === "story"
                        ? "저장 완료! (9:16)"
                        : "인스타 스토리 저장 (9:16)"}
                  </span>
                </button>
              </div>
            </div>

            <div className="toeic-score-note">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                RC 핵심 10문항(난이도 가중치 + 풀이 속도)을 기반으로 국내 수험생 평균 LC·RC 점수 비율을 반영해 산출한 예상 총점입니다.
              </span>
            </div>
          </div>

          {/* 4-1b. Previous Diagnosis History & Growth Comparison */}
          {previousHistory && latestHistory && (
            <div className="toeic-card">
              <div className="toeic-history-header">
                <div>
                  <span className="toeic-section-kicker toeic-section-kicker--emerald">GROWTH HISTORY</span>
                  <h2 className="toeic-section-title">이전 진단 기록 &amp; 성장 비교</h2>
                </div>
                <div className="toeic-history-deltas">
                  {(() => {
                    const scoreDiff = latestHistory.finalScore - previousHistory.finalScore;
                    const timeDiff = previousHistory.totalTime - latestHistory.totalTime;
                    return (
                      <>
                        <span
                          className={`toeic-delta-badge${
                            scoreDiff > 0
                              ? " toeic-delta-badge--up"
                              : scoreDiff < 0
                                ? " toeic-delta-badge--down"
                                : ""
                          }`}
                        >
                          {scoreDiff > 0
                            ? `지난 진단 대비 +${scoreDiff}점 상승`
                            : scoreDiff < 0
                              ? `지난 진단 대비 ${scoreDiff}점`
                              : "지난 진단과 동일 점수"}
                        </span>
                        {timeDiff !== 0 && (
                          <span
                            className={`toeic-delta-badge${
                              timeDiff > 0 ? " toeic-delta-badge--up" : ""
                            }`}
                          >
                            {timeDiff > 0
                              ? `속도 ${timeDiff}초 단축`
                              : `풀이 시간 +${Math.abs(timeDiff)}초`}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="toeic-history-bars" aria-label="최근 진단 점수 기록">
                {recentHistory.map((entry, idx) => {
                  const pct = Math.max(8, Math.min(100, ((entry.finalScore - 400) / (990 - 400)) * 100));
                  const isLatest = idx === 0;
                  return (
                    <div
                      key={entry.id}
                      className={`toeic-history-row${isLatest ? " toeic-history-row--latest" : ""}`}
                    >
                      <span className="toeic-history-date">
                        {isLatest ? "방금" : formatShortDate(entry.timestamp)}
                      </span>
                      <div className="toeic-history-track">
                        <div className="toeic-history-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="toeic-history-score">{entry.finalScore}점</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4-2. Score Diagnosis */}
          <div className="toeic-card">
            <span className="toeic-section-kicker">SCORE DIAGNOSIS</span>
            <h2 className="toeic-section-title">왜 이 점수가 나왔을까요?</h2>

            {partSummary.length > 0 && (
              <div className="toeic-part-summary" aria-label="파트별 정답률 요약">
                {partSummary.map((row) => (
                  <div key={row.part} className="toeic-part-pill">
                    <div className="toeic-part-pill-top">
                      <span className="toeic-part-pill-label">{row.part}</span>
                      <span className="toeic-part-pill-score">
                        {row.correct}/{row.total}
                        <span className="toeic-part-pill-rate">({row.rate}%)</span>
                      </span>
                    </div>
                    <div className="toeic-part-pill-bar">
                      <div
                        className={`toeic-part-pill-fill${
                          row.rate >= 80
                            ? " toeic-part-pill-fill--strong"
                            : row.rate <= 50
                              ? " toeic-part-pill-fill--weak"
                              : ""
                        }`}
                        style={{ width: `${row.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="toeic-skill-grid">
              {diagnosis.details.map((detail) => (
                <div
                  key={detail.question.id}
                  className={`toeic-skill-card ${
                    detail.isCorrect ? "toeic-skill-card--correct" : "toeic-skill-card--wrong"
                  }`}
                >
                  <div className="toeic-skill-top">
                    <span>Q{detail.question.id} · {detail.question.part}</span>
                    <span
                      className={`toeic-ox-badge ${
                        detail.isCorrect ? "toeic-ox-badge--o" : "toeic-ox-badge--x"
                      }`}
                      aria-label={detail.isCorrect ? "정답" : "오답"}
                    >
                      {detail.isCorrect ? "O" : "X"}
                    </span>
                  </div>
                  <div className="toeic-skill-name">{detail.question.skillName}</div>
                  <div className="toeic-skill-time">
                    {detail.timeSpent}초
                    {detail.isSlow && <span className="toeic-skill-slow"> · 느림</span>}
                  </div>
                  {detail.isGuessed && <span className="toeic-flag-badge toeic-flag-badge--guess">찍음</span>}
                  {detail.isSkipped && <span className="toeic-flag-badge toeic-flag-badge--skip">스킵</span>}
                </div>
              ))}
            </div>

            <div className="toeic-reasons-box">
              <h3 className="toeic-reasons-title">
                <span className="toeic-reasons-dot" aria-hidden="true" />
                핵심 점수 원인 분석
              </h3>
              <ul className="toeic-reasons-list">
                {diagnosis.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4-3. Interactive Goal Setting */}
          <div className="toeic-card">
            <span className="toeic-section-kicker toeic-section-kicker--emerald">GOAL SETTING</span>
            <h2 className="toeic-section-title">앞으로의 목표 점수를 선택해 주세요</h2>
            <p className="toeic-section-sub">
              목표 점수를 누르면 아래의 집중 파트와 공부법, RC 시간 배분이 실시간으로 맞춤 변경됩니다.
            </p>

            <div className="toeic-target-grid" role="group" aria-label="목표 점수 선택">
              {TARGET_KEYS.map((key) => {
                const plan = TOEIC_TARGET_PLANS[key];
                const isActive = selectedTarget === key;
                const isRecommended = diagnosis.defaultTarget === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isActive}
                    className={`toeic-target-btn${isActive ? " toeic-target-btn--active" : ""}`}
                    onClick={() => setSelectedTarget(key)}
                  >
                    {isRecommended && <span className="toeic-target-rec">추천</span>}
                    {plan.label}
                  </button>
                );
              })}
            </div>

            <div className="toeic-goal-banner">
              <div>
                <div className="toeic-goal-badges">
                  <span className="toeic-goal-gap">{goalGap.gapBadge}</span>
                  <span className="toeic-goal-duration">{goalGap.durationText}</span>
                </div>
                <p className="toeic-goal-headline">{activePlan.headline}</p>
              </div>

              <div className="toeic-goal-hours-box">
                <p className="toeic-goal-hours-label">하루 권장 학습량</p>
                <p className="toeic-goal-hours-val">{activePlan.dailyHours}</p>
              </div>
            </div>

            <div className="toeic-dday-wrap">
              <p className="toeic-dday-label">시험 예정일 (D-Day) — AI 튜터 프롬프트에 자동 반영</p>
              <div className="toeic-dday-grid" role="group" aria-label="시험 예정일 선택">
                {DDAY_OPTIONS.map((opt) => {
                  const isActive = selectedDday === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={isActive}
                      className={`toeic-dday-btn${isActive ? " toeic-dday-btn--active" : ""}`}
                      onClick={() => setSelectedDday(opt.id)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {activeDday && <p className="toeic-dday-hint">{activeDday.planHint}</p>}
            </div>
          </div>

          {/* 4-4. Focus Parts */}
          <div className="toeic-card">
            <span className="toeic-section-kicker toeic-section-kicker--amber">FOCUS PARTS</span>
            <h2 className="toeic-section-title">집중 공략해야 할 핵심 파트</h2>
            <p className="toeic-section-sub">
              방금 푼 10문제의 취약점과 설정한 목표 점수를 결합해 투자 대비 점수 상승폭이 큰 파트를 우선순위대로 정리했습니다.
            </p>

            <div className="toeic-focus-grid">
              {activePlan.focusParts.map((fp) => {
                const isWeak = diagnosis.weakParts.includes(fp.matchPart);
                return (
                  <div
                    key={fp.part}
                    className={`toeic-focus-card${isWeak ? " toeic-focus-card--weak" : ""}`}
                  >
                    <div className="toeic-focus-head">
                      <span className="toeic-focus-part">{fp.part}</span>
                      <div className="toeic-focus-tags">
                        {isWeak && <span className="toeic-weak-tag">방금 오답 파트</span>}
                        <span className="toeic-priority-tag">{fp.priority}</span>
                      </div>
                    </div>
                    <p className="toeic-focus-desc">{fp.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4-5. Actionable Roadmap */}
          <div className="toeic-card">
            <span className="toeic-section-kicker toeic-section-kicker--purple">ACTIONABLE ROADMAP</span>
            <h2 className="toeic-section-title">목표 달성을 위한 단계별 공부법</h2>

            <div className="toeic-methods-grid">
              {activePlan.methods.map((method) => (
                <div key={method.title} className="toeic-method-card">
                  <div className="toeic-method-icon">
                    <StudyMethodIcon icon={method.icon} />
                  </div>
                  <div>
                    <h3 className="toeic-method-title">{method.title}</h3>
                    <p className="toeic-method-desc">{method.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="toeic-rc-box">
              <div className="toeic-rc-head">
                <h3 className="toeic-rc-title">목표 점수 기준 추천 RC 시간 배분 (총 75분)</h3>
                <span className="toeic-rc-badge">{activePlan.label} 기준</span>
              </div>

              <div className="toeic-rc-bar" aria-label="RC 75분 시간 배분 그래프">
                <div
                  className="toeic-rc-seg toeic-rc-seg--p5"
                  style={{ width: `${(activePlan.rcTime.p5 / 75) * 100}%` }}
                >
                  P5 {activePlan.rcTime.p5}m
                </div>
                <div
                  className="toeic-rc-seg toeic-rc-seg--p6"
                  style={{ width: `${(activePlan.rcTime.p6 / 75) * 100}%` }}
                >
                  P6 {activePlan.rcTime.p6}m
                </div>
                <div
                  className="toeic-rc-seg toeic-rc-seg--p7"
                  style={{ width: `${(activePlan.rcTime.p7 / 75) * 100}%` }}
                >
                  P7 {activePlan.rcTime.p7}m
                </div>
              </div>

              <div className="toeic-rc-legend">
                <div className="toeic-rc-legend-item">
                  Part 5 (30문항)
                  <strong>{activePlan.rcTime.p5}분</strong>
                </div>
                <div className="toeic-rc-legend-item">
                  Part 6 (16문항)
                  <strong>{activePlan.rcTime.p6}분</strong>
                </div>
                <div className="toeic-rc-legend-item">
                  Part 7 (54문항)
                  <strong>{activePlan.rcTime.p7}분</strong>
                </div>
              </div>

              <p className="toeic-rc-tip">{activePlan.rcTip}</p>
            </div>
          </div>

          {/* 4-6. 10-Question Answer Review Accordion */}
          <div className="toeic-card">
            <div className="toeic-review-head">
              <div>
                <span className="toeic-section-kicker">ANSWER REVIEW</span>
                <h2 className="toeic-section-title">10문제 상세 해설 &amp; 오답노트</h2>
              </div>
              <button type="button" className="toeic-btn-ghost" onClick={handleToggleAllReviews}>
                {allReviewsOpen ? "전체 접기" : "전체 펼치기"}
              </button>
            </div>

            <div className="toeic-review-list">
              {diagnosis.details.map((detail, idx) => {
                const isOpen = openReviews[idx] ?? false;
                const userOpt =
                  detail.userAnswer !== null && detail.userAnswer >= 0
                    ? detail.question.options[detail.userAnswer]
                    : null;
                const correctOpt = detail.question.options[detail.question.correctIndex];

                return (
                  <div key={detail.question.id} className="toeic-review-item">
                    <button
                      type="button"
                      className="toeic-review-trigger"
                      aria-expanded={isOpen}
                      onClick={() => handleToggleReview(idx)}
                    >
                      <div className="toeic-review-trigger-left">
                        <span
                          className={`toeic-ox-badge ${
                            detail.isCorrect ? "toeic-ox-badge--o" : "toeic-ox-badge--x"
                          }`}
                        >
                          {detail.isCorrect ? "O" : "X"}
                        </span>
                        <span className="toeic-review-qtitle">
                          Q{detail.question.id}. {detail.question.skillName}
                        </span>
                        {detail.isGuessed && (
                          <span className="toeic-flag-badge toeic-flag-badge--guess">찍음</span>
                        )}
                        {detail.isSkipped && (
                          <span className="toeic-flag-badge toeic-flag-badge--skip">스킵</span>
                        )}
                        <span className="toeic-review-qmeta">
                          {detail.question.part} · {detail.question.targetLevel} · {detail.timeSpent}초
                        </span>
                      </div>

                      <svg
                        className={`toeic-review-chevron${isOpen ? " toeic-review-chevron--open" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="toeic-review-body">
                        {detail.question.passage && (
                          <div className="toeic-passage" style={{ marginBottom: 0 }}>
                            <div className="toeic-passage-header">{detail.question.passage.header}</div>
                            <div className="toeic-passage-body">
                              {detail.question.passage.paragraphs.map((p, pIdx) => (
                                <p key={pIdx}>{p}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="toeic-review-prompt">{detail.question.prompt}</p>

                        <div className="toeic-review-answers">
                          <div
                            className={`toeic-answer-pill ${
                              detail.isCorrect ? "toeic-answer-pill--correct" : "toeic-answer-pill--wrong"
                            }`}
                          >
                            <span className="toeic-answer-pill-label">내가 선택한 답</span>
                            <span className="toeic-answer-pill-val">
                              {detail.isSkipped
                                ? "모르겠음 (건너뛰기)"
                                : userOpt
                                  ? `(${userOpt.label}) ${userOpt.text}${detail.isGuessed ? " · 찍음" : ""}`
                                  : "미응답"}
                            </span>
                          </div>

                          <div className="toeic-answer-pill toeic-answer-pill--correct">
                            <span className="toeic-answer-pill-label">정답</span>
                            <span className="toeic-answer-pill-val">
                              ({correctOpt.label}) {correctOpt.text}
                            </span>
                          </div>
                        </div>

                        <div className="toeic-review-exp">
                          <strong>해설: </strong>
                          {detail.question.explanation}
                        </div>

                        <div className="toeic-review-tip">
                          <strong>학습 팁: </strong>
                          {detail.question.studyTip}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4-6b. 1-Time Free AI Weakness 3-Question Mini-Drill */}
          <div className="toeic-card toeic-drill-card">
            <span className="toeic-drill-badge">AI 1회 무료 체험 · 약점 즉석 훈련</span>

            {(drillPhase === "ready" || drillPhase === "loading") && (
              <>
                <h2 className="toeic-section-title">
                  방금 흔들린 [{weakSummaryLabel}] AI 맞춤 변형 3문제 바로 풀기
                </h2>
                <p className="toeic-section-sub">
                  내 진단 결과를 바탕으로 AI가 즉석에서 새 토익 3문제를 출제해 드립니다. (웹 1회 무료 체험 · 이후 Gemini에서 무제한)
                </p>

                {drillPhase === "loading" ? (
                  <div className="toeic-drill-loading" role="status" aria-live="polite">
                    <span className="toeic-drill-spinner" aria-hidden="true" />
                    <span>AI가 내 약점 맞춤 3문제를 출제하고 있어요...</span>
                  </div>
                ) : (
                  <div className="toeic-drill-cta-row">
                    <button
                      type="button"
                      className="toeic-btn-primary"
                      onClick={handleGenerateAiDrill}
                    >
                      AI 맞춤 3문제 생성하기
                    </button>
                  </div>
                )}

                {drillError && (
                  <div className="toeic-drill-error" role="alert">
                    <span>{drillError}</span>
                    <div>
                      <a
                        className="toeic-drill-gemini-btn"
                        href={
                          tutorPromptText.length > 2000
                            ? "https://gemini.google.com/app"
                            : `https://gemini.google.com/app?q=${encodeURIComponent(tutorPromptText)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleCopyAndOpenGemini}
                      >
                        약점 프롬프트 복사 후 Gemini에서 바로 풀기 <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}

            {drillPhase === "active" && drillData && (
              <>
                <h2 className="toeic-section-title">
                  내 약점 맞춤 AI 변형 3문제
                </h2>
                <div className="toeic-drill-focus">{drillData.focusSummary}</div>

                <div className="toeic-drill-list">
                  {drillData.questions.map((q, qIdx) => {
                    const picked = drillAnswers[qIdx];
                    const isAnswered = picked !== null;
                    const isCorrect = picked === q.correctIndex;

                    return (
                      <div key={qIdx} className="toeic-drill-item">
                        <div className="toeic-drill-item-head">
                          <span>
                            문항 {qIdx + 1} / {drillData.questions.length} · {q.part} · {q.skillName}
                          </span>
                          {isAnswered && (
                            <span
                              className={`toeic-ox-badge ${
                                isCorrect ? "toeic-ox-badge--o" : "toeic-ox-badge--x"
                              }`}
                            >
                              {isCorrect ? "O" : "X"}
                            </span>
                          )}
                        </div>

                        <p className="toeic-drill-prompt">{q.prompt}</p>

                        <div className="toeic-drill-options">
                          {q.options.map((opt, optIdx) => {
                            let stateClass = "";
                            if (isAnswered) {
                              if (optIdx === q.correctIndex) {
                                stateClass = " toeic-drill-opt--correct";
                              } else if (optIdx === picked) {
                                stateClass = " toeic-drill-opt--wrong";
                              }
                            }
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                disabled={isAnswered}
                                className={`toeic-drill-opt${stateClass}`}
                                onClick={() => handleSelectDrillOption(qIdx, optIdx)}
                              >
                                <span className="toeic-drill-opt-label">{opt.label}</span>
                                <span>{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div className="toeic-drill-feedback">
                            <div className="toeic-review-exp">
                              <strong>3초 풀이 근거: </strong>
                              {q.explanation}
                            </div>
                            <div className="toeic-review-tip">
                              <strong>필수 표현 팁: </strong>
                              {q.collocationTip}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {drillAllAnswered && (
                  <>
                    <div className="toeic-drill-score-banner">
                      3문제 중 {drillCorrectCount}개 정답!
                    </div>
                    <div className="toeic-drill-convert">
                      <h3>방금 푼 {weakSummaryLabel} 약점, Gemini에서 무제한으로 이어가세요!</h3>
                      <p>
                        대학생 Gemini 무료 구독을 켜두면 이 약점 맞춤 문제 무제한 출제는 물론, 실제 토익 문제집 사진 오답분석까지 무료로 쓸 수 있어요.
                      </p>
                      <div className="toeic-drill-convert-actions">
                        <SignupLink source="toeic_diagnosis" className="toeic-drill-signup-btn">
                          <span>학생 Gemini 무료 구독하기 (대학생 무료)</span>
                          <span aria-hidden="true">↗</span>
                        </SignupLink>
                        <a
                          className="toeic-drill-gemini-btn"
                          href={
                            tutorPromptText.length > 2000
                              ? "https://gemini.google.com/app"
                              : `https://gemini.google.com/app?q=${encodeURIComponent(tutorPromptText)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleCopyAndOpenGemini}
                        >
                          <span>약점 프롬프트 복사 후 Gemini에서 이어풀기</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      </div>
                      {drillCopiedNote && (
                        <p className="toeic-drill-copied-note" role="status">
                          프롬프트를 자동 복사했어요! 열린 Gemini 창에 붙여넣기(Ctrl+V)만 하세요.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {drillPhase === "locked" && (
              <div className="toeic-drill-convert" style={{ marginTop: 0 }}>
                <h3>웹 무료 AI 체험(1회)을 완료했어요!</h3>
                <p>
                  대학생 Gemini 무료 구독을 켜두면 이 약점 맞춤 문제 무제한 출제는 물론, 실제 토익 문제집 사진 오답분석까지 무료로 쓸 수 있어요.
                </p>
                <div className="toeic-drill-convert-actions">
                  <SignupLink source="toeic_diagnosis" className="toeic-drill-signup-btn">
                    <span>학생 Gemini 무료 구독하기 (대학생 무료)</span>
                    <span aria-hidden="true">↗</span>
                  </SignupLink>
                  <a
                    className="toeic-drill-gemini-btn"
                    href={
                      tutorPromptText.length > 2000
                        ? "https://gemini.google.com/app"
                        : `https://gemini.google.com/app?q=${encodeURIComponent(tutorPromptText)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCopyAndOpenGemini}
                  >
                    <span>약점 프롬프트 복사 후 Gemini에서 이어풀기</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
                {drillCopiedNote && (
                  <p className="toeic-drill-copied-note" role="status">
                    프롬프트를 자동 복사했어요! 열린 Gemini 창에 붙여넣기(Ctrl+V)만 하세요.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 4-7. 바로 쓰는 프롬프트 (Site-consistent Prompt + Gemini CTA Card) */}
          <section className="detail-section library-prompt-section toeic-prompt-section">
            <div className="library-section-heading">
              <h2>바로 쓰는 프롬프트</h2>
              <span>복사해 AI 대화창에 붙여넣으면 시작돼요</span>
            </div>

            <details id="toeic-prompt-full-text" className="skill-raw-details prompt-full-details">
              <summary>
                <span>자세히보기 · 프롬프트 전문</span>
                <span className="details-toggle-hint">
                  <span className="prompt-show-label">펼치기 ▾</span>
                  <span className="prompt-hide-label">접기 ▴</span>
                </span>
              </summary>
              <pre className="library-prompt-text">{tutorPromptText}</pre>
            </details>

            <LibraryCopy
              body={tutorPromptText}
              fullTextId="toeic-prompt-full-text"
              openGeminiLabel="Gemini에서 바로 학습하기"
            />

            <SignupLink source="toeic_diagnosis" className="library-student-subscribe">
              <span>무료로 Gemini 구독 후 무제한 훈련하기</span>
              <span aria-hidden="true">↗</span>
            </SignupLink>
          </section>

          {/* 4-8. Retry Action */}
          <div className="toeic-retry-wrap">
            <button type="button" className="toeic-btn-secondary toeic-retry-btn" onClick={handleRetry}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>다시 테스트하기</span>
            </button>
          </div>

          <p className="toeic-disclaimer">
            본 진단은 10개 핵심 출제 영역 기반의 약식 점수 예측 및 학습 가이드이며, 실제 ETS TOEIC® 공식 성적과 차이가 있을 수 있습니다.
          </p>
        </div>
      )}
    </section>
  );
}

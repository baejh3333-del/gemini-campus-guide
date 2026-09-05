// 진도 저장. 인앱 브라우저(에브리타임/카카오톡)에서 localStorage가 막히거나
// 앱 전환 중 탭이 폐기될 수 있으므로: 모든 변경 즉시 저장 + 실패해도 앱이 죽지 않게.

export const STEP_IDS = ["benefit", "prompt", "research", "notebook", "gem"] as const;
export type StepId = (typeof STEP_IDS)[number];

export type Progress = {
  version: 1;
  completed: StepId[];
  checks: Partial<Record<StepId, boolean>>;
  builder: Record<string, string>;
  quiz: { passed: boolean; attempts: number };
  startedAt: string | null;
  stepTimes: Partial<Record<StepId, number>>;
  signup: "none" | "clicked" | "done";
  /** 수료증에 표시할 이름. 캡처하려다 새로고침해도 날아가지 않게 저장한다. */
  certName: string;
};

const KEY = "gemini-camp:v1";
const VERSION = 1;

export function emptyProgress(): Progress {
  return {
    version: VERSION,
    completed: [],
    checks: {},
    builder: {},
    quiz: { passed: false, attempts: 0 },
    startedAt: null,
    stepTimes: {},
    signup: "none",
    certName: "",
  };
}

const isStepId = (v: unknown): v is StepId =>
  typeof v === "string" && (STEP_IDS as readonly string[]).includes(v);

/**
 * 저장된 문자열 -> Progress. 어떤 입력이 와도 절대 throw 하지 않는다.
 * 버전이 다르거나 형태가 깨졌으면 조용히 초기 상태로 되돌린다.
 * (캠페인 중 스키마를 고쳐도 기존 사용자가 흰 화면을 보지 않게)
 */
export function parseProgress(raw: string | null): Progress {
  const base = emptyProgress();
  if (!raw) return base;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return base;
  }
  if (typeof data !== "object" || data === null) return base;
  const o = data as Record<string, unknown>;
  if (o.version !== VERSION) return base;

  if (Array.isArray(o.completed)) base.completed = o.completed.filter(isStepId);

  if (typeof o.checks === "object" && o.checks !== null) {
    for (const [k, v] of Object.entries(o.checks)) {
      if (isStepId(k) && typeof v === "boolean") base.checks[k] = v;
    }
  }

  if (typeof o.builder === "object" && o.builder !== null) {
    for (const [k, v] of Object.entries(o.builder)) {
      if (typeof v === "string") base.builder[k] = v;
    }
  }

  if (typeof o.quiz === "object" && o.quiz !== null) {
    const q = o.quiz as Record<string, unknown>;
    if (typeof q.passed === "boolean") base.quiz.passed = q.passed;
    if (typeof q.attempts === "number" && Number.isFinite(q.attempts)) {
      base.quiz.attempts = q.attempts;
    }
  }

  if (typeof o.startedAt === "string") base.startedAt = o.startedAt;

  if (typeof o.stepTimes === "object" && o.stepTimes !== null) {
    for (const [k, v] of Object.entries(o.stepTimes)) {
      if (isStepId(k) && typeof v === "number" && Number.isFinite(v)) {
        base.stepTimes[k] = v;
      }
    }
  }

  if (o.signup === "clicked" || o.signup === "done") base.signup = o.signup;

  // 저장 시점에 이미 잘라 넣지만, 손으로 고친 값이 들어올 수도 있으니 여기서도 자른다
  if (typeof o.certName === "string") base.certName = o.certName.slice(0, 20);

  return base;
}

// localStorage가 막힌 환경(사파리 프라이빗, 일부 인앱 브라우저)에서는
// 이 메모리 사본으로 최소한 그 세션 동안은 진도가 유지된다.
let memory: Progress | null = null;

export function loadProgress(): Progress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const p = parseProgress(window.localStorage.getItem(KEY));
    memory = p;
    return p;
  } catch {
    return memory ?? emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  memory = p;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // 저장소가 막혀 있어도 학습은 계속되어야 한다. memory 사본으로 버틴다.
  }
}

/** 읽기-수정-쓰기를 한 번에. 모든 상태 변경은 이걸 통한다(= 즉시 저장). */
export function updateProgress(fn: (p: Progress) => void): Progress {
  const p = loadProgress();
  fn(p);
  if (!p.startedAt) p.startedAt = new Date().toISOString();
  saveProgress(p);
  return p;
}

export function resetProgress(): void {
  memory = null;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export const isDone = (p: Progress, id: StepId) => p.completed.includes(id);

export function markDone(p: Progress, id: StepId): void {
  if (!p.completed.includes(id)) p.completed.push(id);
}

/** 필수 스텝(benefit 제외)을 다 끝냈는가 = 퀴즈 응시 자격 */
export function canTakeQuiz(p: Progress): boolean {
  return STEP_IDS.filter((id) => id !== "benefit").every((id) =>
    p.completed.includes(id)
  );
}

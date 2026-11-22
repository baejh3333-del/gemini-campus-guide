import type { LibraryPrompt } from "@/lib/prompt-library";

export type RankingPeriod = "today" | "week" | "month";

export const RANKING_PERIOD_LABELS: Record<RankingPeriod, string> = {
  today: "오늘",
  week: "이번 주",
  month: "이번 달",
};

export const LABEL_TO_RANKING_PERIOD: Record<string, RankingPeriod> = {
  오늘: "today",
  "이번 주": "week",
  "이번 달": "month",
};

export const RANKING_PERIODS: RankingPeriod[] = ["today", "week", "month"];

export type RankingApiItem = {
  promptId: string;
  title: string;
  category: string;
  kind: LibraryPrompt["kind"];
  count: number;
  seedCount: number;
  liveCount: number;
};

export type RankingApiResponse = {
  ok: true;
  period: RankingPeriod;
  bucket: string;
  items: RankingApiItem[];
  deltas: Record<string, number>;
  source: "kv" | "google-sheets" | "memory";
  updatedAt: string;
};

export const RANKING_ROW_PREFIX = "__rk__:";

const PERIOD_SHORT: Record<RankingPeriod, string> = {
  today: "d",
  week: "w",
  month: "m",
};

export function isRankingRowId(id: string): boolean {
  return id.startsWith(RANKING_ROW_PREFIX);
}

/** Counter key for one period bucket, e.g. "d:2026-11-22", "w:2026-11-16", "m:2026-11". */
export function buildRankingKey(period: RankingPeriod, bucket: string): string {
  return `${PERIOD_SHORT[period]}:${bucket.replace(/^W-/, "")}`;
}

/** Legacy row id used when ranking counters were stored as rows of the community sheet. */
export function buildRankingRowId(period: RankingPeriod, bucket: string, promptId: string): string {
  return `${RANKING_ROW_PREFIX}${buildRankingKey(period, bucket)}:${promptId}`.slice(0, 80);
}

export function parseRankingRowId(
  rowId: string,
  period: RankingPeriod,
  bucket: string,
): string | null {
  const prefix = `${RANKING_ROW_PREFIX}${buildRankingKey(period, bucket)}:`;
  if (!rowId.startsWith(prefix)) return null;
  const promptId = rowId.slice(prefix.length).trim();
  return promptId || null;
}

export type RankedPromptItem = {
  rank: number;
  prompt: LibraryPrompt;
  count: number;
  seedCount: number;
  liveCount: number;
};

export const RANKING_UPDATED_EVENT = "gsa-ranking-updated";
const LOCAL_STORAGE_KEY = "gsa-prompt-ranking-v1";

/**
 * Returns KST (UTC+9) bucket keys so daily/weekly/monthly rankings roll over on Korean time.
 */
export function getRankingBucket(period: RankingPeriod, now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");

  if (period === "today") {
    return `${year}-${month}-${day}`;
  }
  if (period === "month") {
    return `${year}-${month}`;
  }

  // Monday-start week bucket (YYYY-MM-DD of that week's Monday in KST)
  const dayOfWeek = kst.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(Date.UTC(year, kst.getUTCMonth(), kst.getUTCDate() + diffToMonday));
  const mYear = monday.getUTCFullYear();
  const mMonth = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const mDay = String(monday.getUTCDate()).padStart(2, "0");
  return `W-${mYear}-${mMonth}-${mDay}`;
}

export function normalizeRankingPeriod(value: string | null | undefined): RankingPeriod {
  if (value === "today" || value === "week" || value === "month") return value;
  if (value && value in LABEL_TO_RANKING_PERIOD) {
    return LABEL_TO_RANKING_PERIOD[value];
  }
  return "today";
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministic baseline copy count per prompt and period.
 * Ensures the TOP 5 ranking is immediately populated and meaningful on cold start/serverless,
 * with distinct ordering across today / week / month, while keeping counts close enough that
 * real user copies visibly increment and can re-rank items.
 */
export function getSeedCopyCount(
  promptId: string,
  index: number,
  period: RankingPeriod,
): number {
  const h = hashString(`${period}:${promptId}`);
  const norm = (h % 1000) / 1000; // 0.000 .. 0.999
  // Slight boost for featured early items without locking the order
  const featuredBoost = index < 8 ? (8 - index) * 0.04 : 0;
  const score = Math.min(1, norm * 0.85 + featuredBoost);

  if (period === "today") {
    return Math.round(14 + score * 34); // 14 ~ 48
  }
  if (period === "week") {
    return Math.round(68 + score * 175); // 68 ~ 243
  }
  return Math.round(240 + score * 620); // 240 ~ 860
}

type LocalRankingStore = Record<RankingPeriod, { bucket: string; counts: Record<string, number> }>;

function createEmptyLocalStore(now: Date = new Date()): LocalRankingStore {
  return {
    today: { bucket: getRankingBucket("today", now), counts: {} },
    week: { bucket: getRankingBucket("week", now), counts: {} },
    month: { bucket: getRankingBucket("month", now), counts: {} },
  };
}

function readLocalStore(now: Date = new Date()): LocalRankingStore {
  const fresh = createEmptyLocalStore(now);
  if (typeof window === "undefined") return fresh;

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<LocalRankingStore>;
    for (const period of RANKING_PERIODS) {
      const entry = parsed[period];
      if (
        entry &&
        entry.bucket === fresh[period].bucket &&
        entry.counts &&
        typeof entry.counts === "object"
      ) {
        const sanitized: Record<string, number> = {};
        for (const [id, value] of Object.entries(entry.counts)) {
          if (typeof value === "number" && Number.isFinite(value) && value > 0) {
            sanitized[id] = Math.floor(value);
          }
        }
        fresh[period] = { bucket: entry.bucket, counts: sanitized };
      }
    }
  } catch {
    // Ignore storage quota / JSON errors
  }
  return fresh;
}

function writeLocalStore(store: LocalRankingStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export function getLocalRankingDeltas(period: RankingPeriod): Record<string, number> {
  return readLocalStore()[period].counts;
}

/**
 * Records a prompt copy/download:
 * 1) Immediately increments localStorage counts for today/week/month (survives serverless cold starts)
 * 2) Dispatches a client event so open Ranking views update live
 * 3) Fires a non-blocking POST /api/ranking to persist on the server
 */
export function recordPromptCopy(promptId: string): void {
  if (!promptId || typeof window === "undefined") return;

  const store = readLocalStore();
  for (const period of RANKING_PERIODS) {
    store[period].counts[promptId] = (store[period].counts[promptId] ?? 0) + 1;
  }
  writeLocalStore(store);

  try {
    window.dispatchEvent(new CustomEvent(RANKING_UPDATED_EVENT, { detail: { promptId } }));
  } catch {
    // Ignore CustomEvent issues
  }

  try {
    void fetch("/api/ranking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Non-blocking: never fail a copy action
  }
}

/**
 * Computes sorted TOP N prompts by merging deterministic baseline + max(serverDelta, localDelta).
 * Using Math.max avoids double-counting when the server is warm while guaranteeing the user's
 * own copies remain visible across serverless cold starts.
 */
export function buildRankedPrompts(
  prompts: LibraryPrompt[],
  period: RankingPeriod,
  serverDeltas: Record<string, number> = {},
  localDeltas: Record<string, number> = {},
  limit = 5,
): RankedPromptItem[] {
  // Baselines follow the static library order only. Community posts arrive later and get no
  // baseline, so they neither shift the static items' positions nor show copies that never happened.
  let staticIndex = 0;
  const scored = prompts.map((prompt, index) => {
    const seedCount = prompt.isCommunity ? 0 : getSeedCopyCount(prompt.id, staticIndex++, period);
    const serverDelta = Math.max(0, Math.floor(serverDeltas[prompt.id] ?? 0));
    const localDelta = Math.max(0, Math.floor(localDeltas[prompt.id] ?? 0));
    const liveCount = Math.max(serverDelta, localDelta);
    const count = seedCount + liveCount;
    return { prompt, count, seedCount, liveCount, index };
  });

  scored.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (b.liveCount !== a.liveCount) return b.liveCount - a.liveCount;
    if (b.seedCount !== a.seedCount) return b.seedCount - a.seedCount;
    return a.index - b.index;
  });

  return scored.slice(0, limit).map((item, idx) => ({
    rank: idx + 1,
    prompt: item.prompt,
    count: item.count,
    seedCount: item.seedCount,
    liveCount: item.liveCount,
  }));
}

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { LIBRARY_PROMPTS } from "@/content/prompts";
import {
  buildRankedPrompts,
  getRankingBucket,
  normalizeRankingPeriod,
  RANKING_PERIODS,
  type RankingApiResponse,
  type RankingPeriod,
} from "@/lib/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_FILE = path.join(process.cwd(), ".next", "cache", "ranking-store.json");
const KV_TIMEOUT_MS = 2_500;
const VALID_PROMPT_IDS = new Set(LIBRARY_PROMPTS.map((prompt) => prompt.id));

type MemoryRankingStore = Record<
  RankingPeriod,
  { bucket: string; counts: Record<string, number> }
>;

declare global {
  var __gsaRankingStore: MemoryRankingStore | undefined;
}

function getKvConfig() {
  const url = (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  const token = (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    ""
  ).trim();
  return { url, token, enabled: Boolean(url && token) };
}

function kvHashKey(period: RankingPeriod, bucket: string): string {
  return `gsa:ranking:${period}:${bucket}`;
}

function kvTtlSeconds(period: RankingPeriod): number {
  if (period === "today") return 60 * 60 * 48; // 2 days
  if (period === "week") return 60 * 60 * 24 * 14; // 14 days
  return 60 * 60 * 24 * 45; // 45 days
}

async function runKvCommand<T = unknown>(command: (string | number)[]): Promise<T | null> {
  const { url, token, enabled } = getKvConfig();
  if (!enabled) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
      signal: AbortSignal.timeout(KV_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: T; error?: string };
    if (data.error) return null;
    return data.result ?? null;
  } catch {
    return null;
  }
}

async function readKvDeltas(
  period: RankingPeriod,
  bucket: string,
): Promise<Record<string, number> | null> {
  const raw = await runKvCommand<unknown>(["HGETALL", kvHashKey(period, bucket)]);
  if (raw === null) return null;

  const deltas: Record<string, number> = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length - 1; i += 2) {
      const id = String(raw[i]);
      const val = Number(raw[i + 1]);
      if (VALID_PROMPT_IDS.has(id) && Number.isFinite(val) && val > 0) {
        deltas[id] = Math.floor(val);
      }
    }
    return deltas;
  }
  if (typeof raw === "object") {
    for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
      const num = Number(val);
      if (VALID_PROMPT_IDS.has(id) && Number.isFinite(num) && num > 0) {
        deltas[id] = Math.floor(num);
      }
    }
    return deltas;
  }
  return deltas;
}

async function incrementKv(promptId: string, now: Date): Promise<boolean> {
  const { enabled } = getKvConfig();
  if (!enabled) return false;

  const results = await Promise.all(
    RANKING_PERIODS.map(async (period) => {
      const key = kvHashKey(period, getRankingBucket(period, now));
      const next = await runKvCommand<number>(["HINCRBY", key, promptId, 1]);
      if (next !== null) {
        void runKvCommand(["EXPIRE", key, kvTtlSeconds(period)]);
      }
      return next !== null;
    }),
  );
  return results.every(Boolean);
}

function createEmptyMemoryStore(now: Date = new Date()): MemoryRankingStore {
  return {
    today: { bucket: getRankingBucket("today", now), counts: {} },
    week: { bucket: getRankingBucket("week", now), counts: {} },
    month: { bucket: getRankingBucket("month", now), counts: {} },
  };
}

function normalizeMemoryStore(
  raw: Partial<MemoryRankingStore> | undefined,
  now: Date = new Date(),
): MemoryRankingStore {
  const fresh = createEmptyMemoryStore(now);
  if (!raw) return fresh;

  for (const period of RANKING_PERIODS) {
    const entry = raw[period];
    if (
      entry &&
      entry.bucket === fresh[period].bucket &&
      entry.counts &&
      typeof entry.counts === "object"
    ) {
      const sanitized: Record<string, number> = {};
      for (const [id, val] of Object.entries(entry.counts)) {
        if (VALID_PROMPT_IDS.has(id) && typeof val === "number" && Number.isFinite(val) && val > 0) {
          sanitized[id] = Math.floor(val);
        }
      }
      fresh[period] = { bucket: entry.bucket, counts: sanitized };
    }
  }
  return fresh;
}

function readMemoryStore(now: Date = new Date()): MemoryRankingStore {
  if (globalThis.__gsaRankingStore) {
    const normalized = normalizeMemoryStore(globalThis.__gsaRankingStore, now);
    globalThis.__gsaRankingStore = normalized;
    return normalized;
  }

  try {
    if (fs.existsSync(STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf8")) as Partial<MemoryRankingStore>;
      const normalized = normalizeMemoryStore(parsed, now);
      globalThis.__gsaRankingStore = normalized;
      return normalized;
    }
  } catch {
    // Ignore file read errors on read-only serverless filesystems
  }

  const fresh = createEmptyMemoryStore(now);
  globalThis.__gsaRankingStore = fresh;
  return fresh;
}

function writeMemoryStore(store: MemoryRankingStore): void {
  globalThis.__gsaRankingStore = store;
  try {
    fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Ignore file write errors on read-only serverless filesystems
  }
}

export async function GET(request: NextRequest) {
  const now = new Date();
  const period = normalizeRankingPeriod(request.nextUrl.searchParams.get("period"));
  const bucket = getRankingBucket(period, now);

  let source: "kv" | "memory" = "memory";
  let deltas: Record<string, number>;

  const kvDeltas = await readKvDeltas(period, bucket);
  if (kvDeltas !== null) {
    source = "kv";
    deltas = kvDeltas;
  } else {
    const store = readMemoryStore(now);
    deltas = { ...store[period].counts };
  }

  const ranked = buildRankedPrompts(LIBRARY_PROMPTS, period, deltas, {}, 5);
  const response: RankingApiResponse = {
    ok: true,
    period,
    bucket,
    items: ranked.map((entry) => ({
      promptId: entry.prompt.id,
      title: entry.prompt.title,
      category: entry.prompt.category,
      kind: entry.prompt.kind,
      count: entry.count,
      seedCount: entry.seedCount,
      liveCount: entry.liveCount,
    })),
    deltas,
    source,
    updatedAt: now.toISOString(),
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const promptId =
    body && typeof body === "object" && "promptId" in body && typeof (body as { promptId?: unknown }).promptId === "string"
      ? (body as { promptId: string }).promptId.trim()
      : "";

  if (!promptId || !VALID_PROMPT_IDS.has(promptId)) {
    return NextResponse.json({ ok: false, error: "Unknown or missing promptId" }, { status: 400 });
  }

  const now = new Date();
  const store = readMemoryStore(now);
  for (const period of RANKING_PERIODS) {
    store[period].counts[promptId] = (store[period].counts[promptId] ?? 0) + 1;
  }
  writeMemoryStore(store);

  const kvUpdated = await incrementKv(promptId, now);

  return NextResponse.json(
    {
      ok: true,
      promptId,
      source: kvUpdated ? "kv" : "memory",
      deltas: {
        today: store.today.counts[promptId],
        week: store.week.counts[promptId],
        month: store.month.counts[promptId],
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

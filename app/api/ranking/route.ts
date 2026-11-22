import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { LIBRARY_PROMPTS } from "@/content/prompts";
import {
  buildRankedPrompts,
  buildRankingRowId,
  getRankingBucket,
  normalizeRankingPeriod,
  parseRankingRowId,
  RANKING_PERIODS,
  type RankingApiResponse,
  type RankingPeriod,
} from "@/lib/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const STORE_FILE = path.join(process.cwd(), ".next", "cache", "ranking-store.json");
const KV_TIMEOUT_MS = 2_500;
const SHEET_READ_TIMEOUT_MS = 5_000;
const SHEET_WRITE_TIMEOUT_MS = 10_000;
const SHEET_CACHE_MS = 15_000;

const STATIC_PROMPT_IDS = new Set(LIBRARY_PROMPTS.map((prompt) => prompt.id));
const COMMUNITY_ID_RE = /^user-[a-zA-Z0-9_-]{4,64}$/;

function isValidPromptId(id: string): boolean {
  return STATIC_PROMPT_IDS.has(id) || COMMUNITY_ID_RE.test(id);
}

type MemoryRankingStore = Record<
  RankingPeriod,
  { bucket: string; counts: Record<string, number> }
>;

type SheetPromptRow = {
  id: string;
  copies?: number;
};

type SheetCache = {
  rows: SheetPromptRow[];
  expiresAt: number;
};

declare global {
  var __gsaRankingStore: MemoryRankingStore | undefined;
  var __gsaRankingSheetCache: SheetCache | undefined;
}

/* ── 1. Optional Vercel KV / Upstash Redis REST adapter ─────────────────── */

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
      if (isValidPromptId(id) && Number.isFinite(val) && val > 0) {
        deltas[id] = Math.floor(val);
      }
    }
    return deltas;
  }
  if (typeof raw === "object") {
    for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
      const num = Number(val);
      if (isValidPromptId(id) && Number.isFinite(num) && num > 0) {
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

/* ── 2. Google Sheets (Apps Script Webhook) persistent DB adapter ───────── */

function getSheetsConfig() {
  const url = (
    process.env.PLAYGROUND_WEBHOOK_URL ||
    process.env.ENTRY_WEBHOOK_URL ||
    ""
  ).trim();
  const secret = (
    process.env.PLAYGROUND_SHARED_SECRET ||
    process.env.ENTRY_SHARED_SECRET ||
    ""
  ).trim();
  return { url, secret, enabled: Boolean(url && secret) };
}

async function callSheetsWebhook<T = { ok?: boolean }>(
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<T | null> {
  const { url, secret, enabled } = getSheetsConfig();
  if (!enabled) return null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, secret }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function readSheetsRows(): Promise<SheetPromptRow[] | null> {
  const { enabled } = getSheetsConfig();
  if (!enabled) return null;

  const cached = globalThis.__gsaRankingSheetCache;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.rows;
  }

  const data = await callSheetsWebhook<{ ok?: boolean; prompts?: SheetPromptRow[] }>(
    { action: "list" },
    SHEET_READ_TIMEOUT_MS,
  );
  if (!data?.ok || !Array.isArray(data.prompts)) return null;

  globalThis.__gsaRankingSheetCache = {
    rows: data.prompts,
    expiresAt: Date.now() + SHEET_CACHE_MS,
  };
  return data.prompts;
}

async function readSheetsDeltas(
  period: RankingPeriod,
  bucket: string,
): Promise<Record<string, number> | null> {
  const rows = await readSheetsRows();
  if (rows === null) return null;

  const deltas: Record<string, number> = {};
  for (const row of rows) {
    if (!row || typeof row.id !== "string") continue;
    const promptId = parseRankingRowId(row.id, period, bucket);
    if (!promptId || !isValidPromptId(promptId)) continue;
    const val = Number(row.copies) || 0;
    if (val > 0) {
      deltas[promptId] = Math.floor(val);
    }
  }
  return deltas;
}

async function incrementSheets(promptId: string, now: Date): Promise<boolean> {
  const { enabled } = getSheetsConfig();
  if (!enabled) return false;

  // Invalidate read cache so next GET sees the fresh count immediately
  globalThis.__gsaRankingSheetCache = undefined;

  const jobs = RANKING_PERIODS.map(async (period) => {
    const bucket = getRankingBucket(period, now);
    const rowId = buildRankingRowId(period, bucket, promptId);
    const res = await callSheetsWebhook<{ ok?: boolean }>(
      {
        action: "copy",
        id: rowId,
        seed: {
          id: rowId,
          createdAt: bucket,
          author: "__ranking__",
          category: period,
          variant: "orbit",
          title: "ranking",
          description: promptId,
          body: "ranking-counter",
          copies: 0,
          likes: 0,
        },
      },
      SHEET_WRITE_TIMEOUT_MS,
    );
    return Boolean(res?.ok);
  });

  // Also increment the community post's own `copies` column in Google Sheets
  if (COMMUNITY_ID_RE.test(promptId)) {
    void callSheetsWebhook(
      { action: "copy", id: promptId },
      SHEET_WRITE_TIMEOUT_MS,
    );
  }

  const results = await Promise.all(jobs);
  return results.some(Boolean);
}

/* ── 3. Local memory + cache-file fallback (for local dev without DB env) ─ */

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
        if (isValidPromptId(id) && typeof val === "number" && Number.isFinite(val) && val > 0) {
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

/* ── Route Handlers ─────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const now = new Date();
  const period = normalizeRankingPeriod(request.nextUrl.searchParams.get("period"));
  const bucket = getRankingBucket(period, now);

  let source: RankingApiResponse["source"] = "memory";
  let deltas: Record<string, number> | null = null;

  const kvDeltas = await readKvDeltas(period, bucket);
  if (kvDeltas !== null) {
    source = "kv";
    deltas = kvDeltas;
  } else {
    const sheetDeltas = await readSheetsDeltas(period, bucket);
    if (sheetDeltas !== null) {
      source = "google-sheets";
      deltas = sheetDeltas;
    }
  }

  if (deltas === null) {
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

  if (!promptId || !isValidPromptId(promptId)) {
    return NextResponse.json({ ok: false, error: "Unknown or missing promptId" }, { status: 400 });
  }

  const now = new Date();
  const store = readMemoryStore(now);
  for (const period of RANKING_PERIODS) {
    store[period].counts[promptId] = (store[period].counts[promptId] ?? 0) + 1;
  }
  writeMemoryStore(store);

  let source: RankingApiResponse["source"] = "memory";
  if (await incrementKv(promptId, now)) {
    source = "kv";
  } else if (await incrementSheets(promptId, now)) {
    source = "google-sheets";
  }

  return NextResponse.json(
    {
      ok: true,
      promptId,
      source,
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

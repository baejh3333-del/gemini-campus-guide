import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { LIBRARY_PROMPTS } from "@/content/prompts";
import { getKvConfig, runKvCommand } from "@/lib/kv";
import { listPrompts } from "@/lib/prompt-library";
import {
  buildRankedPrompts,
  buildRankingKey,
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
const SHEET_READ_TIMEOUT_MS = 5_000;
const SHEET_WRITE_TIMEOUT_MS = 10_000;
const SHEET_CACHE_MS = 15_000;

const STATIC_PROMPT_IDS = new Set(LIBRARY_PROMPTS.map((prompt) => prompt.id));
// Community posts are `user-<uuid>`. 55 chars after the prefix keeps the legacy
// `__rk__:d:YYYY-MM-DD:<id>` row id under the sheet's 80-char ID cell, so ids never collide.
const COMMUNITY_ID_RE = /^user-[a-zA-Z0-9_-]{4,55}$/;

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

type DeltaCache = Record<string, { deltas: Record<string, number>; expiresAt: number }>;

declare global {
  var __gsaRankingStore: MemoryRankingStore | undefined;
  var __gsaRankingDeltaCache: DeltaCache | undefined;
}

function sanitizeCounts(raw: Record<string, unknown>): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const [id, val] of Object.entries(raw)) {
    const num = Number(val);
    if (isValidPromptId(id) && Number.isFinite(num) && num > 0) {
      deltas[id] = Math.floor(num);
    }
  }
  return deltas;
}

/* ── 1. Optional Vercel KV / Upstash Redis REST adapter ─────────────────── */

function kvHashKey(period: RankingPeriod, bucket: string): string {
  return `gsa:ranking:${period}:${bucket}`;
}

function kvTtlSeconds(period: RankingPeriod): number {
  if (period === "today") return 60 * 60 * 48; // 2 days
  if (period === "week") return 60 * 60 * 24 * 14; // 14 days
  return 60 * 60 * 24 * 45; // 45 days
}

async function readKvDeltas(
  period: RankingPeriod,
  bucket: string,
): Promise<Record<string, number> | null> {
  const raw = await runKvCommand<unknown>(["HGETALL", kvHashKey(period, bucket)]);
  if (raw === null) return null;

  if (Array.isArray(raw)) {
    const pairs: Record<string, unknown> = {};
    for (let i = 0; i < raw.length - 1; i += 2) {
      pairs[String(raw[i])] = raw[i + 1];
    }
    return sanitizeCounts(pairs);
  }
  if (typeof raw === "object") {
    return sanitizeCounts(raw as Record<string, unknown>);
  }
  return {};
}

async function incrementKv(promptId: string, now: Date): Promise<boolean> {
  if (!getKvConfig().enabled) return false;

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
// Counters live in their own "랭킹" sheet (actions rank_list / rank_incr), so they no longer
// bloat the community sheet that every `list` call downloads. Until the Apps Script is
// redeployed it answers "unknown action", and we fall back to the legacy `__rk__:` rows.

type SheetResponse = { ok?: boolean; error?: string };

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

async function callSheetsWebhook<T extends SheetResponse = SheetResponse>(
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

function isUnknownAction(res: SheetResponse | null): boolean {
  return Boolean(res && !res.ok && res.error === "unknown action");
}

async function readLegacySheetsDeltas(
  period: RankingPeriod,
  bucket: string,
): Promise<Record<string, number> | null> {
  const data = await callSheetsWebhook<SheetResponse & { prompts?: SheetPromptRow[] }>(
    { action: "list" },
    SHEET_READ_TIMEOUT_MS,
  );
  if (!data?.ok || !Array.isArray(data.prompts)) return null;

  const counts: Record<string, unknown> = {};
  for (const row of data.prompts) {
    if (!row || typeof row.id !== "string") continue;
    const promptId = parseRankingRowId(row.id, period, bucket);
    if (promptId) counts[promptId] = row.copies;
  }
  return sanitizeCounts(counts);
}

async function readSheetsDeltas(
  period: RankingPeriod,
  bucket: string,
): Promise<Record<string, number> | null> {
  if (!getSheetsConfig().enabled) return null;

  const key = buildRankingKey(period, bucket);
  const cache = (globalThis.__gsaRankingDeltaCache ??= {});
  const cached = cache[key];
  if (cached && cached.expiresAt > Date.now()) return cached.deltas;

  const data = await callSheetsWebhook<SheetResponse & { counts?: Record<string, unknown> }>(
    { action: "rank_list", key },
    SHEET_READ_TIMEOUT_MS,
  );

  let deltas: Record<string, number> | null = null;
  if (data?.ok && data.counts && typeof data.counts === "object") {
    deltas = sanitizeCounts(data.counts);
  } else if (isUnknownAction(data)) {
    deltas = await readLegacySheetsDeltas(period, bucket);
  }
  if (deltas === null) return null;

  cache[key] = { deltas, expiresAt: Date.now() + SHEET_CACHE_MS };
  return deltas;
}

async function incrementLegacySheets(promptId: string, now: Date): Promise<boolean> {
  const results = await Promise.all(
    RANKING_PERIODS.map(async (period) => {
      const bucket = getRankingBucket(period, now);
      const rowId = buildRankingRowId(period, bucket, promptId);
      const res = await callSheetsWebhook(
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
    }),
  );
  return results.some(Boolean);
}

async function incrementSheets(promptId: string, now: Date): Promise<boolean> {
  if (!getSheetsConfig().enabled) return false;

  const keys = RANKING_PERIODS.map((period) => buildRankingKey(period, getRankingBucket(period, now)));
  // Invalidate read cache so the next GET sees the fresh count immediately
  const cache = globalThis.__gsaRankingDeltaCache;
  if (cache) for (const key of keys) delete cache[key];

  const res = await callSheetsWebhook({ action: "rank_incr", promptId, keys }, SHEET_WRITE_TIMEOUT_MS);
  if (res?.ok) return true;
  if (isUnknownAction(res)) return incrementLegacySheets(promptId, now);
  return false;
}

/**
 * Bumps the community post's own `copies` column, which also proves the post exists.
 * Returns "missing" only when the sheet answered that no such post exists.
 */
async function recordCommunityCopy(promptId: string): Promise<"ok" | "missing" | "unknown"> {
  if (!getSheetsConfig().enabled) return "unknown";
  const res = await callSheetsWebhook({ action: "copy", id: promptId }, SHEET_WRITE_TIMEOUT_MS);
  if (res?.ok) return "ok";
  if (res && res.error === "not found") return "missing";
  return "unknown";
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
      fresh[period] = { bucket: entry.bucket, counts: sanitizeCounts(entry.counts) };
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

  // Same order the home page passes to the client, so both compute the same baselines.
  const ranked = buildRankedPrompts(await listPrompts(), period, deltas, {}, 5);
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

  // Only posts that really exist may get counter rows; otherwise anyone could mint
  // unlimited rows with made-up `user-` ids.
  if (!STATIC_PROMPT_IDS.has(promptId) && (await recordCommunityCopy(promptId)) === "missing") {
    return NextResponse.json({ ok: false, error: "Unknown promptId" }, { status: 404 });
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

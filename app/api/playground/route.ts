import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { validateSvgArtwork } from "@/lib/svg-artwork";
import { CATEGORIES, type Category, type LibraryPrompt } from "@/lib/prompt-library";
import {
  SEED_PLAYGROUND_PROMPTS,
  VISUAL_VARIANTS,
  type PlaygroundPrompt,
} from "@/lib/playground";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;
const LIST_CACHE_MS = 30_000;
const LIST_TIMEOUT_MS = 4_000;
const WRITE_TIMEOUT_MS = 12_000;

const STORE_FILE = path.join(process.cwd(), ".next", "cache", "playground-store.json");

function getWebhookConfig() {
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

let memoryStore: PlaygroundPrompt[] | null = null;
let nextListRefresh = 0;
let listRefresh: Promise<boolean> | null = null;
let hasRemoteList = false;
let storeVersion = 0;

function readLocalStore(): PlaygroundPrompt[] {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch {
    // Ignore file read errors on read-only serverless filesystems
  }
  memoryStore = [...SEED_PLAYGROUND_PROMPTS];
  return memoryStore;
}

function writeLocalStore(items: PlaygroundPrompt[]) {
  storeVersion += 1;
  memoryStore = items;
  try {
    fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(items, null, 2), "utf8");
  } catch {
    // Ignore file write errors on read-only serverless filesystems
  }
}

function mergeWithSeeds(sheetPrompts: PlaygroundPrompt[]): PlaygroundPrompt[] {
  const sheetIds = new Set(sheetPrompts.map((p) => p.id));
  const remainingSeeds = SEED_PLAYGROUND_PROMPTS.filter((seed) => !sheetIds.has(seed.id));
  return [...sheetPrompts, ...remainingSeeds];
}

async function callAppsScript(payload: Record<string, unknown>) {
  const { url, secret, enabled } = getWebhookConfig();
  if (!enabled) return null;

  const started = Date.now();
  const action = payload.action;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, secret }),
      cache: "no-store",
      signal: AbortSignal.timeout(action === "list" ? LIST_TIMEOUT_MS : WRITE_TIMEOUT_MS),
    });
    const data = await res.json() as {
      ok?: boolean;
      error?: string;
      prompts?: PlaygroundPrompt[];
      prompt?: PlaygroundPrompt;
    };
    console.info("playground.webhook", {
      action, durationMs: Date.now() - started, status: res.status, ok: res.ok && data.ok === true,
    });
    return res.ok ? data : null;
  } catch (error) {
    console.warn("playground.webhook", {
      action, durationMs: Date.now() - started, error: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

async function refreshList() {
  const version = storeVersion;
  const data = await callAppsScript({ action: "list" });
  if (!data?.ok || !Array.isArray(data.prompts) || version !== storeVersion) {
    hasRemoteList = false;
    nextListRefresh = Date.now() + 5_000;
    return false;
  }
  writeLocalStore(mergeWithSeeds(data.prompts));
  hasRemoteList = true;
  nextListRefresh = Date.now() + LIST_CACHE_MS;
  return true;
}

export async function GET() {
  const { enabled } = getWebhookConfig();
  let fresh = enabled && hasRemoteList && Date.now() < nextListRefresh;
  if (enabled && (listRefresh || Date.now() >= nextListRefresh)) {
    listRefresh ??= refreshList().finally(() => { listRefresh = null; });
    fresh = await listRefresh;
  }
  return NextResponse.json({
    prompts: readLocalStore(),
    storage: fresh ? "google-sheets" : enabled ? "fallback-cache" : "local-memory",
  }, {
    headers: { "Cache-Control": fresh ? "public, max-age=0, s-maxage=10" : "no-store" },
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "create";
  const { enabled } = getWebhookConfig();
  const items = [...readLocalStore()];

  if (action === "copy" || action === "like") {
    const id = typeof body.id === "string" ? body.id : "";
    const target = items.find((item) => item.id === id);
    if (!target) {
      return NextResponse.json({ error: "프롬프트를 찾을 수 없습니다." }, { status: 404 });
    }

    if (enabled) {
      try {
        const seed = SEED_PLAYGROUND_PROMPTS.find((s) => s.id === id);
        const remote = await callAppsScript({ action, id, seed });
        if (remote?.ok && remote.prompt) {
          const saved = remote.prompt;
          const next = readLocalStore().map((item) => (item.id === id ? saved : item));
          writeLocalStore(next);
          return NextResponse.json({ ok: true, prompt: remote.prompt, storage: "google-sheets" });
        }
      } catch {
        // Fall through to local update
      }
    }

    const current = readLocalStore();
    const latest = current.find((item) => item.id === id);
    if (!latest) return NextResponse.json({ error: "프롬프트를 찾을 수 없습니다." }, { status: 404 });
    const updated = { ...latest, copies: latest.copies + Number(action === "copy"), likes: latest.likes + Number(action === "like") };
    writeLocalStore(current.map((item) => item.id === id ? updated : item));
    return NextResponse.json({ ok: true, prompt: updated });
  }

  if (action === "delete") {
    const id = typeof body.id === "string" ? body.id : "";
    if (enabled) {
      try {
        await callAppsScript({ action: "delete", id });
      } catch {
        // Ignore remote error and still clean local cache
      }
    }
    const next = readLocalStore().filter((item) => item.id !== id);
    writeLocalStore(next);
    return NextResponse.json({ ok: true });
  }

  // action === "create"
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 60) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 140) : "";
  const promptBody = typeof body.body === "string" ? body.body.trim().slice(0, 4000) : "";
  const author = (typeof body.author === "string" ? body.author.trim().slice(0, 20) : "") || "익명 학우";
  const category: Category = CATEGORIES.includes(body.category as Category)
    ? (body.category as Category)
    : "릴스·카드뉴스";
  const validVariants = VISUAL_VARIANTS.map((v) => v.id);
  const variant: LibraryPrompt["thumbnail"]["variant"] = validVariants.includes(
    body.variant as LibraryPrompt["thumbnail"]["variant"]
  )
    ? (body.variant as LibraryPrompt["thumbnail"]["variant"])
    : "orbit";

  if (title.length < 2) {
    return NextResponse.json({ error: "제목을 2자 이상 입력해 주세요." }, { status: 400 });
  }
  if (promptBody.length < 10) {
    return NextResponse.json({ error: "프롬프트 본문을 10자 이상 입력해 주세요." }, { status: 400 });
  }

  const created: PlaygroundPrompt = {
    id: typeof body.requestId === "string" && /^[a-f0-9-]{36}$/.test(body.requestId)
      ? `user-${body.requestId}`
      : `user-${crypto.randomUUID()}`,
    title,
    description: description || `${author}님이 공유한 ${category} 프롬프트입니다.`,
    body: promptBody,
    category,
    author,
    variant,
    artwork: typeof body.artwork === "string" && body.artwork.length <= 44000 &&
      (/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(body.artwork) || validateSvgArtwork(body.artwork))
      ? body.artwork : undefined,
    copies: 0,
    likes: 1,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  if (enabled) {
    const remote = await callAppsScript({ action: "create", prompt: created });
    if (!remote?.ok || !remote.prompt) {
      return NextResponse.json(
        { error: "공유 저장을 확인하지 못했어요. 잠시 뒤 다시 등록해 주세요." },
        { status: 503 },
      );
    }
    const saved = remote.prompt;
    writeLocalStore([saved, ...readLocalStore().filter((item) => item.id !== saved.id)]);
    return NextResponse.json({ ok: true, prompt: saved, storage: "google-sheets" });
  }

  const existing = items.find((item) => item.id === created.id);
  if (existing) return NextResponse.json({ ok: true, prompt: existing, storage: "local-memory" });
  const next = [created, ...items];
  writeLocalStore(next);
  return NextResponse.json({ ok: true, prompt: created, storage: "local-memory" });
}

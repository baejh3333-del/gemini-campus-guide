import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES, type Category, type LibraryPrompt } from "@/lib/prompt-library";
import {
  SEED_PLAYGROUND_PROMPTS,
  VISUAL_VARIANTS,
  type PlaygroundPrompt,
} from "@/lib/playground";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_FILE = path.join(process.cwd(), ".next", "cache", "playground-store.json");

let memoryStore: PlaygroundPrompt[] | null = null;

function readStore(): PlaygroundPrompt[] {
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

function writeStore(items: PlaygroundPrompt[]) {
  memoryStore = items;
  try {
    fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(items, null, 2), "utf8");
  } catch {
    // Ignore file write errors on read-only serverless filesystems; memoryStore keeps it alive
  }
}

export async function GET() {
  const items = readStore();
  return NextResponse.json({ prompts: items });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "create";
  const items = [...readStore()];

  if (action === "copy" || action === "like") {
    const id = typeof body.id === "string" ? body.id : "";
    const target = items.find((item) => item.id === id);
    if (!target) {
      return NextResponse.json({ error: "프롬프트를 찾을 수 없습니다." }, { status: 404 });
    }
    if (action === "copy") target.copies += 1;
    if (action === "like") target.likes += 1;
    writeStore(items);
    return NextResponse.json({ ok: true, prompt: target });
  }

  if (action === "delete") {
    const id = typeof body.id === "string" ? body.id : "";
    const next = items.filter((item) => item.id !== id);
    writeStore(next);
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
    id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    description: description || `${author}님이 공유한 ${category} 프롬프트입니다.`,
    body: promptBody,
    category,
    author,
    variant,
    copies: 0,
    likes: 1,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  const next = [created, ...items];
  writeStore(next);
  return NextResponse.json({ ok: true, prompt: created });
}

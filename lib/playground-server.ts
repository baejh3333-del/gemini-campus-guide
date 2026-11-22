import fs from "node:fs";
import path from "node:path";
import { SEED_PLAYGROUND_PROMPTS, type PlaygroundPrompt } from "@/lib/playground";
import type { LibraryPrompt } from "@/lib/prompt-library";
import { isRankingRowId } from "@/lib/ranking";

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

export async function findDynamicPlaygroundPrompt(id: string): Promise<LibraryPrompt | undefined> {
  if (!id || isRankingRowId(id)) return undefined;
  let candidates: PlaygroundPrompt[] = [...SEED_PLAYGROUND_PROMPTS];

  try {
    if (fs.existsSync(STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
      if (Array.isArray(parsed)) {
        candidates = parsed;
      }
    }
  } catch {
    // ignore
  }

  let found = candidates.find((p) => p.id === id);

  if (!found) {
    const { url, secret, enabled } = getWebhookConfig();
    if (enabled) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "list", secret }),
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as { ok?: boolean; prompts?: PlaygroundPrompt[] };
          if (data?.ok && Array.isArray(data.prompts)) {
            found = data.prompts.find((p) => p.id === id);
          }
        }
      } catch {
        // ignore
      }
    }
  }

  if (!found) return undefined;

  return {
    id: found.id,
    title: found.title,
    description: found.description,
    body: found.body,
    steps: [
      "아래 프롬프트를 복사하거나 Gemini 열기 버튼을 누르세요.",
      "파란 표시 [항목]이 있다면 내 상황에 맞게 내용을 바꿔 입력해 보세요.",
    ],
    category: found.category,
    kind: "prompt",
    isCommunity: true,
    author: found.author,
    thumbnail: { variant: found.variant, src: found.artwork, alt: `${found.title} 썸네일` },
    copyCount: found.copies,
  };
}

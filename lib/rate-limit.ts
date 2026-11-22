import { createHash } from "node:crypto";
import { incrementKvCounter } from "@/lib/kv";

/**
 * Fixed-window counter shared across serverless instances when KV is configured.
 * Without KV it falls back to this instance's memory, which resets on cold start.
 */

type MemoryEntry = { count: number; resetAt: number };

const globalForRateLimit = globalThis as typeof globalThis & {
  __gsaRateLimitMap?: Map<string, MemoryEntry>;
};

const memoryCounters =
  globalForRateLimit.__gsaRateLimitMap ??
  (globalForRateLimit.__gsaRateLimitMap = new Map<string, MemoryEntry>());

function incrementMemoryCounter(key: string, resetAt: number, now: number): number {
  if (memoryCounters.size > 5000) {
    for (const [entryKey, entry] of memoryCounters) {
      if (now >= entry.resetAt) memoryCounters.delete(entryKey);
    }
  }
  const entry = memoryCounters.get(key);
  if (entry && now < entry.resetAt) {
    entry.count += 1;
    return entry.count;
  }
  memoryCounters.set(key, { count: 1, resetAt });
  return 1;
}

/** Counts one hit for `key` in the current window and returns the hit count so far in that window. */
export async function hitRateLimit(key: string, windowMs: number): Promise<number> {
  const now = Date.now();
  const windowIndex = Math.floor(now / windowMs);
  const windowKey = `${key}:${windowIndex}`;
  const resetAt = (windowIndex + 1) * windowMs;

  // The window index is part of the key, so a missed EXPIRE can never block a key forever.
  const shared = await incrementKvCounter(`gsa:rl:${windowKey}`, Math.ceil(windowMs / 1000) + 60);
  if (shared !== null) return shared;
  return incrementMemoryCounter(windowKey, resetAt, now);
}

/** Stable, non-reversible client key so raw IP addresses are never stored. */
export function hashClientKey(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

/**
 * Optional Vercel KV / Upstash Redis REST adapter (server only).
 * Every helper returns null when KV is not configured or the call fails, so callers can fall back.
 */

const DEFAULT_KV_TIMEOUT_MS = 2_500;

export function getKvConfig() {
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

export async function runKvCommand<T = unknown>(
  command: (string | number)[],
  timeoutMs: number = DEFAULT_KV_TIMEOUT_MS,
): Promise<T | null> {
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
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: T; error?: string };
    if (data.error) return null;
    return data.result ?? null;
  } catch {
    return null;
  }
}

/** INCR a counter and give it a TTL on first use. Returns the new value, or null if KV is unavailable. */
export async function incrementKvCounter(key: string, ttlSeconds: number): Promise<number | null> {
  const next = await runKvCommand<number>(["INCR", key]);
  if (typeof next !== "number" || !Number.isFinite(next)) return null;
  if (next === 1) void runKvCommand(["EXPIRE", key, ttlSeconds]);
  return next;
}

/**
 * In-memory rate limiter for API route protection.
 *
 * Uses a sliding-window counter stored in a Map. Entries are lazily pruned on
 * access so the Map doesn't grow unbounded for inactive keys.
 *
 * For a horizontally-scaled deployment, replace the in-memory Map with a
 * Redis-backed implementation (e.g. @upstash/ratelimit or ioredis INCR/EXPIRE).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically prune stale entries (every 60 s) to avoid memory leak
const PRUNE_INTERVAL_MS = 60_000;
let lastPrune = Date.now();

function pruneStaleEntries(): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and consume one token from the rate limiter.
 *
 * @param key    Unique identifier (e.g. `"register:${ip}"` or `"episodes:${userId}"`)
 * @param limit  Maximum requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  pruneStaleEntries();

  const now = Date.now();
  const entry = store.get(key);

  // First request or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  // Within window — check limit
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/** Build rate-limit headers for the response. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  };
}

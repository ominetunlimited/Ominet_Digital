/**
 * A tiny, dependency-free fixed-window rate limiter for public API routes
 * (image generation, search, analytics beacons). No database round-trip, so it
 * adds no latency to the hot path and can't be turned into a DB-amplification
 * vector the way a "count rows first" check could.
 *
 * IMPORTANT (serverless reality): on Vercel each function instance keeps its
 * own in-memory map, so the effective limit is per-instance, not global. That's
 * a solid baseline that stops a single abusive client from monopolising one
 * instance, but a determined distributed flood needs a shared store. For a
 * hard, global guarantee in front of the whole site, put rate limiting at the
 * edge (Vercel Firewall / a CDN or WAF rule) or back this with a shared store
 * such as Upstash Redis — see SECURITY.md.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * Record a hit against `key` and report whether it's within `limit` per
 * `windowMs`. Returns retryAfterSec (>= 1) when the caller is over the limit.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic sweep at most once a minute so the map can't grow forever.
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  return { ok: true };
}

/**
 * A stable per-caller key for a route. Prefers the left-most x-forwarded-for
 * hop (the client IP as the platform reports it) and falls back to x-real-ip.
 * Only ever a coarse identity for throttling — never used for auth.
 */
export function clientKey(request: Request, route: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "anon";
  return `${route}:${ip}`.slice(0, 128);
}

/** Same idea as clientKey, for Server Actions where there is no Request object. */
export async function actionKey(route: string): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
  return `${route}:${ip}`.slice(0, 128);
}

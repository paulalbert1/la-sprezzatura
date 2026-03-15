/**
 * Reusable in-memory rate limiter.
 * Tracks request counts per IP with a sliding window.
 * Throws a generic Error (not ActionError) so it can be used outside Astro Actions.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  /** Maximum requests allowed in the window (default: 3) */
  maxRequests?: number;
  /** Window duration in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
}

export function checkRateLimit(
  ip: string,
  options?: RateLimitOptions,
): void {
  const maxRequests = options?.maxRequests ?? 3;
  const windowMs = options?.windowMs ?? 60_000;
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (entry) {
    if (now < entry.resetAt) {
      if (entry.count >= maxRequests) {
        throw new Error("Too many requests");
      }
      entry.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
  }
}

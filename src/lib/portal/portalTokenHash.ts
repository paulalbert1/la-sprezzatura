import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Deterministic one-way hash of a client portalToken.
 *
 * Used to detect token rotation in the middleware PURL-session check:
 * on every /portal/* request the middleware re-fetches client.portalToken,
 * hashes it, and compares to the session-stored hash. A mismatch means
 * the token was regenerated and the session must be invalidated.
 *
 * No salt — we're comparing our own stored hash to a fresh hash of the
 * same value on every request, not authenticating an external password.
 *
 * Output: SHA-256 base64 (44 chars). Deterministic across processes, so
 * two independent middleware invocations will derive identical hashes
 * from the same token.
 *
 * Phase 34 Plan 06 — T-34-06, T-34-07, T-34-08.
 */
export function hashPortalToken(token: string): string {
  return createHash("sha256").update(token).digest("base64");
}

/**
 * Constant-time comparison of two SHA-256 base64 hashes.
 *
 * Middleware uses this to compare a session-stored portalTokenHash
 * against the hash derived from the current client.portalToken. A
 * constant-time check prevents a timing side-channel that could leak
 * hash-prefix information to an attacker probing the PURL endpoint.
 *
 * Short-circuits to false on length mismatch, which is safe because
 * hashPortalToken always returns a fixed-length string (SHA-256 base64
 * is exactly 44 characters for a non-empty input).
 */
export function timingSafeEqualHash(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

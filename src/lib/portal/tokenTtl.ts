// src/lib/portal/tokenTtl.ts
// Phase 48 -- TTL source-of-truth for portal magic-link tokens (D-04, D-05).
//
// EMAIL-05 invariant: the seconds value used at the redis.set(..., { ex: N })
// mint site MUST equal the seconds value reflected in the rendered email body.
// Both sides import from this module; drift is structurally impossible.
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-04, D-05)
//   .planning/phases/48-smaller-transactional-emails/48-RESEARCH.md §Pattern 5

/** TTL for magic links minted by /api/send-workorder-access + /api/send-building-access. */
export const MAGIC_LINK_ACCESS_TTL_SECONDS = 900;     // 15 minutes

/**
 * TTL for the long-lived work-order send link.
 * D-04: exported for forward-compat; not yet wired in Phase 48 (the existing
 * call site at src/pages/api/admin/work-orders/[id]/send.ts:139 still uses a
 * literal 604800). Migration deferred to a future phase per Open Question 2.
 */
export const WORK_ORDER_SEND_TTL_SECONDS = 604800;    // 7 days

/**
 * Render seconds as human-readable copy embedded in the email body.
 * Both mint and template import this; the literal copy is derived from the
 * seconds value, never duplicated.
 */
export function formatExpiryCopy(seconds: number): string {
  if (seconds < 60) return `This link expires in ${seconds} seconds.`;
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `This link expires in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }
  if (seconds < 86400) {
    const hours = Math.round(seconds / 3600);
    return `This link expires in ${hours} hour${hours === 1 ? "" : "s"}.`;
  }
  const days = Math.round(seconds / 86400);
  return `This link expires in ${days} day${days === 1 ? "" : "s"}.`;
}

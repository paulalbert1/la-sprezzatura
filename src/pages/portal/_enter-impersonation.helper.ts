/**
 * Phase 49 Plan 05 — cookie-hop redeem helper.
 *
 * The pure-function core of `/portal/_enter-impersonation`. Extracted from the
 * .astro frontmatter so it is unit-testable (Astro pages do not reliably
 * support `import { fn } from './page.astro'`). The .astro shim translates
 * the returned `{ kind:'redirect', to }` into `Astro.redirect(to)`.
 *
 * Order-of-operations is load-bearing (Pitfall G):
 *
 *   1. Read token query param.                  (missing → impersonation-expired)
 *   2. redeemImpersonationToken(token)          (null → impersonation-expired;
 *                                                 internally uses redis.getdel
 *                                                 + Pitfall A defensive parser)
 *   3. Capture admin's portal_session cookie.   (missing → impersonation-failed)
 *   4. getSession(cookies) for adminSession.    (null → impersonation-failed)
 *   5. redis.expire on admin session BEFORE     (any throw → impersonation-failed;
 *      cookie rewrite — D-09 / Pitfall G.       NEVER fire-and-forget)
 *      TTL = max(adminTtlRemaining, 1860).
 *   6. createImpersonationSession — writes the  (writes portal_session cookie
 *      new portal_session cookie + Redis        as a side effect; D-06 cookie
 *      session (Plan 03 / D-09).                hop happens HERE in the new tab)
 *   7. Compute role-based dashboard:            client→/portal/dashboard,
 *                                                contractor→/workorder/dashboard,
 *                                                building_manager→/building/dashboard.
 *   8. Return { kind: 'redirect', to: dashboard }.
 *
 * Cross-tab cookie-hop note (Pitfall B): this route writes the cookie ONLY in
 * the NEW tab's response chain — the admin's tab is byte-identical to before
 * mint (D-06). Cross-subdomain warning is a v5.4 deferral.
 *
 * See .planning/phases/49-impersonation-architecture/49-CONTEXT.md
 * (D-06, D-08, D-09) and 49-RESEARCH.md (Pitfall A, Pitfall G).
 */
import type { AstroCookies } from "astro";

import { redis } from "../../lib/redis";
import {
  redeemImpersonationToken,
  createImpersonationSession,
} from "../../lib/auth/impersonation";
import { getSession } from "../../lib/session";

export type RedeemResult = { kind: "redirect"; to: string };

const ERR_EXPIRED = "/admin?error=impersonation-expired";
const ERR_FAILED = "/admin?error=impersonation-failed";

const ADMIN_TTL_FLOOR_SEC = 1860; // 30 min + 60s buffer (D-09)

const COOKIE_NAME = "portal_session";

export interface ProcessRedeemArgs {
  token: string | null;
  cookies: AstroCookies;
}

/**
 * Pure-ish helper: deterministic input → output (cookie write is a side effect
 * inside `createImpersonationSession`, which is mocked in tests). Always
 * returns a redirect descriptor — never throws.
 */
export async function processImpersonationRedeem(
  args: ProcessRedeemArgs,
): Promise<RedeemResult> {
  const { token, cookies } = args;

  // 1. Token presence.
  if (!token) {
    return { kind: "redirect", to: ERR_EXPIRED };
  }

  // 2. Atomic one-shot redeem (Plan 03 owns the getdel + Pitfall A parser).
  const redeemed = await redeemImpersonationToken(token);
  if (!redeemed) {
    return { kind: "redirect", to: ERR_EXPIRED };
  }
  const { payload } = redeemed;

  // 3. Capture admin's current portal_session cookie BEFORE any side effects.
  // Required for D-15 originalAdminSessionToken stash + D-09 redis.expire.
  const adminToken = cookies.get(COOKIE_NAME)?.value;
  if (!adminToken) {
    return { kind: "redirect", to: ERR_FAILED };
  }

  // 4. Resolve admin SessionData — needed by createImpersonationSession to
  // preserve adminEntityId / tenantId / mintedAt invariants (Plan 03 / D-01).
  const adminSession = await getSession(cookies);
  if (!adminSession) {
    return { kind: "redirect", to: ERR_FAILED };
  }

  // 5. EXPIRE the admin session BEFORE rewriting the cookie (Pitfall G).
  // Order matters: if expire fails, we abort BEFORE createImpersonationSession
  // overwrites portal_session. The mint URL is already consumed (getdel), but
  // the admin can re-mint — better than leaving a broken cookie state.
  try {
    const adminTtl = await redis.ttl(`session:${adminToken}`);
    const newTtl = Math.max(
      typeof adminTtl === "number" && adminTtl > 0 ? adminTtl : 0,
      ADMIN_TTL_FLOOR_SEC,
    );
    await redis.expire(`session:${adminToken}`, newTtl);
  } catch {
    return { kind: "redirect", to: ERR_FAILED };
  }

  // 6. Mint the wrapped admin session — this is the cookie-hop write.
  // createImpersonationSession (Plan 03) writes both the Redis session key
  // and the portal_session cookie; the new tab's response chain is the only
  // place this cookie changes (D-06).
  await createImpersonationSession(cookies, adminSession, payload, adminToken);

  // 7. Role-based dashboard dispatch.
  const role = payload.role;
  const to =
    role === "contractor"
      ? "/workorder/dashboard"
      : role === "building_manager"
        ? "/building/dashboard"
        : "/portal/dashboard";

  return { kind: "redirect", to };
}

/**
 * Phase 49 Plan 06 — POST /api/admin/logout (D-20 admin logout with
 * impersonation-aware cleanup).
 *
 * Two paths:
 *  - Non-impersonating: existing logout semantics — clearSession (cookie +
 *    fire-and-forget Redis delete of the active session token). 200 success.
 *  - Impersonating (D-20): admin chose to nuke their session entirely while
 *    in an impersonation tab. BOTH halves go:
 *      1. Write 'admin-logout' audit doc via Plan 03 helper. AWAITED.
 *      2. Delete the impersonation Redis key.
 *      3. Delete the original admin session Redis key (clearSession only
 *         knows about the cookie's current value, not the original token
 *         stashed inside session.impersonating).
 *      4. clearSession (cookie clear).
 *
 * Ordering matters (D-20 + RESEARCH Pitfall E): the audit doc MUST be
 * durable BEFORE Redis state is destroyed. If the audit write fails, we
 * return 500 and leave Redis intact — admin can retry. Silent fire-and-
 * forget would let an admin logout succeed with no audit row, violating
 * IMPER-06's "every impersonation has an exit row OR a timeout row".
 *
 * See .planning/phases/49-impersonation-architecture/49-06-PLAN.md and
 * 49-CONTEXT.md (D-20). Pitfall E: never fire-and-forget the audit write.
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { redis } from "../../../lib/redis";
import { getSession, clearSession } from "../../../lib/session";
import {
  writeAdminLogoutAuditDoc,
  hashImpersonationToken,
} from "../../../lib/auth/impersonation";

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);

  // D-20 impersonation path — only when ALL of the following hold:
  //   - session resolved
  //   - session.impersonating present
  //   - session.tenantId present (audit-doc requires tenantId)
  //   - portal_session cookie still set (we need its value for sessionIdHash
  //     and the impersonation-key Redis delete)
  // If any guard fails we fall through to the plain logout path.
  if (session?.impersonating && session.tenantId) {
    const currentToken = cookies.get("portal_session")?.value;
    if (currentToken) {
      const sessionIdHash = hashImpersonationToken(currentToken);
      const payload = {
        role: session.impersonating.role,
        entityId: session.impersonating.entityId,
        projectId: session.impersonating.projectId,
        tenantId: session.impersonating.tenantId,
        adminEmail: session.impersonating.adminEmail,
        adminEntityId: session.entityId, // D-01 — admin identity preserved
        mintedAt: session.impersonating.mintedAt,
        // Denormalized fields are nice-to-have on the exit row; empty-string
        // fallbacks match the manual-exit endpoint (Phase 50 may add a fresh
        // GROQ here if Liz wants the exit-row names to match start-row names).
        targetEntityName: "",
        projectName: "",
      };

      // Pitfall E: audit doc MUST be durable BEFORE we destroy Redis state.
      // If the Sanity write fails, we bail with 500 — admin can retry, and
      // no Redis cleanup happens (preserving the chance to fix and log it).
      try {
        await writeAdminLogoutAuditDoc(
          session.tenantId,
          sessionIdHash,
          payload,
        );
      } catch {
        return jsonResponse({ error: "Logout failed" }, 500);
      }

      // Both halves go (D-20). Parallel + awaited.
      await Promise.all([
        redis.del(`session:${currentToken}`),
        redis.del(
          `session:${session.impersonating.originalAdminSessionToken}`,
        ),
      ]);
    }
  }

  // Plain logout path (or fall-through after impersonation cleanup):
  // clearSession handles the cookie delete + a fire-and-forget Redis delete
  // of whatever session: key the cookie currently points at. Safe no-op
  // when the cookie is already gone.
  clearSession(cookies);
  return jsonResponse({ success: true }, 200);
};

/**
 * Phase 49 Plan 06 — POST /api/admin/impersonate/exit (manual exit endpoint).
 *
 * Thin controller around `exitImpersonation` (Plan 03 helper). The helper
 * does all the work:
 *   - Verifies the original admin session still resolves in Redis (D-15)
 *   - Restores the admin cookie with the remaining TTL (60s floor)
 *   - Deletes the impersonation Redis key (awaited — race-critical)
 *   - Writes the 'manual' exit audit doc + deletes the timeout doc (D-18)
 *   - On D-16 edge case (admin session gone): clears cookie + returns
 *     { ok: false, reason: 'session-expired' } so the UI (Phase 50) can
 *     redirect to /admin/login?reason=session-expired
 *
 * No direct Redis or Sanity access here — all flows through Plan 03.
 *
 * See .planning/phases/49-impersonation-architecture/49-06-PLAN.md and
 * 49-CONTEXT.md (D-15, D-16, D-18).
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/session";
import {
  exitImpersonation,
  hashImpersonationToken,
} from "../../../../lib/auth/impersonation";

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!session.impersonating) {
    // D-13 read-only gate is enforced by middleware; this 401 is the
    // "called the exit endpoint while not impersonating" guard. Reuse the
    // same status (401) since callers should never hit this in practice.
    return jsonResponse({ error: "Not impersonating" }, 401);
  }

  const currentToken = cookies.get("portal_session")?.value;
  if (!currentToken) {
    // Session resolved but cookie is gone — should be impossible, fail closed.
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const tenantId = session.tenantId;
  if (!tenantId) {
    return jsonResponse({ error: "No tenant context" }, 403);
  }

  const sessionIdHash = hashImpersonationToken(currentToken);

  // Build the ImpersonationPayload shape expected by Plan 03's exit helper.
  // adminEntityId comes from session.entityId (which STAYS admin per D-01).
  // targetEntityName + projectName are denormalized in the audit doc but
  // are not strictly required for the exit row's lookup; pass empty-string
  // fallbacks. Phase 50 can add a fresh GROQ here if Liz wants the exit-row
  // names to match the start-row names.
  const payload = {
    role: session.impersonating.role,
    entityId: session.impersonating.entityId,
    projectId: session.impersonating.projectId,
    tenantId: session.impersonating.tenantId,
    adminEmail: session.impersonating.adminEmail,
    adminEntityId: session.entityId, // D-01 — admin identity preserved
    mintedAt: session.impersonating.mintedAt,
    targetEntityName: "",
    projectName: "",
  };

  const result = await exitImpersonation(
    cookies,
    currentToken,
    session.impersonating.originalAdminSessionToken,
    tenantId,
    sessionIdHash,
    payload,
  );

  // Both result shapes are 200; the UI reads `ok: false` + `reason` to
  // decide whether to redirect to /admin/login?reason=session-expired (D-16).
  return jsonResponse(result, 200);
};

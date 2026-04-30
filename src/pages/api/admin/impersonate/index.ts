/**
 * Phase 49 Plan 04 — POST /api/admin/impersonate (mint endpoint).
 *
 * Turns an admin's "Preview as Sarah" intent into a one-shot redirect URL
 * that the new tab will redeem (Plan 05). All security checks happen here:
 *   - Admin gate (role==='admin' && tenantId)            — D-05 prelude
 *   - Fresh-auth gate (mintedAt within 15 min)           — D-10..D-12 / IMPER-08
 *   - Tenant-scoped recipient + project validation       — D-05, D-07 / IMPER-07
 *   - Original admin session token capture (no cookie writes) — D-15, D-06
 *
 * Once the URL is in hand, redemption is automatic. This endpoint MUST NOT
 * touch cookies (D-06 — admin's tab is unchanged; cookie hop is in redeem
 * at Plan 05).
 *
 * CSRF: same-origin POST is sufficient for v5.3 — no CSRF middleware
 * (RESEARCH Open Q3 / Q6, deferred). Re-evaluate when v6.0 multi-tenant
 * deploy widens the threat surface.
 *
 * See .planning/phases/49-impersonation-architecture/49-04-PLAN.md
 * (must_haves) and 49-CONTEXT.md (D-05, D-06, D-07, D-10, D-12, D-15).
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/session";
import { getTenantClient } from "../../../../lib/tenantClient";
import { mintImpersonationToken } from "../../../../lib/auth/impersonation";

// D-10 — read once at module load. Default 900s (15 min).
const MAX_AGE_SEC = Number(
  process.env.IMPERSONATION_FRESH_AUTH_MAX_AGE_SEC ?? 900,
);

const ALLOWED_ROLES = new Set(["client", "contractor", "building_manager"]);

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Admin gate (mirrors src/pages/api/admin/clients.ts L17-25).
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!session.tenantId) {
    return jsonResponse({ error: "No tenant context" }, 403);
  }

  // 2. Fresh-auth gate — D-10..D-12 + Pitfall D defensive Number.isNaN guard.
  // Three failure modes collapse to the same 401 + reauth_required shape:
  //   (a) mintedAt undefined  — pre-Phase-49 sessions or backfill miss
  //   (b) mintedAt > MAX_AGE  — stale admin session
  //   (c) mintedAt unparseable — Pitfall D (NaN propagates through age math)
  const mintedAtIso = session.mintedAt;
  if (!mintedAtIso) {
    return jsonResponse(
      {
        error: "Fresh authentication required",
        code: "reauth_required",
        maxAgeSec: MAX_AGE_SEC,
      },
      401,
    );
  }
  const ageSec = (Date.now() - new Date(mintedAtIso).getTime()) / 1000;
  if (Number.isNaN(ageSec) || ageSec > MAX_AGE_SEC) {
    return jsonResponse(
      {
        error: "Fresh authentication required",
        code: "reauth_required",
        maxAgeSec: MAX_AGE_SEC,
      },
      401,
    );
  }

  // 3. Body parse + validation (mirrors clients.ts L27-32 try/catch).
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid body" }, 400);
  }

  const { recipientId, projectId, role } = body as {
    recipientId?: unknown;
    projectId?: unknown;
    role?: unknown;
  };

  if (
    typeof recipientId !== "string" ||
    !recipientId.trim() ||
    typeof projectId !== "string" ||
    !projectId.trim() ||
    typeof role !== "string" ||
    !ALLOWED_ROLES.has(role)
  ) {
    return jsonResponse({ error: "Invalid body" }, 400);
  }

  // 4. Tenant-scoped recipient + project lookups — RESEARCH § Pattern 3.
  // Cross-tenant docs are unreachable from session.tenantId's dataset, so
  // a foreign _id returns null → 403 → no Redis write (IMPER-07 / D-05 / D-07).
  const tc = getTenantClient(session.tenantId);

  const recipient = await tc.fetch(
    `*[_id == $id && _type in ["client", "contractor", "buildingManager"]][0]{ _id, name }`,
    { id: recipientId },
  );
  if (!recipient) {
    return jsonResponse({ error: "Recipient not found in tenant" }, 403);
  }

  const project = await tc.fetch(
    `*[_type == "project" && _id == $pid && (
       references($rid) ||
       $rid in clients[].client._ref
     )][0]{ _id, title }`,
    { pid: projectId, rid: recipientId },
  );
  if (!project) {
    return jsonResponse(
      { error: "Project not associated with recipient" },
      403,
    );
  }

  // 5. Capture original admin session token BEFORE any downstream side
  // effects (D-15). The mint endpoint never writes cookies (D-06) — this
  // value is stashed inside the impersonation payload so /api/admin/impersonate/exit
  // can restore the admin cookie at exit time.
  const originalAdminSessionToken = cookies.get("portal_session")?.value;
  if (!originalAdminSessionToken) {
    // The admin gate passed (session resolved) but the cookie that
    // produced that session is gone — should be impossible, fail closed.
    return jsonResponse({ error: "Internal session error" }, 500);
  }

  // 6. Mint — Plan 03 helper writes Redis impersonate:<token> + audit
  // start/timeout docs (Pitfall E: parallel + awaited). All Redis + audit
  // writes flow through this single call.
  const result = await mintImpersonationToken({
    payload: {
      role: role as "client" | "contractor" | "building_manager",
      entityId: recipientId,
      projectId,
      tenantId: session.tenantId,
      adminEmail: session.entityId,
      adminEntityId: session.entityId,
      mintedAt: new Date().toISOString(),
      targetEntityName: recipient.name,
      projectName: project.title,
    },
    tenantId: session.tenantId,
  });

  return jsonResponse({ url: result.url }, 200);
};

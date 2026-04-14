// Phase 36 PROJ-04 -- auto-archive completed projects 90 days after completedAt.
// Vercel Cron sends GET with `Authorization: Bearer ${CRON_SECRET}`.
// Per Phase 36 D-12 we ALSO accept `x-cron-secret: ${CRON_SECRET}` so the
// endpoint can be hit manually (curl from local) without forging the
// Authorization header. Either header satisfies the gate; both are checked
// against the same secret.
export const prerender = false;

import type { APIRoute } from "astro";
import { getTenantClient } from "../../../lib/tenantClient";
import { getAllTenantIds } from "../../../lib/tenants";

// 90 days in seconds -- used directly in the GROQ dateTime() math.
const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60; // 7_776_000

interface PerTenantResult {
  tenantId: string;
  archived: number;
  error?: string;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  const customHeader = request.headers.get("x-cron-secret");
  if (authHeader === `Bearer ${secret}`) return true;
  if (customHeader === secret) return true;
  return false;
}

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startedAt = Date.now();
  const nowIso = new Date().toISOString();
  const tenantIds = getAllTenantIds();
  const perTenant: PerTenantResult[] = [];
  let total = 0;

  // Per CONTEXT D-05: GROQ filter pipelineStage == "completed" && !defined(archivedAt)
  // && completedAt <= dateTime(now()) - 7776000.
  // We fetch the eligible _ids per tenant, then patch each in a single
  // transaction (Sanity transactions support multi-doc patches; we use
  // client.transaction() to satisfy "single transaction" intent).
  const ELIGIBLE_QUERY = `*[
    _type == "project" &&
    pipelineStage == "completed" &&
    !defined(archivedAt) &&
    defined(completedAt) &&
    dateTime(completedAt) <= dateTime(now()) - $thresholdSeconds
  ]{ _id }`;

  for (const tenantId of tenantIds) {
    try {
      const client = getTenantClient(tenantId);
      const eligible = (await client.fetch(ELIGIBLE_QUERY, {
        thresholdSeconds: NINETY_DAYS_SECONDS,
      })) as Array<{ _id: string }> | null;

      const ids = (eligible ?? []).map((p) => p._id);

      if (ids.length === 0) {
        perTenant.push({ tenantId, archived: 0 });
        continue;
      }

      // Single transaction: queue a patch for every id, commit once.
      const tx = client.transaction();
      for (const id of ids) {
        tx.patch(id, (p) => p.set({ archivedAt: nowIso }));
      }
      await tx.commit();

      perTenant.push({ tenantId, archived: ids.length });
      total += ids.length;
    } catch (err) {
      console.error(`[auto-archive] Tenant ${tenantId} failed:`, err);
      perTenant.push({
        tenantId,
        archived: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const durationMs = Date.now() - startedAt;

  return new Response(
    JSON.stringify({
      status: "complete",
      ranAt: nowIso,
      tenants: perTenant,
      total,
      durationMs,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

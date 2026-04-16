export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/session";
import { getTenantClient } from "../../../../../../lib/tenantClient";

/**
 * Phase 39 Plan 01 Task 3 — Documents delete (DELETE).
 *
 * Removes the projectDocuments[] entry with matching _key via the
 * Sanity array-path unset pattern (mirrors procurement.ts L345).
 *
 * The underlying Sanity asset is NOT explicitly deleted; Sanity
 * garbage-collects unreferenced assets, matching the existing
 * artifacts convention.
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!session.tenantId) {
    return new Response(JSON.stringify({ error: "No tenant context" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const projectId = params.projectId;
  const docKey = params.docKey;

  if (!projectId || !docKey) {
    return new Response(
      JSON.stringify({ error: "Missing projectId or docKey" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const client = getTenantClient(session.tenantId);

  try {
    await client
      .patch(projectId)
      .unset([`projectDocuments[_key=="${docKey}"]`])
      .commit();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Documents] Delete failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to delete document" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

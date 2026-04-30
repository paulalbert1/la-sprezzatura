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

/**
 * PATCH a single projectDocuments[] entry. Supports two field updates:
 *   { shareableWithClient: boolean } -- gates portal visibility
 *   { label: string }                -- renames the displayed label
 *
 * Both fields are optional; the body may include either, both, or
 * neither (the latter being a no-op success). Validation rejects wrong
 * shapes so a malformed PATCH never lands on the document.
 */
export const PATCH: APIRoute = async ({ request, params, cookies }) => {
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updates: Record<string, unknown> = {};

  if ("shareableWithClient" in body) {
    if (typeof body.shareableWithClient !== "boolean") {
      return new Response(
        JSON.stringify({ error: "shareableWithClient must be a boolean" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    updates[`projectDocuments[_key=="${docKey}"].shareableWithClient`] =
      body.shareableWithClient;
  }

  if ("label" in body) {
    if (typeof body.label !== "string") {
      return new Response(JSON.stringify({ error: "label must be a string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const trimmed = body.label.trim();
    if (trimmed.length === 0) {
      return new Response(JSON.stringify({ error: "label must not be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    updates[`projectDocuments[_key=="${docKey}"].label`] = trimmed;
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = getTenantClient(session.tenantId);
  try {
    await client.patch(projectId).set(updates).commit();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Documents] PATCH failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update document" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

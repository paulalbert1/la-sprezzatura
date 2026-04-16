export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/session";
import { getTenantClient } from "../../../../lib/tenantClient";

/**
 * Phase 39 Plan 01 Task 2 — Work Order CRUD (GET/PATCH/DELETE by id).
 *
 * Auth gate mirrors src/pages/api/admin/artifact-version.ts L10-26 verbatim.
 * All reads + writes go through getTenantClient(session.tenantId) so cross-
 * tenant access is dataset-isolated (Phase 29 precedent).
 */

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "No tenant context" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = getTenantClient(session.tenantId);
  try {
    const doc = await client.fetch(
      `*[_type == "workOrder" && _id == $id][0]`,
      { id },
    );
    if (!doc) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(doc), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[WorkOrder] GET failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch work order" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const PATCH: APIRoute = async ({ request, params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const update: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (Array.isArray(body.selectedItemKeys)) {
    update.selectedItemKeys = (body.selectedItemKeys as unknown[]).filter(
      (k): k is string => typeof k === "string",
    );
  }
  if (typeof body.specialInstructions === "string") {
    update.specialInstructions = body.specialInstructions;
  }
  if (Array.isArray(body.customFields)) {
    update.customFields = body.customFields;
  }

  const client = getTenantClient(session.tenantId);
  try {
    await client.patch(id).set(update).commit();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[WorkOrder] PATCH failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update work order" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = getTenantClient(session.tenantId);
  try {
    await client.delete(id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[WorkOrder] DELETE failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to delete work order" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

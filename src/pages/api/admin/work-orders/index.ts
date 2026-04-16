export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/session";
import { getTenantClient } from "../../../../lib/tenantClient";

/**
 * Phase 39 Plan 01 Task 2 — Work Order CRUD (POST create).
 *
 * Auth gate mirrors src/pages/api/admin/artifact-version.ts L10-26 verbatim:
 *   1. require admin session
 *   2. require session.tenantId (dataset-level tenant isolation)
 *
 * Body: { projectId, contractorId, selectedItemKeys, specialInstructions, customFields }
 * Returns: { success: true, workOrderId } | { error }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
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
  const client = getTenantClient(session.tenantId);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const contractorId =
    typeof body.contractorId === "string" ? body.contractorId : "";
  const selectedItemKeys = Array.isArray(body.selectedItemKeys)
    ? (body.selectedItemKeys as unknown[]).filter(
        (k): k is string => typeof k === "string",
      )
    : [];
  const specialInstructions =
    typeof body.specialInstructions === "string" ? body.specialInstructions : "";
  const customFields = Array.isArray(body.customFields) ? body.customFields : [];

  if (!projectId || !contractorId) {
    return new Response(
      JSON.stringify({ error: "Missing projectId or contractorId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!specialInstructions.trim()) {
    return new Response(
      JSON.stringify({ error: "Special instructions are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const now = new Date().toISOString();
    const doc = await client.create({
      _type: "workOrder",
      project: { _type: "reference", _ref: projectId },
      contractor: { _type: "reference", _ref: contractorId },
      selectedItemKeys,
      specialInstructions,
      customFields,
      createdAt: now,
      updatedAt: now,
    });

    return new Response(
      JSON.stringify({ success: true, workOrderId: doc._id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[WorkOrder] Failed to create:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create work order" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

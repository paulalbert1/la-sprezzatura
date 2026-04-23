export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/session";
import { getTenantClient } from "../../../../lib/tenantClient";

const DEFAULTS = { clientApprovalDays: 10, dormancyDays: 60, revisionRounds: 1 };

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } });
}
function forbidden() {
  return new Response(JSON.stringify({ error: "No tenant context" }),
    { status: 403, headers: { "Content-Type": "application/json" } });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();
  const client = getTenantClient(session.tenantId);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return new Response(JSON.stringify({ error: "Name is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const phases = Array.isArray(body.phases) ? body.phases : [];
  const defaults = (body.defaults && typeof body.defaults === "object") ? body.defaults : DEFAULTS;

  try {
    const now = new Date().toISOString();
    const doc = await client.create({
      _type: "workflowTemplate", name, version: 1,
      phases, defaults, createdAt: now, updatedAt: now,
    });
    return new Response(JSON.stringify({ success: true, template: doc }),
      { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[WorkflowTemplate] POST failed:", err);
    return new Response(JSON.stringify({ error: "Failed to create workflow template" }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();
  const client = getTenantClient(session.tenantId);

  const query = `*[_type == "workflowTemplate"] | order(name asc) {
    _id, name, version, phases, defaults, createdAt, updatedAt,
    "inUseCount": count(*[_type == "projectWorkflow" && templateId == ^._id])
  }`;
  try {
    const templates = await client.fetch(query);
    return new Response(JSON.stringify({ templates }),
      { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[WorkflowTemplate] GET failed:", err);
    return new Response(JSON.stringify({ error: "Failed to load workflow templates" }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

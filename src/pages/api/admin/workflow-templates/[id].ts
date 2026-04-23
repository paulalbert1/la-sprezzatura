export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/session";
import { getTenantClient } from "../../../../lib/tenantClient";

function unauthorized() { return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } }); }
function forbidden() { return new Response(JSON.stringify({ error: "No tenant context" }), { status: 403, headers: { "Content-Type": "application/json" } }); }
function missingId() { return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { "Content-Type": "application/json" } }); }
function notFound() { return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } }); }

export const GET: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();
  const id = params.id;
  if (!id) return missingId();
  const client = getTenantClient(session.tenantId);
  try {
    const doc = await client.fetch(`*[_type == "workflowTemplate" && _id == $id][0]`, { id });
    if (!doc) return notFound();
    return new Response(JSON.stringify({ template: doc }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[WorkflowTemplate] GET failed:", err);
    return new Response(JSON.stringify({ error: "Failed to load template" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();
  const id = params.id;
  if (!id) return missingId();
  const client = getTenantClient(session.tenantId);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } }); }

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return new Response(JSON.stringify({ error: "Name must be non-empty" }), { status: 400, headers: { "Content-Type": "application/json" } });
    update.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(body, "phases")) {
    if (!Array.isArray(body.phases)) return new Response(JSON.stringify({ error: "phases must be an array" }), { status: 400, headers: { "Content-Type": "application/json" } });
    update.phases = body.phases;
  }
  if (Object.prototype.hasOwnProperty.call(body, "defaults")) {
    if (!body.defaults || typeof body.defaults !== "object") return new Response(JSON.stringify({ error: "defaults must be an object" }), { status: 400, headers: { "Content-Type": "application/json" } });
    update.defaults = body.defaults;
  }

  try {
    const current = await client.fetch(`*[_type == "workflowTemplate" && _id == $id][0]{ version }`, { id }) as { version?: number } | null;
    if (!current) return notFound();
    update.version = (current.version ?? 0) + 1;
    await client.patch(id).set(update).commit();
    const updated = await client.fetch(`*[_type == "workflowTemplate" && _id == $id][0]`, { id });
    return new Response(JSON.stringify({ template: updated }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[WorkflowTemplate] PATCH failed:", err);
    return new Response(JSON.stringify({ error: "Failed to update template" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();
  const id = params.id;
  if (!id) return missingId();
  const client = getTenantClient(session.tenantId);
  try {
    const inUseCount = await client.fetch(`count(*[_type == "projectWorkflow" && templateId == $id])`, { id }) as number;
    if (inUseCount > 0) {
      return new Response(JSON.stringify({ error: "Template is in use", inUseCount }), { status: 409, headers: { "Content-Type": "application/json" } });
    }
    await client.delete(id);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[WorkflowTemplate] DELETE failed:", err);
    return new Response(JSON.stringify({ error: "Failed to delete template" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

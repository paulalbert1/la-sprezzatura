export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../../lib/session";
import { getTenantClient } from "../../../../../lib/tenantClient";

type Unknown = Record<string, unknown>;

function regenKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === "object") {
        const clone: Unknown = { ...(item as Unknown) };
        clone._key = crypto.randomUUID();
        for (const [k, v] of Object.entries(clone)) {
          if (Array.isArray(v) || (v && typeof v === "object")) clone[k] = regenKeys(v);
        }
        return clone;
      }
      return item;
    });
  }
  if (value && typeof value === "object") {
    const clone: Unknown = { ...(value as Unknown) };
    for (const [k, v] of Object.entries(clone)) {
      if (Array.isArray(v) || (v && typeof v === "object")) clone[k] = regenKeys(v);
    }
    return clone;
  }
  return value;
}

export const POST: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  if (!session.tenantId) return new Response(JSON.stringify({ error: "No tenant context" }), { status: 403, headers: { "Content-Type": "application/json" } });
  const id = params.id;
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { "Content-Type": "application/json" } });
  const client = getTenantClient(session.tenantId);
  try {
    const source = await client.fetch(`*[_type == "workflowTemplate" && _id == $id][0]`, { id }) as Unknown | null;
    if (!source) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    const now = new Date().toISOString();
    const doc = await client.create({
      _type: "workflowTemplate",
      name: `${String(source.name ?? "Untitled")} (copy)`,
      version: 1,
      phases: regenKeys(source.phases ?? []),
      defaults: source.defaults ?? { clientApprovalDays: 10, dormancyDays: 60, revisionRounds: 1 },
      createdAt: now, updatedAt: now,
    });
    return new Response(JSON.stringify({ template: doc }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[WorkflowTemplate] duplicate failed:", err);
    return new Response(JSON.stringify({ error: "Failed to duplicate template" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

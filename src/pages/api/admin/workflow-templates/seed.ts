export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/session";
import { getTenantClient } from "../../../../lib/tenantClient";
import { ALL_SEEDS } from "../../../../lib/workflow/seeds";

export const POST: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  if (!session.tenantId) return new Response(JSON.stringify({ error: "No tenant context" }), { status: 403, headers: { "Content-Type": "application/json" } });
  const client = getTenantClient(session.tenantId);
  let created = 0, skipped = 0;
  try {
    for (const seed of ALL_SEEDS) {
      const existing = await client.fetch(`count(*[_type == "workflowTemplate" && name == $name])`, { name: seed.name }) as number;
      if (existing > 0) { skipped += 1; continue; }
      const now = new Date().toISOString();
      await client.createIfNotExists({
        ...seed,
        createdAt: now,
        updatedAt: now,
      });
      created += 1;
    }
    return new Response(JSON.stringify({ created, skipped, total: created + skipped }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[WorkflowTemplate] seed failed:", err);
    return new Response(JSON.stringify({ error: "Failed to seed templates", created, skipped }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

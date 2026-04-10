export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!session.tenantId) {
    return jsonResponse({ error: "No tenant context" }, 403);
  }
  const client = getTenantClient(session.tenantId);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { action, projectId } = body as { action: string; projectId: string };
  if (!projectId) return jsonResponse({ error: "Missing projectId" }, 400);

  try {
    if (action === "update-title") {
      const { title } = body as { title: string };
      if (!title || !title.trim()) {
        return jsonResponse({ error: "Title is required" }, 400);
      }
      await client.patch(projectId).set({ title: title.trim() }).commit();
      return jsonResponse({ success: true, title: title.trim() });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("Project API error:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
};

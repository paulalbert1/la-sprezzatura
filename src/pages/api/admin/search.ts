export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";
import { searchEntities } from "../../../sanity/queries";

export const GET: APIRoute = async ({ url, cookies }) => {
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

  const query = url.searchParams.get("q") || "";
  if (query.length < 1) {
    return new Response(
      JSON.stringify({ clients: [], contractors: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const client = getTenantClient(session.tenantId);
    const results = await searchEntities(client, query);
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to search entities:", err);
    return new Response(
      JSON.stringify({ error: "Search failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

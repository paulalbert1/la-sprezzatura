export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { generatePortalToken } from "../../../lib/generateToken";

/**
 * API route for schedule dependency CRUD on the project schedule.
 * Supports add and remove actions on the scheduleDependencies[] array.
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { action, projectId } = body;

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Missing projectId" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (action === "add") {
      const { source, target } = body;
      if (!source || !target) {
        return new Response(
          JSON.stringify({ error: "Missing fields" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      const depKey = generatePortalToken(8);
      await sanityWriteClient
        .patch(projectId)
        .setIfMissing({ scheduleDependencies: [] })
        .append("scheduleDependencies", [
          {
            _key: depKey,
            _type: "scheduleDependency",
            source,
            target,
            linkType: "e2s",
          },
        ])
        .commit();
      return new Response(
        JSON.stringify({ success: true, depKey }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (action === "remove") {
      const { depKey } = body;
      if (!depKey) {
        return new Response(
          JSON.stringify({ error: "Missing fields" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      await sanityWriteClient
        .patch(projectId)
        .unset([`scheduleDependencies[_key=="${depKey}"]`])
        .commit();
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Failed to process dependency:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process dependency" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

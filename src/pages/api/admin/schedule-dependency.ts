export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";
import { generatePortalToken } from "../../../lib/generateToken";

/**
 * API route for dependency CRUD on the project schedule.
 * Supports "add" (append to scheduleDependencies[]) and "remove" (unset from scheduleDependencies[]).
 */

type ScheduleDependencyBody =
  | {
      action: "add";
      projectId: string;
      source: string; // "category:_key" format
      target: string; // "category:_key" format
      linkType?: string; // "e2s" | "s2s" | "e2e" | "s2e", defaults to "e2s"
    }
  | {
      action: "remove";
      projectId: string;
      depKey: string;
    };

const VALID_LINK_TYPES = ["e2s", "s2s", "e2e", "s2e"];
const TASK_ID_REGEX = /^(contractor|milestone|event|procurement):[A-Za-z0-9]+$/;

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

  let body: ScheduleDependencyBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { action, projectId } = body;

  if (!projectId) {
    return new Response(
      JSON.stringify({ error: "Missing projectId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // --- ADD ---
    if (action === "add") {
      const { source, target, linkType } = body;

      if (!source || !TASK_ID_REGEX.test(source)) {
        return new Response(
          JSON.stringify({ error: "Invalid source format" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!target || !TASK_ID_REGEX.test(target)) {
        return new Response(
          JSON.stringify({ error: "Invalid target format" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (source === target) {
        return new Response(
          JSON.stringify({ error: "Source and target must differ" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const resolvedLinkType = linkType || "e2s";
      if (!VALID_LINK_TYPES.includes(resolvedLinkType)) {
        return new Response(
          JSON.stringify({ error: "Invalid linkType" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const depKey = generatePortalToken(8);

      const dep = {
        _key: depKey,
        _type: "scheduleDependency",
        source,
        target,
        linkType: resolvedLinkType,
      };

      await client
        .patch(projectId)
        .setIfMissing({ scheduleDependencies: [] })
        .append("scheduleDependencies", [dep])
        .commit();

      return new Response(
        JSON.stringify({ success: true, depKey }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // --- REMOVE ---
    if (action === "remove") {
      const { depKey } = body;

      if (!depKey || typeof depKey !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing depKey" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      await client
        .patch(projectId)
        .unset([`scheduleDependencies[_key=="${depKey}"]`])
        .commit();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Invalid action
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to process schedule dependency:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process schedule dependency" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

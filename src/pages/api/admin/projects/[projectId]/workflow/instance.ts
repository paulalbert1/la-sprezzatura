export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/session";
import { getTenantClient } from "../../../../../../lib/tenantClient";
import { PROJECT_WORKFLOW_QUERY } from "../../../../../../sanity/queries";
import type { ProjectWorkflow } from "../../../../../../lib/workflow/types";

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

/**
 * POST /api/admin/projects/[projectId]/workflow/instance
 * Add a ContractorInstance sub-row to a multiInstance milestone.
 * Body: { phaseId, milestoneId, name }
 */
export const POST: APIRoute = async ({ request, params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();

  const projectId = params.projectId;
  if (!projectId) {
    return new Response(JSON.stringify({ error: "Missing projectId" }), {
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

  const phaseId = typeof body.phaseId === "string" ? body.phaseId : "";
  const milestoneId = typeof body.milestoneId === "string" ? body.milestoneId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!phaseId || !milestoneId || !name) {
    return new Response(
      JSON.stringify({ error: "phaseId, milestoneId, and name are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const client = getTenantClient(session.tenantId);
  const workflow = (await client.fetch(PROJECT_WORKFLOW_QUERY, { projectId })) as
    | ProjectWorkflow
    | null;
  if (!workflow) {
    return new Response(JSON.stringify({ error: "Workflow not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const phase = workflow.phases.find((p) => p.id === phaseId);
  const milestone = phase?.milestones.find((m) => m.id === milestoneId);
  if (!phase || !milestone) {
    return new Response(
      JSON.stringify({ error: "Phase or milestone not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!milestone.multiInstance) {
    return new Response(
      JSON.stringify({ error: "Milestone does not support multiple instances" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();
  const newInstance = {
    _key: crypto.randomUUID(),
    name,
    status: "not_started" as const,
    fromTemplate: false,
  };

  const basePath = `phases[_key=="${phase._key}"].milestones[_key=="${milestone._key}"]`;

  try {
    await client
      .patch(workflow._id)
      .setIfMissing({ [`${basePath}.instances`]: [] })
      .append(`${basePath}.instances`, [newInstance])
      .set({ lastActivityAt: now })
      .commit();
    const updated = await client.fetch(PROJECT_WORKFLOW_QUERY, { projectId });
    return new Response(
      JSON.stringify({ workflow: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[instance] POST failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to add instance" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

/**
 * DELETE /api/admin/projects/[projectId]/workflow/instance
 * Remove a ContractorInstance sub-row by _key.
 * Body: { phaseId, milestoneId, instanceKey }
 */
export const DELETE: APIRoute = async ({ request, params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();

  const projectId = params.projectId;
  if (!projectId) {
    return new Response(JSON.stringify({ error: "Missing projectId" }), {
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

  const phaseId = typeof body.phaseId === "string" ? body.phaseId : "";
  const milestoneId = typeof body.milestoneId === "string" ? body.milestoneId : "";
  const instanceKey = typeof body.instanceKey === "string" ? body.instanceKey : "";

  if (!phaseId || !milestoneId || !instanceKey) {
    return new Response(
      JSON.stringify({ error: "phaseId, milestoneId, and instanceKey are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const client = getTenantClient(session.tenantId);
  const workflow = (await client.fetch(PROJECT_WORKFLOW_QUERY, { projectId })) as
    | ProjectWorkflow
    | null;
  if (!workflow) {
    return new Response(JSON.stringify({ error: "Workflow not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const phase = workflow.phases.find((p) => p.id === phaseId);
  const milestone = phase?.milestones.find((m) => m.id === milestoneId);
  if (!phase || !milestone) {
    return new Response(
      JSON.stringify({ error: "Phase or milestone not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();
  const instancePath = `phases[_key=="${phase._key}"].milestones[_key=="${milestone._key}"].instances[_key=="${instanceKey}"]`;

  try {
    await client
      .patch(workflow._id)
      .unset([instancePath])
      .set({ lastActivityAt: now })
      .commit();
    const updated = await client.fetch(PROJECT_WORKFLOW_QUERY, { projectId });
    return new Response(
      JSON.stringify({ workflow: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[instance] DELETE failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to remove instance" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

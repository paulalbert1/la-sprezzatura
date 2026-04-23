export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/session";
import { getTenantClient } from "../../../../../../lib/tenantClient";
import { canTransition } from "../../../../../../lib/workflow/engine";
import { PROJECT_WORKFLOW_QUERY } from "../../../../../../sanity/queries";
import type { MilestoneStatus, ProjectWorkflow } from "../../../../../../lib/workflow/types";

const ALLOWED_STATUSES: MilestoneStatus[] = [
  "not_started",
  "in_progress",
  "awaiting_client",
  "awaiting_payment",
  "complete",
  "skipped",
];

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
 * POST /api/admin/projects/[projectId]/workflow/milestone-status
 * Engine-gated milestone (or sub-row instance) status transition.
 * Body: { phaseId, milestoneId, target, instanceKey? }
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
  const target = typeof body.target === "string" ? (body.target as MilestoneStatus) : null;
  const instanceKey = typeof body.instanceKey === "string" ? body.instanceKey : undefined;

  if (!phaseId || !milestoneId || !target || !ALLOWED_STATUSES.includes(target)) {
    return new Response(
      JSON.stringify({ error: "Invalid phaseId/milestoneId/target" }),
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

  const decision = canTransition(workflow, phaseId, milestoneId, target, instanceKey);
  if (!decision.allowed) {
    return new Response(
      JSON.stringify({ error: decision.reason ?? "Transition not allowed" }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  // Locate the phase and milestone by id (to get their _key values for patch paths)
  const phase = workflow.phases.find((p) => p.id === phaseId);
  const milestone = phase?.milestones.find((m) => m.id === milestoneId);
  if (!phase || !milestone) {
    return new Response(
      JSON.stringify({ error: "Phase or milestone not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { lastActivityAt: now };

  if (instanceKey) {
    // Sub-row (ContractorInstance) transition
    const basePath = `phases[_key=="${phase._key}"].milestones[_key=="${milestone._key}"].instances[_key=="${instanceKey}"]`;
    patch[`${basePath}.status`] = target;
    if (target === "in_progress") patch[`${basePath}.startedAt`] = now;
    if (target === "complete") patch[`${basePath}.completedAt`] = now;
  } else {
    // Top-level milestone transition
    const basePath = `phases[_key=="${phase._key}"].milestones[_key=="${milestone._key}"]`;
    patch[`${basePath}.status`] = target;
    if (target === "in_progress" && !milestone.startedAt) {
      patch[`${basePath}.startedAt`] = now;
    }
    if (target === "complete" || target === "skipped") {
      patch[`${basePath}.completedAt`] = now;
    }
  }

  try {
    await client.patch(workflow._id).set(patch).commit();
    const updated = await client.fetch(PROJECT_WORKFLOW_QUERY, { projectId });
    return new Response(
      JSON.stringify({ workflow: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[milestone-status] patch failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to apply transition" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

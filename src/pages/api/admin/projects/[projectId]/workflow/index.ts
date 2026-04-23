export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/session";
import { getTenantClient } from "../../../../../../lib/tenantClient";
import { instantiateFromTemplate } from "../../../../../../lib/workflow/engine";
import {
  PROJECT_WORKFLOW_QUERY,
  WORKFLOW_TEMPLATE_BY_ID_QUERY,
} from "../../../../../../sanity/queries";
import type { WorkflowTemplate } from "../../../../../../lib/workflow/types";

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

function missingProjectId(): Response {
  return new Response(JSON.stringify({ error: "Missing projectId" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

function badJSON(): Response {
  return new Response(JSON.stringify({ error: "Invalid JSON" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/admin/projects/[projectId]/workflow
 * Instantiate a workflow from a templateId (clones phases + defaultInstances).
 */
export const POST: APIRoute = async ({ request, params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();

  const projectId = params.projectId;
  if (!projectId) return missingProjectId();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badJSON();
  }

  const templateId = typeof body.templateId === "string" ? body.templateId : "";
  if (!templateId) {
    return new Response(
      JSON.stringify({ error: "templateId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const client = getTenantClient(session.tenantId);

  const existing = await client.fetch(PROJECT_WORKFLOW_QUERY, { projectId });
  if (existing && (existing.status === "active" || existing.status === "dormant")) {
    return new Response(
      JSON.stringify({ error: "Workflow already exists", workflow: existing }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  const template = (await client.fetch(WORKFLOW_TEMPLATE_BY_ID_QUERY, { id: templateId })) as
    | WorkflowTemplate
    | null;
  if (!template) {
    return new Response(
      JSON.stringify({ error: "Template not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const now = new Date();
    const seed = instantiateFromTemplate(template, now);
    const doc = await client.create({
      ...seed,
      lastActivityAt: now.toISOString(),
      project: { _type: "reference", _ref: projectId },
    });
    return new Response(
      JSON.stringify({ success: true, workflow: doc }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[workflow] POST failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create workflow" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

/**
 * DELETE /api/admin/projects/[projectId]/workflow
 * Terminate the workflow — sets status='terminated', terminatedAt=now.
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();

  const projectId = params.projectId;
  if (!projectId) return missingProjectId();

  const client = getTenantClient(session.tenantId);
  const workflow = await client.fetch(PROJECT_WORKFLOW_QUERY, { projectId });
  if (!workflow) {
    return new Response(
      JSON.stringify({ error: "Workflow not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const now = new Date().toISOString();
    await client
      .patch(workflow._id)
      .set({ status: "terminated", terminatedAt: now, lastActivityAt: now })
      .commit();
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[workflow] DELETE failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to terminate workflow" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

/**
 * PATCH /api/admin/projects/[projectId]/workflow
 * Supports two actions:
 *  - 'reactivate': dormant → active (sets status=active, lastActivityAt=now)
 *  - 'changeTemplate': re-instantiates with a new templateId (in-place mutation, _id preserved)
 */
export const PATCH: APIRoute = async ({ request, params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") return unauthorized();
  if (!session.tenantId) return forbidden();

  const projectId = params.projectId;
  if (!projectId) return missingProjectId();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badJSON();
  }

  const action = typeof body.action === "string" ? body.action : "";
  if (action !== "reactivate" && action !== "changeTemplate") {
    return new Response(
      JSON.stringify({ error: "action must be 'reactivate' or 'changeTemplate'" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const client = getTenantClient(session.tenantId);
  const workflow = await client.fetch(PROJECT_WORKFLOW_QUERY, { projectId });
  if (!workflow) {
    return new Response(
      JSON.stringify({ error: "Workflow not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();

  if (action === "reactivate") {
    if (workflow.status !== "dormant") {
      return new Response(
        JSON.stringify({ error: `Cannot reactivate from status '${workflow.status}'` }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }
    try {
      await client
        .patch(workflow._id)
        .set({ status: "active", lastActivityAt: now })
        .commit();
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (err) {
      console.error("[workflow] PATCH reactivate failed:", err);
      return new Response(
        JSON.stringify({ error: "Failed to reactivate workflow" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // action === "changeTemplate"
  const newTemplateId = typeof body.templateId === "string" ? body.templateId : "";
  if (!newTemplateId) {
    return new Response(
      JSON.stringify({ error: "templateId is required for changeTemplate" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const template = (await client.fetch(WORKFLOW_TEMPLATE_BY_ID_QUERY, {
    id: newTemplateId,
  })) as WorkflowTemplate | null;
  if (!template) {
    return new Response(
      JSON.stringify({ error: "Template not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const seed = instantiateFromTemplate(template);
    await client
      .patch(workflow._id)
      .set({
        templateId: seed.templateId,
        templateVersion: seed.templateVersion,
        phases: seed.phases,
        defaults: seed.defaults,
        status: "active",
        lastActivityAt: now,
        createdAt: now,
      })
      .commit();
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[workflow] PATCH changeTemplate failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to change template" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

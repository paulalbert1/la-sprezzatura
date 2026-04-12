export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";
import {
  buildSendUpdateEmail,
  type SendUpdateProject,
  type PendingArtifact,
} from "../../../lib/sendUpdate/emailTemplate";

// Phase 34 Plan 04 Task 2 — Send Update HTML preview endpoint.
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 2
//   - .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-16
//   - Threat T-34-04 (preview endpoint leaks project details to non-admin)
//
// GET endpoint consumed by the SendUpdateModal's "Preview email" action. The
// modal opens this URL in a new tab via `window.open(url, '_blank', ...)` so
// Liz can see exactly what the client will see before hitting Send.
//
// Query params:
//   projectId       — required, the project to preview
//   note            — optional, personal note text
//   sections        — optional, JSON { milestones?, procurement?, artifacts? }
//   usePersonalLinks — optional, "true" to preview the per-client CTA variant
//   clientId        — optional, only honored when usePersonalLinks=true
//
// Critical constraints:
//   - Admin-only (session.role !== "admin" → 401). No exceptions.
//   - READ-ONLY. Never calls sanityWriteClient.patch; no token lazy-gen.
//   - Returns Content-Type: text/html so the preview renders directly in the
//     browser tab (NOT JSON).

const PROJECT_FOR_PREVIEW_QUERY = `*[_type == "project" && _id == $projectId][0] {
  _id, title, engagementType,
  clients[] { client-> { _id, name, email, portalToken } },
  milestones[] | order(date asc) { _key, name, date, completed },
  select(engagementType == "full-interior-design" => {
    "procurementItems": procurementItems[] {
      _key, name, status, installDate, retailPrice,
      "savings": retailPrice - clientCost
    }
  }),
  artifacts[] {
    _key, artifactType, customTypeName,
    currentVersionKey,
    "hasApproval": count(decisionLog[action == "approved"]) > 0
  }
}`;

export const GET: APIRoute = async ({ url, cookies }) => {
  // T-34-04: admin-only gate. Runs BEFORE any data access.
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }

  const note = url.searchParams.get("note") || "";
  const usePersonalLinks = url.searchParams.get("usePersonalLinks") === "true";
  const clientId = url.searchParams.get("clientId");

  let sectionsParsed: {
    milestones?: boolean;
    procurement?: boolean;
    artifacts?: boolean;
  } = {};
  const sectionsRaw = url.searchParams.get("sections");
  if (sectionsRaw) {
    try {
      sectionsParsed = JSON.parse(sectionsRaw);
    } catch {
      return new Response("Invalid sections JSON", { status: 400 });
    }
  }

  const project = (await sanityWriteClient.fetch(
    PROJECT_FOR_PREVIEW_QUERY,
    { projectId },
  )) as SendUpdateProject | null;

  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const showMilestones =
    sectionsParsed.milestones !== false &&
    (project.milestones?.length ?? 0) > 0;
  const showProcurement =
    sectionsParsed.procurement !== false &&
    project.engagementType === "full-interior-design" &&
    (project.procurementItems?.length ?? 0) > 0;
  const pendingArtifacts: PendingArtifact[] = (project.artifacts || [])
    .filter((a) => a.currentVersionKey && !a.hasApproval)
    .map((a) => ({
      _key: a._key,
      artifactType: a.artifactType,
      customTypeName: a.customTypeName,
    }));
  // D-15: preview honors the same "explicit opt-in" rule as POST /api/send-update.
  const showArtifacts =
    sectionsParsed.artifacts === true && pendingArtifacts.length > 0;

  const baseUrl = import.meta.env.SITE || "https://lasprezz.com";
  let ctaHref = `${baseUrl}/portal/dashboard`;

  if (usePersonalLinks && clientId) {
    // Read-only resolution — if the target client already has a portalToken
    // we render a per-client CTA. If they don't, we INTENTIONALLY fall back
    // to the generic dashboard link rather than lazy-generating a token. The
    // preview endpoint MUST NOT mutate Sanity (T-34-04 mitigation + the test
    // "does NOT call sanityWriteClient.patch").
    const targetClient = project.clients?.find(
      (entry) => entry?.client?._id === clientId,
    )?.client;
    if (targetClient?.portalToken) {
      ctaHref = `${baseUrl}/portal/client/${targetClient.portalToken}`;
    }
  }

  const html = buildSendUpdateEmail({
    project,
    personalNote: note,
    showMilestones,
    showProcurement,
    showArtifacts,
    pendingArtifacts,
    baseUrl,
    ctaHref,
  });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

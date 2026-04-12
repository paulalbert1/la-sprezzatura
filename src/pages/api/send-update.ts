export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";
import {
  buildSendUpdateEmail,
  type SendUpdateProject,
  type PendingArtifact,
} from "../../lib/sendUpdate/emailTemplate";

// Phase 34 Plan 04 Task 1 — Send Update API route (extraction only)
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 1
//
// Task 1 is a pure extraction: the HTML builder and its helpers moved to
// src/lib/sendUpdate/emailTemplate.ts. This file keeps its legacy POST
// behavior intact (single HTML body, hardcoded `${baseUrl}/portal/dashboard`
// CTA for all recipients). Task 2 adds the admin gate + `usePersonalLinks`
// per-recipient branch.

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId, note, sections } = await request.json();
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch project snapshot
    const project = (await sanityWriteClient.fetch(
      `
      *[_type == "project" && _id == $projectId][0] {
        _id, title, engagementType,
        clients[] { client-> { _id, name, email } },
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
      }
    `,
      { projectId },
    )) as SendUpdateProject | null;

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Build email HTML
    const baseUrl = import.meta.env.SITE || "https://lasprezz.com";
    const personalNote = note || "";
    const showMilestones =
      sections?.milestones !== false &&
      (project.milestones?.length ?? 0) > 0;
    const showProcurement =
      sections?.procurement !== false &&
      project.engagementType === "full-interior-design" &&
      (project.procurementItems?.length ?? 0) > 0;
    const pendingArtifacts: PendingArtifact[] = (project.artifacts || [])
      .filter((a) => a.currentVersionKey && !a.hasApproval)
      .map((a) => ({
        _key: a._key,
        artifactType: a.artifactType,
        customTypeName: a.customTypeName,
      }));
    const showArtifacts =
      sections?.artifacts !== false && pendingArtifacts.length > 0;

    const html = buildSendUpdateEmail({
      project,
      personalNote,
      showMilestones,
      showProcurement,
      showArtifacts,
      pendingArtifacts,
      baseUrl,
      ctaHref: `${baseUrl}/portal/dashboard`,
    });

    // Send to all clients
    const apiKey = import.meta.env.RESEND_API_KEY;
    const recipientEmails: string[] = [];
    if (apiKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      for (const entry of project.clients || []) {
        const client = entry?.client;
        if (!client?.email) continue;
        recipientEmails.push(client.email);
        await resend.emails.send({
          from: "La Sprezzatura <noreply@send.lasprezz.com>",
          to: [client.email],
          subject: `Project Update: ${project.title}`,
          html,
        });
      }
    } else {
      console.log(
        "[SendUpdate] No RESEND_API_KEY set. Would send update for:",
        projectId,
      );
    }

    // Log the update on the project document
    const sectionsIncluded: string[] = [];
    if (showMilestones) sectionsIncluded.push("milestones");
    if (showProcurement) sectionsIncluded.push("procurement");
    if (showArtifacts) sectionsIncluded.push("artifacts");

    await sanityWriteClient
      .patch(projectId)
      .setIfMissing({ updateLog: [] })
      .append("updateLog", [
        {
          _key: generatePortalToken(8),
          sentAt: new Date().toISOString(),
          recipientEmails: recipientEmails.join(", "),
          note: personalNote,
          sectionsIncluded,
        },
      ])
      .commit({ autoGenerateArrayKeys: true });

    return new Response(
      JSON.stringify({ success: true, recipientCount: recipientEmails.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown send-update error";
    console.error("[SendUpdate] Error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

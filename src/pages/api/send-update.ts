export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";
import { PROCUREMENT_STAGES } from "../../lib/procurementStages";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getArtifactLabel(type: string, customName?: string): string {
  const labels: Record<string, string> = {
    proposal: "Proposal",
    "floor-plan": "Floor Plan",
    "design-board": "Design Board",
    contract: "Contract",
    warranty: "Warranty",
    "close-document": "Close Document",
  };
  if (labels[type]) return labels[type];
  if (customName) return customName;
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ");
}

function buildSendUpdateEmail(
  project: any,
  personalNote: string,
  showMilestones: boolean,
  showProcurement: boolean,
  showArtifacts: boolean,
  pendingArtifacts: any[],
  baseUrl: string,
): string {
  // Milestones section
  let milestonesHtml = "";
  if (showMilestones && project.milestones?.length > 0) {
    const rows = project.milestones
      .map(
        (m: any) => `
        <tr>
          <td style="padding:8px 12px;font-size:14px;color:#2C2926;border-bottom:1px solid #F0ECE6;">
            ${m.completed ? "&#10003;" : "&#9675;"} ${m.name || "Untitled"}
          </td>
          <td style="padding:8px 12px;font-size:14px;color:#8A8478;border-bottom:1px solid #F0ECE6;text-align:right;">
            ${m.date ? formatDate(m.date) : ""}
          </td>
        </tr>`,
      )
      .join("");

    milestonesHtml = `
      <div style="margin:24px 0;">
        <h2 style="margin:0 0 12px;font-size:14px;color:#8A8478;text-transform:uppercase;letter-spacing:0.1em;font-weight:400;">
          Milestones
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${rows}
        </table>
      </div>`;
  }

  // Procurement summary section
  let procurementHtml = "";
  if (showProcurement && project.procurementItems?.length > 0) {
    // Count items per status stage, normalizing legacy "pending" to "not-yet-ordered"
    const statusCounts: Record<string, number> = {};
    for (const item of project.procurementItems) {
      const status = item.status === "pending" ? "not-yet-ordered" : (item.status || "not-yet-ordered");
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    // Build rows in pipeline order, only for stages with items
    const rows = PROCUREMENT_STAGES
      .filter((stage) => (statusCounts[stage.value] || 0) > 0)
      .map((stage) => {
        const count = statusCounts[stage.value];
        return `
        <tr>
          <td style="padding:8px 12px;font-size:14px;color:#2C2926;border-bottom:1px solid #F0ECE6;">
            ${stage.title}
          </td>
          <td style="padding:8px 12px;font-size:14px;color:#8A8478;border-bottom:1px solid #F0ECE6;text-align:right;">
            ${count} ${count === 1 ? "item" : "items"}
          </td>
        </tr>`;
      })
      .join("");

    procurementHtml = `
      <div style="margin:24px 0;">
        <h2 style="margin:0 0 12px;font-size:14px;color:#8A8478;text-transform:uppercase;letter-spacing:0.1em;font-weight:400;">
          Procurement
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${rows}
        </table>
      </div>`;
  }

  // Pending reviews section
  let pendingHtml = "";
  if (showArtifacts && pendingArtifacts.length > 0) {
    const items = pendingArtifacts
      .map(
        (a: any) =>
          `<li style="margin:0 0 6px;font-size:14px;color:#2C2926;">${getArtifactLabel(a.artifactType, a.customTypeName)}</li>`,
      )
      .join("");

    pendingHtml = `
      <div style="margin:24px 0;">
        <h2 style="margin:0 0 12px;font-size:14px;color:#8A8478;text-transform:uppercase;letter-spacing:0.1em;font-weight:400;">
          Items Awaiting Your Review
        </h2>
        <ul style="margin:0;padding:0 0 0 20px;">
          ${items}
        </ul>
      </div>`;
  }

  // Personal note
  const noteHtml = personalNote
    ? `<p style="margin:0 0 24px;font-size:16px;color:#2C2926;line-height:1.7;">${personalNote.replace(/\n/g, "<br>")}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="padding:32px 32px 24px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#8A8478;text-transform:uppercase;letter-spacing:0.2em;">La Sprezzatura</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#FFFFFF;padding:40px 32px;">
        <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:300;font-size:24px;color:#2C2926;text-align:center;">
          Project Update: ${project.title}
        </h1>
        ${noteHtml}
        ${milestonesHtml}
        ${procurementHtml}
        ${pendingHtml}
        <div style="text-align:center;margin:32px 0;">
          <a href="${baseUrl}/portal/dashboard"
             style="display:inline-block;background-color:#C4836A;color:#FFFFFF;text-decoration:none;padding:16px 32px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">
            View in Your Portal
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#B8B0A4;line-height:1.6;">
          This is a project update from La Sprezzatura.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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
    const project = await sanityWriteClient.fetch(
      `
      *[_type == "project" && _id == $projectId][0] {
        _id, title, engagementType,
        clients[] { client-> { _id, name, email } },
        milestones[] | order(date asc) { name, date, completed },
        select(engagementType == "full-interior-design" => {
          "procurementItems": procurementItems[] { status }
        }),
        artifacts[] {
          _key, artifactType, customTypeName,
          currentVersionKey,
          "hasApproval": count(decisionLog[action == "approved"]) > 0
        }
      }
    `,
      { projectId },
    );

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
      sections?.milestones !== false && project.milestones?.length > 0;
    const showProcurement =
      sections?.procurement !== false &&
      project.engagementType === "full-interior-design" &&
      project.procurementItems?.length > 0;
    const pendingArtifacts = (project.artifacts || []).filter(
      (a: any) => a.currentVersionKey && !a.hasApproval,
    );
    const showArtifacts =
      sections?.artifacts !== false && pendingArtifacts.length > 0;

    const html = buildSendUpdateEmail(
      project,
      personalNote,
      showMilestones,
      showProcurement,
      showArtifacts,
      pendingArtifacts,
      baseUrl,
    );

    // Send to all clients
    const apiKey = import.meta.env.RESEND_API_KEY;
    const recipientEmails: string[] = [];
    if (apiKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      for (const entry of project.clients || []) {
        const client = entry.client;
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
      .insert("after", "updateLog[-1]", [
        {
          _key: generatePortalToken(8),
          sentAt: new Date().toISOString(),
          recipientEmails: recipientEmails.join(", "),
          note: personalNote,
          sectionsIncluded,
        },
      ])
      .commit({ autoGenerateArrayKeys: true });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[SendUpdate] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

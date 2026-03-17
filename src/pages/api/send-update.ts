export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";
import { formatCurrency } from "../../lib/formatCurrency";

function formatStatusText(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
}

function getStatusColor(status: string): string {
  switch (status) {
    case "ordered":
    case "warehouse":
    case "in-transit":
      return "#C4836A"; // terracotta
    case "pending":
      return "#8A8478"; // stone
    case "delivered":
    case "installed":
      return "#059669"; // emerald
    default:
      return "#8A8478";
  }
}

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

  // Procurement section
  let procurementHtml = "";
  if (showProcurement && project.procurementItems?.length > 0) {
    const rows = project.procurementItems
      .map(
        (item: any) => `
        <tr>
          <td style="padding:8px 12px;font-size:14px;color:#2C2926;border-bottom:1px solid #F0ECE6;">
            ${item.name || "Untitled"}
          </td>
          <td style="padding:8px 12px;font-size:14px;border-bottom:1px solid #F0ECE6;text-align:center;">
            <span style="color:${getStatusColor(item.status || "pending")};">${formatStatusText(item.status || "pending")}</span>
          </td>
          <td style="padding:8px 12px;font-size:14px;color:#8A8478;border-bottom:1px solid #F0ECE6;text-align:right;">
            ${item.installDate ? formatDate(item.installDate) : ""}
          </td>
        </tr>`,
      )
      .join("");

    // Compute total savings
    const totalSavings = project.procurementItems.reduce(
      (sum: number, item: any) => sum + (item.savings || 0),
      0,
    );

    const savingsLine =
      totalSavings > 0
        ? `<p style="margin:8px 0 0;font-size:14px;color:#059669;font-weight:500;">You saved ${formatCurrency(totalSavings)} vs. retail</p>`
        : "";

    procurementHtml = `
      <div style="margin:24px 0;">
        <h2 style="margin:0 0 12px;font-size:14px;color:#8A8478;text-transform:uppercase;letter-spacing:0.1em;font-weight:400;">
          Procurement
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <th style="padding:8px 12px;font-size:12px;color:#8A8478;text-transform:uppercase;text-align:left;border-bottom:2px solid #E5E2DE;">Item</th>
            <th style="padding:8px 12px;font-size:12px;color:#8A8478;text-transform:uppercase;text-align:center;border-bottom:2px solid #E5E2DE;">Status</th>
            <th style="padding:8px 12px;font-size:12px;color:#8A8478;text-transform:uppercase;text-align:right;border-bottom:2px solid #E5E2DE;">Install Date</th>
          </tr>
          ${rows}
        </table>
        ${savingsLine}
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
          "procurementItems": procurementItems[] {
            name, status, installDate, retailPrice,
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

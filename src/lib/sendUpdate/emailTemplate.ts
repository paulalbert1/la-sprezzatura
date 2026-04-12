// Phase 34 Plan 04 — Send Update email template
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 1
//   - .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-13..D-17
//
// Pure renderer extracted from src/pages/api/send-update.ts so the Send Update
// API route and the new /api/send-update/preview endpoint render from exactly
// the same source. The only functional change from the pre-Plan-04 shape is
// that the CTA href is passed in via `ctaHref` instead of being hardcoded.
// When the caller passes the legacy portal URL and ctaLabel is omitted, the
// output is byte-for-byte equivalent to the pre-Plan-04 builder.
//
// Helpers (formatStatusText, getStatusColor, formatDate, getArtifactLabel) are
// co-located here so both the template body and any future UI surface that
// wants to preview rows (e.g. a per-section thumbnail) can reuse the same
// formatting rules.

import { formatCurrency } from "../formatCurrency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendUpdateClientRef {
  _id: string;
  name: string;
  email?: string;
  portalToken?: string;
}

export interface SendUpdateMilestone {
  _key?: string;
  name?: string;
  date?: string;
  completed?: boolean;
}

export interface SendUpdateProcurementItem {
  _key?: string;
  name?: string;
  status?: string;
  installDate?: string;
  retailPrice?: number;
  clientCost?: number;
  savings?: number;
}

export interface SendUpdateArtifact {
  _key?: string;
  artifactType?: string;
  customTypeName?: string;
  currentVersionKey?: string;
  hasApproval?: boolean;
}

export interface SendUpdateProject {
  _id: string;
  title: string;
  engagementType: string;
  clients?: Array<{ client?: SendUpdateClientRef }>;
  milestones?: SendUpdateMilestone[];
  procurementItems?: SendUpdateProcurementItem[];
  artifacts?: SendUpdateArtifact[];
}

export interface PendingArtifact {
  _key?: string;
  artifactType?: string;
  customTypeName?: string;
}

export interface SendUpdateEmailInput {
  project: SendUpdateProject;
  personalNote: string;
  showMilestones: boolean;
  showProcurement: boolean;
  showArtifacts: boolean;
  pendingArtifacts: PendingArtifact[];
  baseUrl: string;
  /** Per-recipient CTA href. Caller decides whether this points at the
   * legacy dashboard URL (usePersonalLinks=false) or the per-client
   * `${baseUrl}/portal/client/{token}` route (usePersonalLinks=true). */
  ctaHref: string;
  /** Defaults to "View in Your Portal" when omitted. */
  ctaLabel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatStatusText(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
}

export function getStatusColor(status: string): string {
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

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getArtifactLabel(type: string, customName?: string): string {
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

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

const DEFAULT_CTA_LABEL = "View in Your Portal";

export function buildSendUpdateEmail(input: SendUpdateEmailInput): string {
  const {
    project,
    personalNote,
    showMilestones,
    showProcurement,
    showArtifacts,
    pendingArtifacts,
    ctaHref,
    ctaLabel,
  } = input;

  // Milestones section
  let milestonesHtml = "";
  if (showMilestones && project.milestones && project.milestones.length > 0) {
    const rows = project.milestones
      .map(
        (m) => `
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
  if (
    showProcurement &&
    project.procurementItems &&
    project.procurementItems.length > 0
  ) {
    const rows = project.procurementItems
      .map(
        (item) => `
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
      (sum, item) => sum + (item.savings || 0),
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
        (a) =>
          `<li style="margin:0 0 6px;font-size:14px;color:#2C2926;">${getArtifactLabel(a.artifactType || "", a.customTypeName)}</li>`,
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

  const resolvedCtaLabel = ctaLabel || DEFAULT_CTA_LABEL;

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
          <a href="${ctaHref}"
             style="display:inline-block;background-color:#C4836A;color:#FFFFFF;text-decoration:none;padding:16px 32px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">
            ${resolvedCtaLabel}
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

// Send Update email template — v2 layout matching
// /Users/paulalbert/Downloads/la_sprezzatura_client_email.html
//
// Key changes from v1:
//   - Personalized greeting with client first name + date
//   - Procurement table drops the pricing column; 3 cols: Item, Status, ETA
//   - New "Client Action Items" section (sits between milestones and procurement)
//   - Phase 37: removed all procurement pricing data from the template type
//     (D-13/D-14); no retail/savings/cost fields projected into the email.
//   - Adds a plain-text "Reply with feedback" CTA below the portal CTA
//   - Closing signature + footer unsubscribe line
//
// Called from BOTH /api/send-update (real send) and /api/send-update/preview.

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
  expectedDeliveryDate?: string;
}

export interface SendUpdateArtifact {
  _key?: string;
  artifactType?: string;
  customTypeName?: string;
  currentVersionKey?: string;
  hasApproval?: boolean;
}

export interface SendUpdateClientActionItem {
  _key?: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
}

export interface SendUpdateProject {
  _id: string;
  title: string;
  engagementType: string;
  clients?: Array<{ client?: SendUpdateClientRef }>;
  milestones?: SendUpdateMilestone[];
  procurementItems?: SendUpdateProcurementItem[];
  artifacts?: SendUpdateArtifact[];
  clientActionItems?: SendUpdateClientActionItem[];
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
  ctaHref: string;
  ctaLabel?: string;
  /** Client's first name for the greeting. Falls back to "there" if omitted. */
  clientFirstName?: string;
  /** Controls the "Client Action Items" section rendering. */
  showClientActionItems?: boolean;
  /** Email address for the "Reply with feedback" CTA (defaults to liz@). */
  feedbackEmail?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  warehouse: "Warehouse",
  "in-transit": "In transit",
  ordered: "Ordered",
  pending: "Pending order",
  delivered: "Delivered",
  installed: "Installed",
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: "#8A8478",
  warehouse: "#B07050",
  "in-transit": "#D4A574",
  ordered: "#D4A574",
  pending: "#B8AFA4",
  delivered: "#7D9E6E",
  installed: "#7D9E6E",
};

export function formatStatusText(status: string): string {
  return STATUS_LABEL[status] ||
    status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
}

export function getStatusColor(status: string): string {
  return STATUS_COLOR[status] || "#8A8478";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
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

function esc(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

const DEFAULT_CTA_LABEL = "Open Your Project Portal →";
const DEFAULT_FEEDBACK_EMAIL = "liz@lasprezz.com";

export function buildSendUpdateEmail(input: SendUpdateEmailInput): string {
  const {
    project,
    personalNote,
    showMilestones,
    showProcurement,
    showArtifacts,
    showClientActionItems = true,
    pendingArtifacts,
    ctaHref,
    ctaLabel,
    clientFirstName,
    feedbackEmail,
  } = input;

  const greeting = clientFirstName ? `Hi ${esc(clientFirstName)},` : "Hi there,";
  const dateStr = formatLongDate(new Date().toISOString());
  const resolvedCtaLabel = ctaLabel || DEFAULT_CTA_LABEL;
  const resolvedFeedback = feedbackEmail || DEFAULT_FEEDBACK_EMAIL;

  // ---------- Milestones ----------
  let milestonesHtml = "";
  if (showMilestones && project.milestones && project.milestones.length > 0) {
    // Split into completed (top), in-progress / upcoming (bottom)
    const rows = project.milestones
      .map((m) => {
        const done = Boolean(m.completed);
        const marker = done
          ? `<span style="font-family: Arial, sans-serif; font-size: 11px; color: #7D9E6E;">&#10003;</span>`
          : `<span style="width: 7px; height: 7px; border-radius: 50%; background: #D4C9BC; display: inline-block; flex-shrink: 0;"></span>`;
        const nameStyle = done
          ? "font-size: 14px; color: #9A8F82; text-decoration: line-through;"
          : "font-size: 14px; color: #2C2A26;";
        const dateDisplay = m.date
          ? `<span style="font-size: 13px; color: ${done ? "#B8AFA4" : "#4A4540"}; font-family: Arial, sans-serif;">${formatDate(m.date)}</span>`
          : "";
        return `
          <div style="padding: 0.6rem 0; border-bottom: 0.5px solid #EDE8E2; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${marker}
              <span style="${nameStyle}">${esc(m.name || "Untitled")}</span>
            </div>
            ${dateDisplay}
          </div>`;
      })
      .join("");

    milestonesHtml = `
      <div style="padding: 0 2.5rem 1.5rem;">
        <p style="font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 0.14em; color: #9A8F82; text-transform: uppercase; margin: 0 0 0.75rem;">Milestones</p>
        <div style="border-top: 0.5px solid #D9D3CA;"></div>
        ${rows}
      </div>`;
  }

  // ---------- Client Action Items ----------
  let actionItemsHtml = "";
  if (
    showClientActionItems &&
    project.clientActionItems &&
    project.clientActionItems.length > 0
  ) {
    const openItems = project.clientActionItems.filter((i) => !i.completed);
    if (openItems.length > 0) {
      const rows = openItems
        .map((i) => {
          const dateDisplay = i.dueDate
            ? `<span style="font-size: 13px; color: #4A4540; font-family: Arial, sans-serif;">${formatDate(i.dueDate)}</span>`
            : "";
          return `
            <div style="padding: 0.6rem 0; border-bottom: 0.5px solid #EDE8E2; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: #C17B5A; display: inline-block; flex-shrink: 0;"></span>
                <span style="font-size: 14px; color: #2C2A26;">${esc(i.description || "Action needed")}</span>
              </div>
              ${dateDisplay}
            </div>`;
        })
        .join("");

      actionItemsHtml = `
        <div style="padding: 0 2.5rem 1.5rem;">
          <p style="font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 0.14em; color: #9A8F82; text-transform: uppercase; margin: 0 0 0.75rem;">Action Items for You</p>
          <div style="border-top: 0.5px solid #D9D3CA;"></div>
          ${rows}
        </div>`;
    }
  }

  // ---------- Procurement ----------
  let procurementHtml = "";
  if (
    showProcurement &&
    project.procurementItems &&
    project.procurementItems.length > 0
  ) {
    const rows = project.procurementItems
      .map((item) => {
        const status = item.status || "pending";
        const eta = item.expectedDeliveryDate || item.installDate;
        return `
          <tr style="border-bottom: 0.5px solid #EDE8E2;">
            <td style="font-size: 13px; color: #2C2A26; padding: 0.65rem 0;">${esc(item.name || "Untitled")}</td>
            <td style="font-size: 12px; color: ${getStatusColor(status)}; text-align: center; padding: 0.65rem 0;">${esc(formatStatusText(status))}</td>
            <td style="font-size: 12px; color: #9A8F82; text-align: right; padding: 0.65rem 0;">${eta ? formatDate(eta) : ""}</td>
          </tr>`;
      })
      .join("");

    procurementHtml = `
      <div style="padding: 0 2.5rem 1.5rem;">
        <p style="font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 0.14em; color: #9A8F82; text-transform: uppercase; margin: 0 0 0.75rem;">Procurement</p>
        <div style="border-top: 0.5px solid #D9D3CA;"></div>
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
          <thead>
            <tr style="border-bottom: 0.5px solid #D9D3CA;">
              <td style="font-size: 10px; letter-spacing: 0.1em; color: #B8AFA4; text-transform: uppercase; padding: 0.6rem 0; width: 50%;">Item</td>
              <td style="font-size: 10px; letter-spacing: 0.1em; color: #B8AFA4; text-transform: uppercase; padding: 0.6rem 0; text-align: center;">Status</td>
              <td style="font-size: 10px; letter-spacing: 0.1em; color: #B8AFA4; text-transform: uppercase; padding: 0.6rem 0; text-align: right;">ETA</td>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // ---------- Pending artifact reviews (opt-in only) ----------
  let pendingHtml = "";
  if (showArtifacts && pendingArtifacts.length > 0) {
    const items = pendingArtifacts
      .map(
        (a) =>
          `<div style="padding: 0.6rem 0; border-bottom: 0.5px solid #EDE8E2; font-size: 14px; color: #2C2A26;">&#9675; ${esc(getArtifactLabel(a.artifactType || "", a.customTypeName))}</div>`,
      )
      .join("");

    pendingHtml = `
      <div style="padding: 0 2.5rem 1.5rem;">
        <p style="font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 0.14em; color: #9A8F82; text-transform: uppercase; margin: 0 0 0.75rem;">Awaiting Your Review</p>
        <div style="border-top: 0.5px solid #D9D3CA;"></div>
        ${items}
      </div>`;
  }

  // ---------- Personal note (rendered as narrative paragraphs) ----------
  const noteHtml = personalNote
    ? personalNote
        .split(/\n{2,}/)
        .map(
          (para) =>
            `<p style="font-size: 15px; line-height: 1.75; color: #4A4540; margin: 0 0 0.85rem;">${esc(para).replace(/\n/g, "<br>")}</p>`,
        )
        .join("")
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${esc(project.title)} — Weekly Update</title></head>
<body style="margin:0;padding:0;background-color:#F5F1EB;">
  <div style="background: #F5F1EB; padding: 2rem 1rem;">
    <div style="max-width: 580px; margin: 0 auto; background: #FDFAF6; border: 0.5px solid #E8E2D9; border-radius: 4px; font-family: Georgia, 'Times New Roman', serif; color: #2C2A26;">

      <div style="padding: 2.5rem 2.5rem 0; text-align: center; border-bottom: 0.5px solid #E8E2D9; padding-bottom: 1.5rem;">
        <p style="font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 0.18em; color: #9A8F82; margin: 0 0 0.35rem; text-transform: uppercase;">La Sprezzatura</p>
      </div>

      <div style="padding: 2rem 2.5rem 0;">
        <h1 style="font-size: 22px; font-weight: 400; color: #2C2A26; margin: 0 0 0.25rem; letter-spacing: -0.01em;">Project Update</h1>
        <p style="font-size: 13px; color: #9A8F82; margin: 0 0 1.75rem; font-family: Arial, sans-serif; letter-spacing: 0.04em;">${esc(project.title)} &nbsp;·&nbsp; ${dateStr}</p>

        <p style="font-size: 15px; line-height: 1.75; color: #4A4540; margin: 0 0 0.85rem;">${greeting}</p>
        ${noteHtml}
      </div>

      ${milestonesHtml}
      ${actionItemsHtml}
      ${procurementHtml}
      ${pendingHtml}

      <div style="padding: 0 2.5rem 2.5rem;">
        <p style="font-size: 15px; color: #2C2A26; margin: 0 0 0.2rem;">Elizabeth</p>
        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #9A8F82; margin: 0 0 1.75rem;">La Sprezzatura</p>

        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 0.5px solid #EDE8E2;">
          <a href="${esc(ctaHref)}" style="display: inline-block; background: #8B6E5A; color: #FAF7F3; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; padding: 0.85rem 2rem; border-radius: 2px;">${esc(resolvedCtaLabel)}</a>
        </div>

        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #6B6560; text-align: center; margin: 1.25rem 0 0; line-height: 1.6;">
          Questions or feedback? <a href="mailto:${esc(resolvedFeedback)}" style="color: #8B6E5A; text-decoration: underline;">Email Elizabeth</a>.
        </p>
      </div>

      <div style="padding: 1rem 2.5rem; border-top: 0.5px solid #EDE8E2; text-align: center;">
        <p style="font-family: Arial, sans-serif; font-size: 10px; color: #C5BDB4; margin: 0; letter-spacing: 0.06em;">La Sprezzatura · Darien, CT</p>
        <p style="font-family: Arial, sans-serif; font-size: 10px; color: #C5BDB4; margin: 0.5rem 0 0; letter-spacing: 0.06em;">Sent via Sprezza Hub</p>
      </div>

    </div>
  </div>
</body>
</html>`;
}


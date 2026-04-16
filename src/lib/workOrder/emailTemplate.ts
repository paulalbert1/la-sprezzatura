// Phase 39 Plan 04 Task 1 — Work Order email template
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-04-PLAN.md § Task 1
//   .planning/phases/39-work-order-documents-panels/39-RESEARCH.md § Code Examples (Example 1, L650-714)
//   .planning/phases/39-work-order-documents-panels/39-UI-SPEC.md § Surface 4 — Work Order Email Template
//
// Minimal HTML email body (no item table per CONTEXT D-07) with a single
// gold-pill CTA pointing at the contractor portal permalink. Plain-text
// fallback returns the same content. All interpolated user values are escaped
// via escapeHtml() to defeat HTML injection (T-39-04-03).

export interface WorkOrderEmailInput {
  project: { _id: string; title: string };
  contractor: { _id: string; name: string; email: string };
  workOrderId: string;
  baseUrl: string;
  fromDisplayName: string;
  verifyUrl?: string;
}

export function buildWorkOrderEmail(input: WorkOrderEmailInput): string {
  const { project, contractor, workOrderId, baseUrl, fromDisplayName, verifyUrl } = input;
  const firstName = contractor.name?.split(" ")[0] || "there";
  const ctaHref = verifyUrl || `${baseUrl}/workorder/project/${project._id}/orders/${workOrderId}`;
  const sentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:Arial,sans-serif;color:#2C2520;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF7F2;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#FFFEFB;border:0.5px solid #E8DDD0;">
        <tr><td style="padding:32px 40px 24px;">
          <div style="font-size:11.5px;font-weight:600;letter-spacing:0.14em;color:#9E8E80;text-transform:uppercase;">LA SPREZZATURA</div>
          <div style="font-size:11.5px;color:#9E8E80;margin-top:4px;">Linha Studio</div>
        </td></tr>
        <tr><td style="padding:8px 40px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#2C2520;margin:0 0 12px;line-height:1.3;">Work order ready for review</h1>
          <div style="font-size:13px;color:#6B5E52;">${escapeHtml(project.title)} &middot; ${sentDate}</div>
        </td></tr>
        <tr><td style="padding:0 40px 24px;">
          <p style="font-size:13px;line-height:1.6;margin:0 0 16px;">${escapeHtml(firstName)},</p>
          <p style="font-size:13px;line-height:1.6;margin:0;">Your work order for ${escapeHtml(project.title)} is ready. Use the link below to view the latest version &mdash; it always reflects our most recent edits.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 40px 40px;">
          <a href="${ctaHref}" style="display:inline-block;background-color:#9A7B4B;color:#FFFEFB;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:13.6px 32px;border-radius:2px;">VIEW WORK ORDER</a>
        </td></tr>
        <tr><td style="padding:0 40px 32px;border-top:0.5px solid #E8DDD0;">
          <div style="font-size:12px;color:#9E8E80;margin-top:24px;">${escapeHtml(fromDisplayName)}</div>
          <div style="font-size:12px;color:#9E8E80;margin-top:4px;">La Sprezzatura &middot; Linha Studio</div>
          <div style="font-size:12px;color:#9E8E80;margin-top:4px;">Darien, CT</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function buildWorkOrderPlainText(input: WorkOrderEmailInput): string {
  const { project, contractor, workOrderId, baseUrl, verifyUrl } = input;
  const firstName = contractor.name?.split(" ")[0] || "there";
  const link = verifyUrl || `${baseUrl}/workorder/project/${project._id}/orders/${workOrderId}`;
  return `${firstName},

Your work order for ${project.title} is ready.

View the latest version: ${link}

La Sprezzatura
Linha Studio
Darien, CT`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

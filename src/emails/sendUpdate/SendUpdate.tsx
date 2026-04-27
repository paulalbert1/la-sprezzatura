// src/emails/sendUpdate/SendUpdate.tsx
// Phase 46 -- react-email port of src/lib/sendUpdate/emailTemplate.ts.
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-1, D-2, D-3, D-7, D-13)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (SendUpdate.tsx)
//
// D-1: pixel-faithful nested-table rewrite -- every flex row (milestones,
//      action items, procurement label/date pairs) becomes <Row><Column>.
// D-2: 7x7 status indicators are colored squares (no border-radius).
// D-3: only the CTA <EmailButton> retains longhand border-radius: 2px.
// D-7: <EmailShell> always passed cta={...}; preheader prop is required.
// D-13: call site passes preheader explicitly; defaultPreheader() is the
//       defensive fallback only.
//
// Section toggling (showMilestones / showProcurement / showArtifacts /
// showClientActionItems) is preserved verbatim from the legacy template.
// JSX auto-escapes children; the legacy esc() helper is intentionally NOT
// ported (T-46-02-01).

import { EmailShell } from "../shell/EmailShell";
import { Greeting } from "./Greeting";
import { Milestones } from "./Milestones";
import { ActionItems } from "./ActionItems";
import { Procurement } from "./Procurement";
import { PendingArtifacts } from "./PendingArtifacts";
import { LA_SPREZZATURA_TENANT } from "../../lib/email/tenantBrand";

// ---------------------------------------------------------------------------
// Types (mirrored verbatim from legacy src/lib/sendUpdate/emailTemplate.ts
// lines 19-89; preheader prop added per D-13).
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
  /** Inbox-preview text (D-13). Call site passes; defaultPreheader is fallback. */
  preheader?: string;
}

// ---------------------------------------------------------------------------
// Helpers (re-exported verbatim from legacy lines 95-151; esc() NOT ported).
// ---------------------------------------------------------------------------

export const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  warehouse: "Warehouse",
  "in-transit": "In transit",
  ordered: "Ordered",
  pending: "Pending order",
  delivered: "Delivered",
  installed: "Installed",
};

export const STATUS_COLOR: Record<string, string> = {
  scheduled: "#8A8478",
  warehouse: "#B07050",
  "in-transit": "#D4A574",
  ordered: "#D4A574",
  pending: "#B8AFA4",
  delivered: "#7D9E6E",
  installed: "#7D9E6E",
};

export function formatStatusText(status: string): string {
  return (
    STATUS_LABEL[status] ||
    status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ")
  );
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

export function formatLongDate(dateStr: string): string {
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

// ---------------------------------------------------------------------------
// Composition root
// ---------------------------------------------------------------------------

const DEFAULT_CTA_LABEL = "VIEW PORTAL";

function defaultPreheader(project: SendUpdateProject): string {
  return `Project Update for ${project.title} -- ${formatLongDate(new Date().toISOString())}`;
}

export function SendUpdate(props: SendUpdateEmailInput) {
  const {
    project,
    personalNote,
    ctaHref,
    ctaLabel,
    preheader,
    showMilestones = true,
    showProcurement = true,
    showArtifacts = true,
    showClientActionItems = true,
    pendingArtifacts = [],
    clientFirstName,
  } = props;

  const openActionItems = (project.clientActionItems ?? []).filter(
    (ai) => !ai.completed,
  );

  return (
    <EmailShell
      tenant={LA_SPREZZATURA_TENANT}
      preheader={preheader ?? defaultPreheader(project)}
      cta={{ href: ctaHref, label: ctaLabel ?? DEFAULT_CTA_LABEL }}
    >
      <Greeting
        clientFirstName={clientFirstName}
        project={project}
        personalNote={personalNote}
      />
      {showMilestones && (project.milestones?.length ?? 0) > 0 && (
        <Milestones milestones={project.milestones ?? []} />
      )}
      {showClientActionItems && openActionItems.length > 0 && (
        <ActionItems items={openActionItems} />
      )}
      {showProcurement && (project.procurementItems?.length ?? 0) > 0 && (
        <Procurement items={project.procurementItems ?? []} />
      )}
      {showArtifacts && pendingArtifacts.length > 0 && (
        <PendingArtifacts artifacts={pendingArtifacts} />
      )}
    </EmailShell>
  );
}

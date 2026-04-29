// src/emails/sendUpdate/SendUpdate.tsx
// Phase 46-04 -- composition root with new section order (D-2).
//
// Order: Greeting -> Body -> ReviewItems -> Milestones -> Procurement -> CTA + reply -> Footer.
// PendingArtifacts removed as a separate section -- data merged into ReviewItems (D-3).
// Single terracotta CTA inside children, so the reply-affordance line sits naturally
// between the CTA and the EmailShell footer (D-9, D-19, D-20).
// Three-line footer rendered by EmailShell with signoffStyle="formal" (D-29) so the
// signature line is "Elizabeth Lewis" (vs WorkOrder's "Elizabeth").
//
// Required props:
//   personalNote (D-6)  -- pass "" to opt out of the body section
//   pendingArtifacts (D-3) -- pass [] to opt out of artifact rows
//   personalActionItems    -- pass [] to opt out of designer rows
//   tenant (D-29)       -- threaded to EmailShell
//   preheader (D-13)    -- call site computes
//
// Helpers retained for downstream use:
//   getArtifactLabel(type, customName?)  -- 2-arg signature; ReviewItems calls this
//   formatDate, formatLongDate           -- date formatters used by the call site

import { Section, Text } from "@react-email/components";
import { EmailShell } from "../shell/EmailShell";
import { EmailButton } from "../shell/EmailButton";
import type { TenantBrand } from "../../lib/email/tenantBrand";
import { Body } from "./Body";
import { ReviewItems, type PersonalActionItem } from "./ReviewItems";
import { Milestones, type MilestoneRow } from "./Milestones";
import { Procurement, type ProcurementRow } from "./Procurement";
import { Greeting } from "./Greeting";
import type { ProcurementStatus } from "../../lib/procurement/statusPills";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendUpdateProject {
  _id: string;
  title: string;
  milestones?: Array<{ label: string; date: string; state: "completed" | "upcoming" }>;
  procurementItems?: Array<{
    name: string;
    vendor?: string;
    spec?: string;
    status: ProcurementStatus;
    eta: string;
  }>;
}

export interface PendingArtifact {
  _key?: string;
  artifactType?: string;
  customTypeName?: string;
}

export interface SendUpdateEmailInput {
  project: SendUpdateProject;
  personalNote: string;            // REQUIRED -- D-6 (pass "" to opt out)
  personalActionItems: PersonalActionItem[];
  pendingArtifacts: PendingArtifact[];
  showMilestones: boolean;
  showProcurement: boolean;
  showReviewItems: boolean;
  baseUrl: string;
  ctaHref: string;
  ctaLabel?: string;
  clientFirstName?: string;
  tenant: TenantBrand;             // REQUIRED -- threaded to EmailShell (D-29)
  preheader: string;               // REQUIRED -- D-13 (Phase 46)
  sentDate?: string;               // optional override; defaults to today (long form)
}

// Re-export PersonalActionItem so external callers (compose helper, tests, fixtures)
// pull the type from the composition root rather than reaching into ReviewItems.
export type { PersonalActionItem };

// ---------------------------------------------------------------------------
// Helpers retained for downstream use
// ---------------------------------------------------------------------------

const KNOWN_ARTIFACT_LABELS: Record<string, string> = {
  proposal: "Proposal",
  contract: "Contract",
  "design-board": "Design Board",
  "floor-plan": "Floor Plan",
  invoice: "Invoice",
  "purchase-order": "Purchase Order",
  warranty: "Warranty",
  "close-document": "Close Document",
};

/**
 * Resolve the display label for an artifact type. ReviewItems calls this with
 * two args `(type, customName)`; preserved here for compatibility with the
 * Task 3 ReviewItems implementation.
 */
export function getArtifactLabel(type: string, customName?: string): string {
  if (type === "custom" && customName) return customName;
  if (KNOWN_ARTIFACT_LABELS[type]) return KNOWN_ARTIFACT_LABELS[type];
  if (customName) return customName;
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ");
}

export function formatDate(d: string | Date): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLongDate(d: string | Date): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Composition root
// ---------------------------------------------------------------------------

const DEFAULT_CTA_LABEL = "Open Portal";

const REPLY_LINE_STYLE = {
  fontSize: 12,
  lineHeight: "20px",
  color: "#8A8478",
  margin: 0,
  marginTop: 14,
} as const;

const CTA_SECTION_STYLE = {
  paddingLeft: 40,
  paddingRight: 40,
  paddingTop: 8,
  paddingBottom: 32,
} as const;

export function SendUpdate(input: SendUpdateEmailInput) {
  const {
    project,
    personalNote,
    personalActionItems,
    pendingArtifacts,
    showMilestones,
    showProcurement,
    showReviewItems,
    ctaHref,
    ctaLabel = DEFAULT_CTA_LABEL,
    clientFirstName,
    tenant,
    preheader,
    sentDate,
  } = input;

  const sentDateFormatted = sentDate ?? formatLongDate(new Date());
  const milestonesMapped: MilestoneRow[] = (project.milestones ?? []).map((m) => ({
    label: m.label,
    date: formatDate(m.date),
    state: m.state,
  }));
  const procurementMapped: ProcurementRow[] = (project.procurementItems ?? []).map((p) => ({
    name: p.name,
    vendor: p.vendor,
    spec: p.spec,
    status: p.status,
    eta: formatDate(p.eta),
  }));

  return (
    <EmailShell tenant={tenant} preheader={preheader} signoffStyle="formal">
      <Greeting project={project} firstName={clientFirstName} sentDate={sentDateFormatted} />
      <Body personalNote={personalNote} clientFirstName={clientFirstName ?? ""} />
      {showReviewItems && (
        <ReviewItems personalActionItems={personalActionItems} pendingArtifacts={pendingArtifacts} />
      )}
      {showMilestones && <Milestones milestones={milestonesMapped} />}
      {showProcurement && <Procurement items={procurementMapped} />}
      <Section style={CTA_SECTION_STYLE}>
        <EmailButton href={ctaHref} variant="terracotta">{ctaLabel}</EmailButton>
        <Text style={REPLY_LINE_STYLE}>You can reply to this email directly.</Text>
      </Section>
    </EmailShell>
  );
}

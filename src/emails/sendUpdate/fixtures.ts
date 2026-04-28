// src/emails/sendUpdate/fixtures.ts
// Phase 46-04 -- five representative fixtures (D-22).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-04-CONTEXT.md (D-22, D-23)
//
// Locked fixture names (do NOT add a sixth without amending D-22):
//   full           -- every section populated; markdown body with bold + inline link;
//                     2 designer items + 2 auto-derived artifacts;
//                     3 procurement rows with full vendor+spec each;
//                     2 completed + 2 upcoming milestones.
//   noReviewItems  -- empty personalActionItems AND empty pendingArtifacts
//                     (verifies ReviewItems' empty-both omission rule, D-3).
//   noProcurement  -- empty procurementItems AND showProcurement: false.
//   noBody         -- personalNote: "" (verifies Body opt-out path, D-6).
//   mixedSubLines  -- 3 procurement rows with progressive vendor/spec presence
//                     (both | vendor-only | neither) -- the only fixture that
//                     exercises Procurement sub-line composition variants (D-14).
//
// Cardinality variants beyond these five land as it() blocks in
// SendUpdate.test.ts -- not as new fixtures (D-23 maintenance policy).

import { SAMPLE_TENANT } from "../fixtures.shared";
import type { SendUpdateEmailInput } from "./SendUpdate";
import type { PersonalActionItem } from "./ReviewItems";

export const PROJECT_BASE: SendUpdateEmailInput["project"] = {
  _id: "P1",
  title: "Kimball Residence",
  milestones: [
    { label: "Design intake", date: "2026-02-28", state: "completed" },
    { label: "Construction kickoff", date: "2026-04-14", state: "completed" },
    { label: "Millwork install", date: "2026-05-22", state: "upcoming" },
    { label: "Final walkthrough", date: "2026-06-30", state: "upcoming" },
  ],
  procurementItems: [
    { name: "Custom sofa", vendor: "Verellen", spec: "96\" three-seat", status: "ordered", eta: "2026-04-30" },
    { name: "Dining table", vendor: "BDDW", spec: "walnut, 84\"", status: "in-transit", eta: "2026-05-06" },
    { name: "Foyer pendant", vendor: "Apparatus", spec: "Cloud 19", status: "delivered", eta: "2026-04-22" },
  ],
};

export const samplePersonalActionItems: PersonalActionItem[] = [
  { label: "Approve the floor plan", dueLabel: "Due May 9" },
  { label: "Review the lighting proposal", dueLabel: "No deadline" },
];

export const samplePendingArtifacts: SendUpdateEmailInput["pendingArtifacts"] = [
  { _key: "a1", artifactType: "proposal" },
  { _key: "a2", artifactType: "design-board" },
];

const SAMPLE_BODY = [
  "Construction kicked off two weeks ago and the site is in good rhythm.",
  "The new fabric samples landed Friday — the [Schumacher](https://lasprezz.com/portal/projects/kimball) reads even better in person than on the board, and I'd love your eyes on it before we lock the order.",
  "One thing on your plate this week: the floor plan needs your approval by **May 9** to keep the trades on schedule. Everything else is moving.",
].join("\n\n");

export function baseInput(overrides: Partial<SendUpdateEmailInput> = {}): SendUpdateEmailInput {
  return {
    project: PROJECT_BASE,
    personalNote: SAMPLE_BODY,
    personalActionItems: samplePersonalActionItems,
    pendingArtifacts: samplePendingArtifacts,
    showMilestones: true,
    showProcurement: true,
    showReviewItems: true,
    baseUrl: "https://lasprezz.com",
    ctaHref: "https://lasprezz.com/portal/client/abc123",
    ctaLabel: "Open Portal",
    clientFirstName: "Sarah",
    tenant: SAMPLE_TENANT,
    preheader: "Project update for Kimball Residence — one approval needed by May 9.",
    sentDate: "April 27, 2026",
    ...overrides,
  };
}

export const FIXTURES = {
  full: () => baseInput(),
  noReviewItems: () =>
    baseInput({ personalActionItems: [], pendingArtifacts: [], showReviewItems: false }),
  noProcurement: () =>
    baseInput({
      project: { ...PROJECT_BASE, procurementItems: [] },
      showProcurement: false,
    }),
  noBody: () => baseInput({ personalNote: "" }),
  mixedSubLines: () =>
    baseInput({
      project: {
        ...PROJECT_BASE,
        procurementItems: [
          { name: "Custom sofa", vendor: "Verellen", spec: "96\" three-seat", status: "ordered", eta: "2026-04-30" },
          { name: "Dining table", vendor: "BDDW", status: "in-transit", eta: "2026-05-06" },
          { name: "Foyer pendant", status: "delivered", eta: "2026-04-22" },
        ],
      },
    }),
};

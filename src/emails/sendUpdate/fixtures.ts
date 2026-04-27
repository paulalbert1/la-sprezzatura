// src/emails/sendUpdate/fixtures.ts
// Phase 46 -- typed fixture exports for SendUpdate snapshot tests (D-20).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-13, D-20)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (sendUpdate/fixtures.ts)
//   src/lib/sendUpdate/emailTemplate.test.ts lines 13-61 (legacy fixtures extracted here)
//
// Six fixtures per D-20: one baseline + one per-section toggled off + minimal.
// preheader is set on baseInput per D-13 (call site override pattern; the
// fixture is treated as a call site for test purposes).

import type {
  SendUpdateEmailInput,
  SendUpdateProject,
  PendingArtifact,
} from "./SendUpdate";

export function fixtureProject(): SendUpdateProject {
  return {
    _id: "project-123",
    title: "Kimball Residence",
    engagementType: "full-interior-design",
    clients: [
      {
        client: {
          _id: "client-1",
          name: "Sarah Kimball",
          email: "sarah@example.com",
        },
      },
    ],
    milestones: [
      { _key: "m1", name: "Design intake", date: "2026-03-01", completed: true },
      {
        _key: "m2",
        name: "Construction kickoff",
        date: "2026-04-15",
        completed: false,
      },
    ],
    procurementItems: [
      {
        _key: "p1",
        name: "Sofa",
        status: "ordered",
        installDate: "2026-05-01",
      },
    ],
    artifacts: [
      {
        _key: "a1",
        artifactType: "proposal",
        currentVersionKey: "v1",
        hasApproval: false,
      },
    ],
    clientActionItems: [
      {
        _key: "ai1",
        description: "Approve the floor plan",
        dueDate: "2026-05-10",
        completed: false,
      },
    ],
  };
}

function fixturePendingArtifacts(): PendingArtifact[] {
  return [{ _key: "a1", artifactType: "proposal" }];
}

export function baseInput(
  overrides: Partial<SendUpdateEmailInput> = {},
): SendUpdateEmailInput {
  return {
    project: fixtureProject(),
    personalNote: "Loving the new fabric samples.",
    showMilestones: true,
    showProcurement: true,
    showArtifacts: true,
    showClientActionItems: true,
    pendingArtifacts: fixturePendingArtifacts(),
    baseUrl: "https://lasprezz.com",
    ctaHref: "https://lasprezz.com/portal/dashboard",
    preheader: "Project Update for Kimball Residence -- April 27, 2026",
    clientFirstName: "Sarah",
    ...overrides,
  };
}

export const FIXTURES = {
  allSections: () => baseInput(),
  noProcurement: () =>
    baseInput({
      showProcurement: false,
      project: { ...fixtureProject(), engagementType: "consultation-only" },
    }),
  noActionItems: () => baseInput({ showClientActionItems: false }),
  noArtifacts: () => baseInput({ showArtifacts: false, pendingArtifacts: [] }),
  noMilestones: () => baseInput({ showMilestones: false }),
  minimal: () =>
    baseInput({
      showMilestones: false,
      showProcurement: false,
      showArtifacts: false,
      showClientActionItems: false,
      pendingArtifacts: [],
      personalNote: "",
    }),
};

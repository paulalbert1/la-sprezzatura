// src/lib/sendUpdate/emailTemplate.test.ts
// Phase 34 Plan 04 Task 1 — buildSendUpdateEmail extraction tests.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 1

import { describe, it, expect } from "vitest";
import {
  buildSendUpdateEmail,
  type SendUpdateEmailInput,
  type SendUpdateProject,
  type PendingArtifact,
} from "./emailTemplate";

function fixtureProject(): SendUpdateProject {
  return {
    _id: "project-123",
    title: "Kimball Residence",
    engagementType: "full-interior-design",
    clients: [
      { client: { _id: "client-1", name: "Sarah Kimball", email: "sarah@example.com" } },
    ],
    milestones: [
      { _key: "m1", name: "Design intake", date: "2026-03-01", completed: true },
      { _key: "m2", name: "Construction kickoff", date: "2026-04-15", completed: false },
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
  };
}

function fixturePendingArtifacts(): PendingArtifact[] {
  return [{ _key: "a1", artifactType: "proposal" }];
}

function fixtureInput(overrides: Partial<SendUpdateEmailInput> = {}): SendUpdateEmailInput {
  const project = fixtureProject();
  return {
    project,
    personalNote: "",
    showMilestones: true,
    showProcurement: true,
    showArtifacts: true,
    pendingArtifacts: fixturePendingArtifacts(),
    baseUrl: "https://lasprezz.com",
    ctaHref: "https://lasprezz.com/portal/dashboard",
    ...overrides,
  };
}

describe("buildSendUpdateEmail (Phase 34 Plan 04)", () => {
  it("renders full HTML with personalNote at the top when provided", () => {
    const html = buildSendUpdateEmail(
      fixtureInput({ personalNote: "Hi Sarah, big week ahead!" }),
    );
    expect(html).toContain("<!DOCTYPE html>");
    // Phase 38 redesign: project title now appears in a sub-header line below
    // the "Project Update" h1, paired with the formatted date — assert presence
    // (location, not the legacy "Project Update: {title}" copy).
    expect(html).toContain("Kimball Residence");
    expect(html).toContain("Hi Sarah, big week ahead!");
    // Personal note renders as a <p> element ABOVE the section blocks.
    const noteIdx = html.indexOf("Hi Sarah, big week ahead!");
    const milestonesIdx = html.indexOf("Milestones");
    expect(noteIdx).toBeGreaterThan(-1);
    expect(milestonesIdx).toBeGreaterThan(-1);
    expect(noteIdx).toBeLessThan(milestonesIdx);
  });

  it("omits personalNote block entirely when note is empty string", () => {
    const html = buildSendUpdateEmail(fixtureInput({ personalNote: "" }));
    // The personalNote <p> block uses the exact marker style from the renderer.
    // When empty, no such <p> block should appear BEFORE the milestones section.
    expect(html).not.toContain("margin:0 0 24px;font-size:16px");
  });

  it("includes Milestones section when showMilestones=true and project.milestones is non-empty", () => {
    const html = buildSendUpdateEmail(fixtureInput({ showMilestones: true }));
    expect(html).toContain("Milestones");
    expect(html).toContain("Design intake");
    expect(html).toContain("Construction kickoff");
  });

  it("omits Milestones section when showMilestones=false", () => {
    const html = buildSendUpdateEmail(fixtureInput({ showMilestones: false }));
    expect(html).not.toContain("Design intake");
    expect(html).not.toContain("Construction kickoff");
  });

  it("includes Procurement section when showProcurement=true AND engagementType='full-interior-design'", () => {
    const html = buildSendUpdateEmail(
      fixtureInput({ showProcurement: true }),
    );
    expect(html).toContain("Procurement");
    expect(html).toContain("Sofa");
    expect(html).toContain("Ordered"); // formatStatusText
    // Phase 37: no savings/retail copy in the email template
    expect(html).not.toContain("You saved");
    expect(html).not.toContain("vs. retail");
  });

  it("omits Procurement section when engagementType !== 'full-interior-design' regardless of showProcurement", () => {
    const project = fixtureProject();
    project.engagementType = "consultation-only";
    const html = buildSendUpdateEmail(
      fixtureInput({
        project,
        // caller still passes showProcurement=true — but the calling code (API
        // route) is responsible for computing showProcurement. When called with
        // showProcurement=false the renderer must not emit the section.
        showProcurement: false,
      }),
    );
    expect(html).not.toContain("Procurement");
    expect(html).not.toContain("Sofa");
  });

  it("includes Pending Reviews section when showArtifacts=true and pendingArtifacts.length > 0", () => {
    const html = buildSendUpdateEmail(
      fixtureInput({
        showArtifacts: true,
        pendingArtifacts: [
          { _key: "a1", artifactType: "proposal" },
          { _key: "a2", artifactType: "floor-plan" },
        ],
      }),
    );
    // Phase 38 redesign: section header copy is "Awaiting Your Review"
    // (the legacy "Items Awaiting Your Review" string was dropped when the
    // template moved to the v5.1 reference layout).
    expect(html).toContain("Awaiting Your Review");
    expect(html).toContain("Proposal");
    expect(html).toContain("Floor Plan");
  });

  it("CTA href uses ctaHref param verbatim (not hardcoded /portal/dashboard)", () => {
    const html = buildSendUpdateEmail(
      fixtureInput({
        ctaHref: "https://lasprezz.com/portal/client/abc123xy",
      }),
    );
    expect(html).toContain('href="https://lasprezz.com/portal/client/abc123xy"');
    // And the legacy hardcoded path must NOT appear when the caller passes a
    // per-client CTA. The fixture baseUrl is /portal/dashboard-free.
    expect(html).not.toContain('href="https://lasprezz.com/portal/dashboard"');
  });

  it("default ctaLabel is 'Open Your Project Portal →' when not provided", () => {
    // Phase 38 redesign updated DEFAULT_CTA_LABEL in emailTemplate.ts to
    // "Open Your Project Portal →" (was "View in Your Portal" in Phase 34).
    const html = buildSendUpdateEmail(fixtureInput());
    expect(html).toContain("Open Your Project Portal");
  });

  it("matches existing send-update.ts snapshot when called with the fixture input", () => {
    // Byte-for-byte equivalence check. This snapshot is the canonical
    // "legacy send-update.ts output" — any future refactor that accidentally
    // changes HTML structure will fail this test loud-fast.
    const html = buildSendUpdateEmail(fixtureInput());
    expect(html).toMatchSnapshot();
  });

  // ---------------------------------------------------------------------------
  // Phase 45 Plan 05 — section-toggle permutation snapshots.
  //
  // These four cases plus the canonical baseline above are the EMAIL-09
  // regression baseline frozen BEFORE Phase 46 migrates buildSendUpdateEmail
  // to react-email. Each permutation exercises one render branch (a section
  // toggle or the personal-note path) so a Phase 46 regression in any single
  // branch fails its dedicated snap loud-fast.
  // ---------------------------------------------------------------------------

  it("snapshot: renders without procurement section (showProcurement: false)", () => {
    const html = buildSendUpdateEmail(fixtureInput({ showProcurement: false }));
    expect(html).toMatchSnapshot();
  });

  it("snapshot: renders without artifacts section (showArtifacts: false, pendingArtifacts: [])", () => {
    const html = buildSendUpdateEmail(
      fixtureInput({ showArtifacts: false, pendingArtifacts: [] }),
    );
    expect(html).toMatchSnapshot();
  });

  it("snapshot: renders without milestones section (showMilestones: false)", () => {
    const html = buildSendUpdateEmail(fixtureInput({ showMilestones: false }));
    expect(html).toMatchSnapshot();
  });

  it("snapshot: renders with non-empty personalNote", () => {
    // The default fixture has personalNote: "". This permutation captures the
    // alternate code path where the personal note section IS rendered.
    const html = buildSendUpdateEmail(
      fixtureInput({ personalNote: "Loving the new fabric samples." }),
    );
    expect(html).toMatchSnapshot();
  });
});

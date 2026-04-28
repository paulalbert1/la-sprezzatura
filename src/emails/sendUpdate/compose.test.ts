// src/emails/sendUpdate/compose.test.ts
// Phase 46-04 -- behavioral tests for the compose helper (D-16, D-17, D-39).
//
// Inline test input rather than reusing src/emails/sendUpdate/fixtures.ts
// because that file is owned by Task 5 (rewrite of the suite-level fixtures
// alongside the new SendUpdate.test.ts). Once Task 5 ships, these tests can
// optionally migrate to the shared fixture builder; the assertions are
// behavioral so the input shape is the only thing that needs to change.

import { describe, it, expect } from "vitest";
import { composeSendUpdateEmail, ComposeError, type ComposeSendUpdateInput } from "./compose";
import { SAMPLE_TENANT } from "../fixtures.shared";

function baseInput(overrides: Partial<ComposeSendUpdateInput> = {}): ComposeSendUpdateInput {
  return {
    project: {
      _id: "P1",
      title: "Kimball Residence",
      milestones: [
        { label: "Design intake", date: "2026-02-28", state: "completed" },
        { label: "Millwork install", date: "2026-05-22", state: "upcoming" },
      ],
      procurementItems: [
        {
          name: "Custom sofa",
          vendor: "Verellen",
          spec: '96" three-seat',
          status: "ordered",
          eta: "2026-04-30",
        },
      ],
    },
    personalNote:
      "Construction kicked off two weeks ago and the site is in good rhythm.\n\nOne approval needed by **May 9**.",
    personalActionItems: [{ label: "Approve the floor plan", dueLabel: "Due May 9" }],
    pendingArtifacts: [{ _key: "a1", artifactType: "proposal" }],
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
    fromAddress: "office@lasprezz.com",
    ...overrides,
  };
}

describe("composeSendUpdateEmail (D-16, D-17, D-39)", () => {
  it("subject pattern uses em dash + sentence-case 'update' + project title", async () => {
    const out = await composeSendUpdateEmail(baseInput());
    expect(out.subject).toBe("Project update — Kimball Residence");
  });

  it("subject falls back to clientFullName when project.title missing", async () => {
    const out = await composeSendUpdateEmail(
      baseInput({
        project: { _id: "P1", title: "" },
        clientFullName: "Sarah Johnson",
      }),
    );
    expect(out.subject).toBe("Project update — Sarah Johnson");
  });

  it("subject does not contain 'Weekly'", async () => {
    const out = await composeSendUpdateEmail(baseInput());
    expect(out.subject).not.toContain("Weekly");
  });

  it("subject uses U+2014 em dash (not hyphen)", async () => {
    const out = await composeSendUpdateEmail(baseInput());
    expect(out.subject).toContain("—");
    expect(out.subject).not.toContain(" - ");
  });

  it("subject falls back to literal 'your project' when both project.title and clientFullName are missing", async () => {
    const out = await composeSendUpdateEmail(
      baseInput({ project: { _id: "P1", title: "" }, clientFullName: undefined }),
    );
    expect(out.subject).toBe("Project update — your project");
  });

  it("from is passed through unchanged", async () => {
    const out = await composeSendUpdateEmail(baseInput({ fromAddress: "liz@lasprezz.com" }));
    expect(out.from).toBe("liz@lasprezz.com");
  });

  it("returns html and text", async () => {
    const out = await composeSendUpdateEmail(baseInput());
    expect(out.html.length).toBeGreaterThan(100);
    expect(out.text.length).toBeGreaterThan(50);
  });

  it("text is produced via plainText render (no hand-rolled fallback)", async () => {
    const out = await composeSendUpdateEmail(baseInput());
    // plainText contains the H1 copy without HTML tags.
    // The plainText converter uppercases <h1> content, so assert case-insensitively
    // against the H1 source text "Project Update" (renders as "PROJECT UPDATE" in plainText).
    expect(out.text.toLowerCase()).toContain("project update");
    expect(out.text).not.toMatch(/<[^>]+>/);
  });

  it("wraps PersonalNoteParseError as ComposeError", async () => {
    await expect(
      composeSendUpdateEmail(
        baseInput({ personalNote: "[click](javascript:alert(1))" }),
      ),
    ).rejects.toThrow(ComposeError);
  });

  it("does NOT include reply_to in the result shape", async () => {
    const out = await composeSendUpdateEmail(baseInput());
    expect(out).toEqual(expect.not.objectContaining({ reply_to: expect.anything() }));
    expect(out).toEqual(expect.not.objectContaining({ replyTo: expect.anything() }));
  });
});

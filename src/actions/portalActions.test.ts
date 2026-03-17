import { describe, it, expect } from "vitest";
import {
  approveArtifactSchema,
  requestChangesSchema,
  milestoneNoteSchema,
  artifactNoteSchema,
  warrantyClaimSchema,
} from "./portalSchemas";

describe("approveArtifact schema", () => {
  it("rejects missing confirmed field", () => {
    const result = approveArtifactSchema.safeParse({
      projectId: "abc",
      artifactKey: "def",
      versionKey: "ghi",
    });
    expect(result.success).toBe(false);
  });

  it('rejects confirmed="false" (only "true" accepted)', () => {
    const result = approveArtifactSchema.safeParse({
      projectId: "abc",
      artifactKey: "def",
      versionKey: "ghi",
      confirmed: "false",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid input", () => {
    const result = approveArtifactSchema.safeParse({
      projectId: "abc",
      artifactKey: "def",
      versionKey: "ghi",
      confirmed: "true",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty projectId", () => {
    const result = approveArtifactSchema.safeParse({
      projectId: "",
      artifactKey: "def",
      versionKey: "ghi",
      confirmed: "true",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty artifactKey", () => {
    const result = approveArtifactSchema.safeParse({
      projectId: "abc",
      artifactKey: "",
      versionKey: "ghi",
      confirmed: "true",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty versionKey", () => {
    const result = approveArtifactSchema.safeParse({
      projectId: "abc",
      artifactKey: "def",
      versionKey: "",
      confirmed: "true",
    });
    expect(result.success).toBe(false);
  });
});

describe("requestArtifactChanges schema", () => {
  it("rejects empty feedback", () => {
    const result = requestChangesSchema.safeParse({
      projectId: "abc",
      artifactKey: "def",
      versionKey: "ghi",
      feedback: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty projectId", () => {
    const result = requestChangesSchema.safeParse({
      projectId: "",
      artifactKey: "def",
      versionKey: "ghi",
      feedback: "Please change the color",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid input", () => {
    const result = requestChangesSchema.safeParse({
      projectId: "abc",
      artifactKey: "def",
      versionKey: "ghi",
      feedback: "Please change the color",
    });
    expect(result.success).toBe(true);
  });
});

describe("submitMilestoneNote schema", () => {
  it("rejects empty text", () => {
    const result = milestoneNoteSchema.safeParse({
      projectId: "abc",
      milestoneKey: "def",
      text: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects text over 500 chars", () => {
    const result = milestoneNoteSchema.safeParse({
      projectId: "abc",
      milestoneKey: "def",
      text: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid input", () => {
    const result = milestoneNoteSchema.safeParse({
      projectId: "abc",
      milestoneKey: "def",
      text: "Looks great",
    });
    expect(result.success).toBe(true);
  });

  it("accepts text at exactly 500 chars", () => {
    const result = milestoneNoteSchema.safeParse({
      projectId: "abc",
      milestoneKey: "def",
      text: "a".repeat(500),
    });
    expect(result.success).toBe(true);
  });
});

describe("submitArtifactNote schema", () => {
  it("rejects empty text", () => {
    const result = artifactNoteSchema.safeParse({
      projectId: "abc",
      artifactKey: "def",
      text: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid input", () => {
    const result = artifactNoteSchema.safeParse({
      projectId: "abc",
      artifactKey: "def",
      text: "Note here",
    });
    expect(result.success).toBe(true);
  });

  it("rejects text over 500 chars", () => {
    const result = artifactNoteSchema.safeParse({
      projectId: "abc",
      artifactKey: "def",
      text: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("warrantyClaimSchema", () => {
  it("rejects description under 10 chars", () => {
    const result = warrantyClaimSchema.safeParse({ projectId: "abc", description: "short" });
    expect(result.success).toBe(false);
  });

  it("accepts valid claim without photo", () => {
    const result = warrantyClaimSchema.safeParse({ projectId: "abc", description: "The kitchen faucet is leaking from the base." });
    expect(result.success).toBe(true);
  });

  it("accepts valid claim with photo", () => {
    const photo = new File(["fake-image-data"], "leak.jpg", { type: "image/jpeg" });
    const result = warrantyClaimSchema.safeParse({ projectId: "abc", description: "The kitchen faucet is leaking from the base.", photo });
    expect(result.success).toBe(true);
  });
});

import {
  selectTierSchema,
} from "./portalSchemas";

describe("selectTier schema (Phase 9)", () => {
  it("accepts valid tier selection with all fields", () => {
    const result = selectTierSchema.safeParse({
      projectId: "proj1",
      artifactKey: "art1",
      tierKey: "tier1",
      eagerness: "4",
      reservations: "Some concerns about timeline",
      confirmed: "true",
    });
    expect(result.success).toBe(true);
  });

  it("coerces eagerness from string to number", () => {
    const result = selectTierSchema.safeParse({
      projectId: "proj1",
      artifactKey: "art1",
      tierKey: "tier1",
      eagerness: "3",
      confirmed: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eagerness).toBe(3);
    }
  });

  it("rejects eagerness below 1", () => {
    const result = selectTierSchema.safeParse({
      projectId: "proj1",
      artifactKey: "art1",
      tierKey: "tier1",
      eagerness: "0",
      confirmed: "true",
    });
    expect(result.success).toBe(false);
  });

  it("rejects eagerness above 5", () => {
    const result = selectTierSchema.safeParse({
      projectId: "proj1",
      artifactKey: "art1",
      tierKey: "tier1",
      eagerness: "6",
      confirmed: "true",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer eagerness", () => {
    const result = selectTierSchema.safeParse({
      projectId: "proj1",
      artifactKey: "art1",
      tierKey: "tier1",
      eagerness: "3.5",
      confirmed: "true",
    });
    expect(result.success).toBe(false);
  });

  it('rejects confirmed="false" (only "true" accepted)', () => {
    const result = selectTierSchema.safeParse({
      projectId: "proj1",
      artifactKey: "art1",
      tierKey: "tier1",
      eagerness: "4",
      confirmed: "false",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing confirmed field", () => {
    const result = selectTierSchema.safeParse({
      projectId: "proj1",
      artifactKey: "art1",
      tierKey: "tier1",
      eagerness: "4",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty projectId", () => {
    const result = selectTierSchema.safeParse({
      projectId: "",
      artifactKey: "art1",
      tierKey: "tier1",
      eagerness: "4",
      confirmed: "true",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty tierKey", () => {
    const result = selectTierSchema.safeParse({
      projectId: "proj1",
      artifactKey: "art1",
      tierKey: "",
      eagerness: "4",
      confirmed: "true",
    });
    expect(result.success).toBe(false);
  });

  it("allows reservations to be omitted (optional)", () => {
    const result = selectTierSchema.safeParse({
      projectId: "proj1",
      artifactKey: "art1",
      tierKey: "tier1",
      eagerness: "5",
      confirmed: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reservations).toBeUndefined();
    }
  });
});

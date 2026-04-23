// src/lib/relationshipLabel.test.ts
// Phase 42 Plan 01 — TRAD-02 / TRAD-03 helper covering the D-04 null-fallback contract.

import { describe, it, expect } from "vitest";
import { relationshipLabel } from "./relationshipLabel";

describe("relationshipLabel", () => {
  it("returns 'Vendor' for 'vendor'", () => {
    expect(relationshipLabel("vendor")).toBe("Vendor");
  });

  it("returns 'Contractor' for 'contractor'", () => {
    expect(relationshipLabel("contractor")).toBe("Contractor");
  });

  it("returns 'Contractor' for null (D-04 null fallback)", () => {
    expect(relationshipLabel(null)).toBe("Contractor");
  });

  it("returns 'Contractor' for undefined", () => {
    expect(relationshipLabel(undefined)).toBe("Contractor");
  });

  it("returns 'Contractor' for empty string", () => {
    expect(relationshipLabel("")).toBe("Contractor");
  });

  it("returns 'Contractor' for any non-vendor value", () => {
    expect(relationshipLabel("other")).toBe("Contractor");
    expect(relationshipLabel("VENDOR")).toBe("Contractor"); // case-sensitive by design
  });
});

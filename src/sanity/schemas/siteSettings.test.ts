// src/sanity/schemas/siteSettings.test.ts
// Phase 40 Plan 01 — VEND-03: trades array field on siteSettings schema

import { describe, it, expect } from "vitest";
import { siteSettings } from "./siteSettings";

describe("siteSettings schema", () => {
  it('exports a document type named "siteSettings"', () => {
    expect(siteSettings.name).toBe("siteSettings");
    expect(siteSettings.type).toBe("document");
  });

  it("has the expected core fields", () => {
    const fieldNames = siteSettings.fields?.map((f) => f.name);
    expect(fieldNames).toContain("siteTitle");
    expect(fieldNames).toContain("defaultFromEmail");
    expect(fieldNames).toContain("defaultCcEmail");
    expect(fieldNames).toContain("socialLinks");
    expect(fieldNames).toContain("heroSlideshow");
  });

  // Phase 40 Plan 01 — VEND-03: trades catalog
  it("has a trades field of array type with string members", () => {
    const field = siteSettings.fields?.find((f) => f.name === "trades");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    const ofArray = (field as { of?: { type: string }[] })?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray!.length).toBeGreaterThan(0);
    expect(ofArray![0].type).toBe("string");
  });

  it("trades field has no group assignment", () => {
    const field = siteSettings.fields?.find((f) => f.name === "trades") as
      | { group?: string }
      | undefined;
    expect(field).toBeDefined();
    expect(field?.group).toBeUndefined();
  });

  it("trades field appears after defaultCcEmail and before socialLinks in field order", () => {
    const fieldNames = siteSettings.fields?.map((f) => f.name) ?? [];
    const ccIdx = fieldNames.indexOf("defaultCcEmail");
    const tradesIdx = fieldNames.indexOf("trades");
    const socialIdx = fieldNames.indexOf("socialLinks");
    expect(ccIdx).toBeGreaterThanOrEqual(0);
    expect(tradesIdx).toBeGreaterThan(ccIdx);
    expect(socialIdx).toBeGreaterThan(tradesIdx);
  });

  // Phase 42 Plan 01 — TRAD-07 schema foundation
  it("has `contractorChecklistItems` array field of strings", () => {
    const field = siteSettings.fields?.find((f) => f.name === "contractorChecklistItems") as
      | { type: string; of?: { type: string }[] }
      | undefined;
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    expect(field?.of?.[0]?.type).toBe("string");
  });

  it("has `vendorChecklistItems` array field of strings", () => {
    const field = siteSettings.fields?.find((f) => f.name === "vendorChecklistItems") as
      | { type: string; of?: { type: string }[] }
      | undefined;
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    expect(field?.of?.[0]?.type).toBe("string");
  });
});

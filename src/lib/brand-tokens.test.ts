// src/lib/brand-tokens.test.ts
// Phase 45 -- round-trip + shape tests for brand-tokens.
// Source of truth: .planning/phases/45-email-foundations/45-02-PLAN.md
//
// Task 1 ships shape assertions only. Task 2 appends the buildThemeCss
// round-trip block once the generator exists.

import { describe, it, expect } from "vitest";
import { brandTokens } from "./brand-tokens";

describe("brandTokens shape", () => {
  it("color count matches the migrated subset (23 colors: 10 warm-neutral + 13 luxury-admin)", () => {
    expect(Object.keys(brandTokens.colors).length).toBe(23);
  });

  it("anchors a sentinel color value", () => {
    expect(brandTokens.colors.cream).toBe("#FAF8F5");
    expect(brandTokens.colors.charcoal).toBe("#2C2926");
    expect(brandTokens.colors.gold).toBe("#9A7B4B");
  });

  it("font families round-trip with quoted fallbacks", () => {
    expect(brandTokens.fonts.heading.startsWith('"Cormorant Garamond"')).toBe(true);
    expect(brandTokens.fonts.body.startsWith('"DM Sans"')).toBe(true);
  });

  it("spacing scale is the email-relevant subset only", () => {
    expect(brandTokens.spacing.section).toBe("8rem");
    expect(brandTokens.spacing.sectionSm).toBe("5rem");
    expect(Object.keys(brandTokens.spacing).length).toBe(2);
  });
});

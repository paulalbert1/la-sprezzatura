// src/lib/brand-tokens.test.ts
// Phase 45 -- round-trip + shape tests for brand-tokens.
// Source of truth: .planning/phases/45-email-foundations/45-02-PLAN.md
//
// Task 1 ships shape assertions only. Task 2 appends the buildThemeCss
// round-trip block once the generator exists.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { brandTokens } from "./brand-tokens";
import { buildThemeCss } from "../../scripts/generate-theme-css";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

describe("brandTokens -> _generated-theme.css round-trip", () => {
  it("buildThemeCss is deterministic (idempotent)", () => {
    const a = buildThemeCss(brandTokens);
    const b = buildThemeCss(brandTokens);
    expect(a).toBe(b);
  });

  it("generated CSS contains every color as `--color-<kebab>: <hex>;`", () => {
    const css = buildThemeCss(brandTokens);
    for (const [name, value] of Object.entries(brandTokens.colors)) {
      const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      expect(css).toContain(`--color-${kebab}: ${value};`);
    }
  });

  it("generated CSS contains spacing tokens", () => {
    const css = buildThemeCss(brandTokens);
    expect(css).toContain("--spacing-section: 8rem;");
    expect(css).toContain("--spacing-section-sm: 5rem;");
  });

  it("committed _generated-theme.css matches buildThemeCss output (CI freshness)", () => {
    const expected = buildThemeCss(brandTokens);
    const committed = readFileSync(
      path.resolve(__dirname, "../styles/_generated-theme.css"),
      "utf8",
    );
    expect(committed).toBe(expected);
  });
});

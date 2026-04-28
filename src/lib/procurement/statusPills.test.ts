// src/lib/procurement/statusPills.test.ts
// Phase 46-04 -- property assertions on the canonical procurement palette (D-31).
//
// Test premise: completeness, accessibility, structural integrity. NOT identity
// with DESIGN-SYSTEM.md -- that file mirrors statusPills.ts (D-30 precedence rule).
// Asserting they agree would just assert the file matches itself.

import { describe, it, expect } from "vitest";
import {
  STATUS_PILL_STYLES,
  STATUS_LABELS,
  PROCUREMENT_STATUSES,
} from "./statusPills";

// Relative luminance per WCAG 2.1 -- inline, no dependency.
function relLum(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lin = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const fg = relLum(fgHex);
  const bg = relLum(bgHex);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("statusPills (Phase 46-04 D-31)", () => {
  // 1. Enum completeness -- highest-value structural assertion.
  it("every PROCUREMENT_STATUSES member has a STATUS_PILL_STYLES entry (pill style)", () => {
    for (const status of PROCUREMENT_STATUSES) {
      expect(
        STATUS_PILL_STYLES[status],
        `missing pill style for "${status}"`,
      ).toBeDefined();
      expect(STATUS_PILL_STYLES[status].bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(STATUS_PILL_STYLES[status].text).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(STATUS_PILL_STYLES[status].border).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("every PROCUREMENT_STATUSES member has a STATUS_LABELS entry", () => {
    for (const status of PROCUREMENT_STATUSES) {
      expect(
        STATUS_LABELS[status],
        `missing label for "${status}"`,
      ).toBeDefined();
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });

  it("STATUS_PILL_STYLES has no extra entries beyond PROCUREMENT_STATUSES", () => {
    const declared = new Set<string>(PROCUREMENT_STATUSES);
    for (const key of Object.keys(STATUS_PILL_STYLES)) {
      expect(
        declared.has(key),
        `unexpected key "${key}" in STATUS_PILL_STYLES`,
      ).toBe(true);
    }
  });

  // 2. WCAG AA contrast -- 4.5:1 for normal text on pill backgrounds.
  it("all foreground/background pairs meet WCAG AA contrast (>= 4.5:1)", () => {
    for (const status of PROCUREMENT_STATUSES) {
      const { text, bg } = STATUS_PILL_STYLES[status];
      const ratio = contrastRatio(text, bg);
      expect(
        ratio,
        `"${status}" pill: contrast ${ratio.toFixed(2)}:1 (text ${text} on bg ${bg}) -- needs >= 4.5:1`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  // 3. Border darker than background -- pill keeps its visual edge.
  it("border is darker than background for every status (relative luminance)", () => {
    for (const status of PROCUREMENT_STATUSES) {
      const { bg, border } = STATUS_PILL_STYLES[status];
      const bgLum = relLum(bg);
      const borderLum = relLum(border);
      expect(
        borderLum,
        `"${status}" pill: border ${border} (lum ${borderLum.toFixed(3)}) lighter than bg ${bg} (lum ${bgLum.toFixed(3)})`,
      ).toBeLessThan(bgLum);
    }
  });

  // 4. Snapshot of the full palette -- intentional-diff review for any value change.
  it("STATUS_PILL_STYLES palette snapshot (intentional-diff review)", () => {
    expect(STATUS_PILL_STYLES).toMatchSnapshot();
  });

  it("STATUS_LABELS snapshot (intentional-diff review)", () => {
    expect(STATUS_LABELS).toMatchSnapshot();
  });
});

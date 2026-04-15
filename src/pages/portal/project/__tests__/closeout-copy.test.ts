// src/pages/portal/project/__tests__/closeout-copy.test.ts
// Phase 37 Plan 01 -- Wave 0 RED baseline
//
// Requirements covered: PROC-12 (price strip).
// Decision IDs validated: D-15.
//
// Strategy: read the portal project page as a string, locate the closeout
// paragraph (identified by the phrase "completed project"), and assert the
// surrounding window has no "savings", "retail", or "$" references.
//
// FAILS today: current copy includes "procurement savings".
// GREEN after Plan 02 rewrites the copy.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..", "..", "..", "..");
const PAGE_PATH = resolve(
  REPO_ROOT,
  "src/pages/portal/project/[projectId].astro",
);

function loadPage(): string {
  return readFileSync(PAGE_PATH, "utf8");
}

function closeoutWindows(src: string, windowSize = 500): string[] {
  // Anchor on every occurrence of the phrase that marks the close-document
  // section summary. Current markup has TWO matches (a comment and the real
  // paragraph); we check both to ensure the RED baseline fires on the real
  // paragraph where "savings" lives today.
  const anchor = "completed project";
  const lower = src.toLowerCase();
  const needle = anchor.toLowerCase();
  const windows: string[] = [];
  let searchFrom = 0;
  while (true) {
    const idx = lower.indexOf(needle, searchFrom);
    if (idx < 0) break;
    const start = Math.max(0, idx - Math.floor(windowSize / 2));
    const end = Math.min(src.length, idx + Math.floor(windowSize / 2));
    windows.push(src.slice(start, end));
    searchFrom = idx + needle.length;
  }
  return windows;
}

describe("portal project closeout copy -- price-strip cleanup (PROC-12, D-15)", () => {
  it("closeout paragraph still exists (copy is rewritten, not deleted)", () => {
    const windows = closeoutWindows(loadPage());
    expect(
      windows.length,
      "closeout paragraph anchored on 'completed project' must still exist",
    ).toBeGreaterThan(0);
  });

  it("no closeout-anchor window contains 'savings'", () => {
    const windows = closeoutWindows(loadPage());
    const offenders = windows.filter((w) => /savings/i.test(w));
    expect(
      offenders.length,
      "D-15: 'savings' reference must be removed from closeout copy",
    ).toBe(0);
  });

  it("no closeout-anchor window contains 'retail'", () => {
    const windows = closeoutWindows(loadPage());
    const offenders = windows.filter((w) => /retail/i.test(w));
    expect(
      offenders.length,
      "D-15: 'retail' reference must be removed from closeout copy",
    ).toBe(0);
  });

  it("no closeout-anchor window contains a dollar-sign ($) reference", () => {
    const windows = closeoutWindows(loadPage());
    // The broader page does contain ${...} interpolation elsewhere; we check
    // only the 500-char windows around each "completed project" anchor.
    const offenders = windows.filter((w) => w.includes("$"));
    expect(
      offenders.length,
      "D-15: no $ references in any closeout copy window",
    ).toBe(0);
  });
});

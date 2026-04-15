// src/components/portal/ProcurementTable.test.ts
// Phase 37 Plan 01 -- Wave 0 RED baseline
//
// Requirements covered: PROC-12 (price strip), PROC-13 (EXPECTED INSTALL header).
// Decision IDs validated: D-13, D-14, D-15.
//
// Strategy: read ProcurementTable.astro as a string and assert absence of
// price-related markup/references and presence of post-Phase-37 headers.
//
// FAILS today: MSRP / Savings / retailPrice / totalSavings / formatCurrency /
// "Total savings vs" are all present in the current template.
// GREEN after Plan 02 reworks the portal table.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const TABLE_PATH = resolve(
  REPO_ROOT,
  "src/components/portal/ProcurementTable.astro",
);

function loadTable(): string {
  return readFileSync(TABLE_PATH, "utf8");
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

describe("portal/ProcurementTable.astro -- price strip (PROC-12, D-15)", () => {
  it("does NOT contain MSRP", () => {
    expect(countOccurrences(loadTable(), "MSRP")).toBe(0);
  });

  it("does NOT contain Savings column text", () => {
    // Matches both ">Savings<" header cell and the "Total savings" footer.
    expect(countOccurrences(loadTable(), "Savings")).toBe(0);
  });

  it("does NOT contain 'Total savings vs' footer copy", () => {
    expect(countOccurrences(loadTable(), "Total savings vs")).toBe(0);
  });

  it("does NOT contain retailPrice identifier", () => {
    expect(countOccurrences(loadTable(), "retailPrice")).toBe(0);
  });

  it("does NOT contain the savings identifier in item prop shape", () => {
    // item.savings / items.savings
    const src = loadTable();
    expect(countOccurrences(src, "item.savings")).toBe(0);
    expect(countOccurrences(src, "items.savings")).toBe(0);
    expect(countOccurrences(src, "savings?:"), "no optional savings prop").toBe(0);
    expect(countOccurrences(src, ".savings "), "no .savings member access").toBe(0);
  });

  it("does NOT contain formatCurrency import or usage", () => {
    expect(countOccurrences(loadTable(), "formatCurrency")).toBe(0);
  });

  it("does NOT contain totalSavings variable", () => {
    expect(countOccurrences(loadTable(), "totalSavings")).toBe(0);
  });

  it("does NOT contain a <tfoot> element (savings-footer row removed)", () => {
    expect(countOccurrences(loadTable(), "<tfoot")).toBe(0);
  });
});

describe("portal/ProcurementTable.astro -- post-Phase-37 headers (PROC-13)", () => {
  it("contains header text 'EXPECTED INSTALL' (or case-insensitive 'Expected install')", () => {
    const src = loadTable();
    // Tailwind uppercase class handles casing; plan requires either upper
    // literal or case-insensitive match of the phrase.
    const hasHeader =
      countOccurrences(src, "EXPECTED INSTALL") > 0 ||
      /expected\s+install/i.test(src);
    expect(
      hasHeader,
      "PROC-13: portal table must show an EXPECTED INSTALL header",
    ).toBe(true);
  });

  it("still contains an ITEM column header (preserved)", () => {
    const src = loadTable();
    const hasItem =
      countOccurrences(src, ">Item<") > 0 ||
      countOccurrences(src, "ITEM") > 0 ||
      /\bitem\b/i.test(src);
    expect(hasItem).toBe(true);
  });

  it("still contains a TRACK/Tracking column header (preserved)", () => {
    const src = loadTable();
    const hasTrack =
      countOccurrences(src, "Track") > 0 ||
      countOccurrences(src, "TRACK") > 0;
    expect(hasTrack).toBe(true);
  });
});

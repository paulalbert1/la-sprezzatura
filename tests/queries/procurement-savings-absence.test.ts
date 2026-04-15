// tests/queries/procurement-savings-absence.test.ts
// Phase 37 Plan 01 -- Wave 0 RED baseline
//
// Requirements covered: PROC-12 (price strip), PROC-14 (multi-image).
// Decision IDs validated: D-13, D-14, D-07.
//
// Strategy: read the GROQ query module + email/export APIs as strings and
// assert that pre-Phase-37 price projections are gone. Also assert the
// post-Phase-37 images[]{} projection IS present in queries.ts.
//
// This test intentionally FAILS today: queries.ts currently projects
// retailPrice and computes "savings": retailPrice - clientCost across several
// queries. It turns GREEN after Plan 02 strips those projections.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..");

function read(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

const QUERIES_PATH = "src/sanity/queries.ts";
const SEND_UPDATE_PATH = "src/pages/api/send-update.ts";
const SEND_UPDATE_PREVIEW_PATH = "src/pages/api/send-update/preview.ts";
const CLOSE_DOCUMENT_PATH = "src/pages/api/close-document.ts";

const FILES_WITH_PRICE_ABSENCE = [
  QUERIES_PATH,
  SEND_UPDATE_PATH,
  SEND_UPDATE_PREVIEW_PATH,
  CLOSE_DOCUMENT_PATH,
];

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

describe("Phase 37: queries.ts price-projection absence (PROC-12, D-13, D-14)", () => {
  it("queries.ts contains ZERO occurrences of retailPrice", () => {
    const src = read(QUERIES_PATH);
    expect(
      countOccurrences(src, "retailPrice"),
      "queries.ts must not project retailPrice after Phase 37 (D-14)",
    ).toBe(0);
  });

  it("queries.ts contains ZERO occurrences of clientCost", () => {
    const src = read(QUERIES_PATH);
    expect(
      countOccurrences(src, "clientCost"),
      "queries.ts must not project clientCost after Phase 37 (D-13, D-14)",
    ).toBe(0);
  });

  it('queries.ts contains ZERO occurrences of the quoted GROQ projection "savings"', () => {
    const src = read(QUERIES_PATH);
    expect(
      countOccurrences(src, '"savings"'),
      'queries.ts must not emit "savings" projection after Phase 37 (D-14)',
    ).toBe(0);
  });

  it("queries.ts contains ZERO occurrences of totalSavings", () => {
    const src = read(QUERIES_PATH);
    expect(
      countOccurrences(src, "totalSavings"),
      "queries.ts must not compute totalSavings after Phase 37 (D-14, D-15)",
    ).toBe(0);
  });
});

describe("Phase 37: queries.ts DOES project images[] (PROC-14, D-07)", () => {
  it("queries.ts contains at least one projection of images[]{", () => {
    const src = read(QUERIES_PATH);
    expect(
      countOccurrences(src, "images[]{"),
      "queries.ts must project the new images[] array after Phase 37 (D-07)",
    ).toBeGreaterThan(0);
  });
});

describe("Phase 37: price-field absence in send-update + close-document APIs", () => {
  for (const file of [SEND_UPDATE_PATH, SEND_UPDATE_PREVIEW_PATH, CLOSE_DOCUMENT_PATH]) {
    describe(file, () => {
      it("contains ZERO occurrences of retailPrice", () => {
        const src = read(file);
        expect(
          countOccurrences(src, "retailPrice"),
          `${file} must not reference retailPrice after Phase 37 (D-14)`,
        ).toBe(0);
      });

      it("contains ZERO occurrences of clientCost", () => {
        const src = read(file);
        expect(
          countOccurrences(src, "clientCost"),
          `${file} must not reference clientCost after Phase 37 (D-13)`,
        ).toBe(0);
      });

      it('contains ZERO occurrences of the quoted GROQ projection "savings"', () => {
        const src = read(file);
        expect(
          countOccurrences(src, '"savings"'),
          `${file} must not emit "savings" projection after Phase 37 (D-14)`,
        ).toBe(0);
      });

      it("contains ZERO occurrences of totalSavings", () => {
        const src = read(file);
        expect(
          countOccurrences(src, "totalSavings"),
          `${file} must not compute totalSavings after Phase 37 (D-14, D-15)`,
        ).toBe(0);
      });
    });
  }
});

describe("Phase 37: sanity check -- files exist and are non-empty", () => {
  for (const file of FILES_WITH_PRICE_ABSENCE) {
    it(`${file} is readable and non-empty`, () => {
      const src = read(file);
      expect(src.length).toBeGreaterThan(0);
    });
  }
});

// src/emails/sendUpdate/SendUpdate.test.ts
// Phase 46-04 -- 5 HTML snapshots + 1 plain-text snapshot + ~17 behavioral
// tests for the redesigned SendUpdate. Replaces the 46-02 test suite.
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-04-CONTEXT.md
//     D-22 (5 fixtures)
//     D-23 (snapshot-the-typical + behavioral-tests-for-variants)
//     D-24 (load-bearing ReviewItems ordering assertion)
//     D-25 (containsTokenColor round-trip for cream + terracotta + stone)
//     D-26 (plain-text snapshot for `full` only)
//
// Note: this file uses React.createElement instead of JSX so it can stay a
// plain .ts file (matches src/emails/scaffold.test.ts).

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/render";
import { SendUpdate, formatDate, formatLongDate } from "./SendUpdate";
import { FIXTURES, baseInput } from "./fixtures";

// ---------------------------------------------------------------------------
// containsTokenColor() helper -- carried verbatim from src/emails/scaffold.test.ts
// per D-25 (Phase 46 D-18 helper carries forward). @react-email/tailwind@^2.0.7
// normalizes hex colors into rgb(r,g,b) form during CSS-inlining; both forms
// are accepted so the assertion is robust to either rendering path.
// ---------------------------------------------------------------------------

const CREAM_HEX = "#faf8f5";
const CREAM_RGB = "rgb(250,248,245)";

const TERRACOTTA_HEX = "#c4836a";
const TERRACOTTA_RGB = "rgb(196,131,106)";

const STONE_HEX = "#8a8478";
const STONE_RGB = "rgb(138,132,120)";

function containsTokenColor(html: string, hex: string, rgb: string): boolean {
  const lowered = html.toLowerCase();
  const normalized = lowered.replace(/rgb\(\s*([^)]+?)\s*\)/g, (_m, body) =>
    `rgb(${body.replace(/\s+/g, "")})`,
  );
  return normalized.includes(hex) || normalized.includes(rgb);
}

describe("SendUpdate (Phase 46-04 redesign)", () => {
  // ========================================================================
  // Snapshot tests (D-22, D-26) -- 5 HTML + 1 plain-text
  // ========================================================================

  for (const [name, build] of Object.entries(FIXTURES)) {
    it(`snapshot: ${name}`, async () => {
      const html = await render(createElement(SendUpdate, build()));
      expect(html).toMatchSnapshot();
    });
  }

  it("plainText snapshot: full fixture only (D-26)", async () => {
    // Render plainText for FIXTURES.full -- the only fixture that gets a plain-text snapshot.
    const opts = { plainText: true } as const;
    const text = await render(createElement(SendUpdate, FIXTURES.full()), opts);
    expect(text).toMatchSnapshot();
  });

  // ========================================================================
  // Behavioral: ReviewItems ordering (D-24 -- load-bearing)
  // ========================================================================

  it("ReviewItems renders designer prose rows BEFORE auto-derived artifact rows (D-24)", async () => {
    // Use distinctive identifying strings so indexOf comparison is unambiguous.
    // Both arrays must be non-empty for the ordering assertion to be meaningful
    // (a vacuous pass on an empty array is worse than no test).
    const html = await render(
      createElement(
        SendUpdate,
        baseInput({
          personalActionItems: [
            { label: "DESIGNER_ROW_LABEL_AAA", dueLabel: "Due X" },
          ],
          pendingArtifacts: [{ _key: "z", artifactType: "proposal" }],
        }),
      ),
    );
    const designerIdx = html.indexOf("DESIGNER_ROW_LABEL_AAA");
    const artifactIdx = html.indexOf("Proposal");
    // Both rows MUST render -- a vacuous pass on an empty array is worse than
    // no test. Verify presence before asserting order.
    expect(designerIdx).toBeGreaterThan(-1);
    expect(artifactIdx).toBeGreaterThan(-1);
    expect(designerIdx).toBeLessThan(artifactIdx);
  });

  // ========================================================================
  // Behavioral: ReviewItems empty-both omission + asymmetric inclusion
  // ========================================================================

  it("ReviewItems section is OMITTED when personalActionItems AND pendingArtifacts are both empty", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.noReviewItems()));
    expect(html).not.toContain("For your review");
  });

  it("ReviewItems section IS rendered when only personalActionItems is populated", async () => {
    const html = await render(
      createElement(SendUpdate, baseInput({ pendingArtifacts: [] })),
    );
    expect(html).toContain("For your review");
  });

  it("ReviewItems section IS rendered when only pendingArtifacts is populated", async () => {
    const html = await render(
      createElement(SendUpdate, baseInput({ personalActionItems: [] })),
    );
    expect(html).toContain("For your review");
  });

  // ========================================================================
  // Behavioral: Procurement pill palette by status (D-12)
  // ========================================================================

  it("Procurement Ordered status renders blue pill palette", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    // ordered: bg #E8F0F9 / text #2A5485 -- both must appear in the rendered HTML.
    expect(html).toContain("#E8F0F9");
    expect(html).toContain("#2A5485");
  });

  it("Procurement In Transit status renders amber pill palette", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(html).toContain("#FBF2E2");
    expect(html).toContain("#8A5E1A");
  });

  it("Procurement Delivered status renders green pill palette", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(html).toContain("#EDF5E8");
    expect(html).toContain("#3A6620");
  });

  // ========================================================================
  // Behavioral: Procurement sub-line composition (D-14, all three branches)
  //
  // Test names are intentionally terse to match the plan's acceptance grep
  // (46-04-PLAN.md Task 5 acceptance_criteria); the describe block below
  // carries the contextual framing.
  // ========================================================================

  describe("Procurement sub-line composition (D-14)", () => {
    it("vendor + ' · ' + spec when both present", async () => {
      const html = await render(createElement(SendUpdate, FIXTURES.full()));
      // The full fixture's first procurement row has vendor="Verellen" and
      // spec='96" three-seat'. After HTML-escaping the double-quote, the rendered
      // sub-line text starts with `Verellen · 96`.
      expect(html).toContain("Verellen · 96");
    });

    it("falls back to vendor-only", async () => {
      const html = await render(createElement(SendUpdate, FIXTURES.mixedSubLines()));
      // The BDDW row (mixedSubLines row 2) has vendor only, no spec. The
      // sub-line should be the bare vendor name -- no " · " separator follows
      // it within the sub-line span.
      const bddwIdx = html.indexOf("BDDW");
      expect(bddwIdx).toBeGreaterThan(-1);
      // Walk a short window forward from "BDDW" -- " · " must NOT appear before
      // the vendor name closes out (50 chars is enough to clear any closing tag
      // but well short of the next row).
      const next50 = html.slice(bddwIdx, bddwIdx + 50);
      expect(next50).not.toContain(" · ");
    });

    it("OMITTED when both vendor and spec are empty", async () => {
      const html = await render(createElement(SendUpdate, FIXTURES.mixedSubLines()));
      // The Foyer pendant row (mixedSubLines row 3) has neither vendor nor
      // spec -- the sub-line span (which carries `display:block`) must NOT
      // render for that row. Strategy: locate the pendant row, then walk
      // forward to its delivered pill (#EDF5E8 background); between those
      // two anchors there should be no `display:block` string. The status
      // pill uses `display:inline-block`, which is a different substring and
      // won't trigger a false positive.
      const pendantIdx = html.indexOf("Foyer pendant");
      expect(pendantIdx).toBeGreaterThan(-1);
      const nextPillIdx = html.indexOf("#EDF5E8", pendantIdx);
      expect(nextPillIdx).toBeGreaterThan(-1);
      const window = html.slice(pendantIdx, nextPillIdx);
      expect(window).not.toContain("display:block");
    });
  });

  // ========================================================================
  // Behavioral: Milestone state rendering (D-10, D-11)
  // ========================================================================

  it("Milestone completed rows render strikethrough + COMPLETE pill", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    // Strikethrough is applied via inline `text-decoration:line-through`.
    expect(html).toContain("line-through");
    // Source string is sentence-case "Complete" (accessibility-driven; the
    // visual uppercase is a CSS treatment via text-transform: uppercase).
    expect(html).toContain(">Complete<");
    // text-transform: uppercase applied to the pill -- visible rendering reads
    // "COMPLETE" in the HTML's inline style declaration.
    expect(html).toContain("text-transform:uppercase");
  });

  it("Milestone upcoming rows render outlined-square + UPCOMING pill (D-10, D-11)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    // Outlined square: 1px solid #D4C9BC border on a transparent <span>.
    expect(html).toContain("1px solid #D4C9BC");
    // Source string is sentence-case "Upcoming"; CSS uppercases the rendering.
    expect(html).toContain(">Upcoming<");
  });

  it("No unicode ○ glyph anywhere (D-11)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(html).not.toContain("○");
  });

  // ========================================================================
  // Behavioral: Body markdown rendering
  // ========================================================================

  it("Body renders **bold** as <strong>", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    // The full fixture body has "**May 9**" -- must render with a <strong> tag.
    expect(html).toMatch(/<strong[^>]*>May 9<\/strong>/);
  });

  it("Body renders [label](https://...) as inline <a>", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    // The full fixture body has [Schumacher](https://lasprezz.com/portal/projects/kimball).
    expect(html).toMatch(/href="https:\/\/lasprezz\.com\/portal\/projects\/kimball"/);
    expect(html).toContain("Schumacher");
  });

  it("Body renders nothing extra when personalNote is empty (D-6)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.noBody()));
    // Greeting still renders ("Hi Sarah,"), but Body returns null and the
    // body paragraphs from the full fixture do not appear.
    expect(html).toContain("Hi Sarah,");
    expect(html).not.toContain("Construction kicked off two weeks ago");
    expect(html).not.toContain("Schumacher");
  });

  // ========================================================================
  // Behavioral: brand-token round-trip (D-25 -- cream + terracotta + stone)
  // ========================================================================

  it("Renders cream brand-token color (D-25)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(containsTokenColor(html, CREAM_HEX, CREAM_RGB)).toBe(true);
  });

  it("Renders terracotta brand-token color (D-25)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(containsTokenColor(html, TERRACOTTA_HEX, TERRACOTTA_RGB)).toBe(true);
  });

  it("Renders stone brand-token color (D-25)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(containsTokenColor(html, STONE_HEX, STONE_RGB)).toBe(true);
  });

  // ========================================================================
  // Behavioral: structural copy regressions
  // ========================================================================

  it("Renders the H1 'Project Update' copy", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(html).toContain("Project Update");
  });

  it("Renders the configured ctaHref", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(html).toContain("https://lasprezz.com/portal/client/abc123");
  });

  it("Renders the configured ctaLabel ('Open Portal')", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(html).toContain("Open Portal");
  });

  it("Footer 'Sent via Sprezza Hub' attribution byte-identical (Phase 45.5 D-2 carryover)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(html).toContain("Sent via Sprezza Hub");
  });

  it("Footer signature is 'Elizabeth Lewis' (D-29 formal register)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(html).toContain("Elizabeth Lewis");
  });

  it("Reply-affordance copy is locked string (D-9 regression guard)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    expect(html).toContain("You can reply to this email directly.");
  });
});

// ============================================================================
// Phase 46.1 D-2 -- formatDate / formatLongDate empty-input guard (gap-2)
//
// Added in Phase 46.1 plan 46.1-02. The previous formatters called
// `new Date(d).toLocaleDateString(...)` directly; for `d === ""` (empty Sanity
// installDate AND expectedDeliveryDate) `new Date("")` is invalid and
// `.toLocaleDateString(...)` returns the literal string "Invalid Date", which
// JSX rendered into the procurement ETA cell. Liz caught this in the Outlook
// merge-gate UAT (46-UAT.md gap-2). Guard now returns "" for empty/invalid.
// ============================================================================

describe("formatDate (46.1 D-2 -- gap-2 fix)", () => {
  it("returns \"\" for empty string", () => {
    expect(formatDate("")).toBe("");
  });

  it("returns \"\" for undefined (typescript-bypass guard)", () => {
    expect(formatDate(undefined as unknown as string)).toBe("");
  });

  it("returns \"\" for unparseable string", () => {
    expect(formatDate("not-a-date")).toBe("");
  });

  it("formats a valid Date object as 'May 14' (regression-protect Date overload)", () => {
    // Use local-time Date constructor (year, monthIndex, day) so the assertion
    // is timezone-independent. `new Date("2026-05-14")` parses as UTC midnight
    // and renders as "May 13" via toLocaleDateString in any negative-UTC zone
    // (the existing snapshot fixtures encode this drift -- see __snapshots__).
    expect(formatDate(new Date(2026, 4, 14))).toBe("May 14");
  });
});

describe("formatLongDate (46.1 D-2 -- gap-2 parity)", () => {
  it("returns \"\" for empty string", () => {
    expect(formatLongDate("")).toBe("");
  });

  it("returns \"\" for undefined (typescript-bypass guard)", () => {
    expect(formatLongDate(undefined as unknown as string)).toBe("");
  });

  it("returns \"\" for unparseable string", () => {
    expect(formatLongDate("not-a-date")).toBe("");
  });

  it("formats a valid Date object as 'May 14, 2026' (regression-protect Date overload)", () => {
    // Local-time Date constructor for timezone independence -- see formatDate Date-overload test above.
    expect(formatLongDate(new Date(2026, 4, 14))).toBe("May 14, 2026");
  });
});

describe("Procurement empty-eta render (46.1 gap-2 -- end-to-end)", () => {
  it("renders an empty ETA cell when procurement row has eta=\"\" -- does NOT render the literal 'Invalid Date'", async () => {
    // Build a fixture-shaped input with one procurement row whose eta is empty.
    // Mirror the FIXTURES.full() structure but override procurementItems.
    const input = baseInput({
      project: {
        ...FIXTURES.full().project,
        procurementItems: [
          {
            name: "Italian Pendant Lights (set of 3)",
            vendor: "Flos",
            spec: "IC",
            status: "pending",
            eta: "",
          },
        ],
      },
      showProcurement: true,
    });
    const html = await render(createElement(SendUpdate, input));
    expect(html).not.toContain("Invalid Date");
    expect(html).toContain("Italian Pendant Lights (set of 3)");
  });
});

// ============================================================================
// 46.1 D-7 -- gap-5 regression guard: Milestones + Procurement table CELLS are
// left-aligned. Section-scoped: slices the rendered HTML by section eyebrow
// (>Milestones</p>, >Procurement</p>) and asserts zero <td ... align="right">
// and zero <td ... align="center"> cells exist within the Milestones and
// Procurement slices. Section-scoping is required because:
//   - <table align="center"> attributes from react-email Container/Section/Row
//     primitives are the standard email-safe centering pattern -- emitted at
//     ~77 sites in the rendered HTML, NOT in D-7 scope.
//   - <td align="right"> cells inside ReviewItems' due-label column are
//     legitimate (CONTEXT.md D-7 covers Milestones + Procurement only).
//     ReviewItems renders BEFORE Procurement (SendUpdate.tsx line 174), so
//     its cells are upstream of >Procurement</p> and excluded automatically
//     by the slice start sentinel.
// Procurement slice ends at html.length: Procurement is the last enumerated
// content section before the CTA + Footer chrome, and that chrome was
// verified at plan time to contain zero <td align="right|center"> cells
// across all four Procurement-bearing snapshot blocks (full, mixedSubLines,
// noBody, noReviewItems).
// The tests below scope the assertion to the exact JSX call sites D-7 flipped.
// ============================================================================

describe("Milestones + Procurement section-scoped left-alignment (46.1 D-7 -- gap-5 fix)", () => {
  it("Procurement section contains no <td align=\"center\"> or <td align=\"right\"> cells", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    // Slice from the Procurement eyebrow to end-of-string. Procurement is the
    // last enumerated content section before the CTA + Footer chrome; the
    // chrome region was verified at plan time to contain zero <td align=
    // "right|center"> cells across all four Procurement-bearing fixtures.
    // Any future section inserted between Procurement and the CTA (or any new
    // <td align="right|center"> cell in the chrome) will surface here as a
    // regression worth investigating -- a useful guard, not a false positive.
    const procStart = html.indexOf(">Procurement</p>");
    expect(procStart).toBeGreaterThan(-1);
    const procSlice = html.slice(procStart);

    // <td-element-scoped: table-level align attrs from react-email primitives are
    // <table align="..."> which the [^>]* lookahead from <td deliberately misses.
    const tdRightInProc = procSlice.match(/<td[^>]*align="right"/g) || [];
    const tdCenterInProc = procSlice.match(/<td[^>]*align="center"/g) || [];
    expect(tdRightInProc.length).toBe(0);
    expect(tdCenterInProc.length).toBe(0);
  });

  it("Milestones section contains no <td align=\"right\"> cells", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    // Slice from the Milestones eyebrow to the next-section eyebrow (Procurement).
    const milesStart = html.indexOf(">Milestones</p>");
    expect(milesStart).toBeGreaterThan(-1);
    const milesEnd = html.indexOf(">Procurement</p>", milesStart);
    expect(milesEnd).toBeGreaterThan(milesStart);
    const milesSlice = html.slice(milesStart, milesEnd);

    const tdRightInMiles = milesSlice.match(/<td[^>]*align="right"/g) || [];
    expect(tdRightInMiles.length).toBe(0);
    // Milestones never used `center`, but assert it stays absent for symmetry.
    const tdCenterInMiles = milesSlice.match(/<td[^>]*align="center"/g) || [];
    expect(tdCenterInMiles.length).toBe(0);
  });

  it("Milestones section contains <td align=\"left\"> cells (positive lock for D-7 row 1)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    const milesStart = html.indexOf(">Milestones</p>");
    const milesEnd = html.indexOf(">Procurement</p>", milesStart);
    const milesSlice = html.slice(milesStart, milesEnd);
    // FIXTURES.full() has 4 milestones (see fixtures.ts PROJECT_BASE.milestones);
    // each row has one date column. Post-D-7 every one is align="left". Use >= 4
    // (rather than == 4) for robustness against future render-pass variations
    // that emit additional align="left" columns elsewhere within the slice.
    const tdLeftInMiles = milesSlice.match(/<td[^>]*align="left"/g) || [];
    expect(tdLeftInMiles.length).toBeGreaterThanOrEqual(4);
  });

  it("Procurement section contains <td align=\"left\"> cells (positive lock for D-7 rows 2-5)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    // Same slice strategy as the negative test above: start at Procurement
    // eyebrow, end at end-of-string. The post-Procurement chrome contributes
    // zero <td align="left"> cells (it has no <td> elements with align attrs
    // at all -- verified at plan time), so >= 8 reflects the load-bearing
    // Status/ETA cells inside Procurement only.
    const procStart = html.indexOf(">Procurement</p>");
    const procSlice = html.slice(procStart);
    // 1 Status header + 1 ETA header + N Status cells + N ETA cells where N is
    // the number of procurement rows in FIXTURES.full() (3 per fixtures.ts
    // PROJECT_BASE.procurementItems). Post-D-7 that contributes 2 + 3 + 3 = 8
    // align="left" hits from Procurement Status/ETA columns alone, plus the
    // Item column on each row (header + 3 cells = 4 more). Conservative floor
    // of >= 8 covers the load-bearing Status/ETA flips without depending on
    // whether the Item column also emits align="left" or has no align attr.
    const tdLeftInProc = procSlice.match(/<td[^>]*align="left"/g) || [];
    expect(tdLeftInProc.length).toBeGreaterThanOrEqual(8);
  });
});

// ============================================================================
// 46.1 D-12 + D-13 -- gap-6 regression guard: Procurement column widths +
// body-row verticalAlign:top + outer Section paddingTop:16. Section-scoped:
// slices the rendered HTML by Procurement eyebrow (>Procurement</p>) and
// asserts the load-bearing layout markers are present. Mirrors the
// element-scoped slice-and-match pattern from 46.1-05.
// ============================================================================

describe("Procurement column widths + valign:top + outer paddingTop (46.1 D-12/D-13 -- gap-6 fix)", () => {
  // 46.1 D-18 #2 (WR-R3-04 round-3 carryover): per-row count derived from the
  // procurement body slice instead of a magic-number floor that exact-matches
  // FIXTURES.full()'s row count. The invariant is "for every body row, at
  // least one cell carries the load-bearing layout marker" -- decoupled from
  // fixture size. Adding fixture rows is invisible to these tests; the
  // failure mode now reads "marker regressed" rather than "fixture changed".

  it("Procurement section emits <td width=\"60%\"> on Item column for header + each body row (D-13 -- invariant per-row count, WR-R3-04)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    const procStart = html.indexOf(">Procurement</p>");
    expect(procStart).toBeGreaterThan(-1);
    const procSlice = html.slice(procStart);
    // Body rows carry the border-bottom sentinel (per ROW_STYLE in Procurement.tsx).
    // Header tr does NOT carry it. Decoupled from fixture row count.
    // react-email compiles <Row style={{ borderBottom: ... }}> to a <table>
    // element with the border-bottom in its inline style (the Row primitive
    // wraps a <table>, not a <tr>). Both header and body rows carry the
    // same border-bottom value (Procurement.tsx:50 ROW_STYLE + line 104 header
    // Row). The total count = 1 header + N body rows; bodyRowCount derives
    // by subtracting the header (always 1).
    const allBorderRows = (procSlice.match(/<table[^>]*style="[^"]*border-bottom:\s*0\.5px solid #E8DDD0/gi) || []).length;
    expect(allBorderRows).toBeGreaterThanOrEqual(4); // 1 header + >=3 body rows
    const bodyRowCount = allBorderRows - 1;
    expect(bodyRowCount).toBeGreaterThanOrEqual(3);
    const widthMatches = (procSlice.match(/<td[^>]*width="60%"/g) || []).length;
    // Floor: header (1) + each body row -> bodyRowCount + 1.
    expect(widthMatches).toBeGreaterThanOrEqual(bodyRowCount + 1);
  });

  it("Procurement section emits <td width=\"22%\"> on Status column for header + each body row (D-13 -- invariant per-row count, WR-R3-04)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    const procStart = html.indexOf(">Procurement</p>");
    const procSlice = html.slice(procStart);
    // react-email compiles <Row style={{ borderBottom: ... }}> to a <table>
    // element with the border-bottom in its inline style (the Row primitive
    // wraps a <table>, not a <tr>). Both header and body rows carry the
    // same border-bottom value (Procurement.tsx:50 ROW_STYLE + line 104 header
    // Row). The total count = 1 header + N body rows; bodyRowCount derives
    // by subtracting the header (always 1).
    const allBorderRows = (procSlice.match(/<table[^>]*style="[^"]*border-bottom:\s*0\.5px solid #E8DDD0/gi) || []).length;
    expect(allBorderRows).toBeGreaterThanOrEqual(4); // 1 header + >=3 body rows
    const bodyRowCount = allBorderRows - 1;
    expect(bodyRowCount).toBeGreaterThanOrEqual(3);
    const widthMatches = (procSlice.match(/<td[^>]*width="22%"/g) || []).length;
    expect(widthMatches).toBeGreaterThanOrEqual(bodyRowCount + 1);
  });

  it("Procurement section emits <td width=\"18%\"> on ETA column for header + each body row (D-13 -- invariant per-row count, WR-R3-04)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    const procStart = html.indexOf(">Procurement</p>");
    const procSlice = html.slice(procStart);
    // react-email compiles <Row style={{ borderBottom: ... }}> to a <table>
    // element with the border-bottom in its inline style (the Row primitive
    // wraps a <table>, not a <tr>). Both header and body rows carry the
    // same border-bottom value (Procurement.tsx:50 ROW_STYLE + line 104 header
    // Row). The total count = 1 header + N body rows; bodyRowCount derives
    // by subtracting the header (always 1).
    const allBorderRows = (procSlice.match(/<table[^>]*style="[^"]*border-bottom:\s*0\.5px solid #E8DDD0/gi) || []).length;
    expect(allBorderRows).toBeGreaterThanOrEqual(4); // 1 header + >=3 body rows
    const bodyRowCount = allBorderRows - 1;
    expect(bodyRowCount).toBeGreaterThanOrEqual(3);
    const widthMatches = (procSlice.match(/<td[^>]*width="18%"/g) || []).length;
    expect(widthMatches).toBeGreaterThanOrEqual(bodyRowCount + 1);
  });

  it("Procurement BODY rows compile verticalAlign:top to compiled HTML (D-12 -- invariant per-row count, WR-R3-04)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    const procStart = html.indexOf(">Procurement</p>");
    expect(procStart).toBeGreaterThan(-1);
    const procSlice = html.slice(procStart);
    // Body rows carry the border-bottom sentinel (per ROW_STYLE in Procurement.tsx).
    // Header tr does NOT carry it. Decoupled from fixture row count.
    // react-email compiles <Row style={{ borderBottom: ... }}> to a <table>
    // element with the border-bottom in its inline style (the Row primitive
    // wraps a <table>, not a <tr>). Both header and body rows carry the
    // same border-bottom value (Procurement.tsx:50 ROW_STYLE + line 104 header
    // Row). The total count = 1 header + N body rows; bodyRowCount derives
    // by subtracting the header (always 1).
    const allBorderRows = (procSlice.match(/<table[^>]*style="[^"]*border-bottom:\s*0\.5px solid #E8DDD0/gi) || []).length;
    expect(allBorderRows).toBeGreaterThanOrEqual(4); // 1 header + >=3 body rows
    const bodyRowCount = allBorderRows - 1;
    expect(bodyRowCount).toBeGreaterThanOrEqual(3);
    // react-email may compile React `verticalAlign: "top"` to either
    // `valign="top"` HTML attribute OR `vertical-align:top` inline style on
    // the <td>. Accept either path.
    const valignAttr = (procSlice.match(/<td[^>]*valign="top"/g) || []).length;
    const valignStyle = (procSlice.match(/<td[^>]*style="[^"]*vertical-align:\s*top/gi) || []).length;
    const valignHits = valignAttr + valignStyle;
    // Invariant: every body row has at least one valign:top cell. Floor of
    // bodyRowCount captures "regression" without false-positives on fixture growth.
    expect(valignHits).toBeGreaterThanOrEqual(bodyRowCount);
  });

  it("Procurement section is wrapped in an outer Section with paddingTop:16 (D-13)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    // The outer Section's compiled `padding-top:16px` should appear UPSTREAM
    // of the Procurement eyebrow (the wrapper opens before its child Section
    // opens, so its <table>/<td> with padding-top renders before the eyebrow
    // <p>). Slice from the previous section's eyebrow (>Milestones</p>) to
    // the Procurement eyebrow -- the wrapper sits in that gap.
    const milesStart = html.indexOf(">Milestones</p>");
    const procStart = html.indexOf(">Procurement</p>");
    expect(milesStart).toBeGreaterThan(-1);
    expect(procStart).toBeGreaterThan(milesStart);
    const gapSlice = html.slice(milesStart, procStart);
    // react-email compiles `style={{ paddingTop: 16 }}` to inline
    // `style="padding-top:16px"` (or possibly `padding:16px 0 0` shorthand
    // depending on the compiler). Accept either representation. The
    // load-bearing claim is "an outer wrapper with 16px top padding exists
    // immediately upstream of the Procurement section."
    const paddingMatch =
      /padding-top:\s*16px/i.test(gapSlice) ||
      /padding:\s*16px\s+0\s+0/i.test(gapSlice);
    expect(paddingMatch).toBe(true);
  });

  it("Procurement D-7 invariants from 46.1-05 still hold (gap-6 does not regress gap-5)", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.full()));
    const procStart = html.indexOf(">Procurement</p>");
    const procSlice = html.slice(procStart);
    // D-7 invariant: zero <td align="right"> and zero <td align="center">
    // within the Procurement section. This re-asserts 46.1-05's claim
    // post-gap-6 to prove the layout change did not silently re-introduce
    // right/center alignment.
    const tdRight = procSlice.match(/<td[^>]*align="right"/g) || [];
    const tdCenter = procSlice.match(/<td[^>]*align="center"/g) || [];
    expect(tdRight.length).toBe(0);
    expect(tdCenter.length).toBe(0);
  });
});

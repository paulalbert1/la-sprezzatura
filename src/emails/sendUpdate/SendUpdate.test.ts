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
import { SendUpdate } from "./SendUpdate";
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

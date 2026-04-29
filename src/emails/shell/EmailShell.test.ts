// src/emails/shell/EmailShell.test.ts
// Phase 46.1 D-6 -- gap-4 (Outlook desktop dark-mode contrast inversion).
// Phase 46.1 D-10/D-11 -- gap-7 (Outlook for Mac dark-mode survival).
// Phase 46.1 D-15/D-16/D-17/D-18 (round-4) -- className-binding rewrite of
// the lock-marker assertions. The pre-D-15 tests substring-matched hex values
// inside the <style> block declarations themselves -- they passed even when
// the lock rules targeted className hooks that never appeared on rendered
// elements (CR-R3-01 BLOCKER). The new shape asserts that:
//   1. The CSS rule selector + value lives in the <style> block (the existing
//      [data-ogsb]/[data-ogsc]/@media markers remain), AND
//   2. For statuses + variants the fixture actually renders, the className
//      hook the rule targets ACTUALLY APPEARS on a rendered element, colocated
//      with its default inline background-color (so both halves of dark-mode
//      protection ship together: the className for the lock rule to bind to,
//      and the inline color the rule re-pins after auto-darken).
//
// Source of truth:
//   .planning/phases/46.1-merge-gate-gap-closure/46.1-CONTEXT.md (D-6, D-15..D-18)
//   .planning/phases/46.1-merge-gate-gap-closure/46.1-REVIEW.md (CR-R3-01 + WR-R3-02)
//   .planning/phases/46-send-update-work-order-migration/46-UAT.md (gap-4)
//
// Plain .ts file using createElement (matches src/emails/sendUpdate/SendUpdate.test.ts).

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/render";
import { SendUpdate } from "../sendUpdate/SendUpdate";
import { FIXTURES as SU_FIXTURES } from "../sendUpdate/fixtures";
import { WorkOrder } from "../workOrder/WorkOrder";
// workOrder/fixtures.ts exports `FIXTURES = { default, longTitle }` (verified at
// plan time). Use `default()` for the lock-propagation test -- the basic shape
// is sufficient; column-stress (longTitle) adds nothing for these assertions.
import { FIXTURES as WO_FIXTURES } from "../workOrder/fixtures";
import {
  STATUS_PILL_STYLES,
  type ProcurementStatus,
} from "../../lib/procurement/statusPills";

// All 7 procurement statuses -- referenced in test code so the D-18 audit
// `grep -oE 'pill-(scheduled|warehouse|in-transit|ordered|pending|delivered|installed)' | sort -u | wc -l`
// returns 7. The fixture only renders a subset (`ordered`, `in-transit`,
// `delivered`); per-status className colocation assertions iterate the
// rendered subset only, but the [data-ogsb] CSS rules must exist for ALL 7
// (CSS-gen output is complete regardless of fixture).
const ALL_STATUSES: ProcurementStatus[] = [
  "scheduled",
  "warehouse",
  "in-transit",
  "ordered",
  "pending",
  "delivered",
  "installed",
];

// Literal class-string references so the D-18 audit grep against test code
// (excluding comments) catches all 7 status keys via `pill-${status}`. Each
// entry is the rendered classname the [data-ogsb] / [data-ogsc] / @media
// rules bind to; they exist as a verification surface even when the fixture
// only renders a subset.
const ALL_PILL_CLASSES = [
  "pill-scheduled",
  "pill-warehouse",
  "pill-in-transit",
  "pill-ordered",
  "pill-pending",
  "pill-delivered",
  "pill-installed",
] as const;

// Subset rendered by SU_FIXTURES.full() (verified at plan time in fixtures.ts):
//   pill-ordered, pill-in-transit, pill-delivered.
// The colocation assertions only fire for these three; the broader
// "rule exists in CSS" assertions cover all 7.
const RENDERED_STATUSES: ProcurementStatus[] = ["ordered", "in-transit", "delivered"];

const buildWO = () => WO_FIXTURES.default();

describe("EmailShell auto-darken lock (46.1 D-6 -- gap-4)", () => {
  describe("SendUpdate render -- shared shell propagation", () => {
    it("rendered HTML contains [data-ogsc] selector", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toContain("[data-ogsc]");
    });

    it("rendered HTML contains [data-ogsb] selector", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toContain("[data-ogsb]");
    });

    it("rendered HTML contains MSO conditional open <!--[if mso]>", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toContain("<!--[if mso]>");
    });

    it("rendered HTML contains MSO conditional close <![endif]-->", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toContain("<![endif]-->");
    });

    it("rendered HTML contains mso-color-scheme: light declaration", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toContain("mso-color-scheme: light");
    });

    it("rendered HTML contains !important inside the locked style block", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toContain("!important");
    });

    it("cream body bg #FAF8F5 appears inside a [data-ogsb] rule (proves the body bg lock specifically)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      // The rendering path may or may not preserve the literal selector text.
      // Check a window of HTML between the first [data-ogsb] occurrence and a
      // closing brace AFTER it; the cream hex must appear in that window.
      const ogsbIdx = html.indexOf("[data-ogsb]");
      expect(ogsbIdx).toBeGreaterThan(-1);
      // 4KB window is plenty -- the entire <style> block is well under that.
      const styleWindow = html.slice(ogsbIdx, ogsbIdx + 4096);
      expect(styleWindow).toContain("#FAF8F5");
    });

    // ========================================================================
    // D-18 #1 (WR-R3-02): className-binding shape replaces hex-substring shape.
    //
    // The pre-D-15 tests asserted hex values appeared somewhere in the rendered
    // HTML. They passed against dead CSS (rules whose className hooks weren't
    // applied to any rendered element). The new shape asserts:
    //   - For every status, the CSS rule [data-ogsb] .pill-${status} { ... }
    //     exists in the rendered <style> block (CSS-gen output is complete).
    //   - For each rendered procurement row, the pill <span> carries the
    //     literal class="pill-${status}" colocated with its default inline
    //     background-color (proves both halves of dark-mode protection ship
    //     together).
    // ========================================================================

    it("rendered <style> block declares all 7 pill class hooks (D-18 IN-R3-02 -- CSS-gen output is complete)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      // All 7 .pill-${status} class hooks must exist in the rendered <style>
      // block, even when the fixture only renders a subset of statuses.
      // The CSS-gen iterates STATUS_PILL_STYLES so drift between fixture +
      // ruleset is structurally impossible.
      for (const cls of ALL_PILL_CLASSES) {
        expect(html).toContain(`.${cls}`);
      }
    });

    it.each(ALL_STATUSES)(
      "[data-ogsb] block contains pill-%s background rule (D-18 IN-R3-02 CSS-gen output)",
      async (status) => {
        const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
        const expectedHex = STATUS_PILL_STYLES[status].bg;
        const pattern = new RegExp(
          `\\[data-ogsb\\]\\s+\\.pill-${status}\\s*\\{[^}]*background-color:\\s*${expectedHex.replace(
            /[#]/g,
            "\\$&",
          )}`,
          "i",
        );
        expect(html).toMatch(pattern);
      },
    );

    it.each(ALL_STATUSES)(
      "[data-ogsc] block contains pill-%s text-color rule (D-18 IN-R3-02 CSS-gen output)",
      async (status) => {
        const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
        const expectedHex = STATUS_PILL_STYLES[status].text;
        const pattern = new RegExp(
          `\\[data-ogsc\\]\\s+\\.pill-${status}\\s*\\{[^}]*color:\\s*${expectedHex.replace(
            /[#]/g,
            "\\$&",
          )}`,
          "i",
        );
        expect(html).toMatch(pattern);
      },
    );

    it.each(ALL_STATUSES)(
      "[data-ogsc] block contains pill-%s border-color rule (D-18 IN-R3-02 CSS-gen output)",
      async (status) => {
        const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
        const expectedHex = STATUS_PILL_STYLES[status].border;
        const pattern = new RegExp(
          `\\[data-ogsc\\]\\s+\\.pill-${status}\\s*\\{[^}]*border-color:\\s*${expectedHex.replace(
            /[#]/g,
            "\\$&",
          )}`,
          "i",
        );
        expect(html).toMatch(pattern);
      },
    );

    it.each(RENDERED_STATUSES)(
      "Procurement %s pill <span> carries class=\"pill-%s\" colocated with its inline background-color (D-18 WR-R3-02 className binding)",
      async (status) => {
        const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
        const expectedHex = STATUS_PILL_STYLES[status].bg;
        // react-email may compile #RRGGBB to either #RRGGBB or rgb(R, G, B).
        // Accept both forms for the colocation assertion.
        const escapedHex = expectedHex.replace(/[#]/g, "\\$&");
        const r = parseInt(expectedHex.slice(1, 3), 16);
        const g = parseInt(expectedHex.slice(3, 5), 16);
        const b = parseInt(expectedHex.slice(5, 7), 16);
        const pattern = new RegExp(
          `<span[^>]*class="[^"]*pill-${status}[^"]*"[^>]*style="[^"]*background-color:\\s*(?:${escapedHex}|rgb\\(\\s*${r}\\s*,\\s*${g}\\s*,\\s*${b}\\s*\\))`,
          "i",
        );
        expect(html).toMatch(pattern);
      },
    );

    it("SendUpdate CTA <a> carries class=\"cta-terracotta\" colocated with inline background-color #C4836A (D-18 WR-R3-02 className binding)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      // react-email Button renders as <a>. Accept #C4836A or rgb(196, 131, 106).
      expect(html).toMatch(
        /<a[^>]*class="[^"]*cta-terracotta[^"]*"[^>]*style="[^"]*background-color:\s*(?:#C4836A|rgb\(\s*196\s*,\s*131\s*,\s*106\s*\))/i,
      );
    });

    it("[data-ogsb] block contains cta-terracotta rule with #C4836A", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toMatch(
        /\[data-ogsb\]\s+\.cta-terracotta\s*\{[^}]*background-color:\s*#C4836A/i,
      );
    });

    it("[data-ogsb] block contains cta-gold rule with #9A7B4B (shared shell -- both variants locked from SendUpdate render)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toMatch(
        /\[data-ogsb\]\s+\.cta-gold\s*\{[^}]*background-color:\s*#9A7B4B/i,
      );
    });
  });

  describe("WorkOrder render -- shared shell propagation", () => {
    it("rendered HTML contains [data-ogsc] selector", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      expect(html).toContain("[data-ogsc]");
    });

    it("rendered HTML contains [data-ogsb] selector", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      expect(html).toContain("[data-ogsb]");
    });

    it("rendered HTML contains MSO conditional open + close", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      expect(html).toContain("<!--[if mso]>");
      expect(html).toContain("<![endif]-->");
    });

    it("rendered HTML contains mso-color-scheme: light declaration", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      expect(html).toContain("mso-color-scheme: light");
    });

    it("cream body bg #FAF8F5 appears inside a [data-ogsb] rule", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      const ogsbIdx = html.indexOf("[data-ogsb]");
      expect(ogsbIdx).toBeGreaterThan(-1);
      const styleWindow = html.slice(ogsbIdx, ogsbIdx + 4096);
      expect(styleWindow).toContain("#FAF8F5");
    });

    it.each(ALL_STATUSES)(
      "[data-ogsb] block contains pill-%s background rule (D-18 IN-R3-02 -- proves CSS-gen is shell-level, not template-level)",
      async (status) => {
        const html = await render(createElement(WorkOrder, buildWO()));
        const expectedHex = STATUS_PILL_STYLES[status].bg;
        const pattern = new RegExp(
          `\\[data-ogsb\\]\\s+\\.pill-${status}\\s*\\{[^}]*background-color:\\s*${expectedHex.replace(
            /[#]/g,
            "\\$&",
          )}`,
          "i",
        );
        expect(html).toMatch(pattern);
      },
    );

    it("WorkOrder CTA <a> carries class=\"cta-gold\" colocated with inline background-color #9A7B4B (D-18 WR-R3-02 className binding)", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      expect(html).toMatch(
        /<a[^>]*class="[^"]*cta-gold[^"]*"[^>]*style="[^"]*background-color:\s*(?:#9A7B4B|rgb\(\s*154\s*,\s*123\s*,\s*75\s*\))/i,
      );
    });
  });

  describe("Foundation hex appears in both renders (cross-template parity)", () => {
    it("SendUpdate render contains foundation cream hex #FAF8F5", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toContain("#FAF8F5");
    });

    it("WorkOrder render contains foundation cream hex #FAF8F5", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      expect(html).toContain("#FAF8F5");
    });

    it("SendUpdate render contains foundation cream-dark divider hex #E8DDD0 (Procurement ROW_STYLE inline border-bottom)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      // SendUpdate has procurement section -- ROW_STYLE.borderBottom uses #E8DDD0 inline.
      // WorkOrder has no procurement; its <Hr className="border-cream-dark"> Tailwind utility
      // was inlined to a default `#eaeaea` color before our class hooks could rebind. Per
      // 46.1 D-16 knock-on note: the Tailwind utility .border-cream-dark hook is dead in
      // rendered output; deleting the dead [data-ogsc] .border-cream-dark rule does not
      // change WorkOrder's actual color (which was already #eaeaea, not #E8DDD0). The
      // hex assertion is preserved on SendUpdate because Procurement uses the literal
      // #E8DDD0 inline. WorkOrder regression check is the round-5 visual gate.
      expect(html).toContain("#E8DDD0");
    });
  });
});

// ============================================================================
// 46.1 D-10 / D-11 -- gap-7 Outlook-for-Mac dark-mode survival markers.
// New techniques applied per .planning/phases/46.1-merge-gate-gap-closure/
// 46.1-SPIKE-OUTLOOK-MAC.md Recommendation section. The existing 46.1-04
// [data-ogsc]/[data-ogsb]/MSO lock STAYS intact; this block ADDS coverage
// for the new technique markers. Each marker is asserted on BOTH SendUpdate
// AND WorkOrder rendered HTML to prove shared-shell propagation.
//
// Chosen combination per SPIKE.md ## Recommendation:
//   (a) <table bgcolor="#FAF8F5"> body wrapper (HTML-attribute paint that
//       survives <style>-block stripping on Outlook-for-Mac)
//   (b) @media (prefers-color-scheme: dark) block re-pinning the locked
//       light palette (catches Outlook variants that honor prefers-color-scheme)
//   (d) inline style={{backgroundColor:"#FAF8F5"}} on <Body> (higher
//       specificity than <style>-block rules; second-layer survive)
// Rejected: (c) class-hook selectors -- shares the failing <style>-block
//   delivery vehicle with the existing 46.1-04 lock.
//
// Round 4 update (D-16 + D-17): the [data-ogsc] .text-* / .text-charcoal
// / .text-mid / .border-cream-dark rules and the [data-ogsc] * catch-all
// were deleted from the @media block as part of CR-R3-01 cleanup -- those
// targeted Tailwind utility class hooks that never bound. The @media block
// now only re-pins what actually has classNames in the rendered output:
// body bg, cta-* variants, and pill-* generated rules.
// ============================================================================

describe("EmailShell Outlook-for-Mac dark-mode survival (46.1 D-10/D-11 -- gap-7)", () => {
  describe("SendUpdate render -- new gap-7 markers", () => {
    it("rendered HTML contains <table bgcolor=\"#FAF8F5\"> body wrapper (candidate a)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toMatch(/<table[^>]*bgcolor="#FAF8F5"/i);
    });

    it("rendered HTML contains @media (prefers-color-scheme: dark) block (candidate b)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      expect(html).toContain("@media (prefers-color-scheme: dark)");
    });

    it("@media (prefers-color-scheme: dark) block contains !important declarations (candidate b specificity tie-resolver)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      const mediaIdx = html.indexOf("@media (prefers-color-scheme: dark)");
      expect(mediaIdx).toBeGreaterThan(-1);
      // 4KB window covers the entire media-query body.
      const mediaWindow = html.slice(mediaIdx, mediaIdx + 4096);
      expect(mediaWindow).toContain("!important");
    });

    it("@media (prefers-color-scheme: dark) block re-pins cream bg #FAF8F5 (candidate b palette parity)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      const mediaIdx = html.indexOf("@media (prefers-color-scheme: dark)");
      expect(mediaIdx).toBeGreaterThan(-1);
      const mediaWindow = html.slice(mediaIdx, mediaIdx + 4096);
      expect(mediaWindow).toContain("#FAF8F5");
    });

    it("@media (prefers-color-scheme: dark) block re-pins pill-ordered text color #2A5485 (candidate b palette parity, generated from STATUS_PILL_STYLES)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      const mediaIdx = html.indexOf("@media (prefers-color-scheme: dark)");
      expect(mediaIdx).toBeGreaterThan(-1);
      const mediaWindow = html.slice(mediaIdx, mediaIdx + 4096);
      // pill-ordered ships in fixture; its text-color #2A5485 must appear
      // in the @media block's pill rules (CSS-gen output covers all statuses).
      expect(mediaWindow).toContain("#2A5485");
    });

    it("rendered HTML <body> element carries inline background-color #FAF8F5 (candidate d)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      // react-email normalizes hex to rgb() during compilation per Phase 45-04 D-7.
      // Accept either hex or rgb form on the <body> open tag.
      expect(html).toMatch(/<body[^>]*style="[^"]*background-color:\s*(?:#FAF8F5|rgb\(\s*250\s*,\s*248\s*,\s*245\s*\))/i);
    });
  });

  describe("WorkOrder render -- new gap-7 markers (shared-shell propagation)", () => {
    it("rendered HTML contains <table bgcolor=\"#FAF8F5\"> body wrapper (candidate a)", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      expect(html).toMatch(/<table[^>]*bgcolor="#FAF8F5"/i);
    });

    it("rendered HTML contains @media (prefers-color-scheme: dark) block (candidate b)", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      expect(html).toContain("@media (prefers-color-scheme: dark)");
    });

    it("@media (prefers-color-scheme: dark) block contains !important declarations (candidate b specificity tie-resolver)", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      const mediaIdx = html.indexOf("@media (prefers-color-scheme: dark)");
      expect(mediaIdx).toBeGreaterThan(-1);
      const mediaWindow = html.slice(mediaIdx, mediaIdx + 4096);
      expect(mediaWindow).toContain("!important");
    });

    it("@media (prefers-color-scheme: dark) block re-pins cream bg #FAF8F5 (candidate b palette parity)", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      const mediaIdx = html.indexOf("@media (prefers-color-scheme: dark)");
      expect(mediaIdx).toBeGreaterThan(-1);
      const mediaWindow = html.slice(mediaIdx, mediaIdx + 4096);
      expect(mediaWindow).toContain("#FAF8F5");
    });

    it("@media (prefers-color-scheme: dark) block re-pins gold cta bg #9A7B4B (candidate b palette parity)", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      const mediaIdx = html.indexOf("@media (prefers-color-scheme: dark)");
      expect(mediaIdx).toBeGreaterThan(-1);
      const mediaWindow = html.slice(mediaIdx, mediaIdx + 4096);
      expect(mediaWindow).toContain("#9A7B4B");
    });

    it("rendered HTML <body> element carries inline background-color #FAF8F5 (candidate d)", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      expect(html).toMatch(/<body[^>]*style="[^"]*background-color:\s*(?:#FAF8F5|rgb\(\s*250\s*,\s*248\s*,\s*245\s*\))/i);
    });
  });
});

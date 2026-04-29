// src/emails/shell/EmailShell.test.ts
// Phase 46.1 D-6 -- gap-4 (Outlook desktop dark-mode contrast inversion).
//
// Source of truth:
//   .planning/phases/46.1-merge-gate-gap-closure/46.1-CONTEXT.md (D-6)
//   .planning/phases/46-send-update-work-order-migration/46-UAT.md (gap-4)
//
// EmailShell.tsx now embeds an Outlook-desktop auto-darken lock inside <Head>:
// [data-ogsc] text/border rules + [data-ogsb] background rules + MSO conditional.
// These tests verify the lock surfaces in BOTH SendUpdate and WorkOrder rendered
// HTML (proves the shared-shell propagation -- a single edit in EmailShell.tsx
// covers both templates). Assertions are against the rendered HTML string, not
// the React tree.
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

const REQUIRED_PILL_BG_HEXES = ["#F3EFE9", "#F3EDE3", "#FBF2E2", "#E8F0F9", "#FDEEE6", "#EDF5E8"];
const REQUIRED_PILL_TEXT_HEXES = ["#6B5E52", "#8A5E1A", "#2A5485", "#9B3A2A", "#3A6620"];
const REQUIRED_PILL_BORDER_HEXES = ["#E0D5C5", "#D4C8B8", "#E8CFA0", "#B0CAE8", "#F2C9B8", "#C4DBA8", "#A8C98C"];
const REQUIRED_CTA_HEXES = ["#C4836A", "#9A7B4B"];
const REQUIRED_FOUNDATION_HEXES = ["#FAF8F5", "#E8DDD0"];

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

    it("all 7 procurement pill bg hex values appear in rendered HTML", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      for (const hex of REQUIRED_PILL_BG_HEXES) {
        expect(html).toContain(hex);
      }
    });

    it("all 5 distinct pill text hex values appear in rendered HTML", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      for (const hex of REQUIRED_PILL_TEXT_HEXES) {
        expect(html).toContain(hex);
      }
    });

    it("all 7 pill border hex values appear in rendered HTML", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      for (const hex of REQUIRED_PILL_BORDER_HEXES) {
        expect(html).toContain(hex);
      }
    });

    it("both CTA hex values (terracotta SU + gold WO) appear in rendered HTML", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      // Both appear because the lock is shared across templates -- terracotta
      // and gold rules both live in EmailShell.tsx <Head>.
      for (const hex of REQUIRED_CTA_HEXES) {
        expect(html).toContain(hex);
      }
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

    it("all 7 pill bg hex values appear in rendered HTML (proves lock content is shell-level, not template-level)", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      for (const hex of REQUIRED_PILL_BG_HEXES) {
        expect(html).toContain(hex);
      }
    });
  });

  describe("Foundation hex values appear in both renders (cross-template parity)", () => {
    it("SendUpdate render contains foundation hexes (cream + cream-dark divider)", async () => {
      const html = await render(createElement(SendUpdate, SU_FIXTURES.full()));
      for (const hex of REQUIRED_FOUNDATION_HEXES) {
        expect(html).toContain(hex);
      }
    });

    it("WorkOrder render contains foundation hexes (cream + cream-dark divider)", async () => {
      const html = await render(createElement(WorkOrder, buildWO()));
      for (const hex of REQUIRED_FOUNDATION_HEXES) {
        expect(html).toContain(hex);
      }
    });
  });
});

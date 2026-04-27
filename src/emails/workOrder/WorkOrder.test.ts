// src/emails/workOrder/WorkOrder.test.ts
// Phase 46 -- WorkOrder snapshot + behavioral tests.
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-4, D-8, D-13, D-15, D-18, D-20)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (WorkOrder.test.ts)
//
// Note: this file uses React.createElement instead of JSX so it can stay a
// plain .ts file (matches src/emails/scaffold.test.ts convention).
//
// containsTokenColor() helper copied verbatim from src/emails/scaffold.test.ts
// per D-18; @react-email/tailwind@^2.0.7 normalizes hex into rgb form so
// assertions accept either.

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/render";
import { WorkOrder } from "./WorkOrder";
import { FIXTURES, baseInput } from "./fixtures";

// brandTokens.colors.cream = "#FAF8F5" -> rgb(250, 248, 245)
const CREAM_HEX = "#faf8f5";
const CREAM_RGB = "rgb(250,248,245)";

// brandTokens.colors.gold = "#9A7B4B" -> rgb(154, 123, 75)
const GOLD_HEX = "#9a7b4b";
const GOLD_RGB = "rgb(154,123,75)";

function containsTokenColor(html: string, hex: string, rgb: string): boolean {
  const lowered = html.toLowerCase();
  const normalized = lowered.replace(/rgb\(\s*([^)]+?)\s*\)/g, (_m, body) =>
    `rgb(${body.replace(/\s+/g, "")})`,
  );
  return normalized.includes(hex) || normalized.includes(rgb);
}

describe("WorkOrder (Phase 46 react-email port)", () => {
  it("renders the cream brand-token color", async () => {
    const html = await render(createElement(WorkOrder, FIXTURES.default()));
    expect(containsTokenColor(html, CREAM_HEX, CREAM_RGB)).toBe(true);
  });

  it("renders the gold CTA brand-token color", async () => {
    const html = await render(createElement(WorkOrder, FIXTURES.default()));
    expect(containsTokenColor(html, GOLD_HEX, GOLD_RGB)).toBe(true);
  });

  it("contains the H1 copy 'Work order ready for review'", async () => {
    const html = await render(createElement(WorkOrder, FIXTURES.default()));
    expect(html).toContain("Work order ready for review");
  });

  it("renders the CTA href '/workorder/project/P1/orders/WO1'", async () => {
    const html = await render(createElement(WorkOrder, FIXTURES.default()));
    expect(html).toContain(
      "https://example.com/workorder/project/P1/orders/WO1",
    );
  });

  it("escapes HTML in project.title via JSX (no manual esc())", async () => {
    const html = await render(
      createElement(
        WorkOrder,
        baseInput({ project: { _id: "P1", title: "<script>alert(1)</script>" } }),
      ),
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("greets the contractor by first name only", async () => {
    const html = await render(createElement(WorkOrder, FIXTURES.default()));
    expect(html).toContain("Marco,");
    expect(html).not.toContain("Marco DeLuca,");
  });

  it("renders 'VIEW WORK ORDER' CTA label", async () => {
    const html = await render(createElement(WorkOrder, FIXTURES.default()));
    expect(html).toContain("VIEW WORK ORDER");
  });

  it("includes the preheader prop value as inbox preview", async () => {
    const html = await render(createElement(WorkOrder, FIXTURES.default()));
    expect(html).toContain("Work order ready for Acme Home");
  });

  for (const [name, build] of Object.entries(FIXTURES)) {
    it(`snapshot: ${name}`, async () => {
      const html = await render(createElement(WorkOrder, build()));
      expect(html).toMatchSnapshot();
    });
  }

  it("plainText snapshot for default fixture", async () => {
    const text = await render(createElement(WorkOrder, FIXTURES.default()), {
      plainText: true,
    });
    expect(text).toMatchSnapshot();
  });
});

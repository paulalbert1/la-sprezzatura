// src/emails/workOrderAccess/WorkOrderAccess.test.ts
// Phase 48 -- WorkOrderAccess snapshot + behavioral tests (EMAIL-04, EMAIL-05).
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-01, D-04..D-07, D-10)
//   .planning/phases/48-smaller-transactional-emails/48-PATTERNS.md (workOrderAccess/WorkOrderAccess.test.ts)

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/render";
import { WorkOrderAccess } from "./WorkOrderAccess";
import { FIXTURES, baseInput } from "./fixtures";

const CREAM_HEX = "#faf8f5";
const CREAM_RGB = "rgb(250,248,245)";
const GOLD_HEX = "#9a7b4b";
const GOLD_RGB = "rgb(154,123,75)";

function containsTokenColor(html: string, hex: string, rgb: string): boolean {
  const lowered = html.toLowerCase();
  const normalized = lowered.replace(/rgb\(\s*([^)]+?)\s*\)/g, (_m, body) =>
    `rgb(${body.replace(/\s+/g, "")})`,
  );
  return normalized.includes(hex) || normalized.includes(rgb);
}

describe("WorkOrderAccess (Phase 48 react-email port)", () => {
  it("renders the cream brand-token color", async () => {
    const html = await render(createElement(WorkOrderAccess, FIXTURES.default()));
    expect(containsTokenColor(html, CREAM_HEX, CREAM_RGB)).toBe(true);
  });

  it("renders the gold CTA brand-token color", async () => {
    const html = await render(createElement(WorkOrderAccess, FIXTURES.default()));
    expect(containsTokenColor(html, GOLD_HEX, GOLD_RGB)).toBe(true);
  });

  it("contains the H1 copy 'Your Work Order Access'", async () => {
    const html = await render(createElement(WorkOrderAccess, FIXTURES.default()));
    expect(html).toContain("Your Work Order Access");
  });

  it("greets the contractor by first name only", async () => {
    const html = await render(createElement(WorkOrderAccess, FIXTURES.default()));
    expect(html).toContain("Marco,");
    expect(html).not.toContain("Marco DeLuca,");
  });

  it("renders 'ACCESS YOUR WORK ORDERS' CTA label", async () => {
    const html = await render(createElement(WorkOrderAccess, FIXTURES.default()));
    expect(html).toContain("ACCESS YOUR WORK ORDERS");
  });

  it("EMAIL-04: renders the literal magicLink as selectable text", async () => {
    const html = await render(createElement(WorkOrderAccess, FIXTURES.default()));
    expect(html).toContain("https://example.com/workorder/verify?token=test-token-abc123");
    expect(html.toLowerCase()).toMatch(/copy.*paste|paste this link/);
  });

  it("EMAIL-05: renders expiry copy derived from formatExpiryCopy(expiresInSeconds)", async () => {
    const html = await render(createElement(WorkOrderAccess, FIXTURES.default()));
    expect(html).toContain("15 minutes");
    expect(html).toContain("This link expires in");
  });

  it("EMAIL-05: derives copy from prop, not from a constant import (Pitfall 2 guard)", async () => {
    const html = await render(
      createElement(WorkOrderAccess, baseInput({ expiresInSeconds: 1800 })),
    );
    expect(html).toContain("30 minutes");
    expect(html).not.toContain("15 minutes");
  });

  it("escapes HTML in projectNames via JSX (no manual esc())", async () => {
    const html = await render(
      createElement(
        WorkOrderAccess,
        baseInput({ projectNames: ["<script>alert(1)</script>"] }),
      ),
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("includes the preheader prop value as inbox preview", async () => {
    const html = await render(
      createElement(
        WorkOrderAccess,
        baseInput({ preheader: "Test preheader for inbox preview" }),
      ),
    );
    expect(html).toContain("Test preheader for inbox preview");
  });

  it("omits the project line when projectNames is empty", async () => {
    const html = await render(createElement(WorkOrderAccess, FIXTURES.noProjects()));
    expect(html).not.toContain("You have work orders for:");
  });

  it("renders the Elizabeth casual signoff (D-10 + Plan 01 D-14)", async () => {
    const html = await render(createElement(WorkOrderAccess, FIXTURES.default()));
    expect(html).toContain("Elizabeth");
    expect(html).not.toContain("Elizabeth Olivier"); // formal register would render this; casual must not
  });

  for (const [name, build] of Object.entries(FIXTURES)) {
    it(`snapshot: ${name}`, async () => {
      const html = await render(createElement(WorkOrderAccess, build()));
      expect(html).toMatchSnapshot();
    });
  }

  it("plainText snapshot for default fixture", async () => {
    const text = await render(createElement(WorkOrderAccess, FIXTURES.default()), {
      plainText: true,
    });
    expect(text).toMatchSnapshot();
  });
});

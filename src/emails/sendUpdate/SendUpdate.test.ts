// src/emails/sendUpdate/SendUpdate.test.ts
// Phase 46 -- SendUpdate snapshot + behavioral tests.
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-8, D-13, D-15, D-17, D-18, D-20)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (SendUpdate.test.ts)
//   src/lib/sendUpdate/emailTemplate.test.ts (legacy behavioral assertions preserved)
//
// Note: this file uses React.createElement instead of JSX so it can stay a
// plain .ts file (matches src/emails/scaffold.test.ts and WorkOrder.test.ts).
//
// containsTokenColor() helper copied verbatim from src/emails/scaffold.test.ts
// per D-18; @react-email/tailwind@^2.0.7 normalizes hex into rgb form so
// assertions accept either.

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/render";
import { SendUpdate } from "./SendUpdate";
import { FIXTURES } from "./fixtures";

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

describe("SendUpdate (Phase 46 react-email port)", () => {
  it("renders bg-cream as the brand-tokens cream color", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.allSections()));
    expect(containsTokenColor(html, CREAM_HEX, CREAM_RGB)).toBe(true);
  });

  it("renders the gold CTA button color", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.allSections()));
    expect(containsTokenColor(html, GOLD_HEX, GOLD_RGB)).toBe(true);
  });

  it("includes the project title and personal note", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.allSections()));
    expect(html).toContain("Kimball Residence");
    expect(html).toContain("Loving the new fabric samples.");
  });

  it("includes the preheader prop value as inbox preview text", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.allSections()));
    expect(html).toContain("Project Update for Kimball Residence");
  });

  it("escapes HTML in interpolated user values via JSX (no manual esc())", async () => {
    const fixture = FIXTURES.allSections();
    fixture.project = { ...fixture.project, title: "<script>alert(1)</script>" };
    const html = await render(createElement(SendUpdate, fixture));
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("omits Milestones content when showMilestones is false", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.noMilestones()));
    // The legacy milestone names must not appear when the section is suppressed.
    expect(html).not.toContain("Design intake");
    expect(html).not.toContain("Construction kickoff");
  });

  it("omits Procurement section when showProcurement is false", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.noProcurement()));
    // Procurement column headers absent and the procurement item name absent.
    expect(html).not.toContain("Sofa");
  });

  it("omits PendingArtifacts section when showArtifacts is false", async () => {
    const html = await render(createElement(SendUpdate, FIXTURES.noArtifacts()));
    expect(html).not.toContain("Awaiting Your Review");
  });

  // D-20 snapshot fixtures -- six total.
  for (const [name, build] of Object.entries(FIXTURES)) {
    it(`snapshot: ${name}`, async () => {
      const html = await render(createElement(SendUpdate, build()));
      expect(html).toMatchSnapshot();
    });
  }

  it("plainText render matches snapshot for allSections fixture", async () => {
    const text = await render(
      createElement(SendUpdate, FIXTURES.allSections()),
      { plainText: true },
    );
    expect(text).toMatchSnapshot();
  });
});

// src/emails/artifactReady/ArtifactReady.test.ts
// Phase 48 -- ArtifactReady snapshot + behavioral tests (D-08, D-09, D-12).
// Includes NEGATIVE asserts for EMAIL-04 and EMAIL-05 (notification, not invitation).
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-01, D-08, D-09, D-12)
//   .planning/phases/48-smaller-transactional-emails/48-PATTERNS.md (artifactReady/ArtifactReady.test.ts)

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/render";
import { ArtifactReady } from "./ArtifactReady";
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

describe("ArtifactReady (Phase 48 react-email port — notification)", () => {
  it("renders the cream brand-token color", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(containsTokenColor(html, CREAM_HEX, CREAM_RGB)).toBe(true);
  });

  it("renders the gold CTA brand-token color", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(containsTokenColor(html, GOLD_HEX, GOLD_RGB)).toBe(true);
  });

  it("contains the H1 copy with artifactLabel", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(html).toContain("New Mood Board Available");
  });

  it("body copy renders artifactLabel.toLowerCase() and project.title", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(html).toContain("Liz has uploaded a new mood board for your review on Kimball Residence");
  });

  it("renders 'VIEW IN YOUR PORTAL' CTA label", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(html).toContain("VIEW IN YOUR PORTAL");
  });

  it("CTA links to portalHref", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(html).toContain("https://example.com/portal/dashboard");
  });

  it("EMAIL-04 negative: does NOT render link-fallback copy (notification, not invitation per D-08)", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(html.toLowerCase()).not.toMatch(/copy.*paste|paste this link/);
  });

  it("EMAIL-04 negative: does NOT render any /verify?token= URL (no token at all per D-08)", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(html).not.toMatch(/verify\?token=/);
  });

  it("EMAIL-05 negative: does NOT render expiry copy (no TTL per D-08)", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(html).not.toContain("expires in");
    expect(html.toLowerCase()).not.toMatch(/15 minutes|minutes\./);
  });

  it("escapes HTML in artifactLabel via JSX (no manual esc())", async () => {
    const html = await render(
      createElement(
        ArtifactReady,
        baseInput({ artifactLabel: "<script>alert(1)</script>" }),
      ),
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("escapes HTML in project.title via JSX", async () => {
    const html = await render(
      createElement(
        ArtifactReady,
        baseInput({ project: { _id: "P1", title: "<img onerror=alert(1)>" } }),
      ),
    );
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img onerror=alert(1)>");
  });

  it("greets the client by first name only when client.name is set", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(html).toContain("Victoria,");
    expect(html).not.toContain("Victoria Kimball,");
  });

  it("renders the Elizabeth casual signoff (D-12)", async () => {
    const html = await render(createElement(ArtifactReady, FIXTURES.default()));
    expect(html).toContain("Elizabeth");
    expect(html).not.toContain("Elizabeth Olivier"); // formal would render the full name
  });

  it("includes the preheader prop value as inbox preview", async () => {
    const html = await render(
      createElement(
        ArtifactReady,
        baseInput({ preheader: "Custom preheader for testing" }),
      ),
    );
    expect(html).toContain("Custom preheader for testing");
  });

  for (const [name, build] of Object.entries(FIXTURES)) {
    it(`snapshot: ${name}`, async () => {
      const html = await render(createElement(ArtifactReady, build()));
      expect(html).toMatchSnapshot();
    });
  }

  it("plainText snapshot for default fixture", async () => {
    const text = await render(createElement(ArtifactReady, FIXTURES.default()), {
      plainText: true,
    });
    expect(text).toMatchSnapshot();
  });
});

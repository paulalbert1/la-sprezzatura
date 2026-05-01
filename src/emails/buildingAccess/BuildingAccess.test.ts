// src/emails/buildingAccess/BuildingAccess.test.ts
// Phase 48 -- BuildingAccess snapshot + behavioral tests (EMAIL-04, EMAIL-05, D-11).
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-01, D-04..D-07, D-11)
//   .planning/phases/48-smaller-transactional-emails/48-PATTERNS.md (buildingAccess/BuildingAccess.test.ts)

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/render";
import { BuildingAccess } from "./BuildingAccess";
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

describe("BuildingAccess (Phase 48 react-email port)", () => {
  it("renders the cream brand-token color", async () => {
    const html = await render(createElement(BuildingAccess, FIXTURES.default()));
    expect(containsTokenColor(html, CREAM_HEX, CREAM_RGB)).toBe(true);
  });

  it("renders the gold CTA brand-token color", async () => {
    const html = await render(createElement(BuildingAccess, FIXTURES.default()));
    expect(containsTokenColor(html, GOLD_HEX, GOLD_RGB)).toBe(true);
  });

  it("contains the H1 copy 'Your Building Portal Access'", async () => {
    const html = await render(createElement(BuildingAccess, FIXTURES.default()));
    expect(html).toContain("Your Building Portal Access");
  });

  it("renders the project title in the body", async () => {
    const html = await render(createElement(BuildingAccess, FIXTURES.default()));
    expect(html).toContain("Acme Commercial Tower");
  });

  it("renders 'ACCESS BUILDING PORTAL' CTA label", async () => {
    const html = await render(createElement(BuildingAccess, FIXTURES.default()));
    expect(html).toContain("ACCESS BUILDING PORTAL");
  });

  it("EMAIL-04: renders the literal magicLink as selectable text", async () => {
    const html = await render(createElement(BuildingAccess, FIXTURES.default()));
    expect(html).toContain("https://example.com/building/verify?token=test-token-bld456");
    expect(html.toLowerCase()).toMatch(/copy.*paste|paste this link/);
  });

  it("EMAIL-04: magicLink path uses /building/verify (not /workorder/verify)", async () => {
    const html = await render(createElement(BuildingAccess, FIXTURES.default()));
    expect(html).toContain("/building/verify");
    expect(html).not.toContain("/workorder/verify");
  });

  it("EMAIL-05: renders expiry copy derived from formatExpiryCopy(expiresInSeconds)", async () => {
    const html = await render(createElement(BuildingAccess, FIXTURES.default()));
    expect(html).toContain("15 minutes");
    expect(html).toContain("This link expires in");
  });

  it("EMAIL-05: derives copy from prop, not from a constant import (Pitfall 2 guard)", async () => {
    const html = await render(
      createElement(BuildingAccess, baseInput({ expiresInSeconds: 1800 })),
    );
    expect(html).toContain("30 minutes");
  });

  it("escapes HTML in project.title via JSX (no manual esc())", async () => {
    const html = await render(
      createElement(
        BuildingAccess,
        baseInput({ project: { _id: "P1", title: "<script>alert(1)</script>" } }),
      ),
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("renders the Elizabeth Olivier formal signoff (D-11 + Plan 01 D-14)", async () => {
    const html = await render(createElement(BuildingAccess, FIXTURES.default()));
    expect(html).toContain("Elizabeth Olivier");
  });

  it("includes the preheader prop value as inbox preview", async () => {
    const html = await render(
      createElement(
        BuildingAccess,
        baseInput({ preheader: "Test preheader for inbox preview" }),
      ),
    );
    expect(html).toContain("Test preheader for inbox preview");
  });

  for (const [name, build] of Object.entries(FIXTURES)) {
    it(`snapshot: ${name}`, async () => {
      const html = await render(createElement(BuildingAccess, build()));
      expect(html).toMatchSnapshot();
    });
  }

  it("plainText snapshot for default fixture", async () => {
    const text = await render(createElement(BuildingAccess, FIXTURES.default()), {
      plainText: true,
    });
    expect(text).toMatchSnapshot();
  });
});

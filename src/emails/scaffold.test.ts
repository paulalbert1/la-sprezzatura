// src/emails/scaffold.test.ts
// Phase 45 -- proves brand-tokens -> @react-email/tailwind pipeline produces
// deterministic HTML with the expected token-derived color values inlined.
//
// Note: this file uses React.createElement instead of JSX so it can stay a
// plain .ts file (matches the co-located convention used everywhere else in
// src/lib/*.test.ts; vite/esbuild rejects JSX inside .ts).
//
// Color-format note: @react-email/tailwind@^2.0.7 normalizes hex colors into
// rgb(r,g,b) form during the CSS-inlining step (csstree-based). The brand-tokens
// hex values still flow through 1:1 -- they just appear as their rgb equivalents
// in the final HTML. Each assertion below checks BOTH the hex form and the
// rgb form so the test is robust regardless of which form the inliner emits.

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/render";
import { Scaffold } from "./__scaffold";

// brandTokens.colors.cream = "#FAF8F5" -> rgb(250, 248, 245)
const CREAM_HEX = "#faf8f5";
const CREAM_RGB = "rgb(250,248,245)";

// brandTokens.colors.terracotta = "#C4836A" -> rgb(196, 131, 106)
const TERRACOTTA_HEX = "#c4836a";
const TERRACOTTA_RGB = "rgb(196,131,106)";

function containsTokenColor(html: string, hex: string, rgb: string): boolean {
  const lowered = html.toLowerCase();
  // Strip whitespace inside rgb(...) so a future formatting change doesn't break us.
  const normalized = lowered.replace(/rgb\(\s*([^)]+?)\s*\)/g, (_m, body) =>
    `rgb(${body.replace(/\s+/g, "")})`,
  );
  return normalized.includes(hex) || normalized.includes(rgb);
}

describe("Scaffold (Phase 45 proof-of-pipeline)", () => {
  it("renders bg-cream as the brand-tokens cream color (hex or rgb)", async () => {
    const html = await render(createElement(Scaffold));
    expect(containsTokenColor(html, CREAM_HEX, CREAM_RGB)).toBe(true);
  });

  it("renders bg-terracotta as the brand-tokens terracotta color (hex or rgb)", async () => {
    const html = await render(createElement(Scaffold));
    expect(containsTokenColor(html, TERRACOTTA_HEX, TERRACOTTA_RGB)).toBe(true);
  });

  it("uses the default recipient name when no prop is passed", async () => {
    const html = await render(createElement(Scaffold));
    expect(html).toContain("Hello, Sample Recipient");
  });

  it("renders deterministic HTML (snapshot)", async () => {
    const html = await render(createElement(Scaffold));
    expect(html).toMatchSnapshot();
  });
});

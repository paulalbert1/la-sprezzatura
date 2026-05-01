// Phase 47 — Portal Layout Hoist contract tests.
//
// Strategy: read .astro files as strings and assert presence/absence of
// chrome contract markers. Repo convention from ProcurementTable.test.ts.
//
// EXPECTED RED on Plan 01 ship:
//   - "PortalLayout.astro -- banner slot wiring" describe block FAILS
//     until Plan 02 (Wave 2) modifies PortalLayout.astro to mount the new
//     PortalHeader/PortalFooter and expose <slot name="banner">.
// Plan 02 (47-02-PLAN.md) closes this gate. DO NOT roll the test back.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const HEADER_PATH = resolve(
  REPO_ROOT,
  "src/components/portal/PortalHeader.astro",
);
const STUB_PATH = resolve(
  REPO_ROOT,
  "src/components/portal/ImpersonationBannerStub.astro",
);
const LAYOUT_PATH = resolve(
  REPO_ROOT,
  "src/components/portal/PortalLayout.astro",
);

function load(p: string): string {
  return readFileSync(p, "utf8");
}

describe("PortalHeader.astro -- chrome contract", () => {
  it("declares bare prop in interface", () => {
    expect(load(HEADER_PATH)).toMatch(/bare\?:\s*boolean/);
  });
  it("maps all three roles to sentence-case sub-labels", () => {
    const src = load(HEADER_PATH);
    expect(src).toContain('"Client portal"');
    expect(src).toContain('"Trade portal"');
    expect(src).toContain('"Building portal"');
  });
  it("derives role from Astro.locals.role (not URL prefix)", () => {
    expect(load(HEADER_PATH)).toContain("Astro.locals.role");
  });
  it("renders Sign Out anchor with the canonical label", () => {
    expect(load(HEADER_PATH)).toMatch(/>\s*Sign Out\s*</);
  });
  it("does NOT include explicit role=\"banner\" (Astro <header> implicit)", () => {
    expect(load(HEADER_PATH)).not.toMatch(/role="banner"/);
  });
  it("does NOT include a <form> element (sign-out is GET anchor per UI-SPEC line 134)", () => {
    expect(load(HEADER_PATH)).not.toMatch(/<form/);
  });
});

describe("ImpersonationBannerStub.astro -- empty banner contract", () => {
  it("renders only the test-id div, no visible chrome", () => {
    const src = load(STUB_PATH);
    expect(src).toContain('data-testid="banner-slot-mounted"');
    expect(src).toMatch(/\bhidden(>|><\/)/);
  });
  it("does NOT introduce <script>, <style>, or aria-hidden", () => {
    const src = load(STUB_PATH);
    expect(src).not.toMatch(/<script/);
    expect(src).not.toMatch(/<style/);
    expect(src).not.toMatch(/aria-hidden/);
  });
});

describe("PortalLayout.astro -- banner slot wiring (Plan 02 gate)", () => {
  it("exposes a named slot for banner", () => {
    expect(load(LAYOUT_PATH)).toMatch(/<slot\s+name=["']banner["']/);
  });
  it("mounts PortalHeader and PortalFooter components", () => {
    const src = load(LAYOUT_PATH);
    expect(src).toContain("PortalHeader");
    expect(src).toContain("PortalFooter");
  });
});

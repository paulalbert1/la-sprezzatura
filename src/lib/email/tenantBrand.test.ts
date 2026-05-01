// src/lib/email/tenantBrand.test.ts
// Phase 48 -- pin LA_SPREZZATURA_TENANT signoff-name values (D-14).
//
// The hardcoded fallback constant is the production safety net when
// getTenantBrand() can't reach Sanity. This test pins the correct values
// so a future stray edit ("Elizabeth Lewis" reverted, etc.) is caught
// before it ships.

import { describe, it, expect } from "vitest";
import { LA_SPREZZATURA_TENANT, getDefaultTenantBrand } from "./tenantBrand";
import { SAMPLE_TENANT } from "../../emails/fixtures.shared";

describe("LA_SPREZZATURA_TENANT (D-14 fallback contract)", () => {
  it("signoffNameFormal === 'Elizabeth Olivier' (D-14 fix)", () => {
    expect(LA_SPREZZATURA_TENANT.signoffNameFormal).toBe("Elizabeth Olivier");
  });

  it("signoffNameCasual === 'Elizabeth'", () => {
    expect(LA_SPREZZATURA_TENANT.signoffNameCasual).toBe("Elizabeth");
  });

  it("wordmark === 'LA SPREZZATURA'", () => {
    expect(LA_SPREZZATURA_TENANT.wordmark).toBe("LA SPREZZATURA");
  });

  it("signoffLocation === 'Darien, CT'", () => {
    expect(LA_SPREZZATURA_TENANT.signoffLocation).toBe("Darien, CT");
  });

  it("getDefaultTenantBrand() returns the same updated object", () => {
    expect(getDefaultTenantBrand()).toBe(LA_SPREZZATURA_TENANT);
  });
});

describe("SAMPLE_TENANT (A2 — test fixture in sync with production fallback)", () => {
  it("signoffNameFormal stays in sync with LA_SPREZZATURA_TENANT.signoffNameFormal", () => {
    expect(SAMPLE_TENANT.signoffNameFormal).toBe(LA_SPREZZATURA_TENANT.signoffNameFormal);
  });

  it("signoffNameCasual stays in sync", () => {
    expect(SAMPLE_TENANT.signoffNameCasual).toBe(LA_SPREZZATURA_TENANT.signoffNameCasual);
  });

  it("wordmark and signoffLocation stay in sync", () => {
    expect(SAMPLE_TENANT.wordmark).toBe(LA_SPREZZATURA_TENANT.wordmark);
    expect(SAMPLE_TENANT.signoffLocation).toBe(LA_SPREZZATURA_TENANT.signoffLocation);
  });
});

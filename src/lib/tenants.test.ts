import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Source-based tests (matching project convention from session.test.ts)
const tenantsSource = readFileSync(
  resolve(__dirname, "./tenants.ts"),
  "utf-8",
);

const tenantsJsonSource = readFileSync(
  resolve(__dirname, "../config/tenants.json"),
  "utf-8",
);

describe("tenants.json", () => {
  it("contains lasprezzatura tenant", () => {
    expect(tenantsJsonSource).toContain('"id": "lasprezzatura"');
  });

  it("contains writeTokenEnv for Sanity", () => {
    expect(tenantsJsonSource).toContain('"writeTokenEnv": "SANITY_WRITE_TOKEN"');
  });

  it("contains businessName", () => {
    expect(tenantsJsonSource).toContain('"businessName": "La Sprezzatura"');
  });

  it("contains featureFlags object", () => {
    expect(tenantsJsonSource).toContain('"featureFlags"');
  });

  it("contains renderingLimits with monthlyAllocation of 50", () => {
    expect(tenantsJsonSource).toContain('"monthlyAllocation": 50');
  });

  it("contains admins array with 2 entries", () => {
    const parsed = JSON.parse(tenantsJsonSource);
    expect(parsed[0].admins).toHaveLength(2);
  });
});

describe("tenants module", () => {
  it("exports TenantConfig interface", () => {
    expect(tenantsSource).toContain("export interface TenantConfig");
  });

  it("exports TenantAdmin interface", () => {
    expect(tenantsSource).toContain("export interface TenantAdmin");
  });

  it("exports getTenantById function", () => {
    expect(tenantsSource).toContain("export function getTenantById");
  });

  it("exports getTenantByAdminEmail function", () => {
    expect(tenantsSource).toContain("export function getTenantByAdminEmail");
  });

  it("TenantConfig includes all required fields", () => {
    expect(tenantsSource).toContain("designerName: string");
    expect(tenantsSource).toContain("businessName: string");
    expect(tenantsSource).toContain("domain: string");
    expect(tenantsSource).toContain("contactEmail: string");
    expect(tenantsSource).toContain("senderEmail: string");
    expect(tenantsSource).toContain("projectId: string");
    expect(tenantsSource).toContain("dataset: string");
    expect(tenantsSource).toContain("writeTokenEnv: string");
    expect(tenantsSource).toContain("featureFlags:");
    expect(tenantsSource).toContain("monthlyAllocation: number");
    expect(tenantsSource).toContain("admins: TenantAdmin[]");
  });
});

describe("tenants runtime behavior", () => {
  it("getTenantById returns tenant for valid id", async () => {
    const { getTenantById } = await import("./tenants");
    const tenant = getTenantById("lasprezzatura");
    expect(tenant).toBeDefined();
    expect(tenant!.id).toBe("lasprezzatura");
    expect(tenant!.designerName).toBe("Elizabeth Olivier");
    expect(tenant!.businessName).toBe("La Sprezzatura");
    expect(tenant!.domain).toBe("lasprezz.com");
    expect(tenant!.contactEmail).toBe("office@lasprezz.com");
    expect(tenant!.senderEmail).toBe("noreply@send.lasprezz.com");
    expect(tenant!.sanity.dataset).toBe("production");
    expect(tenant!.sanity.writeTokenEnv).toBe("SANITY_WRITE_TOKEN");
    expect(tenant!.featureFlags.rendering).toBe(true);
    expect(tenant!.featureFlags.procurement).toBe(true);
    expect(tenant!.renderingLimits.monthlyAllocation).toBe(50);
    expect(tenant!.admins).toHaveLength(2);
  });

  it("getTenantById returns undefined for nonexistent id", async () => {
    const { getTenantById } = await import("./tenants");
    expect(getTenantById("nonexistent")).toBeUndefined();
  });

  it("getTenantByAdminEmail returns tenant for valid admin email", async () => {
    const { getTenantByAdminEmail } = await import("./tenants");
    const tenant = getTenantByAdminEmail("liz@lasprezz.com");
    expect(tenant).toBeDefined();
    expect(tenant!.id).toBe("lasprezzatura");
  });

  it("getTenantByAdminEmail is case-insensitive", async () => {
    const { getTenantByAdminEmail } = await import("./tenants");
    const tenant = getTenantByAdminEmail("LIZ@LASPREZZ.COM");
    expect(tenant).toBeDefined();
    expect(tenant!.id).toBe("lasprezzatura");
  });

  it("getTenantByAdminEmail returns undefined for unknown email", async () => {
    const { getTenantByAdminEmail } = await import("./tenants");
    expect(getTenantByAdminEmail("unknown@example.com")).toBeUndefined();
  });
});

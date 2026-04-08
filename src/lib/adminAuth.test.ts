import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const authSource = readFileSync(
  resolve(__dirname, "./adminAuth.ts"),
  "utf-8",
);

describe("adminAuth module", () => {
  it("exports verifyAdminPassword function", () => {
    expect(authSource).toContain("export async function verifyAdminPassword");
  });

  it("uses bcrypt.compare for password verification", () => {
    expect(authSource).toContain("bcrypt.compare");
  });

  it("uses getTenantByAdminEmail for tenant lookup", () => {
    expect(authSource).toContain("getTenantByAdminEmail");
  });
});

describe("verifyAdminPassword runtime behavior", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns null for unknown email", async () => {
    const { verifyAdminPassword } = await import("./adminAuth");
    const result = await verifyAdminPassword("unknown@example.com", "password");
    expect(result).toBeNull();
  });

  it("returns null for wrong password", async () => {
    // The tenant config has placeholder hashes that won't match any real password
    const { verifyAdminPassword } = await import("./adminAuth");
    const result = await verifyAdminPassword("liz@lasprezz.com", "wrongpassword");
    expect(result).toBeNull();
  });

  it("returns { tenant, admin } for valid email+password", async () => {
    // Mock bcrypt to return true for a known password
    vi.doMock("bcryptjs", () => ({
      default: {
        compare: vi.fn(async () => true),
      },
    }));
    const { verifyAdminPassword } = await import("./adminAuth");
    const result = await verifyAdminPassword("liz@lasprezz.com", "testpassword");
    expect(result).not.toBeNull();
    expect(result!.tenant.id).toBe("lasprezzatura");
    expect(result!.admin.email).toBe("liz@lasprezz.com");
    expect(result!.admin.name).toBe("Elizabeth Olivier");
  });
});

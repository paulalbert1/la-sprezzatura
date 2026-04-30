import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { impersonationAudit } from "./impersonationAudit";

// Phase 49 Plan 02 Task 1 — D-17 schema field shape + closed-enum validation.
// Pattern mirrors workOrder.test.ts per-field assertions.

const REQUIRED_FIELDS = [
  "tenantId",
  "sessionId",
  "eventType",
  "adminEmail",
  "adminEntityId",
  "targetRole",
  "targetEntityId",
  "projectId",
  "mintedAt",
] as const;

const ALL_FIELD_NAMES = [
  "tenantId",
  "sessionId",
  "eventType",
  "adminEmail",
  "adminEntityId",
  "targetRole",
  "targetEntityId",
  "targetEntityName",
  "projectId",
  "projectName",
  "mintedAt",
  "exitedAt",
  "exitReason",
] as const;

describe("impersonationAudit schema", () => {
  it('is a document type named "impersonationAudit"', () => {
    expect(impersonationAudit.name).toBe("impersonationAudit");
    expect(impersonationAudit.type).toBe("document");
  });

  it("declares all 13 D-17 fields by name", () => {
    const names = impersonationAudit.fields?.map((f) => f.name) ?? [];
    for (const expected of ALL_FIELD_NAMES) {
      expect(names).toContain(expected);
    }
  });

  it("marks the 9 D-17 required fields with a validation function", () => {
    for (const fieldName of REQUIRED_FIELDS) {
      const field = impersonationAudit.fields?.find((f) => f.name === fieldName);
      expect(field, `field ${fieldName} should be defined`).toBeDefined();
      expect(
        (field as { validation?: unknown })?.validation,
        `field ${fieldName} should have validation`,
      ).toBeDefined();
    }
  });

  it('eventType is a closed enum: ["start", "exit", "timeout"]', () => {
    const field = impersonationAudit.fields?.find((f) => f.name === "eventType");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    const list = (field as { options?: { list?: unknown[] } }).options?.list ?? [];
    expect(list).toHaveLength(3);
    expect(list).toEqual(expect.arrayContaining(["start", "exit", "timeout"]));
  });

  it('targetRole is a closed enum: ["client", "contractor", "building_manager"]', () => {
    const field = impersonationAudit.fields?.find((f) => f.name === "targetRole");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    const list = (field as { options?: { list?: unknown[] } }).options?.list ?? [];
    expect(list).toHaveLength(3);
    expect(list).toEqual(
      expect.arrayContaining(["client", "contractor", "building_manager"]),
    );
  });

  it('exitReason is a closed enum: ["manual", "ttl", "admin-logout"]', () => {
    const field = impersonationAudit.fields?.find((f) => f.name === "exitReason");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    const list = (field as { options?: { list?: unknown[] } }).options?.list ?? [];
    expect(list).toHaveLength(3);
    expect(list).toEqual(expect.arrayContaining(["manual", "ttl", "admin-logout"]));
  });

  it("schema source documents the D-18 timeout-doc-deletion compromise in its header", () => {
    const source = readFileSync(
      resolve(__dirname, "impersonationAudit.ts"),
      "utf8",
    );
    expect(source).toContain("D-18");
  });
});

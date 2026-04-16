import { describe, it, expect } from "vitest";
import { workOrder } from "./workOrder";

// Phase 39 Plan 01 Task 1 — mirror renderingSession.test.ts per-field
// assertion pattern.

describe("workOrder schema", () => {
  it('is a document type named "workOrder"', () => {
    expect(workOrder.name).toBe("workOrder");
    expect(workOrder.type).toBe("document");
  });

  it('has field "project" of type "reference" (required)', () => {
    const field = workOrder.fields?.find((f) => f.name === "project");
    expect(field).toBeDefined();
    expect(field?.type).toBe("reference");
    // Validation is a function — ensure it's present for required fields.
    expect((field as { validation?: unknown })?.validation).toBeDefined();
  });

  it('has field "contractor" of type "reference" (required)', () => {
    const field = workOrder.fields?.find((f) => f.name === "contractor");
    expect(field).toBeDefined();
    expect(field?.type).toBe("reference");
    expect((field as { validation?: unknown })?.validation).toBeDefined();
  });

  it('has field "selectedItemKeys" of type "array" with string members', () => {
    const field = workOrder.fields?.find((f) => f.name === "selectedItemKeys");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    const ofArray = (field as { of?: Array<{ type: string }> }).of;
    expect(ofArray).toBeDefined();
    expect(ofArray?.[0]?.type).toBe("string");
  });

  it('has field "specialInstructions" of type "text" with validation', () => {
    const field = workOrder.fields?.find(
      (f) => f.name === "specialInstructions",
    );
    expect(field).toBeDefined();
    expect(field?.type).toBe("text");
    expect((field as { validation?: unknown }).validation).toBeDefined();
  });

  it('has field "customFields" array with { key, value, preset } members', () => {
    const field = workOrder.fields?.find((f) => f.name === "customFields");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    const ofArray = (field as { of?: Array<{ fields?: Array<{ name: string; type: string }> }> })
      .of;
    expect(ofArray).toBeDefined();
    const memberFields = ofArray?.[0]?.fields;
    expect(memberFields).toBeDefined();
    const names = memberFields?.map((f) => f.name);
    expect(names).toContain("key");
    expect(names).toContain("value");
    expect(names).toContain("preset");
    expect(memberFields?.find((f) => f.name === "key")?.type).toBe("string");
    expect(memberFields?.find((f) => f.name === "value")?.type).toBe("string");
    expect(memberFields?.find((f) => f.name === "preset")?.type).toBe("boolean");
  });

  it('has field "createdAt" datetime readOnly', () => {
    const field = workOrder.fields?.find((f) => f.name === "createdAt");
    expect(field).toBeDefined();
    expect(field?.type).toBe("datetime");
    expect((field as { readOnly?: boolean }).readOnly).toBe(true);
  });

  it('has field "updatedAt" datetime readOnly', () => {
    const field = workOrder.fields?.find((f) => f.name === "updatedAt");
    expect(field).toBeDefined();
    expect(field?.type).toBe("datetime");
    expect((field as { readOnly?: boolean }).readOnly).toBe(true);
  });

  it('has field "lastSentAt" datetime readOnly', () => {
    const field = workOrder.fields?.find((f) => f.name === "lastSentAt");
    expect(field).toBeDefined();
    expect(field?.type).toBe("datetime");
    expect((field as { readOnly?: boolean }).readOnly).toBe(true);
  });

  it('has field "sendLog" array readOnly with { sentAt, toEmail, ccEmails, resendId } members', () => {
    const field = workOrder.fields?.find((f) => f.name === "sendLog");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    expect((field as { readOnly?: boolean }).readOnly).toBe(true);
    const ofArray = (
      field as { of?: Array<{ fields?: Array<{ name: string; type: string }> }> }
    ).of;
    const memberFields = ofArray?.[0]?.fields;
    expect(memberFields).toBeDefined();
    const names = memberFields?.map((f) => f.name);
    expect(names).toContain("sentAt");
    expect(names).toContain("toEmail");
    expect(names).toContain("ccEmails");
    expect(names).toContain("resendId");
  });
});

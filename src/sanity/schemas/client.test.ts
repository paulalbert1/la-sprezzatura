import { describe, it, expect } from "vitest";
import { client } from "./client";

// Phase 34 Plan 01 Wave 0: portalToken field stubs appended below existing
// tests. Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-18

describe("client schema", () => {
  it('has name "client" and type "document"', () => {
    expect(client.name).toBe("client");
    expect(client.type).toBe("document");
  });

  it('has field "name" of type "string"', () => {
    const field = client.fields?.find((f) => f.name === "name");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "email" of type "string"', () => {
    const field = client.fields?.find((f) => f.name === "email");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "phone" of type "string"', () => {
    const field = client.fields?.find((f) => f.name === "phone");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "preferredContact" of type "string" with phone/email/text options', () => {
    const field = client.fields?.find((f) => f.name === "preferredContact");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    const list = (field?.options as { list: { value: string }[] })?.list;
    expect(list).toHaveLength(3);
    const values = list.map((item) => item.value);
    expect(values).toContain("phone");
    expect(values).toContain("email");
    expect(values).toContain("text");
  });

  it('has field "address" of type "object" with street, city, state, zip subfields', () => {
    const field = client.fields?.find((f) => f.name === "address");
    expect(field).toBeDefined();
    expect(field?.type).toBe("object");
    const subfields = (field as { fields?: { name: string }[] })?.fields;
    expect(subfields).toBeDefined();
    const subNames = subfields!.map((sf) => sf.name);
    expect(subNames).toContain("street");
    expect(subNames).toContain("city");
    expect(subNames).toContain("state");
    expect(subNames).toContain("zip");
  });

  it('preview selects title from "name" and subtitle from "email"', () => {
    const preview = client.preview as { select: Record<string, string> };
    expect(preview?.select?.title).toBe("name");
    expect(preview?.select?.subtitle).toBe("email");
  });
});

describe("client schema portalToken field (Phase 34 Plan 05)", () => {
  it("client schema defines a field named 'portalToken'", () => {
    const field = client.fields?.find((f) => f.name === "portalToken");
    expect(field).toBeDefined();
  });

  it("portalToken field has type 'string'", () => {
    const field = client.fields?.find((f) => f.name === "portalToken");
    expect(field?.type).toBe("string");
  });

  it("portalToken field has readOnly: true", () => {
    const field = client.fields?.find((f) => f.name === "portalToken") as
      | { readOnly?: boolean }
      | undefined;
    expect(field?.readOnly).toBe(true);
  });

  it("portalToken field has NO initialValue (lazy generation per D-18)", () => {
    const field = client.fields?.find((f) => f.name === "portalToken") as
      | { initialValue?: unknown }
      | undefined;
    expect(field).toBeDefined();
    // Property must be absent entirely, not merely undefined from a set call.
    expect(
      Object.prototype.hasOwnProperty.call(field ?? {}, "initialValue"),
    ).toBe(false);
  });
});

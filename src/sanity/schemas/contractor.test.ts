import { describe, it, expect } from "vitest";
import { contractor } from "./contractor";

describe("contractor schema", () => {
  it('exports a document type named "contractor"', () => {
    expect(contractor.name).toBe("contractor");
    expect(contractor.type).toBe("document");
  });

  it("has fields: name, email, phone, company, trades", () => {
    const fieldNames = contractor.fields?.map((f) => f.name);
    expect(fieldNames).toContain("name");
    expect(fieldNames).toContain("email");
    expect(fieldNames).toContain("phone");
    expect(fieldNames).toContain("company");
    expect(fieldNames).toContain("trades");
  });

  it("name field has required validation", () => {
    const field = contractor.fields?.find((f) => f.name === "name");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    expect(field?.validation).toBeDefined();
  });

  it("email field has required + email validation", () => {
    const field = contractor.fields?.find((f) => f.name === "email");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    expect(field?.validation).toBeDefined();
  });

  it("trades field is array type with predefined list", () => {
    const field = contractor.fields?.find((f) => f.name === "trades");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    const ofArray = (field as { of?: { type: string; options?: { list: { value: string }[] } }[] })?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray!.length).toBeGreaterThan(0);
    const stringMember = ofArray![0];
    expect(stringMember.type).toBe("string");
    const list = stringMember.options?.list;
    expect(list).toBeDefined();
    const values = list!.map((item) => item.value);
    expect(values).toContain("electrician");
    expect(values).toContain("general-contractor");
    expect(values).toContain("custom-millwork");
    expect(values).toContain("plumber");
    expect(values).toContain("hvac");
    expect(values).toContain("other");
  });

  it("has preview selecting title from name and subtitle from company", () => {
    const preview = contractor.preview;
    expect(preview).toBeDefined();
    expect(preview?.select?.title).toBe("name");
    expect(preview?.select?.subtitle).toBe("company");
  });
});

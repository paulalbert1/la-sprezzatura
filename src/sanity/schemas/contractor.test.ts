import { describe, it, expect } from "vitest";
import { contractor } from "./contractor";

describe("contractor schema", () => {
  it('exports a document type named "contractor"', () => {
    expect(contractor.name).toBe("contractor");
    expect(contractor.type).toBe("document");
  });

  it("has fields: name, email, phone, company, trades, address, documents", () => {
    const fieldNames = contractor.fields?.map((f) => f.name);
    expect(fieldNames).toContain("name");
    expect(fieldNames).toContain("email");
    expect(fieldNames).toContain("phone");
    expect(fieldNames).toContain("company");
    expect(fieldNames).toContain("trades");
    expect(fieldNames).toContain("address");
    expect(fieldNames).toContain("documents");
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

  it("trades field is array type of strings", () => {
    const field = contractor.fields?.find((f) => f.name === "trades");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    const ofArray = (field as { of?: { type: string }[] })?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray!.length).toBeGreaterThan(0);
    const stringMember = ofArray![0];
    expect(stringMember.type).toBe("string");
  });

  // Phase 40 Plan 01 — VEND-04: address field
  it("address field is an object type with street, city, state, zip sub-fields", () => {
    const field = contractor.fields?.find((f) => f.name === "address");
    expect(field).toBeDefined();
    expect(field?.type).toBe("object");
    const subFields = (field as { fields?: { name: string }[] })?.fields;
    expect(subFields).toBeDefined();
    const subFieldNames = subFields!.map((f) => f.name);
    expect(subFieldNames).toContain("street");
    expect(subFieldNames).toContain("city");
    expect(subFieldNames).toContain("state");
    expect(subFieldNames).toContain("zip");
  });

  it("address field appears between company and trades in field order", () => {
    const fieldNames = contractor.fields?.map((f) => f.name) ?? [];
    const companyIdx = fieldNames.indexOf("company");
    const addressIdx = fieldNames.indexOf("address");
    const tradesIdx = fieldNames.indexOf("trades");
    expect(companyIdx).toBeGreaterThanOrEqual(0);
    expect(addressIdx).toBeGreaterThan(companyIdx);
    expect(tradesIdx).toBeGreaterThan(addressIdx);
  });

  // Phase 40 Plan 01 — VEND-05: docType on contractorDocument array member
  it("documents array member contractorDocument has a docType field", () => {
    const documentsField = contractor.fields?.find((f) => f.name === "documents");
    expect(documentsField).toBeDefined();
    expect(documentsField?.type).toBe("array");
    const ofArray = (documentsField as { of?: { name?: string; fields?: { name: string }[] }[] })?.of;
    expect(ofArray).toBeDefined();
    const docMember = ofArray!.find((m) => m.name === "contractorDocument");
    expect(docMember).toBeDefined();
    const memberFieldNames = docMember!.fields!.map((f) => f.name);
    expect(memberFieldNames).toContain("fileName");
    expect(memberFieldNames).toContain("fileType");
    expect(memberFieldNames).toContain("url");
    expect(memberFieldNames).toContain("uploadedAt");
    expect(memberFieldNames).toContain("docType");
  });

  it("has preview selecting title from name and subtitle from company", () => {
    const preview = contractor.preview;
    expect(preview).toBeDefined();
    expect(preview?.select?.title).toBe("name");
    expect(preview?.select?.subtitle).toBe("company");
  });

  // Phase 42 Plan 01 — TRAD-02
  it("has a `relationship` field of type string with options.list of [contractor, vendor]", () => {
    const field = contractor.fields?.find((f) => f.name === "relationship") as
      | { type: string; options?: { list?: Array<{ value: string; title: string }> }; validation?: unknown }
      | undefined;
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    expect(field?.options?.list).toBeDefined();
    const values = field!.options!.list!.map((o) => o.value);
    expect(values).toEqual(["contractor", "vendor"]);
    expect(field?.validation).toBeDefined();
  });

  it("`relationship` field is positioned between `company` and `address`", () => {
    const names = contractor.fields!.map((f) => f.name);
    const companyIdx = names.indexOf("company");
    const relIdx = names.indexOf("relationship");
    const addressIdx = names.indexOf("address");
    expect(relIdx).toBe(companyIdx + 1);
    expect(addressIdx).toBe(relIdx + 1);
  });
});

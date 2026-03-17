import { describe, it, expect } from "vitest";
import { project } from "./project";

describe("project schema (Phase 5 extensions)", () => {
  it('has field "clients" of type "array" in group "portal"', () => {
    const field = project.fields?.find((f) => f.name === "clients");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    expect(field?.group).toBe("portal");
  });

  it('"clients" array members have "client" reference field and "isPrimary" boolean field', () => {
    const field = project.fields?.find((f) => f.name === "clients");
    expect(field).toBeDefined();
    const ofArray = (field as { of?: { fields?: { name: string; type: string }[] }[] })?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray!.length).toBeGreaterThan(0);
    const memberFields = ofArray![0].fields;
    expect(memberFields).toBeDefined();
    const clientRef = memberFields!.find((f) => f.name === "client");
    expect(clientRef).toBeDefined();
    expect(clientRef!.type).toBe("reference");
    const isPrimary = memberFields!.find((f) => f.name === "isPrimary");
    expect(isPrimary).toBeDefined();
    expect(isPrimary!.type).toBe("boolean");
  });

  it('has field "engagementType" of type "string" with correct options', () => {
    const field = project.fields?.find((f) => f.name === "engagementType");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    const list = (field?.options as { list: { value: string }[] })?.list;
    expect(list).toBeDefined();
    const values = list.map((item) => item.value);
    expect(values).toContain("full-interior-design");
    expect(values).toContain("styling-refreshing");
    expect(values).toContain("carpet-curating");
  });

  it('has field "projectAddress" of type "object" with street, city, state, zip, adminNotes subfields', () => {
    const field = project.fields?.find((f) => f.name === "projectAddress");
    expect(field).toBeDefined();
    expect(field?.type).toBe("object");
    const subfields = (field as { fields?: { name: string }[] })?.fields;
    expect(subfields).toBeDefined();
    const subNames = subfields!.map((sf) => sf.name);
    expect(subNames).toContain("street");
    expect(subNames).toContain("city");
    expect(subNames).toContain("state");
    expect(subNames).toContain("zip");
    expect(subNames).toContain("adminNotes");
  });

  it('does NOT have field named "clientName" (deprecated, removed)', () => {
    const field = project.fields?.find((f) => f.name === "clientName");
    expect(field).toBeUndefined();
  });
});

describe("project schema (Phase 7 extensions)", () => {
  // Helper to extract hidden callback from a field
  function getHiddenCallback(fieldName: string) {
    const field = project.fields?.find((f) => f.name === fieldName);
    return field?.hidden as (args: { document?: Record<string, unknown> }) => boolean;
  }

  it('has "contractors" group in groups array', () => {
    const groups = (project as { groups?: { name: string }[] }).groups;
    expect(groups).toBeDefined();
    const contractorsGroup = groups!.find((g) => g.name === "contractors");
    expect(contractorsGroup).toBeDefined();
  });

  it('has field "isCommercial" of type "boolean" in "content" group', () => {
    const field = project.fields?.find((f) => f.name === "isCommercial");
    expect(field).toBeDefined();
    expect(field?.type).toBe("boolean");
    expect(field?.group).toBe("content");
  });

  it('has field "contractors" in "contractors" group', () => {
    const field = project.fields?.find((f) => f.name === "contractors");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    expect(field?.group).toBe("contractors");
  });

  it("contractors field hidden when engagementType is styling-refreshing", () => {
    const hidden = getHiddenCallback("contractors");
    expect(hidden).toBeDefined();
    expect(hidden({ document: { engagementType: "styling-refreshing" } })).toBe(true);
  });

  it("contractors field visible when engagementType is full-interior-design", () => {
    const hidden = getHiddenCallback("contractors");
    expect(hidden({ document: { engagementType: "full-interior-design" } })).toBe(false);
  });

  it("procurementItems field hidden when engagementType is carpet-curating", () => {
    const hidden = getHiddenCallback("procurementItems");
    expect(hidden).toBeDefined();
    expect(hidden({ document: { engagementType: "carpet-curating" } })).toBe(true);
  });

  it("procurementItems field visible when engagementType is full-interior-design", () => {
    const hidden = getHiddenCallback("procurementItems");
    expect(hidden({ document: { engagementType: "full-interior-design" } })).toBe(false);
  });

  it('has field "buildingManager" with hidden callback gated on isCommercial', () => {
    const field = project.fields?.find((f) => f.name === "buildingManager");
    expect(field).toBeDefined();
    expect(field?.type).toBe("object");
    const hidden = getHiddenCallback("buildingManager");
    expect(hidden({ document: { isCommercial: false } })).toBe(true);
    expect(hidden({ document: { isCommercial: true } })).toBe(false);
  });

  it('has field "cois" with hidden callback gated on isCommercial', () => {
    const field = project.fields?.find((f) => f.name === "cois");
    expect(field).toBeDefined();
    const hidden = getHiddenCallback("cois");
    expect(hidden({ document: { isCommercial: false } })).toBe(true);
    expect(hidden({ document: { isCommercial: true } })).toBe(false);
  });

  it('has field "legalDocs" with hidden callback gated on isCommercial', () => {
    const field = project.fields?.find((f) => f.name === "legalDocs");
    expect(field).toBeDefined();
    const hidden = getHiddenCallback("legalDocs");
    expect(hidden({ document: { isCommercial: false } })).toBe(true);
    expect(hidden({ document: { isCommercial: true } })).toBe(false);
  });

  it('has field "floorPlans" with hidden callback gated on engagementType', () => {
    const field = project.fields?.find((f) => f.name === "floorPlans");
    expect(field).toBeDefined();
    const hidden = getHiddenCallback("floorPlans");
    expect(hidden({ document: { engagementType: "styling-refreshing" } })).toBe(true);
    expect(hidden({ document: { engagementType: "full-interior-design" } })).toBe(false);
  });
});

describe("project schema (Phase 8 extensions)", () => {
  // Helper: get contractor inline object fields
  function getContractorMemberFields() {
    const field = project.fields?.find((f) => f.name === "contractors");
    const ofArray = (field as any)?.of;
    return ofArray?.[0]?.fields as { name: string; type: string; readOnly?: boolean }[] | undefined;
  }

  it('contractors inline object contains "appointments" array field', () => {
    const fields = getContractorMemberFields();
    expect(fields).toBeDefined();
    const appointments = fields!.find((f) => f.name === "appointments");
    expect(appointments).toBeDefined();
    expect(appointments!.type).toBe("array");
  });

  it("appointments sub-fields include dateTime (required), label (required), notes", () => {
    const fields = getContractorMemberFields();
    const appointments = fields!.find((f) => f.name === "appointments");
    const ofArray = (appointments as any)?.of;
    expect(ofArray).toBeDefined();
    const subFields = ofArray[0]?.fields as { name: string; type: string }[];
    expect(subFields).toBeDefined();
    const names = subFields.map((f) => f.name);
    expect(names).toContain("dateTime");
    expect(names).toContain("label");
    expect(names).toContain("notes");
  });

  it('contractors inline object contains "contractorNotes" text field', () => {
    const fields = getContractorMemberFields();
    expect(fields).toBeDefined();
    const contractorNotes = fields!.find((f) => f.name === "contractorNotes");
    expect(contractorNotes).toBeDefined();
    expect(contractorNotes!.type).toBe("text");
  });

  it('contractors inline object contains "submissionNotes" array field with readOnly', () => {
    const fields = getContractorMemberFields();
    expect(fields).toBeDefined();
    const submissionNotes = fields!.find((f) => f.name === "submissionNotes");
    expect(submissionNotes).toBeDefined();
    expect(submissionNotes!.type).toBe("array");
    expect((submissionNotes as any).readOnly).toBe(true);
  });

  it("submissionNotes sub-fields include text, contractorName, timestamp", () => {
    const fields = getContractorMemberFields();
    const submissionNotes = fields!.find((f) => f.name === "submissionNotes");
    const ofArray = (submissionNotes as any)?.of;
    expect(ofArray).toBeDefined();
    const subFields = ofArray[0]?.fields as { name: string }[];
    expect(subFields).toBeDefined();
    const names = subFields.map((f) => f.name);
    expect(names).toContain("text");
    expect(names).toContain("contractorName");
    expect(names).toContain("timestamp");
  });
});

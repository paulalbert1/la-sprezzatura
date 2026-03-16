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

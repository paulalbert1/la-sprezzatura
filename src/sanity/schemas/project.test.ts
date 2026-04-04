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

describe("project schema (Phase 9 extensions)", () => {
  it('has "updates" group in groups array', () => {
    const groups = (project as { groups?: { name: string }[] }).groups;
    expect(groups).toBeDefined();
    const updatesGroup = groups!.find((g) => g.name === "updates");
    expect(updatesGroup).toBeDefined();
  });

  it('has field "updateLog" of type "array" in group "updates" with readOnly', () => {
    const field = project.fields?.find((f) => f.name === "updateLog");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    expect(field?.group).toBe("updates");
    expect((field as any).readOnly).toBe(true);
  });

  it("updateLog array members have sentAt, recipientEmails, note, sectionsIncluded fields", () => {
    const field = project.fields?.find((f) => f.name === "updateLog");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray!.length).toBeGreaterThan(0);
    const memberFields = ofArray![0].fields as { name: string; type: string }[];
    expect(memberFields).toBeDefined();
    const names = memberFields.map((f) => f.name);
    expect(names).toContain("sentAt");
    expect(names).toContain("recipientEmails");
    expect(names).toContain("note");
    expect(names).toContain("sectionsIncluded");
  });

  // Helper: dig into artifacts array member fields
  function getArtifactMemberFields() {
    const field = project.fields?.find((f) => f.name === "artifacts");
    const ofArray = (field as any)?.of;
    return ofArray?.[0]?.fields as { name: string; type: string; hidden?: unknown }[] | undefined;
  }

  it('artifact inline object contains "investmentSummary" object field', () => {
    const fields = getArtifactMemberFields();
    expect(fields).toBeDefined();
    const investmentSummary = fields!.find((f) => f.name === "investmentSummary");
    expect(investmentSummary).toBeDefined();
    expect(investmentSummary!.type).toBe("object");
  });

  it("investmentSummary is hidden when artifactType is not proposal", () => {
    const fields = getArtifactMemberFields();
    const investmentSummary = fields!.find((f) => f.name === "investmentSummary");
    const hidden = investmentSummary?.hidden as (args: { parent?: Record<string, unknown> }) => boolean;
    expect(hidden).toBeDefined();
    expect(hidden({ parent: { artifactType: "contract" } })).toBe(true);
    expect(hidden({ parent: { artifactType: "proposal" } })).toBe(false);
  });

  it("investmentSummary has tiers, selectedTierKey, eagerness, reservations subfields", () => {
    const fields = getArtifactMemberFields();
    const investmentSummary = fields!.find((f) => f.name === "investmentSummary");
    const subfields = (investmentSummary as any)?.fields as { name: string; type: string }[];
    expect(subfields).toBeDefined();
    const names = subfields.map((f) => f.name);
    expect(names).toContain("tiers");
    expect(names).toContain("selectedTierKey");
    expect(names).toContain("eagerness");
    expect(names).toContain("reservations");
  });

  it("selectedTierKey is readOnly", () => {
    const fields = getArtifactMemberFields();
    const investmentSummary = fields!.find((f) => f.name === "investmentSummary");
    const subfields = (investmentSummary as any)?.fields as { name: string; readOnly?: boolean }[];
    const selectedTierKey = subfields.find((f) => f.name === "selectedTierKey");
    expect(selectedTierKey).toBeDefined();
    expect((selectedTierKey as any).readOnly).toBe(true);
  });

  it("tiers array members have name, description, lineItems subfields", () => {
    const fields = getArtifactMemberFields();
    const investmentSummary = fields!.find((f) => f.name === "investmentSummary");
    const subfields = (investmentSummary as any)?.fields as { name: string; type: string }[];
    const tiersField = subfields.find((f) => f.name === "tiers");
    expect(tiersField).toBeDefined();
    const tierMembers = (tiersField as any)?.of?.[0]?.fields as { name: string }[];
    expect(tierMembers).toBeDefined();
    const tierFieldNames = tierMembers.map((f) => f.name);
    expect(tierFieldNames).toContain("name");
    expect(tierFieldNames).toContain("description");
    expect(tierFieldNames).toContain("lineItems");
  });
});

describe("project schema (Phase 15 schedule extensions)", () => {
  // Helper to extract hidden callback from a field
  function getHiddenCallback(fieldName: string) {
    const field = project.fields?.find((f) => f.name === fieldName);
    return field?.hidden as
      | ((args: { document?: Record<string, unknown> }) => boolean)
      | undefined;
  }

  // Helper: get procurementItem inline object fields
  function getProcurementItemFields() {
    const field = project.fields?.find((f) => f.name === "procurementItems");
    const ofArray = (field as any)?.of;
    return ofArray?.[0]?.fields as
      | { name: string; type: string }[]
      | undefined;
  }

  // SCHED-02: Schedule group exists
  it('has "schedule" group in groups array with title "Schedule"', () => {
    const groups = (project as { groups?: { name: string; title: string }[] })
      .groups;
    expect(groups).toBeDefined();
    const scheduleGroup = groups!.find((g) => g.name === "schedule");
    expect(scheduleGroup).toBeDefined();
    expect(scheduleGroup!.title).toBe("Schedule");
  });

  // SCHED-01: customEvents field exists with correct type and group
  it('has field "customEvents" of type "array" in group "schedule"', () => {
    const field = project.fields?.find((f) => f.name === "customEvents");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    expect(field?.group).toBe("schedule");
  });

  // SCHED-01 / D-02: customEvents hidden when not full-interior-design
  it("customEvents field hidden when engagementType is not full-interior-design", () => {
    const hidden = getHiddenCallback("customEvents");
    expect(hidden).toBeDefined();
    expect(
      hidden!({ document: { engagementType: "styling-refreshing" } })
    ).toBe(true);
    expect(
      hidden!({ document: { engagementType: "carpet-curating" } })
    ).toBe(true);
    expect(
      hidden!({ document: { engagementType: "full-interior-design" } })
    ).toBe(false);
  });

  // SCHED-01: customEvents array member fields
  it("customEvents array members have name (string), date (date), endDate (date), category (string), notes (text)", () => {
    const field = project.fields?.find((f) => f.name === "customEvents");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray.length).toBeGreaterThan(0);
    const memberFields = ofArray[0].fields as {
      name: string;
      type: string;
    }[];
    expect(memberFields).toBeDefined();

    const nameField = memberFields.find((f) => f.name === "name");
    expect(nameField).toBeDefined();
    expect(nameField!.type).toBe("string");

    const dateField = memberFields.find((f) => f.name === "date");
    expect(dateField).toBeDefined();
    expect(dateField!.type).toBe("date");

    const endDateField = memberFields.find((f) => f.name === "endDate");
    expect(endDateField).toBeDefined();
    expect(endDateField!.type).toBe("date");

    const categoryField = memberFields.find((f) => f.name === "category");
    expect(categoryField).toBeDefined();
    expect(categoryField!.type).toBe("string");

    const notesField = memberFields.find((f) => f.name === "notes");
    expect(notesField).toBeDefined();
    expect(notesField!.type).toBe("text");
  });

  // D-04: All 10 category options
  it("customEvents category field has exactly 10 options matching D-04", () => {
    const field = project.fields?.find((f) => f.name === "customEvents");
    const ofArray = (field as any)?.of;
    const memberFields = ofArray[0].fields as any[];
    const categoryField = memberFields.find(
      (f: any) => f.name === "category"
    );
    expect(categoryField).toBeDefined();
    const list = categoryField.options?.list as { value: string }[];
    expect(list).toBeDefined();
    expect(list.length).toBe(10);
    const values = list.map((item) => item.value);
    expect(values).toContain("walkthrough");
    expect(values).toContain("inspection");
    expect(values).toContain("punch-list");
    expect(values).toContain("move");
    expect(values).toContain("permit");
    expect(values).toContain("delivery-window");
    expect(values).toContain("presentation");
    expect(values).toContain("deadline");
    expect(values).toContain("access");
    expect(values).toContain("other");
  });

  // SCHED-03: procurementItem has orderDate and expectedDeliveryDate
  it('procurementItem has "orderDate" field of type "date"', () => {
    const fields = getProcurementItemFields();
    expect(fields).toBeDefined();
    const orderDate = fields!.find((f) => f.name === "orderDate");
    expect(orderDate).toBeDefined();
    expect(orderDate!.type).toBe("date");
  });

  it('procurementItem has "expectedDeliveryDate" field of type "date"', () => {
    const fields = getProcurementItemFields();
    expect(fields).toBeDefined();
    const expectedDeliveryDate = fields!.find(
      (f) => f.name === "expectedDeliveryDate"
    );
    expect(expectedDeliveryDate).toBeDefined();
    expect(expectedDeliveryDate!.type).toBe("date");
  });

  // D-03: orderDate and expectedDeliveryDate appear before installDate
  it("orderDate and expectedDeliveryDate appear before installDate in procurementItem field order", () => {
    const fields = getProcurementItemFields();
    expect(fields).toBeDefined();
    const fieldNames = fields!.map((f) => f.name);
    const orderDateIdx = fieldNames.indexOf("orderDate");
    const expectedDeliveryIdx = fieldNames.indexOf("expectedDeliveryDate");
    const installDateIdx = fieldNames.indexOf("installDate");
    expect(orderDateIdx).toBeGreaterThan(-1);
    expect(expectedDeliveryIdx).toBeGreaterThan(-1);
    expect(installDateIdx).toBeGreaterThan(-1);
    expect(orderDateIdx).toBeLessThan(installDateIdx);
    expect(expectedDeliveryIdx).toBeLessThan(installDateIdx);
  });
});

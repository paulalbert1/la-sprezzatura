import { describe, it, expect } from "vitest";
import { designOption } from "./designOption";

describe("designOption schema", () => {
  it('has field "project" of type "reference"', () => {
    const field = designOption.fields?.find((f) => f.name === "project");
    expect(field).toBeDefined();
    expect(field?.type).toBe("reference");
  });

  it('has field "blobPathname" of type "string"', () => {
    const field = designOption.fields?.find((f) => f.name === "blobPathname");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "caption" of type "string"', () => {
    const field = designOption.fields?.find((f) => f.name === "caption");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "sourceSession" of type "reference"', () => {
    const field = designOption.fields?.find((f) => f.name === "sourceSession");
    expect(field).toBeDefined();
    expect(field?.type).toBe("reference");
  });

  it('has field "sourceRenderingIndex" of type "number"', () => {
    const field = designOption.fields?.find((f) => f.name === "sourceRenderingIndex");
    expect(field).toBeDefined();
    expect(field?.type).toBe("number");
  });

  it('has field "sortOrder" of type "number"', () => {
    const field = designOption.fields?.find((f) => f.name === "sortOrder");
    expect(field).toBeDefined();
    expect(field?.type).toBe("number");
  });

  it('has field "promotedAt" of type "datetime"', () => {
    const field = designOption.fields?.find((f) => f.name === "promotedAt");
    expect(field).toBeDefined();
    expect(field?.type).toBe("datetime");
  });

  it('has field "promotedBy" of type "string"', () => {
    const field = designOption.fields?.find((f) => f.name === "promotedBy");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "reactions" of type "array"', () => {
    const field = designOption.fields?.find((f) => f.name === "reactions");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
  });

  it('"reactions" array members have fields: clientId, type, text, createdAt', () => {
    const field = designOption.fields?.find((f) => f.name === "reactions");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray!.length).toBeGreaterThan(0);
    const memberFields = ofArray![0].fields as { name: string; type: string }[];
    expect(memberFields).toBeDefined();
    const names = memberFields.map((f) => f.name);
    expect(names).toContain("clientId");
    expect(names).toContain("type");
    expect(names).toContain("text");
    expect(names).toContain("createdAt");

    expect(memberFields.find((f) => f.name === "clientId")!.type).toBe("string");
    expect(memberFields.find((f) => f.name === "type")!.type).toBe("string");
    expect(memberFields.find((f) => f.name === "text")!.type).toBe("text");
    expect(memberFields.find((f) => f.name === "createdAt")!.type).toBe("datetime");
  });

  it('"type" field in reactions has options list containing "favorite" and "comment"', () => {
    const field = designOption.fields?.find((f) => f.name === "reactions");
    const ofArray = (field as any)?.of;
    const memberFields = ofArray![0].fields as { name: string; type: string; options?: { list: string[] } }[];
    const typeField = memberFields.find((f) => f.name === "type");
    expect(typeField).toBeDefined();
    const list = (typeField?.options as { list: string[] })?.list;
    expect(list).toBeDefined();
    expect(list).toContain("favorite");
    expect(list).toContain("comment");
  });
});

import { describe, it, expect } from "vitest";
import { renderingSession } from "./renderingSession";

describe("renderingSession schema", () => {
  it('has 4 groups: setup, inputs, renderings, metadata', () => {
    const groups = (renderingSession as { groups?: { name: string }[] }).groups;
    expect(groups).toBeDefined();
    const names = groups!.map((g) => g.name);
    expect(names).toContain("setup");
    expect(names).toContain("inputs");
    expect(names).toContain("renderings");
    expect(names).toContain("metadata");
    expect(names.length).toBe(4);
  });

  it('has field "sessionTitle" of type "string"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "sessionTitle");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "project" of type "reference"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "project");
    expect(field).toBeDefined();
    expect(field?.type).toBe("reference");
  });

  it('has field "aspectRatio" of type "string" with options list containing "16:9", "1:1", "4:3"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "aspectRatio");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    const list = (field?.options as { list: string[] })?.list;
    expect(list).toBeDefined();
    expect(list).toContain("16:9");
    expect(list).toContain("1:1");
    expect(list).toContain("4:3");
  });

  it('has field "description" of type "text"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "description");
    expect(field).toBeDefined();
    expect(field?.type).toBe("text");
  });

  it('has field "stylePreset" of type "string"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "stylePreset");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "images" of type "array"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "images");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
  });

  it('"images" array members have fields: blobPathname, imageType, location, notes, copyExact', () => {
    const field = renderingSession.fields?.find((f) => f.name === "images");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray!.length).toBeGreaterThan(0);
    const memberFields = ofArray![0].fields as { name: string; type: string }[];
    expect(memberFields).toBeDefined();
    const names = memberFields.map((f) => f.name);
    expect(names).toContain("blobPathname");
    expect(names).toContain("imageType");
    expect(names).toContain("location");
    expect(names).toContain("notes");
    expect(names).toContain("copyExact");

    expect(memberFields.find((f) => f.name === "blobPathname")!.type).toBe("string");
    expect(memberFields.find((f) => f.name === "imageType")!.type).toBe("string");
    expect(memberFields.find((f) => f.name === "location")!.type).toBe("string");
    expect(memberFields.find((f) => f.name === "notes")!.type).toBe("string");
    expect(memberFields.find((f) => f.name === "copyExact")!.type).toBe("boolean");
  });

  it('has field "renderings" of type "array"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "renderings");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
  });

  it('"renderings" array members have required fields', () => {
    const field = renderingSession.fields?.find((f) => f.name === "renderings");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    const memberFields = ofArray![0].fields as { name: string; type: string }[];
    expect(memberFields).toBeDefined();

    const findField = (name: string) => memberFields.find((f) => f.name === name);

    expect(findField("blobPathname")!.type).toBe("string");
    expect(findField("status")!.type).toBe("string");
    expect(findField("isPromoted")!.type).toBe("boolean");
    expect(findField("modelId")!.type).toBe("string");
    expect(findField("latencyMs")!.type).toBe("number");
    expect(findField("costEstimate")!.type).toBe("number");
    expect(findField("bytesStored")!.type).toBe("number");
  });

  it('has field "conversation" of type "array"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "conversation");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
  });

  it('"conversation" array members have fields: role, text, image, timestamp', () => {
    const field = renderingSession.fields?.find((f) => f.name === "conversation");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    const memberFields = ofArray![0].fields as { name: string; type: string }[];
    expect(memberFields).toBeDefined();

    const findField = (name: string) => memberFields.find((f) => f.name === name);

    expect(findField("role")!.type).toBe("string");
    expect(findField("text")!.type).toBe("text");
    expect(findField("image")!.type).toBe("string");
    expect(findField("timestamp")!.type).toBe("datetime");
  });

  it('has field "status" of type "string" with options list containing "idle", "generating", "complete", "error"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "status");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    const list = (field?.options as { list: string[] })?.list;
    expect(list).toBeDefined();
    expect(list).toContain("idle");
    expect(list).toContain("generating");
    expect(list).toContain("complete");
    expect(list).toContain("error");
  });

  it('has field "createdBy" of type "string"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "createdBy");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "createdAt" of type "datetime"', () => {
    const field = renderingSession.fields?.find((f) => f.name === "createdAt");
    expect(field).toBeDefined();
    expect(field?.type).toBe("datetime");
  });
});

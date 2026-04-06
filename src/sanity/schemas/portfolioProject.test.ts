import { describe, it, expect } from "vitest";
import { portfolioProject } from "./portfolioProject";

describe("portfolioProject schema", () => {
  it('has name "portfolioProject"', () => {
    expect(portfolioProject.name).toBe("portfolioProject");
  });

  it('has type "document"', () => {
    expect(portfolioProject.type).toBe("document");
  });

  it('has field "title" of type "string"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "title");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "slug" of type "slug"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "slug");
    expect(field).toBeDefined();
    expect(field?.type).toBe("slug");
  });

  it('has field "location" of type "string"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "location");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "description" of type "text"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "description");
    expect(field).toBeDefined();
    expect(field?.type).toBe("text");
  });

  it('has field "tags" of type "array"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "tags");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray[0].type).toBe("string");
  });

  it('has field "heroImage" of type "image"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "heroImage");
    expect(field).toBeDefined();
    expect(field?.type).toBe("image");
  });

  it('has field "images" of type "array"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "images");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
  });

  it('has field "roomType" of type "string" with correct options list', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "roomType");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    const options = (field as any)?.options;
    expect(options?.list).toBeDefined();
    const values = options.list.map((item: any) => item.value);
    expect(values).toContain("living-room");
    expect(values).toContain("kitchen");
    expect(values).toContain("bedroom");
    expect(values).toContain("bathroom");
    expect(values).toContain("dining-room");
    expect(values).toContain("home-office");
    expect(values).toContain("outdoor");
    expect(values).toContain("full-home");
  });

  it('has field "challenge" of type "array" (of block)', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "challenge");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray[0].type).toBe("block");
  });

  it('has field "approach" of type "array" (of block)', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "approach");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray[0].type).toBe("block");
  });

  it('has field "outcome" of type "array" (of block)', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "outcome");
    expect(field).toBeDefined();
    expect(field?.type).toBe("array");
    const ofArray = (field as any)?.of;
    expect(ofArray).toBeDefined();
    expect(ofArray[0].type).toBe("block");
  });

  it('has field "testimonial" of type "object" with subfields quote and author', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "testimonial");
    expect(field).toBeDefined();
    expect(field?.type).toBe("object");
    const subfields = (field as any)?.fields;
    expect(subfields).toBeDefined();
    const quoteField = subfields.find((f: any) => f.name === "quote");
    expect(quoteField).toBeDefined();
    expect(quoteField.type).toBe("text");
    const authorField = subfields.find((f: any) => f.name === "author");
    expect(authorField).toBeDefined();
    expect(authorField.type).toBe("string");
  });

  it('has field "completionDate" of type "date"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "completionDate");
    expect(field).toBeDefined();
    expect(field?.type).toBe("date");
  });

  it('has field "featured" of type "boolean"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "featured");
    expect(field).toBeDefined();
    expect(field?.type).toBe("boolean");
  });

  it('has field "order" of type "number"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "order");
    expect(field).toBeDefined();
    expect(field?.type).toBe("number");
  });

  it('has field "sourceAdminProjectId" of type "string" with readOnly true', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "sourceAdminProjectId");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
    expect((field as any)?.readOnly).toBe(true);
  });

  it('does NOT have a field named "style" (D-04)', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "style");
    expect(field).toBeUndefined();
  });

  it("has preview config with title, subtitle (location), and media (heroImage)", () => {
    const preview = (portfolioProject as any).preview;
    expect(preview).toBeDefined();
    expect(preview.select.title).toBe("title");
    expect(preview.select.subtitle).toBe("location");
    expect(preview.select.media).toBe("heroImage");
  });
});

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

  it('does NOT have fields "challenge", "approach", "outcome", "testimonial"', () => {
    expect(portfolioProject.fields?.find((f) => f.name === "challenge")).toBeUndefined();
    expect(portfolioProject.fields?.find((f) => f.name === "approach")).toBeUndefined();
    expect(portfolioProject.fields?.find((f) => f.name === "outcome")).toBeUndefined();
    expect(portfolioProject.fields?.find((f) => f.name === "testimonial")).toBeUndefined();
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

  it('has field "published" of type "boolean"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "published");
    expect(field).toBeDefined();
    expect(field?.type).toBe("boolean");
  });

  it('has field "sourceAdminProject" of type "reference"', () => {
    const field = portfolioProject.fields?.find((f) => f.name === "sourceAdminProject");
    expect(field).toBeDefined();
    expect(field?.type).toBe("reference");
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

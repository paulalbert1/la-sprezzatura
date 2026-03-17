import { describe, it, expect } from "vitest";
import { renderingUsage } from "./renderingUsage";

describe("renderingUsage schema", () => {
  it('has field "sanityUserId" of type "string"', () => {
    const field = renderingUsage.fields?.find((f) => f.name === "sanityUserId");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "month" of type "string"', () => {
    const field = renderingUsage.fields?.find((f) => f.name === "month");
    expect(field).toBeDefined();
    expect(field?.type).toBe("string");
  });

  it('has field "count" of type "number"', () => {
    const field = renderingUsage.fields?.find((f) => f.name === "count");
    expect(field).toBeDefined();
    expect(field?.type).toBe("number");
  });

  it('has field "limit" of type "number"', () => {
    const field = renderingUsage.fields?.find((f) => f.name === "limit");
    expect(field).toBeDefined();
    expect(field?.type).toBe("number");
  });

  it('has field "bytesStored" of type "number"', () => {
    const field = renderingUsage.fields?.find((f) => f.name === "bytesStored");
    expect(field).toBeDefined();
    expect(field?.type).toBe("number");
  });
});

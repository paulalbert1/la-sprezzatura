import { describe, it, expect } from "vitest";
import { formatPhone } from "./format";

describe("formatPhone", () => {
  it("formats a raw 10-digit string as (NNN) NNN-NNNN", () => {
    expect(formatPhone("2125550142")).toBe("(212) 555-0142");
  });

  it("re-formats an already parenthetical input (212) 555-0142", () => {
    expect(formatPhone("(212) 555-0142")).toBe("(212) 555-0142");
  });

  it("strips hyphens from 212-555-0142 and formats correctly", () => {
    expect(formatPhone("212-555-0142")).toBe("(212) 555-0142");
  });

  it("strips dots from 212.555.0142 and formats correctly", () => {
    expect(formatPhone("212.555.0142")).toBe("(212) 555-0142");
  });

  it("returns raw input unchanged for 11-digit number +1 212 555 0142", () => {
    expect(formatPhone("+1 212 555 0142")).toBe("+1 212 555 0142");
  });

  it("returns raw input unchanged for 7-digit number 555-1234", () => {
    expect(formatPhone("555-1234")).toBe("555-1234");
  });

  it("returns empty string for empty input", () => {
    expect(formatPhone("")).toBe("");
  });

  it("returns empty string for null input", () => {
    expect(formatPhone(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(formatPhone(undefined)).toBe("");
  });

  it("returns raw input unchanged for whitespace-only string (no digits)", () => {
    expect(formatPhone("   ")).toBe("   ");
  });
});

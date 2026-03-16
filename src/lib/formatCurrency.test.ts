import { describe, it, expect } from "vitest";
import { formatCurrency } from "./formatCurrency";

describe("formatCurrency", () => {
  it("formats 199900 cents as $1,999.00", () => {
    expect(formatCurrency(199900)).toBe("$1,999.00");
  });

  it("formats 0 cents as $0.00", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats 99 cents as $0.99", () => {
    expect(formatCurrency(99)).toBe("$0.99");
  });

  it("formats 100000 cents as $1,000.00", () => {
    expect(formatCurrency(100000)).toBe("$1,000.00");
  });
});

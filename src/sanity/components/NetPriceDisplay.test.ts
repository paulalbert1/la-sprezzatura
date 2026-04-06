import { describe, it, expect } from "vitest";
import { formatNetPrice } from "./NetPriceDisplay";

describe("NetPriceDisplay", () => {
  describe("formatNetPrice", () => {
    it("computes positive net price in dollar format", () => {
      // 50000 - 30000 = 20000 cents = $200.00
      const result = formatNetPrice(50000, 30000);
      expect(result.text).toBe("Net: $200.00");
      expect(result.isEmpty).toBe(false);
    });

    it("computes negative net price with minus sign", () => {
      // 10000 - 15000 = -5000 cents = -$50.00
      const result = formatNetPrice(10000, 15000);
      expect(result.text).toBe("Net: -$50.00");
      expect(result.isEmpty).toBe(false);
    });

    it("returns empty state when both values are falsy", () => {
      const result = formatNetPrice(undefined, undefined);
      expect(result.isEmpty).toBe(true);
    });

    it("treats undefined clientCost as zero", () => {
      const result = formatNetPrice(10000, undefined);
      expect(result.text).toBe("Net: $100.00");
      expect(result.isEmpty).toBe(false);
    });

    it("treats undefined retailPrice as zero", () => {
      const result = formatNetPrice(undefined, 5000);
      expect(result.text).toBe("Net: -$50.00");
      expect(result.isEmpty).toBe(false);
    });

    it("formats zero net price correctly", () => {
      const result = formatNetPrice(5000, 5000);
      expect(result.text).toBe("Net: $0.00");
      expect(result.isEmpty).toBe(false);
    });
  });
});

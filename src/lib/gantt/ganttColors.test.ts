import { describe, it, expect } from "vitest";
import {
  CONTRACTOR_PALETTE,
  CATEGORY_COLORS,
  getContractorColor,
  getProcurementStatusColor,
} from "./ganttColors";

describe("CONTRACTOR_PALETTE", () => {
  it("has exactly 10 entries", () => {
    expect(CONTRACTOR_PALETTE).toHaveLength(10);
  });
});

describe("getContractorColor", () => {
  it("returns CONTRACTOR_PALETTE[0] for index 0", () => {
    expect(getContractorColor(0)).toBe("#3B82F6");
  });

  it("returns CONTRACTOR_PALETTE[3] for index 3", () => {
    expect(getContractorColor(3)).toBe("#F59E0B");
  });

  it("wraps to CONTRACTOR_PALETTE[0] for index 10 (modulo)", () => {
    expect(getContractorColor(10)).toBe("#3B82F6");
  });
});

describe("CATEGORY_COLORS", () => {
  it("has keys: contractors, procurement, milestones, events, completed", () => {
    expect(CATEGORY_COLORS).toHaveProperty("contractors");
    expect(CATEGORY_COLORS).toHaveProperty("procurement");
    expect(CATEGORY_COLORS).toHaveProperty("milestones");
    expect(CATEGORY_COLORS).toHaveProperty("events");
    expect(CATEGORY_COLORS).toHaveProperty("completed");
  });
});

describe("getProcurementStatusColor", () => {
  it("returns expected color for 'not-yet-ordered'", () => {
    const color = getProcurementStatusColor("not-yet-ordered");
    expect(color).toBeTruthy();
    expect(typeof color).toBe("string");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("returns gray-400 for 'installed'", () => {
    expect(getProcurementStatusColor("installed")).toBe("#9CA3AF");
  });
});

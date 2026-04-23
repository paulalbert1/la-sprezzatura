import { describe, it, expect } from "vitest";
import { businessDaysBetween, addBusinessDays } from "./businessDays";

describe("businessDaysBetween", () => {
  it("is zero for the same day", () => {
    const d = new Date("2026-04-20T12:00:00Z"); // Monday
    expect(businessDaysBetween(d, d)).toBe(0);
  });
  it("returns 1 for Friday → Monday", () => {
    const fri = new Date("2026-04-17T12:00:00Z"); // Friday
    const mon = new Date("2026-04-20T12:00:00Z"); // Monday
    expect(businessDaysBetween(fri, mon)).toBe(1);
  });
  it("returns 5 for Mon → Mon the following week", () => {
    const m1 = new Date("2026-04-13T12:00:00Z");
    const m2 = new Date("2026-04-20T12:00:00Z");
    expect(businessDaysBetween(m1, m2)).toBe(5);
  });
  it("clamps to 0 when later < earlier", () => {
    const fri = new Date("2026-04-17T12:00:00Z");
    const mon = new Date("2026-04-20T12:00:00Z");
    expect(businessDaysBetween(mon, fri)).toBe(0);
  });
  it("returns 0 for a pure weekend span", () => {
    const sat = new Date("2026-04-18T12:00:00Z");
    const sun = new Date("2026-04-19T12:00:00Z");
    expect(businessDaysBetween(sat, sun)).toBe(0);
  });
});

describe("addBusinessDays", () => {
  it("Friday + 1 biz day = Monday", () => {
    const fri = new Date("2026-04-17T12:00:00Z");
    const out = addBusinessDays(fri, 1);
    expect(out.getUTCDay()).toBe(1); // Monday
  });
});

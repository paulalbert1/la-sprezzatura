import { describe, it, expect } from "vitest";
import { getBadgeStyle } from "./UsageBadge";

// RNDR-05: UsageBadge three-tier threshold styling (admin luxury theme)
// Source of truth for thresholds: 33-UI-SPEC.md § Color "Usage badge thresholds"
describe("UsageBadge.getBadgeStyle", () => {
  it("returns healthy tier (gold-light) for 0% usage", () => {
    const style = getBadgeStyle(0, 50);
    expect(style.bg).toBe("#F5EDD8");
    expect(style.text).toBe("#9A7B4B");
    expect(style.border).toBe("#E8D5A8");
  });

  it("returns healthy tier for 20% usage (10/50)", () => {
    const style = getBadgeStyle(10, 50);
    expect(style.bg).toBe("#F5EDD8");
    expect(style.text).toBe("#9A7B4B");
  });

  it("returns healthy tier for 79% usage (edge of healthy band)", () => {
    const style = getBadgeStyle(79, 100);
    expect(style.bg).toBe("#F5EDD8");
    expect(style.text).toBe("#9A7B4B");
  });

  it("returns approaching-limit tier (amber-tinted) at exactly 80%", () => {
    const style = getBadgeStyle(80, 100);
    expect(style.bg).toBe("#FBF2E2");
    expect(style.text).toBe("#8A5E1A");
  });

  it("returns approaching-limit tier at 84% (42/50)", () => {
    const style = getBadgeStyle(42, 50);
    expect(style.bg).toBe("#FBF2E2");
    expect(style.text).toBe("#8A5E1A");
  });

  it("returns approaching-limit tier at 94% (edge of band)", () => {
    const style = getBadgeStyle(94, 100);
    expect(style.bg).toBe("#FBF2E2");
    expect(style.text).toBe("#8A5E1A");
  });

  it("returns at-limit tier (warm destructive) at exactly 95%", () => {
    const style = getBadgeStyle(95, 100);
    expect(style.bg).toBe("#FBEEE8");
    expect(style.text).toBe("#9B3A2A");
  });

  it("returns at-limit tier at 98% (49/50)", () => {
    const style = getBadgeStyle(49, 50);
    expect(style.bg).toBe("#FBEEE8");
    expect(style.text).toBe("#9B3A2A");
  });

  it("returns at-limit tier when count exceeds limit (over 100%)", () => {
    const style = getBadgeStyle(55, 50);
    expect(style.bg).toBe("#FBEEE8");
    expect(style.text).toBe("#9B3A2A");
  });

  it("returns healthy tier when limit is 0 (guard against divide-by-zero)", () => {
    const style = getBadgeStyle(0, 0);
    expect(style.bg).toBe("#F5EDD8");
    expect(style.text).toBe("#9A7B4B");
  });
});

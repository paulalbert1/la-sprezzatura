import { describe, it, expect } from "vitest";
import { formatTrade, TRADE_LABELS } from "./trades";

describe("TRADE_LABELS", () => {
  it("maps electrical-rough-in to sentence case with hyphen preserved", () => {
    expect(TRADE_LABELS["electrical-rough-in"]).toBe("Electrical rough-in");
  });

  it("maps hvac to uppercase acronym", () => {
    expect(TRADE_LABELS["hvac"]).toBe("HVAC");
  });

  it("maps general-contractor to sentence case with hyphen-as-space", () => {
    expect(TRADE_LABELS["general-contractor"]).toBe("General contractor");
  });

  it("maps painting to simple capitalized form", () => {
    expect(TRADE_LABELS["painting"]).toBe("Painting");
  });
});

describe("formatTrade", () => {
  it("returns the mapped label for known slug electrical-rough-in", () => {
    expect(formatTrade("electrical-rough-in")).toBe("Electrical rough-in");
  });

  it("returns Painting for painting", () => {
    expect(formatTrade("painting")).toBe("Painting");
  });

  it("returns HVAC (uppercase acronym) for hvac", () => {
    expect(formatTrade("hvac")).toBe("HVAC");
  });

  it("returns General contractor for general-contractor", () => {
    expect(formatTrade("general-contractor")).toBe("General contractor");
  });

  it("falls back to sentence case for unknown hyphenated slug foo-bar-baz", () => {
    expect(formatTrade("foo-bar-baz")).toBe("Foo bar baz");
  });

  it("normalizes upper-case underscore input FOO_BAR to Foo bar", () => {
    expect(formatTrade("FOO_BAR")).toBe("Foo bar");
  });

  it("returns empty string for empty input", () => {
    expect(formatTrade("")).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(formatTrade(undefined)).toBe("");
  });

  it("returns empty string for null input", () => {
    expect(formatTrade(null)).toBe("");
  });

  it("never returns all-caps output for unknown slugs", () => {
    expect(formatTrade("FOOBAR")).toBe("Foobar");
  });

  it("never returns raw slug with hyphens for unknown slugs (hyphens become spaces)", () => {
    const result = formatTrade("my-unknown-trade");
    expect(result).toBe("My unknown trade");
    expect(result).not.toContain("-");
  });

  it("covers legacy trade option electrician (present in EntityDetailForm TRADE_OPTIONS)", () => {
    expect(formatTrade("electrician")).toBe("Electrician");
  });

  it("covers legacy trade option plumber", () => {
    expect(formatTrade("plumber")).toBe("Plumber");
  });

  it("covers legacy trade option custom-millwork", () => {
    expect(formatTrade("custom-millwork")).toBe("Custom millwork");
  });

  it("covers legacy trade option tile-stone", () => {
    expect(formatTrade("tile-stone")).toBe("Tile & stone");
  });

  it("covers legacy trade option window-treatments", () => {
    expect(formatTrade("window-treatments")).toBe("Window treatments");
  });
});

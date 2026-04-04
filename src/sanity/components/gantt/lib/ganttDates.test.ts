import { describe, it, expect } from "vitest";
import {
  parseSanityDate,
  parseSanityDatetime,
  serializeSanityDate,
} from "./ganttDates";

describe("parseSanityDate", () => {
  it("parses YYYY-MM-DD as May 15 (not May 14) in any US timezone", () => {
    const result = parseSanityDate("2026-05-15");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getDate()).toBe(15);
    expect(result!.getMonth()).toBe(4); // 0-indexed: May = 4
    expect(result!.getFullYear()).toBe(2026);
  });

  it("returns null for null input", () => {
    expect(parseSanityDate(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseSanityDate(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseSanityDate("")).toBeNull();
  });
});

describe("serializeSanityDate", () => {
  it("serializes a Date to YYYY-MM-DD string", () => {
    const date = new Date(2026, 4, 15); // May 15, 2026
    expect(serializeSanityDate(date)).toBe("2026-05-15");
  });

  it("returns null for null input", () => {
    expect(serializeSanityDate(null)).toBeNull();
  });
});

describe("parseSanityDatetime", () => {
  it("parses a full ISO datetime string to a valid Date", () => {
    const result = parseSanityDatetime("2026-05-15T14:30:00.000Z");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).not.toBeNaN();
  });

  it("returns null for null input", () => {
    expect(parseSanityDatetime(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseSanityDatetime(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseSanityDatetime("")).toBeNull();
  });
});

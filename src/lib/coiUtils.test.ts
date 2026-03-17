import { describe, it, expect, vi, afterEach } from "vitest";
import { getExpirationStatus } from "./coiUtils";

describe("getExpirationStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'expired' for date before today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15"));
    expect(getExpirationStatus("2026-06-01")).toBe("expired");
  });

  it("returns 'expiring' for date within 30 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15"));
    expect(getExpirationStatus("2026-07-10")).toBe("expiring");
  });

  it("returns 'valid' for date more than 30 days out", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15"));
    expect(getExpirationStatus("2026-08-01")).toBe("valid");
  });

  it("returns 'valid' for null input", () => {
    expect(getExpirationStatus(null)).toBe("valid");
  });

  it("returns 'valid' for undefined input", () => {
    expect(getExpirationStatus(undefined)).toBe("valid");
  });
});

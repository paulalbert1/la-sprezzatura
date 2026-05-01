// src/lib/portal/tokenTtl.test.ts
// Phase 48 -- unit tests for TTL constants + formatExpiryCopy.
// Drift-guard integration test (D-07) lives in Plan 04, not here.

import { describe, it, expect } from "vitest";
import {
  MAGIC_LINK_ACCESS_TTL_SECONDS,
  WORK_ORDER_SEND_TTL_SECONDS,
  formatExpiryCopy,
} from "./tokenTtl";

describe("Phase 48 TTL constants", () => {
  it("MAGIC_LINK_ACCESS_TTL_SECONDS === 900", () => {
    expect(MAGIC_LINK_ACCESS_TTL_SECONDS).toBe(900);
  });

  it("WORK_ORDER_SEND_TTL_SECONDS === 604800", () => {
    expect(WORK_ORDER_SEND_TTL_SECONDS).toBe(604800);
  });
});

describe("formatExpiryCopy", () => {
  it("formats 900s as '15 minutes' (default access TTL)", () => {
    expect(formatExpiryCopy(900)).toBe("This link expires in 15 minutes.");
  });

  it("uses singular 'minute' for 60s", () => {
    expect(formatExpiryCopy(60)).toBe("This link expires in 1 minute.");
  });

  it("uses 'seconds' branch for sub-minute values", () => {
    expect(formatExpiryCopy(45)).toBe("This link expires in 45 seconds.");
  });

  it("uses singular 'hour' for 3600s", () => {
    expect(formatExpiryCopy(3600)).toBe("This link expires in 1 hour.");
  });

  it("uses plural 'hours' for 7200s", () => {
    expect(formatExpiryCopy(7200)).toBe("This link expires in 2 hours.");
  });

  it("uses singular 'day' for 86400s", () => {
    expect(formatExpiryCopy(86400)).toBe("This link expires in 1 day.");
  });

  it("uses plural 'days' for 604800s (7-day work-order TTL)", () => {
    expect(formatExpiryCopy(604800)).toBe("This link expires in 7 days.");
  });
});

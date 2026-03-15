import { describe, it, expect } from "vitest";
import { generatePortalToken } from "./generateToken";

describe("generatePortalToken", () => {
  it("returns an 8-character string by default", () => {
    const token = generatePortalToken();
    expect(token).toHaveLength(8);
  });

  it("returns only alphanumeric characters", () => {
    const token = generatePortalToken();
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("respects a custom length parameter", () => {
    const token = generatePortalToken(12);
    expect(token).toHaveLength(12);
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("produces unique tokens across 1000 calls", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      tokens.add(generatePortalToken());
    }
    expect(tokens.size).toBe(1000);
  });
});

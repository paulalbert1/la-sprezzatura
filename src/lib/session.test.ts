import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const sessionSource = readFileSync(
  resolve(__dirname, "./session.ts"),
  "utf-8",
);

describe("session module", () => {
  it("exports createSession function", () => {
    expect(sessionSource).toContain("export async function createSession");
  });

  it("exports getSession function", () => {
    expect(sessionSource).toContain("export async function getSession");
  });

  it("exports clearSession function", () => {
    expect(sessionSource).toContain("export function clearSession");
  });

  it("uses portal_session cookie name", () => {
    expect(sessionSource).toContain("portal_session");
  });

  it("sets 30-day maxAge (2592000 seconds)", () => {
    expect(sessionSource).toContain("2592000");
  });

  it("sets httpOnly to true", () => {
    expect(sessionSource).toContain("httpOnly: true");
  });

  it("sets sameSite to lax", () => {
    expect(sessionSource).toMatch(/sameSite.*lax/i);
  });
});

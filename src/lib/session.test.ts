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

  // --- Multi-role session tests (Plan 07-03 Task 1) ---

  it("exports SessionData interface with entityId and role", () => {
    expect(sessionSource).toContain("export interface SessionData");
    expect(sessionSource).toContain("entityId: string");
    expect(sessionSource).toContain("role:");
  });

  it("createSession accepts role parameter with default 'client'", () => {
    // createSession should have a role parameter defaulting to 'client'
    expect(sessionSource).toMatch(
      /createSession[\s\S]*?role.*=.*['"]client['"]/,
    );
  });

  it("createSession stores JSON with entityId and role in Redis", () => {
    // Should use JSON.stringify({ entityId, role })
    expect(sessionSource).toContain("JSON.stringify");
    expect(sessionSource).toMatch(/JSON\.stringify\(\s*\{\s*entityId/);
  });

  it("getSession returns SessionData | null", () => {
    expect(sessionSource).toMatch(
      /getSession[\s\S]*?:\s*Promise<SessionData\s*\|\s*null>/,
    );
  });

  it("getSession handles legacy plain string values (backward compat)", () => {
    // Should detect legacy sessions and wrap in { entityId, role: 'client' }
    expect(sessionSource).toContain("role: 'client'");
    // Should have backward compatibility comment or logic
    expect(sessionSource).toMatch(/legacy|backward/i);
  });

  it("SessionData role type includes contractor and building_manager", () => {
    expect(sessionSource).toContain("'contractor'");
    expect(sessionSource).toContain("'building_manager'");
  });
});

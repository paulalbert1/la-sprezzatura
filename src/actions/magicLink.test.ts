import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const actionsSource = readFileSync(
  resolve(__dirname, "./index.ts"),
  "utf-8",
);

describe("requestMagicLink action", () => {
  it("exports requestMagicLink in server object", () => {
    expect(actionsSource).toContain("requestMagicLink");
  });

  it("uses magicLinkRatelimit for rate limiting", () => {
    expect(actionsSource).toContain("magicLinkRatelimit");
  });

  it("looks up client by email", () => {
    expect(actionsSource).toContain("getClientByEmail");
  });

  it("stores token in Redis with magic: prefix", () => {
    expect(actionsSource).toMatch(/redis\.set\(`magic:/);
  });

  it("sends email from noreply@send.lasprezz.com", () => {
    expect(actionsSource).toContain("noreply@send.lasprezz.com");
  });

  it("sends email with correct subject line", () => {
    expect(actionsSource).toContain("Your La Sprezzatura Portal Access");
  });

  it("always returns success regardless of email existence", () => {
    // The handler should have a single return { success: true } at the end
    // and should NOT have a return inside an else/error block for "email not found"
    expect(actionsSource).toContain("return { success: true }");
    // Verify the pattern: if (client) { ...send... } then return success outside the if
    expect(actionsSource).not.toMatch(/else\s*\{[^}]*ActionError/);
  });

  it("email template contains Access Your Portal CTA", () => {
    expect(actionsSource).toContain("Access Your Portal");
  });

  it("email template mentions 15-minute expiry", () => {
    expect(actionsSource).toContain("15 minutes");
  });

  it("sets token TTL to 900 seconds (15 minutes)", () => {
    expect(actionsSource).toContain("ex: 900");
  });

  // ---- Admin email detection tests (Phase 25 Task 2) ----

  it("checks ADMIN_EMAIL environment variable for admin detection", () => {
    expect(actionsSource).toContain("ADMIN_EMAIL");
  });

  it("stores admin token with role 'admin' in Redis", () => {
    expect(actionsSource).toMatch(/role:\s*['"]admin['"]/);
  });

  it("sends admin-specific email with studio dashboard subject", () => {
    expect(actionsSource).toContain("Your La Sprezzatura Studio Access");
  });

  it("admin email CTA says Access Your Dashboard", () => {
    expect(actionsSource).toContain("Access Your Dashboard");
  });
});

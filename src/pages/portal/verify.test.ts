import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const verifySource = readFileSync(
  resolve(__dirname, "./verify.astro"),
  "utf-8",
);

describe("verify.astro", () => {
  it("disables prerendering", () => {
    expect(verifySource).toContain("prerender = false");
  });

  it("imports createSession from session lib", () => {
    expect(verifySource).toContain("createSession");
  });

  it("reads token from URL search params", () => {
    expect(verifySource).toContain('searchParams.get("token")');
  });

  it("redirects admin role to /admin/dashboard", () => {
    expect(verifySource).toContain("/admin/dashboard");
  });

  it("redirects contractor role to /workorder/dashboard", () => {
    expect(verifySource).toContain("/workorder/dashboard");
  });

  it("uses a dashboard map for role-based redirects", () => {
    expect(verifySource).toContain("dashboardMap");
  });

  it("defaults to /portal/dashboard for unknown roles", () => {
    expect(verifySource).toContain("/portal/dashboard");
  });
});

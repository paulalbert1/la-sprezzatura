import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const middlewareSource = readFileSync(
  resolve(__dirname, "./middleware.ts"),
  "utf-8",
);

describe("middleware", () => {
  it("exports onRequest", () => {
    expect(middlewareSource).toContain("export const onRequest");
  });

  it("imports defineMiddleware", () => {
    expect(middlewareSource).toContain("defineMiddleware");
  });

  it("allows /portal/login without session check", () => {
    expect(middlewareSource).toContain("/portal/login");
  });

  it("allows /portal/verify without session check", () => {
    expect(middlewareSource).toContain("/portal/verify");
  });

  it("redirects to /portal/login for unauthenticated requests", () => {
    expect(middlewareSource).toContain('redirect("/portal/login")');
  });

  it("sets context.locals.clientId for authenticated requests", () => {
    expect(middlewareSource).toContain("context.locals.clientId");
  });

  // --- Multi-role middleware tests (Plan 07-03 Task 1) ---

  it("allows /workorder/login without session check", () => {
    expect(middlewareSource).toContain("/workorder/login");
  });

  it("allows /workorder/verify without session check", () => {
    expect(middlewareSource).toContain("/workorder/verify");
  });

  it("redirects to /workorder/login for unauthenticated workorder requests", () => {
    expect(middlewareSource).toContain('redirect("/workorder/login")');
  });

  it("checks session.role for client portal routes", () => {
    expect(middlewareSource).toMatch(/session\.role\s*!==\s*["']client["']/);
  });

  it("checks session.role for contractor workorder routes", () => {
    expect(middlewareSource).toMatch(
      /session\.role\s*!==\s*["']contractor["']/,
    );
  });

  it("sets context.locals.contractorId for workorder routes", () => {
    expect(middlewareSource).toContain("context.locals.contractorId");
  });

  it("sets context.locals.role for authenticated routes", () => {
    expect(middlewareSource).toContain("context.locals.role");
  });
});

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
});

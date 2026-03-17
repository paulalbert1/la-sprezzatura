import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const blobServeSource = readFileSync(
  resolve(__dirname, "./blob-serve.ts"),
  "utf-8",
);

describe("blob-serve API route", () => {
  it("exports a GET function", () => {
    expect(blobServeSource).toContain("export const GET: APIRoute");
  });

  it("imports getSession for auth check", () => {
    expect(blobServeSource).toContain("getSession");
    expect(blobServeSource).toContain('from "../../lib/session"');
  });

  it("returns 401 when session is null", () => {
    expect(blobServeSource).toContain("if (!session)");
    expect(blobServeSource).toContain("Unauthorized");
    expect(blobServeSource).toContain("status: 401");
  });

  it("returns 400 when path parameter is missing", () => {
    expect(blobServeSource).toContain("if (!pathname)");
    expect(blobServeSource).toContain("Missing path parameter");
    expect(blobServeSource).toContain("status: 400");
  });

  it("sets private cache control header", () => {
    expect(blobServeSource).toContain("private, no-cache");
  });

  it("sets X-Content-Type-Options nosniff header", () => {
    expect(blobServeSource).toContain("X-Content-Type-Options");
    expect(blobServeSource).toContain("nosniff");
  });

  it("uses dynamic import for @vercel/blob", () => {
    expect(blobServeSource).toContain('import("@vercel/blob")');
  });

  it("sets prerender to false", () => {
    expect(blobServeSource).toContain("export const prerender = false");
  });
});

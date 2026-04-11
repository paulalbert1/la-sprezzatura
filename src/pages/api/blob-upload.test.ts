// src/pages/api/blob-upload.test.ts
// Phase 34 Plan 02 — T-34-02 backfill tests for /api/blob-upload
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md KR-3

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// vi.mock is hoisted above imports, so any referenced bindings must be
// declared via vi.hoisted() or inline inside the factory.
const { mockGetSession, mockPut, mockHandleUpload } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockPut: vi.fn(),
  mockHandleUpload: vi.fn(),
}));

vi.mock("../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@vercel/blob", () => ({
  put: mockPut,
}));

vi.mock("@vercel/blob/client", () => ({
  handleUpload: mockHandleUpload,
}));

// Route import must happen AFTER vi.mock calls above.
import { PUT, POST } from "./blob-upload";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeMultipart(file: File): Request {
  const fd = new FormData();
  fd.append("file", file);
  return new Request("http://localhost/api/blob-upload", {
    method: "PUT",
    body: fd,
  });
}

function makePostJson(body: unknown): Request {
  return new Request("http://localhost/api/blob-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// APIContext is richer than this subset but the route only touches request + cookies.
type RouteCtx = { request: Request; cookies: AstroCookies };
const callPut = (ctx: RouteCtx): Promise<Response> =>
  (PUT as unknown as (c: RouteCtx) => Promise<Response>)(ctx);
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

describe("blob-upload admin gate (Phase 34 Plan 02)", () => {
  it("PUT rejects unauthenticated request with 401 (T-34-02 backfill)", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const file = new File(["hello"], "test.png", { type: "image/png" });
    const res = await callPut({ request: makeMultipart(file), cookies: makeCookies() });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("PUT rejects non-admin session with 401", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "client-1", role: "client" });
    const file = new File(["hello"], "test.png", { type: "image/png" });
    const res = await callPut({ request: makeMultipart(file), cookies: makeCookies() });
    expect(res.status).toBe(401);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("POST (token issuance) rejects unauthenticated request with 401", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await callPost({
      request: makePostJson({ type: "blob.generate-client-token", payload: {} }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(mockHandleUpload).not.toHaveBeenCalled();
  });

  it("POST (token issuance) rejects non-admin session with 401", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "user-1", role: "contractor" });
    const res = await callPost({
      request: makePostJson({ type: "blob.generate-client-token", payload: {} }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
    expect(mockHandleUpload).not.toHaveBeenCalled();
  });

  it("PUT rejects MIME not in allowlist (pdf|jpeg|png|webp|heic|heif)", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "admin-1", role: "admin" });
    const file = new File(["x"], "evil.exe", { type: "application/x-msdownload" });
    const res = await callPut({ request: makeMultipart(file), cookies: makeCookies() });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("File type not allowed");
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("PUT with valid admin session returns { url, pathname } on success", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "admin-1", role: "admin" });
    mockPut.mockResolvedValueOnce({
      url: "https://blob.example.com/test-x.png",
      pathname: "test-x.png",
    });
    const file = new File(["hello"], "test.png", { type: "image/png" });
    const res = await callPut({ request: makeMultipart(file), cookies: makeCookies() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://blob.example.com/test-x.png");
    expect(body.pathname).toBe("test-x.png");
    expect(mockPut).toHaveBeenCalledWith(
      "test.png",
      file,
      { access: "public", addRandomSuffix: true },
    );
  });
});

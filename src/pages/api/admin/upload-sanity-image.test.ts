// src/pages/api/admin/upload-sanity-image.test.ts
// Phase 34 Plan 02 — tests for /api/admin/upload-sanity-image
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-09 revised (Path A); threat T-34-02

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// Hoist the mock fns so vi.mock factories can reference them cleanly.
const { mockGetSession, mockAssetsUpload } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockAssetsUpload: vi.fn(),
}));

vi.mock("../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    assets: {
      upload: mockAssetsUpload,
    },
  },
}));

import { POST } from "./upload-sanity-image";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeMultipart(file?: File): Request {
  const fd = new FormData();
  if (file) fd.append("file", file);
  return new Request("http://localhost/api/admin/upload-sanity-image", {
    method: "POST",
    body: fd,
  });
}

type RouteCtx = { request: Request; cookies: AstroCookies };
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/upload-sanity-image (Phase 34 Plan 02)", () => {
  it("POST rejects unauthenticated request with 401 (T-34-02)", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const file = new File(["x"], "hero.jpg", { type: "image/jpeg" });
    const res = await callPost({ request: makeMultipart(file), cookies: makeCookies() });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(mockAssetsUpload).not.toHaveBeenCalled();
  });

  it("POST rejects non-admin session with 401", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "c-1", role: "client" });
    const file = new File(["x"], "hero.jpg", { type: "image/jpeg" });
    const res = await callPost({ request: makeMultipart(file), cookies: makeCookies() });
    expect(res.status).toBe(401);
    expect(mockAssetsUpload).not.toHaveBeenCalled();
  });

  it("POST rejects MIME not in image/jpeg|png|webp|heic|heif allowlist", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "admin-1", role: "admin" });
    const file = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    const res = await callPost({ request: makeMultipart(file), cookies: makeCookies() });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Unsupported MIME");
    expect(mockAssetsUpload).not.toHaveBeenCalled();
  });

  it("POST calls sanityWriteClient.assets.upload('image', file, { filename, contentType })", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "admin-1", role: "admin" });
    mockAssetsUpload.mockResolvedValueOnce({
      _id: "image-abc-800x600-jpg",
      url: "https://cdn.sanity.io/images/proj/prod/image-abc-800x600.jpg",
    });
    const file = new File(["\xFF\xD8"], "hero.jpg", { type: "image/jpeg" });
    await callPost({ request: makeMultipart(file), cookies: makeCookies() });
    expect(mockAssetsUpload).toHaveBeenCalledTimes(1);
    const [type, passedFile, opts] = mockAssetsUpload.mock.calls[0];
    expect(type).toBe("image");
    // request.formData() re-materializes File instances, so identity check
    // isn't valid; compare the observable properties instead.
    expect(passedFile).toBeInstanceOf(File);
    expect((passedFile as File).name).toBe("hero.jpg");
    expect((passedFile as File).type).toBe("image/jpeg");
    expect(opts).toEqual({ filename: "hero.jpg", contentType: "image/jpeg" });
  });

  it("POST returns the full asset document with _id and url fields", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "admin-1", role: "admin" });
    mockAssetsUpload.mockResolvedValueOnce({
      _id: "image-abc-800x600-jpg",
      url: "https://cdn.sanity.io/images/proj/prod/image-abc-800x600.jpg",
      originalFilename: "hero.jpg",
      metadata: { dimensions: { width: 800, height: 600 } },
    });
    const file = new File(["\xFF\xD8"], "hero.jpg", { type: "image/jpeg" });
    const res = await callPost({ request: makeMultipart(file), cookies: makeCookies() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.asset._id).toBe("image-abc-800x600-jpg");
    expect(body.asset.url).toContain("cdn.sanity.io");
  });

  it("POST returns 400 when no file field in multipart body", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "admin-1", role: "admin" });
    const res = await callPost({ request: makeMultipart(undefined), cookies: makeCookies() });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No file field in request");
    expect(mockAssetsUpload).not.toHaveBeenCalled();
  });
});

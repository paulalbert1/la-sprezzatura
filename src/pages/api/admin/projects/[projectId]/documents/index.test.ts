// Phase 39 Plan 01 Task 3 — POST /api/admin/projects/:projectId/documents tests.
// Mirrors hoisted-mock + chain-aware builder pattern from send-update.test.ts.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const {
  mockGetSession,
  mockAssetsUpload,
  mockPatch,
  mockCommit,
  mockSetIfMissing,
  mockAppend,
} = vi.hoisted(() => {
  const commit = vi.fn().mockResolvedValue({});
  const builder: Record<string, unknown> = {};
  const setIfMissing = vi.fn().mockImplementation(() => builder);
  const append = vi.fn().mockImplementation(() => builder);
  builder.setIfMissing = setIfMissing;
  builder.append = append;
  builder.commit = commit;
  const patch = vi.fn().mockReturnValue(builder);

  return {
    mockGetSession: vi.fn(),
    mockAssetsUpload: vi.fn(),
    mockPatch: patch,
    mockCommit: commit,
    mockSetIfMissing: setIfMissing,
    mockAppend: append,
  };
});

vi.mock("../../../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({
    assets: { upload: mockAssetsUpload },
    patch: mockPatch,
  }),
}));

// Import route AFTER mocks.
import { POST } from "./index";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeFormRequest(formData: FormData): Request {
  return new Request(
    "http://localhost/api/admin/projects/proj-1/documents",
    { method: "POST", body: formData },
  );
}

type RouteCtx = { request: Request; cookies: AstroCookies };
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

function adminSession() {
  mockGetSession.mockResolvedValue({
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
  });
}

function buildForm({
  file,
  projectId = "proj-1",
  category = "Contracts",
  label,
}: {
  file?: File | null;
  projectId?: string;
  category?: string;
  label?: string;
} = {}): FormData {
  const form = new FormData();
  if (file) form.set("file", file);
  form.set("projectId", projectId);
  form.set("category", category);
  if (label !== undefined) form.set("label", label);
  return form;
}

function makePdf(sizeBytes: number, name = "doc.pdf"): File {
  return new File([new Uint8Array(sizeBytes)], name, {
    type: "application/pdf",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  const builder: Record<string, unknown> = {};
  builder.setIfMissing = mockSetIfMissing;
  builder.append = mockAppend;
  builder.commit = mockCommit;
  mockSetIfMissing.mockImplementation(() => builder);
  mockAppend.mockImplementation(() => builder);
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue(builder);

  mockAssetsUpload.mockResolvedValue({
    _id: "file-abc-123",
    url: "https://cdn.sanity.io/files/abc/dataset/file-abc-123.pdf",
  });
});

describe("POST /api/admin/projects/:projectId/documents (Phase 39 Plan 01)", () => {
  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await callPost({
      request: makeFormRequest(buildForm({ file: makePdf(100) })),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when admin session has no tenantId", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "admin",
      role: "admin",
    });
    const res = await callPost({
      request: makeFormRequest(buildForm({ file: makePdf(100) })),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when file is missing", async () => {
    adminSession();
    const res = await callPost({
      request: makeFormRequest(buildForm({ file: null })),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when file.type is not in the MIME allowlist", async () => {
    adminSession();
    const badFile = new File(["hi"], "notes.txt", { type: "text/plain" });
    const res = await callPost({
      request: makeFormRequest(buildForm({ file: badFile })),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);

    adminSession();
    const zipFile = new File([new Uint8Array(5)], "pack.zip", {
      type: "application/zip",
    });
    const res2 = await callPost({
      request: makeFormRequest(buildForm({ file: zipFile })),
      cookies: makeCookies(),
    });
    expect(res2.status).toBe(400);
  });

  it("returns 400 when file.size > 25MB", async () => {
    adminSession();
    const oversize = makePdf(26 * 1024 * 1024);
    const res = await callPost({
      request: makeFormRequest(buildForm({ file: oversize })),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/too large/i);
  });

  it("returns 400 when category is not in the enum", async () => {
    adminSession();
    const res = await callPost({
      request: makeFormRequest(
        buildForm({ file: makePdf(100), category: "Other" }),
      ),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
  });

  it("on success uploads asset, appends projectDocuments[] with _key, and returns {success, docKey, assetUrl}", async () => {
    adminSession();
    const res = await callPost({
      request: makeFormRequest(
        buildForm({
          file: makePdf(1024, "contract.pdf"),
          projectId: "proj-xyz",
          category: "Contracts",
          label: "Phase 1 contract",
        }),
      ),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);

    // assets.upload called correctly
    expect(mockAssetsUpload).toHaveBeenCalledTimes(1);
    const [kind, buf, opts] = mockAssetsUpload.mock.calls[0];
    expect(kind).toBe("file");
    expect(buf).toBeInstanceOf(Buffer);
    expect(opts).toMatchObject({
      filename: "contract.pdf",
      contentType: "application/pdf",
    });

    // patch chain invoked
    expect(mockPatch).toHaveBeenCalledWith("proj-xyz");
    expect(mockSetIfMissing).toHaveBeenCalledWith({ projectDocuments: [] });
    expect(mockAppend).toHaveBeenCalledTimes(1);
    const [path, entries] = mockAppend.mock.calls[0];
    expect(path).toBe("projectDocuments");
    expect(Array.isArray(entries)).toBe(true);
    const entry = (entries as Record<string, unknown>[])[0];
    expect(entry._type).toBe("projectDocument");
    expect(typeof entry._key).toBe("string");
    expect((entry._key as string).length).toBe(8);
    expect(entry.category).toBe("Contracts");
    expect(entry.label).toBe("Phase 1 contract");
    expect(entry.file).toEqual({
      _type: "file",
      asset: { _type: "reference", _ref: "file-abc-123" },
    });

    // commit with autoGenerateArrayKeys: false
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith({ autoGenerateArrayKeys: false });

    const body = (await res.json()) as {
      success: boolean;
      docKey: string;
      assetUrl: string;
    };
    expect(body.success).toBe(true);
    expect(typeof body.docKey).toBe("string");
    expect(body.docKey.length).toBe(8);
    expect(body.assetUrl).toBe(
      "https://cdn.sanity.io/files/abc/dataset/file-abc-123.pdf",
    );
  });

  it("defaults label to filename when label not provided", async () => {
    adminSession();
    const res = await callPost({
      request: makeFormRequest(
        buildForm({
          file: makePdf(128, "drawing.pdf"),
          category: "Drawings",
        }),
      ),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const entry = (mockAppend.mock.calls[0][1] as Record<string, unknown>[])[0];
    expect(entry.label).toBe("drawing.pdf");
  });

  it("accepts image/jpeg and image/png as well as application/pdf", async () => {
    adminSession();
    const jpg = new File([new Uint8Array(50)], "photo.jpg", {
      type: "image/jpeg",
    });
    let res = await callPost({
      request: makeFormRequest(buildForm({ file: jpg, category: "Selections" })),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);

    adminSession();
    const png = new File([new Uint8Array(50)], "plan.png", {
      type: "image/png",
    });
    res = await callPost({
      request: makeFormRequest(
        buildForm({ file: png, category: "Presentations" }),
      ),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
  });
});

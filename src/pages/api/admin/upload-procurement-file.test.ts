import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
vi.mock("../../../lib/session", () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock("../../../lib/generateToken", () => ({
  generatePortalToken: () => "filekey1",
}));

const mockCommit = vi.fn(() => Promise.resolve());
const mockAppend = vi.fn(() => ({ commit: mockCommit }));
const mockSetIfMissing = vi.fn(() => ({ append: mockAppend }));
const mockUnset = vi.fn(() => ({ commit: mockCommit }));
const mockPatch = vi.fn(() => ({
  setIfMissing: mockSetIfMissing,
  unset: mockUnset,
}));

vi.mock("../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

const mockPut = vi.fn(() =>
  Promise.resolve({
    url: "https://blob.vercel-storage.com/test-abc123.pdf",
    pathname: "test-abc123.pdf",
  }),
);
const mockDel = vi.fn(() => Promise.resolve());

vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockPut(...args),
  del: (...args: unknown[]) => mockDel(...args),
}));

import { POST, DELETE } from "./upload-procurement-file";

function makeCookies() {
  return {} as any;
}

function makeUploadRequest(
  file: File | null,
  projectId?: string,
  itemKey?: string,
): Request {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (projectId) formData.append("projectId", projectId);
  if (itemKey) formData.append("itemKey", itemKey);

  return new Request("http://localhost/api/admin/upload-procurement-file", {
    method: "POST",
    body: formData,
  });
}

function makeDeleteRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/upload-procurement-file", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/upload-procurement-file", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is null", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST({
      request: makeUploadRequest(null),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when no file is provided", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeUploadRequest(null, "p1", "k1"),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No valid file provided");
  });

  it("returns 400 for disallowed file type", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const txtFile = new File(["hello"], "test.txt", { type: "text/plain" });
    const res = await POST({
      request: makeUploadRequest(txtFile, "p1", "k1"),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("File type not allowed");
  });

  it("returns 200 for valid PDF upload and links to Sanity", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    mockCommit.mockResolvedValueOnce({});

    const pdfFile = new File(["pdf-content"], "invoice.pdf", {
      type: "application/pdf",
    });
    const res = await POST({
      request: makeUploadRequest(pdfFile, "project-123", "item-abc"),
      cookies: makeCookies(),
    } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://blob.vercel-storage.com/test-abc123.pdf");
    expect(body.pathname).toBe("test-abc123.pdf");
    expect(body.fileKey).toBe("filekey1");

    // Verify Vercel Blob upload
    expect(mockPut).toHaveBeenCalledWith("invoice.pdf", expect.any(File), {
      access: "public",
      addRandomSuffix: true,
    });

    // Verify Sanity link
    expect(mockPatch).toHaveBeenCalledWith("project-123");
    expect(mockSetIfMissing).toHaveBeenCalledWith({
      'procurementItems[_key=="item-abc"].files': [],
    });
    expect(mockAppend).toHaveBeenCalledWith(
      'procurementItems[_key=="item-abc"].files',
      [
        {
          _key: "filekey1",
          label: "",
          file: "https://blob.vercel-storage.com/test-abc123.pdf",
        },
      ],
    );
    expect(mockCommit).toHaveBeenCalled();
  });

  it("returns 200 for valid image upload", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    mockCommit.mockResolvedValueOnce({});

    const imgFile = new File(["img-data"], "photo.png", {
      type: "image/png",
    });
    const res = await POST({
      request: makeUploadRequest(imgFile, "p1", "k1"),
      cookies: makeCookies(),
    } as any);

    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/admin/upload-procurement-file", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is null", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await DELETE({
      request: makeDeleteRequest({}),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 and deletes blob then Sanity reference", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    mockCommit.mockResolvedValueOnce({});

    const res = await DELETE({
      request: makeDeleteRequest({
        projectId: "project-123",
        itemKey: "item-abc",
        fileKey: "file-xyz",
        blobUrl: "https://blob.vercel-storage.com/test-abc123.pdf",
      }),
      cookies: makeCookies(),
    } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify blob deleted FIRST
    expect(mockDel).toHaveBeenCalledWith(
      "https://blob.vercel-storage.com/test-abc123.pdf",
    );

    // Verify Sanity unset SECOND
    expect(mockPatch).toHaveBeenCalledWith("project-123");
    expect(mockUnset).toHaveBeenCalledWith([
      'procurementItems[_key=="item-abc"].files[_key=="file-xyz"]',
    ]);
    expect(mockCommit).toHaveBeenCalled();

    // Verify order: del called before patch
    const delCallOrder = mockDel.mock.invocationCallOrder[0];
    const patchCallOrder = mockPatch.mock.invocationCallOrder[0];
    expect(delCallOrder).toBeLessThan(patchCallOrder);
  });
});

import { describe, it, expect, vi } from "vitest";

const mockGetSession = vi.fn();
vi.mock("../../../lib/session", () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

const mockCommit = vi.fn(() => Promise.resolve());
const mockSet = vi.fn(() => ({ commit: mockCommit }));
const mockPatch = vi.fn(() => ({ set: mockSet }));

vi.mock("../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

import { POST } from "./update-procurement-status";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/update-procurement-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeCookies() {
  return {} as any;
}

describe("POST /api/admin/update-procurement-status", () => {
  it("returns 401 when session is null", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST({
      request: makeRequest({}),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session.role is client", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "c1", role: "client" });
    const res = await POST({
      request: makeRequest({}),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid JSON body", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const badRequest = new Request(
      "http://localhost/api/admin/update-procurement-status",
      { method: "POST", body: "not json" },
    );
    const res = await POST({
      request: badRequest,
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON");
  });

  it("returns 400 when projectId is missing", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({ itemKey: "k1", status: "ordered" }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 when itemKey is missing", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({ projectId: "p1", status: "ordered" }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 when status is missing", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({ projectId: "p1", itemKey: "k1" }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 for invalid status value", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({ projectId: "p1", itemKey: "k1", status: "bogus" }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid status");
  });

  it("returns 200 and patches Sanity for valid request", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    mockCommit.mockResolvedValueOnce({});

    const res = await POST({
      request: makeRequest({
        projectId: "project-123",
        itemKey: "item-abc",
        status: "ordered",
      }),
      cookies: makeCookies(),
    } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockPatch).toHaveBeenCalledWith("project-123");
    expect(mockSet).toHaveBeenCalledWith({
      'procurementItems[_key=="item-abc"].status': "ordered",
    });
    expect(mockCommit).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi } from "vitest";

const mockGetSession = vi.fn();
vi.mock("../../../lib/session", () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock("../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    patch: vi.fn(() => ({
      set: vi.fn(() => ({
        commit: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

import { POST } from "./update-project";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/update-project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeCookies() {
  return {} as any;
}

describe("POST /api/admin/update-project", () => {
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

  it("returns 401 when session.role is not admin", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "c1", role: "client" });
    const res = await POST({
      request: makeRequest({}),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON body", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const badRequest = new Request("http://localhost/api/admin/update-project", {
      method: "POST",
      body: "not json",
    });
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
      request: makeRequest({ title: "Test" }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 when title is missing", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({ projectId: "p1" }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });
});

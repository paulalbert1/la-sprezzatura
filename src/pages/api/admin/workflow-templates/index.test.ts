import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const { mockGetSession, mockCreate, mockFetch } = vi.hoisted(() => ({
  mockGetSession: vi.fn(), mockCreate: vi.fn(), mockFetch: vi.fn(),
}));
vi.mock("../../../../lib/session", () => ({ getSession: mockGetSession }));
vi.mock("../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({ create: mockCreate, fetch: mockFetch }),
}));

import { POST, GET } from "./index";

function makeCookies(): AstroCookies { return {} as AstroCookies; }
function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/workflow-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
function adminSession() {
  mockGetSession.mockResolvedValue({ entityId: "paul@lasprezz.com", role: "admin", tenantId: "la-sprezzatura" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({ _id: "wt-abc", name: "Test", version: 1, phases: [], defaults: {}, createdAt: "t", updatedAt: "t" });
  mockFetch.mockResolvedValue([]);
});

describe("POST /api/admin/workflow-templates", () => {
  it("401 without admin session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST({ request: postRequest({ name: "x" }), cookies: makeCookies() } as never);
    expect(res.status).toBe(401);
  });
  it("403 with admin but no tenantId", async () => {
    mockGetSession.mockResolvedValue({ role: "admin" });
    const res = await POST({ request: postRequest({ name: "x" }), cookies: makeCookies() } as never);
    expect(res.status).toBe(403);
  });
  it("400 when name is missing", async () => {
    adminSession();
    const res = await POST({ request: postRequest({}), cookies: makeCookies() } as never);
    expect(res.status).toBe(400);
  });
  it("400 when name is blank string", async () => {
    adminSession();
    const res = await POST({ request: postRequest({ name: "   " }), cookies: makeCookies() } as never);
    expect(res.status).toBe(400);
  });
  it("400 when body is invalid JSON", async () => {
    adminSession();
    const req = new Request("http://localhost/api/admin/workflow-templates", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "not-json",
    });
    const res = await POST({ request: req, cookies: makeCookies() } as never);
    expect(res.status).toBe(400);
  });
  it("200 on success with trimmed name and version=1", async () => {
    adminSession();
    const res = await POST({ request: postRequest({ name: "  New template  " }), cookies: makeCookies() } as never);
    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      _type: "workflowTemplate", name: "New template", version: 1,
    }));
  });
  it("500 when Sanity throws", async () => {
    adminSession();
    mockCreate.mockRejectedValueOnce(new Error("boom"));
    const res = await POST({ request: postRequest({ name: "x" }), cookies: makeCookies() } as never);
    expect(res.status).toBe(500);
  });
});

describe("GET /api/admin/workflow-templates", () => {
  it("401 without admin session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET({ cookies: makeCookies() } as never);
    expect(res.status).toBe(401);
  });
  it("200 returns templates array", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce([{ _id: "wt-1", name: "Alpha", version: 2, phases: [], defaults: {}, inUseCount: 3 }]);
    const res = await GET({ cookies: makeCookies() } as never);
    expect(res.status).toBe(200);
    const data = await res.json() as { templates: unknown[] };
    expect(data.templates).toEqual(expect.arrayContaining([expect.objectContaining({ _id: "wt-1", inUseCount: 3 })]));
  });
});

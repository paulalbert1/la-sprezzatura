import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const { mockGetSession, mockFetch, mockPatch, mockSet, mockCommit, mockDelete } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFetch: vi.fn(),
  mockPatch: vi.fn(),
  mockSet: vi.fn(),
  mockCommit: vi.fn(),
  mockDelete: vi.fn(),
}));
vi.mock("../../../../lib/session", () => ({ getSession: mockGetSession }));
vi.mock("../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({
    fetch: mockFetch,
    patch: (_id: string) => { mockPatch(_id); return { set: (u: unknown) => { mockSet(u); return { commit: mockCommit }; } }; },
    delete: mockDelete,
  }),
}));

import { GET, PATCH, DELETE } from "./[id]";

function makeCookies(): AstroCookies { return {} as AstroCookies; }
function adminSession() { mockGetSession.mockResolvedValue({ role: "admin", tenantId: "t" }); }
function patchRequest(body: unknown) {
  return new Request("http://localhost/api/admin/workflow-templates/wt-1", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

beforeEach(() => { vi.clearAllMocks(); mockCommit.mockResolvedValue({}); mockDelete.mockResolvedValue({}); });

describe("GET /[id]", () => {
  it("401 without admin session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET({ params: { id: "wt-x" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(401);
  });
  it("404 when template not found", async () => {
    adminSession(); mockFetch.mockResolvedValueOnce(null);
    const res = await GET({ params: { id: "wt-x" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(404);
  });
  it("200 with template when found", async () => {
    adminSession(); mockFetch.mockResolvedValueOnce({ _id: "wt-1", name: "A", version: 2 });
    const res = await GET({ params: { id: "wt-1" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(200);
    const data = await res.json() as { template: { _id: string } };
    expect(data.template._id).toBe("wt-1");
  });
});

describe("PATCH /[id]", () => {
  it("401 without admin session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await PATCH({ params: { id: "wt-1" }, request: patchRequest({ name: "X" }), cookies: makeCookies() } as never);
    expect(res.status).toBe(401);
  });
  it("auto-increments version on save", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce({ version: 3 });
    mockFetch.mockResolvedValueOnce({ _id: "wt-1", version: 4, name: "X" });
    await PATCH({ params: { id: "wt-1" }, request: patchRequest({ name: "X" }), cookies: makeCookies() } as never);
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ version: 4 }));
  });
  it("400 when name is blank string", async () => {
    adminSession();
    const res = await PATCH({ params: { id: "wt-1" }, request: patchRequest({ name: "   " }), cookies: makeCookies() } as never);
    expect(res.status).toBe(400);
  });
  it("400 when phases is not an array", async () => {
    adminSession();
    const res = await PATCH({ params: { id: "wt-1" }, request: patchRequest({ phases: "oops" }), cookies: makeCookies() } as never);
    expect(res.status).toBe(400);
  });
  it("404 when template not found during PATCH", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(null);
    const res = await PATCH({ params: { id: "wt-x" }, request: patchRequest({ name: "X" }), cookies: makeCookies() } as never);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /[id]", () => {
  it("401 without admin session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await DELETE({ params: { id: "wt-1" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(401);
  });
  it("409 when template is in use", async () => {
    adminSession(); mockFetch.mockResolvedValueOnce(2);
    const res = await DELETE({ params: { id: "wt-1" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(409);
    const data = await res.json() as { inUseCount: number };
    expect(data.inUseCount).toBe(2);
    expect(mockDelete).not.toHaveBeenCalled();
  });
  it("200 when unused", async () => {
    adminSession(); mockFetch.mockResolvedValueOnce(0);
    const res = await DELETE({ params: { id: "wt-1" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith("wt-1");
  });
});

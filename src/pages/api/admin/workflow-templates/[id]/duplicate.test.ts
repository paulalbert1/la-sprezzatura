import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const { mockGetSession, mockFetch, mockCreate } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFetch: vi.fn(),
  mockCreate: vi.fn(),
}));
vi.mock("../../../../../lib/session", () => ({ getSession: mockGetSession }));
vi.mock("../../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({ fetch: mockFetch, create: mockCreate }),
}));

import { POST } from "./duplicate";

function makeCookies(): AstroCookies { return {} as AstroCookies; }
function adminSession() { mockGetSession.mockResolvedValue({ role: "admin", tenantId: "t" }); }

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({ _id: "wt-copy", name: "Alpha (copy)", version: 1, phases: [], defaults: {} });
});

describe("POST /[id]/duplicate", () => {
  it("401 without admin session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST({ params: { id: "wt-1" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(401);
  });

  it("403 with admin but no tenantId", async () => {
    mockGetSession.mockResolvedValue({ role: "admin" });
    const res = await POST({ params: { id: "wt-1" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(403);
  });

  it("404 when source template not found", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(null);
    const res = await POST({ params: { id: "wt-x" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(404);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("200 with name suffixed as (copy)", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce({ _id: "wt-1", name: "Alpha", version: 3, phases: [], defaults: { clientApprovalDays: 10, dormancyDays: 60, revisionRounds: 1 } });
    const res = await POST({ params: { id: "wt-1" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      _type: "workflowTemplate",
      name: "Alpha (copy)",
      version: 1,
    }));
  });

  it("regenerates _key values in phases array", async () => {
    adminSession();
    const originalKey = "old-key-abc";
    mockFetch.mockResolvedValueOnce({
      _id: "wt-1",
      name: "Beta",
      version: 2,
      phases: [{ _key: originalKey, id: "phase-1", name: "Phase One", milestones: [] }],
      defaults: { clientApprovalDays: 10, dormancyDays: 60, revisionRounds: 1 },
    });
    mockCreate.mockResolvedValue({ _id: "wt-copy-2", name: "Beta (copy)", version: 1 });
    await POST({ params: { id: "wt-1" }, cookies: makeCookies() } as never);
    const createArg = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    const phases = createArg.phases as Array<{ _key: string }>;
    expect(phases[0]._key).not.toBe(originalKey);
  });

  it("500 when Sanity throws on create", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce({ _id: "wt-1", name: "Gamma", version: 1, phases: [], defaults: {} });
    mockCreate.mockRejectedValueOnce(new Error("sanity down"));
    const res = await POST({ params: { id: "wt-1" }, cookies: makeCookies() } as never);
    expect(res.status).toBe(500);
  });
});

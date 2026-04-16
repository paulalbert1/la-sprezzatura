// Phase 39 Plan 01 Task 3 — DELETE /api/admin/projects/:projectId/documents/:docKey tests.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const { mockGetSession, mockPatch, mockUnset, mockCommit } = vi.hoisted(() => {
  const commit = vi.fn().mockResolvedValue({});
  const builder: Record<string, unknown> = {};
  const unset = vi.fn().mockImplementation(() => builder);
  builder.unset = unset;
  builder.commit = commit;
  const patch = vi.fn().mockReturnValue(builder);

  return {
    mockGetSession: vi.fn(),
    mockPatch: patch,
    mockUnset: unset,
    mockCommit: commit,
  };
});

vi.mock("../../../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({
    patch: mockPatch,
  }),
}));

import { DELETE } from "./[docKey]";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

type RouteCtx = {
  params: { projectId?: string; docKey?: string };
  cookies: AstroCookies;
};
const callDelete = (ctx: RouteCtx): Promise<Response> =>
  (DELETE as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

function adminSession() {
  mockGetSession.mockResolvedValue({
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  const builder: Record<string, unknown> = {};
  builder.unset = mockUnset;
  builder.commit = mockCommit;
  mockUnset.mockImplementation(() => builder);
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue(builder);
});

describe("DELETE /api/admin/projects/:projectId/documents/:docKey (Phase 39 Plan 01)", () => {
  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await callDelete({
      params: { projectId: "p", docKey: "k" },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when admin session has no tenantId", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "admin",
      role: "admin",
    });
    const res = await callDelete({
      params: { projectId: "p", docKey: "k" },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(403);
  });

  it("calls client.patch(projectId).unset([projectDocuments[_key==KEY]]) and returns {success:true}", async () => {
    adminSession();
    const res = await callDelete({
      params: { projectId: "proj-xyz", docKey: "abcd1234" },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);

    expect(mockPatch).toHaveBeenCalledWith("proj-xyz");
    expect(mockUnset).toHaveBeenCalledTimes(1);
    const [selectors] = mockUnset.mock.calls[0];
    expect(Array.isArray(selectors)).toBe(true);
    expect((selectors as string[])[0]).toBe(
      'projectDocuments[_key=="abcd1234"]',
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);

    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });
});

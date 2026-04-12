// src/pages/api/admin/clients.test.ts
// Phase 34 Plan 05 — tests for /api/admin/clients regenerate-portal-token action.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-22

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// vi.mock factories are hoisted above imports. Any bindings they reference
// must be declared via vi.hoisted() so they exist at hoist time.
const {
  mockGetSession,
  mockCommit,
  mockSet,
  mockSetIfMissing,
  mockAppend,
  mockFetch,
  mockCreate,
  mockDelete,
  mockPatch,
  mockGeneratePortalToken,
} = vi.hoisted(() => {
  const commit = vi.fn().mockResolvedValue({});
  const set = vi.fn().mockReturnThis();
  const setIfMissing = vi.fn().mockReturnThis();
  const append = vi.fn().mockReturnThis();
  const fetch = vi.fn();
  const create = vi.fn().mockResolvedValue({ _id: "c-created" });
  const del = vi.fn().mockResolvedValue({});
  const patch = vi.fn().mockReturnValue({
    set,
    setIfMissing,
    append,
    commit,
  });
  return {
    mockGetSession: vi.fn(),
    mockCommit: commit,
    mockSet: set,
    mockSetIfMissing: setIfMissing,
    mockAppend: append,
    mockFetch: fetch,
    mockCreate: create,
    mockDelete: del,
    mockPatch: patch,
    mockGeneratePortalToken: vi.fn().mockReturnValue("ABCD1234"),
  };
});

vi.mock("../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../lib/tenantClient", () => ({
  getTenantClient: vi.fn().mockReturnValue({
    patch: mockPatch,
    fetch: mockFetch,
    create: mockCreate,
    delete: mockDelete,
  }),
}));

vi.mock("../../../lib/generateToken", () => ({
  generatePortalToken: mockGeneratePortalToken,
}));

// Import POST AFTER vi.mock hoisted calls above.
import { POST } from "./clients";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/admin/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

beforeEach(() => {
  vi.clearAllMocks();
  mockSet.mockReturnThis();
  mockSetIfMissing.mockReturnThis();
  mockAppend.mockReturnThis();
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue({
    set: mockSet,
    setIfMissing: mockSetIfMissing,
    append: mockAppend,
    commit: mockCommit,
  });
  mockGeneratePortalToken.mockReturnValue("ABCD1234");
});

describe("regenerate-portal-token action (Phase 34 Plan 05)", () => {
  it("POST action='regenerate-portal-token' rejects non-admin session with 401", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "c-1",
      role: "client",
      tenantId: "la-sprezzatura",
    });

    const res = await callPost({
      request: makeRequest({
        action: "regenerate-portal-token",
        clientId: "c-1",
      }),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(401);
    expect(mockPatch).not.toHaveBeenCalled();
    expect(mockGeneratePortalToken).not.toHaveBeenCalled();
  });

  it("POST action='regenerate-portal-token' rejects missing clientId with 400", async () => {
    adminSession();

    const res = await callPost({
      request: makeRequest({ action: "regenerate-portal-token" }),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/clientId/i);
    expect(mockPatch).not.toHaveBeenCalled();
    expect(mockGeneratePortalToken).not.toHaveBeenCalled();
  });

  it("POST action='regenerate-portal-token' generates a new 8-char token via generatePortalToken(8)", async () => {
    adminSession();

    const res = await callPost({
      request: makeRequest({
        action: "regenerate-portal-token",
        clientId: "client-xyz",
      }),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(200);
    expect(mockGeneratePortalToken).toHaveBeenCalledTimes(1);
    expect(mockGeneratePortalToken).toHaveBeenCalledWith(8);
    // The returned token must be exactly 8 characters (contract per D-22).
    const returned = mockGeneratePortalToken.mock.results[0].value as string;
    expect(returned).toHaveLength(8);
  });

  it("POST action='regenerate-portal-token' calls patch(clientId).set({ portalToken: newToken }).commit()", async () => {
    adminSession();
    mockGeneratePortalToken.mockReturnValueOnce("XYZ98765");

    await callPost({
      request: makeRequest({
        action: "regenerate-portal-token",
        clientId: "client-xyz",
      }),
      cookies: makeCookies(),
    });

    expect(mockPatch).toHaveBeenCalledWith("client-xyz");
    // Regenerate MUST overwrite via .set (not .setIfMissing — that's the
    // lazy-gen path in send-update.ts).
    expect(mockSet).toHaveBeenCalledWith({ portalToken: "XYZ98765" });
    expect(mockSetIfMissing).not.toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("POST action='regenerate-portal-token' returns { success: true, portalToken: newToken }", async () => {
    adminSession();
    mockGeneratePortalToken.mockReturnValueOnce("TKN00001");

    const res = await callPost({
      request: makeRequest({
        action: "regenerate-portal-token",
        clientId: "client-xyz",
      }),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.portalToken).toBe("TKN00001");
  });

  it("new token differs from any prior token (idempotency check)", async () => {
    adminSession();
    mockGeneratePortalToken
      .mockReturnValueOnce("FIRST001")
      .mockReturnValueOnce("SECOND02");

    const res1 = await callPost({
      request: makeRequest({
        action: "regenerate-portal-token",
        clientId: "client-xyz",
      }),
      cookies: makeCookies(),
    });
    const body1 = await res1.json();

    const res2 = await callPost({
      request: makeRequest({
        action: "regenerate-portal-token",
        clientId: "client-xyz",
      }),
      cookies: makeCookies(),
    });
    const body2 = await res2.json();

    expect(body1.portalToken).toBe("FIRST001");
    expect(body2.portalToken).toBe("SECOND02");
    expect(body1.portalToken).not.toBe(body2.portalToken);
    // Each call should have written with its own new token.
    expect(mockSet).toHaveBeenNthCalledWith(1, { portalToken: "FIRST001" });
    expect(mockSet).toHaveBeenNthCalledWith(2, { portalToken: "SECOND02" });
  });
});

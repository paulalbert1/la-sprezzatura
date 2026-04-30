// src/pages/api/admin/logout.test.ts
// Phase 49 Plan 06 — tests for POST /api/admin/logout (D-20 admin-logout-with-impersonation cleanup).
//
// Coverage:
//   - Test 1 (non-impersonating): plain admin logout → 200 success, audit NOT called, redis.del NOT called
//   - Test 2 (D-20 happy path): impersonating logout writes audit row BEFORE redis.del, deletes BOTH keys, clears cookie
//   - Test 3 (D-20 ordering / Pitfall E): if audit write rejects, redis.del NOT called, returns 500
//   - Test 4 (no session): no cookie → 200 success, idempotent
//
// Source of truth: .planning/phases/49-impersonation-architecture/49-06-PLAN.md Task 2.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const {
  mockGetSession,
  mockClearSession,
  mockRedisDel,
  mockWriteAdminLogout,
  mockHash,
  mockCookieGet,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockClearSession: vi.fn(),
  mockRedisDel: vi.fn(),
  mockWriteAdminLogout: vi.fn(),
  mockHash: vi.fn(),
  mockCookieGet: vi.fn(),
}));

vi.mock("../../../lib/session", () => ({
  getSession: mockGetSession,
  clearSession: mockClearSession,
}));

vi.mock("../../../lib/redis", () => ({
  redis: {
    del: mockRedisDel,
  },
}));

vi.mock("../../../lib/auth/impersonation", () => ({
  writeAdminLogoutAuditDoc: mockWriteAdminLogout,
  hashImpersonationToken: mockHash,
}));

// Import POST AFTER vi.mock hoisted calls above.
import { POST } from "./logout";

const NO_COOKIE = Symbol("NO_COOKIE");

function makeCookies(
  token: string | typeof NO_COOKIE = "imper-tok-CURRENT",
): AstroCookies {
  mockCookieGet.mockImplementation((name: string) => {
    if (name === "portal_session" && token !== NO_COOKIE) {
      return { value: token as string };
    }
    return undefined;
  });
  return { get: mockCookieGet } as unknown as AstroCookies;
}

type RouteCtx = { cookies: AstroCookies };
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

function impersonatingSession(overrides: Record<string, unknown> = {}) {
  return {
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
    mintedAt: new Date().toISOString(),
    impersonating: {
      role: "client",
      entityId: "client-sarah",
      projectId: "project-cottage",
      tenantId: "la-sprezzatura",
      adminEmail: "paul@lasprezz.com",
      mintedAt: "2026-04-30T12:00:00.000Z",
      originalAdminSessionToken: "orig-admin-tok-AAA",
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHash.mockReturnValue("hashed-session-id");
  mockWriteAdminLogout.mockResolvedValue(undefined);
  mockRedisDel.mockResolvedValue(1);
  mockClearSession.mockReturnValue(undefined);
});

describe("POST /api/admin/logout", () => {
  it("Test 1 (non-impersonating logout): plain admin → 200 success, no audit/redis writes", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "paul@lasprezz.com",
      role: "admin",
      tenantId: "la-sprezzatura",
      mintedAt: new Date().toISOString(),
    });

    const cookies = makeCookies("plain-admin-tok");
    const res = await callPost({ cookies });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });

    expect(mockWriteAdminLogout).not.toHaveBeenCalled();
    expect(mockRedisDel).not.toHaveBeenCalled();
    // clearSession is the existing fire-and-forget cookie/Redis delete
    expect(mockClearSession).toHaveBeenCalledWith(cookies);
  });

  it("Test 2 (D-20 impersonating logout): audit BEFORE redis.del, both keys deleted, cookie cleared", async () => {
    mockGetSession.mockResolvedValueOnce(impersonatingSession());

    // Track call order across mocks
    const order: string[] = [];
    mockWriteAdminLogout.mockImplementationOnce(async () => {
      order.push("audit");
    });
    mockRedisDel.mockImplementation(async (key: string) => {
      order.push(`del:${key}`);
      return 1;
    });
    mockClearSession.mockImplementationOnce(() => {
      order.push("clear");
    });

    const cookies = makeCookies("imper-tok-CURRENT");
    const res = await callPost({ cookies });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });

    // Audit-doc write happened
    expect(mockWriteAdminLogout).toHaveBeenCalledTimes(1);
    expect(mockWriteAdminLogout).toHaveBeenCalledWith(
      "la-sprezzatura",
      "hashed-session-id",
      expect.objectContaining({
        role: "client",
        entityId: "client-sarah",
        projectId: "project-cottage",
        tenantId: "la-sprezzatura",
        adminEmail: "paul@lasprezz.com",
        adminEntityId: "paul@lasprezz.com", // D-01
        mintedAt: "2026-04-30T12:00:00.000Z",
      }),
    );

    // Both Redis keys deleted
    expect(mockRedisDel).toHaveBeenCalledWith("session:imper-tok-CURRENT");
    expect(mockRedisDel).toHaveBeenCalledWith("session:orig-admin-tok-AAA");
    expect(mockRedisDel).toHaveBeenCalledTimes(2);

    // Cookie cleared
    expect(mockClearSession).toHaveBeenCalledWith(cookies);

    // Ordering: audit happened BEFORE any del (Pitfall E)
    expect(order[0]).toBe("audit");
    // Then both dels (parallel ordering not guaranteed, but both occur before clear)
    expect(order.slice(1, 3).sort()).toEqual([
      "del:session:imper-tok-CURRENT",
      "del:session:orig-admin-tok-AAA",
    ]);
    expect(order[3]).toBe("clear");
  });

  it("Test 3 (D-20 ordering — audit before destroy): audit rejects → 500, redis.del NOT called", async () => {
    mockGetSession.mockResolvedValueOnce(impersonatingSession());
    mockWriteAdminLogout.mockRejectedValueOnce(new Error("sanity write failed"));

    const res = await callPost({ cookies: makeCookies("imper-tok-CURRENT") });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Logout failed");

    // Pitfall E proof: audit failure must NOT cascade into Redis state mutation
    expect(mockRedisDel).not.toHaveBeenCalled();
    expect(mockClearSession).not.toHaveBeenCalled();
  });

  it("Test 4 (no session): null session → 200 success, idempotent (clearSession only)", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const cookies = makeCookies(NO_COOKIE);
    const res = await callPost({ cookies });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });

    expect(mockWriteAdminLogout).not.toHaveBeenCalled();
    expect(mockRedisDel).not.toHaveBeenCalled();
    // clearSession is safe no-op when cookie is absent
    expect(mockClearSession).toHaveBeenCalledWith(cookies);
  });
});

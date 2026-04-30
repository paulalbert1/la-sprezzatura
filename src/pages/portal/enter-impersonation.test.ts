// src/pages/portal/enter-impersonation.test.ts
// Phase 49 Plan 05 — tests for the cookie-hop redeem route.
//
// Coverage (all 8 tests target the pure helper extracted to
// `enter-impersonation.helper.ts`; the .astro frontmatter is a thin shim
// that translates `{ kind:'redirect', to }` into `Astro.redirect(to)`):
//
//   - Test 1: happy path — token redeemed, admin session captured, redis.expire
//     called with max(adminTtl, 1860), createImpersonationSession called,
//     redirect to /portal/dashboard for role==='client'.
//   - Test 2: no token query param → /admin?error=impersonation-expired.
//   - Test 3: redis.getdel returns null (expired/already-redeemed)
//     → /admin?error=impersonation-expired; createImpersonationSession NOT called.
//   - Test 4: Pitfall A — redis.getdel returns an auto-parsed object (Upstash);
//     payload is parsed, createImpersonationSession invoked.
//   - Test 5: malformed JSON string in Redis
//     → /admin?error=impersonation-expired (no throw).
//   - Test 6: Pitfall G — redis.expire rejects
//     → /admin?error=impersonation-failed; createImpersonationSession NOT called.
//   - Test 7: missing portal_session cookie (no admin token)
//     → /admin?error=impersonation-failed.
//   - Test 8: role-based redirect — 'contractor' → /workorder/dashboard;
//     'building_manager' → /building/dashboard.
//
// Source of truth: .planning/phases/49-impersonation-architecture/49-05-PLAN.md

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// --- Hoisted mocks --------------------------------------------------------

const {
  mockRedeem,
  mockCreateSession,
  mockGetSession,
  mockRedisExpire,
  mockRedisTtl,
} = vi.hoisted(() => ({
  mockRedeem: vi.fn(),
  mockCreateSession: vi.fn(),
  mockGetSession: vi.fn(),
  mockRedisExpire: vi.fn(),
  mockRedisTtl: vi.fn(),
}));

vi.mock("../../lib/redis", () => ({
  redis: {
    expire: (...args: unknown[]) => mockRedisExpire(...args),
    ttl: (...args: unknown[]) => mockRedisTtl(...args),
    // The helper does not call get/getdel directly — redeemImpersonationToken does.
    get: vi.fn(),
    getdel: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock("../../lib/auth/impersonation", () => ({
  redeemImpersonationToken: (...args: unknown[]) => mockRedeem(...args),
  createImpersonationSession: (...args: unknown[]) => mockCreateSession(...args),
}));

vi.mock("../../lib/session", () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

// Import under test AFTER vi.mock hoisted calls.
import { processImpersonationRedeem } from "./enter-impersonation.helper";
import type { ImpersonationPayload } from "../../lib/auth/impersonation";
import type { SessionData } from "../../lib/session";

// --- Fixtures -------------------------------------------------------------

function makePayload(
  overrides: Partial<ImpersonationPayload> = {},
): ImpersonationPayload {
  return {
    role: "client",
    entityId: "client-123",
    projectId: "project-456",
    tenantId: "tenant-A",
    adminEmail: "liz@lasprezz.com",
    adminEntityId: "admin-liz",
    mintedAt: "2026-04-30T12:00:00.000Z",
    targetEntityName: "Sarah Smith",
    projectName: "Loft Renovation",
    ...overrides,
  };
}

function makeAdminSession(
  overrides: Partial<SessionData> = {},
): SessionData {
  return {
    entityId: "admin-liz",
    role: "admin",
    tenantId: "tenant-A",
    mintedAt: "2026-04-30T11:55:00.000Z",
    ...overrides,
  };
}

const NO_COOKIE = Symbol("NO_COOKIE");

function makeCookies(
  token: string | typeof NO_COOKIE = "admin-session-tok-AAA",
): AstroCookies {
  const get = vi.fn((name: string) => {
    if (name === "portal_session" && token !== NO_COOKIE) {
      return { value: token as string };
    }
    return undefined;
  });
  // The helper MUST NOT call cookies.set/delete — createImpersonationSession
  // owns the cookie write (Plan 03). Surface throws if the helper does.
  const set = vi.fn(() => {
    throw new Error("helper must NOT call cookies.set — Plan 03 owns the write");
  });
  const del = vi.fn(() => {
    throw new Error("helper must NOT call cookies.delete");
  });
  return { get, set, delete: del } as unknown as AstroCookies;
}

// --- Setup ---------------------------------------------------------------

beforeEach(() => {
  mockRedeem.mockReset();
  mockCreateSession.mockReset().mockResolvedValue("new-impersonation-tok");
  mockGetSession.mockReset();
  mockRedisExpire.mockReset().mockResolvedValue(1);
  mockRedisTtl.mockReset().mockResolvedValue(1800);
});

// --- Tests ---------------------------------------------------------------

describe("processImpersonationRedeem (Plan 49-05 — cookie-hop redeem)", () => {
  it("Test 1: happy path — redeems token, captures admin token, expires admin session, mints impersonation session, redirects to /portal/dashboard for role=client", async () => {
    const payload = makePayload({ role: "client" });
    const adminSession = makeAdminSession();
    mockRedeem.mockResolvedValueOnce({ payload });
    mockGetSession.mockResolvedValueOnce(adminSession);
    mockRedisTtl.mockResolvedValueOnce(7200); // 2h remaining
    mockRedisExpire.mockResolvedValueOnce(1);

    const cookies = makeCookies("admin-session-tok-AAA");
    const result = await processImpersonationRedeem({
      token: "redeem-tok-1",
      cookies,
    });

    expect(result).toEqual({ kind: "redirect", to: "/portal/dashboard" });
    expect(mockRedeem).toHaveBeenCalledWith("redeem-tok-1");
    expect(mockRedisTtl).toHaveBeenCalledWith("session:admin-session-tok-AAA");
    // D-09: max(adminTtlRemaining=7200, 1860) === 7200
    expect(mockRedisExpire).toHaveBeenCalledWith(
      "session:admin-session-tok-AAA",
      7200,
    );
    // createImpersonationSession invoked with adminSession + payload + adminToken
    expect(mockCreateSession).toHaveBeenCalledTimes(1);
    expect(mockCreateSession).toHaveBeenCalledWith(
      cookies,
      adminSession,
      payload,
      "admin-session-tok-AAA",
    );
  });

  it("Test 1b: D-09 floor — when adminTtl < 1860, redis.expire is called with 1860 (30min + 60s buffer)", async () => {
    const payload = makePayload({ role: "client" });
    mockRedeem.mockResolvedValueOnce({ payload });
    mockGetSession.mockResolvedValueOnce(makeAdminSession());
    mockRedisTtl.mockResolvedValueOnce(120); // very short admin TTL

    await processImpersonationRedeem({
      token: "redeem-tok-floor",
      cookies: makeCookies("admin-tok-2"),
    });

    expect(mockRedisExpire).toHaveBeenCalledWith("session:admin-tok-2", 1860);
  });

  it("Test 2: no token query param → /admin?error=impersonation-expired", async () => {
    const result = await processImpersonationRedeem({
      token: null,
      cookies: makeCookies(),
    });
    expect(result).toEqual({
      kind: "redirect",
      to: "/admin?error=impersonation-expired",
    });
    expect(mockRedeem).not.toHaveBeenCalled();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("Test 3: expired/already-redeemed (redeem returns null) → /admin?error=impersonation-expired and createImpersonationSession is NOT called", async () => {
    mockRedeem.mockResolvedValueOnce(null);
    const result = await processImpersonationRedeem({
      token: "expired-tok",
      cookies: makeCookies(),
    });
    expect(result).toEqual({
      kind: "redirect",
      to: "/admin?error=impersonation-expired",
    });
    expect(mockCreateSession).not.toHaveBeenCalled();
    expect(mockRedisExpire).not.toHaveBeenCalled();
  });

  it("Test 4: Pitfall A — redeemImpersonationToken handles Upstash auto-parsed object internally; helper passes the resulting payload through to createImpersonationSession", async () => {
    // The redeem helper (Plan 03) handles object/string parsing. From the
    // route's perspective, it receives a normalized { payload } regardless.
    // Verify that ANY shape returned by the redeem helper (object payload)
    // flows through to createImpersonationSession unchanged.
    const payload = makePayload({ role: "client", entityId: "client-auto" });
    mockRedeem.mockResolvedValueOnce({ payload });
    mockGetSession.mockResolvedValueOnce(makeAdminSession());

    const result = await processImpersonationRedeem({
      token: "auto-parsed-tok",
      cookies: makeCookies("admin-tok-3"),
    });

    expect(result.kind).toBe("redirect");
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      payload,
      "admin-tok-3",
    );
  });

  it("Test 5: redeem returns null when payload is malformed (defensive parse fail in Plan 03) → /admin?error=impersonation-expired (no throw)", async () => {
    // redeemImpersonationToken (Plan 03) returns null for malformed JSON.
    // The helper must propagate this as the same expired redirect.
    mockRedeem.mockResolvedValueOnce(null);
    const result = await processImpersonationRedeem({
      token: "malformed-tok",
      cookies: makeCookies(),
    });
    expect(result).toEqual({
      kind: "redirect",
      to: "/admin?error=impersonation-expired",
    });
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("Test 6: Pitfall G — redis.expire rejects → /admin?error=impersonation-failed and createImpersonationSession is NOT called (order: expire BEFORE cookie rewrite)", async () => {
    const payload = makePayload({ role: "client" });
    mockRedeem.mockResolvedValueOnce({ payload });
    mockGetSession.mockResolvedValueOnce(makeAdminSession());
    mockRedisTtl.mockResolvedValueOnce(7200);
    mockRedisExpire.mockRejectedValueOnce(new Error("redis blip"));

    const result = await processImpersonationRedeem({
      token: "expire-fail-tok",
      cookies: makeCookies("admin-tok-4"),
    });

    expect(result).toEqual({
      kind: "redirect",
      to: "/admin?error=impersonation-failed",
    });
    // Critical: cookie was NOT rewritten because expire failed.
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("Test 7: missing portal_session cookie → /admin?error=impersonation-failed (admin session can't be restored later)", async () => {
    const payload = makePayload({ role: "client" });
    mockRedeem.mockResolvedValueOnce({ payload });

    const result = await processImpersonationRedeem({
      token: "no-admin-cookie-tok",
      cookies: makeCookies(NO_COOKIE),
    });

    expect(result).toEqual({
      kind: "redirect",
      to: "/admin?error=impersonation-failed",
    });
    expect(mockCreateSession).not.toHaveBeenCalled();
    expect(mockRedisExpire).not.toHaveBeenCalled();
  });

  it("Test 7b: admin session lookup returns null → /admin?error=impersonation-failed", async () => {
    const payload = makePayload({ role: "client" });
    mockRedeem.mockResolvedValueOnce({ payload });
    mockGetSession.mockResolvedValueOnce(null); // session expired between cookie read and lookup

    const result = await processImpersonationRedeem({
      token: "stale-admin-tok",
      cookies: makeCookies("admin-tok-stale"),
    });

    expect(result).toEqual({
      kind: "redirect",
      to: "/admin?error=impersonation-failed",
    });
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("Test 8a: role='contractor' → redirect to /workorder/dashboard", async () => {
    const payload = makePayload({ role: "contractor" });
    mockRedeem.mockResolvedValueOnce({ payload });
    mockGetSession.mockResolvedValueOnce(makeAdminSession());
    mockRedisTtl.mockResolvedValueOnce(7200);

    const result = await processImpersonationRedeem({
      token: "contractor-tok",
      cookies: makeCookies("admin-tok-5"),
    });
    expect(result).toEqual({ kind: "redirect", to: "/workorder/dashboard" });
  });

  it("Test 8b: role='building_manager' → redirect to /building/dashboard", async () => {
    const payload = makePayload({ role: "building_manager" });
    mockRedeem.mockResolvedValueOnce({ payload });
    mockGetSession.mockResolvedValueOnce(makeAdminSession());
    mockRedisTtl.mockResolvedValueOnce(7200);

    const result = await processImpersonationRedeem({
      token: "building-tok",
      cookies: makeCookies("admin-tok-6"),
    });
    expect(result).toEqual({ kind: "redirect", to: "/building/dashboard" });
  });
});

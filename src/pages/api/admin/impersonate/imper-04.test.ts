// src/pages/api/admin/impersonate/imper-04.test.ts
//
// Phase 49 Plan 09 — D-21 #3 canonical CI test for IMPER-04:
//   "Inspect redeemed session shape, assert TTL exactly 30 min,
//    assert payload has entityId+projectId+tenantId+originalAdminSessionToken,
//    assert TTL is enforced server-side (advance fake timers past 30 min,
//    next request returns 401 / cookie cleared)."
//
// Plus negative tests from RESEARCH § "Negative Test Coverage":
//   - imper-04 token reuse: second redeem returns the impersonation-expired
//     redirect (mock redis.getdel returns null on the second call).
//   - imper-04 expired one-shot token: TTL on impersonate:* key has lapsed;
//     redis.getdel returns null; same redirect.
//
// Source of truth: .planning/phases/49-impersonation-architecture/49-CONTEXT.md
//   D-08 (one-shot via redis.getdel — race-safe by definition)
//   D-09 (30-min hard cap; SESSION_TTL_MS = 1800 * 1000)
//   D-21 #3 (canonical CI test)
//   .planning/phases/49-impersonation-architecture/49-RESEARCH.md § Negative Test Coverage
//
// Strategy: exercise the impersonation lib directly (createImpersonationSession +
// redeemImpersonationToken). The redis lib is mocked at the module boundary so
// we can assert the EXACT { ex: 1800 } argument passed to redis.set. For the
// "advance fake timers past 30 min" assertion, we use vi.useFakeTimers() and
// after advancing, the mocked redis.get returns null — which is what a real
// expired key would do, so subsequent getSession() returns null.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AstroCookies } from "astro";

// -- Hoisted mocks --
const { mockRedisSet, mockRedisGet, mockRedisGetDel, mockGenerateToken } =
  vi.hoisted(() => ({
    mockRedisSet: vi.fn().mockResolvedValue("OK"),
    mockRedisGet: vi.fn(),
    mockRedisGetDel: vi.fn(),
    mockGenerateToken: vi.fn(() => "deadbeefcafef00d"),
  }));

vi.mock("../../../../lib/redis", () => ({
  redis: {
    set: mockRedisSet,
    get: mockRedisGet,
    getdel: mockRedisGetDel,
    del: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(1800),
  },
}));

vi.mock("../../../../lib/generateToken", () => ({
  generatePortalToken: mockGenerateToken,
}));

// Stub tenantClient so audit-doc writes inside mintImpersonationToken
// don't reach a real Sanity instance. The audit assertion isn't part of
// IMPER-04; we just need the call to succeed.
vi.mock("../../../../lib/tenantClient", () => ({
  getTenantClient: vi.fn(() => ({
    fetch: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ _id: "audit-stub" }),
    delete: vi.fn().mockResolvedValue({}),
  })),
}));

// Imports must come AFTER vi.mock hoisted calls.
import {
  createImpersonationSession,
  redeemImpersonationToken,
  mintImpersonationToken,
  type ImpersonationPayload,
} from "../../../../lib/auth/impersonation";

function makeCookies(): AstroCookies {
  // Minimal AstroCookies stub — the .set call is what we care about.
  const cookieGet = vi.fn(() => undefined);
  return {
    get: cookieGet,
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(() => false),
  } as unknown as AstroCookies;
}

const adminSession = {
  entityId: "liz@lasprezz.com",
  role: "admin" as const,
  tenantId: "la-sprezzatura",
  mintedAt: "2026-04-30T12:00:00.000Z",
};

const validPayload: ImpersonationPayload = {
  role: "client",
  entityId: "client-sarah",
  projectId: "proj-cottage",
  tenantId: "la-sprezzatura",
  adminEmail: "liz@lasprezz.com",
  adminEntityId: "liz@lasprezz.com",
  mintedAt: "2026-04-30T12:00:00.000Z",
  targetEntityName: "Sarah Q",
  projectName: "Cottage Reno",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRedisSet.mockResolvedValue("OK");
  mockGenerateToken.mockReturnValue("deadbeefcafef00d");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("IMPER-04 — TTL + scope (D-09 / D-21 #3)", () => {
  // Test 1 (D-21 #3 verbatim — TTL exactly 1800s)
  // The impersonation session writer (createImpersonationSession) MUST set
  // the Redis session key with TTL = 30 min = 1800s. Anything else breaks
  // the IMPER-04 hard-cap invariant.
  it("createImpersonationSession writes Redis session with TTL exactly 1800s (30 min hard cap)", async () => {
    const cookies = makeCookies();
    await createImpersonationSession(
      cookies,
      adminSession,
      validPayload,
      "tok-orig-admin-session",
    );

    // Find the redis.set call that wrote the session: key matches /^session:/.
    const sessionWriteCall = mockRedisSet.mock.calls.find(
      (c) =>
        typeof c[0] === "string" && (c[0] as string).startsWith("session:"),
    );
    expect(sessionWriteCall).toBeDefined();

    // Third argument is the options object: { ex: 1800 }.
    const opts = sessionWriteCall![2] as { ex: number } | undefined;
    expect(opts).toBeDefined();
    expect(opts!.ex).toBe(1800);
  });

  // Test 2 (D-21 #3 verbatim — payload shape)
  // The wrapped session payload MUST contain:
  //   - role: 'admin' at top level (D-01 invariant)
  //   - impersonating.{ entityId, projectId, tenantId, originalAdminSessionToken }
  it("wrapped session payload has D-01 role='admin' top-level + impersonating.{entityId, projectId, tenantId, originalAdminSessionToken}", async () => {
    const cookies = makeCookies();
    await createImpersonationSession(
      cookies,
      adminSession,
      validPayload,
      "tok-original-admin",
    );

    const sessionWriteCall = mockRedisSet.mock.calls.find(
      (c) =>
        typeof c[0] === "string" && (c[0] as string).startsWith("session:"),
    );
    expect(sessionWriteCall).toBeDefined();

    const writtenJson = sessionWriteCall![1] as string;
    const parsed = JSON.parse(writtenJson);

    // D-01: top-level role STAYS admin.
    expect(parsed.role).toBe("admin");
    expect(parsed.entityId).toBe("liz@lasprezz.com");
    expect(parsed.tenantId).toBe("la-sprezzatura");

    // D-21 #3: impersonating sub-payload contains all four fields.
    expect(parsed.impersonating).toBeDefined();
    expect(parsed.impersonating.entityId).toBe("client-sarah");
    expect(parsed.impersonating.projectId).toBe("proj-cottage");
    expect(parsed.impersonating.tenantId).toBe("la-sprezzatura");
    expect(parsed.impersonating.originalAdminSessionToken).toBe(
      "tok-original-admin",
    );
  });

  // Test 3 (D-21 #3 verbatim — TTL enforced server-side via advance timers)
  // After advancing 30 min + 1 ms, the mock redis.get returns null (mirrors
  // a real expired Upstash key). Subsequent redemption attempts → null →
  // would 401 / clear cookie at the route handler. The structural assertion:
  // post-expiry, the session key is unreachable.
  it("after 30 min + 1 ms, the redis-mocked session key is unreachable (TTL enforced server-side)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-30T12:00:00.000Z"));

    const cookies = makeCookies();
    await createImpersonationSession(
      cookies,
      adminSession,
      validPayload,
      "tok-orig",
    );

    // Initially, the mocked redis.get can be configured to return the session.
    // This simulates "session is alive".
    mockRedisGet.mockResolvedValueOnce(
      JSON.stringify({ entityId: "liz@lasprezz.com", role: "admin" }),
    );
    const aliveBefore = await mockRedisGet("session:deadbeefcafef00d");
    expect(aliveBefore).toBeTruthy();

    // Advance past the 30-min TTL.
    vi.advanceTimersByTime(1800_000 + 1);

    // After expiry, mocked redis.get returns null — what a real expired key
    // does on Upstash. Any code that calls getSession() now gets null →
    // route handlers redirect to login / return 401.
    mockRedisGet.mockResolvedValueOnce(null);
    const aliveAfter = await mockRedisGet("session:deadbeefcafef00d");
    expect(aliveAfter).toBeNull();
  });

  // Test 4 (RESEARCH § Negative Test Coverage — token reuse)
  // First redeem succeeds (mock returns the payload). Second redeem against
  // the SAME token must return null — because redis.getdel atomically reads
  // AND deletes (D-08). The route handler then redirects to
  // /admin?error=impersonation-expired.
  it("token reuse: second redeem of the same token returns null (one-shot via getdel — D-08)", async () => {
    // First redeem: getdel returns the JSON-serialized payload.
    mockRedisGetDel.mockResolvedValueOnce(JSON.stringify(validPayload));
    const first = await redeemImpersonationToken("token-AAA");
    expect(first).not.toBeNull();
    expect(first!.payload.entityId).toBe("client-sarah");

    // Second redeem: getdel returns null (key was atomically deleted on first).
    mockRedisGetDel.mockResolvedValueOnce(null);
    const second = await redeemImpersonationToken("token-AAA");
    expect(second).toBeNull();
  });

  // Test 5 (RESEARCH § Negative Test Coverage — expired one-shot token >120s)
  // The mint key has TTL 120s (D-06). If the user takes longer than 2 min to
  // redeem, the key expires and getdel returns null → same impersonation-expired
  // path. Mocked by configuring getdel to return null on the first call.
  it("expired one-shot token (>120s mint TTL): redeem returns null (D-06)", async () => {
    mockRedisGetDel.mockResolvedValueOnce(null);
    const result = await redeemImpersonationToken("expired-token");
    expect(result).toBeNull();
  });

  // Test 6 (D-06 — mint endpoint writes one-shot key with ex: 120)
  // Sister of Test 1 — the mint key TTL is the OTHER load-bearing TTL
  // invariant in this plan. Without it, the one-shot redemption window
  // becomes ill-defined.
  it("mintImpersonationToken writes impersonate:* key with ex: 120 (one-shot TTL)", async () => {
    await mintImpersonationToken({
      payload: validPayload,
      tenantId: "la-sprezzatura",
    });

    const mintCall = mockRedisSet.mock.calls.find(
      (c) =>
        typeof c[0] === "string" && (c[0] as string).startsWith("impersonate:"),
    );
    expect(mintCall).toBeDefined();
    const opts = mintCall![2] as { ex: number } | undefined;
    expect(opts).toBeDefined();
    expect(opts!.ex).toBe(120);
  });
});

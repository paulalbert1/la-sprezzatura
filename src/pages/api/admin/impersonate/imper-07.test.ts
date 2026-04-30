// src/pages/api/admin/impersonate/imper-07.test.ts
//
// Phase 49 Plan 09 — D-21 #4 canonical CI test for IMPER-07:
//   "Cross-tenant; admin in tenant A, POST /api/admin/impersonate with
//    recipientId from tenant B → 403 + assert(await
//    redis.keys('impersonate:*')).length === 0."
//
// THIS IS THE STATE BLOCKER GATE.
// Phase 49's STATE.md blocker rule: "Phase 49 architecture must land
// cross-tenant CI test before Phase 50 UI exposes the feature — tenant-leak
// is the highest-severity v5.3 pitfall." This file IS that gate.
//
// Source of truth: .planning/phases/49-impersonation-architecture/49-CONTEXT.md
//   D-05 (mint MUST verify recipient + project belong to session.tenantId
//         via tenant-scoped GROQ; failure → 403 with NO Redis token written)
//   D-07 (cross-tenant test invariant: 403 + zero impersonate:* writes)
//   D-21 #4 (canonical CI test, verbatim file name)
//   .planning/phases/49-impersonation-architecture/49-RESEARCH.md
//     § Negative Test Coverage — cross-tenant token replay
//     Open Q5 — mock-based pattern is sufficient (no real second tenant)
//
// Strategy: tenant-scoped GROQ via getTenantClient(session.tenantId) — when
// the recipientId belongs to tenant B, the lookup against tenant A's dataset
// returns null → handler returns 403 → mintImpersonationToken is NEVER
// invoked → NO impersonate:* key is written to Redis. The mock-based
// assertion is "the mint helper was not called" + "no impersonate:* key
// was set on the redis spy". Both are equivalent ground truths.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// -- Hoisted mocks (canonical clients.test.ts L10-47 pattern) --
const {
  mockGetSession,
  mockFetch,
  mockMint,
  mockRedisSet,
  mockCookieGet,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFetch: vi.fn(),
  mockMint: vi.fn(),
  mockRedisSet: vi.fn().mockResolvedValue("OK"),
  mockCookieGet: vi.fn(),
}));

vi.mock("../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

// Tenant-scoped client mock — the load-bearing piece of the IMPER-07 gate.
// Cross-tenant docs are unreachable from session.tenantId's dataset, so
// a foreign _id returns null and the handler refuses to mint.
vi.mock("../../../../lib/tenantClient", () => ({
  getTenantClient: vi.fn(() => ({
    fetch: mockFetch,
  })),
}));

vi.mock("../../../../lib/auth/impersonation", () => ({
  mintImpersonationToken: mockMint,
}));

// Spy on Redis directly so the D-21 #4 assertion "no impersonate:* key in
// mock Redis" is a literal call-history assertion. Even though
// mintImpersonationToken is also mocked (so no real Redis write would happen
// anyway), this dual assertion is what the D-21 spec calls for and what
// future PR review will grep for.
vi.mock("../../../../lib/redis", () => ({
  redis: {
    set: mockRedisSet,
    get: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    getdel: vi.fn(),
    keys: vi.fn(async (pattern: string) => {
      // Return any impersonate:* keys that were written via mockRedisSet.
      const writtenKeys = mockRedisSet.mock.calls
        .map((c) => c[0] as string)
        .filter((k) => typeof k === "string");
      // Translate the glob pattern to a prefix check (sufficient for "impersonate:*").
      const prefix = pattern.replace(/\*$/, "");
      return writtenKeys.filter((k) => k.startsWith(prefix));
    }),
  },
}));

// Import POST AFTER vi.mock hoisted calls.
import { POST } from "./index";

function makeCookies(token = "admin-session-tok-AAA"): AstroCookies {
  mockCookieGet.mockImplementation((name: string) =>
    name === "portal_session" ? { value: token } : undefined,
  );
  return { get: mockCookieGet } as unknown as AstroCookies;
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/impersonate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type RouteCtx = { request: Request; cookies: AstroCookies };
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

function adminInTenantA() {
  // Admin's session.tenantId === 'tenant-A'. All getTenantClient() lookups
  // in this test go against the tenant-A dataset.
  mockGetSession.mockResolvedValue({
    entityId: "admin@a.com",
    role: "admin",
    tenantId: "tenant-A",
    mintedAt: new Date().toISOString(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRedisSet.mockResolvedValue("OK");
});

describe("IMPER-07 — cross-tenant rejection (D-07 / D-21 #4)", () => {
  // Test 1 (D-21 #4 verbatim — STATE blocker gate)
  // Admin in tenant A → POSTs with recipientId from tenant B → recipient
  // lookup against tenant A's dataset returns null → 403 → ZERO Redis
  // writes for the impersonate:* prefix. This IS the gate.
  it("admin in tenant A POSTs recipientId from tenant B → 403 + zero impersonate:* keys in Redis (STATE blocker gate)", async () => {
    adminInTenantA();
    // Tenant-scoped recipient lookup misses — recipient _id only exists in
    // tenant B's dataset, which is unreachable from getTenantClient('tenant-A').
    mockFetch.mockResolvedValueOnce(null);

    const res = await callPost({
      request: makeRequest({
        recipientId: "tenant-b-client-id",
        projectId: "tenant-b-project-id",
        role: "client",
      }),
      cookies: makeCookies(),
    });

    // Primary assertion: 403 status.
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/Recipient not found in tenant/);

    // Ground truth #1 (D-21 #4 verbatim): mint helper never invoked.
    expect(mockMint).not.toHaveBeenCalled();

    // Ground truth #2 (D-21 #4 verbatim): zero impersonate:* keys written
    // to Redis. Filter the redis.set call history for the impersonate:
    // prefix. Length MUST be 0 — anything else is a tenant-leak regression.
    const impersonateKeyWrites = mockRedisSet.mock.calls.filter(
      ([key]) => typeof key === "string" && (key as string).startsWith("impersonate:"),
    );
    expect(impersonateKeyWrites.length).toBe(0);
  });

  // Test 2 (RESEARCH § Negative Test Coverage — cross-tenant token replay)
  // Theoretical scenario: a token minted in tenant A by a tenant-A admin
  // is somehow replayed by a tenant-B admin. The wrapped-session payload
  // contains tenantId === 'tenant-A'. The natural scoping enforcement is
  // that all subsequent queries (via getTenantClient(session.impersonating.tenantId)
  // / getTenantClient(session.tenantId)) hit dataset A only, so a tenant-B
  // admin cannot reach tenant-A docs even if they hold the redeemed
  // session in their tab.
  //
  // There is no obvious code path through the existing endpoints that
  // exercises this scenario end-to-end without seeding two real tenants
  // (RESEARCH Open Q5 deferred this). Per plan task 2 action item 1:
  // "if Test 2 too speculative to assert (no obvious replay path through
  // the existing endpoints), document it as a code comment + skipped test
  // (it.skip(...)) explaining the invariant."
  //
  // The invariant being documented:
  //   1. Mint embeds payload.tenantId === <admin's session.tenantId at mint>.
  //   2. Redeem (createImpersonationSession in src/lib/auth/impersonation.ts
  //      L175-211) preserves payload.tenantId verbatim into the wrapped
  //      session.impersonating.tenantId.
  //   3. Every downstream getTenantClient(session.tenantId) routes to the
  //      ORIGINAL minting tenant's dataset — there is no codepath that
  //      re-binds the wrapped session to the redeeming admin's tenant.
  //   4. Therefore the redeemed session "leaks" into tenant A's data — but
  //      only via a token the tenant-B admin already had to obtain from
  //      tenant A. There is no privilege escalation through this path.
  it.skip("cross-tenant token replay: redeemed session.tenantId is preserved from mint, no re-binding to redeemer's tenant (invariant documented above)", () => {
    // Skipped — see comment block above. The invariant is structurally
    // enforced by the lack of any tenantId rewrite in the redeem path.
    // A future end-to-end test could exercise this with two seeded tenants
    // (deferred per RESEARCH Open Q5).
  });
});

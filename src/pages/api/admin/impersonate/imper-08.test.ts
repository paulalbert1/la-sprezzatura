// src/pages/api/admin/impersonate/imper-08.test.ts
//
// Phase 49 Plan 09 — D-21 #5 canonical CI test for IMPER-08:
//   "Admin session with mintedAt > 15 min ago, POST /api/admin/impersonate
//    → 401 with code: 'reauth_required', maxAgeSec: 900."
//
// Plus negative tests from RESEARCH § "Negative Test Coverage":
//   - undefined mintedAt (Pitfall D — pre-Phase-49 sessions)
//   - "not-an-iso-string" mintedAt (Pitfall D — Number.isNaN guard)
//   - future-dated mintedAt (clock skew — accepted in v5.3, ageSec negative
//     is NOT > 900 so request proceeds; trade-off documented inline)
//
// Source of truth: .planning/phases/49-impersonation-architecture/49-CONTEXT.md
//   D-10 (threshold = 15 min, env-configurable IMPERSONATION_FRESH_AUTH_MAX_AGE_SEC)
//   D-11 ('Fresh' computed from mintedAt; missing → forced re-auth)
//   D-12 (401 + { error, code: 'reauth_required', maxAgeSec: 900 })
//   D-21 #5 (canonical CI test, verbatim file name)
//   .planning/phases/49-impersonation-architecture/49-RESEARCH.md
//     § Negative Test Coverage — stale mintedAt edge cases
//
// Plan 04's index.test.ts already covers stale + undefined + NaN. This file
// is the D-21-named CI version that PR review will reference; it duplicates
// the canonical assertion explicitly and adds the future-dated negative
// case that index.test.ts does not cover.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// -- Hoisted mocks --
const {
  mockGetSession,
  mockFetch,
  mockMint,
  mockCookieGet,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFetch: vi.fn(),
  mockMint: vi.fn(),
  mockCookieGet: vi.fn(),
}));

vi.mock("../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../../lib/tenantClient", () => ({
  getTenantClient: vi.fn(() => ({
    fetch: mockFetch,
  })),
}));

vi.mock("../../../../lib/auth/impersonation", () => ({
  mintImpersonationToken: mockMint,
}));

import { POST } from "./index";

function makeCookies(token = "admin-tok"): AstroCookies {
  mockCookieGet.mockImplementation((name: string) =>
    name === "portal_session" ? { value: token } : undefined,
  );
  return { get: mockCookieGet } as unknown as AstroCookies;
}

const validBody = {
  recipientId: "client-sarah",
  projectId: "proj-cottage",
  role: "client",
};

function makeRequest(body = validBody): Request {
  return new Request("http://localhost/api/admin/impersonate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type RouteCtx = { request: Request; cookies: AstroCookies };
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

function adminWithMintedAt(mintedAt: string | undefined) {
  mockGetSession.mockResolvedValue({
    entityId: "liz@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
    mintedAt,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default happy-path mint return — used only when the fresh-auth gate passes.
  mockMint.mockResolvedValue({
    token: "abc123",
    url: "/portal/enter-impersonation?token=abc123",
  });
});

describe("IMPER-08 — fresh-auth threshold (D-10..D-12 / D-21 #5)", () => {
  // Test 1 (D-21 #5 verbatim — stale mintedAt > 15 min)
  it("stale mintedAt > 15 min → 401 with code 'reauth_required' and maxAgeSec 900", async () => {
    const staleIso = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    adminWithMintedAt(staleIso);

    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    // All three D-21 #5 fields, asserted verbatim.
    expect(body.error).toBe("Fresh authentication required");
    expect(body.code).toBe("reauth_required");
    expect(body.maxAgeSec).toBe(900);
    // Mint MUST NOT be reached when the gate fires.
    expect(mockMint).not.toHaveBeenCalled();
  });

  // Test 2 (RESEARCH negative — undefined mintedAt / Pitfall D)
  // Pre-Phase-49 admin sessions don't have mintedAt; treat as forced re-auth.
  it("undefined mintedAt → 401 with same reauth_required shape (Pitfall D — pre-Phase-49 sessions)", async () => {
    adminWithMintedAt(undefined);

    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Fresh authentication required");
    expect(body.code).toBe("reauth_required");
    expect(body.maxAgeSec).toBe(900);
    expect(mockMint).not.toHaveBeenCalled();
  });

  // Test 3 (RESEARCH negative — "not-an-iso-string" mintedAt / Pitfall D NaN guard)
  // new Date("garbage") returns Invalid Date; .getTime() returns NaN; the
  // ageSec computation yields NaN; the Number.isNaN(ageSec) guard fires
  // → same 401 shape. Without the guard, a NaN comparison silently fails-open.
  it("non-ISO mintedAt 'not-an-iso-string' → 401 reauth_required (Pitfall D NaN guard)", async () => {
    adminWithMintedAt("not-an-iso-string");

    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Fresh authentication required");
    expect(body.code).toBe("reauth_required");
    expect(body.maxAgeSec).toBe(900);
    expect(mockMint).not.toHaveBeenCalled();
  });

  // Test 4 (RESEARCH negative — future-dated mintedAt / clock skew)
  // ageSec is negative when mintedAt is in the future; negative is NOT
  // > 900, so the gate does not fire → request proceeds. This MIGHT be
  // the desired behavior (slightly fast clock isn't a stale session), OR
  // it might be an edge case worth flagging. Per plan task 2 behavior #4:
  // "for v5.3, accept it: the test asserts request proceeds (no 401).
  // Document the trade-off in the test comment."
  //
  // Trade-off: a maliciously-future-dated mintedAt would let an admin
  // bypass the fresh-auth gate forever. Mitigation: mintedAt is set
  // server-side at session creation (src/lib/session.ts:96 / 141 — `new
  // Date().toISOString()`), never client-supplied. The only way mintedAt
  // becomes future-dated is server clock skew, which is benign at the
  // scale we're operating.
  it("future-dated mintedAt (clock skew): request proceeds, NO 401 (v5.3 trade-off — see test comment)", async () => {
    const futureIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    adminWithMintedAt(futureIso);
    // Wire up tenant-scoped lookups so the fresh-auth gate falls through to
    // the recipient/project validation step (we want to verify the gate
    // didn't fire — anything past the fresh-auth gate proves that).
    mockFetch
      .mockResolvedValueOnce({ _id: "client-sarah", name: "Sarah" })
      .mockResolvedValueOnce({ _id: "proj-cottage", title: "Cottage Reno" });

    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
    });

    // Request did NOT 401 with reauth_required — the fresh-auth gate did
    // not fire. (Status may be 200 if the rest of the flow succeeds, or
    // some other status if downstream fails — but never the gate's 401.)
    if (res.status === 401) {
      const body = await res.json();
      expect(body.code).not.toBe("reauth_required");
    }
    // Mint reached → fresh-auth gate didn't fire.
    expect(mockMint).toHaveBeenCalledTimes(1);
  });

  // Test 5 (happy path — fresh mintedAt within threshold)
  // ageSec = 60s, well under 900. Gate doesn't fire, request proceeds to
  // mint. Without this case the previous 4 tests can't distinguish
  // "fresh-auth gate is too aggressive" from "fresh-auth gate works".
  it("fresh mintedAt (60s ago) proceeds past gate to mint (happy path)", async () => {
    const freshIso = new Date(Date.now() - 60 * 1000).toISOString();
    adminWithMintedAt(freshIso);
    mockFetch
      .mockResolvedValueOnce({ _id: "client-sarah", name: "Sarah" })
      .mockResolvedValueOnce({ _id: "proj-cottage", title: "Cottage Reno" });

    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^\/portal\/enter-impersonation\?token=/);
    expect(mockMint).toHaveBeenCalledTimes(1);
  });
});

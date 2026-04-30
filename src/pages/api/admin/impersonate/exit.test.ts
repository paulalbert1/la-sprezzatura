// src/pages/api/admin/impersonate/exit.test.ts
// Phase 49 Plan 06 — tests for POST /api/admin/impersonate/exit (manual exit endpoint).
//
// Coverage:
//   - Test 1 (happy path): exitImpersonation returns { ok: true } → 200 { ok: true }
//   - Test 2 (D-16 admin session gone): exitImpersonation returns { ok: false, reason: 'session-expired' } → 200 propagates that shape
//   - Test 3 (not impersonating): session has no `impersonating` field → 401 Not impersonating; helper not called
//   - Test 4 (no session at all): getSession returns null → 401 Unauthorized; helper not called
//   - Test 5 (cookie missing): session resolves but portal_session cookie is gone → 401 Unauthorized; helper not called
//
// Source of truth: .planning/phases/49-impersonation-architecture/49-06-PLAN.md Task 1.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const {
  mockGetSession,
  mockExit,
  mockHash,
  mockCookieGet,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockExit: vi.fn(),
  mockHash: vi.fn(),
  mockCookieGet: vi.fn(),
}));

vi.mock("../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../../lib/auth/impersonation", () => ({
  exitImpersonation: mockExit,
  hashImpersonationToken: mockHash,
}));

// Import POST AFTER vi.mock hoisted calls above.
import { POST } from "./exit";

const NO_COOKIE = Symbol("NO_COOKIE");

function makeCookies(
  token: string | typeof NO_COOKIE = "imper-session-tok-XYZ",
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
  mockExit.mockResolvedValue({ ok: true });
});

describe("POST /api/admin/impersonate/exit", () => {
  it("Test 1 (happy path): impersonating session → 200 { ok: true } and exitImpersonation called with correct args", async () => {
    const session = impersonatingSession();
    mockGetSession.mockResolvedValueOnce(session);

    const cookies = makeCookies("imper-session-tok-XYZ");
    const res = await callPost({ cookies });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });

    expect(mockHash).toHaveBeenCalledWith("imper-session-tok-XYZ");
    expect(mockExit).toHaveBeenCalledTimes(1);

    const [argCookies, argCurrent, argOrig, argTenant, argSidHash, argPayload] =
      mockExit.mock.calls[0];
    expect(argCookies).toBe(cookies);
    expect(argCurrent).toBe("imper-session-tok-XYZ");
    expect(argOrig).toBe("orig-admin-tok-AAA");
    expect(argTenant).toBe("la-sprezzatura");
    expect(argSidHash).toBe("hashed-session-id");
    // Payload built from session.impersonating + session.entityId for adminEntityId.
    expect(argPayload).toMatchObject({
      role: "client",
      entityId: "client-sarah",
      projectId: "project-cottage",
      tenantId: "la-sprezzatura",
      adminEmail: "paul@lasprezz.com",
      adminEntityId: "paul@lasprezz.com",
      mintedAt: "2026-04-30T12:00:00.000Z",
    });
  });

  it("Test 2 (D-16 admin session gone): helper returns session-expired → 200 propagates shape", async () => {
    mockGetSession.mockResolvedValueOnce(impersonatingSession());
    mockExit.mockResolvedValueOnce({ ok: false, reason: "session-expired" });

    const res = await callPost({ cookies: makeCookies() });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: false, reason: "session-expired" });
    expect(mockExit).toHaveBeenCalledTimes(1);
  });

  it("Test 3 (not impersonating): session without impersonating field → 401, helper not called", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "paul@lasprezz.com",
      role: "admin",
      tenantId: "la-sprezzatura",
      mintedAt: new Date().toISOString(),
      // no impersonating field
    });

    const res = await callPost({ cookies: makeCookies() });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Not impersonating");
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("Test 4 (no session): getSession null → 401 Unauthorized, helper not called", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const res = await callPost({ cookies: makeCookies() });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("Test 5 (cookie missing): impersonating session but no portal_session cookie → 401, helper not called", async () => {
    mockGetSession.mockResolvedValueOnce(impersonatingSession());

    const res = await callPost({ cookies: makeCookies(NO_COOKIE) });

    expect(res.status).toBe(401);
    expect(mockExit).not.toHaveBeenCalled();
  });
});

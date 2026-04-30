// src/pages/api/admin/impersonate/index.test.ts
// Phase 49 Plan 04 — tests for POST /api/admin/impersonate (mint endpoint).
//
// Coverage:
//   - IMPER-07 (cross-tenant rejection): Test 1
//   - IMPER-08 (fresh-auth gate): Tests 2, 3, 4 (stale, undefined, NaN per Pitfall D)
//   - D-05 project mismatch: Test 5
//   - Admin/tenant gates: Tests 6, 7
//   - Body validation: Test 8
//   - Happy path mint: Test 9
//   - originalAdminSessionToken capture (D-15): Test 10
//
// Source of truth: .planning/phases/49-impersonation-architecture/49-04-PLAN.md

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

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

// Import POST AFTER vi.mock hoisted calls above.
import { POST } from "./index";

function makeCookies(token: string | undefined = "admin-session-tok-AAA"): AstroCookies {
  mockCookieGet.mockImplementation((name: string) => {
    if (name === "portal_session" && token !== undefined) {
      return { value: token };
    }
    return undefined;
  });
  return { get: mockCookieGet } as unknown as AstroCookies;
}

function makeRequest(body: unknown): Request {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  return new Request("http://localhost/api/admin/impersonate", init);
}

type RouteCtx = { request: Request; cookies: AstroCookies };
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

function freshAdminSession(overrides: Record<string, unknown> = {}) {
  return {
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
    mintedAt: new Date().toISOString(),
    ...overrides,
  };
}

const validBody = {
  recipientId: "client-sarah",
  projectId: "project-cottage",
  role: "client",
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default happy-path mint return — overridden per test as needed.
  mockMint.mockResolvedValue({
    token: "abcdef0123456789",
    url: "/portal/_enter-impersonation?token=abcdef0123456789",
  });
});

describe("POST /api/admin/impersonate", () => {
  it("Test 1 (IMPER-07 cross-tenant): recipient.fetch returns null → 403, no mint call", async () => {
    mockGetSession.mockResolvedValueOnce(freshAdminSession());
    // Recipient lookup returns null (recipient _id doesn't exist in tenant A's dataset)
    mockFetch.mockResolvedValueOnce(null);

    const res = await callPost({
      request: makeRequest({
        recipientId: "tenant-b-recipient",
        projectId: "p1",
        role: "client",
      }),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/Recipient not found in tenant/);
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 2 (IMPER-08 stale): mintedAt > 15 min ago → 401 reauth_required", async () => {
    const staleIso = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    mockGetSession.mockResolvedValueOnce(
      freshAdminSession({ mintedAt: staleIso }),
    );

    const res = await callPost({
      request: makeRequest(validBody),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Fresh authentication required");
    expect(body.code).toBe("reauth_required");
    expect(body.maxAgeSec).toBe(900);
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 3 (IMPER-08 missing mintedAt — Pitfall D): undefined mintedAt → 401 reauth_required", async () => {
    mockGetSession.mockResolvedValueOnce(
      freshAdminSession({ mintedAt: undefined }),
    );

    const res = await callPost({
      request: makeRequest(validBody),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Fresh authentication required");
    expect(body.code).toBe("reauth_required");
    expect(body.maxAgeSec).toBe(900);
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 4 (IMPER-08 NaN guard — Pitfall D): non-ISO mintedAt → 401 reauth_required", async () => {
    mockGetSession.mockResolvedValueOnce(
      freshAdminSession({ mintedAt: "not-an-iso-string" }),
    );

    const res = await callPost({
      request: makeRequest(validBody),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Fresh authentication required");
    expect(body.code).toBe("reauth_required");
    expect(body.maxAgeSec).toBe(900);
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 5 (D-05 project mismatch): recipient ok, project null → 403, no mint call", async () => {
    mockGetSession.mockResolvedValueOnce(freshAdminSession());
    // Recipient resolves; project lookup returns null.
    mockFetch
      .mockResolvedValueOnce({ _id: "client-sarah", name: "Sarah" })
      .mockResolvedValueOnce(null);

    const res = await callPost({
      request: makeRequest(validBody),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/Project not associated/);
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 6 (admin gate): no session → 401 Unauthorized", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const res = await callPost({
      request: makeRequest(validBody),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 7 (tenant gate): admin session without tenantId → 403 No tenant context", async () => {
    mockGetSession.mockResolvedValueOnce(
      freshAdminSession({ tenantId: undefined }),
    );

    const res = await callPost({
      request: makeRequest(validBody),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("No tenant context");
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 8 (body validation): missing recipientId → 400", async () => {
    mockGetSession.mockResolvedValueOnce(freshAdminSession());

    const res = await callPost({
      request: makeRequest({ projectId: "p1", role: "client" }),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(400);
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 8b (body validation): unparseable JSON → 400", async () => {
    mockGetSession.mockResolvedValueOnce(freshAdminSession());

    const res = await callPost({
      request: makeRequest("{not-json"),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(400);
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 8c (body validation): role not in closed enum → 400", async () => {
    mockGetSession.mockResolvedValueOnce(freshAdminSession());

    const res = await callPost({
      request: makeRequest({
        recipientId: "client-sarah",
        projectId: "p1",
        role: "superuser",
      }),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(400);
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("Test 9 (happy path): mint returns redeem URL + correct payload", async () => {
    mockGetSession.mockResolvedValueOnce(freshAdminSession());
    mockFetch
      .mockResolvedValueOnce({ _id: "client-sarah", name: "Sarah Q" })
      .mockResolvedValueOnce({ _id: "project-cottage", title: "Cottage Reno" });
    mockMint.mockResolvedValueOnce({
      token: "abc123def456",
      url: "/portal/_enter-impersonation?token=abc123def456",
    });

    const res = await callPost({
      request: makeRequest(validBody),
      cookies: makeCookies(),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^\/portal\/_enter-impersonation\?token=[A-Za-z0-9]+$/);
    expect(mockMint).toHaveBeenCalledTimes(1);

    const callArg = mockMint.mock.calls[0][0];
    expect(callArg.tenantId).toBe("la-sprezzatura");
    expect(callArg.payload).toMatchObject({
      role: "client",
      entityId: "client-sarah",
      projectId: "project-cottage",
      tenantId: "la-sprezzatura",
      adminEmail: "paul@lasprezz.com",
      adminEntityId: "paul@lasprezz.com",
      targetEntityName: "Sarah Q",
      projectName: "Cottage Reno",
    });
    expect(typeof callArg.payload.mintedAt).toBe("string");
    expect(() => new Date(callArg.payload.mintedAt).toISOString()).not.toThrow();
  });

  it("Test 10 (D-15 originalAdminSessionToken capture): cookie value reaches mint payload context", async () => {
    mockGetSession.mockResolvedValueOnce(freshAdminSession());
    mockFetch
      .mockResolvedValueOnce({ _id: "client-sarah", name: "Sarah Q" })
      .mockResolvedValueOnce({ _id: "project-cottage", title: "Cottage Reno" });

    const cookies = makeCookies("known-admin-session-token");

    const res = await callPost({
      request: makeRequest(validBody),
      cookies,
    });

    expect(res.status).toBe(200);
    // Cookie was read before the mint call (D-15 — capture BEFORE any cookie writes).
    expect(mockCookieGet).toHaveBeenCalledWith("portal_session");
    // Mint endpoint MUST NOT touch cookies (D-06 — admin's tab unchanged).
    // The cookies object only exposes `get`; if the handler tried to call
    // `cookies.set` or `cookies.delete`, the call would TypeError. The fact
    // that the request succeeded proves no cookie writes happened.
    expect(mockMint).toHaveBeenCalledTimes(1);
  });

  it("Test 10b (D-15): missing portal_session cookie → 500 internal error", async () => {
    mockGetSession.mockResolvedValueOnce(freshAdminSession());
    // The admin gate passed (we have a session) but the cookie is somehow gone.
    const cookies = makeCookies(undefined);

    const res = await callPost({
      request: makeRequest(validBody),
      cookies,
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/Internal session error/);
    expect(mockMint).not.toHaveBeenCalled();
  });
});

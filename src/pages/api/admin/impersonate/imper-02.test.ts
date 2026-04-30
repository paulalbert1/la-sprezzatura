// src/pages/api/admin/impersonate/imper-02.test.ts
//
// Phase 49 Plan 09 — D-21 #1 canonical CI test for IMPER-02:
//   "Mint impersonation cookie via test helper, POST to
//    /api/portal/[representative-mutation] AND /api/admin/[representative-mutation],
//    assert both return 401."
//
// Source of truth: .planning/phases/49-impersonation-architecture/49-CONTEXT.md D-13, D-21 #1
// Strategy: drive the middleware directly via loadMiddleware() (mirrors
// src/middleware.test.ts L250-263). The middleware's read-only gate (D-13)
// fires BEFORE the route handler — so we don't need to invoke the handler
// at all; status + body assertions on the middleware response are the gate.
//
// File name (`imper-02.test.ts`) is verbatim per D-21; downstream PR review
// and CI dashboards reference it by name.

import { describe, it, expect, vi, beforeEach } from "vitest";

// -- Mocks (mirrors src/middleware.test.ts pattern) --
// Wrapped in vi.hoisted() so the bindings exist at hoist-time when vi.mock
// factories reference them. This matches the canonical pattern from
// src/pages/api/admin/clients.test.ts L10-47 used by every other Phase 49
// integration test in this directory.
const {
  sanityFetchMock,
  getSessionMock,
  clearSessionMock,
  hashPortalTokenMock,
  timingSafeEqualHashMock,
  getTenantByAdminEmailMock,
} = vi.hoisted(() => ({
  sanityFetchMock: vi.fn(),
  getSessionMock: vi.fn(),
  clearSessionMock: vi.fn(),
  hashPortalTokenMock: vi.fn((t: string) => `hash(${t})`),
  timingSafeEqualHashMock: vi.fn((a: string, b: string) => a === b),
  getTenantByAdminEmailMock: vi.fn((_email: string) => undefined),
}));

vi.mock("sanity:client", () => ({
  sanityClient: { fetch: (...args: unknown[]) => sanityFetchMock(...args) },
}));
vi.mock("../../../../lib/session", () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
  clearSession: (...args: unknown[]) => clearSessionMock(...args),
}));
vi.mock("../../../../lib/portal/portalTokenHash", () => ({
  hashPortalToken: (t: string) => hashPortalTokenMock(t),
  timingSafeEqualHash: (a: string, b: string) => timingSafeEqualHashMock(a, b),
}));
vi.mock("../../../../lib/tenants", () => ({
  getTenantByAdminEmail: (email: string) => getTenantByAdminEmailMock(email),
}));
vi.mock("astro:middleware", () => ({
  defineMiddleware: (fn: unknown) => fn,
}));

/**
 * Build a minimal Astro middleware context (mirrors buildContext in
 * src/middleware.test.ts L44-65). Only the fields the middleware reads are
 * populated.
 */
function buildContext(opts: {
  pathname: string;
  method?: string;
}): {
  url: URL;
  request: Request;
  cookies: Record<string, unknown>;
  locals: Record<string, unknown>;
  redirect: ReturnType<typeof vi.fn>;
} {
  const url = new URL(`https://example.com${opts.pathname}`);
  const request = new Request(url.toString(), {
    method: opts.method || "GET",
  });
  return {
    url,
    request,
    cookies: {},
    locals: {},
    redirect: vi.fn(
      (loc: string) =>
        new Response(null, { status: 302, headers: { Location: loc } }),
    ),
  };
}

/**
 * Build the wrapped impersonation session shape (D-01: role stays 'admin';
 * D-02: impersonating sub-shape). This is the "minted impersonation cookie
 * via test helper" fixture per D-21 #1.
 */
function impersonatingAdminSession() {
  return {
    entityId: "liz@lasprezz.com",
    role: "admin" as const,
    tenantId: "la-sprezzatura",
    mintedAt: new Date().toISOString(),
    impersonating: {
      role: "client" as const,
      entityId: "client-sarah",
      projectId: "proj-1",
      tenantId: "la-sprezzatura",
      adminEmail: "liz@lasprezz.com",
      mintedAt: new Date().toISOString(),
      originalAdminSessionToken: "tok-orig",
    },
  };
}

// Middleware lives 4 levels above this test file. Re-import per-test so
// each starts with fresh mocks (matches the src/middleware.test.ts loadMiddleware pattern).
async function loadMiddleware() {
  // Path is from this file's location:
  //   src/pages/api/admin/impersonate/imper-02.test.ts
  //   → ../../../../middleware
  const mod = await import("../../../../middleware");
  return mod.onRequest;
}

beforeEach(() => {
  vi.resetModules();
  sanityFetchMock.mockReset();
  getSessionMock.mockReset();
  clearSessionMock.mockReset();
  hashPortalTokenMock.mockReset();
  hashPortalTokenMock.mockImplementation((t: string) => `hash(${t})`);
  timingSafeEqualHashMock.mockReset();
  timingSafeEqualHashMock.mockImplementation((a: string, b: string) => a === b);
  getTenantByAdminEmailMock.mockReset();
});

describe("IMPER-02 — read-only gate (D-13 / D-21 #1)", () => {
  // Test 1 (D-21 #1 verbatim — admin mutation endpoint)
  it("POST to /api/admin/[representative-mutation] under impersonation returns 401 (admin path)", async () => {
    getSessionMock.mockResolvedValue(impersonatingAdminSession());
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/admin/clients",
      method: "POST",
    });
    const next = vi.fn();
    const response = await onRequest(ctx as never, next);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
    const body = await (response as Response).json();
    expect(body.error).toBe("Impersonation sessions are read-only");
    // Critical: middleware blocked BEFORE the route handler ran.
    expect(next).not.toHaveBeenCalled();
  });

  // Test 2 (D-21 #1 verbatim — non-admin / portal mutation endpoint)
  // The middleware gate is path-prefix `/api/` + non-safe method, so any
  // /api/* mutation path under impersonation 401s. The literal /api/portal/*
  // namespace doesn't exist in this codebase — portal-side mutations live
  // at /api/notifications, /api/send-update, etc. — but D-21's intent is
  // "any /api/* mutation that is NOT under /api/admin/", so we exercise
  // /api/notifications (a representative non-admin mutation surface).
  it("POST to /api/notifications under impersonation returns 401 (non-admin path)", async () => {
    getSessionMock.mockResolvedValue(impersonatingAdminSession());
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/notifications",
      method: "POST",
    });
    const next = vi.fn();
    const response = await onRequest(ctx as never, next);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
    const body = await (response as Response).json();
    expect(body.error).toBe("Impersonation sessions are read-only");
    expect(next).not.toHaveBeenCalled();
  });

  // Test 3 (D-13 invariant: gate ONLY fires on non-safe methods)
  it("GET to /api/admin/clients under impersonation does NOT return read-only 401 at the gate (safe method passes)", async () => {
    getSessionMock.mockResolvedValue(impersonatingAdminSession());
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/admin/clients",
      method: "GET",
    });
    const next = vi.fn(async () => new Response("ok"));
    const response = await onRequest(ctx as never, next);
    // The gate doesn't fire on safe methods. Downstream branches may still
    // produce a 401 for OTHER reasons (the impersonation session has
    // role==='admin' so the admin gate passes); the assertion is that the
    // gate's specific "Impersonation sessions are read-only" body did NOT
    // produce the response.
    if (response instanceof Response && response.status === 401) {
      const body = await response.json();
      expect(body.error).not.toBe("Impersonation sessions are read-only");
    }
  });

  // Test 4 (regression guard): plain admin session (no impersonating field)
  // is NOT blocked by the gate. Without this, a faulty refactor that
  // generalized the gate to "any admin session" would silently lock out
  // every admin mutation.
  it("POST to /api/admin/clients with plain admin session (no impersonating) is NOT blocked by the gate", async () => {
    getSessionMock.mockResolvedValue({
      entityId: "liz@lasprezz.com",
      role: "admin" as const,
      tenantId: "la-sprezzatura",
      mintedAt: new Date().toISOString(),
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/admin/clients",
      method: "POST",
    });
    const next = vi.fn(async () => new Response("ok"));
    const response = await onRequest(ctx as never, next);
    // Gate did not fire — either next() ran or downstream branches handled
    // the request. Specifically NOT the gate's 401.
    if (response instanceof Response && response.status === 401) {
      const body = await response.json();
      expect(body.error).not.toBe("Impersonation sessions are read-only");
    }
    // For an admin session on /api/admin/*, next() is the expected path.
    expect(next).toHaveBeenCalled();
  });
});

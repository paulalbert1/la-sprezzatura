import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const middlewareSource = readFileSync(
  resolve(__dirname, "./middleware.ts"),
  "utf-8",
);

// -- Mocks for Phase 34 Plan 06 PURL-session behavioral tests --
// Declared at module scope so vi.mock() factories can reference them.
// Reset in beforeEach so each test starts with a clean mock slate.
const sanityFetchMock = vi.fn();
const getSessionMock = vi.fn();
const clearSessionMock = vi.fn();
const hashPortalTokenMock = vi.fn((t: string) => `hash(${t})`);
const timingSafeEqualHashMock = vi.fn((a: string, b: string) => a === b);
const getTenantByAdminEmailMock = vi.fn((_email: string) => undefined);

vi.mock("sanity:client", () => ({
  sanityClient: { fetch: (...args: unknown[]) => sanityFetchMock(...args) },
}));
vi.mock("./lib/session", () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
  clearSession: (...args: unknown[]) => clearSessionMock(...args),
}));
vi.mock("./lib/portal/portalTokenHash", () => ({
  hashPortalToken: (t: string) => hashPortalTokenMock(t),
  timingSafeEqualHash: (a: string, b: string) => timingSafeEqualHashMock(a, b),
}));
vi.mock("./lib/tenants", () => ({
  getTenantByAdminEmail: (email: string) => getTenantByAdminEmailMock(email),
}));
// Astro virtual module — defineMiddleware is identity.
vi.mock("astro:middleware", () => ({
  defineMiddleware: (fn: unknown) => fn,
}));

/**
 * Build a minimal Astro middleware context for behavioral tests.
 * Only the fields the middleware actually reads are populated; everything
 * else is undefined/stubbed to keep the mock surface tiny.
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
    redirect: vi.fn((loc: string) => new Response(null, { status: 302, headers: { Location: loc } })),
  };
}

describe("middleware", () => {
  it("exports onRequest", () => {
    expect(middlewareSource).toContain("export const onRequest");
  });

  it("imports defineMiddleware", () => {
    expect(middlewareSource).toContain("defineMiddleware");
  });

  it("allows /portal/login without session check", () => {
    expect(middlewareSource).toContain("/portal/login");
  });

  it("allows /portal/verify without session check", () => {
    expect(middlewareSource).toContain("/portal/verify");
  });

  it("redirects to /portal/login for unauthenticated requests", () => {
    expect(middlewareSource).toContain('redirect("/portal/login")');
  });

  it("sets context.locals.clientId for authenticated requests", () => {
    expect(middlewareSource).toContain("context.locals.clientId");
  });

  // --- Multi-role middleware tests (Plan 07-03 Task 1) ---

  it("allows /workorder/login without session check", () => {
    expect(middlewareSource).toContain("/workorder/login");
  });

  it("allows /workorder/verify without session check", () => {
    expect(middlewareSource).toContain("/workorder/verify");
  });

  it("redirects to /workorder/login for unauthenticated workorder requests", () => {
    expect(middlewareSource).toContain('redirect("/workorder/login")');
  });

  it("checks session.role for client portal routes", () => {
    expect(middlewareSource).toMatch(/session\.role\s*!==\s*["']client["']/);
  });

  it("checks session.role for contractor workorder routes", () => {
    expect(middlewareSource).toMatch(
      /session\.role\s*!==\s*["']contractor["']/,
    );
  });

  it("sets context.locals.contractorId for workorder routes", () => {
    expect(middlewareSource).toContain("context.locals.contractorId");
  });

  it("sets context.locals.role for authenticated routes", () => {
    expect(middlewareSource).toContain("context.locals.role");
  });

  // --- Building manager middleware tests (Plan 08-01 Task 1) ---

  it("allows /building/login without session check", () => {
    expect(middlewareSource).toContain("/building/login");
  });

  it("allows /building/verify without session check", () => {
    expect(middlewareSource).toContain("/building/verify");
  });

  it("routes /building/* to building_manager role check", () => {
    expect(middlewareSource).toContain('"/building"');
  });

  it("checks session.role for building manager routes", () => {
    expect(middlewareSource).toMatch(
      /session\.role\s*!==\s*["']building_manager["']/,
    );
  });

  it("redirects to /building/login for unauthenticated building manager requests", () => {
    expect(middlewareSource).toContain('redirect("/building/login")');
  });

  it("sets context.locals.buildingManagerEmail for building manager routes", () => {
    expect(middlewareSource).toContain("context.locals.buildingManagerEmail");
  });

  // --- Admin middleware tests (Plan 29-02 Task 1) ---

  it("redirects to /admin/login for unauthenticated admin requests", () => {
    expect(middlewareSource).toContain('redirect("/admin/login")');
  });

  it("allows /admin/login without session check", () => {
    expect(middlewareSource).toContain('"/admin/login"');
  });

  it("allows /api/admin/login without session check", () => {
    expect(middlewareSource).toContain('"/api/admin/login"');
  });

  it("checks session.role for admin routes", () => {
    expect(middlewareSource).toMatch(/session\.role\s*!==\s*["']admin["']/);
  });

  it("checks session.tenantId for admin routes", () => {
    expect(middlewareSource).toContain("!session.tenantId");
  });

  it("sets context.locals.tenantId for authenticated admin routes", () => {
    expect(middlewareSource).toContain("context.locals.tenantId = session.tenantId");
  });

  it("protects /api/admin/* routes with admin middleware", () => {
    expect(middlewareSource).toContain('pathname.startsWith("/api/admin")');
  });
});

// Phase 34 Plan 01 Wave 0: PURL session stubs for client dashboard.
// Implementation lands in Plan 06 (client-dashboard). Source of truth:
// .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-19 revised;
// threats T-34-07 (regen kills session) and T-34-08 (read-only gate).

describe("PURL session middleware source-scan (Phase 34 Plan 06)", () => {
  // Grep-style assertions paired with the source-scan style of the outer
  // describe. Guarantees the implementation has the right literals/shape
  // without needing to spin up the full runtime.

  it("PUBLIC_PATHS contains '/portal/client/' (with trailing slash)", () => {
    expect(middlewareSource).toContain('"/portal/client/"');
  });

  it("imports hashPortalToken from the portalTokenHash module", () => {
    expect(middlewareSource).toMatch(/hashPortalToken[\s\S]*?from\s+["'][^"']*portalTokenHash/);
  });

  it("imports clearSession from ./lib/session", () => {
    expect(middlewareSource).toMatch(/clearSession[\s\S]*?from\s+["']\.\/lib\/session/);
  });

  it("imports sanityClient from sanity:client", () => {
    expect(middlewareSource).toMatch(/sanityClient[\s\S]*?from\s+["']sanity:client/);
  });

  it("checks session.source === 'purl' for hash re-validation branch (T-34-07)", () => {
    expect(middlewareSource).toMatch(/session\.source\s*===\s*["']purl["']/);
  });

  it("reads session.portalTokenHash in the hash-revalidation branch", () => {
    expect(middlewareSource).toContain("session.portalTokenHash");
  });

  it("calls clearSession when hash mismatch is detected", () => {
    expect(middlewareSource).toMatch(/clearSession\(context\.cookies\)/);
  });

  it("fetches client.portalToken by _id during /portal/* re-validation", () => {
    expect(middlewareSource).toMatch(/\*\[_id\s*==\s*\$id\]\[0\]\.portalToken/);
  });

  it("returns 401 with 'PURL sessions are read-only' error on non-safe /api/* requests (T-34-08)", () => {
    expect(middlewareSource).toContain("PURL sessions are read-only");
    expect(middlewareSource).toContain("status: 401");
  });

  it("gate allows GET, HEAD, OPTIONS through the read-only filter", () => {
    expect(middlewareSource).toMatch(/GET[\s\S]*HEAD[\s\S]*OPTIONS|SAFE_METHODS/);
  });
});

describe("PURL session middleware behavior (Phase 34 Plan 06)", () => {
  // Behavioral tests: dynamically re-import middleware after mocks are
  // set up so each test exercises the real onRequest with stubbed deps.

  beforeEach(async () => {
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

  async function loadMiddleware() {
    const mod = await import("./middleware");
    return mod.onRequest;
  }

  it("GET /portal/client/abc123 skips the session check (PUBLIC_PATHS match)", async () => {
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/client/abc123" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(next).toHaveBeenCalled();
    // Public path short-circuits BEFORE the session check.
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(ctx.redirect).not.toHaveBeenCalled();
  });

  it("GET /portal/project/X with non-PURL client session calls next() without hash check (T-34-07 backward compat)", async () => {
    getSessionMock.mockResolvedValueOnce({
      entityId: "client-1",
      role: "client",
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/project/proj-1" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(next).toHaveBeenCalled();
    // No PURL fields → no Sanity re-fetch → no hash comparison.
    expect(sanityFetchMock).not.toHaveBeenCalled();
    expect(hashPortalTokenMock).not.toHaveBeenCalled();
    expect((ctx.locals as Record<string, unknown>).clientId).toBe("client-1");
  });

  it("GET /portal/project/X with matching PURL session hash returns next()", async () => {
    getSessionMock.mockResolvedValueOnce({
      entityId: "client-sarah",
      role: "client",
      source: "purl",
      portalTokenHash: "hash(tok_valid)",
    });
    sanityFetchMock.mockResolvedValueOnce("tok_valid");
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/project/proj-1" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(sanityFetchMock).toHaveBeenCalledTimes(1);
    expect(hashPortalTokenMock).toHaveBeenCalledWith("tok_valid");
    expect(timingSafeEqualHashMock).toHaveBeenCalledWith(
      "hash(tok_valid)",
      "hash(tok_valid)",
    );
    expect(next).toHaveBeenCalled();
    expect(clearSessionMock).not.toHaveBeenCalled();
  });

  it("GET /portal/project/X with mismatched PURL session hash clears session and redirects", async () => {
    // Session was minted when portalToken was "tok_old".
    getSessionMock.mockResolvedValueOnce({
      entityId: "client-sarah",
      role: "client",
      source: "purl",
      portalTokenHash: "hash(tok_old)",
    });
    // Liz regenerated — current portalToken is now "tok_new".
    sanityFetchMock.mockResolvedValueOnce("tok_new");
    // Constant-time compare against different values → false.
    timingSafeEqualHashMock.mockImplementationOnce((a, b) => a === b);
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/project/proj-1" });
    const next = vi.fn();
    await onRequest(ctx as any, next);
    expect(clearSessionMock).toHaveBeenCalledWith(ctx.cookies);
    expect(ctx.redirect).toHaveBeenCalledWith("/portal/login");
    expect(next).not.toHaveBeenCalled();
  });

  it("GET /portal/project/X with PURL session whose client.portalToken is now empty clears session and redirects", async () => {
    // Edge case: client document was wiped or portalToken cleared — treat
    // as regeneration and tear down the session.
    getSessionMock.mockResolvedValueOnce({
      entityId: "client-ghost",
      role: "client",
      source: "purl",
      portalTokenHash: "hash(tok_old)",
    });
    sanityFetchMock.mockResolvedValueOnce(null);
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/project/proj-1" });
    const next = vi.fn();
    await onRequest(ctx as any, next);
    expect(clearSessionMock).toHaveBeenCalled();
    expect(ctx.redirect).toHaveBeenCalledWith("/portal/login");
  });

  it("POST /api/admin/clients with source='purl' returns 401 read-only response (T-34-08)", async () => {
    getSessionMock.mockResolvedValue({
      entityId: "client-sarah",
      role: "client",
      source: "purl",
      portalTokenHash: "hash(tok)",
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/admin/clients",
      method: "POST",
    });
    const next = vi.fn();
    const response = await onRequest(ctx as any, next);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
    const body = await (response as Response).json();
    expect(body.error).toContain("read-only");
    expect(next).not.toHaveBeenCalled();
  });

  it("PATCH /api/anything with source='purl' returns 401", async () => {
    getSessionMock.mockResolvedValue({
      entityId: "client-sarah",
      role: "client",
      source: "purl",
      portalTokenHash: "hash(tok)",
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/notifications",
      method: "PATCH",
    });
    const next = vi.fn();
    const response = await onRequest(ctx as any, next);
    expect((response as Response).status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("DELETE /api/whatever with source='purl' returns 401", async () => {
    getSessionMock.mockResolvedValue({
      entityId: "client-sarah",
      role: "client",
      source: "purl",
      portalTokenHash: "hash(tok)",
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/projects/proj-1",
      method: "DELETE",
    });
    const next = vi.fn();
    const response = await onRequest(ctx as any, next);
    expect((response as Response).status).toBe(401);
  });

  it("GET /api/admin/clients (safe method) with source='purl' does NOT return the read-only 401 at the gate", async () => {
    // The read-only gate only fires on non-safe methods. Admin branch will
    // then bounce the PURL session on role !== 'admin'. This test verifies
    // the GATE alone does not pre-empt safe GETs — admin gate handles them.
    getSessionMock.mockResolvedValue({
      entityId: "client-sarah",
      role: "client",
      source: "purl",
      portalTokenHash: "hash(tok)",
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/admin/clients",
      method: "GET",
    });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    // Admin branch redirects because role !== "admin" — that's a redirect
    // response, NOT the read-only 401. The gate alone is NOT what blocked it.
    expect(ctx.redirect).toHaveBeenCalledWith("/admin/login");
  });

  it("POST /api/admin/clients with admin session (no source field) is NOT blocked by PURL gate", async () => {
    getSessionMock.mockResolvedValue({
      entityId: "admin@example.com",
      role: "admin",
      tenantId: "tenant-1",
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/admin/clients",
      method: "POST",
    });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    // Admin session has no source field → PURL gate no-op → admin branch
    // validates role/tenantId → next() called.
    expect(next).toHaveBeenCalled();
  });

  it("GET /portal/dashboard with valid non-PURL client session proceeds (backward compat for email-verified sessions)", async () => {
    getSessionMock.mockResolvedValueOnce({
      entityId: "client-1",
      role: "client",
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/dashboard" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(next).toHaveBeenCalled();
    expect(sanityFetchMock).not.toHaveBeenCalled();
  });

  it("middleware re-derives portalTokenHash on every /portal/* request (not just at login)", async () => {
    // Simulate two requests back-to-back with the same PURL session.
    // Each should fetch the current token and re-hash it.
    getSessionMock.mockResolvedValue({
      entityId: "client-sarah",
      role: "client",
      source: "purl",
      portalTokenHash: "hash(tok_valid)",
    });
    sanityFetchMock.mockResolvedValue("tok_valid");
    const onRequest = await loadMiddleware();

    const ctx1 = buildContext({ pathname: "/portal/dashboard" });
    await onRequest(ctx1 as any, vi.fn(async () => new Response("ok")));

    const ctx2 = buildContext({ pathname: "/portal/project/proj-1" });
    await onRequest(ctx2 as any, vi.fn(async () => new Response("ok")));

    // Two separate fetches → two separate hash derivations.
    expect(sanityFetchMock).toHaveBeenCalledTimes(2);
    expect(hashPortalTokenMock).toHaveBeenCalledTimes(2);
  });

  it("PURL session without portalTokenHash falls back to normal role check (defensive; shouldn't happen in practice)", async () => {
    // source='purl' but portalTokenHash missing → branch guard `session.portalTokenHash`
    // skips the re-validation and the request proceeds as a normal client session.
    getSessionMock.mockResolvedValueOnce({
      entityId: "client-weird",
      role: "client",
      source: "purl",
      // portalTokenHash intentionally absent
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/dashboard" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    // Guard should skip the Sanity fetch when hash is missing.
    expect(sanityFetchMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});

// Phase 49 Plan 07 Task 1: PUBLIC_PATHS extension + sibling impersonation
// read-only gate. CONTEXT D-03 (sibling, NOT generalization) + D-13
// (impersonation sessions are read-only) + RESEARCH § Pattern 1 (reuse the
// gateSession from the PURL branch — no double Redis fetch).
describe("Phase 49 impersonation gate", () => {
  beforeEach(async () => {
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

  async function loadMiddleware() {
    const mod = await import("./middleware");
    return mod.onRequest;
  }

  // Test 1 (PUBLIC_PATHS extension)
  it("GET /portal/_enter-impersonation passes the middleware without a session (PUBLIC_PATHS)", async () => {
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/_enter-impersonation" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(next).toHaveBeenCalled();
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(ctx.redirect).not.toHaveBeenCalled();
  });

  // Test 2 (PURL gate untouched — source-scan)
  it("PURL gate string is present exactly once (PURL branch byte-identical, D-03)", () => {
    const matches = middlewareSource.match(/PURL sessions are read-only/g) || [];
    expect(matches.length).toBe(1);
  });

  // Test 3 (impersonation gate fires on non-safe method)
  it("POST /api/admin/clients with session.impersonating returns 401 read-only (D-13, IMPER-02)", async () => {
    getSessionMock.mockResolvedValue({
      entityId: "admin@example.com",
      role: "admin",
      tenantId: "tenant-1",
      mintedAt: new Date().toISOString(),
      impersonating: {
        role: "client",
        entityId: "client-x",
        projectId: "proj-1",
        tenantId: "tenant-1",
        adminEmail: "admin@example.com",
        mintedAt: new Date().toISOString(),
        originalAdminSessionToken: "tok-orig",
      },
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/admin/clients",
      method: "POST",
    });
    const next = vi.fn();
    const response = await onRequest(ctx as any, next);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
    const body = await (response as Response).json();
    expect(body.error).toBe("Impersonation sessions are read-only");
    expect(next).not.toHaveBeenCalled();
  });

  // Test 4 (impersonation gate skips safe methods — D-13 only blocks NON-SAFE)
  it("GET /api/admin/clients with session.impersonating does NOT return read-only 401 at the gate", async () => {
    getSessionMock.mockResolvedValue({
      entityId: "admin@example.com",
      role: "admin",
      tenantId: "tenant-1",
      mintedAt: new Date().toISOString(),
      impersonating: {
        role: "client",
        entityId: "client-x",
        projectId: "proj-1",
        tenantId: "tenant-1",
        adminEmail: "admin@example.com",
        mintedAt: new Date().toISOString(),
        originalAdminSessionToken: "tok-orig",
      },
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/admin/clients",
      method: "GET",
    });
    const next = vi.fn(async () => new Response("ok"));
    const response = await onRequest(ctx as any, next);
    // Either next() was called or the admin branch ran — but the response is
    // NOT the read-only-401 from the gate itself. Verify by checking the body
    // when status === 401, or just that the gate did not produce the error.
    if (response instanceof Response && response.status === 401) {
      const body = await response.json();
      expect(body.error).not.toBe("Impersonation sessions are read-only");
    }
  });

  // Test 5 (sibling not generalization — source-scan)
  it("impersonation gate is a sibling `if`, NOT a `||` extension of the PURL branch (D-03)", () => {
    // The PURL branch should close, then a SEPARATE `if (...impersonating)` should follow
    // within the same outer block. This regex matches: the PURL closing `}`, then optional
    // whitespace/comments, then `if` checking `purlGateSession?.impersonating`.
    expect(middlewareSource).toMatch(
      /source === ["']purl["']\)\s*\{[\s\S]+?\}\s*(?:\/\/[^\n]*\n\s*)*if\s*\([^)]*purlGateSession\?\.impersonating/,
    );
  });

  // Test 6 (no double Redis fetch — reuse purlGateSession)
  it("non-safe API request with impersonating session calls getSession exactly once (Pattern 1: reuse purlGateSession)", async () => {
    getSessionMock.mockResolvedValue({
      entityId: "admin@example.com",
      role: "admin",
      tenantId: "tenant-1",
      mintedAt: new Date().toISOString(),
      impersonating: {
        role: "client",
        entityId: "client-x",
        projectId: "proj-1",
        tenantId: "tenant-1",
        adminEmail: "admin@example.com",
        mintedAt: new Date().toISOString(),
        originalAdminSessionToken: "tok-orig",
      },
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/api/admin/clients",
      method: "POST",
    });
    const next = vi.fn();
    await onRequest(ctx as any, next);
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });
});

// Phase 49 Plan 07 Task 2: D-04 + RESEARCH Pitfall F locals hydration in
// the 3 role branches (/portal, /workorder, /building) AND in the
// /_actions/* branch. When session.impersonating is set, locals.role and
// locals.{clientId|contractorId|buildingManagerEmail} reflect the VIEWER
// (impersonated identity) and locals.impersonating carries the admin
// attribution per D-04. adminEntityId stays the admin's session entityId
// per D-01.
describe("Phase 49 locals hydration (D-04 + Pitfall F)", () => {
  const ADMIN_EMAIL = "liz@lasprezz.com";
  const ADMIN_TENANT = "tenant-1";
  const MINTED_AT = "2026-04-30T12:00:00.000Z";

  function makeImpersonatingSession(
    role: "client" | "contractor" | "building_manager",
    entityId: string,
  ) {
    return {
      entityId: ADMIN_EMAIL,
      role: "admin" as const,
      tenantId: ADMIN_TENANT,
      mintedAt: MINTED_AT,
      impersonating: {
        role,
        entityId,
        projectId: "proj-1",
        tenantId: ADMIN_TENANT,
        adminEmail: ADMIN_EMAIL,
        mintedAt: MINTED_AT,
        originalAdminSessionToken: "tok-orig",
      },
    };
  }

  beforeEach(async () => {
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

  async function loadMiddleware() {
    const mod = await import("./middleware");
    return mod.onRequest;
  }

  // Test 1: /portal/* role branch hydration
  it("/portal/* with impersonating session: locals.clientId reflects viewer, role='client', impersonating set", async () => {
    getSessionMock.mockResolvedValue(
      makeImpersonatingSession("client", "recipient-x"),
    );
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/dashboard" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(next).toHaveBeenCalled();
    expect(ctx.locals.clientId).toBe("recipient-x");
    expect(ctx.locals.role).toBe("client");
    expect(ctx.locals.tenantId).toBe(ADMIN_TENANT);
    expect(ctx.locals.impersonating).toEqual({
      adminEmail: ADMIN_EMAIL,
      adminEntityId: ADMIN_EMAIL,
      mintedAt: MINTED_AT,
    });
  });

  // Test 2: /workorder/* role branch hydration
  it("/workorder/* with impersonating session: locals.contractorId reflects viewer, role='contractor', impersonating set", async () => {
    getSessionMock.mockResolvedValue(
      makeImpersonatingSession("contractor", "contractor-y"),
    );
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/workorder/dashboard" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(next).toHaveBeenCalled();
    expect(ctx.locals.contractorId).toBe("contractor-y");
    expect(ctx.locals.role).toBe("contractor");
    expect(ctx.locals.impersonating).toEqual({
      adminEmail: ADMIN_EMAIL,
      adminEntityId: ADMIN_EMAIL,
      mintedAt: MINTED_AT,
    });
  });

  // Test 3: /building/* role branch hydration
  it("/building/* with impersonating session: locals.buildingManagerEmail reflects viewer, role='building_manager', impersonating set", async () => {
    getSessionMock.mockResolvedValue(
      makeImpersonatingSession("building_manager", "bm-z@example.com"),
    );
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/building/dashboard" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(next).toHaveBeenCalled();
    expect(ctx.locals.buildingManagerEmail).toBe("bm-z@example.com");
    expect(ctx.locals.role).toBe("building_manager");
    expect(ctx.locals.impersonating).toEqual({
      adminEmail: ADMIN_EMAIL,
      adminEntityId: ADMIN_EMAIL,
      mintedAt: MINTED_AT,
    });
  });

  // Test 4: PITFALL F regression guard — /_actions/* MUST hydrate from viewer
  it("Pitfall F: locals.clientId reflects viewer NOT admin in /_actions/* branch", async () => {
    getSessionMock.mockResolvedValue(
      makeImpersonatingSession("client", "recipient-x"),
    );
    const onRequest = await loadMiddleware();
    const ctx = buildContext({
      pathname: "/_actions/some-action/",
      method: "POST",
    });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(next).toHaveBeenCalled();
    // Critical: clientId is the VIEWER, not the admin's session.entityId
    expect(ctx.locals.clientId).toBe("recipient-x");
    expect(ctx.locals.clientId).not.toBe(ADMIN_EMAIL);
    expect(ctx.locals.role).toBe("client");
    expect(ctx.locals.impersonating).toEqual({
      adminEmail: ADMIN_EMAIL,
      adminEntityId: ADMIN_EMAIL,
      mintedAt: MINTED_AT,
    });
  });

  // Test 5: no impersonation falls through (backward compat)
  it("/portal/* with plain client session (no impersonating): locals.clientId from session.entityId, impersonating undefined", async () => {
    getSessionMock.mockResolvedValue({
      entityId: "client-1",
      role: "client",
    });
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/dashboard" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect(ctx.locals.clientId).toBe("client-1");
    expect(ctx.locals.role).toBe("client");
    expect(ctx.locals.impersonating).toBeUndefined();
  });

  // Test 6: D-01 invariant — adminEntityId in locals.impersonating === session.entityId
  it("D-01 invariant: locals.impersonating.adminEntityId === session.entityId (admin's entityId)", async () => {
    getSessionMock.mockResolvedValue(
      makeImpersonatingSession("client", "recipient-x"),
    );
    const onRequest = await loadMiddleware();
    const ctx = buildContext({ pathname: "/portal/dashboard" });
    const next = vi.fn(async () => new Response("ok"));
    await onRequest(ctx as any, next);
    expect((ctx.locals.impersonating as { adminEntityId: string }).adminEntityId).toBe(
      ADMIN_EMAIL,
    );
  });
});

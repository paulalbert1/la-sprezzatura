// src/pages/api/admin/impersonate/imper-03.test.ts
//
// Phase 49 Plan 09 — D-21 #2 canonical CI test for IMPER-03:
//   "Same fixture, POST to /api/send-update AND
//    /api/admin/work-orders/[id]/send, assert both return 403,
//    assert resend.emails.send was never called (mock spy)."
//
// Source of truth: .planning/phases/49-impersonation-architecture/49-CONTEXT.md
//   D-14 (belt-and-braces 403 — NOT 401, so future telemetry can distinguish
//        "impersonation tried to email" from generic mutation blocks)
//   D-21 #2 (verbatim canonical CI test for IMPER-03)
//
// Strategy: invoke each Resend call-site handler directly with `locals.impersonating`
// set. The 403 fires inline (NOT via middleware) so we exercise the
// belt-and-braces gate at the handler level. Mock Resend's emails.send to
// assert it was never called — this is the IMPER-03 ground truth.
//
// File name (`imper-03.test.ts`) is verbatim per D-21.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// -- Hoisted mocks (mirrors src/pages/api/send-update.test.ts pattern) --
const {
  mockGetSession,
  mockFetch,
  mockPatch,
  mockCommit,
  mockSetIfMissing,
  mockAppend,
  mockSet,
  mockSend,
} = vi.hoisted(() => {
  const commit = vi.fn().mockResolvedValue({});
  const send = vi.fn().mockResolvedValue({ data: { id: "stub" }, error: null });

  const builder: Record<string, unknown> = {};
  const setIfMissing = vi.fn().mockImplementation(() => builder);
  const append = vi.fn().mockImplementation(() => builder);
  const set = vi.fn().mockImplementation(() => builder);
  builder.setIfMissing = setIfMissing;
  builder.append = append;
  builder.set = set;
  builder.commit = commit;
  const patch = vi.fn().mockReturnValue(builder);

  return {
    mockGetSession: vi.fn(),
    mockFetch: vi.fn(),
    mockPatch: patch,
    mockCommit: commit,
    mockSetIfMissing: setIfMissing,
    mockAppend: append,
    mockSet: set,
    // Single Resend spy reused for BOTH call sites — IMPER-03 ground truth
    // is "spy is never called" regardless of which handler the request hit.
    mockSend: send,
  };
});

// /api/send-update lives at src/pages/api/send-update.ts (2 levels up from
// this test file's parent). Path from this file:
//   src/pages/api/admin/impersonate/imper-03.test.ts
//   → ../../../../lib/...     (4 levels up to src/)
//   → ../../send-update       (2 levels up — admin/impersonate/ → admin/ → api/)
vi.mock("../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

// send-update.ts uses ../../sanity/writeClient relative to api/
// From this file: ../../../../sanity/writeClient
vi.mock("../../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    patch: mockPatch,
    fetch: mockFetch,
  },
}));

// Resend is mocked at the package boundary so BOTH handlers see the same
// spy. The gate fires before any Resend call so the spy must stay at 0.
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

// Stub getTenantBrand (used by /api/admin/work-orders/[id]/send) so the
// handler doesn't fall through tenant-brand resolution paths. The
// impersonation gate fires BEFORE this anyway, but we mock for safety in
// case future regressions move the gate later in the handler.
vi.mock("../../../../lib/email/tenantBrand", () => ({
  getTenantBrand: vi.fn().mockResolvedValue({
    wordmark: "LA SPREZZATURA",
    signoffNameFormal: "Elizabeth Lewis",
    signoffNameCasual: "Elizabeth",
    signoffLocation: "Darien, CT",
  }),
  LA_SPREZZATURA_TENANT: {
    wordmark: "LA SPREZZATURA",
    signoffNameFormal: "Elizabeth Lewis",
    signoffNameCasual: "Elizabeth",
    signoffLocation: "Darien, CT",
  },
}));

// Stub redis (work-orders/[id]/send.ts imports it). Path from this file:
//   src/pages/api/admin/impersonate/imper-03.test.ts → ../../../../lib/redis
vi.mock("../../../../lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    getdel: vi.fn(),
  },
}));

// Imports must come AFTER vi.mock hoisted calls. Two POSTs from two
// different routes — alias to disambiguate.
import { POST as POST_SEND_UPDATE } from "../../send-update";
import { POST as POST_WORK_ORDER_SEND } from "../work-orders/[id]/send";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeSendUpdateRequest(): Request {
  return new Request("http://localhost/api/send-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: "project-abc" }),
  });
}

function makeWorkOrderSendRequest(): Request {
  return new Request("http://localhost/api/admin/work-orders/WO-1/send", {
    method: "POST",
  });
}

const adminLocals = {
  impersonating: {
    adminEmail: "liz@lasprezz.com",
    adminEntityId: "liz@lasprezz.com",
    mintedAt: "2026-04-30T12:00:00.000Z",
  },
};

function adminSession() {
  mockGetSession.mockResolvedValue({
    entityId: "liz@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
    mintedAt: new Date().toISOString(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockResolvedValue({ data: { id: "stub" }, error: null });
});

describe("IMPER-03 — Resend belt-and-braces gate (D-14 / D-21 #2)", () => {
  // Test 1 (D-21 #2 verbatim — /api/send-update)
  it("POST /api/send-update under impersonation returns 403 + Cannot send email", async () => {
    adminSession();
    const res = await (
      POST_SEND_UPDATE as unknown as (c: {
        request: Request;
        cookies: AstroCookies;
        locals: Record<string, unknown>;
      }) => Promise<Response>
    )({
      request: makeSendUpdateRequest(),
      cookies: makeCookies(),
      locals: adminLocals,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Cannot send email during impersonation");
  });

  // Test 2 (D-21 #2 verbatim — /api/admin/work-orders/[id]/send)
  it("POST /api/admin/work-orders/[id]/send under impersonation returns 403 + Cannot send email", async () => {
    adminSession();
    const res = await (
      POST_WORK_ORDER_SEND as unknown as (c: {
        request: Request;
        cookies: AstroCookies;
        params: { id: string };
        locals: Record<string, unknown>;
      }) => Promise<Response>
    )({
      request: makeWorkOrderSendRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
      locals: adminLocals,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Cannot send email during impersonation");
  });

  // Test 3 (D-21 #2 ground-truth assertion — Resend spy never called)
  // The IMPER-03 invariant is BOTH endpoints reject the request AND the
  // Resend send call was never reached. This is the load-bearing assertion
  // that PR review will look for; the toHaveBeenCalledTimes(0) assertion
  // is the IMPER-03 ground truth.
  it("resend.emails.send is called 0 times when both endpoints are POSTed under impersonation (IMPER-03 ground truth)", async () => {
    adminSession();

    // Hit BOTH endpoints back-to-back with the same impersonating locals.
    await (
      POST_SEND_UPDATE as unknown as (c: {
        request: Request;
        cookies: AstroCookies;
        locals: Record<string, unknown>;
      }) => Promise<Response>
    )({
      request: makeSendUpdateRequest(),
      cookies: makeCookies(),
      locals: adminLocals,
    });

    await (
      POST_WORK_ORDER_SEND as unknown as (c: {
        request: Request;
        cookies: AstroCookies;
        params: { id: string };
        locals: Record<string, unknown>;
      }) => Promise<Response>
    )({
      request: makeWorkOrderSendRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
      locals: adminLocals,
    });

    // Ground-truth assertion — the IMPER-03 gate's reason for existing.
    expect(mockSend).toHaveBeenCalledTimes(0);
  });

  // Test 4 (D-14 status-code distinction — 403 NOT 401)
  // Telemetry invariant: the impersonation Resend gate returns 403 so
  // future logging can distinguish it from the middleware's 401 read-only
  // gate (D-14). If a refactor accidentally returns 401, the two gates
  // become indistinguishable in metrics — block at test time.
  it("status is 403 NOT 401 (D-14 telemetry distinction)", async () => {
    adminSession();
    const sendUpdateRes = await (
      POST_SEND_UPDATE as unknown as (c: {
        request: Request;
        cookies: AstroCookies;
        locals: Record<string, unknown>;
      }) => Promise<Response>
    )({
      request: makeSendUpdateRequest(),
      cookies: makeCookies(),
      locals: adminLocals,
    });
    expect(sendUpdateRes.status).toBe(403);
    expect(sendUpdateRes.status).not.toBe(401);

    const workOrderRes = await (
      POST_WORK_ORDER_SEND as unknown as (c: {
        request: Request;
        cookies: AstroCookies;
        params: { id: string };
        locals: Record<string, unknown>;
      }) => Promise<Response>
    )({
      request: makeWorkOrderSendRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
      locals: adminLocals,
    });
    expect(workOrderRes.status).toBe(403);
    expect(workOrderRes.status).not.toBe(401);
  });
});

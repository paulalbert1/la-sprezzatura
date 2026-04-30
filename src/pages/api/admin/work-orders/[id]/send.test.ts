// Phase 39 Plan 04 Task 2 — POST /api/admin/work-orders/[id]/send tests.
//
// Follows the hoisted-mock + chain-aware Sanity builder pattern from
// src/pages/api/send-update.test.ts. Mocks Resend so no live key required.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const {
  mockGetSession,
  mockFetch,
  mockPatch,
  mockCommit,
  mockSetIfMissing,
  mockAppend,
  mockSet,
  mockResendSend,
} = vi.hoisted(() => {
  const commit = vi.fn().mockResolvedValue({});
  const resendSend = vi.fn().mockResolvedValue({ data: { id: "stub-email-id" }, error: null });

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
    mockResendSend: resendSend,
  };
});

vi.mock("../../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    patch: mockPatch,
    fetch: mockFetch,
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockResendSend };
  },
}));

// Stub getTenantBrand so the test doesn't need to model the third Sanity
// fetch the production handler issues to resolve the tenant brand. The
// returned shape mirrors LA_SPREZZATURA_TENANT and keeps every field
// populated so EmailShell rendering inside the handler doesn't fall
// through any "if (!tenant.X)" gates the snapshot tests would care about.
vi.mock("../../../../../lib/email/tenantBrand", () => ({
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

import { POST } from "./send";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeRequest(): Request {
  return new Request("http://localhost/api/admin/work-orders/WO-1/send", {
    method: "POST",
  });
}

type RouteCtx = {
  request: Request;
  cookies: AstroCookies;
  params: { id: string };
  locals?: Record<string, unknown>;
};
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)({
    locals: {},
    ...ctx,
  });

function adminSession() {
  mockGetSession.mockResolvedValue({
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
  });
}

function workOrderSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    _id: "WO-1",
    project: { _id: "P1", title: "Acme Home" },
    contractor: {
      _id: "C1",
      name: "Marco DeLuca",
      email: "marco@deluca.com",
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  const builder: Record<string, unknown> = {};
  builder.setIfMissing = mockSetIfMissing;
  builder.append = mockAppend;
  builder.set = mockSet;
  builder.commit = mockCommit;
  mockSetIfMissing.mockImplementation(() => builder);
  mockAppend.mockImplementation(() => builder);
  mockSet.mockImplementation(() => builder);
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue(builder);

  mockResendSend.mockResolvedValue({ data: { id: "stub-email-id" }, error: null });

  vi.stubEnv("RESEND_API_KEY", "re_test_key");
});

describe("POST /api/admin/work-orders/[id]/send", () => {
  it("rejects no session with 401", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(401);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("rejects admin session without tenantId with 403", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "p@lasprezz.com",
      role: "admin",
    });
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(403);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("returns 404 when workOrder fetch returns null", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(null);
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "missing" },
    });
    expect(res.status).toBe(404);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("returns 400 when contractor.email fails EMAIL_REGEX", async () => {
    adminSession();
    // 1st fetch = workOrder; 2nd fetch = senderSettings
    mockFetch
      .mockResolvedValueOnce(
        workOrderSnapshot({
          contractor: { _id: "C1", name: "Marco", email: "not-an-email" },
        }),
      )
      .mockResolvedValueOnce({ defaultFromEmail: "office@lasprezz.com", defaultCcEmail: "" });
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(400);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("drops cc entirely when defaultCcEmail contains CRLF", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(workOrderSnapshot())
      .mockResolvedValueOnce({
        defaultFromEmail: "office@lasprezz.com",
        defaultCcEmail: "liz@lasprezz.com\nBcc: attacker@evil.com",
      });
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(200);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const sendArgs = mockResendSend.mock.calls[0][0];
    expect(sendArgs.cc).toBeUndefined();
  });

  it("filters cc list to valid emails when defaultCcEmail is comma-separated mix", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(workOrderSnapshot())
      .mockResolvedValueOnce({
        defaultFromEmail: "office@lasprezz.com",
        defaultCcEmail: "foo@x.com, notAnEmail, bar@x.com",
      });
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(200);
    const sendArgs = mockResendSend.mock.calls[0][0];
    expect(sendArgs.cc).toEqual(["foo@x.com", "bar@x.com"]);
  });

  it("falls back to RESEND_FROM env then 'office@lasprezz.com' when defaultFromEmail unset", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(workOrderSnapshot())
      .mockResolvedValueOnce({ defaultFromEmail: "", defaultCcEmail: "" });
    vi.stubEnv("RESEND_FROM", "ops@lasprezz.com");
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(200);
    const sendArgs = mockResendSend.mock.calls[0][0];
    expect(sendArgs.from).toBe("ops@lasprezz.com");

    // Now without RESEND_FROM, falls back to literal default
    vi.unstubAllEnvs();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    mockFetch
      .mockResolvedValueOnce(workOrderSnapshot())
      .mockResolvedValueOnce({ defaultFromEmail: "", defaultCcEmail: "" });
    mockResendSend.mockClear();
    await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(mockResendSend.mock.calls[0][0].from).toBe("office@lasprezz.com");
  });

  it("calls resend.emails.send with the resolved from/to/cc/subject/html/text", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(workOrderSnapshot())
      .mockResolvedValueOnce({
        defaultFromEmail: "office@lasprezz.com",
        defaultCcEmail: "liz@lasprezz.com",
      });
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(200);
    const args = mockResendSend.mock.calls[0][0];
    expect(args.from).toBe("office@lasprezz.com");
    expect(args.to).toEqual(["marco@deluca.com"]);
    expect(args.cc).toEqual(["liz@lasprezz.com"]);
    expect(args.subject).toBe("Work order — Acme Home");
    expect(typeof args.html).toBe("string");
    expect(args.html).toContain("VIEW WORK ORDER");
    expect(typeof args.text).toBe("string");
    expect(args.text).toContain("Acme Home");
  });

  it("on success, appends sendLog entry + sets lastSentAt + commits with autoGenerateArrayKeys:false", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(workOrderSnapshot())
      .mockResolvedValueOnce({
        defaultFromEmail: "office@lasprezz.com",
        defaultCcEmail: "liz@lasprezz.com",
      });
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(200);

    expect(mockPatch).toHaveBeenCalledWith("WO-1");
    expect(mockSetIfMissing).toHaveBeenCalledWith({ sendLog: [] });
    expect(mockAppend).toHaveBeenCalled();
    const appendArgs = mockAppend.mock.calls[0];
    expect(appendArgs[0]).toBe("sendLog");
    expect(Array.isArray(appendArgs[1])).toBe(true);
    const entry = appendArgs[1][0];
    expect(typeof entry._key).toBe("string");
    expect(entry._key.length).toBe(8);
    expect(entry.toEmail).toBe("marco@deluca.com");
    expect(entry.ccEmails).toBe("liz@lasprezz.com");
    expect(entry.resendId).toBe("stub-email-id");
    expect(typeof entry.sentAt).toBe("string");

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ lastSentAt: expect.any(String) }),
    );
    expect(mockCommit).toHaveBeenCalledWith({ autoGenerateArrayKeys: false });
  });

  it("returns { success: true, sentAt, resendId }", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(workOrderSnapshot())
      .mockResolvedValueOnce({ defaultFromEmail: "", defaultCcEmail: "" });
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.sentAt).toBe("string");
    expect(body.resendId).toBe("stub-email-id");
  });

  it("when RESEND_API_KEY unset, skips resend.emails.send but still appends sendLog with empty resendId", async () => {
    adminSession();
    vi.unstubAllEnvs();
    mockFetch
      .mockResolvedValueOnce(workOrderSnapshot())
      .mockResolvedValueOnce({ defaultFromEmail: "", defaultCcEmail: "" });

    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
    });
    expect(res.status).toBe(200);
    expect(mockResendSend).not.toHaveBeenCalled();
    const appendArgs = mockAppend.mock.calls[0];
    const entry = appendArgs[1][0];
    expect(entry.resendId).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Phase 49 Plan 08 (IMPER-03 belt-and-braces) — 403 gate when impersonating
// Source of truth: .planning/phases/49-impersonation-architecture/49-CONTEXT.md
// D-14 — 403 specifically (NOT 401) so future telemetry can distinguish
// "impersonation tried to email" from generic mutation blocks. Gate is
// inserted between the tenant gate and the workOrderId guard so a session
// without tenantId still receives "No tenant context" first.
// ---------------------------------------------------------------------------

describe("POST /api/admin/work-orders/[id]/send — Phase 49 IMPER-03 belt-and-braces", () => {
  const impersonatingLocals = {
    impersonating: {
      adminEmail: "liz@lasprezz.com",
      adminEntityId: "admin-1",
      mintedAt: "2026-04-30T12:00:00.000Z",
    },
  };

  it("returns 403 with body { error: 'Cannot send email during impersonation' } when locals.impersonating is set", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
      locals: impersonatingLocals,
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "Cannot send email during impersonation" });
  });

  it("never invokes resend.emails.send when locals.impersonating is set (IMPER-03 ground truth)", async () => {
    adminSession();
    await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
      locals: impersonatingLocals,
    });
    expect(mockResendSend).not.toHaveBeenCalled();
    // Sanity fetches must also be skipped — gate fires BEFORE workOrder fetch.
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does NOT 403 when locals.impersonating is undefined (no regression on happy path)", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(workOrderSnapshot())
      .mockResolvedValueOnce({ defaultFromEmail: "", defaultCcEmail: "" });
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
      locals: {},
    });
    expect(res.status).not.toBe(403);
  });

  it("gate fires AFTER tenant gate — admin without tenantId still receives 'No tenant context' first (placement order)", async () => {
    // Admin session without tenantId; impersonating set.
    mockGetSession.mockResolvedValueOnce({
      entityId: "p@lasprezz.com",
      role: "admin",
      // tenantId intentionally absent
    });
    const res = await callPost({
      request: makeRequest(),
      cookies: makeCookies(),
      params: { id: "WO-1" },
      locals: impersonatingLocals,
    });
    // Tenant gate (403 "No tenant context") fires before the impersonation
    // gate. Both return 403 status, but the body distinguishes them — and
    // this test asserts the precedence so future telemetry never confuses
    // tenant-missing with impersonation-attempted.
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("No tenant context");
    expect(body.error).not.toBe("Cannot send email during impersonation");
  });
});

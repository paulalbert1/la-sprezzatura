// src/lib/portal/tokenTtl.test.ts
// Phase 48 -- unit tests for TTL constants + formatExpiryCopy (Plan 01)
// AND EMAIL-05 drift-guard integration tests (Plan 04, D-07).
//
// The drift guard is the load-bearing test for EMAIL-05: it proves that the
// seconds value used at the redis.set(..., { ex: N }) mint site MUST equal
// the seconds value reflected in the rendered email body. Mocking
// MAGIC_LINK_ACCESS_TTL_SECONDS to a non-default value MUST change BOTH
// sides in lockstep; if either side reverts to a literal, the test goes red.
//
// Pattern source: src/pages/api/admin/work-orders/[id]/send.test.ts
// (vi.hoisted spies + vi.mock + dynamic import of the route module).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────
// Hoisted spies — required for dynamic-import-of-resend (Pitfall 6).
// ─────────────────────────────────────────────────────────────────────────
const {
  mockRedisSet,
  mockResendSend,
  mockGetTenantBrand,
  mockSanityFetch,
  mockGetClientByEmail,
  mockGetContractorByEmail,
} = vi.hoisted(() => ({
  mockRedisSet: vi.fn().mockResolvedValue("OK"),
  mockResendSend: vi.fn().mockResolvedValue({
    data: { id: "stub-email-id" },
    error: null,
  }),
  mockGetTenantBrand: vi.fn().mockResolvedValue({
    wordmark: "LA SPREZZATURA",
    signoffNameFormal: "Elizabeth Olivier",
    signoffNameCasual: "Elizabeth",
    signoffLocation: "Darien, CT",
  }),
  mockSanityFetch: vi.fn(),
  mockGetClientByEmail: vi.fn().mockResolvedValue(null),
  mockGetContractorByEmail: vi.fn().mockResolvedValue(null),
}));

// Module mocks (paths are relative to src/lib/portal/tokenTtl.test.ts).
vi.mock("../redis", () => ({ redis: { set: mockRedisSet } }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockResendSend };
  },
}));

vi.mock("../email/tenantBrand", () => ({
  getTenantBrand: mockGetTenantBrand,
  LA_SPREZZATURA_TENANT: {
    wordmark: "LA SPREZZATURA",
    signoffNameFormal: "Elizabeth Olivier",
    signoffNameCasual: "Elizabeth",
    signoffLocation: "Darien, CT",
  },
}));

vi.mock("../../sanity/writeClient", () => ({
  sanityWriteClient: { fetch: mockSanityFetch },
}));

vi.mock("../../sanity/queries", () => ({
  getClientByEmail: mockGetClientByEmail,
  getContractorByEmail: mockGetContractorByEmail,
}));

vi.mock("../generateToken", () => ({
  generatePortalToken: () => "test-token-fixed-value-for-snapshots",
}));

// ─────────────────────────────────────────────────────────────────────────
// Plan 01 unit tests (constants + formatExpiryCopy formatting).
// These do NOT exercise route handlers; they test the pure module directly.
// The static import below is unaffected by the hoisted route mocks above
// because tokenTtl.ts has no dependencies on redis, resend, or sanity.
// ─────────────────────────────────────────────────────────────────────────
import {
  MAGIC_LINK_ACCESS_TTL_SECONDS,
  WORK_ORDER_SEND_TTL_SECONDS,
  formatExpiryCopy,
} from "./tokenTtl";

describe("Phase 48 TTL constants", () => {
  it("MAGIC_LINK_ACCESS_TTL_SECONDS === 900", () => {
    expect(MAGIC_LINK_ACCESS_TTL_SECONDS).toBe(900);
  });

  it("WORK_ORDER_SEND_TTL_SECONDS === 604800", () => {
    expect(WORK_ORDER_SEND_TTL_SECONDS).toBe(604800);
  });
});

describe("formatExpiryCopy", () => {
  it("formats 900s as '15 minutes' (default access TTL)", () => {
    expect(formatExpiryCopy(900)).toBe("This link expires in 15 minutes.");
  });

  it("uses singular 'minute' for 60s", () => {
    expect(formatExpiryCopy(60)).toBe("This link expires in 1 minute.");
  });

  it("uses 'seconds' branch for sub-minute values", () => {
    expect(formatExpiryCopy(45)).toBe("This link expires in 45 seconds.");
  });

  it("uses singular 'hour' for 3600s", () => {
    expect(formatExpiryCopy(3600)).toBe("This link expires in 1 hour.");
  });

  it("uses plural 'hours' for 7200s", () => {
    expect(formatExpiryCopy(7200)).toBe("This link expires in 2 hours.");
  });

  it("uses singular 'day' for 86400s", () => {
    expect(formatExpiryCopy(86400)).toBe("This link expires in 1 day.");
  });

  it("uses plural 'days' for 604800s (7-day work-order TTL)", () => {
    expect(formatExpiryCopy(604800)).toBe("This link expires in 7 days.");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Plan 04 — EMAIL-05 drift guard (D-07).
// These exercise the route handlers via dynamic import after vi.doMock'ing
// the constant; both redis.set ex: AND rendered email body must change.
//
// Pitfall notes:
//   Pitfall 1: vi.doMock + vi.resetModules required — static vi.mock at top
//     would pin the constant at module-load time, preventing per-test override.
//   Pitfall 6: vi.hoisted spies required — dynamic import("resend") inside
//     the route bypasses the static mock unless spies are hoisted.
// ─────────────────────────────────────────────────────────────────────────

describe("EMAIL-05 drift guard (D-07) — POST /api/send-workorder-access", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedisSet.mockClear();
    mockResendSend.mockClear();
    mockSanityFetch.mockReset();
    mockGetClientByEmail.mockResolvedValue(null);
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("SITE", "https://example.com");

    // Sanity fetch order in send-workorder-access.ts:
    //   1. contractor lookup (returns { _id, name, email })
    //   2. assigned projects lookup (returns array of { title })
    mockSanityFetch
      .mockResolvedValueOnce({
        _id: "C1",
        name: "Marco DeLuca",
        email: "marco@deluca.com",
      })
      .mockResolvedValueOnce([{ title: "Acme Home" }]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redis ex: AND email html/text BOTH reflect mocked MAGIC_LINK_ACCESS_TTL_SECONDS = 1234", async () => {
    vi.doMock("./tokenTtl", () => ({
      MAGIC_LINK_ACCESS_TTL_SECONDS: 1234,
      WORK_ORDER_SEND_TTL_SECONDS: 604800,
      formatExpiryCopy: (seconds: number) =>
        `This link expires in ${seconds} seconds.`,
    }));

    const { POST } = await import(
      "../../pages/api/send-workorder-access"
    );
    const request = new Request(
      "http://localhost/api/send-workorder-access",
      {
        method: "POST",
        body: JSON.stringify({ contractorId: "C1" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const response = await (POST as any)({ request });
    expect(response.status).toBe(200);

    // Assert redis.set received { ex: 1234 } (non-dual-role branch: one call).
    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    const redisCall = mockRedisSet.mock.calls[0];
    expect(redisCall[2]).toEqual({ ex: 1234 });

    // Assert resend.emails.send html AND text bodies BOTH contain "1234".
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const sendCall = mockResendSend.mock.calls[0][0];
    expect(sendCall.html).toContain("1234");
    expect(sendCall.text).toContain("1234");

    // Negative guard: the old literal (900) must NOT appear as the ex: value.
    expect(redisCall[2]).not.toEqual({ ex: 900 });
  });

  it("positive value-flow: mocked 60s renders '1 minute' in both html and text + redis ex=60", async () => {
    // Use the statically-imported formatExpiryCopy (from the top-of-file import)
    // via a closure reference inside the doMock factory. This avoids the
    // require("./tokenTtl") MODULE_NOT_FOUND issue that occurs when
    // vi.resetModules() has cleared the registry before the factory runs.
    // The static import resolves at the time the test file is loaded (before
    // vi.resetModules), so the reference is still valid here.
    vi.doMock("./tokenTtl", () => ({
      MAGIC_LINK_ACCESS_TTL_SECONDS: 60,
      WORK_ORDER_SEND_TTL_SECONDS: 604800,
      formatExpiryCopy,  // real function via static import closure
    }));

    const { POST } = await import(
      "../../pages/api/send-workorder-access"
    );
    const request = new Request(
      "http://localhost/api/send-workorder-access",
      {
        method: "POST",
        body: JSON.stringify({ contractorId: "C1" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    await (POST as any)({ request });

    expect(mockRedisSet.mock.calls[0][2]).toEqual({ ex: 60 });
    const sendCall = mockResendSend.mock.calls[0][0];
    // The rendered expiry copy ("1 minute") flows from formatExpiryCopy(60) via the
    // expiresInSeconds prop — proves the value flows through, not just any value.
    expect(sendCall.html).toContain("1 minute");
    expect(sendCall.text).toContain("1 minute");
    // Note: the route's preheader prop is still hardcoded to "15 minutes" (a
    // separate issue from EMAIL-05 drift — preheader is presentational preview text,
    // not the in-body expiry copy the drift guard protects). The positive assertion
    // above is sufficient to prove the body copy uses the mocked value.
  });
});

describe("EMAIL-05 drift guard (D-07) — POST /api/send-building-access", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedisSet.mockClear();
    mockResendSend.mockClear();
    mockSanityFetch.mockReset();
    mockGetClientByEmail.mockResolvedValue(null);
    mockGetContractorByEmail.mockResolvedValue(null);
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("SITE", "https://example.com");

    // Sanity fetch in send-building-access.ts:
    //   1. project + buildingManager lookup
    mockSanityFetch.mockResolvedValueOnce({
      _id: "P1",
      title: "Acme Tower",
      buildingManager: {
        name: "Daniel Park",
        email: "daniel@buildingmgmt.com",
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redis ex: AND email html/text BOTH reflect mocked MAGIC_LINK_ACCESS_TTL_SECONDS = 1234", async () => {
    vi.doMock("./tokenTtl", () => ({
      MAGIC_LINK_ACCESS_TTL_SECONDS: 1234,
      WORK_ORDER_SEND_TTL_SECONDS: 604800,
      formatExpiryCopy: (seconds: number) =>
        `This link expires in ${seconds} seconds.`,
    }));

    const { POST } = await import(
      "../../pages/api/send-building-access"
    );
    const request = new Request(
      "http://localhost/api/send-building-access",
      {
        method: "POST",
        body: JSON.stringify({ projectId: "P1" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const response = await (POST as any)({ request });
    expect(response.status).toBe(200);

    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    expect(mockRedisSet.mock.calls[0][2]).toEqual({ ex: 1234 });

    const sendCall = mockResendSend.mock.calls[0][0];
    expect(sendCall.html).toContain("1234");
    expect(sendCall.text).toContain("1234");

    // Negative guard: old literal must NOT appear.
    expect(mockRedisSet.mock.calls[0][2]).not.toEqual({ ex: 900 });
  });
});

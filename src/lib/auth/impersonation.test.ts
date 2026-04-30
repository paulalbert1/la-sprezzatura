import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ----------------------------------------------------------------

const mockRedisGet = vi.fn();
const mockRedisGetdel = vi.fn();
const mockRedisSet = vi.fn().mockResolvedValue("OK");
const mockRedisDel = vi.fn().mockResolvedValue(1);
const mockRedisTtl = vi.fn().mockResolvedValue(1800);

vi.mock("../redis", () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    getdel: (...args: unknown[]) => mockRedisGetdel(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
    del: (...args: unknown[]) => mockRedisDel(...args),
    ttl: (...args: unknown[]) => mockRedisTtl(...args),
  },
}));

const mockGenerateToken: ReturnType<typeof vi.fn> = vi.fn(
  () => "test-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
);
vi.mock("../generateToken", () => ({
  generatePortalToken: (...args: unknown[]) => mockGenerateToken(...args),
}));

// Mock the audit-writer side-effect — Task 2 implements it for real, Task 1
// only verifies that mint awaits/calls it. Stub is identity-safe.
const mockWriteStartAndTimeoutAuditDocs = vi.fn().mockResolvedValue(undefined);
const mockWriteExitAuditDoc = vi.fn().mockResolvedValue(undefined);
const mockGetTenantClient: ReturnType<typeof vi.fn> = vi.fn(() => ({
  create: vi.fn().mockResolvedValue({ _id: "x" }),
  delete: vi.fn().mockResolvedValue({ results: [] }),
}));
vi.mock("../tenantClient", () => ({
  getTenantClient: (...args: unknown[]) => mockGetTenantClient(...args),
}));

// Stub Astro cookies surface used by createImpersonationSession.
function makeCookieStub(seed: Record<string, string> = {}) {
  const store: Record<string, string> = { ...seed };
  const setSpy = vi.fn((name: string, value: string, _opts?: unknown) => {
    store[name] = value;
  });
  const getSpy = vi.fn((name: string) =>
    store[name] === undefined ? undefined : { value: store[name] },
  );
  const deleteSpy = vi.fn((name: string) => {
    delete store[name];
  });
  return {
    set: setSpy,
    get: getSpy,
    delete: deleteSpy,
    _store: store,
    _setSpy: setSpy,
  } as unknown as import("astro").AstroCookies & {
    _store: Record<string, string>;
    _setSpy: typeof setSpy;
  };
}

// --- Module under test ----------------------------------------------------

import {
  hashImpersonationToken,
  mintImpersonationToken,
  redeemImpersonationToken,
  createImpersonationSession,
  type ImpersonationPayload,
} from "./impersonation";
import type { SessionData } from "../session";

beforeEach(() => {
  mockRedisGet.mockReset();
  mockRedisGetdel.mockReset();
  mockRedisSet.mockReset().mockResolvedValue("OK");
  mockRedisDel.mockReset().mockResolvedValue(1);
  mockRedisTtl.mockReset().mockResolvedValue(1800);
  mockGenerateToken.mockReset().mockReturnValue(
    "test-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  mockWriteStartAndTimeoutAuditDocs.mockReset().mockResolvedValue(undefined);
  mockWriteExitAuditDoc.mockReset().mockResolvedValue(undefined);
  mockGetTenantClient.mockReset().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({ _id: "x" }),
    delete: vi.fn().mockResolvedValue({ results: [] }),
  }));
});

// --- Fixtures -------------------------------------------------------------

function makePayload(overrides: Partial<ImpersonationPayload> = {}): ImpersonationPayload {
  return {
    role: "client",
    entityId: "client-123",
    projectId: "project-456",
    tenantId: "tenant-A",
    adminEmail: "liz@lasprezz.com",
    adminEntityId: "admin-liz",
    mintedAt: "2026-04-30T12:00:00.000Z",
    targetEntityName: "Sarah Smith",
    projectName: "Loft Renovation",
    ...overrides,
  };
}

function makeAdminSession(overrides: Partial<SessionData> = {}): SessionData {
  return {
    entityId: "admin-liz",
    role: "admin",
    tenantId: "tenant-A",
    mintedAt: "2026-04-30T11:55:00.000Z",
    ...overrides,
  };
}

// --- Tests ----------------------------------------------------------------

describe("hashImpersonationToken", () => {
  it("Test 1: returns SHA-256 hex of input — never echoes raw token (D-17)", () => {
    // Expected hex computed with:
    //   node -e "console.log(require('crypto').createHash('sha256').update('known-token-abc').digest('hex'))"
    const expected =
      "b9f438d1a6abc9a0ab7bb59945dd241ce19e0a485d4037982f488a158db6113e";
    expect(hashImpersonationToken("known-token-abc")).toBe(expected);
    // Sanity: output never contains the raw input
    expect(hashImpersonationToken("known-token-abc")).not.toContain("known-token-abc");
  });
});

describe("mintImpersonationToken", () => {
  it("Test 2: returns { token, url } with /portal/_enter-impersonation URL shape", async () => {
    mockGenerateToken.mockReturnValueOnce(
      "abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd",
    );
    const result = await mintImpersonationToken({
      payload: makePayload(),
      tenantId: "tenant-A",
    });
    expect(result.token).toBe(
      "abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd",
    );
    expect(result.token.length).toBe(64);
    expect(result.url).toBe(
      "/portal/_enter-impersonation?token=abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd",
    );
  });

  it("Test 3: writes Redis impersonate:<token> with TTL=120s and JSON-stringified payload (D-06)", async () => {
    const payload = makePayload();
    mockGenerateToken.mockReturnValueOnce("tok-task1-test3");
    await mintImpersonationToken({ payload, tenantId: "tenant-A" });

    // The mint MUST hit redis.set with the canonical key + 120s TTL.
    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    const [key, value, opts] = mockRedisSet.mock.calls[0];
    expect(key).toBe("impersonate:tok-task1-test3");
    expect(typeof value).toBe("string");
    expect(JSON.parse(value as string)).toEqual(payload);
    expect(opts).toEqual({ ex: 120 });
  });
});

describe("redeemImpersonationToken", () => {
  it("Test 4: returns null when redis.getdel resolves null (missing/expired)", async () => {
    mockRedisGetdel.mockResolvedValueOnce(null);
    const result = await redeemImpersonationToken("missing-token");
    expect(result).toBeNull();
    expect(mockRedisGetdel).toHaveBeenCalledWith("impersonate:missing-token");
  });

  it("Test 5: happy path — getdel returns JSON string, returns { payload }", async () => {
    const payload = makePayload();
    mockRedisGetdel.mockResolvedValueOnce(JSON.stringify(payload));
    const result = await redeemImpersonationToken("tok-happy");
    expect(result).not.toBeNull();
    expect(result?.payload).toEqual(payload);
  });

  it("Test 6: Pitfall A — Upstash auto-parsed object case still returns { payload }", async () => {
    const payload = makePayload();
    // Upstash auto-parses JSON-shaped values; getdel may yield an object directly.
    mockRedisGetdel.mockResolvedValueOnce(payload);
    const result = await redeemImpersonationToken("tok-obj");
    expect(result).not.toBeNull();
    expect(result?.payload).toEqual(payload);
  });

  it("Test 7: malformed string returns null (does NOT throw)", async () => {
    mockRedisGetdel.mockResolvedValueOnce("not-json{");
    const result = await redeemImpersonationToken("tok-bad");
    expect(result).toBeNull();
  });
});

describe("createImpersonationSession", () => {
  it("Test 8: cookie set with { path:'/', httpOnly:true, sameSite:'lax', maxAge:1800 }", async () => {
    const cookies = makeCookieStub();
    const adminSession = makeAdminSession();
    const payload = makePayload();
    mockGenerateToken.mockReturnValueOnce("session-token-task1-test8");

    await createImpersonationSession(
      cookies,
      adminSession,
      payload,
      "original-admin-token-XYZ",
    );

    expect(cookies._setSpy).toHaveBeenCalledTimes(1);
    const [name, value, opts] = cookies._setSpy.mock.calls[0];
    expect(name).toBe("portal_session");
    expect(value).toBe("session-token-task1-test8");
    expect(opts).toMatchObject({
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1800,
    });
    // `secure` flag tracks import.meta.env.PROD; presence of the key (regardless of value)
    expect(opts).toHaveProperty("secure");
  });

  it("Test 9: Redis session:<token> with ex:1800, payload role==='admin' (D-01), impersonating.entityId === payload.entityId (D-04)", async () => {
    const cookies = makeCookieStub();
    const adminSession = makeAdminSession();
    const payload = makePayload({ entityId: "client-target-D04" });
    mockGenerateToken.mockReturnValueOnce("session-tok-D04");

    await createImpersonationSession(
      cookies,
      adminSession,
      payload,
      "original-admin-token-D04",
    );

    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    const [key, value, opts] = mockRedisSet.mock.calls[0];
    expect(key).toBe("session:session-tok-D04");
    const parsed = JSON.parse(value as string);
    expect(parsed.role).toBe("admin");                          // D-01
    expect(parsed.entityId).toBe(adminSession.entityId);        // D-01
    expect(parsed.impersonating.entityId).toBe("client-target-D04"); // D-04
    expect(opts).toEqual({ ex: 1800 });                         // D-09 30-min hard cap
  });

  it("Test 10: stored payload contains originalAdminSessionToken under impersonating.originalAdminSessionToken (D-15)", async () => {
    const cookies = makeCookieStub();
    const adminSession = makeAdminSession();
    const payload = makePayload();
    mockGenerateToken.mockReturnValueOnce("session-tok-D15");

    await createImpersonationSession(
      cookies,
      adminSession,
      payload,
      "ORIGINAL-ADMIN-TOKEN-D15",
    );

    const [, value] = mockRedisSet.mock.calls[0];
    const parsed = JSON.parse(value as string);
    expect(parsed.impersonating.originalAdminSessionToken).toBe(
      "ORIGINAL-ADMIN-TOKEN-D15",
    );
  });
});

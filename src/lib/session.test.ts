import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const sessionSource = readFileSync(
  resolve(__dirname, "./session.ts"),
  "utf-8",
);

// Phase 49 — runtime tests use a mocked Redis client to capture writes
// and stub reads. The source-grep tests above remain unchanged.
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn().mockResolvedValue("OK");
const mockRedisDel = vi.fn().mockResolvedValue(1);

vi.mock("./redis", () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
    del: (...args: unknown[]) => mockRedisDel(...args),
  },
}));

// Cookie stub — minimal AstroCookies surface used by createSession /
// createPurlSession (only set/get/delete with .value getter).
function makeCookieStub(seed: Record<string, string> = {}) {
  const store: Record<string, string> = { ...seed };
  return {
    set: vi.fn((name: string, value: string) => {
      store[name] = value;
    }),
    get: vi.fn((name: string) =>
      store[name] === undefined ? undefined : { value: store[name] },
    ),
    delete: vi.fn((name: string) => {
      delete store[name];
    }),
    _store: store,
  };
}

describe("session module", () => {
  it("exports createSession function", () => {
    expect(sessionSource).toContain("export async function createSession");
  });

  it("exports getSession function", () => {
    expect(sessionSource).toContain("export async function getSession");
  });

  it("exports clearSession function", () => {
    expect(sessionSource).toContain("export function clearSession");
  });

  it("uses portal_session cookie name", () => {
    expect(sessionSource).toContain("portal_session");
  });

  it("sets 30-day maxAge (2592000 seconds)", () => {
    expect(sessionSource).toContain("2592000");
  });

  it("sets httpOnly to true", () => {
    expect(sessionSource).toContain("httpOnly: true");
  });

  it("sets sameSite to lax", () => {
    expect(sessionSource).toMatch(/sameSite.*lax/i);
  });

  // --- Multi-role session tests (Plan 07-03 Task 1) ---

  it("exports SessionData interface with entityId and role", () => {
    expect(sessionSource).toContain("export interface SessionData");
    expect(sessionSource).toContain("entityId: string");
    expect(sessionSource).toContain("role:");
  });

  it("createSession accepts role parameter with default 'client'", () => {
    // createSession should have a role parameter defaulting to 'client'
    expect(sessionSource).toMatch(
      /createSession[\s\S]*?role.*=.*['"]client['"]/,
    );
  });

  it("createSession stores JSON with entityId and role in Redis", () => {
    // Should use JSON.stringify to store session data
    expect(sessionSource).toContain("JSON.stringify");
    // SessionData must contain entityId and role
    expect(sessionSource).toContain("sessionData: SessionData");
    expect(sessionSource).toContain("JSON.stringify(sessionData)");
  });

  it("getSession returns SessionData | null", () => {
    expect(sessionSource).toMatch(
      /getSession[\s\S]*?:\s*Promise<SessionData\s*\|\s*null>/,
    );
  });

  it("getSession handles legacy plain string values (backward compat)", () => {
    // Should detect legacy sessions and wrap in { entityId, role: 'client' }
    expect(sessionSource).toContain("role: 'client'");
    // Should have backward compatibility comment or logic
    expect(sessionSource).toMatch(/legacy|backward/i);
  });

  it("SessionData role type includes contractor and building_manager", () => {
    expect(sessionSource).toContain("'contractor'");
    expect(sessionSource).toContain("'building_manager'");
  });

  // --- Admin session tests (Plan 29-01 Task 2) ---

  it("SessionData role type includes 'admin'", () => {
    expect(sessionSource).toContain("'admin'");
  });

  it("SessionData has optional tenantId field", () => {
    expect(sessionSource).toContain("tenantId?: string");
  });

  it("createSession accepts 4th parameter for tenantId", () => {
    // createSession should accept tenantId as optional 4th parameter
    expect(sessionSource).toMatch(
      /createSession[\s\S]*?tenantId\??: string/,
    );
  });

  it("createSession stores tenantId in session data when provided", () => {
    expect(sessionSource).toContain("if (tenantId) sessionData.tenantId = tenantId");
  });
});

// --- Phase 49 SessionData extensions (Plan 49-01 Task 1) ---

describe("Phase 49 SessionData extensions", () => {
  beforeEach(() => {
    mockRedisGet.mockReset();
    mockRedisSet.mockReset().mockResolvedValue("OK");
    mockRedisDel.mockReset().mockResolvedValue(1);
  });

  it("SessionData type accepts an impersonating field with all 7 D-02 sub-fields (typecheck-only)", () => {
    // Compile-time assertion: a SessionData literal with the full
    // impersonating sub-shape must typecheck. The runtime check is
    // structural — every required D-02 sub-field is present.
    const sample: import("./session").SessionData = {
      entityId: "admin-123",
      role: "admin",
      tenantId: "tenant-a",
      impersonating: {
        role: "client",
        entityId: "client-1",
        projectId: "project-1",
        tenantId: "tenant-a",
        adminEmail: "liz@lasprezz.com",
        mintedAt: "2026-04-30T12:00:00.000Z",
        originalAdminSessionToken: "orig-token-abc",
      },
    };

    expect(sample.impersonating).toBeDefined();
    expect(sample.impersonating?.role).toBe("client");
    expect(sample.impersonating?.entityId).toBe("client-1");
    expect(sample.impersonating?.projectId).toBe("project-1");
    expect(sample.impersonating?.tenantId).toBe("tenant-a");
    expect(sample.impersonating?.adminEmail).toBe("liz@lasprezz.com");
    expect(sample.impersonating?.mintedAt).toBe("2026-04-30T12:00:00.000Z");
    expect(sample.impersonating?.originalAdminSessionToken).toBe("orig-token-abc");
  });

  it("SessionData type accepts an optional mintedAt string field (typecheck-only)", () => {
    const sample: import("./session").SessionData = {
      entityId: "admin-123",
      role: "admin",
      mintedAt: "2026-04-30T12:00:00.000Z",
    };
    expect(sample.mintedAt).toBe("2026-04-30T12:00:00.000Z");

    // Optional — must also accept omission.
    const sampleNoMint: import("./session").SessionData = {
      entityId: "client-1",
      role: "client",
    };
    expect(sampleNoMint.mintedAt).toBeUndefined();
  });

  it("getSession round-trips an impersonating payload through Redis JSON serialization", async () => {
    const { getSession } = await import("./session");
    const cookies = makeCookieStub({ portal_session: "tok-1" });

    const stored: import("./session").SessionData = {
      entityId: "admin-123",
      role: "admin",
      tenantId: "tenant-a",
      mintedAt: "2026-04-30T12:00:00.000Z",
      impersonating: {
        role: "client",
        entityId: "client-1",
        projectId: "project-1",
        tenantId: "tenant-a",
        adminEmail: "liz@lasprezz.com",
        mintedAt: "2026-04-30T12:00:00.000Z",
        originalAdminSessionToken: "orig-token-abc",
      },
    };
    // Mimic Upstash auto-parsed object return.
    mockRedisGet.mockResolvedValue(stored);

    const result = await getSession(cookies as unknown as Parameters<typeof getSession>[0]);
    expect(result).not.toBeNull();
    expect(result?.impersonating).toEqual(stored.impersonating);
    expect(result?.mintedAt).toBe(stored.mintedAt);
  });

  it("getSession parses a legacy session string without mintedAt without crashing (Pitfall D)", async () => {
    const { getSession } = await import("./session");
    const cookies = makeCookieStub({ portal_session: "tok-legacy" });

    // Legacy sessions written before Phase 49 lack mintedAt.
    mockRedisGet.mockResolvedValue('{"entityId":"x","role":"admin"}');

    const result = await getSession(cookies as unknown as Parameters<typeof getSession>[0]);
    expect(result).not.toBeNull();
    expect(result?.entityId).toBe("x");
    expect(result?.role).toBe("admin");
    expect(result?.mintedAt).toBeUndefined();
  });
});

// --- Phase 49 mintedAt-on-write tests (Plan 49-01 Task 2) ---

describe("Phase 49 mintedAt is set on every session write", () => {
  beforeEach(() => {
    mockRedisGet.mockReset();
    mockRedisSet.mockReset().mockResolvedValue("OK");
    mockRedisDel.mockReset().mockResolvedValue(1);
  });

  it("createSession writes mintedAt as ISO8601 string parseable by new Date()", async () => {
    const { createSession } = await import("./session");
    const cookies = makeCookieStub();

    await createSession(
      cookies as unknown as Parameters<typeof createSession>[0],
      "u@x.com",
      "admin",
      "tenant-1",
    );

    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    const payload = mockRedisSet.mock.calls[0][1] as string;
    const parsed = JSON.parse(payload);
    expect(typeof parsed.mintedAt).toBe("string");
    expect(Number.isNaN(new Date(parsed.mintedAt).getTime())).toBe(false);
    // Strict ISO8601 check: round-trip must be identical.
    expect(new Date(parsed.mintedAt).toISOString()).toBe(parsed.mintedAt);
  });

  it("createPurlSession writes mintedAt as ISO8601 string", async () => {
    const { createPurlSession } = await import("./session");
    const cookies = makeCookieStub();

    await createPurlSession(
      cookies as unknown as Parameters<typeof createPurlSession>[0],
      "client-1",
      "tok",
    );

    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    const payload = mockRedisSet.mock.calls[0][1] as string;
    const parsed = JSON.parse(payload);
    expect(typeof parsed.mintedAt).toBe("string");
    expect(Number.isNaN(new Date(parsed.mintedAt).getTime())).toBe(false);
    expect(new Date(parsed.mintedAt).toISOString()).toBe(parsed.mintedAt);
    // Existing PURL fields stay intact.
    expect(parsed.entityId).toBe("client-1");
    expect(parsed.role).toBe("client");
    expect(parsed.source).toBe("purl");
    expect(typeof parsed.portalTokenHash).toBe("string");
  });

  it("mintedAt is set within the last 5 seconds (clock-bounded sanity)", async () => {
    const { createSession } = await import("./session");
    const cookies = makeCookieStub();

    const before = Date.now();
    await createSession(
      cookies as unknown as Parameters<typeof createSession>[0],
      "u@x.com",
      "admin",
      "tenant-1",
    );
    const after = Date.now();

    const payload = mockRedisSet.mock.calls[0][1] as string;
    const parsed = JSON.parse(payload);
    const mintedAtMs = new Date(parsed.mintedAt).getTime();
    expect(mintedAtMs).toBeGreaterThanOrEqual(before);
    expect(mintedAtMs).toBeLessThanOrEqual(after);
    // Belt-and-braces: also satisfies plan's 5-second window guard.
    expect(mintedAtMs).toBeGreaterThan(Date.now() - 5_000);
    expect(mintedAtMs).toBeLessThanOrEqual(Date.now());
  });
});

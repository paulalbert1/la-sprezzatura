import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ----------------------------------------------------------------

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn().mockResolvedValue("OK");
const mockRedisDel = vi.fn().mockResolvedValue(1);
const mockRedisTtl = vi.fn().mockResolvedValue(1800);

vi.mock("../redis", () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
    del: (...args: unknown[]) => mockRedisDel(...args),
    ttl: (...args: unknown[]) => mockRedisTtl(...args),
    getdel: vi.fn(),
  },
}));

const mockGenerateToken: ReturnType<typeof vi.fn> = vi.fn(
  () => "imp-tok-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
);
vi.mock("../generateToken", () => ({
  generatePortalToken: (...args: unknown[]) => mockGenerateToken(...args),
}));

// Per-test-controllable Sanity client. mockCreate / mockDelete are reset in beforeEach.
const mockCreate: ReturnType<typeof vi.fn> = vi
  .fn()
  .mockResolvedValue({ _id: "audit-doc-1" });
const mockDelete: ReturnType<typeof vi.fn> = vi
  .fn()
  .mockResolvedValue({ results: [] });
const mockGetTenantClient: ReturnType<typeof vi.fn> = vi.fn(() => ({
  create: mockCreate,
  delete: mockDelete,
}));
vi.mock("../tenantClient", () => ({
  getTenantClient: (...args: unknown[]) => mockGetTenantClient(...args),
}));

// Cookie stub
function makeCookieStub(seed: Record<string, string> = {}) {
  const store: Record<string, string> = { ...seed };
  const setSpy = vi.fn((name: string, value: string, _opts?: unknown) => {
    store[name] = value;
  });
  const deleteSpy = vi.fn((name: string) => {
    delete store[name];
  });
  return {
    set: setSpy,
    get: vi.fn((name: string) =>
      store[name] === undefined ? undefined : { value: store[name] },
    ),
    delete: deleteSpy,
    _store: store,
    _setSpy: setSpy,
    _deleteSpy: deleteSpy,
  } as unknown as import("astro").AstroCookies & {
    _store: Record<string, string>;
    _setSpy: typeof setSpy;
    _deleteSpy: typeof deleteSpy;
  };
}

// --- Module under test ----------------------------------------------------

import {
  writeStartAndTimeoutAuditDocs,
  writeExitAuditDoc,
  writeAdminLogoutAuditDoc,
  exitImpersonation,
  hashImpersonationToken,
  mintImpersonationToken,
  type ImpersonationPayload,
} from "./impersonation";

beforeEach(() => {
  mockRedisGet.mockReset();
  mockRedisSet.mockReset().mockResolvedValue("OK");
  mockRedisDel.mockReset().mockResolvedValue(1);
  mockRedisTtl.mockReset().mockResolvedValue(1800);
  mockGenerateToken
    .mockReset()
    .mockReturnValue(
      "imp-tok-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
  mockCreate.mockReset().mockResolvedValue({ _id: "audit-doc-1" });
  mockDelete.mockReset().mockResolvedValue({ results: [] });
  mockGetTenantClient.mockReset().mockImplementation(() => ({
    create: mockCreate,
    delete: mockDelete,
  }));
});

// --- Fixtures -------------------------------------------------------------

function makePayload(
  overrides: Partial<ImpersonationPayload> = {},
): ImpersonationPayload {
  return {
    role: "client",
    entityId: "client-target-1",
    projectId: "project-1",
    tenantId: "tenant-A",
    adminEmail: "liz@lasprezz.com",
    adminEntityId: "admin-liz",
    mintedAt: "2026-04-30T12:00:00.000Z",
    targetEntityName: "Sarah Smith",
    projectName: "Loft Renovation",
    ...overrides,
  };
}

// --- Tests ----------------------------------------------------------------

describe("writeStartAndTimeoutAuditDocs", () => {
  it("Test 1: writes TWO docs in parallel — start (eventType=start, exitedAt=null, exitReason=null) AND timeout (eventType=timeout, exitedAt=mintedAt+30min, exitReason=ttl)", async () => {
    const payload = makePayload({ mintedAt: "2026-04-30T12:00:00.000Z" });
    await writeStartAndTimeoutAuditDocs("tenant-A", payload, "tok-test1");

    expect(mockCreate).toHaveBeenCalledTimes(2);
    const docs = mockCreate.mock.calls.map((c) => c[0]);
    const startDoc = docs.find((d) => d.eventType === "start");
    const timeoutDoc = docs.find((d) => d.eventType === "timeout");

    expect(startDoc).toBeDefined();
    expect(startDoc.eventType).toBe("start");
    expect(startDoc.exitedAt).toBeNull();
    expect(startDoc.exitReason).toBeNull();

    expect(timeoutDoc).toBeDefined();
    expect(timeoutDoc.eventType).toBe("timeout");
    // mintedAt + 1800s = 12:00:00 + 30min = 12:30:00
    expect(timeoutDoc.exitedAt).toBe("2026-04-30T12:30:00.000Z");
    expect(timeoutDoc.exitReason).toBe("ttl");
  });

  it("Test 2: uses getTenantClient(tenantId) — never sanityWriteClient (D-19)", async () => {
    await writeStartAndTimeoutAuditDocs(
      "tenant-Z",
      makePayload({ tenantId: "tenant-Z" }),
      "tok-test2",
    );
    expect(mockGetTenantClient).toHaveBeenCalledWith("tenant-Z");
    expect(mockGetTenantClient).toHaveBeenCalledTimes(1);
  });

  it("Test 3: both audit docs share sessionId === hashImpersonationToken(token)", async () => {
    const token = "shared-token-test3";
    const expectedSessionId = hashImpersonationToken(token);
    await writeStartAndTimeoutAuditDocs("tenant-A", makePayload(), token);

    const docs = mockCreate.mock.calls.map((c) => c[0]);
    expect(docs).toHaveLength(2);
    for (const doc of docs) {
      expect(doc.sessionId).toBe(expectedSessionId);
    }
    // Belt-and-braces: sessionId is NEVER the raw token
    for (const doc of docs) {
      expect(doc.sessionId).not.toBe(token);
    }
  });

  it("Test 4: both audit docs include all required D-17 fields + denormalized optionals", async () => {
    const payload = makePayload();
    await writeStartAndTimeoutAuditDocs("tenant-A", payload, "tok-test4");

    const docs = mockCreate.mock.calls.map((c) => c[0]);
    const required = [
      "tenantId",
      "sessionId",
      "eventType",
      "adminEmail",
      "adminEntityId",
      "targetRole",
      "targetEntityId",
      "projectId",
      "mintedAt",
    ];
    const denormalized = ["targetEntityName", "projectName"];
    for (const doc of docs) {
      expect(doc._type).toBe("impersonationAudit");
      for (const f of required) {
        expect(doc).toHaveProperty(f);
      }
      for (const f of denormalized) {
        expect(doc).toHaveProperty(f);
      }
    }
    // Spot-check actual values
    expect(docs[0].adminEmail).toBe(payload.adminEmail);
    expect(docs[0].adminEntityId).toBe(payload.adminEntityId);
    expect(docs[0].targetRole).toBe(payload.role);
    expect(docs[0].targetEntityId).toBe(payload.entityId);
    expect(docs[0].targetEntityName).toBe(payload.targetEntityName);
    expect(docs[0].projectId).toBe(payload.projectId);
    expect(docs[0].projectName).toBe(payload.projectName);
    expect(docs[0].mintedAt).toBe(payload.mintedAt);
  });
});

describe("writeExitAuditDoc", () => {
  it("Test 5: with reason='manual' — deletes timeout-doc by GROQ + creates exit doc, BOTH via Promise.all", async () => {
    const payload = makePayload();
    const sid = hashImpersonationToken("imp-tok-test5");
    await writeExitAuditDoc("tenant-A", sid, payload, "manual");

    // Delete called with the GROQ deleteByQuery shape
    expect(mockDelete).toHaveBeenCalledTimes(1);
    const [delArg] = mockDelete.mock.calls[0];
    expect(delArg).toMatchObject({
      query:
        '*[_type == "impersonationAudit" && sessionId == $sid && eventType == "timeout"]',
      params: { sid },
    });

    // Create called with the exit doc
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [createArg] = mockCreate.mock.calls[0];
    expect(createArg.eventType).toBe("exit");
    expect(createArg.exitReason).toBe("manual");
    expect(createArg.sessionId).toBe(sid);
    expect(typeof createArg.exitedAt).toBe("string");
    // exitedAt is roughly now (within 5s)
    const exitedAtMs = new Date(createArg.exitedAt).getTime();
    expect(Math.abs(Date.now() - exitedAtMs)).toBeLessThan(5_000);
  });

  it("Test 6: with reason='admin-logout' — exit doc carries exitReason='admin-logout'", async () => {
    const payload = makePayload();
    const sid = hashImpersonationToken("imp-tok-test6");
    await writeExitAuditDoc("tenant-A", sid, payload, "admin-logout");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [createArg] = mockCreate.mock.calls[0];
    expect(createArg.eventType).toBe("exit");
    expect(createArg.exitReason).toBe("admin-logout");
  });

  it("Test 6b: writeAdminLogoutAuditDoc is the convenience wrapper (D-20)", async () => {
    const payload = makePayload();
    const sid = hashImpersonationToken("imp-tok-test6b");
    await writeAdminLogoutAuditDoc("tenant-A", sid, payload);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [createArg] = mockCreate.mock.calls[0];
    expect(createArg.eventType).toBe("exit");
    expect(createArg.exitReason).toBe("admin-logout");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});

describe("exitImpersonation", () => {
  it("Test 7: happy path — original admin session present, cookie restored, impersonation key deleted, audit doc written", async () => {
    const cookies = makeCookieStub({ portal_session: "current-imp-session" });
    const payload = makePayload();
    const sid = hashImpersonationToken("current-imp-token");

    // Original admin session is still in Redis with 1500s remaining.
    mockRedisGet.mockResolvedValueOnce(
      JSON.stringify({
        entityId: "admin-liz",
        role: "admin",
        tenantId: "tenant-A",
      }),
    );
    mockRedisTtl.mockResolvedValueOnce(1500);

    const result = await exitImpersonation(
      cookies,
      "current-imp-session",
      "ORIG-ADMIN-TOK",
      "tenant-A",
      sid,
      payload,
    );

    expect(result).toEqual({ ok: true });

    // Cookie was rewritten to ORIG-ADMIN-TOK with the remaining TTL.
    expect(cookies._setSpy).toHaveBeenCalledTimes(1);
    const [name, value, opts] = cookies._setSpy.mock.calls[0];
    expect(name).toBe("portal_session");
    expect(value).toBe("ORIG-ADMIN-TOK");
    expect(opts).toMatchObject({
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1500,
    });

    // Impersonation session key was deleted (awaited — not fire-and-forget).
    expect(mockRedisDel).toHaveBeenCalledWith("session:current-imp-session");

    // Exit audit doc was written (manual).
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [createArg] = mockCreate.mock.calls[0];
    expect(createArg.eventType).toBe("exit");
    expect(createArg.exitReason).toBe("manual");
    expect(createArg.sessionId).toBe(sid);

    // Timeout doc was deleted as part of the exit audit.
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("Test 8: D-16 — original admin session is gone — returns { ok:false, reason:'session-expired' }, cookie cleared (not rewritten)", async () => {
    const cookies = makeCookieStub({ portal_session: "current-imp-session" });
    mockRedisGet.mockResolvedValueOnce(null); // original admin session vanished

    const result = await exitImpersonation(
      cookies,
      "current-imp-session",
      "ORIG-ADMIN-TOK-GONE",
      "tenant-A",
      hashImpersonationToken("tok"),
      makePayload(),
    );

    expect(result).toEqual({ ok: false, reason: "session-expired" });
    // Cookie was deleted, not rewritten with new value.
    expect(cookies._deleteSpy).toHaveBeenCalledWith("portal_session", {
      path: "/",
    });
    expect(cookies._setSpy).not.toHaveBeenCalled();
    // No audit write should have happened (exit is aborted).
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("Test 9: Pitfall E — Sanity audit creates are awaited (function does NOT resolve before tc.create resolves)", async () => {
    // Make tc.create take 50ms; the function must wait for it.
    let createResolved = false;
    mockCreate.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            createResolved = true;
            resolve({ _id: "x" });
          }, 50),
        ),
    );

    await writeExitAuditDoc(
      "tenant-A",
      hashImpersonationToken("tok-test9"),
      makePayload(),
      "manual",
    );

    // If writeExitAuditDoc didn't await, createResolved would still be false here.
    expect(createResolved).toBe(true);
  });
});

describe("mintImpersonationToken — Task 2 verification (audit hook is wired)", () => {
  it("calls writeStartAndTimeoutAuditDocs (NOT a stub) — produces 2 audit-doc creates", async () => {
    const payload = makePayload();
    mockGenerateToken.mockReturnValueOnce("mint-task2-tok");

    await mintImpersonationToken({ payload, tenantId: "tenant-A" });

    // 1 redis.set (impersonate:<token>) AND 2 tc.create (start + timeout audit docs)
    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    expect(mockRedisSet.mock.calls[0][0]).toBe("impersonate:mint-task2-tok");
    expect(mockCreate).toHaveBeenCalledTimes(2);
    const eventTypes = mockCreate.mock.calls.map((c) => c[0].eventType).sort();
    expect(eventTypes).toEqual(["start", "timeout"]);
  });
});

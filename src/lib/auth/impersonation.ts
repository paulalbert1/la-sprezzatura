/**
 * Phase 49 Plan 03 — Impersonation auth library.
 *
 * Single dependency for Plan 04 (mint endpoint), Plan 05 (redeem route),
 * and Plan 06 (exit + admin-logout endpoints). All Redis writes for
 * impersonation, all Sanity audit writes, all token hashing, and all
 * defensive Upstash parsing live here. Route handlers stay thin.
 *
 * Key invariants:
 *  - hashImpersonationToken returns SHA-256 hex; the audit log NEVER stores
 *    raw tokens (D-17).
 *  - mintImpersonationToken writes Redis impersonate:<token> (TTL 120s, D-06)
 *    AND audit start/timeout docs in parallel (D-18, RESEARCH Pitfall E:
 *    never fire-and-forget).
 *  - redeemImpersonationToken uses redis.getdel for one-shot redemption
 *    (D-08) and defensive Upstash parsing (Pitfall A).
 *  - createImpersonationSession keeps role='admin' (D-01) and stashes the
 *    original admin session token inside `impersonating.originalAdminSessionToken`
 *    (D-15) for cookie-restore at exit time. TTL is 30 min (D-09 / IMPER-04).
 *  - All audit writes go via getTenantClient(tenantId); never sanityWriteClient
 *    (D-19).
 *
 * See .planning/phases/49-impersonation-architecture/49-CONTEXT.md
 * (D-01, D-04, D-06, D-08, D-09, D-15, D-17, D-18, D-19, D-20).
 */
import { createHash } from "node:crypto";
import type { AstroCookies } from "astro";

import { redis } from "../redis";
import { generatePortalToken } from "../generateToken";
import { getTenantClient } from "../tenantClient";
import type { SessionData } from "../session";

const COOKIE_NAME = "portal_session";
// TTLs are inlined at the redis.set call sites (ex: 120 / ex: 1800) per
// PLAN done-criteria pattern checks; documented here for clarity:
//   - Mint one-shot: 120s (D-06)
//   - Session hard cap: 1800s = 30 min (D-09 / IMPER-04)
const SESSION_TTL_MS = 1800 * 1000;

// --- Types ----------------------------------------------------------------

/**
 * Payload shape for impersonation mint/redeem/session — superset of the
 * `SessionData.impersonating` sub-shape from Plan 49-01 (D-02), with the
 * denormalized fields the audit doc needs (D-17).
 */
export interface ImpersonationPayload {
  role: "client" | "contractor" | "building_manager";
  entityId: string;
  projectId: string;
  tenantId: string;
  adminEmail: string;
  /**
   * The admin's entityId (the impersonator). Required for audit attribution
   * (D-17) — distinct from `entityId` above which is the impersonation TARGET.
   */
  adminEntityId: string;
  mintedAt: string;
  // Denormalized for audit-doc readability (D-17):
  targetEntityName: string;
  projectName: string;
}

// --- Hash helper ----------------------------------------------------------

/**
 * SHA-256 hex of the input. Used to derive `sessionId` in audit docs so the
 * log never doubles as a credential cache (D-17). Colocated here rather than
 * extracted from src/lib/portal/portalTokenHash.ts to avoid cross-domain
 * coupling (RESEARCH § "Don't Hand-Roll").
 */
export function hashImpersonationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// --- Mint -----------------------------------------------------------------

/**
 * Mint a one-shot impersonation token. Writes the impersonate:<token> Redis
 * key with TTL 120s AND triggers the start+timeout audit-doc pair in parallel
 * (Pitfall E — always await; never fire-and-forget).
 *
 * Returns the token + the redeem URL for the caller (Phase 50 UI opens it
 * in a new tab — Phase 49 itself never opens windows).
 */
export async function mintImpersonationToken(args: {
  payload: ImpersonationPayload;
  tenantId: string;
}): Promise<{ token: string; url: string }> {
  const { payload, tenantId } = args;
  const token = generatePortalToken(32);

  const redisWrite = redis.set(
    `impersonate:${token}`,
    JSON.stringify(payload),
    { ex: 120 }, // D-06 — one-shot mint TTL
  );
  const auditWrites = writeStartAndTimeoutAuditDocs(tenantId, payload, token);

  // Pitfall E — both writes must complete before we return; parallelize but await.
  await Promise.all([redisWrite, auditWrites]);

  return {
    token,
    url: `/portal/_enter-impersonation?token=${token}`,
  };
}

// --- Redeem ---------------------------------------------------------------

/**
 * Redeem the one-shot impersonation token via redis.getdel (atomic at the
 * Redis protocol level — race-safe by definition; D-08, RESEARCH § "Don't
 * Hand-Roll"). Returns null on miss/expired/malformed payload.
 *
 * Defensive Upstash parsing (Pitfall A): the Upstash JS client auto-parses
 * JSON-shaped values, so the result may be either an object OR a string.
 * The triple-branch below mirrors src/pages/portal/verify.astro:23-35 and
 * src/lib/session.ts:181-200.
 */
export async function redeemImpersonationToken(
  token: string,
): Promise<{ payload: ImpersonationPayload } | null> {
  const raw = await redis.getdel(`impersonate:${token}`);
  if (raw == null) return null;

  // Branch 1: Upstash auto-parsed the JSON; raw is already an object.
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (
      typeof obj.entityId === "string" &&
      typeof obj.role === "string" &&
      typeof obj.tenantId === "string"
    ) {
      return { payload: obj as unknown as ImpersonationPayload };
    }
    return null;
  }

  // Branch 2: raw is a string — try JSON.parse, fail closed.
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.entityId === "string" &&
        typeof parsed.role === "string" &&
        typeof parsed.tenantId === "string"
      ) {
        return { payload: parsed as ImpersonationPayload };
      }
      return null;
    } catch {
      return null;
    }
  }

  // Branch 3: unrecognized shape (number, boolean, …) — fail closed.
  return null;
}

// --- Session creation -----------------------------------------------------

/**
 * Mint the wrapped admin session that powers an impersonation tab. The
 * session keeps `role: 'admin'` and `entityId: <adminEntityId>` (D-01) — the
 * impersonated identity lives ONLY inside `impersonating` (D-02). Middleware
 * (Plan 07) reads `impersonating` to mirror viewer identity into Astro.locals
 * (D-04).
 *
 * Structural twin of src/lib/session.ts createPurlSession (L128-158).
 * Returns the new session token.
 */
export async function createImpersonationSession(
  cookies: AstroCookies,
  adminSession: SessionData,
  payload: ImpersonationPayload,
  originalAdminSessionToken: string,
): Promise<string> {
  const sessionToken = generatePortalToken(32);
  const sessionData: SessionData = {
    entityId: adminSession.entityId, // STAYS admin (D-01)
    role: 'admin',                   // STAYS admin (D-01)
    tenantId: adminSession.tenantId,
    mintedAt: new Date().toISOString(),
    impersonating: {
      role: payload.role,
      entityId: payload.entityId,
      projectId: payload.projectId,
      tenantId: payload.tenantId,
      adminEmail: payload.adminEmail,
      mintedAt: payload.mintedAt,
      originalAdminSessionToken,
    },
  };
  await redis.set(
    `session:${sessionToken}`,
    JSON.stringify(sessionData),
    { ex: 1800 }, // D-09 / IMPER-04 — 30-min hard cap
  );

  cookies.set(COOKIE_NAME, sessionToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1800,
    secure: import.meta.env.PROD,
  });

  return sessionToken;
}

// --- Audit writers --------------------------------------------------------

/**
 * Build the shared audit-doc body shared by start, timeout, and exit events
 * (D-17). All required fields per the impersonationAudit Sanity schema (Plan
 * 49-02) are populated here.
 */
function buildAuditDocBase(
  tenantId: string,
  sessionId: string,
  payload: ImpersonationPayload,
) {
  return {
    _type: "impersonationAudit" as const,
    tenantId,
    sessionId,
    adminEmail: payload.adminEmail,
    adminEntityId: payload.adminEntityId,
    targetRole: payload.role,
    targetEntityId: payload.entityId,
    targetEntityName: payload.targetEntityName,
    projectId: payload.projectId,
    projectName: payload.projectName,
    mintedAt: payload.mintedAt,
  };
}

/**
 * Write BOTH the 'start' audit doc AND the pre-written 'timeout' doc at mint
 * time, in parallel (D-18 / Pattern 4). If the admin never exits, the timeout
 * doc remains as the IMPER-06 "every timeout creates an entry" row. Manual
 * exit deletes the timeout doc and creates a fresh exit doc — see
 * writeExitAuditDoc.
 *
 * Tenant-scoped via getTenantClient (D-19). NEVER sanityWriteClient.
 */
export async function writeStartAndTimeoutAuditDocs(
  tenantId: string,
  payload: ImpersonationPayload,
  token: string,
): Promise<void> {
  const tc = getTenantClient(tenantId);
  const sessionId = hashImpersonationToken(token);
  const exitedAt = new Date(
    new Date(payload.mintedAt).getTime() + SESSION_TTL_MS,
  ).toISOString();
  const base = buildAuditDocBase(tenantId, sessionId, payload);

  await Promise.all([
    tc.create({ ...base, eventType: "start", exitedAt: null, exitReason: null }),
    tc.create({ ...base, eventType: "timeout", exitedAt, exitReason: "ttl" }),
  ]);
}

/**
 * On manual exit OR admin-logout: atomically delete the pre-written timeout
 * doc by sessionId AND create a fresh exit doc, both via Promise.all
 * (D-18, Pitfall E). Never fire-and-forget.
 *
 * Tenant-scoped via getTenantClient (D-19).
 */
export async function writeExitAuditDoc(
  tenantId: string,
  sessionIdHash: string,
  payload: ImpersonationPayload,
  exitReason: "manual" | "admin-logout",
): Promise<void> {
  const tc = getTenantClient(tenantId);
  const exitedAt = new Date().toISOString();
  const base = buildAuditDocBase(tenantId, sessionIdHash, payload);

  await Promise.all([
    tc.delete({
      query:
        '*[_type == "impersonationAudit" && sessionId == $sid && eventType == "timeout"]',
      params: { sid: sessionIdHash },
    }),
    tc.create({
      ...base,
      eventType: "exit",
      exitedAt,
      exitReason,
    }),
  ]);
}

/**
 * Convenience wrapper for the admin-logout path (D-20). Same shape as
 * writeExitAuditDoc but pins exitReason='admin-logout' so the call site at
 * /api/admin/logout doesn't have to know the enum.
 */
export async function writeAdminLogoutAuditDoc(
  tenantId: string,
  sessionIdHash: string,
  payload: ImpersonationPayload,
): Promise<void> {
  await writeExitAuditDoc(tenantId, sessionIdHash, payload, "admin-logout");
}

// --- Exit -----------------------------------------------------------------

/**
 * Exit an active impersonation session. Restores the original admin cookie
 * (D-15), deletes the impersonation session Redis key, and writes the
 * 'manual' exit audit doc. If the original admin session is gone (Redis
 * flush, manual eviction), clears the cookie and signals session-expired so
 * the route handler can redirect to /admin/login?reason=session-expired
 * (D-16).
 *
 * All Redis + Sanity writes are awaited (Pitfall E, PATTERNS exit step 5 —
 * never fire-and-forget the impersonation key delete; race-critical).
 */
export async function exitImpersonation(
  cookies: AstroCookies,
  currentImpersonationToken: string,
  originalAdminSessionToken: string,
  tenantId: string,
  sessionIdHash: string,
  payload: ImpersonationPayload,
): Promise<{ ok: true } | { ok: false; reason: "session-expired" }> {
  // D-16 — verify the original admin session still resolves before rewriting cookie.
  const adminRaw = await redis.get(`session:${originalAdminSessionToken}`);
  if (adminRaw == null) {
    cookies.delete(COOKIE_NAME, { path: "/" });
    return { ok: false, reason: "session-expired" };
  }

  // PATTERNS exit Cookie-restore — use remaining TTL so we don't extend the
  // admin session beyond its original lifetime. Floor at 60s to keep the
  // cookie alive for the exit-redirect round-trip even if the underlying
  // admin session is about to expire.
  const adminTtlRemaining = await redis.ttl(
    `session:${originalAdminSessionToken}`,
  );
  const cookieMaxAge = Math.max(adminTtlRemaining ?? 0, 60);

  cookies.set(COOKIE_NAME, originalAdminSessionToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: cookieMaxAge,
    secure: import.meta.env.PROD,
  });

  // Delete the impersonation session key + write the exit audit doc in parallel.
  // Both must complete (no fire-and-forget) so we know the session is gone
  // and the audit row is durable before the response returns.
  await Promise.all([
    redis.del(`session:${currentImpersonationToken}`),
    writeExitAuditDoc(tenantId, sessionIdHash, payload, "manual"),
  ]);

  return { ok: true };
}

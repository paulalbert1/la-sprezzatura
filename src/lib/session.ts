import { redis } from "./redis";
import { generatePortalToken } from "./generateToken";
import { hashPortalToken } from "./portal/portalTokenHash";
import type { AstroCookies } from "astro";

const COOKIE_NAME = "portal_session";
const SESSION_TTL = 2592000; // 30 days in seconds
// Bumped from 7d to 30d (parity with admin SESSION_TTL). The original 7d
// limited forwarded-link exposure, but the operator's actual usage pattern
// is "send a Send Update email; client may not click for weeks." A 7-day
// session forced a re-click at the email link every week. 30 days lets a
// client stay logged in across a typical multi-week design review cycle
// without re-clicking. Token regeneration still kills every active PURL
// session for that client (middleware re-derives portalTokenHash every
// /portal/* request), so the manual revoke escape hatch remains.
const PURL_SESSION_TTL = 2592000; // 30 days in seconds

/**
 * Session data stored in Redis for authenticated users.
 * Supports multiple roles: client, contractor, building_manager, admin.
 *
 * Phase 34 Plan 06 adds two OPTIONAL fields for PURL (Portal URL)
 * sessions derived from a client.portalToken — distinct from email-
 * verified sessions created by /portal/verify. These fields are
 * backward compatible: existing sessions have neither field set.
 */
export interface SessionData {
  entityId: string;
  role: 'client' | 'contractor' | 'building_manager' | 'admin';
  tenantId?: string;  // Present when role === 'admin'
  /**
   * Distinguishes PURL-derived sessions from email-verified sessions.
   * When source === 'purl', middleware applies extra restrictions:
   *   - Read-only gate: any non-GET /api/* request returns 401 (T-34-08)
   *   - Hash re-validation: every /portal/* request re-derives the
   *     current client.portalToken hash and rejects on mismatch (T-34-07)
   */
  source?: 'purl';
  /**
   * SHA-256 base64 hash of the client.portalToken at session-creation time.
   * Middleware compares this to a fresh hash derived from the current
   * client.portalToken. A mismatch means the token was regenerated, which
   * invalidates this session (Liz's "regenerate = kill all active access"
   * mental model per D-22 / Plan 06 T-34-07).
   */
  portalTokenHash?: string;
}

/**
 * Create a new session for an authenticated user.
 * Generates a random session token, stores JSON { entityId, role, tenantId? } in Redis
 * with 30-day TTL, and sets an httpOnly cookie on the response.
 *
 * The role parameter defaults to 'client' for backward compatibility with
 * existing call sites (e.g., portal/verify.astro).
 *
 * The optional tenantId parameter is used for admin sessions to scope
 * data access to a specific tenant.
 */
export async function createSession(
  cookies: AstroCookies,
  entityId: string,
  role: SessionData['role'] = 'client',
  tenantId?: string,
): Promise<string> {
  const sessionToken = generatePortalToken(32);
  const sessionData: SessionData = { entityId, role };
  if (tenantId) sessionData.tenantId = tenantId;
  await redis.set(`session:${sessionToken}`, JSON.stringify(sessionData), { ex: SESSION_TTL });

  cookies.set(COOKIE_NAME, sessionToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL, // 2592000 = 30 days
    secure: import.meta.env.PROD,
  });

  return sessionToken;
}

/**
 * Create a PURL (Portal URL) session for a client who arrived via a
 * /portal/client/{portalToken} link.
 *
 * Differs from createSession in three ways:
 *   1. Role is always 'client' (no override).
 *   2. TTL is 7 days (604800s), not 30 days — limits forwarded-link exposure.
 *   3. Writes { source: 'purl', portalTokenHash } to the session so the
 *      middleware can enforce hash re-validation on every /portal/* request
 *      and reject mutation endpoints (Phase 34 Plan 06 T-34-07, T-34-08).
 *
 * The portalToken parameter is hashed at session-create time and the RAW
 * token is never stored in Redis or the cookie — only the SHA-256 base64
 * hash lives in the session. Middleware hashes the current client.portalToken
 * on every request and compares with timingSafeEqualHash.
 */
export async function createPurlSession(
  cookies: AstroCookies,
  clientId: string,
  portalToken: string,
): Promise<string> {
  const sessionToken = generatePortalToken(32);
  const sessionData: SessionData = {
    entityId: clientId,
    role: 'client',
    source: 'purl',
    portalTokenHash: hashPortalToken(portalToken),
  };
  await redis.set(
    `session:${sessionToken}`,
    JSON.stringify(sessionData),
    { ex: PURL_SESSION_TTL },
  );

  cookies.set(COOKIE_NAME, sessionToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: PURL_SESSION_TTL, // 604800 = 7 days
    secure: import.meta.env.PROD,
  });

  return sessionToken;
}

/**
 * Validate the current session cookie.
 * Returns SessionData if session is valid, null otherwise.
 *
 * Backward compatibility: if Redis value is a plain string (legacy format
 * from before multi-role upgrade), treat as a client session with
 * { entityId: value, role: 'client' }.
 */
export async function getSession(
  cookies: AstroCookies,
): Promise<SessionData | null> {
  const sessionToken = cookies.get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const raw = await redis.get(`session:${sessionToken}`);
  if (!raw) {
    // Session expired or invalid -- clean up cookie
    cookies.delete(COOKIE_NAME, { path: "/" });
    return null;
  }

  // Upstash auto-parses JSON, so raw may already be an object
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (obj.entityId && obj.role) return obj as unknown as SessionData;
  }

  // String format: try JSON parse
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.entityId && parsed?.role) return parsed as SessionData;
    } catch {
      // Legacy format: plain clientId string
      return { entityId: raw, role: 'client' };
    }
  }

  // Unrecognized format
  cookies.delete(COOKIE_NAME, { path: "/" });
  return null;
}

/**
 * Clear the session cookie and delete the session from Redis.
 */
export function clearSession(cookies: AstroCookies): void {
  const sessionToken = cookies.get(COOKIE_NAME)?.value;
  if (sessionToken) {
    // Fire-and-forget Redis delete (don't await to avoid blocking redirect)
    redis.del(`session:${sessionToken}`).catch(() => {});
  }
  cookies.delete(COOKIE_NAME, { path: "/" });
}

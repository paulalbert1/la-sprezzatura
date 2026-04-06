import { redis } from "./redis";
import { generatePortalToken } from "./generateToken";
import type { AstroCookies } from "astro";

const COOKIE_NAME = "portal_session";
const SESSION_TTL = 2592000; // 30 days in seconds

/**
 * Session data stored in Redis for authenticated users.
 * Supports multiple roles: client, contractor, building_manager.
 */
export interface SessionData {
  entityId: string;
  role: 'client' | 'contractor' | 'building_manager' | 'admin';
}

/**
 * Create a new session for an authenticated user.
 * Generates a random session token, stores JSON { entityId, role } in Redis
 * with 30-day TTL, and sets an httpOnly cookie on the response.
 *
 * The role parameter defaults to 'client' for backward compatibility with
 * existing call sites (e.g., portal/verify.astro).
 */
export async function createSession(
  cookies: AstroCookies,
  entityId: string,
  role: SessionData['role'] = 'client',
): Promise<string> {
  const sessionToken = generatePortalToken(32);
  const sessionData: SessionData = { entityId, role };
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

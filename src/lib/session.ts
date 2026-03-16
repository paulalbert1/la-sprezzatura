import { redis } from "./redis";
import { generatePortalToken } from "./generateToken";
import type { AstroCookies } from "astro";

const COOKIE_NAME = "portal_session";
const SESSION_TTL = 2592000; // 30 days in seconds

/**
 * Create a new session for a client.
 * Generates a random session token, stores clientId in Redis with 30-day TTL,
 * and sets an httpOnly cookie on the response.
 */
export async function createSession(
  cookies: AstroCookies,
  clientId: string,
): Promise<string> {
  const sessionToken = generatePortalToken(32);
  await redis.set(`session:${sessionToken}`, clientId, { ex: SESSION_TTL });

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
 * Returns the clientId if session is valid, null otherwise.
 */
export async function getSession(
  cookies: AstroCookies,
): Promise<string | null> {
  const sessionToken = cookies.get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const clientId = await redis.get<string>(`session:${sessionToken}`);
  if (!clientId) {
    // Session expired or invalid -- clean up cookie
    cookies.delete(COOKIE_NAME, { path: "/" });
    return null;
  }

  return clientId;
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

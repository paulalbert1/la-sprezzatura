import { randomBytes } from "node:crypto";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a cryptographically random alphanumeric token.
 *
 * Uses Node.js crypto.randomBytes which is available in all Node.js
 * environments (server, test, Vite SSR). When this module is imported
 * in a browser context (Sanity Studio), Vite bundles a polyfill for
 * the node:crypto module automatically.
 */
export function generatePortalToken(length = 8): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((byte) => CHARSET[byte % CHARSET.length])
    .join("");
}

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Fill a Uint8Array with cryptographically random bytes.
 * Uses Web Crypto API in browsers and Node 20+, falls back to
 * Node.js crypto.randomBytes for older Node versions (18.x).
 */
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    // Browser and Node 20+ (Web Crypto API)
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }

  // Node.js < 20 fallback (test environments, SSR)
  // Dynamic require to avoid bundler issues in browser contexts
  try {
    const nodeCrypto = require("node:crypto") as typeof import("node:crypto");
    const buf = nodeCrypto.randomBytes(length);
    bytes.set(buf);
    return bytes;
  } catch {
    throw new Error(
      "No cryptographic random source available. " +
        "Requires Web Crypto API or Node.js crypto module.",
    );
  }
}

/**
 * Generate a cryptographically random alphanumeric token.
 * Works in browsers (Sanity Studio initialValue) and Node.js (server, tests).
 */
export function generatePortalToken(length = 8): string {
  const bytes = getRandomBytes(length);
  return Array.from(bytes)
    .map((byte) => CHARSET[byte % CHARSET.length])
    .join("");
}

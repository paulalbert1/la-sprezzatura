/**
 * Format a raw phone string for display.
 *
 * Rules:
 * - Extract all digits from the input.
 * - If exactly 10 digits, return "(NNN) NNN-NNNN".
 * - Otherwise, return the raw input unchanged (safe fallback so
 *   non-US numbers, partial entries, and unexpected shapes are
 *   never mangled).
 * - Empty, null, or undefined input returns "".
 *
 * Phone values are stored raw in Sanity — no normalization on save.
 * This function is the single source of truth for display format.
 */
export function formatPhone(raw: string | undefined | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

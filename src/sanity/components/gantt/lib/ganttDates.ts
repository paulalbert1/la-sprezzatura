/**
 * Safe date parsing and serialization for Sanity date and datetime field types.
 *
 * Sanity `date` fields store "YYYY-MM-DD". JavaScript `new Date("2026-05-15")`
 * parses as UTC midnight, which displays as May 14 in US timezones (UTC-4/5).
 * We append T12:00:00 to avoid this off-by-one bug.
 *
 * Sanity `datetime` fields store full ISO strings and can be parsed directly.
 */

/** Parse Sanity 'date' type field (YYYY-MM-DD) safely across timezones */
export function parseSanityDate(
  dateStr: string | null | undefined,
): Date | null {
  if (!dateStr) return null;
  // Append T12:00:00 to avoid UTC midnight off-by-one in western timezones
  return new Date(dateStr + "T12:00:00");
}

/** Parse Sanity 'datetime' type field (full ISO string) */
export function parseSanityDatetime(
  dtStr: string | null | undefined,
): Date | null {
  if (!dtStr) return null;
  return new Date(dtStr);
}

/** Serialize JS Date back to Sanity 'date' type field (YYYY-MM-DD) */
export function serializeSanityDate(date: Date | null): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

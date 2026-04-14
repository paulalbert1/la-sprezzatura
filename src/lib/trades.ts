/**
 * Canonical display labels for every trade slug currently referenced in the
 * codebase. Slugs stay in Sanity; this map exists purely for presentation.
 *
 * Rules:
 * - First letter capital, rest lowercase.
 * - Acronyms (e.g., HVAC) preserved in uppercase.
 * - Internal hyphens preserved when semantic (e.g., "rough-in"); otherwise
 *   converted to spaces ("general-contractor" -> "General contractor").
 *
 * Unknown slugs fall through to formatTrade's normaliser, which replaces
 * hyphens/underscores with spaces and capitalises the first letter.
 */
export const TRADE_LABELS: Record<string, string> = {
  // Plan 35-01 canonical list (construction phases)
  "electrical-rough-in": "Electrical rough-in",
  "electrical-finish": "Electrical finish",
  "plumbing-rough-in": "Plumbing rough-in",
  "plumbing-finish": "Plumbing finish",
  hvac: "HVAC",
  painting: "Painting",
  flooring: "Flooring",
  tile: "Tile",
  drywall: "Drywall",
  framing: "Framing",
  "general-contractor": "General contractor",
  cabinetry: "Cabinetry",
  countertops: "Countertops",
  millwork: "Millwork",
  demolition: "Demolition",
  landscaping: "Landscaping",
  roofing: "Roofing",
  windows: "Windows",
  wallpaper: "Wallpaper",
  // Legacy slugs in src/components/admin/EntityDetailForm.tsx TRADE_OPTIONS
  electrician: "Electrician",
  plumber: "Plumber",
  painter: "Painter",
  "custom-millwork": "Custom millwork",
  "tile-stone": "Tile & stone",
  "window-treatments": "Window treatments",
  other: "Other",
};

/**
 * Return a human-friendly, sentence-case label for any trade slug.
 *
 * - Known slugs (see TRADE_LABELS) return their canonical display string.
 * - Unknown slugs are normalised: hyphens/underscores become spaces, the
 *   whole string is lowercased, and only the first letter is capitalised.
 * - Empty, null, or undefined inputs return "" (never throws).
 *
 * Callers MUST continue to pass raw slugs to APIs, React keys, and Sanity
 * writes. Only display text uses this function.
 */
export function formatTrade(
  slug: string | undefined | null,
): string {
  if (!slug) return "";
  if (TRADE_LABELS[slug]) return TRADE_LABELS[slug];
  const normalized = slug.replace(/[-_]/g, " ").toLowerCase().trim();
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

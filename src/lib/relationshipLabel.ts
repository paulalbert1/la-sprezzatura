/**
 * Derive the display label for a contractor record's relationship type.
 *
 * - "vendor" → "Vendor"
 * - "contractor" → "Contractor"
 * - null / undefined / any other value → "Contractor" (Phase 42 D-04 null fallback)
 *
 * Single source of truth for the relationship display label so all surfaces
 * (list cell, detail header, popover, meta line, delete button) stay in sync.
 */
export function relationshipLabel(relationship: string | null | undefined): string {
  return relationship === "vendor" ? "Vendor" : "Contractor";
}

/**
 * Shared procurement status constants — single source of truth.
 *
 * The 6-stage procurement pipeline in chronological order:
 *   not-yet-ordered -> ordered -> in-transit -> warehouse -> delivered -> installed
 *
 * Used by: Sanity schema (options.list), Gantt chart (status colors),
 * Badge components (tone rendering), and portal display.
 */

export type ProcurementStageKey =
  | "not-yet-ordered"
  | "ordered"
  | "in-transit"
  | "warehouse"
  | "delivered"
  | "installed";

export type SanityTone =
  | "default"
  | "primary"
  | "positive"
  | "caution"
  | "critical";

export interface ProcurementStageMeta {
  value: ProcurementStageKey;
  title: string;
  tone: SanityTone;
}

export const PROCUREMENT_STAGES: ProcurementStageMeta[] = [
  { value: "not-yet-ordered", title: "Not Yet Ordered", tone: "default" },
  { value: "ordered", title: "Ordered", tone: "primary" },
  { value: "in-transit", title: "In Transit", tone: "caution" },
  { value: "warehouse", title: "Warehouse", tone: "caution" },
  { value: "delivered", title: "Delivered", tone: "positive" },
  { value: "installed", title: "Installed", tone: "positive" },
];

export const PROCUREMENT_STAGE_META: Record<
  ProcurementStageKey,
  ProcurementStageMeta
> = Object.fromEntries(
  PROCUREMENT_STAGES.map((s) => [s.value, s]),
) as Record<ProcurementStageKey, ProcurementStageMeta>;

/** Look up the Sanity tone for a procurement status. Falls back to "default". */
export function getProcurementTone(status: string): SanityTone {
  return (
    (PROCUREMENT_STAGE_META[status as ProcurementStageKey]?.tone) ?? "default"
  );
}

/** Return a {title, value} array suitable for Sanity schema options.list. */
export function getProcurementOptionsList(): { title: string; value: string }[] {
  return PROCUREMENT_STAGES.map((s) => ({ title: s.title, value: s.value }));
}

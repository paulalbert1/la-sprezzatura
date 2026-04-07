/**
 * Contractor color palette and category color assignment for Gantt chart.
 *
 * Per D-11: Color coding is per-contractor identity (not item category).
 * A color is assigned to each contractor assignment based on array index,
 * from a fixed 10-color palette. Non-contractor items use neutral category colors.
 */

import type { ProcurementStatus } from "./ganttTypes";

/** 10-color palette for per-contractor bar coloring (Tailwind 500 weights) */
export const CONTRACTOR_PALETTE: readonly string[] = [
  "#3B82F6", // blue-500
  "#EF4444", // red-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#06B6D4", // cyan-500
  "#F97316", // orange-500
  "#14B8A6", // teal-500
  "#6366F1", // indigo-500
] as const;

/** Category colors for non-contractor items */
export const CATEGORY_COLORS = {
  contractors: "#3B82F6", // blue-500 (fallback if no per-contractor)
  procurement: "#F59E0B", // amber-500
  milestones: "#8B5CF6", // violet-500
  events: "#14B8A6", // teal-500
  completed: "#9CA3AF", // gray-400
} as const;

/** Get a contractor color by array index with modulo wrapping */
export function getContractorColor(index: number): string {
  return CONTRACTOR_PALETTE[index % CONTRACTOR_PALETTE.length];
}

/** Procurement status to color mapping */
export const PROCUREMENT_STATUS_COLORS: Record<ProcurementStatus, string> = {
  "not-yet-ordered": "#9CA3AF", // gray-400 (muted)
  ordered: "#F59E0B", // amber-500
  warehouse: "#F59E0B", // amber-500 (same as ordered)
  "in-transit": "#F59E0B", // amber-500 (same as ordered)
  delivered: "#10B981", // emerald-500
  installed: "#9CA3AF", // gray-400
};

/** Get the color for a procurement item status */
export function getProcurementStatusColor(status: string): string {
  return (
    PROCUREMENT_STATUS_COLORS[status as ProcurementStatus] ||
    PROCUREMENT_STATUS_COLORS["not-yet-ordered"]
  );
}

/**
 * Contractor color palette and category color assignment for Gantt chart.
 *
 * Per D-11: Color coding is per-contractor identity (not item category).
 * A color is assigned to each contractor assignment based on array index,
 * from a fixed 10-color palette. Non-contractor items use neutral category colors.
 */

import type { ProcurementStatus } from "./ganttTypes";

/** 10-color desaturated palette for per-contractor bar coloring */
export const CONTRACTOR_PALETTE: readonly string[] = [
  "#5B8DB8", // slate blue
  "#C46B5C", // dusty rose
  "#6BA87A", // sage
  "#C49A5C", // warm ochre
  "#8B7BBF", // soft purple
  "#5DA3A3", // muted teal
  "#B8856B", // terracotta muted
  "#7B9E6B", // olive
  "#A87B8B", // mauve
  "#6B8BA8", // steel blue
] as const;

/** Category colors for non-contractor items */
export const CATEGORY_COLORS = {
  contractors: "#5B8DB8", // slate blue (fallback)
  procurement: "#C9A96E", // warm amber
  milestones: "#A8A29E", // neutral stone
  events: "#78B8A0", // muted teal
  completed: "#D6D3D1", // light gray
} as const;

/** Get a contractor color by array index with modulo wrapping */
export function getContractorColor(index: number): string {
  return CONTRACTOR_PALETTE[index % CONTRACTOR_PALETTE.length];
}

/** Procurement status to color mapping */
export const PROCUREMENT_STATUS_COLORS: Record<ProcurementStatus, string> = {
  pending: "#9CA3AF", // gray-400 (muted)
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
    PROCUREMENT_STATUS_COLORS.pending
  );
}

// src/lib/procurement/statusPills.ts
// Phase 46-04 -- canonical procurement status palette + labels (D-13).
//
// Single source of truth for status pill chrome across the admin UI
// (ProcurementEditor.tsx) and email render (emails/sendUpdate/Procurement.tsx).
// Drift between admin and email pill colors is structurally prevented
// because both consume this module.
//
// Pill chrome (D-12): 11px font-weight-600 uppercase 0.06em tracking,
// padding 3px 10px, border-radius 2px (longhand only -- Phase 46 D-3),
// 0.5px border. Email Procurement.tsx applies these via inline styles
// (Tailwind classNames cannot express 0.5px borders Outlook-safely).
//
// Leaf code -- this module imports nothing from src/components/, src/emails/,
// or anywhere else in the codebase. Everything imports from it.

export type ProcurementStatus =
  | "scheduled"
  | "warehouse"
  | "ordered"
  | "in-transit"
  | "pending"
  | "delivered"
  | "installed";

export const PROCUREMENT_STATUSES: ProcurementStatus[] = [
  "scheduled",
  "warehouse",
  "in-transit",
  "ordered",
  "pending",
  "delivered",
  "installed",
];

export interface PillStyle {
  bg: string;
  text: string;
  border: string;
}

export const STATUS_PILL_STYLES: Record<ProcurementStatus, PillStyle> = {
  scheduled: { bg: "#F3EFE9", text: "#6B5E52", border: "#E0D5C5" },
  warehouse: { bg: "#F3EDE3", text: "#6B5E52", border: "#D4C8B8" },
  "in-transit": { bg: "#FBF2E2", text: "#8A5E1A", border: "#E8CFA0" },
  ordered: { bg: "#E8F0F9", text: "#2A5485", border: "#B0CAE8" },
  pending: { bg: "#FDEEE6", text: "#9B3A2A", border: "#F2C9B8" },
  delivered: { bg: "#EDF5E8", text: "#3A6620", border: "#C4DBA8" },
  installed: { bg: "#EDF5E8", text: "#3A6620", border: "#A8C98C" },
};

export const STATUS_LABELS: Record<ProcurementStatus, string> = {
  scheduled: "Scheduled",
  warehouse: "Warehouse",
  "in-transit": "In Transit",
  ordered: "Ordered",
  pending: "Pending order",
  delivered: "Delivered",
  installed: "Installed",
};

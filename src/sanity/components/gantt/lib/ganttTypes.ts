/**
 * TypeScript interfaces for Gantt chart data transformation.
 * These types define the contract between Sanity document data and the SVAR React Gantt component.
 */

/** A single task/row in the SVAR Gantt chart */
export interface GanttTask {
  id: string;
  text: string;
  start: Date;
  end: Date | null;
  type: "task" | "milestone" | "summary";
  parent: string | null;
  open: boolean;
  progress: number;
  /** Custom: index into CONTRACTOR_PALETTE for per-contractor coloring */
  _colorIndex?: number;
  /** Custom: data category (contractor, procurement, milestone, event) */
  _category: string;
  /** Custom: status string for procurement items */
  _status?: string;
  /** Custom: whether the item is completed (milestones) */
  _completed?: boolean;
}

/** Scale configuration for the SVAR Gantt timeline header */
export interface GanttScale {
  unit: string;
  step: number;
  format: string;
}

/** A contractor assignment with resolved reference data */
export interface ResolvedContractor {
  _key: string;
  contractor: {
    _id: string;
    name: string;
    company: string;
    trades: string[];
  } | null;
  startDate: string | null;
  endDate: string | null;
  estimateAmount: number | null;
  scopeOfWork: unknown;
  internalNotes: string | null;
  contractorNotes: string | null;
  appointments: Array<{
    _key: string;
    dateTime: string;
    type: string;
    notes: string | null;
  }>;
}

/** Procurement item status values */
export type ProcurementStatus =
  | "pending"
  | "ordered"
  | "warehouse"
  | "in-transit"
  | "delivered"
  | "installed";

/** The Sanity project document data shape used by the Gantt view */
export interface SanityProjectData {
  contractors: ResolvedContractor[];
  milestones: Array<{
    _key: string;
    name: string;
    date: string | null;
    completed: boolean;
    description?: string;
  }>;
  procurementItems: Array<{
    _key: string;
    name: string;
    status: ProcurementStatus;
    installDate: string | null;
    orderDate: string | null;
    expectedDeliveryDate: string | null;
  }>;
  customEvents: Array<{
    _key: string;
    name: string;
    date: string;
    endDate: string | null;
    category: string;
    notes: string | null;
  }>;
  scheduleDependencies: Array<{
    _key: string;
    source: string;   // "category:_key" format, e.g. "milestone:mil-da01"
    target: string;   // "category:_key" format
    linkType: string;
  }>;
  engagementType: string;
  isCommercial: boolean;
}

/** A dependency link between two Gantt tasks (rendered as an arrow) */
export interface GanttLink {
  id: string;
  source: string;
  target: string;
  type: "e2s" | "s2s" | "e2e" | "s2e";
  conflict?: boolean;
}

/** A scheduling conflict: predecessor ends after successor starts */
export interface ScheduleConflict {
  linkId: string;
  sourceName: string;
  sourceEndDate: Date;
  targetName: string;
  targetStartDate: Date;
  overlapDays: number;
}

/**
 * Derive the correct document ID for patching (draft vs published).
 * Sanity Studio custom views receive `documentId` without the `drafts.` prefix.
 * Patching the bare ID silently writes to the published document.
 * Always use this helper to get the correct target for mutations.
 *
 * Established here for Phase 16 write-back (Pitfall 1 from RESEARCH.md).
 */
export function getPatchId(
  doc: {
    draft?: { _id: string } | null;
    published?: { _id: string } | null;
  },
  documentId: string,
): string {
  return doc.draft?._id || doc.published?._id || documentId;
}

// WorkflowTracker — stub scaffold
// Full implementation: Phase 44 Plan 07
// This file defines the props interface used by schedule.astro (Plan 09).

import type { MilestoneStatus, ProjectWorkflow, Warning, WorkflowMetrics } from "../../../lib/workflow/types";

export interface WorkflowTrackerProps {
  projectId: string;
  projectTitle: string;
  clientInitials: string;
  workflow: ProjectWorkflow;
  templateName: string;
  warnings: Warning[];
  metrics: WorkflowMetrics;
  templates: Array<{ _id: string; name: string }>;
  transitionsById: Record<string, Array<{ status: MilestoneStatus; allowed: boolean; reason?: string }>>;
  blockedById: Record<string, { blocked: boolean; reason?: string }>;
  gateSubMessageById?: Record<string, string>;
  overdueReasonById?: Record<string, string>;
}

export default function WorkflowTracker(_props: WorkflowTrackerProps) {
  return (
    <div style={{ padding: "2rem", color: "#6b7280", fontStyle: "italic" }}>
      Workflow tracker UI under construction (Phase 44 Plan 07 in progress).
    </div>
  );
}

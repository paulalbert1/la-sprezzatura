// BlankWorkflowState — stub scaffold
// Full implementation: Phase 44 Plan 07
// This file defines the props interface used by schedule.astro (Plan 09).

interface BlankWorkflowStateProps {
  projectId: string;
  templates: Array<{ _id: string; name: string }>;
}

export default function BlankWorkflowState(_props: BlankWorkflowStateProps) {
  return (
    <div style={{ padding: "2rem", color: "#6b7280", fontStyle: "italic" }}>
      Workflow blank state UI under construction (Phase 44 Plan 07 in progress).
    </div>
  );
}

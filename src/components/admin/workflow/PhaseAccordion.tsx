// Phase 44 Plan 06 Task 2 — PhaseAccordion
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Surface 3 — Phase accordion cards
//   .planning/phases/44-workflow-engine/44-06-PLAN.md § Task 2
//
// Analog: src/components/admin/ui/CollapsibleSection.tsx (accordion keyboard + chevron pattern)
//
// Phase accordion card with:
//   - Header: chevron + phase name + parallel pill (if applicable) + phase status pill
//   - role="button" + aria-expanded + keyboard-activatable (Enter/Space)
//   - Body: renders one <MilestoneRow> per milestone; hidden when collapsed

import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";
import MilestoneRow from "./MilestoneRow";
import type { PhaseInstance } from "../../../lib/workflow/types";
import type { MilestoneRowProps } from "./MilestoneRow";

// UI-SPEC § Phase status pill colors
const PHASE_PILL: Record<
  "complete" | "in_progress" | "upcoming",
  { bg: string; text: string; label: string }
> = {
  complete: { bg: "#EEF3E3", text: "#27500A", label: "complete" },
  in_progress: { bg: "#F5EDD8", text: "#9A7B4B", label: "in progress" },
  upcoming: { bg: "#F3EDE3", text: "#9E8E80", label: "upcoming" },
};

interface PhaseAccordionProps {
  phase: PhaseInstance;
  phaseStatus: "complete" | "in_progress" | "upcoming";
  isParallel: boolean;
  defaultOpen: boolean;
  isBlocked: (
    phaseId: string,
    milestoneId: string,
  ) => { blocked: boolean; reason?: string };
  gateSubMessageFor?: (phaseId: string, milestoneId: string) => string | undefined;
  overdueReasonFor?: (phaseId: string, milestoneId: string) => string | undefined;
  onStatusClick: MilestoneRowProps["onStatusClick"];
  onAddInstance: MilestoneRowProps["onAddInstance"];
  onRemoveInstance: MilestoneRowProps["onRemoveInstance"];
}

export type { MilestoneRowProps };

export default function PhaseAccordion({
  phase,
  phaseStatus,
  isParallel,
  defaultOpen,
  isBlocked,
  gateSubMessageFor,
  overdueReasonFor,
  onStatusClick,
  onAddInstance,
  onRemoveInstance,
}: PhaseAccordionProps) {
  const [expanded, setExpanded] = useState<boolean>(defaultOpen);

  const toggle = () => setExpanded((v) => !v);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  const pill = PHASE_PILL[phaseStatus];

  return (
    <div
      style={{
        backgroundColor: "#FFFEFB",
        border: "0.5px solid #E8DDD0",
        borderRadius: "10px",
        marginBottom: "4px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={phase.name}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 cursor-pointer select-none"
        style={{
          padding: "8px 12px",
          minHeight: "44px",
          fontFamily: "var(--font-sans)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "#F3EDE3";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
        }}
      >
        {/* Chevron — rotates 90deg on open (ChevronRight → pointing down) */}
        <ChevronRight
          size={9}
          style={{
            color: "#9E8E80",
            flexShrink: 0,
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 200ms",
          }}
        />

        {/* Phase name */}
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#2C2520",
            fontFamily: "var(--font-sans)",
          }}
        >
          {phase.name}
        </span>

        {/* Parallel pill */}
        {isParallel && (
          <span
            style={{
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "7px",
              backgroundColor: "#F3EDE3",
              color: "#6B5E52",
              flexShrink: 0,
            }}
          >
            parallel
          </span>
        )}

        {/* Spacer */}
        <span style={{ flex: 1 }} />

        {/* Phase status pill */}
        <span
          style={{
            fontSize: "11px",
            padding: "1px 6px",
            borderRadius: "7px",
            backgroundColor: pill.bg,
            color: pill.text,
            flexShrink: 0,
          }}
        >
          {pill.label}
        </span>
      </div>

      {/* Body — only rendered when expanded */}
      {expanded && phase.milestones.length > 0 && (
        <div
          style={{
            borderTop: "0.5px solid #E8DDD0",
            padding: "8px 12px",
          }}
        >
          {phase.milestones.map((milestone) => {
            const blockResult = isBlocked(phase.id, milestone.id);
            const gateSubMessage = gateSubMessageFor
              ? gateSubMessageFor(phase.id, milestone.id)
              : undefined;
            const overdueReason = overdueReasonFor
              ? overdueReasonFor(phase.id, milestone.id)
              : undefined;

            return (
              <MilestoneRow
                key={milestone._key}
                milestone={milestone}
                phaseId={phase.id}
                isBlocked={blockResult.blocked}
                blockReason={blockResult.reason}
                gateSubMessage={gateSubMessage}
                overdueReason={overdueReason}
                onStatusClick={onStatusClick}
                onAddInstance={onAddInstance}
                onRemoveInstance={onRemoveInstance}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

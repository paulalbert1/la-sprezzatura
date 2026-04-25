// Phase 44 Plan 06 Task 2 — MilestoneRow
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Surface 3 — milestone row + multi-instance sub-rows
//   .planning/phases/44-workflow-engine/44-06-PLAN.md § Task 2
//
// Renders one milestone row including:
//   - Status circle (16px; disabled on multi-instance parent)
//   - 8px assignee dot (color-coded per UI-SPEC assignee table)
//   - Milestone name (line-through + muted when skipped)
//   - Optional pill (when optional && not skipped)
//   - Completion date (right-aligned, only when complete)
//   - Gate sub-message, block reason sub-message, overdue sub-message
//   - Multi-instance sub-rows with 12px StatusCircle, inline add/remove

import { useState } from "react";
import { format, getYear } from "date-fns";
import { Check, X, Lock } from "lucide-react";
import StatusCircle from "./StatusCircle";
import type { MilestoneInstance, ContractorInstance } from "../../../lib/workflow/types";

// Assignee chip colors — shared with WorkflowMilestonesCard for consistency.
// Bordered + saturated bg so chips read as a distinct element on cream surfaces.
const ASSIGNEE_CHIP: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  designer: { bg: "#EFE3C0", text: "#7A5E32", border: "#D8C896" },
  client:   { bg: "#F4D9B0", text: "#6B3D08", border: "#D9B27C" },
  vendor:   { bg: "#DDEBC4", text: "#1F3F08", border: "#B8D095" },
  trade:    { bg: "#E0D5C5", text: "#4F4439", border: "#BFB1A1" },
};

// UI-SPEC § Sub-row status pill colors
const SUB_ROW_PILL: Record<string, { bg: string; text: string; label: string }> = {
  complete: { bg: "#EEF3E3", text: "#27500A", label: "done" },
  in_progress: { bg: "#F5EDD8", text: "#9A7B4B", label: "active" },
  awaiting_client: { bg: "#FAEEDA", text: "#854F0B", label: "awaiting" },
  awaiting_payment: { bg: "#FAEEDA", text: "#854F0B", label: "awaiting" },
  skipped: { bg: "#F3EDE3", text: "#9E8E80", label: "skipped" },
  not_started: { bg: "#F3EDE3", text: "#9E8E80", label: "not started" },
};

function formatDate(isoStr: string | undefined): string | null {
  if (!isoStr) return null;
  try {
    // Parse just the date portion (YYYY-MM-DD) to avoid timezone shifting.
    // ISO timestamps like "2026-04-20T00:00:00Z" would shift to Apr 19 in
    // Eastern timezone if parsed as full datetime. Slicing to the date part
    // and constructing a local date avoids that.
    const datePart = isoStr.slice(0, 10); // "YYYY-MM-DD"
    const [year, month, day] = datePart.split("-").map(Number);
    // Month is 0-indexed in JS Date
    const d = new Date(year, month - 1, day);
    const currentYear = getYear(new Date());
    if (getYear(d) === currentYear) {
      return format(d, "MMM d");
    }
    return format(d, "MMM d, yyyy");
  } catch {
    return null;
  }
}

interface MilestoneRowProps {
  milestone: MilestoneInstance;
  phaseId: string;
  isBlocked: boolean;
  blockReason?: string;
  /** Display name of the unmet prereq, used to emphasize it in the block message. */
  blockPrereqName?: string;
  overdueReason?: string;
  gateSubMessage?: string;
  isNextUp?: boolean;
  onStatusClick: (
    phaseId: string,
    milestoneId: string,
    instanceKey: string | undefined,
    anchor: HTMLElement,
  ) => void;
  onAddInstance: (phaseId: string, milestoneId: string, name: string) => void;
  onRemoveInstance: (phaseId: string, milestoneId: string, instanceKey: string) => void;
}

// Sub-row: one contractor instance
function InstanceSubRow({
  instance,
  phaseId,
  milestoneId,
  isBlocked,
  onStatusClick,
  onRemoveInstance,
}: {
  instance: ContractorInstance;
  phaseId: string;
  milestoneId: string;
  isBlocked: boolean;
  onStatusClick: MilestoneRowProps["onStatusClick"];
  onRemoveInstance: MilestoneRowProps["onRemoveInstance"];
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const pill = SUB_ROW_PILL[instance.status] ?? SUB_ROW_PILL.not_started;
  const completedDate = instance.status === "complete" ? formatDate(instance.completedAt) : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "4px",
        fontSize: "11px",
        fontFamily: "var(--font-sans)",
        color: "#2C2520",
      }}
    >
      {/* 12px sub-row status circle */}
      <StatusCircle
        status={instance.status}
        size={12}
        isBlocked={isBlocked}
        milestoneName={instance.name}
        onClick={(anchor) => onStatusClick(phaseId, milestoneId, instance._key, anchor)}
      />

      {/* Instance name */}
      <span style={{ flex: 1, color: "#2C2520" }}>{instance.name}</span>

      {/* Completion date */}
      {completedDate && (
        <span style={{ color: "#9E8E80", flexShrink: 0 }}>{completedDate}</span>
      )}

      {/* Status pill */}
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

      {/* Remove button */}
      {!confirmRemove ? (
        <button
          type="button"
          aria-label={`Remove ${instance.name}`}
          onClick={() => setConfirmRemove(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 2px",
            color: "#9E8E80",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={11} />
        </button>
      ) : (
        <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <span style={{ fontSize: "11px", color: "#6B5E52" }}>Remove?</span>
          <button
            type="button"
            aria-label="Confirm remove"
            onClick={() => {
              setConfirmRemove(false);
              onRemoveInstance(phaseId, milestoneId, instance._key);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 2px",
              color: "#27500A",
            }}
          >
            <Check size={11} />
          </button>
          <button
            type="button"
            aria-label="Cancel remove"
            onClick={() => setConfirmRemove(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 2px",
              color: "#9B3A2A",
            }}
          >
            <X size={11} />
          </button>
        </span>
      )}
    </div>
  );
}

export default function MilestoneRow({
  milestone,
  phaseId,
  isBlocked,
  blockReason,
  blockPrereqName,
  overdueReason,
  gateSubMessage,
  isNextUp = false,
  onStatusClick,
  onAddInstance,
  onRemoveInstance,
}: MilestoneRowProps) {
  const [addingInstance, setAddingInstance] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");

  const isSkipped = milestone.status === "skipped";
  const isComplete = milestone.status === "complete";
  const isMultiInstance = milestone.multiInstance;

  const completedDate = isComplete ? formatDate(milestone.completedAt) : null;
  const chip = ASSIGNEE_CHIP[milestone.assignee] ?? {
    bg: "#F3EDE3",
    text: "#6B5E52",
    border: "#D4C8B8",
  };

  const nameColor = isSkipped
    ? "#9E8E80"
    : isComplete
      ? "#6B5E52"
      : "#2C2520";

  function handleAddInstance() {
    const name = newInstanceName.trim();
    if (name) {
      onAddInstance(phaseId, milestone.id, name);
      setNewInstanceName("");
      setAddingInstance(false);
    }
  }

  return (
    <div
      id={milestone.id}
      data-next-up={isNextUp ? "true" : undefined}
      style={{
        borderBottom: "0.5px solid #E8DDD0",
        paddingTop: "8px",
        paddingBottom: "8px",
        paddingLeft: isNextUp ? "10px" : "0",
        marginLeft: isNextUp ? "-10px" : "0",
        borderLeft: isNextUp ? "2px solid #9A7B4B" : "2px solid transparent",
        backgroundColor: isNextUp ? "#FBF6EC" : "transparent",
        borderRadius: isNextUp ? "0 4px 4px 0" : "0",
        scrollMarginTop: "80px",
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Status circle — disabled on multi-instance parent */}
        <StatusCircle
          status={milestone.status}
          size={16}
          isBlocked={isBlocked}
          blockReason={blockReason}
          milestoneName={milestone.name}
          disabled={isMultiInstance}
          onClick={
            isMultiInstance
              ? undefined
              : (anchor) => onStatusClick(phaseId, milestone.id, undefined, anchor)
          }
        />

        {/* Name */}
        <span
          style={{
            flex: 1,
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: nameColor,
            textDecoration: isSkipped ? "line-through" : "none",
            lineHeight: 1.5,
          }}
        >
          {milestone.name}
        </span>

        {/* Assignee chip (right-aligned, role-tinted) */}
        <span
          data-assignee={milestone.assignee}
          style={{
            fontSize: "11px",
            fontWeight: 500,
            padding: "1px 8px",
            borderRadius: "8px",
            backgroundColor: chip.bg,
            color: chip.text,
            border: `0.5px solid ${chip.border}`,
            fontFamily: "var(--font-sans)",
            flexShrink: 0,
            lineHeight: 1.5,
            textTransform: "capitalize",
            letterSpacing: "0.02em",
            opacity: isSkipped ? 0.6 : 1,
          }}
        >
          {milestone.assignee}
        </span>

        {/* Next-up pill — only when this milestone is the next actionable */}
        {isNextUp && (
          <span
            style={{
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "7px",
              backgroundColor: "#9A7B4B",
              color: "#FFFEFB",
              flexShrink: 0,
              lineHeight: 1.4,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Next up
          </span>
        )}

        {/* Optional pill — only when optional and NOT skipped */}
        {milestone.optional && !isSkipped && (
          <span
            style={{
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "7px",
              backgroundColor: "#F3EDE3",
              color: "#9E8E80",
              flexShrink: 0,
              lineHeight: 1.4,
            }}
          >
            optional
          </span>
        )}

        {/* Completion date — right-aligned, only when complete */}
        {completedDate && (
          <span
            style={{
              fontSize: "11px",
              color: "#9E8E80",
              flexShrink: 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            {completedDate}
          </span>
        )}
      </div>

      {/* Sub-messages */}
      {gateSubMessage && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-text-warning, #854F0B)",
            fontFamily: "var(--font-sans)",
            paddingLeft: "32px",
            marginTop: "2px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Lock size={11} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>{gateSubMessage}</span>
        </div>
      )}
      {isBlocked && blockReason && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-text-warning, #854F0B)",
            fontFamily: "var(--font-sans)",
            paddingLeft: "32px",
            marginTop: "2px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Lock size={11} aria-hidden="true" style={{ flexShrink: 0 }} />
          {blockPrereqName ? (
            <span>
              Needs{" "}
              <span
                style={{
                  fontWeight: 600,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationThickness: "1px",
                  textUnderlineOffset: "2px",
                }}
              >
                {blockPrereqName}
              </span>
              {" "}to be completed
            </span>
          ) : (
            <span>{blockReason}</span>
          )}
        </div>
      )}
      {overdueReason && (
        <div
          style={{
            fontSize: "11px",
            color: "#9B3A2A",
            fontFamily: "var(--font-sans)",
            paddingLeft: "32px",
            marginTop: "2px",
          }}
        >
          {overdueReason}
        </div>
      )}

      {/* Multi-instance sub-rows */}
      {isMultiInstance && milestone.instances && milestone.instances.length > 0 && (
        <div style={{ paddingLeft: "4px", marginTop: "4px" }}>
          {milestone.instances.map((inst) => (
            <InstanceSubRow
              key={inst._key}
              instance={inst}
              phaseId={phaseId}
              milestoneId={milestone.id}
              isBlocked={isBlocked}
              onStatusClick={onStatusClick}
              onRemoveInstance={onRemoveInstance}
            />
          ))}
        </div>
      )}

      {/* Add contractor link + inline input */}
      {isMultiInstance && (
        <div style={{ paddingLeft: "4px", marginTop: "4px" }}>
          {addingInstance ? (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                type="text"
                placeholder="Contractor or vendor name"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddInstance();
                  if (e.key === "Escape") {
                    setAddingInstance(false);
                    setNewInstanceName("");
                  }
                }}
                autoFocus
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-sans)",
                  border: "0.5px solid #D4C8B8",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  outline: "none",
                  flex: 1,
                }}
              />
              <button
                type="button"
                aria-label="Confirm add"
                onClick={handleAddInstance}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#27500A",
                  padding: "0 2px",
                }}
              >
                <Check size={12} />
              </button>
              <button
                type="button"
                aria-label="Cancel add"
                onClick={() => {
                  setAddingInstance(false);
                  setNewInstanceName("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9B3A2A",
                  padding: "0 2px",
                }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingInstance(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "var(--font-sans)",
                color: "#6B5E52",
                padding: 0,
                textDecoration: "none",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#2C2520")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#6B5E52")
              }
            >
              + Add contractor
            </button>
          )}
        </div>
      )}
    </div>
  );
}

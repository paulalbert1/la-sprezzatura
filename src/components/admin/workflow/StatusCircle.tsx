// Phase 44 Plan 06 Task 1 — StatusCircle
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Status color system
//   .planning/phases/44-workflow-engine/44-06-PLAN.md § Task 1
//
// Renders a 16px (default) or 12px (sub-row) status indicator circle.
// Clicking opens the status picker popover via the `onClick` callback.
// Blocked milestones are non-clickable (aria-disabled + cursor not-allowed).

import { Check } from "lucide-react";
import type { MilestoneStatus } from "../../../lib/workflow/types";

interface StatusCircleProps {
  status: MilestoneStatus;
  size?: 12 | 16;
  isBlocked?: boolean;
  blockReason?: string;
  milestoneName: string;
  onClick?: (anchorEl: HTMLElement) => void;
  disabled?: boolean; // derived milestone (parent of multi-instance) — not clickable
}

// UI-SPEC § Status color system — exact values per spec
function circleStyles(
  status: MilestoneStatus,
  isBlocked: boolean,
  size: 12 | 16,
): React.CSSProperties {
  const baseCircle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    border: "1.5px solid",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  if (isBlocked || (status === "not_started" && isBlocked)) {
    return {
      ...baseCircle,
      borderColor: "#D4C8B8",
      backgroundColor: "#F3EDE3",
      cursor: "not-allowed",
    };
  }

  switch (status) {
    case "complete":
      return {
        ...baseCircle,
        borderColor: "#27500A",
        backgroundColor: "#27500A",
        cursor: "pointer",
      };
    case "in_progress":
      return {
        ...baseCircle,
        borderColor: "#9A7B4B",
        backgroundColor: "#9A7B4B",
        cursor: "pointer",
      };
    case "awaiting_client":
    case "awaiting_payment":
      return {
        ...baseCircle,
        borderColor: "#854F0B",
        backgroundColor: "#FAEEDA",
        cursor: "pointer",
      };
    case "skipped":
      return {
        ...baseCircle,
        borderColor: "#D4C8B8",
        backgroundColor: "#F3EDE3",
        cursor: "default",
      };
    case "not_started":
    default:
      return {
        ...baseCircle,
        borderColor: "#D4C8B8",
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
      };
  }
}

export default function StatusCircle({
  status,
  size = 16,
  isBlocked = false,
  blockReason,
  milestoneName,
  onClick,
  disabled = false,
}: StatusCircleProps) {
  const isNonClickable = isBlocked || disabled || status === "skipped";
  const ariaLabel = `Change status — ${milestoneName}, currently ${status}`;
  const titleText =
    disabled
      ? "Status is derived from contractor rows below"
      : isBlocked && blockReason
        ? blockReason
        : undefined;

  const styles = circleStyles(status, isBlocked, size);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (isNonClickable) {
      e.preventDefault();
      return;
    }
    onClick?.(e.currentTarget);
  }

  // complete: white check icon on green fill
  const checkIcon =
    status === "complete" ? (
      <Check
        size={size === 12 ? 8 : 11}
        color="#FFFFFF"
        strokeWidth={3}
        aria-hidden="true"
      />
    ) : null;

  // in_progress: white horizontal bar on amber fill (clearly not a radio dot)
  const inProgressBar =
    status === "in_progress" ? (
      <span
        style={{
          width: size === 12 ? "6px" : "8px",
          height: "1.5px",
          backgroundColor: "#FFFFFF",
          borderRadius: "1px",
          display: "block",
        }}
      />
    ) : null;

  // skipped gets em-dash sigil
  const skippedSigil =
    status === "skipped" ? (
      <span
        style={{
          fontSize: size === 12 ? "8px" : "10px",
          color: "#9E8E80",
          lineHeight: 1,
          display: "block",
          userSelect: "none",
        }}
      >
        —
      </span>
    ) : null;

  return (
    <button
      type="button"
      data-status-circle
      aria-label={ariaLabel}
      aria-disabled={isNonClickable ? "true" : undefined}
      title={titleText}
      onClick={handleClick}
      style={styles}
    >
      {checkIcon}
      {inProgressBar}
      {skippedSigil}
    </button>
  );
}

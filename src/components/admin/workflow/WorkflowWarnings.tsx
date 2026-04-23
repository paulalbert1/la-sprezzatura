// Phase 44 Plan 07 Task 1 — WorkflowWarnings
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Warning bar color contract + Surface 3
//   .planning/phases/44-workflow-engine/44-07-PLAN.md § Task 1
//
// Stacks warning bars with severity-driven colors.
// > 4 warnings: shows first 3 + "+N more warnings" expandable row.
// role="alert" on error severity; role="status" on warning.

import { useState } from "react";
import type { Warning, WarningSeverity, WarningKind } from "../../../lib/workflow/types";

interface WorkflowWarningsProps {
  warnings: Warning[];
}

// UI-SPEC § Warning bar color contract
// Dormant/severely_overdue → destructive surface; others → amber surface
function warningBarStyle(
  kind: WarningKind,
  severity: WarningSeverity,
): { bg: string; dotColor: string; textColor: string } {
  if (severity === "error" || kind === "dormant" || kind === "approval_severely_overdue") {
    return {
      bg: "#FBEEE8",
      dotColor: "#9B3A2A",
      textColor: "#9B3A2A",
    };
  }
  // Default: warm amber
  return {
    bg: "#FAEEDA",
    dotColor: "#854F0B",
    textColor: "#854F0B",
  };
}

const VISIBLE_LIMIT = 3;

function WarningBar({ warning }: { warning: Warning }) {
  const { bg, dotColor, textColor } = warningBarStyle(warning.kind, warning.severity);
  const role = warning.severity === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: bg,
        borderRadius: "6px",
        padding: "8px",
        marginBottom: "4px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Dot indicator */}
      <span
        aria-hidden="true"
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: "13px",
          color: textColor,
          lineHeight: 1.5,
        }}
      >
        {warning.message}
      </span>
    </div>
  );
}

export default function WorkflowWarnings({ warnings }: WorkflowWarningsProps) {
  const [expanded, setExpanded] = useState(false);

  if (warnings.length === 0) return null;

  const hasOverflow = warnings.length > VISIBLE_LIMIT + 1;
  const overflowCount = warnings.length - VISIBLE_LIMIT;

  // If not expanded and there's overflow, show first VISIBLE_LIMIT items + "+N more" row
  const visibleWarnings =
    hasOverflow && !expanded ? warnings.slice(0, VISIBLE_LIMIT) : warnings;

  return (
    <div style={{ marginBottom: "16px" }}>
      {visibleWarnings.map((warning, idx) => (
        <WarningBar key={`${warning.kind}-${idx}`} warning={warning} />
      ))}

      {hasOverflow && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            backgroundColor: "#FAEEDA",
            borderRadius: "6px",
            padding: "8px",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "#854F0B",
            textAlign: "left",
            marginBottom: "4px",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#854F0B",
              flexShrink: 0,
            }}
          />
          +{overflowCount} more warnings
        </button>
      )}
    </div>
  );
}

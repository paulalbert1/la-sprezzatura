// Phase 44 Plan 07 Task 1 — WorkflowMetrics
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Surface 3 — Metrics row
//   .planning/phases/44-workflow-engine/44-07-PLAN.md § Task 1
//
// Renders 4 metric cards (Complete / In progress / Awaiting client / Blocked)
// + progress bar. No API calls — display only.

import type { WorkflowMetrics as WM } from "../../../lib/workflow/types";

interface WorkflowMetricsProps {
  metrics: WM;
}

// UI-SPEC § Metric card count colors
const METRIC_CARDS: Array<{
  label: string;
  key: keyof Omit<WM, "progressPct">;
  color: string;
}> = [
  { label: "Complete", key: "complete", color: "#27500A" },
  { label: "Active", key: "inProgress", color: "#9A7B4B" },
  { label: "Awaiting client", key: "awaitingClient", color: "#854F0B" },
  { label: "Blocked", key: "blocked", color: "#6B5E52" },
];

function progressFillColor(pct: number): string {
  if (pct > 60) return "#27500A";
  if (pct > 30) return "#9A7B4B";
  return "#854F0B";
}

export default function WorkflowMetrics({ metrics }: WorkflowMetricsProps) {
  const fillColor = progressFillColor(metrics.progressPct);

  return (
    <div
      style={{
        marginBottom: "16px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* 4-card grid — UI-SPEC: grid-cols-4 gap-2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {METRIC_CARDS.map(({ label, key, color }) => (
          <div
            key={key}
            style={{
              backgroundColor: "#F3EDE3",
              border: "0.5px solid #E8DDD0",
              borderRadius: "10px",
              padding: "8px 12px",
            }}
          >
            {/* Label — uppercase 11/600 muted */}
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#6B5E52",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                lineHeight: 1.4,
                marginBottom: "4px",
              }}
            >
              {label}
            </div>
            {/* Count — 18/600 colored */}
            <div
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color,
                lineHeight: 1.2,
              }}
            >
              {metrics[key]}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar section */}
      <div>
        {/* Label row: "Overall progress" (left) / "{pct}%" (right) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "#9E8E80",
              lineHeight: 1.4,
            }}
          >
            Overall progress
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "#9E8E80",
              lineHeight: 1.4,
            }}
          >
            {metrics.progressPct}%
          </span>
        </div>

        {/* Progress bar — 8px tall, rounded-full */}
        <div
          style={{
            height: "8px",
            borderRadius: "9999px",
            backgroundColor: "#F3EDE3",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.max(0, metrics.progressPct))}%`,
              backgroundColor: fillColor,
              borderRadius: "9999px",
              transition: "width 300ms ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

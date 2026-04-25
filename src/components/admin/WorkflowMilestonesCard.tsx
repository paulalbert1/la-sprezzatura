import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import StatusCircle from "./workflow/StatusCircle";
import type { MilestoneStatus } from "../../lib/workflow/types";

export interface WorkflowMilestoneRow {
  _key: string;
  /** Stable milestone id used as the schedule anchor (e.g. "ms_consult_agreement"). */
  milestoneId: string;
  phaseName: string;
  name: string;
  status: MilestoneStatus;
  assignee: string;
  blocked: boolean;
  blockPrereqName?: string;
  isNextUp: boolean;
  completedAt?: string;
}

interface Props {
  rows: WorkflowMilestoneRow[];
  scheduleUrl: string;
}

// Assignee chips — saturated + bordered so they read as distinct pills on
// cream surfaces. Mirror of the schedule view (MilestoneRow.tsx).
const ASSIGNEE_CHIP: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  designer: { bg: "#EFE3C0", text: "#7A5E32", border: "#D8C896" },
  client:   { bg: "#F4D9B0", text: "#6B3D08", border: "#D9B27C" },
  vendor:   { bg: "#DDEBC4", text: "#1F3F08", border: "#B8D095" },
  trade:    { bg: "#E0D5C5", text: "#4F4439", border: "#BFB1A1" },
};

function formatShort(iso?: string): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso.slice(0, 10));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

export default function WorkflowMilestonesCard({ rows, scheduleUrl }: Props) {
  const [showCompleted, setShowCompleted] = useState(false);

  const completedCount = rows.filter(
    (r) => r.status === "complete" || r.status === "skipped",
  ).length;

  // Stable two-bucket sort: completes/skipped first (history), then active +
  // upcoming (current and future work) — preserves workflow order within groups.
  const isDone = (r: WorkflowMilestoneRow) =>
    r.status === "complete" || r.status === "skipped";
  const sortedRows = [
    ...rows.filter(isDone),
    ...rows.filter((r) => !isDone(r)),
  ];

  const visible = showCompleted ? sortedRows : sortedRows.filter((r) => !isDone(r));

  const cardStyle = {
    backgroundColor: "#FFFEFB",
    border: "0.5px solid #E8DDD0",
    borderRadius: "10px",
    overflow: "hidden",
  } as const;

  return (
    <div style={cardStyle}>
      <div className="card-header flex items-center justify-between gap-3 px-5 h-[42px]">
        <h2 className="card-header-label">Schedule</h2>
        <a href={scheduleUrl} className="card-header-action">
          View schedule →
        </a>
      </div>
      <div style={{ padding: "16px 20px 18px" }}>

      {rows.length === 0 ? (
        <div className="py-6 text-center">
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "12.5px",
              color: "#9E8E80",
            }}
          >
            No milestones yet
          </p>
          <a
            href={scheduleUrl}
            className="mt-1 inline-block"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11.5px",
              color: "#9A7B4B",
            }}
          >
            Set up the workflow →
          </a>
        </div>
      ) : (
        <>
          {/* Flat list — phase grouping is recoverable on the schedule view. */}
          {visible.map((r) => {
            const isComplete = r.status === "complete";
            const isSkipped = r.status === "skipped";
            const chip = ASSIGNEE_CHIP[r.assignee] ?? {
              bg: "#F3EDE3",
              text: "#6B5E52",
              border: "#D4C8B8",
            };
            const completedDate = formatShort(r.completedAt);
            const rowHref = `${scheduleUrl}#${r.milestoneId}`;

            return (
              <a
                key={r._key}
                href={rowHref}
                aria-label={`${r.name} — open in schedule`}
                data-next-up={r.isNextUp ? "true" : undefined}
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  paddingLeft: r.isNextUp ? "8px" : "0",
                  marginLeft: r.isNextUp ? "-8px" : "0",
                  borderLeft: r.isNextUp ? "2px solid #9A7B4B" : "2px solid transparent",
                  backgroundColor: r.isNextUp ? "#FBF6EC" : "transparent",
                  borderBottom: "0.5px solid #E8DDD0",
                  transition: "background-color 150ms",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!r.isNextUp) {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#FAF7F2";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = r.isNextUp
                    ? "#FBF6EC"
                    : "transparent";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingTop: "6px",
                    paddingBottom: r.blocked ? "2px" : "6px",
                  }}
                >
                  <StatusCircle
                    status={r.status}
                    size={12}
                    isBlocked={r.blocked}
                    milestoneName={r.name}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-sans)",
                      fontSize: "12.5px",
                      color: isSkipped
                        ? "#9E8E80"
                        : isComplete
                          ? "#6B5E52"
                          : "#2C2520",
                      textDecoration: isSkipped ? "line-through" : "none",
                      lineHeight: 1.4,
                    }}
                  >
                    {r.name}
                  </span>
                  {r.isNextUp && (
                    <span
                      style={{
                        fontSize: "10.5px",
                        padding: "1px 6px",
                        borderRadius: "7px",
                        backgroundColor: "#9A7B4B",
                        color: "#FFFEFB",
                        flexShrink: 0,
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                      }}
                    >
                      Next up
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 500,
                      padding: "1px 8px",
                      borderRadius: "8px",
                      backgroundColor: chip.bg,
                      color: chip.text,
                      border: `0.5px solid ${chip.border}`,
                      flexShrink: 0,
                      lineHeight: 1.5,
                      textTransform: "capitalize",
                      letterSpacing: "0.02em",
                      opacity: isSkipped ? 0.6 : 1,
                    }}
                  >
                    {r.assignee}
                  </span>
                  {isComplete && completedDate && (
                    <span
                      style={{
                        fontSize: "10.5px",
                        color: "#9E8E80",
                        flexShrink: 0,
                      }}
                    >
                      {completedDate}
                    </span>
                  )}
                </div>

                {r.blocked && r.blockPrereqName && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "10.5px",
                      color: "#854F0B",
                      paddingLeft: "20px",
                      paddingBottom: "6px",
                    }}
                  >
                    <Lock size={10} aria-hidden="true" style={{ flexShrink: 0 }} />
                    <span>
                      Needs{" "}
                      <span
                        style={{
                          fontWeight: 600,
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                          textUnderlineOffset: "2px",
                        }}
                      >
                        {r.blockPrereqName}
                      </span>{" "}
                      to be completed
                    </span>
                  </div>
                )}
              </a>
            );
          })}

          {completedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-[5px] mt-[9px] transition-colors hover:text-[#9A7B4B]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11.5px",
                color: "#9E8E80",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {showCompleted ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  Hide {completedCount} completed
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Show {completedCount} completed
                </>
              )}
            </button>
          )}
        </>
      )}
      </div>
    </div>
  );
}

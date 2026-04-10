import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Eye, EyeOff } from "lucide-react";

interface Milestone {
  _key: string;
  name: string;
  date: string | null;
  completed: boolean;
}

interface Props {
  milestones: Milestone[];
  projectId: string;
  scheduleUrl: string;
}

function isMilestoneOverdue(m: Milestone): boolean {
  if (!m.date || m.completed) return false;
  const today = new Date().toISOString().split("T")[0];
  return m.date < today;
}

export default function MilestonesList({ milestones, projectId, scheduleUrl }: Props) {
  const [showCompleted, setShowCompleted] = useState(false);

  const completedCount = milestones.filter((m) => m.completed).length;
  const visibleMilestones = showCompleted
    ? milestones
    : milestones.filter((m) => !m.completed);

  const cardStyle = {
    backgroundColor: "#FFFEFB",
    border: "0.5px solid #E8DDD0",
    borderRadius: "10px",
    padding: "18px 20px",
  } as const;

  const titleStyle = {
    fontFamily: "var(--font-sans)",
    fontSize: "10.5px",
    fontWeight: 500,
    color: "#9E8E80",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  };

  return (
    <div style={cardStyle}>
      <div
        className="flex items-center justify-between mb-[14px] pb-[10px]"
        style={{ borderBottom: "0.5px solid #E8DDD0" }}
      >
        <h2 style={titleStyle}>Milestones</h2>
        <a
          href={scheduleUrl}
          className="transition-colors"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11.5px",
            color: "#9A7B4B",
            letterSpacing: "0.02em",
          }}
        >
          View schedule →
        </a>
      </div>

      {milestones.length > 0 ? (
        <>
          {visibleMilestones.map((m) => {
            const overdue = isMilestoneOverdue(m);
            const dotColor = m.completed
              ? "#9A7B4B"
              : overdue
                ? "#9B3A2A"
                : "#D4C8B8";
            const labelColor = m.completed
              ? "#9E8E80"
              : overdue
                ? "#9B3A2A"
                : "#2C2520";
            const dateColor = overdue && !m.completed ? "#9B3A2A" : "#9E8E80";

            return (
              <div
                key={m._key}
                className="flex items-center gap-[10px] py-[7px]"
                style={{ borderBottom: "0.5px solid #E8DDD0" }}
              >
                <span
                  className="rounded-full shrink-0"
                  style={{ width: "7px", height: "7px", backgroundColor: dotColor }}
                />
                <span
                  className="flex-1"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "12.5px",
                    color: labelColor,
                    textDecoration: m.completed ? "line-through" : "none",
                  }}
                >
                  {m.name}
                </span>
                {m.date && (
                  <span
                    className="shrink-0 tabular-nums"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "11.5px",
                      color: dateColor,
                      fontWeight: overdue && !m.completed ? 500 : 400,
                    }}
                  >
                    {format(parseISO(m.date), "MMM d")}
                  </span>
                )}
              </div>
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
      ) : (
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
            Add milestones in Schedule →
          </a>
        </div>
      )}
    </div>
  );
}

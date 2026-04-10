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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-charcoal"
          style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 400 }}
        >
          Milestones
        </h2>
        <a
          href={scheduleUrl}
          className="text-xs text-terracotta hover:text-terracotta/80 transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          View Schedule →
        </a>
      </div>

      {milestones.length > 0 ? (
        <div className="bg-white rounded-xl border border-stone-light/40 overflow-hidden">
          {visibleMilestones.map((m) => {
            const overdue = isMilestoneOverdue(m);
            return (
              <div
                key={m._key}
                className="flex items-center gap-3 px-5 py-3 border-b border-stone-light/10 last:border-b-0"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    m.completed
                      ? "bg-emerald-500"
                      : overdue
                        ? "bg-red-400"
                        : "bg-stone-light/40"
                  }`}
                />
                <span
                  className={`text-sm flex-1 ${
                    m.completed
                      ? "text-stone line-through"
                      : overdue
                        ? "text-red-600"
                        : "text-charcoal"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {m.name}
                </span>
                {m.date && (
                  <span
                    className={`text-xs shrink-0 tabular-nums ${
                      overdue && !m.completed
                        ? "text-red-500 font-medium"
                        : "text-stone-light"
                    }`}
                    style={{ fontFamily: "var(--font-body)" }}
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
              className="w-full flex items-center justify-center gap-1.5 px-5 py-2 text-[11px] text-stone-light hover:text-stone transition-colors border-t border-stone-light/10"
              style={{ fontFamily: "var(--font-body)" }}
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
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-light/40 px-5 py-6 text-center">
          <p className="text-sm text-stone" style={{ fontFamily: "var(--font-body)" }}>
            No milestones yet
          </p>
          <a
            href={scheduleUrl}
            className="text-xs text-terracotta hover:text-terracotta/80 mt-1 inline-block"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Add milestones in Schedule →
          </a>
        </div>
      )}
    </div>
  );
}

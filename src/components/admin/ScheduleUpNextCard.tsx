import { useState } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";

// Replaces the previous WorkflowStatusCard. Shows the next ~5 milestones
// across all active projects, sorted by date. Mirrors the per-project
// Schedule card's visual rhythm so the dashboard feels like a cross-project
// roll-up rather than a separate widget.

export interface UpNextMilestone {
  _key: string;
  name: string;
  date: string | null;
  completed: boolean;
  projectId: string;
  projectTitle: string;
}

interface Props {
  milestones: UpNextMilestone[];
}

const INITIAL_ROWS = 5;
const EXPAND_INCREMENT = 5;

function formatRelativeDate(iso: string): {
  label: string;
  overdue: boolean;
  soon: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseISO(iso);
  const days = differenceInCalendarDays(target, today);
  if (days < 0) {
    const abs = Math.abs(days);
    return { label: `${abs}d overdue`, overdue: true, soon: false };
  }
  if (days === 0) return { label: "Today", overdue: false, soon: true };
  if (days === 1) return { label: "Tomorrow", overdue: false, soon: true };
  if (days <= 7) return { label: `In ${days}d`, overdue: false, soon: true };
  return { label: format(target, "MMM d"), overdue: false, soon: false };
}

export default function ScheduleUpNextCard({ milestones }: Props) {
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_ROWS);

  const upcoming = milestones
    .filter((m) => !m.completed && m.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  const visible = upcoming.slice(0, visibleCount);
  const hiddenCount = Math.max(0, upcoming.length - visibleCount);
  const showMoreCount = Math.min(EXPAND_INCREMENT, hiddenCount);
  const isExpanded = visibleCount > INITIAL_ROWS;

  return (
    <div className="bg-white rounded-xl border border-stone-light/40 overflow-hidden">
      {/* Header — see global.css .card-header for tokens. */}
      <div className="card-header flex items-center justify-between gap-3 px-5 h-[42px]">
        <h2 className="card-header-label">Schedule — Up Next</h2>
        <a href="/admin/projects" className="card-header-action">
          View all →
        </a>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-stone text-center py-6">
          No upcoming milestones scheduled.
        </p>
      ) : (
        <div>
          {visible.map((m) => {
            const dateInfo = m.date ? formatRelativeDate(m.date) : null;
            const dateColor = dateInfo?.overdue
              ? "text-red-600 font-semibold"
              : dateInfo?.soon
                ? "text-amber-700 font-medium"
                : "text-stone";
            return (
              <a
                key={`${m.projectId}:${m._key}`}
                href={`/admin/projects/${m.projectId}#schedule`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-cream/50 transition-colors border-b border-stone-light/10 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className={`shrink-0 rounded-full ${
                    dateInfo?.overdue
                      ? "border border-red-500"
                      : dateInfo?.soon
                        ? "border border-amber-500"
                        : "border border-stone-light"
                  }`}
                  style={{ width: 10, height: 10 }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-charcoal block truncate">
                    {m.name}
                  </span>
                  <span className="text-[11.5px] text-stone block truncate mt-0.5">
                    {m.projectTitle}
                  </span>
                </div>
                {dateInfo && (
                  <span className={`text-[11.5px] font-body shrink-0 ${dateColor}`}>
                    {dateInfo.label}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      )}

      {(hiddenCount > 0 || isExpanded) && (
        <div className="border-t border-stone-light/10 text-center py-3">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((n) =>
                hiddenCount > 0 ? n + EXPAND_INCREMENT : INITIAL_ROWS,
              )
            }
            className="text-[13px] font-body text-stone hover:text-charcoal hover:underline underline-offset-2 bg-transparent border-0 cursor-pointer"
          >
            {hiddenCount > 0
              ? `Show ${showMoreCount} more`
              : "Show fewer"}
          </button>
        </div>
      )}
    </div>
  );
}

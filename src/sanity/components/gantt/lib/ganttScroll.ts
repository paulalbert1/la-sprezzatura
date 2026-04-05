import type { GanttTask } from "./ganttTypes";

/**
 * Compute which task index the Gantt chart should scroll to on load.
 *
 * Returns the index into the sorted-by-start-date task array of the
 * best scroll target, or null if no tasks exist.
 *
 * @param tasks - Array of GanttTask objects
 * @param now - Current date (injected for testability)
 * @returns Index of target task in the sorted array, or null
 */
export function computeSmartScrollTarget(
  tasks: GanttTask[],
  now: Date,
): number | null {
  if (tasks.length === 0) return null;

  const sorted = [...tasks].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  // Find first task whose effective end >= now (active or upcoming)
  const idx = sorted.findIndex((t) => {
    const end = t.end ?? t.start;
    return end.getTime() >= now.getTime();
  });

  if (idx !== -1) return idx;

  // All tasks in the past — scroll to first task (chart start)
  return 0;
}

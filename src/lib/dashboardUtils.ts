import { differenceInDays, isPast, parseISO } from "date-fns";

/** Check if a task is overdue: has dueDate, not completed, dueDate is in the past */
export function isTaskOverdue(task: {
  dueDate?: string | null;
  completed?: boolean;
}): boolean {
  if (!task.dueDate || task.completed) return false;
  // Parse as end-of-day so tasks due "today" are not overdue until tomorrow
  const due = parseISO(task.dueDate + "T23:59:59");
  return isPast(due);
}

/** Check if a milestone is overdue: has date, not completed, date is in the past */
export function isMilestoneOverdue(milestone: {
  date?: string | null;
  completed?: boolean;
}): boolean {
  if (!milestone.date || milestone.completed) return false;
  const due = parseISO(milestone.date + "T23:59:59");
  return isPast(due);
}

/** Compute days since pipeline stage last changed. Falls back to 0 if null. */
export function getDaysInStage(
  stageChangedAt: string | null | undefined,
): number {
  if (!stageChangedAt) return 0;
  return Math.max(0, differenceInDays(new Date(), new Date(stageChangedAt)));
}

/** Aggregate overdue counts for the dashboard banner */
export interface OverdueBannerData {
  total: number;
  milestoneCount: number;
  taskCount: number;
}

export function getOverdueBannerData(
  milestones: Array<{ date?: string | null; completed?: boolean }>,
  tasks: Array<{ dueDate?: string | null; completed?: boolean }>,
): OverdueBannerData {
  const milestoneCount = milestones.filter(isMilestoneOverdue).length;
  const taskCount = tasks.filter(isTaskOverdue).length;
  return { total: milestoneCount + taskCount, milestoneCount, taskCount };
}

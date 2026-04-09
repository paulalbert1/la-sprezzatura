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

/** Compute how many days overdue a date string is (positive = overdue) */
export function getDaysOverdue(dateStr: string): number {
  return Math.max(0, differenceInDays(new Date(), parseISO(dateStr)));
}

/** Aggregate overdue counts for the dashboard banner */
export interface OverdueBannerData {
  total: number;
  milestoneCount: number;
  taskCount: number;
  /** First overdue milestone (for specific single-item banner copy) */
  firstMilestone: { name: string; projectTitle: string; daysOverdue: number } | null;
  /** First overdue task (for specific single-item banner copy) */
  firstTask: { description: string; projectTitle: string; daysOverdue: number } | null;
  /** Number of distinct projects with overdue items */
  projectCount: number;
}

export function getOverdueBannerData(
  milestones: Array<{ date?: string | null; completed?: boolean; name?: string; projectTitle?: string }>,
  tasks: Array<{ dueDate?: string | null; completed?: boolean; description?: string; projectTitle?: string }>,
): OverdueBannerData {
  const overdueMilestones = milestones.filter(isMilestoneOverdue);
  const overdueTasks = tasks.filter(isTaskOverdue);
  const milestoneCount = overdueMilestones.length;
  const taskCount = overdueTasks.length;

  const projectNames = new Set([
    ...overdueMilestones.map((m) => m.projectTitle).filter(Boolean),
    ...overdueTasks.map((t) => t.projectTitle).filter(Boolean),
  ]);

  const firstMilestone = overdueMilestones[0]
    ? {
        name: overdueMilestones[0].name || "",
        projectTitle: overdueMilestones[0].projectTitle || "",
        daysOverdue: overdueMilestones[0].date ? getDaysOverdue(overdueMilestones[0].date) : 0,
      }
    : null;

  const firstTask = overdueTasks[0]
    ? {
        description: overdueTasks[0].description || "",
        projectTitle: overdueTasks[0].projectTitle || "",
        daysOverdue: overdueTasks[0].dueDate ? getDaysOverdue(overdueTasks[0].dueDate) : 0,
      }
    : null;

  return {
    total: milestoneCount + taskCount,
    milestoneCount,
    taskCount,
    firstMilestone,
    firstTask,
    projectCount: projectNames.size,
  };
}

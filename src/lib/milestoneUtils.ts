export type MilestoneNote = {
  _key: string;
  text: string;
  clientName: string;
  timestamp: string;
};

export type Milestone = {
  _key: string;
  name: string;
  date: string | null;
  completed: boolean;
  description?: string;
  notes?: MilestoneNote[];
};

/**
 * Sort milestones by date ascending. Milestones with null dates sort last.
 * Returns a new array (does not mutate).
 */
export function sortMilestones(milestones: Milestone[]): Milestone[] {
  return [...milestones].sort((a, b) => {
    if (a.date === null && b.date === null) return 0;
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return a.date.localeCompare(b.date);
  });
}

/**
 * Compute milestone progress from an array of milestones.
 */
export function getMilestoneProgress(milestones: Milestone[]): {
  total: number;
  completed: number;
  percent: number;
} {
  const total = milestones.length;
  if (total === 0) return { total: 0, completed: 0, percent: 0 };
  const completed = milestones.filter((m) => m.completed).length;
  const percent = Math.round((completed / total) * 100);
  return { total, completed, percent };
}

/**
 * Determine the display status of a single milestone.
 * `isFirstIncomplete` should be true only for the first incomplete milestone
 * in the sorted list -- it becomes the "current" milestone.
 */
export function getMilestoneStatus(
  milestone: Milestone,
  isFirstIncomplete: boolean,
): "completed" | "current" | "overdue" | "upcoming" {
  if (milestone.completed) return "completed";
  if (isFirstIncomplete) return "current";

  if (milestone.date) {
    const milestoneDate = new Date(milestone.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (milestoneDate < today) return "overdue";
  }

  return "upcoming";
}

/**
 * Format a date string (YYYY-MM-DD or ISO) as a human-readable relative date.
 * Examples: "today", "in 4 days", "2 days ago", "in 2 weeks", "3 weeks ago"
 */
export function formatRelativeDate(dateStr: string): string {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";

  const absDays = Math.abs(diffDays);

  if (absDays < 14) {
    const unit = absDays === 1 ? "day" : "days";
    return diffDays > 0 ? `in ${absDays} ${unit}` : `${absDays} ${unit} ago`;
  }

  const weeks = Math.round(absDays / 7);
  const unit = weeks === 1 ? "week" : "weeks";
  return diffDays > 0 ? `in ${weeks} ${unit}` : `${weeks} ${unit} ago`;
}

/**
 * Determine if a project should be visible to the client.
 *
 * Visible if:
 * - No completedAt date (project is active), OR
 * - completedAt is within the warranty window (default 1 year), OR
 * - projectStatus is "reopened" (overrides the warranty window)
 *
 * Warranty window default: 365 days from completedAt. Standard interior-
 * design warranty term. The 30-day window this used to use was too short
 * for the actual operator intent ("client should retain access through
 * the warranty period to retrieve warranty docs"). When a per-project
 * `warrantyEndsAt` field is added later, this function should prefer
 * that value over the computed default.
 */
const WARRANTY_WINDOW_DAYS = 365;

export function isProjectVisible(project: {
  completedAt?: string | null;
  projectStatus?: string;
}): boolean {
  if (project.projectStatus === "reopened") return true;
  if (!project.completedAt) return true;

  const warrantyCutoff = new Date();
  warrantyCutoff.setDate(warrantyCutoff.getDate() - WARRANTY_WINDOW_DAYS);
  return new Date(project.completedAt) > warrantyCutoff;
}

/**
 * Check if a project is completed.
 */
export function isProjectCompleted(project: {
  projectStatus?: string;
}): boolean {
  return project.projectStatus === "completed";
}

/**
 * Check if a project has been reopened.
 */
export function isProjectReopened(project: {
  projectStatus?: string;
}): boolean {
  return project.projectStatus === "reopened";
}

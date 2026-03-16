/**
 * Determine if a project should be visible to the client.
 * Visible if:
 * - No completedAt date (project is active)
 * - completedAt is within the last 30 days
 * - projectStatus is "reopened" (overrides the 30-day window)
 */
export function isProjectVisible(project: {
  completedAt?: string | null;
  projectStatus?: string;
}): boolean {
  if (project.projectStatus === "reopened") return true;
  if (!project.completedAt) return true;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(project.completedAt) > thirtyDaysAgo;
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

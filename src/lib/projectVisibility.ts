/**
 * Determine if a project should be visible to the client.
 *
 * Override (clientPortalVisibility) wins first:
 * - "shown"  -> always visible (designer override; e.g. extend access for
 *               warranty retrieval after the auto-window closes)
 * - "hidden" -> never visible (designer override; e.g. paused engagement)
 *
 * Otherwise (clientPortalVisibility == "auto" or unset), the auto rule:
 * - projectStatus === "reopened" -> visible (overrides post-completion cutoff)
 * - No completedAt               -> visible (project is active)
 * - completedAt within last 30d  -> visible
 * - else                         -> hidden
 *
 * The 30-day window matches the designer's stated rule for client portal
 * access; the manual override is the escape hatch for the cases where 30d
 * isn't right.
 */
const POST_COMPLETION_WINDOW_DAYS = 30;

export type ClientPortalVisibility = "auto" | "shown" | "hidden";

export function isProjectVisible(project: {
  completedAt?: string | null;
  projectStatus?: string;
  clientPortalVisibility?: ClientPortalVisibility | string | null;
}): boolean {
  // Manual overrides win over the auto rule.
  if (project.clientPortalVisibility === "shown") return true;
  if (project.clientPortalVisibility === "hidden") return false;

  // Auto rule (clientPortalVisibility "auto" or unset).
  if (project.projectStatus === "reopened") return true;
  if (!project.completedAt) return true;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - POST_COMPLETION_WINDOW_DAYS);
  return new Date(project.completedAt) > cutoff;
}

/**
 * Classify a project's portal access state. Used by the dashboard to
 * render past projects as either clickable cards (still accessible) or
 * "access expired" stubs (used to be visible, now auto-hidden, no link).
 *
 *  "active"             -> project is not completed; full access
 *  "completed-visible"  -> completed AND visible per isProjectVisible
 *                          (within 30d, OR manually shown, OR reopened)
 *  "expired"            -> completed AND past the 30d window AND not
 *                          manually shown -> show as a stub on the dashboard
 *                          but do NOT serve PROJECT_DETAIL data on the
 *                          per-project page
 *  "hidden"             -> manually flagged "hidden" -> do not surface at all
 */
export type ProjectAccessState =
  | "active"
  | "completed-visible"
  | "expired"
  | "hidden";

export function getProjectAccessState(project: {
  completedAt?: string | null;
  projectStatus?: string;
  clientPortalVisibility?: ClientPortalVisibility | string | null;
}): ProjectAccessState {
  if (project.clientPortalVisibility === "hidden") return "hidden";
  if (!project.completedAt && project.projectStatus !== "completed") {
    return "active";
  }
  if (isProjectVisible(project)) return "completed-visible";
  return "expired";
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

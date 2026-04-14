import { useMemo, useState } from "react";
import { actions } from "astro:actions";
import { format, parseISO } from "date-fns";
import { STAGE_META, STAGES, type StageKey } from "../../lib/portalStages";
import ToastContainer, { useToast } from "./ui/ToastContainer";

// Phase 36 Plan 02 — ProjectsGrid tier rendering
// Source of truth:
//   - .planning/phases/36-projects-list-archive-lifecycle/36-UI-SPEC.md
//     § Component Inventory (ArchiveToggle, TierDivider, Row visual variants,
//       Archived row right-side action slot, Empty state — archived view)
//     § Color → "Opacity tier contract"
//     § Copywriting Contract (every user-facing string)
//   - .planning/phases/36-projects-list-archive-lifecycle/36-CONTEXT.md
//     D-07/D-08/D-09/D-10/D-11
//
// Extends the existing flat grid with a three-tier render pass: active (100%)
// → completed non-archived (70%) → archived (50%). A thin <hr> divider
// introduces each non-empty subsequent tier. The archived tier is gated by an
// "Include archived" checkbox in the filter bar (no persistence — reload
// resets to off, matching Phase 35 DASH-21/22 pattern and CONTEXT D-08).

interface Project {
  _id: string;
  title: string;
  pipelineStage: string;
  projectStatus: string;
  clientName?: string;
  _updatedAt: string;
  completedAt?: string | null;
  archivedAt?: string | null;
}

interface Props {
  projects: Project[];
}

type Tier = "active" | "completed" | "archived";

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  discovery: { bg: "#F5F1EB", text: "#7A6B5A" },
  concept: { bg: "#FEF3E0", text: "#9A6B2E" },
  "design-development": { bg: "#E8F0F7", text: "#3E6FA0" },
  procurement: { bg: "#E8F3EC", text: "#3E7A52" },
  installation: { bg: "#F0E8F5", text: "#6A3E90" },
  closeout: { bg: "#F5F1EB", text: "#7A6B5A" },
};

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  active: { bg: "#E8F3EC", text: "#3E7A52", dot: "#5FA67A" },
  reopened: { bg: "#E8F0F7", text: "#3E6FA0", dot: "#5F89B8" },
  completed: { bg: "#F3EEE6", text: "#7A6B5A", dot: "#A89882" },
  paused: { bg: "#FEF3E0", text: "#9A6B2E", dot: "#D4A574" },
  cancelled: { bg: "#FBEAE8", text: "#A84838", dot: "#C87060" },
};

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// Phase 36: year-aware "Archived MMM d" formatter per UI-SPEC § Copywriting
// Contract. Falls back to "MMM d, yyyy" when archive year != current year.
function formatArchivedDate(iso: string): string {
  const d = parseISO(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    ? format(d, "MMM d")
    : format(d, "MMM d, yyyy");
}

const TierDivider = () => (
  <hr
    className="my-5 border-0 border-t"
    style={{ borderTopColor: "#E8DDD0", gridColumn: "1 / -1" }}
  />
);

function ProjectsGridInner({ projects }: Props) {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [pendingUnarchiveId, setPendingUnarchiveId] = useState<string | null>(
    null,
  );
  const { show } = useToast();

  const { activeRows, completedRows, archivedRows, totalVisible } = useMemo(() => {
    const passesFilters = (p: Project) => {
      if (stageFilter !== "all" && p.pipelineStage !== stageFilter) return false;
      if (statusFilter !== "all" && p.projectStatus !== statusFilter)
        return false;
      return true;
    };

    const filtered = projects.filter(passesFilters);

    const active = filtered
      .filter((p) => !p.archivedAt && p.pipelineStage !== "completed")
      .sort((a, b) => +new Date(b._updatedAt) - +new Date(a._updatedAt));

    const completed = filtered
      .filter((p) => !p.archivedAt && p.pipelineStage === "completed")
      .sort((a, b) => +new Date(b._updatedAt) - +new Date(a._updatedAt));

    const archived = filtered
      .filter((p) => !!p.archivedAt)
      .sort(
        (a, b) => +new Date(b.archivedAt!) - +new Date(a.archivedAt!),
      );

    const visibleArchivedCount = includeArchived ? archived.length : 0;
    return {
      activeRows: active,
      completedRows: completed,
      archivedRows: archived,
      totalVisible: active.length + completed.length + visibleArchivedCount,
    };
  }, [projects, stageFilter, statusFilter, includeArchived]);

  const filterSelectStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "12px",
    color: "#6B5E52",
    background: "#FFFEFB",
    border: "0.5px solid #D4C8B8",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    outline: "none",
  };

  async function handleUnarchive(projectId: string) {
    setPendingUnarchiveId(projectId);
    try {
      const result = await actions.unarchiveProject({ projectId });
      if (result?.error) {
        throw new Error(result.error.message || "Failed");
      }
      show({
        variant: "success",
        title: "Project restored.",
        duration: 3000,
      });
      window.location.reload();
    } catch {
      show({
        variant: "error",
        title: "Couldn't restore — try again.",
        duration: 5000,
      });
      setPendingUnarchiveId(null);
    }
  }

  function renderRow(project: Project, tier: Tier) {
    const stageMeta = STAGE_META[project.pipelineStage as StageKey];
    const stageColor =
      STAGE_COLORS[project.pipelineStage] || STAGE_COLORS.discovery;
    const statusInfo =
      STATUS_COLORS[project.projectStatus] || STATUS_COLORS.active;

    // Tier-driven opacity per UI-SPEC § Color → Opacity tier contract.
    // Literal values (active=1, completed=0.7, archived=0.5) applied to the
    // entire row anchor so all children dim uniformly; the archived-row
    // Unarchive button overrides this back to 1 explicitly.
    const tierOpacity =
      tier === "archived"
        ? /* opacity: 0.5 */ 0.5
        : tier === "completed"
          ? /* opacity: 0.7 */ 0.7
          : 1;
    const isArchived = tier === "archived";

    return (
      <a
        key={project._id}
        href={`/admin/projects/${project._id}`}
        style={{
          display: "block",
          position: "relative",
          background: "#FFFEFB",
          border: "0.5px solid #E8DDD0",
          borderRadius: "10px",
          padding: "18px 20px",
          textDecoration: "none",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
          opacity: tierOpacity,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#D4C8B8";
          e.currentTarget.style.boxShadow =
            "0 2px 8px rgba(44,37,32,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#E8DDD0";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Inline Unarchive button (archived rows only). Overrides parent
            opacity via explicit style so the action remains at full contrast.
            preventDefault + stopPropagation so the button never navigates to
            the project detail. */}
        {isArchived && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleUnarchive(project._id);
            }}
            disabled={pendingUnarchiveId === project._id}
            className="absolute"
            style={{
              right: "20px",
              top: "18px",
              opacity: 1,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor:
                pendingUnarchiveId === project._id ? "wait" : "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: "12.5px",
              color: "#C4836A",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
              e.currentTarget.style.textUnderlineOffset = "2px";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
            aria-label={`Unarchive ${project.title}`}
          >
            Unarchive
          </button>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "#2C2520",
            fontFamily: "var(--font-sans)",
            marginBottom: "2px",
            lineHeight: 1.3,
          }}
        >
          {project.title}
        </div>

        {/* Client name under title */}
        {project.clientName && (
          <div
            style={{
              fontSize: "12.5px",
              color: "#9E8E80",
              fontFamily: "var(--font-sans)",
              marginBottom: isArchived ? "2px" : "14px",
            }}
          >
            {project.clientName}
          </div>
        )}
        {!project.clientName && (
          <div style={{ marginBottom: isArchived ? "2px" : "14px" }} />
        )}

        {/* Archived subtitle — italic, 11.5px, stone, sits below client name */}
        {isArchived && project.archivedAt && (
          <div
            style={{
              fontSize: "11.5px",
              color: "#9E8E80",
              fontFamily: "var(--font-sans)",
              fontStyle: "italic",
              marginTop: "2px",
              marginBottom: "14px",
            }}
          >
            Archived {formatArchivedDate(project.archivedAt)}
          </div>
        )}

        {/* Badges row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          {stageMeta && (
            <span
              style={{
                display: "inline-flex",
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "10.5px",
                fontWeight: 500,
                background: stageColor.bg,
                color: stageColor.text,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontFamily: "var(--font-sans)",
              }}
            >
              {stageMeta.title}
            </span>
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "10.5px",
              fontWeight: 500,
              background: statusInfo.bg,
              color: statusInfo.text,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: statusInfo.dot,
              }}
            />
            {project.projectStatus || "active"}
          </span>
        </div>

        {/* Footer: updated time — preserved verbatim from pre-Phase-36 state
            per UI-SPEC §"Notes for Downstream Agents" (Phase 35 already chose
            what to purge; this surface stays unchanged). */}
        <div
          style={{
            marginTop: "14px",
            paddingTop: "10px",
            borderTop: "0.5px solid #EEE6DC",
            fontSize: "11px",
            color: "#9E8E80",
            fontFamily: "var(--font-sans)",
          }}
        >
          Updated {formatRelativeTime(project._updatedAt)}
        </div>
      </a>
    );
  }

  const hasActive = activeRows.length > 0;
  const hasCompleted = completedRows.length > 0;
  const hasArchivedVisible = includeArchived && archivedRows.length > 0;
  // Second divider renders when the toggle is on and there's at least one
  // prior tier on screen — gives the "No archived projects yet" empty state
  // a structural anchor (UI-SPEC § Empty state — archived view).
  const showArchivedEmptyState =
    includeArchived && archivedRows.length === 0 && (hasActive || hasCompleted);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          style={filterSelectStyle}
          aria-label="Filter by stage"
        >
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.title}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={filterSelectStyle}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="reopened">Reopened</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {/* Phase 36 PROJ-05: "Include archived" toggle. State is NOT persisted
            across reload (CONTEXT D-08). */}
        <label
          className="flex items-center gap-2 cursor-pointer ml-3"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="w-3.5 h-3.5 accent-terracotta"
            aria-label="Include archived projects"
          />
          <span style={{ fontSize: "12px", color: "#9E8E80" }}>
            Include archived
          </span>
        </label>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "11.5px",
            color: "#9E8E80",
            fontFamily: "var(--font-sans)",
          }}
        >
          {totalVisible} of {projects.length} · sorted by recently updated
        </span>
      </div>

      {/* Three-tier render pass. Empty state only when nothing is visible in
          any tier under the current filters. */}
      {totalVisible === 0 && !showArchivedEmptyState ? (
        <div
          style={{
            background: "#FFFEFB",
            border: "0.5px solid #E8DDD0",
            borderRadius: "10px",
            padding: "48px 24px",
            textAlign: "center",
            color: "#9E8E80",
            fontSize: "13px",
            fontFamily: "var(--font-sans)",
          }}
        >
          No projects match these filters.
        </div>
      ) : (
        <>
          {hasActive && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
              {activeRows.map((p) => renderRow(p, "active"))}
            </div>
          )}

          {hasActive && hasCompleted && <TierDivider />}

          {hasCompleted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
              {completedRows.map((p) => renderRow(p, "completed"))}
            </div>
          )}

          {hasArchivedVisible && (hasActive || hasCompleted) && <TierDivider />}

          {hasArchivedVisible && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
              {archivedRows.map((p) => renderRow(p, "archived"))}
            </div>
          )}

          {showArchivedEmptyState && (
            <>
              <TierDivider />
              <div
                className="text-center py-6"
                style={{
                  color: "#B8B0A4",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                }}
              >
                No archived projects yet.
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function ProjectsGrid(props: Props) {
  // Local ToastContainer — React context does not cross Astro island
  // boundaries, so the inline Unarchive button needs its own provider.
  return (
    <ToastContainer>
      <ProjectsGridInner {...props} />
    </ToastContainer>
  );
}

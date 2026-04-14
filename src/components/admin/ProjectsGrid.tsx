import { useMemo, useState } from "react";
import { actions } from "astro:actions";
import { format, parseISO } from "date-fns";
import { STAGE_META, STAGES, type StageKey } from "../../lib/portalStages";
import ToastContainer, { useToast } from "./ui/ToastContainer";

// Phase 36 Plan 04 — ProjectsGrid card status redesign
// Source of truth:
//   - .planning/phases/36-projects-list-archive-lifecycle/36-04-PLAN.md
//     § design_spec (active / paused / completed / cancelled / archived card treatments)
//   - /Users/paulalbert/Downloads/project_cards_status_redesign.html (mockup)
//
// This plan REPLACES the Plan 02 pipelineStage-driven three-tier model with a
// projectStatus + archivedAt driven card treatment system. Two visual sections:
//   1. Active — projectStatus in {active, reopened} (or unset), archivedAt null
//   2. Non-active — paused/completed/cancelled (no archivedAt) + archived
//      (when "Include archived" is on), in that visual order
//
// Card treatment (borderColor, opacity, status label) communicates lifecycle
// state. The pipelineStage badge is unaffected — it still owns its own badge
// row independently. Archive WINS over projectStatus when both are set.
//
// Opacity contract: 1.0 active / 0.6 paused|completed|cancelled / 0.4 archived.
// (The mockup file specified 0.7/0.55/0.45 — per plan directive, the 0.6/0.4
// values are the source of truth.)

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

// Phase 36 Plan 04 — card-level lifecycle treatment.
// Kind drives the left border, opacity, and status label above the title.
// Archive wins: if archivedAt is set, kind is "archived" regardless of projectStatus.
type CardKind =
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "archived";

interface CardTreatment {
  kind: CardKind;
  borderColor: string | null; // hex; null for active (no left border modification)
  opacity: number; // 1.0 active | 0.6 paused/completed/cancelled | 0.4 archived
  statusLabel: string | null;
  statusColor: string | null;
  statusIcon: "pause" | "check" | "x" | "archive" | null;
}

function buildCardTreatment(project: Project): CardTreatment {
  // Archive wins over projectStatus.
  if (project.archivedAt) {
    return {
      kind: "archived",
      borderColor: "#9E8E80", // stone
      opacity: 0.4,
      statusLabel: `Archived ${formatArchivedDate(project.archivedAt)}`,
      statusColor: "#9E8E80",
      statusIcon: null, // italic-only label reads cleaner than a glyph
    };
  }
  switch (project.projectStatus) {
    case "paused":
      return {
        kind: "paused",
        borderColor: "#EF9F27",
        opacity: 0.6,
        statusLabel: "Paused",
        statusColor: "#BA7517",
        statusIcon: "pause",
      };
    case "completed":
      return {
        kind: "completed",
        borderColor: "#97C459",
        opacity: 0.6,
        statusLabel: "Completed",
        statusColor: "#639922",
        statusIcon: "check",
      };
    case "cancelled":
      return {
        kind: "cancelled",
        borderColor: "var(--color-text-tertiary)",
        opacity: 0.6,
        statusLabel: "Cancelled",
        statusColor: "var(--color-text-tertiary)",
        statusIcon: "x",
      };
    // "active", "reopened", undefined/empty all render as active (no treatment).
    default:
      return {
        kind: "active",
        borderColor: null,
        opacity: 1,
        statusLabel: null,
        statusColor: null,
        statusIcon: null,
      };
  }
}

function iconChar(icon: CardTreatment["statusIcon"]): string {
  switch (icon) {
    case "pause":
      return "⏸";
    case "check":
      return "✓";
    case "x":
      return "✕";
    case "archive":
      return "⊘";
    default:
      return "";
  }
}

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

// Phase 36 PROJ-01 — thin horizontal divider between the Active section and
// the Non-active section. Same 1px #E8DDD0 stroke the UI-SPEC specified; the
// name changed in Plan 04 from TierDivider to SectionDivider because the
// layout model shifted from three tiers to two sections.
const SectionDivider = () => (
  <hr
    className="my-5 border-0 border-t"
    style={{ borderTopColor: "#E8DDD0", gridColumn: "1 / -1" }}
  />
);

// Phase 36 Plan 04 — section header with visible count.
// Counts reflect what's currently on screen: Active count = activeCards.length,
// Non-active count = nonActiveCards.length + (includeArchived ? archivedCards.length : 0).
function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "#9E8E80",
        fontFamily: "var(--font-sans)",
        marginBottom: "12px",
      }}
    >
      {label} ({count})
    </div>
  );
}

function ProjectsGridInner({ projects }: Props) {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [pendingUnarchiveId, setPendingUnarchiveId] = useState<string | null>(
    null,
  );
  const { show } = useToast();

  // Phase 36 Plan 04 section classification — two visual sections driven by
  // projectStatus + archivedAt (no longer pipelineStage-driven):
  //   activeCards      — projectStatus in {active, reopened, unset} & !archivedAt
  //   nonActiveCards   — projectStatus in {paused, completed, cancelled} & !archivedAt
  //   archivedCards    — archivedAt != null (regardless of projectStatus)
  // The Non-active section visually concatenates nonActiveCards + archivedCards
  // (the latter only when `includeArchived` is true).
  const { activeCards, nonActiveCards, archivedCards, totalVisible } = useMemo(() => {
    const passesFilters = (p: Project) => {
      if (stageFilter !== "all" && p.pipelineStage !== stageFilter) return false;
      if (statusFilter !== "all" && p.projectStatus !== statusFilter)
        return false;
      return true;
    };

    const filtered = projects.filter(passesFilters);

    const isActiveStatus = (s: string | undefined) =>
      !s || s === "active" || s === "reopened";
    const isNonActiveStatus = (s: string | undefined) =>
      s === "paused" || s === "completed" || s === "cancelled";

    const active = filtered
      .filter((p) => !p.archivedAt && isActiveStatus(p.projectStatus))
      .sort((a, b) => +new Date(b._updatedAt) - +new Date(a._updatedAt));

    const nonActive = filtered
      .filter((p) => !p.archivedAt && isNonActiveStatus(p.projectStatus))
      .sort((a, b) => +new Date(b._updatedAt) - +new Date(a._updatedAt));

    const archived = filtered
      .filter((p) => !!p.archivedAt)
      .sort(
        (a, b) => +new Date(b.archivedAt!) - +new Date(a.archivedAt!),
      );

    const visibleArchivedCount = includeArchived ? archived.length : 0;
    return {
      activeCards: active,
      nonActiveCards: nonActive,
      archivedCards: archived,
      totalVisible: active.length + nonActive.length + visibleArchivedCount,
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

  function renderRow(project: Project) {
    const stageMeta = STAGE_META[project.pipelineStage as StageKey];
    const stageColor =
      STAGE_COLORS[project.pipelineStage] || STAGE_COLORS.discovery;
    const statusInfo =
      STATUS_COLORS[project.projectStatus] || STATUS_COLORS.active;

    // Phase 36 Plan 04 — card treatment drives opacity + left border.
    // Opacity: 1 active | 0.6 paused/completed/cancelled | 0.4 archived.
    // Archived-row Unarchive button overrides this back to 1 explicitly.
    const treatment = buildCardTreatment(project);
    const isArchived = treatment.kind === "archived";
    const hasTreatment = treatment.borderColor !== null;

    const cardStyle: React.CSSProperties = {
      display: "block",
      position: "relative",
      background: "#FFFEFB",
      border: "0.5px solid #E8DDD0",
      borderRadius: "10px",
      padding: "18px 20px",
      textDecoration: "none",
      transition: "border-color 150ms ease, box-shadow 150ms ease",
      opacity: treatment.opacity,
    };
    if (hasTreatment && treatment.borderColor) {
      // 3px solid left border, square left corners, right corners preserved.
      cardStyle.borderLeft = `3px solid ${treatment.borderColor}`;
      cardStyle.borderTopLeftRadius = 0;
      cardStyle.borderBottomLeftRadius = 0;
    }

    return (
      <a
        key={project._id}
        href={`/admin/projects/${project._id}`}
        style={cardStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#D4C8B8";
          e.currentTarget.style.boxShadow =
            "0 2px 8px rgba(44,37,32,0.04)";
          // Preserve the left-border color under the hover override.
          if (hasTreatment && treatment.borderColor) {
            e.currentTarget.style.borderLeftColor = treatment.borderColor;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#E8DDD0";
          e.currentTarget.style.boxShadow = "none";
          if (hasTreatment && treatment.borderColor) {
            e.currentTarget.style.borderLeftColor = treatment.borderColor;
          }
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

        {/* Phase 36 Plan 04 — status label sits above the title when the card
            has a non-active treatment. Archived uses italic with no icon;
            paused/completed/cancelled use an uppercase label + glyph. */}
        {treatment.statusLabel && treatment.statusColor && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: isArchived ? "none" : "uppercase",
              color: treatment.statusColor,
              fontStyle: isArchived ? "italic" : "normal",
              marginBottom: 8,
              fontFamily: "var(--font-sans)",
              lineHeight: 1,
            }}
          >
            {treatment.statusIcon && (
              <span
                aria-hidden="true"
                style={{ fontSize: 12, lineHeight: 1 }}
              >
                {iconChar(treatment.statusIcon)}
              </span>
            )}
            {treatment.statusLabel}
          </div>
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
              marginBottom: "14px",
            }}
          >
            {project.clientName}
          </div>
        )}
        {!project.clientName && <div style={{ marginBottom: "14px" }} />}

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

  // Phase 36 Plan 04 — two-section render.
  // Section 1: Active cards.
  // Section 2: Non-active (paused/completed/cancelled) cards, followed by
  //            archived cards when `includeArchived` is true.
  const hasActive = activeCards.length > 0;
  const hasNonActive = nonActiveCards.length > 0;
  const hasArchivedVisible = includeArchived && archivedCards.length > 0;
  const nonActiveSectionHasContent = hasNonActive || hasArchivedVisible;
  const nonActiveCount =
    nonActiveCards.length + (includeArchived ? archivedCards.length : 0);

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
        {/* Phase 36 PROJ-05: "Include archived" toggle. When on, archived
            cards appear at the end of the Non-active section. State is NOT
            persisted across reload (CONTEXT D-08). */}
        <label
          className="flex items-center gap-2 cursor-pointer ml-3"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="w-3.5 h-3.5 accent-terracotta"
            aria-label="Include archived projects at the end of the non-active section"
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

      {/* Two-section render pass (Phase 36 Plan 04). Empty state only when
          no projects match filters in either section. */}
      {totalVisible === 0 ? (
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
          {/* Section 1 — Active */}
          {hasActive && (
            <>
              <SectionHeader label="Active" count={activeCards.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
                {activeCards.map((p) => renderRow(p))}
              </div>
            </>
          )}

          {/* PROJ-01 divider between Active and Non-active */}
          {hasActive && (nonActiveSectionHasContent || includeArchived) && (
            <SectionDivider />
          )}

          {/* Section 2 — Non-active (paused/completed/cancelled + archived) */}
          {(nonActiveSectionHasContent || includeArchived) && (
            <>
              <SectionHeader label="Non-active" count={nonActiveCount} />
              {nonActiveSectionHasContent ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
                  {nonActiveCards.map((p) => renderRow(p))}
                  {hasArchivedVisible &&
                    archivedCards.map((p) => renderRow(p))}
                </div>
              ) : (
                <div
                  className="text-center py-6"
                  style={{
                    color: "#B8B0A4",
                    fontSize: "13px",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {includeArchived
                    ? "No completed, paused, cancelled, or archived projects."
                    : "No completed, paused, or cancelled projects."}
                </div>
              )}
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

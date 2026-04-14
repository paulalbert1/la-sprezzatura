import { useState } from "react";
import { format, parseISO } from "date-fns";
import CardFilterInput from "./ui/CardFilterInput";
import {
  STAGE_META,
  STAGE_COLORS,
  type StageKey,
} from "../../lib/portalStages";
import { getDaysInStage } from "../../lib/dashboardUtils";

// Phase 35 Plan 03 — ActiveProjectsCard
// Source of truth: .planning/phases/35-dashboard-polish-global-ux-cleanup/35-UI-SPEC.md
// Requirements: DASH-16; CONTEXT D-03, D-04
//
// React island replacing the inline Astro Active Projects card on
// /admin/dashboard. Owns:
//   - Filter state (free-text, case-insensitive substring match over
//     title / clientName / stage label). Live per-keystroke, no debounce.
//   - Visual parity with the previous inline Astro card.
// State resets on reload (useState only, no persistence) per D-04.

export interface ProjectRow {
  _id: string;
  title: string;
  clientName: string | null;
  pipelineStage: string;
  stageChangedAt: string | null;
}

interface Props {
  projects: ProjectRow[];
  totalCount: number;
}

function rowMatchesFilter(row: ProjectRow, needle: string): boolean {
  if (!needle) return true;
  const q = needle.toLowerCase();
  const stageTitle =
    STAGE_META[row.pipelineStage as StageKey]?.title ?? "";
  const fields = [row.title ?? "", row.clientName ?? "", stageTitle];
  return fields.some((f) => f.toLowerCase().includes(q));
}

export default function ActiveProjectsCard({ projects, totalCount }: Props) {
  const [filter, setFilter] = useState<string>("");

  // Cap the base list to 8 (matches the pre-refactor slice(0, 8) in dashboard.astro).
  const displayProjects = projects.slice(0, 8);
  const visibleProjects = displayProjects.filter((p) =>
    rowMatchesFilter(p, filter),
  );

  const hasFilter = filter.trim().length > 0;

  let emptyCopy: string | null = null;
  if (visibleProjects.length === 0) {
    emptyCopy = hasFilter
      ? "No projects match your filter."
      : "No active projects";
  }

  return (
    <div className="bg-white rounded-xl border border-stone-light/40 overflow-hidden">
      {/* Header: title + filter input — matches UpcomingDeliveriesCard rhythm */}
      <div className="px-5 pt-[18px] pb-0">
        <h2
          className="mb-[14px]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "10.5px",
            fontWeight: 500,
            color: "#9E8E80",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Active Projects
        </h2>
        <hr
          style={{
            border: "none",
            borderTop: "0.5px solid #E8DDD0",
            margin: 0,
          }}
        />
        <div className="py-3">
          <CardFilterInput
            value={filter}
            onChange={setFilter}
            placeholder="Filter projects…"
            ariaLabel="Filter projects"
          />
        </div>
      </div>

      {/* Row list or empty state */}
      {emptyCopy ? (
        <p className="text-sm text-stone text-center py-6">{emptyCopy}</p>
      ) : (
        <div>
          {visibleProjects.map((project) => {
            const stageMeta = STAGE_META[project.pipelineStage as StageKey];
            const stageColor =
              STAGE_COLORS[project.pipelineStage] ?? STAGE_COLORS.discovery;
            const daysInStage = getDaysInStage(project.stageChangedAt);
            const daysStale = daysInStage >= 14;
            return (
              <a
                key={project._id}
                href={`/admin/projects/${project._id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-cream/50 transition-colors border-b border-stone-light/10 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[13.5px] font-medium font-body text-charcoal block truncate">
                    {project.title}
                  </span>
                  {project.clientName && (
                    <span className="text-[11.5px] text-stone-light font-body block truncate mt-0.5">
                      {project.clientName}
                    </span>
                  )}
                </div>
                {stageMeta && (
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${stageColor.bg} ${stageColor.text}`}
                  >
                    {stageMeta.title}
                  </span>
                )}
                <span
                  className={`text-[11px] font-body shrink-0 ${
                    daysStale
                      ? "text-red-600 font-semibold"
                      : "text-stone-light"
                  }`}
                >
                  {project.stageChangedAt
                    ? `Since ${format(parseISO(project.stageChangedAt), "MMM d")}`
                    : ""}
                </span>
              </a>
            );
          })}
        </div>
      )}

      {/* Footer "View all N projects" link — preserved from pre-refactor card */}
      {totalCount > 8 && (
        <div className="px-5 py-3 border-t border-stone-light/10 text-center">
          <a
            href="/admin/projects"
            className="text-xs text-terracotta hover:text-terracotta/80 font-body transition-colors"
          >
            View all {totalCount} projects
          </a>
        </div>
      )}
    </div>
  );
}

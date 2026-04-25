import { format, parseISO } from "date-fns";
import {
  STAGE_META,
  STAGE_COLORS,
  type StageKey,
} from "../../lib/portalStages";
import { getDaysInStage } from "../../lib/dashboardUtils";

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

export default function ActiveProjectsCard({ projects, totalCount }: Props) {
  // Cap the base list to 8 (matches the pre-refactor slice(0, 8)).
  const visibleProjects = projects.slice(0, 8);
  const emptyCopy = visibleProjects.length === 0 ? "No active projects" : null;

  return (
    <div className="bg-white rounded-xl border border-stone-light/40 overflow-hidden">
      {/* Header — see global.css .card-header for tokens. Fixed h-[42px] so
          every dashboard card header matches in height regardless of whether
          it carries a trailing control. */}
      <div className="card-header flex items-center justify-between gap-3 px-5 h-[42px]">
        <h2 className="card-header-label">Active Projects</h2>
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

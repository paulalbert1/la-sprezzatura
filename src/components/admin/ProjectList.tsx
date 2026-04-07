import { useState, useMemo } from "react";
import { STAGES } from "../../lib/portalStages";

interface Project {
  _id: string;
  title: string;
  pipelineStage: string;
  engagementType: string;
  projectStatus: string;
  clientName: string | null;
}

interface ProjectListProps {
  projects: Project[];
}

/** Pure filter function -- exported for unit testing */
export function filterProjects(
  projects: Array<{ pipelineStage: string | null }>,
  filter: string,
) {
  if (filter === "all") return projects;
  return projects.filter((p) => p.pipelineStage === filter);
}

/** Convert slug to display label: "full-interior-design" -> "Full Interior Design" */
function formatLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STAGE_BADGE_CLASSES: Record<string, string> = {
  discovery: "bg-stone-light/20 text-stone",
  concept: "bg-amber-50 text-amber-700",
  "design-development": "bg-terracotta/10 text-terracotta",
  procurement: "bg-blue-50 text-blue-700",
  installation: "bg-orange-50 text-orange-700",
  closeout: "bg-emerald-50 text-emerald-700",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-stone-light/20 text-stone",
  reopened: "bg-amber-50 text-amber-700",
};

const ACTIVE_CLASSES =
  "bg-charcoal text-white border-charcoal rounded-full px-5 py-2 text-xs uppercase tracking-widest font-body transition-colors duration-200 cursor-pointer border";
const INACTIVE_CLASSES =
  "bg-cream-dark text-charcoal border-stone-light hover:bg-charcoal hover:text-white hover:border-charcoal rounded-full px-5 py-2 text-xs uppercase tracking-widest font-body transition-colors duration-200 cursor-pointer border";

export default function ProjectList({ projects }: ProjectListProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? projects
        : projects.filter((p) => p.pipelineStage === activeFilter),
    [projects, activeFilter],
  );

  // No projects at all
  if (projects.length === 0) {
    return (
      <p className="text-center py-12">
        <span className="text-xl font-heading text-charcoal block mb-2">
          No projects yet
        </span>
        <span className="text-sm text-stone">
          Projects will appear here once they're added in Sanity. Create your
          first project in the Content Lake.
        </span>
      </p>
    );
  }

  return (
    <div>
      {/* Filter pills */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by pipeline stage"
      >
        <button
          aria-pressed={activeFilter === "all"}
          className={activeFilter === "all" ? ACTIVE_CLASSES : INACTIVE_CLASSES}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        {STAGES.map((stage) => (
          <button
            key={stage.value}
            aria-pressed={activeFilter === stage.value}
            className={
              activeFilter === stage.value ? ACTIVE_CLASSES : INACTIVE_CLASSES
            }
            onClick={() => setActiveFilter(stage.value)}
          >
            {stage.title}
          </button>
        ))}
      </div>

      {/* Project table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">All projects</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="text-xs uppercase tracking-widest text-stone font-normal pb-3 border-b-2 border-stone-light/30 text-left"
              >
                Project
              </th>
              <th
                scope="col"
                className="text-xs uppercase tracking-widest text-stone font-normal pb-3 border-b-2 border-stone-light/30 text-left w-40"
              >
                Client
              </th>
              <th
                scope="col"
                className="text-xs uppercase tracking-widest text-stone font-normal pb-3 border-b-2 border-stone-light/30 text-left w-48"
              >
                Engagement
              </th>
              <th
                scope="col"
                className="text-xs uppercase tracking-widest text-stone font-normal pb-3 border-b-2 border-stone-light/30 text-center w-32"
              >
                Stage
              </th>
              <th
                scope="col"
                className="text-xs uppercase tracking-widest text-stone font-normal pb-3 border-b-2 border-stone-light/30 text-center w-24"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <p className="text-sm text-stone text-center py-8">
                    No projects in this stage
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((project, index) => {
                const stageLabel =
                  STAGES.find((s) => s.value === project.pipelineStage)
                    ?.title || formatLabel(project.pipelineStage || "");
                const stageBadge =
                  STAGE_BADGE_CLASSES[project.pipelineStage] ||
                  "bg-stone-light/20 text-stone";
                const statusBadge =
                  STATUS_BADGE_CLASSES[project.projectStatus] ||
                  "bg-stone-light/20 text-stone";
                const statusLabel = formatLabel(project.projectStatus || "");

                return (
                  <tr
                    key={project._id}
                    className={`border-b border-stone-light/10${index % 2 === 1 ? " bg-cream-dark/50" : ""}`}
                  >
                    <td className="py-3">
                      <a
                        href={`/admin/projects/${project._id}`}
                        className="text-charcoal hover:text-terracotta transition-colors font-medium"
                      >
                        {project.title}
                      </a>
                    </td>
                    <td className="py-3 text-sm text-stone">
                      {project.clientName || "No client assigned"}
                    </td>
                    <td className="py-3 text-sm text-stone">
                      {formatLabel(project.engagementType)}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`${stageBadge} inline-flex px-2 py-0.5 rounded-full text-xs tracking-wide whitespace-nowrap`}
                      >
                        {stageLabel}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`${statusBadge} inline-flex px-2 py-0.5 rounded-full text-xs tracking-wide whitespace-nowrap`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

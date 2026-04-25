interface LinkedProjectsProps {
  projects: Array<{
    _id: string;
    title: string;
    pipelineStage: string;
    engagementType: string;
    projectStatus: string;
  }>;
}

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  discovery: { bg: "bg-stone-100", text: "text-stone-600" },
  concept: { bg: "bg-amber-50", text: "text-amber-800" },
  "design-development": { bg: "bg-blue-50", text: "text-blue-800" },
  procurement: { bg: "bg-emerald-50", text: "text-emerald-800" },
  installation: { bg: "bg-violet-50", text: "text-violet-800" },
  closeout: { bg: "bg-stone-100", text: "text-stone-600" },
};

const STAGE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  concept: "Concept",
  "design-development": "Design Development",
  procurement: "Procurement",
  installation: "Installation",
  closeout: "Closeout",
};

const ENGAGEMENT_LABELS: Record<string, string> = {
  "full-interior-design": "Full Interior Design",
  "styling-and-refreshing": "Styling & Refreshing",
  "carpet-curating": "Carpet Curating",
};

export default function LinkedProjects({ projects }: LinkedProjectsProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-light/40 p-6 mt-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base font-semibold font-body text-charcoal">
          Linked Projects
        </h3>
        <span className="text-[11px] font-body text-stone-light uppercase tracking-wider">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {projects.length === 0 ? (
        <p className="text-xs font-body text-stone-light" style={{ fontSize: "11.5px" }}>
          Not currently linked to any projects.
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: "6px" }}>
          {projects.map((project) => {
            const stageColor =
              STAGE_COLORS[project.pipelineStage] || STAGE_COLORS.discovery;
            const stageLabel =
              STAGE_LABELS[project.pipelineStage] || project.pipelineStage;
            const engagementLabel =
              ENGAGEMENT_LABELS[project.engagementType] ||
              project.engagementType;

            return (
              <a
                key={project._id}
                href={`/admin/projects/${project._id}`}
                className="flex items-center gap-3 px-3 py-2 bg-cream/50 hover:bg-cream rounded-lg transition-colors"
              >
                <span className="text-sm font-medium font-body text-charcoal flex-1 truncate">
                  {project.title}
                </span>
                {engagementLabel && (
                  <span
                    className="text-[11px] font-body text-stone border border-stone-light/40 rounded-full px-2 py-0.5 shrink-0"
                  >
                    {engagementLabel}
                  </span>
                )}
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${stageColor.bg} ${stageColor.text}`}
                >
                  {stageLabel}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

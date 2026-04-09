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
    <div>
      <h3 className="text-sm font-semibold font-body text-charcoal mt-8 mb-4">
        Linked Projects
      </h3>

      {projects.length === 0 ? (
        <p className="text-sm text-stone text-center py-6">
          No linked projects
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-stone-light/40 overflow-hidden">
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
                className="flex items-center gap-3 px-5 py-3 hover:bg-cream/50 transition-colors border-b border-stone-light/10 last:border-b-0"
              >
                <span className="text-[13px] font-medium font-body text-charcoal flex-1 truncate">
                  {project.title}
                </span>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${stageColor.bg} ${stageColor.text}`}
                >
                  {stageLabel}
                </span>
                {engagementLabel && (
                  <span className="text-[11px] text-stone-light font-body shrink-0">
                    {engagementLabel}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

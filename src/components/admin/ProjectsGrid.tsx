import { useMemo, useState } from "react";
import { STAGE_META, STAGES, type StageKey } from "../../lib/portalStages";

interface Project {
  _id: string;
  title: string;
  pipelineStage: string;
  projectStatus: string;
  clientName?: string;
  _updatedAt: string;
}

interface Props {
  projects: Project[];
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

export default function ProjectsGrid({ projects }: Props) {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (stageFilter !== "all" && p.pipelineStage !== stageFilter)
        return false;
      if (statusFilter !== "all" && p.projectStatus !== statusFilter)
        return false;
      return true;
    });
  }, [projects, stageFilter, statusFilter]);

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
        <span
          style={{
            marginLeft: "auto",
            fontSize: "11.5px",
            color: "#9E8E80",
            fontFamily: "var(--font-sans)",
          }}
        >
          {filtered.length} of {projects.length} · sorted by recently updated
        </span>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
          {filtered.map((project) => {
            const stageMeta =
              STAGE_META[project.pipelineStage as StageKey];
            const stageColor =
              STAGE_COLORS[project.pipelineStage] || STAGE_COLORS.discovery;
            const statusInfo =
              STATUS_COLORS[project.projectStatus] || STATUS_COLORS.active;
            return (
              <a
                key={project._id}
                href={`/admin/projects/${project._id}`}
                style={{
                  display: "block",
                  background: "#FFFEFB",
                  border: "0.5px solid #E8DDD0",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  textDecoration: "none",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
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

                {/* Footer: updated time */}
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
          })}
        </div>
      )}
    </div>
  );
}

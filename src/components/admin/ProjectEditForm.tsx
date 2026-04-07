import { useState, useEffect } from "react";
import { STAGES } from "../../lib/portalStages";

interface ProjectData {
  _id: string;
  title: string;
  pipelineStage: string;
  engagementType: string;
  projectStatus: string;
  clientName: string | null;
  clientId: string | null;
}

interface ClientOption {
  _id: string;
  name: string;
}

interface Props {
  project: ProjectData;
  clients: ClientOption[];
}

const ENGAGEMENT_TYPES = [
  { value: "full-interior-design", label: "Full Interior Design" },
  { value: "styling-refreshing", label: "Styling & Refreshing" },
  { value: "carpet-curating", label: "Carpet Curating" },
];

const PROJECT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "reopened", label: "Reopened" },
];

const inputClasses =
  "w-full px-4 py-3 bg-cream-dark border border-stone-light/30 rounded-lg text-sm font-body text-charcoal focus:border-terracotta focus:outline-none transition-colors";

const selectClasses = inputClasses + " appearance-none";

export default function ProjectEditForm({ project, clients }: Props) {
  const [title, setTitle] = useState(project.title || "");
  const [pipelineStage, setPipelineStage] = useState(project.pipelineStage || "");
  const [engagementType, setEngagementType] = useState(project.engagementType || "");
  const [projectStatus, setProjectStatus] = useState(project.projectStatus || "");
  const [clientId, setClientId] = useState(project.clientId || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-dismiss success message after 3 seconds (safety net if redirect is slow)
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/update-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project._id,
          title,
          pipelineStage,
          engagementType,
          projectStatus,
          clientId: clientId || null,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Project updated" });
        setTimeout(() => {
          window.location.href = "/admin/projects/" + project._id;
        }, 1500);
      } else {
        setMessage({ type: "error", text: "Unable to save. Please try again." });
      }
    } catch {
      setMessage({ type: "error", text: "Unable to save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const stageOptions = STAGES.map((s) => ({ value: s.value, label: s.title }));

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p
          className={
            message.type === "success" ? "text-sm text-emerald-700 font-body" : "text-sm text-red-600 font-body"
          }
        >
          {message.text}
        </p>
      )}

      {/* Title */}
      <div>
        <label htmlFor="project-title" className="text-xs uppercase tracking-widest text-stone font-body mb-2 block">
          Title
        </label>
        <input
          id="project-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-required="true"
          className={inputClasses}
        />
      </div>

      {/* Pipeline Stage */}
      <div>
        <label htmlFor="pipeline-stage" className="text-xs uppercase tracking-widest text-stone font-body mb-2 block">
          Pipeline Stage
        </label>
        <select
          id="pipeline-stage"
          value={pipelineStage}
          onChange={(e) => setPipelineStage(e.target.value)}
          className={selectClasses}
        >
          {stageOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Engagement Type */}
      <div>
        <label htmlFor="engagement-type" className="text-xs uppercase tracking-widest text-stone font-body mb-2 block">
          Engagement Type
        </label>
        <select
          id="engagement-type"
          value={engagementType}
          onChange={(e) => setEngagementType(e.target.value)}
          className={selectClasses}
        >
          {ENGAGEMENT_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Project Status */}
      <div>
        <label htmlFor="project-status" className="text-xs uppercase tracking-widest text-stone font-body mb-2 block">
          Project Status
        </label>
        <select
          id="project-status"
          value={projectStatus}
          onChange={(e) => setProjectStatus(e.target.value)}
          className={selectClasses}
        >
          {PROJECT_STATUSES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Client */}
      <div>
        <label htmlFor="client-select" className="text-xs uppercase tracking-widest text-stone font-body mb-2 block">
          Client
        </label>
        <select
          id="client-select"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className={selectClasses}
        >
          <option value="">No client</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Button row */}
      <div className="flex items-center gap-4 mt-8">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 rounded-lg hover:bg-terracotta-light transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <a
          href={"/admin/projects/" + project._id}
          className="text-sm text-stone hover:text-charcoal transition-colors font-body ml-auto"
        >
          Discard Changes
        </a>
      </div>
    </div>
  );
}

// Phase 44 Plan 07 Task 2 — BlankWorkflowState
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Surface 3 — blank state
//   .planning/phases/44-workflow-engine/44-07-PLAN.md § Task 2
//
// Rendered when no projectWorkflow exists for a project.
// Wraps inner component in <ToastContainer> per per-island provider pattern.

import { useState } from "react";
import ToastContainer, { useToast } from "../ui/ToastContainer";

interface Template {
  _id: string;
  name: string;
}

interface Props {
  projectId: string;
  templates: Template[];
}

function Inner({ projectId, templates }: Props) {
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const { show } = useToast();

  async function handleStart() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selected }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Could not start workflow" }));
        throw new Error(data.error ?? "Could not start workflow");
      }
      window.location.reload();
    } catch (err) {
      show({ variant: "error", title: (err as Error).message });
      setBusy(false);
    }
  }

  // No templates exist at all — show alternate state
  if (templates.length === 0) {
    return (
      <div
        style={{
          maxWidth: "420px",
          margin: "0 auto",
          textAlign: "center",
          backgroundColor: "#FFFEFB",
          border: "0.5px solid #E8DDD0",
          borderRadius: "10px",
          padding: "32px 24px",
          fontFamily: "var(--font-sans)",
        }}
      >
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#2C2520",
            lineHeight: 1.3,
            marginBottom: "12px",
          }}
        >
          Start a workflow
        </h3>
        <p
          style={{
            fontSize: "13px",
            color: "#6B5E52",
            lineHeight: 1.5,
            marginBottom: "16px",
          }}
        >
          You haven&apos;t created any templates yet.
        </p>
        <a
          href="/admin/settings#workflow-templates"
          style={{
            fontSize: "13px",
            color: "#9A7B4B",
            textDecoration: "underline",
            fontFamily: "var(--font-sans)",
          }}
        >
          Go to Settings → Workflow Templates
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "0 auto",
        textAlign: "center",
        backgroundColor: "#FFFEFB",
        border: "0.5px solid #E8DDD0",
        borderRadius: "10px",
        padding: "32px 24px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <h3
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "#2C2520",
          lineHeight: 1.3,
          marginBottom: "12px",
        }}
      >
        Start a workflow
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: "#6B5E52",
          lineHeight: 1.5,
          marginBottom: "16px",
        }}
      >
        This project does not have a workflow yet. Select a template to begin
        tracking milestones, gates, and contractor coordination.
      </p>

      {/* Template selector */}
      <label
        htmlFor="blank-template-selector"
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 600,
          color: "#6B5E52",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "6px",
          textAlign: "left",
        }}
      >
        Template
      </label>
      <select
        id="blank-template-selector"
        role="combobox"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          fontSize: "13px",
          color: "#2C2520",
          backgroundColor: "#FFFFFF",
          border: "0.5px solid #D4C8B8",
          borderRadius: "6px",
          padding: "8px 12px",
          marginBottom: "12px",
          fontFamily: "var(--font-sans)",
          appearance: "auto",
        }}
      >
        <option value="">Choose a template…</option>
        {templates.map((t) => (
          <option key={t._id} value={t._id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Start workflow CTA */}
      <button
        type="button"
        onClick={handleStart}
        disabled={!selected || busy}
        style={{
          display: "block",
          width: "100%",
          padding: "10px 16px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#FFFFFF",
          backgroundColor: !selected || busy ? "#C4B5A2" : "#9A7B4B",
          border: "none",
          borderRadius: "6px",
          cursor: !selected || busy ? "not-allowed" : "pointer",
          fontFamily: "var(--font-sans)",
          transition: "background-color 150ms",
        }}
      >
        {busy ? "Starting…" : "Start workflow"}
      </button>
    </div>
  );
}

export default function BlankWorkflowState(props: Props) {
  return (
    <ToastContainer>
      <Inner {...props} />
    </ToastContainer>
  );
}

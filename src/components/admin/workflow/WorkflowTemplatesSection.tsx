import { useState, useCallback } from "react";
import ToastContainer, { useToast } from "../ui/ToastContainer";

// Phase 44 Plan 08 / Plan 10 — WorkflowTemplatesSection
// Rendered inside the SettingsPage sidebar-nav content panel as one of the
// settings sections. Provides: card grid + empty state + New template +
// per-card Duplicate.

interface PhaseMinimal {
  milestones?: unknown[];
}

interface TemplateCard {
  _id: string;
  name: string;
  version: number;
  phases: PhaseMinimal[];
  inUseCount: number;
}

interface Props {
  templates: TemplateCard[];
}

function totalMilestones(phases: PhaseMinimal[]): number {
  return phases.reduce((sum, p) => sum + (p.milestones?.length ?? 0), 0);
}

function WorkflowTemplatesSectionInner({ templates }: Props) {
  const [busy, setBusy] = useState<string | null>(null); // templateId or "new"
  const { show } = useToast();

  const handleNew = useCallback(async () => {
    setBusy("new");
    try {
      const res = await fetch("/api/admin/workflow-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled template" }),
      });
      if (!res.ok) throw new Error("Create failed");
      const data = await res.json() as { template?: { _id: string } };
      if (data.template?._id) {
        window.location.href = `/admin/settings/workflow-templates/${data.template._id}`;
      }
    } catch {
      show({ variant: "error", title: "Could not create template — try again", duration: 4000 });
    } finally {
      setBusy(null);
    }
  }, [show]);

  const handleDuplicate = useCallback(
    async (e: React.MouseEvent, templateId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setBusy(templateId);
      try {
        const res = await fetch(`/api/admin/workflow-templates/${templateId}/duplicate`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Duplicate failed");
        const data = await res.json() as { template?: { _id: string } };
        if (data.template?._id) {
          window.location.href = `/admin/settings/workflow-templates/${data.template._id}`;
        }
      } catch {
        show({ variant: "error", title: "Could not duplicate template — try again", duration: 4000 });
      } finally {
        setBusy(null);
      }
    },
    [show],
  );

  return (
    <div>
      {templates.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 16px",
            color: "#6B5E52",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#2C2520",
              marginBottom: "8px",
            }}
          >
            No templates yet
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#6B5E52",
              marginBottom: "16px",
            }}
          >
            Create your first template to start tracking projects with the workflow engine.
          </p>
          <button
            type="button"
            onClick={handleNew}
            disabled={busy === "new"}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#FFFEFB",
              backgroundColor: busy === "new" ? "#C4A97A" : "#9A7B4B",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: busy === "new" ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            New template
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
          className="workflow-template-grid"
        >
          {templates.map((t) => {
            const usage = t.inUseCount;
            const usageLabel =
              usage === 0
                ? "No active projects"
                : `${usage} active project${usage === 1 ? "" : "s"}`;
            return (
              <a
                key={t._id}
                href={`/admin/settings/workflow-templates/${t._id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "130px",
                  padding: "16px",
                  backgroundColor: "#FFFEFB",
                  border: "0.5px solid #E8DDD0",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 150ms ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#9A7B4B";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#E8DDD0";
                }}
              >
                {/* Title row: name on the left, version label on the right */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2C2520",
                      lineHeight: 1.4,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {t.name}
                  </p>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#B5A892",
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    v{t.version}
                  </span>
                </div>

                {/* Phases / milestones */}
                <p
                  style={{
                    fontSize: "11px",
                    color: "#9E8E80",
                    lineHeight: 1.4,
                  }}
                >
                  {t.phases.length} phase{t.phases.length !== 1 ? "s" : ""}{" "}
                  · {totalMilestones(t.phases)} milestone{totalMilestones(t.phases) !== 1 ? "s" : ""}
                </p>

                {/* Footer: usage pill (muted when zero) on left, Duplicate on right */}
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "3px 9px",
                      borderRadius: "4px",
                      letterSpacing: "0.02em",
                      fontWeight: 500,
                      ...(usage === 0
                        ? {
                            background: "transparent",
                            color: "#B5A892",
                            border: "0.5px dashed rgba(60,40,20,0.18)",
                          }
                        : {
                            background: "#F5EFE6",
                            color: "#5C4F3D",
                          }),
                    }}
                  >
                    {usageLabel}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDuplicate(e, t._id)}
                    disabled={busy === t._id}
                    style={{
                      marginLeft: "auto",
                      fontSize: "11px",
                      color: busy === t._id ? "#9E8E80" : "#6B5E52",
                      backgroundColor: "transparent",
                      border: "0.5px solid #E8DDD0",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      cursor: busy === t._id ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    Duplicate
                  </button>
                </div>
              </a>
            );
          })}

          {/* Dashed empty-state card — replaces the standalone "+ New template"
              button below the grid. Sits as the next slot in the grid so the
              create action lives where the eye is already scanning. */}
          <button
            type="button"
            onClick={handleNew}
            disabled={busy === "new"}
            aria-label="New template"
            style={{
              minHeight: "130px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "16px",
              background: "transparent",
              border: "0.5px dashed rgba(60,40,20,0.22)",
              borderRadius: "10px",
              color: "#8A7E6E",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              cursor: busy === "new" ? "not-allowed" : "pointer",
              transition:
                "border-color 150ms ease, color 150ms ease, background-color 150ms ease",
            }}
            onMouseEnter={(e) => {
              if (busy !== "new") {
                e.currentTarget.style.borderColor = "rgba(60,40,20,0.4)";
                e.currentTarget.style.color = "#5C4F3D";
                e.currentTarget.style.background = "rgba(245,239,230,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(60,40,20,0.22)";
              e.currentTarget.style.color = "#8A7E6E";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span>
            <span>{busy === "new" ? "Creating…" : "New template"}</span>
          </button>
        </div>
      )}

      {/* Responsive: collapse to 1 column below 720px */}
      <style>{`
        @media (max-width: 720px) {
          .workflow-template-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function WorkflowTemplatesSection(props: Props) {
  return (
    <ToastContainer>
      <WorkflowTemplatesSectionInner {...props} />
    </ToastContainer>
  );
}

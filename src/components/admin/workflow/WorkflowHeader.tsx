// Phase 44 Plan 07 Task 1 — WorkflowHeader
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Surface 3 — tracker header
//   .planning/phases/44-workflow-engine/44-07-PLAN.md § Task 1
//
// Renders: avatar + project name + template sub-line + status pill + overflow menu.
// No API calls — display only.

import { useState, useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import type { ProjectWorkflow, ProjectWorkflowStatus } from "../../../lib/workflow/types";

interface WorkflowHeaderProps {
  workflow: ProjectWorkflow;
  projectTitle: string;
  clientInitials: string;
  templateName: string;
  onChangeTemplate: () => void;
  onTerminate: () => void;
  onReactivate: () => void;
}

// UI-SPEC § Project status pill colors
const STATUS_PILL: Record<
  ProjectWorkflowStatus,
  { bg: string; text: string; label: string }
> = {
  active: { bg: "#EEF3E3", text: "#27500A", label: "Active" },
  dormant: { bg: "#FBEEE8", text: "#9B3A2A", label: "Dormant" },
  complete: { bg: "#EEF3E3", text: "#27500A", label: "Complete" },
  terminated: { bg: "#F3EDE3", text: "#9E8E80", label: "Terminated" },
};

function formatStartedDate(isoString: string): string {
  // Parse date parts from ISO string directly to avoid timezone issues
  // e.g. "2026-01-15T00:00:00Z" → "Jan 15, 2026"
  const datePart = isoString.slice(0, 10); // "2026-01-15"
  const [year, month, day] = datePart.split("-").map(Number);
  const date = new Date(year, month - 1, day); // local time, no timezone shift
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkflowHeader({
  workflow,
  projectTitle,
  clientInitials,
  templateName,
  onChangeTemplate,
  onTerminate,
  onReactivate,
}: WorkflowHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const pill = STATUS_PILL[workflow.status];
  const startedDate = formatStartedDate(workflow.createdAt);
  const isTerminated = workflow.status === "terminated";
  const isDormant = workflow.status === "dormant";

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        paddingBottom: "12px",
        marginBottom: "12px",
        borderBottom: "0.5px solid #E8DDD0",
        position: "relative",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Avatar circle */}
      <div
        aria-hidden="true"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: "#F3EDE3",
          color: "#6B5E52",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "13px",
          fontWeight: 600,
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        {clientInitials}
      </div>

      {/* Project info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#2C2520",
            lineHeight: 1.3,
            fontFamily: "var(--font-sans)",
          }}
        >
          {projectTitle}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#6B5E52",
            lineHeight: 1.4,
            marginTop: "2px",
            fontFamily: "var(--font-sans)",
          }}
        >
          {templateName} · Started {startedDate}
        </div>
      </div>

      {/* Status pill */}
      <span
        style={{
          fontSize: "11px",
          padding: "2px 8px",
          borderRadius: "7px",
          backgroundColor: pill.bg,
          color: pill.text,
          flexShrink: 0,
          fontFamily: "var(--font-sans)",
        }}
      >
        {pill.label}
      </span>

      {/* Overflow menu trigger — aria-label per UI-SPEC flag */}
      <div style={{ position: "relative" }}>
        <button
          ref={btnRef}
          type="button"
          aria-label="Project workflow options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            color: "#6B5E52",
            flexShrink: 0,
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3EDE3";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Workflow options"
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "4px",
              minWidth: "200px",
              backgroundColor: "#FFFEFB",
              border: "0.5px solid #E8DDD0",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(44, 37, 32, 0.08)",
              zIndex: 40,
              padding: "4px",
            }}
          >
            {/* Change template */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onChangeTemplate();
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                fontSize: "13px",
                color: "#2C2520",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3EDE3";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              Change template
            </button>

            {/* Terminate — hidden when already terminated */}
            {!isTerminated && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onTerminate();
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: "13px",
                  color: "#9B3A2A",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FBEEE8";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                Terminate workflow
              </button>
            )}

            {/* Reactivate — only when dormant */}
            {isDormant && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onReactivate();
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: "13px",
                  color: "#2C2520",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3EDE3";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                Reactivate
              </button>
            )}

            {/* View template */}
            <a
              role="menuitem"
              href={`/admin/settings/workflow-templates/${workflow.templateId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                fontSize: "13px",
                color: "#2C2520",
                backgroundColor: "transparent",
                borderRadius: "6px",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#F3EDE3";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
              }}
            >
              View template
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { actions } from "astro:actions";
import ToastContainer, { useToast } from "./ui/ToastContainer";

// Phase 36 Plan 02 — ProjectArchiveMenu
// Source of truth:
//   - .planning/phases/36-projects-list-archive-lifecycle/36-UI-SPEC.md
//     § Component Inventory → <ProjectArchiveMenu />
//   - .planning/phases/36-projects-list-archive-lifecycle/36-CONTEXT.md D-03/D-04
//
// Header overflow menu island for the project detail page. Renders a 28x28
// ⋯ trigger adjacent to the stage pill. On click it opens a single-item menu
// offering either "Archive project" (when pipelineStage === "closeout" and
// no archivedAt) or "Unarchive project" (when archivedAt is set). Any other
// state renders `null` — no trigger button is drawn.
//
// Why this island mounts its own ToastContainer: React context does not cross
// Astro island boundaries. The admin layout's global ToastContainer lives in a
// separate island, so our useToast() call would fail unless we host a provider
// inside THIS island. This mirrors ClientChipWithRegenerate and SendUpdateButton.

export interface ProjectArchiveMenuProps {
  projectId: string;
  pipelineStage: string;
  archivedAt: string | null;
}

function ProjectArchiveMenuInner({
  projectId,
  pipelineStage,
  archivedAt,
}: ProjectArchiveMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { show } = useToast();

  // Visibility logic per CONTEXT D-03 / UI-SPEC:
  //   - closeout && !archivedAt  → show menu with "Archive project"
  //   - archivedAt               → show menu with "Unarchive project"
  //   - otherwise                → render nothing (no trigger at all)
  // "closeout" is the schema's terminal pipelineStage — CONTEXT used the word
  // "completed" colloquially; the schema enum has no such value.
  const canArchive = pipelineStage === "closeout" && !archivedAt;
  const canUnarchive = !!archivedAt;
  const shouldRender = canArchive || canUnarchive;

  // Outside-click + Escape handlers. Only installed while the menu is open so
  // we don't pay listener overhead in the common closed state.
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  async function onActionClick() {
    setIsPending(true);
    try {
      const action = archivedAt
        ? actions.unarchiveProject
        : actions.archiveProject;
      const result = await action({ projectId });
      // Astro actions return { data, error } shape — mirror the pattern from
      // other islands: bail on error, otherwise treat as success.
      if (result?.error) {
        throw new Error(result.error.message || "Action failed");
      }
      show({
        variant: "success",
        title: archivedAt ? "Project restored." : "Project archived.",
        duration: 3000,
      });
      // CONTEXT D-04 + UI-SPEC: reload so the header + any subsequent state
      // reflect the new archivedAt value.
      window.location.reload();
    } catch {
      show({
        variant: "error",
        title: archivedAt
          ? "Couldn't restore — try again."
          : "Couldn't archive — try again.",
        duration: 5000,
      });
      setIsPending(false);
      setIsOpen(false);
    }
  }

  const menuLabel = archivedAt ? "Unarchive project" : "Archive project";

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Project actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-busy={isPending ? "true" : "false"}
        className="w-7 h-7 rounded-md flex items-center justify-center text-stone hover:bg-stone-light/15 focus:outline-none focus:ring-1 focus:ring-terracotta"
        style={{
          opacity: isPending ? 0.6 : 1,
          pointerEvents: isPending ? "none" : "auto",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          role="menu"
          className="absolute right-0 top-full mt-1 w-44 bg-white border border-stone-light/40 rounded-md shadow-md py-1 z-50"
        >
          <button
            role="menuitem"
            type="button"
            onClick={onActionClick}
            disabled={isPending}
            className="w-full text-left px-3 py-2 text-[13px] font-body text-charcoal hover:bg-terracotta/5 focus:bg-terracotta/5 focus:outline-none disabled:opacity-60 disabled:pointer-events-none"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            {menuLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProjectArchiveMenu(props: ProjectArchiveMenuProps) {
  // Wrap in a local ToastContainer so the inner component can call useToast()
  // — see header comment for rationale.
  return (
    <ToastContainer>
      <ProjectArchiveMenuInner {...props} />
    </ToastContainer>
  );
}

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { actions } from "astro:actions";
import ToastContainer, { useToast } from "./ui/ToastContainer";

// Admin-side override for client portal visibility. Sits next to
// ProjectArchiveMenu on the project detail header. Three states match the
// project schema's clientPortalVisibility enum:
//
//   "auto"   -> default 30-day post-completion rule
//   "shown"  -> always visible (warranty extension, special-case access)
//   "hidden" -> never visible (paused engagement, sensitive negotiation)
//
// Behavior mirror of ProjectArchiveMenu: own ToastContainer (React context
// does not cross Astro island boundaries), portaled menu panel, outside-click
// + Escape close, reload on success so the rest of the page reflects the new
// value. Uses astro:actions/setClientPortalVisibility.

type Visibility = "auto" | "shown" | "hidden";

export interface ProjectVisibilityMenuProps {
  projectId: string;
  value: Visibility;
}

const LABELS: Record<Visibility, string> = {
  auto: "Auto",
  shown: "Always shown",
  hidden: "Always hidden",
};

const TRIGGER_LABELS: Record<Visibility, string> = {
  auto: "Portal: Auto",
  shown: "Portal: Shown",
  hidden: "Portal: Hidden",
};

function ProjectVisibilityMenuInner({ projectId, value }: ProjectVisibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [current, setCurrent] = useState<Visibility>(value || "auto");
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { show } = useToast();

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

  async function onSelect(next: Visibility) {
    if (next === current) {
      setIsOpen(false);
      return;
    }
    setIsPending(true);
    try {
      const result = await actions.setClientPortalVisibility({ projectId, value: next });
      if (result?.error) {
        throw new Error(result.error.message || "Update failed");
      }
      setCurrent(next);
      show({
        variant: "success",
        title: `Portal visibility set to ${LABELS[next]}.`,
        duration: 3000,
      });
      setIsOpen(false);
    } catch {
      show({
        variant: "error",
        title: "Couldn't update — try again.",
        duration: 5000,
      });
    } finally {
      setIsPending(false);
    }
  }

  const Icon = current === "hidden" ? EyeOff : Eye;
  const isOverride = current !== "auto";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          if (isOpen) {
            setIsOpen(false);
            setAnchorRect(null);
          } else {
            setAnchorRect((e.currentTarget as HTMLButtonElement).getBoundingClientRect());
            setIsOpen(true);
          }
        }}
        aria-label="Client portal visibility"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-busy={isPending ? "true" : "false"}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-body text-stone hover:bg-stone-light/15 focus:outline-none focus:ring-1 focus:ring-terracotta"
        style={{
          opacity: isPending ? 0.6 : 1,
          pointerEvents: isPending ? "none" : "auto",
          background: isOverride ? "rgba(196, 131, 106, 0.08)" : "transparent",
          border: isOverride ? "0.5px solid rgba(196, 131, 106, 0.35)" : "0.5px solid transparent",
          color: current === "hidden" ? "#9E8E80" : isOverride ? "#9A5B3F" : "#6B5E52",
          cursor: "pointer",
        }}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{TRIGGER_LABELS[current]}</span>
      </button>

      {isOpen &&
        anchorRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            className="w-56 bg-white border border-stone-light/40 rounded-md shadow-md py-1"
            style={{
              position: "absolute",
              top: anchorRect.bottom + window.scrollY + 4,
              left: anchorRect.left + window.scrollX,
              zIndex: 50,
            }}
          >
            {(["auto", "shown", "hidden"] as const).map((option) => {
              const isActive = option === current;
              return (
                <button
                  key={option}
                  role="menuitemradio"
                  aria-checked={isActive}
                  type="button"
                  onClick={() => onSelect(option)}
                  disabled={isPending}
                  className="w-full text-left px-3 py-2 text-[13px] font-body text-charcoal hover:bg-terracotta/5 focus:bg-terracotta/5 focus:outline-none disabled:opacity-60 disabled:pointer-events-none flex items-center justify-between"
                  style={{ background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <span>{LABELS[option]}</span>
                  {isActive && (
                    <span aria-hidden="true" style={{ color: "#C4836A", fontSize: 14 }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
            <div
              style={{
                borderTop: "0.5px solid rgba(184, 176, 164, 0.35)",
                padding: "8px 12px",
                fontSize: 11,
                color: "#9E8E80",
                lineHeight: 1.4,
              }}
            >
              Auto follows the 30-day post-completion rule. Shown / Hidden override it.
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default function ProjectVisibilityMenu(props: ProjectVisibilityMenuProps) {
  return (
    <ToastContainer>
      <ProjectVisibilityMenuInner {...props} />
    </ToastContainer>
  );
}

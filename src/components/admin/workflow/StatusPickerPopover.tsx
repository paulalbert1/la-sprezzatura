// Phase 44 Plan 06 Task 1 — StatusPickerPopover
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Surface 4 — Status Picker Popover
//   .planning/phases/44-workflow-engine/44-06-PLAN.md § Task 1
//
// Absolute-positioned popover anchored below a status circle. Rendered via
// React portal to document.body so it escapes overflow-hidden containers.
// NOT AdminModal — per UI-SPEC Surface 4, modal chrome is too heavy here.
//
// Keyboard: ArrowUp/Down moves focus among allowed rows, Enter picks, Escape closes.
// Outside click closes.

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { MilestoneStatus } from "../../../lib/workflow/types";

interface Transition {
  status: MilestoneStatus;
  allowed: boolean;
  reason?: string;
  /** Override the default STATUS_LABELS entry (e.g. "Mark signed & complete"). */
  label?: string;
}

interface StatusPickerPopoverProps {
  anchorEl: HTMLElement | null;
  transitions: Transition[];
  currentStatus: MilestoneStatus;
  optionalSkip: boolean;
  onPick: (target: MilestoneStatus) => void;
  onClose: () => void;
}

const STATUS_ORDER: MilestoneStatus[] = [
  "not_started",
  "in_progress",
  "awaiting_client",
  "awaiting_payment",
  "complete",
  "skipped",
];

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  awaiting_client: "Awaiting client",
  awaiting_payment: "Awaiting payment",
  complete: "Complete",
  skipped: "Skipped",
};

export default function StatusPickerPopover({
  anchorEl,
  transitions,
  currentStatus,
  optionalSkip,
  onPick,
  onClose,
}: StatusPickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const firstAllowedRef = useRef<HTMLButtonElement | null>(null);

  // Compute position from anchor element
  const getPosition = useCallback(() => {
    if (!anchorEl) return { top: 0, left: 0 };
    const rect = anchorEl.getBoundingClientRect();
    return {
      top: rect.bottom + 6 + window.scrollY,
      left: rect.left + window.scrollX,
    };
  }, [anchorEl]);

  // Outside click handler
  useEffect(() => {
    if (!anchorEl) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !anchorEl.contains(target)
      ) {
        onClose();
      }
    };

    // Use mousedown so it fires before click — matches standard popover UX
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [anchorEl, onClose]);

  // Escape key handler — attached to window to catch all Escape events
  useEffect(() => {
    if (!anchorEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorEl, onClose]);

  // Focus first allowed row on open
  useEffect(() => {
    if (anchorEl && firstAllowedRef.current) {
      firstAllowedRef.current.focus();
    }
  }, [anchorEl]);

  if (!anchorEl) return null;

  const position = getPosition();

  // Map transitions into lookup by status
  const transitionMap = new Map(transitions.map((t) => [t.status, t]));

  // Render only the statuses the engine actually returned (filtered for valid
  // transitions + the current state). Preserve the canonical STATUS_ORDER so
  // the visual progression stays consistent. Honor optionalSkip for "skipped".
  const visibleStatuses = STATUS_ORDER.filter(
    (s) => transitionMap.has(s) && (s !== "skipped" || optionalSkip),
  );

  // Arrow key navigation
  const handlePopoverKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();

    const items = popoverRef.current?.querySelectorAll<HTMLButtonElement>(
      'button[role="menuitem"]:not([disabled])',
    );
    if (!items || items.length === 0) return;

    const itemsArr = Array.from(items);
    const currentIdx = itemsArr.findIndex((el) => el === document.activeElement);

    if (e.key === "ArrowDown") {
      const next = currentIdx < itemsArr.length - 1 ? currentIdx + 1 : 0;
      itemsArr[next].focus();
    } else {
      const prev = currentIdx > 0 ? currentIdx - 1 : itemsArr.length - 1;
      itemsArr[prev].focus();
    }
  };

  let firstAllowedSet = false;

  const popover = (
    <div
      ref={popoverRef}
      role="menu"
      aria-label="Change status"
      onKeyDown={handlePopoverKeyDown}
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: "200px",
        maxWidth: "280px",
        backgroundColor: "#FFFEFB",
        border: "0.5px solid #E8DDD0",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(44, 37, 32, 0.08)",
        zIndex: 50,
        padding: "4px",
      }}
    >
      {/* Option rows — eyebrow heading dropped; the menu is self-explanatory */}
      {visibleStatuses.map((s) => {
        const transition = transitionMap.get(s);
        const allowed = transition ? transition.allowed : false;
        const isCurrent = s === currentStatus;
        // Suppress action-style decoration when the row IS the current state.
        // The custom label / green tint / hint only describe transitioning TO
        // complete — they're noise once the milestone is already there.
        const reason = isCurrent ? undefined : transition?.reason;
        const label = isCurrent
          ? STATUS_LABELS[s]
          : (transition?.label ?? STATUS_LABELS[s]);
        const isCompleteAction = s === "complete" && allowed && !isCurrent;

        // First allowed (other than current) gets the auto-focus ref
        let refProp: React.RefObject<HTMLButtonElement | null> | null = null;
        if (allowed && !isCurrent && !firstAllowedSet) {
          refProp = firstAllowedRef;
          firstAllowedSet = true;
        }

        return (
          <button
            key={s}
            type="button"
            role="menuitem"
            ref={refProp as React.RefCallback<HTMLButtonElement> | null}
            disabled={!allowed || isCurrent}
            aria-disabled={!allowed || isCurrent ? "true" : undefined}
            aria-current={isCurrent ? "true" : undefined}
            onClick={() => {
              if (allowed && !isCurrent) {
                onPick(s);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              width: "100%",
              textAlign: "left",
              padding: "6px 10px",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              fontWeight: isCompleteAction ? 600 : 400,
              color: !allowed
                ? "#9E8E80"
                : isCompleteAction
                  ? "#27500A"
                  : "#2C2520",
              backgroundColor: isCompleteAction ? "#EEF3E3" : "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: allowed && !isCurrent ? "pointer" : "default",
              opacity: !allowed ? 0.55 : 1,
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => {
              if (allowed && !isCurrent) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  isCompleteAction ? "#E2EBD3" : "#F3EDE3";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                isCompleteAction ? "#EEF3E3" : "transparent";
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
              <span>
                {label}
                {isCurrent && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "11px",
                      color: "#9E8E80",
                      fontWeight: 400,
                    }}
                  >
                    · current
                  </span>
                )}
              </span>
              {reason && (
                <span
                  style={{
                    fontSize: "11px",
                    color: allowed ? "#854F0B" : "#9E8E80",
                    fontWeight: 400,
                  }}
                >
                  {reason}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );

  // Render via portal to document.body so it escapes overflow-hidden containers
  return createPortal(popover, document.body);
}

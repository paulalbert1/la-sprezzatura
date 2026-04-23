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

  // Build ordered option list, filtering out skipped when optionalSkip is false
  const visibleStatuses = STATUS_ORDER.filter(
    (s) => s !== "skipped" || optionalSkip,
  );

  // Map transitions into lookup by status
  const transitionMap = new Map(transitions.map((t) => [t.status, t]));

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
      {/* Heading row */}
      <div
        style={{
          padding: "8px 12px 4px 12px",
          fontSize: "11px",
          fontWeight: 600,
          color: "#6B5E52",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontFamily: "var(--font-sans)",
        }}
      >
        Change status
      </div>

      {/* Option rows */}
      {visibleStatuses.map((s) => {
        const transition = transitionMap.get(s);
        const allowed = transition ? transition.allowed : false;
        const reason = transition?.reason;
        const isCurrent = s === currentStatus;

        // First allowed gets the auto-focus ref
        let refProp: React.RefObject<HTMLButtonElement | null> | null = null;
        if (allowed && !firstAllowedSet) {
          refProp = firstAllowedRef;
          firstAllowedSet = true;
        }

        return (
          <button
            key={s}
            type="button"
            role="menuitem"
            ref={refProp as React.RefCallback<HTMLButtonElement> | null}
            disabled={!allowed}
            aria-disabled={!allowed ? "true" : undefined}
            aria-current={isCurrent ? "true" : undefined}
            onClick={() => {
              if (allowed) {
                onPick(s);
              }
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 12px",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              color: allowed ? "#2C2520" : "#9E8E80",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: allowed ? "pointer" : "not-allowed",
              opacity: allowed ? 1 : 0.6,
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => {
              if (allowed) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3EDE3";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <span style={{ display: "block" }}>{STATUS_LABELS[s]}</span>
            {!allowed && reason && (
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "#9E8E80",
                  marginTop: "2px",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {reason}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Render via portal to document.body so it escapes overflow-hidden containers
  return createPortal(popover, document.body);
}

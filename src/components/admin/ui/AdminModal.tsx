import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Phase 34 Plan 02 — AdminModal primitive
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § AdminModal primitive contract
//
// Reusable modal primitive consumed by SendUpdateModal (Plan 04),
// RegenerateLinkDialog (Plan 05), and any future admin modal. The primitive
// owns all focus-trap / scroll-lock / dismissal wiring so consumers can pass
// `open`, `onClose`, and children without re-implementing the shell.

export interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md";
  disableDismiss?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  "aria-describedby"?: string;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function AdminModal({
  open,
  onClose,
  title,
  size = "md",
  disableDismiss = false,
  children,
  footer,
  "aria-describedby": ariaDescribedBy,
}: AdminModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const headerId = useId();

  // Scroll lock: run synchronously relative to paint so the body doesn't flash
  // a scrollbar when a modal opens. Restore the prior overflow value on close.
  useLayoutEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Focus management + Escape handler. Captures the element that had focus
  // before the modal opened so we can restore on close.
  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = (document.activeElement as HTMLElement) || null;

    // Ref is already attached by the time the layout effect below runs.
    const card = cardRef.current;
    if (card) {
      const focusables = Array.from(
        card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      // First focusable that is NOT the close button, if any; otherwise the
      // close button itself. Consumers with form fields should see focus
      // land on the field, not on the dismiss control.
      const firstContent = focusables.find(
        (el) => el.getAttribute("aria-label") !== "Close",
      );
      (firstContent || focusables[0])?.focus();
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableDismiss) {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      // Restore focus to the element that had it before open.
      const prior = previouslyFocusedRef.current;
      if (prior && typeof prior.focus === "function") {
        prior.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [open, disableDismiss, onClose]);

  if (!open) return null;

  const sizeClass = size === "sm" ? "max-w-[440px]" : "max-w-[540px]";

  const handleOverlayClick = () => {
    if (disableDismiss) return;
    onClose();
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent bubbling so clicks on the card interior don't dismiss the modal.
    e.stopPropagation();
  };

  const handleCardKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const card = cardRef.current;
    if (!card) return;
    const focusables = Array.from(
      card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || !card.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // SSR guard: createPortal needs document.body. During jsdom tests document is
  // available; in Astro SSR this component is always hydrated client-side via
  // client:load, so window/document exist by the time open can become true.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-admin-modal-overlay
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(44, 37, 32, 0.30)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}
      onClick={handleOverlayClick}
    >
      <div
        ref={cardRef}
        data-admin-modal-card
        className={`w-full ${sizeClass} mx-auto my-16 max-h-[calc(100vh-128px)] flex flex-col rounded-xl shadow-xl overflow-hidden`}
        style={{
          backgroundColor: "#FFFEFB",
          border: "0.5px solid #E8DDD0",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headerId}
        aria-describedby={ariaDescribedBy}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "0.5px solid #E8DDD0" }}
        >
          <span
            id={headerId}
            className="font-semibold"
            style={{
              fontSize: "14px",
              color: "#2C2520",
              fontFamily: "var(--font-sans)",
            }}
          >
            {title}
          </span>
          <button
            type="button"
            onClick={() => {
              if (!disableDismiss) onClose();
            }}
            disabled={disableDismiss}
            aria-label="Close"
            className="inline-flex items-center justify-center p-1 rounded-md transition-colors"
            style={{
              color: "#9E8E80",
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer ? (
          <div
            className="flex items-center justify-end gap-3 px-6 py-4"
            style={{ borderTop: "0.5px solid #E8DDD0" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

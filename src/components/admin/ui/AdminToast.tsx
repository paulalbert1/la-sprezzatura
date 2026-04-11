import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

// Phase 34 Plan 02 — AdminToast primitive
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § AdminToast primitive contract
//
// A single toast entry. Stacking is owned by ToastContainer; this component
// only cares about rendering + auto-dismiss lifecycle for ONE toast.
//
// Variants (contract):
//   success → left bar #9A7B4B, title #2C2520, role="status"
//   error   → left bar #9B3A2A, title #9B3A2A, role="alert"
//   info    → left bar #6B5E52, title #2C2520, role="status"
//
// Auto-dismiss: setTimeout(duration), duration=0 ⇒ persistent. Hover
// pauses the timer; mouse leave resumes from 0 (matches the UI-SPEC language
// "hover pauses the timer" — we reset the countdown on leave so the user
// always gets a full duration window after they stop hovering).

export type AdminToastVariant = "success" | "error" | "info";

export interface AdminToastAction {
  label: string;
  onClick: () => void;
}

export interface AdminToastProps {
  variant?: AdminToastVariant;
  title: string;
  body?: string | ReactNode;
  action?: AdminToastAction;
  duration?: number;
  onDismiss: () => void;
}

interface VariantStyle {
  bar: string;
  title: string;
  role: "status" | "alert";
}

const VARIANT_STYLES: Record<AdminToastVariant, VariantStyle> = {
  success: { bar: "#9A7B4B", title: "#2C2520", role: "status" },
  error: { bar: "#9B3A2A", title: "#9B3A2A", role: "alert" },
  info: { bar: "#6B5E52", title: "#2C2520", role: "status" },
};

export default function AdminToast({
  variant = "success",
  title,
  body,
  action,
  duration = 3000,
  onDismiss,
}: AdminToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(false);

  // Set up / clear the auto-dismiss timer whenever duration changes or the
  // paused state flips. duration === 0 means persistent — never set a timer.
  useEffect(() => {
    if (duration <= 0) return;
    if (isPausedRef.current) return;
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [duration, onDismiss]);

  const style = VARIANT_STYLES[variant];

  const handleMouseEnter = () => {
    isPausedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
    if (duration <= 0) return;
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, duration);
  };

  return (
    <div
      data-admin-toast
      role={style.role}
      aria-live={style.role === "alert" ? "assertive" : "polite"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-start gap-3 rounded-lg shadow-md overflow-hidden"
      style={{
        width: "420px",
        maxWidth: "calc(100vw - 48px)",
        backgroundColor: "#FFFEFB",
        border: "0.5px solid #E8DDD0",
        padding: "14px 16px 14px 18px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Left color bar */}
      <span
        data-admin-toast-bar
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "3px",
          backgroundColor: style.bar,
        }}
      />

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div
          className="font-semibold"
          style={{
            fontSize: "13px",
            color: style.title,
            lineHeight: 1.35,
          }}
        >
          {title}
        </div>
        {body ? (
          <div
            className="mt-1"
            style={{
              fontSize: "12px",
              color: "#6B5E52",
              lineHeight: 1.4,
            }}
          >
            {body}
          </div>
        ) : null}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 font-medium transition-colors"
            style={{
              fontSize: "12px",
              color: "#9A7B4B",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {action.label}
          </button>
        ) : null}
      </div>

      {/* Dismiss X */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 inline-flex items-center justify-center p-1 rounded-md transition-colors"
        style={{
          color: "#9E8E80",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

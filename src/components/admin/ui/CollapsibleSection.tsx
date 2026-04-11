import {
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";

// Phase 34 Plan 02 — CollapsibleSection primitive
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § 1 /admin/settings layout
//
// Luxury-token collapsible section. The body is unmounted when collapsed so
// consumers don't keep per-field state around when the section is hidden.
//
// Accessibility:
//   - role="button" on the header with tabindex=0
//   - Enter and Space toggle; Space prevents default so the page doesn't scroll
//   - aria-expanded reflects the current state

export interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  unsavedChanges?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  unsavedChanges = false,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState<boolean>(defaultOpen);

  const toggle = () => setExpanded((v) => !v);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: "#FFFEFB",
        border: "0.5px solid #E8DDD0",
        borderRadius: "10px",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-3 cursor-pointer select-none"
        style={{
          padding: "14px 20px",
          minHeight: "44px",
          fontFamily: "var(--font-sans)",
        }}
      >
        <ChevronDown
          data-collapsible-chevron
          size={14}
          className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          style={{
            color: expanded ? "#9A7B4B" : "#6B5E52",
            flexShrink: 0,
          }}
        />
        <span
          className="font-semibold"
          style={{
            fontSize: "13px",
            color: "#2C2520",
          }}
        >
          {title}
        </span>
        <span className="flex-1" />
        {unsavedChanges ? (
          <span
            aria-label="Unsaved changes"
            title="Unsaved changes"
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#9A7B4B",
            }}
          />
        ) : null}
      </div>
      {expanded ? (
        <div
          style={{
            borderTop: "0.5px solid #E8DDD0",
            padding: "20px 24px 24px 24px",
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

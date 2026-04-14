import { Search, X } from "lucide-react";

// Phase 35 Plan 02 — CardFilterInput primitive
// Source of truth: .planning/phases/35-dashboard-polish-global-ux-cleanup/35-UI-SPEC.md § <CardFilterInput /> (new, shared)
//
// Shared filter input used by the Upcoming Deliveries and Projects dashboard
// cards. Controlled component; state lives in the parent card.
// - Live per-keystroke (no debounce, synchronous onChange)
// - Leading Search icon (14px) inside a pl-8 wrapper
// - Trailing X clear button, rendered only when value.length > 0
// - aria-label falls back to placeholder when not provided

export interface CardFilterInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  ariaLabel?: string;
  className?: string;
}

export default function CardFilterInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: CardFilterInputProps) {
  const label = ariaLabel ?? placeholder;
  const wrapperClass = `relative ${className ?? ""}`.trim();

  return (
    <div className={wrapperClass}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-stone-light"
      >
        <Search className="w-[14px] h-[14px]" />
      </span>
      <input
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[13px] font-body text-charcoal bg-transparent border border-stone-light/40 rounded-md px-3 py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-terracotta placeholder:text-stone-light"
      />
      {value.length > 0 ? (
        <button
          type="button"
          aria-label="Clear filter"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-2 flex items-center text-stone-light hover:text-charcoal transition-colors"
        >
          <X className="w-[14px] h-[14px]" />
        </button>
      ) : null}
    </div>
  );
}

import {
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

// Phase 34 Plan 02 — TagInput primitive
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § Rendering Configuration
//
// Multi-value input for rendering image-types and excluded-users fields on
// the Settings page. Chips render inline with a trailing × icon; the input
// field accepts new values via Enter. Duplicates are silently rejected.
// Email validator shows an inline error; non-email mode has no error path.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_ERROR_COPY = "Enter a valid email address.";

export interface TagInputProps {
  tags: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  validator?: "email" | "none";
  chipIcon?: ReactNode;
  emptyHint?: string;
}

function isDuplicate(
  value: string,
  existing: string[],
  validator: "email" | "none",
): boolean {
  if (validator === "email") {
    const needle = value.toLowerCase();
    return existing.some((t) => t.toLowerCase() === needle);
  }
  return existing.includes(value);
}

export default function TagInput({
  tags,
  onChange,
  placeholder,
  validator = "none",
  chipIcon,
  emptyHint,
}: TagInputProps) {
  const [buffer, setBuffer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const removeAt = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const tryAdd = () => {
    const raw = buffer.trim();
    if (!raw) return;

    if (validator === "email" && !EMAIL_REGEX.test(raw)) {
      setError(EMAIL_ERROR_COPY);
      return;
    }

    if (isDuplicate(raw, tags, validator)) {
      // Silent reject per UI-SPEC: duplicates just clear the buffer with no
      // toast and no inline error.
      setBuffer("");
      setError(null);
      return;
    }

    onChange([...tags, raw]);
    setBuffer("");
    setError(null);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryAdd();
      return;
    }
    if (e.key === "Backspace" && buffer.length === 0 && tags.length > 0) {
      e.preventDefault();
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="w-full">
      <div
        className="flex items-center flex-wrap gap-1.5"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center"
            style={{
              backgroundColor: "#F3EDE3",
              color: "#2C2520",
              border: "0.5px solid #D4C8B8",
              padding: "5px 11px",
              borderRadius: "20px",
              fontSize: "13px",
              gap: "6px",
            }}
          >
            {chipIcon ? (
              <span className="inline-flex items-center">{chipIcon}</span>
            ) : null}
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeAt(idx)}
              aria-label={`Remove ${tag}`}
              className="inline-flex items-center justify-center"
              style={{
                color: "#6B5E52",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={buffer}
          onChange={(e) => {
            setBuffer(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="luxury-input"
          style={{ flex: 1, minWidth: "140px" }}
        />
      </div>
      {error ? (
        <div
          className="mt-1"
          style={{
            fontSize: "10.5px",
            color: "#9B3A2A",
          }}
        >
          {error}
        </div>
      ) : tags.length === 0 && emptyHint ? (
        <div
          className="mt-1"
          style={{
            fontSize: "10.5px",
            color: "#9E8E80",
          }}
        >
          {emptyHint}
        </div>
      ) : null}
    </div>
  );
}

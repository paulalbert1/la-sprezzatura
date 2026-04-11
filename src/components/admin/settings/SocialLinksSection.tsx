import { ExternalLink } from "lucide-react";
import type { ChangeEvent } from "react";

// Phase 34 Plan 03 — SocialLinksSection
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § 1.2 (Social Links)

export interface SocialLinksValues {
  instagram: string;
  pinterest: string;
  houzz: string;
}

export interface SocialLinksSectionProps {
  values: SocialLinksValues;
  onChange: (next: SocialLinksValues) => void;
}

const HTTPS_REGEX = /^https:\/\//;

interface SocialFieldProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}

function SocialField({
  label,
  value,
  onChange,
  placeholder,
}: SocialFieldProps) {
  const isValid = value.length === 0 || HTTPS_REGEX.test(value);
  return (
    <div>
      <label
        className="flex items-center gap-2 mb-1 uppercase"
        style={{
          fontSize: "11.5px",
          letterSpacing: "0.04em",
          fontWeight: 600,
          color: "#6B5E52",
        }}
      >
        <ExternalLink className="w-3 h-3" />
        <span>{label}</span>
      </label>
      <input
        type="url"
        className="luxury-input w-full"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {!isValid ? (
        <div
          className="mt-1"
          style={{ fontSize: "10.5px", color: "#9B3A2A" }}
        >
          Must start with https://
        </div>
      ) : null}
    </div>
  );
}

export default function SocialLinksSection({
  values,
  onChange,
}: SocialLinksSectionProps) {
  return (
    <div className="flex flex-col" style={{ gap: "16px" }}>
      <SocialField
        label="Instagram URL"
        value={values.instagram}
        onChange={(v) => onChange({ ...values, instagram: v })}
        placeholder="https://instagram.com/lasprezz"
      />
      <SocialField
        label="Pinterest URL"
        value={values.pinterest}
        onChange={(v) => onChange({ ...values, pinterest: v })}
        placeholder="https://pinterest.com/lasprezz"
      />
      <SocialField
        label="Houzz URL"
        value={values.houzz}
        onChange={(v) => onChange({ ...values, houzz: v })}
        placeholder="https://houzz.com/pro/lasprezz"
      />
    </div>
  );
}

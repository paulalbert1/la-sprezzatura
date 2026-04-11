import type { ChangeEvent } from "react";

// Phase 34 Plan 03 — GeneralSection
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § 1.1 (General)

const MAX_SITE_TITLE = 60;
const MAX_TAGLINE = 120;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GeneralValues {
  siteTitle: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  studioLocation: string;
}

export interface GeneralSectionProps {
  values: GeneralValues;
  onChange: (next: GeneralValues) => void;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label
      className="block mb-1 uppercase"
      style={{
        fontSize: "11.5px",
        letterSpacing: "0.04em",
        fontWeight: 600,
        color: "#6B5E52",
      }}
    >
      {children}
    </label>
  );
}

function HelperText({ children }: { children: string }) {
  return (
    <div
      className="mt-1"
      style={{ fontSize: "11.5px", color: "#9E8E80" }}
    >
      {children}
    </div>
  );
}

export default function GeneralSection({
  values,
  onChange,
}: GeneralSectionProps) {
  const handle =
    (key: keyof GeneralValues) => (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, [key]: e.target.value });
    };

  const emailIsValid =
    values.contactEmail.length === 0 ||
    EMAIL_REGEX.test(values.contactEmail.trim());

  return (
    <div className="flex flex-col" style={{ gap: "16px" }}>
      <div>
        <FieldLabel>Site Title</FieldLabel>
        <input
          type="text"
          className="luxury-input w-full"
          value={values.siteTitle}
          onChange={handle("siteTitle")}
          placeholder="Your studio name"
          maxLength={MAX_SITE_TITLE}
        />
      </div>

      <div>
        <FieldLabel>Tagline</FieldLabel>
        <input
          type="text"
          className="luxury-input w-full"
          value={values.tagline}
          onChange={handle("tagline")}
          placeholder="Interior Design, Long Island"
          maxLength={MAX_TAGLINE}
        />
      </div>

      <div>
        <FieldLabel>Contact Email</FieldLabel>
        <input
          type="email"
          className="luxury-input w-full"
          value={values.contactEmail}
          onChange={handle("contactEmail")}
          placeholder="contact@your-studio.example"
        />
        {!emailIsValid ? (
          <div
            className="mt-1"
            style={{ fontSize: "10.5px", color: "#9B3A2A" }}
          >
            Enter a valid email address.
          </div>
        ) : null}
      </div>

      <div>
        <FieldLabel>Contact Phone</FieldLabel>
        <input
          type="tel"
          className="luxury-input w-full"
          value={values.contactPhone}
          onChange={handle("contactPhone")}
          placeholder="(516) 555-0123"
        />
      </div>

      <div>
        <FieldLabel>Studio Location</FieldLabel>
        <input
          type="text"
          className="luxury-input w-full"
          value={values.studioLocation}
          onChange={handle("studioLocation")}
          placeholder="Long Island, NY"
        />
        <HelperText>General area — not a home address</HelperText>
      </div>
    </div>
  );
}

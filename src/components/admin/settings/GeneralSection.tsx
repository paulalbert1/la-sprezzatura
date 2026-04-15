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
  // Phase 38 — Send Update sender config (SETT-10 / SETT-11)
  defaultFromEmail: string;
  defaultCcEmail: string;
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

  // Phase 38 — inline-on-blur validation for defaultFromEmail (D-03, D-09).
  // Empty is valid ("use default"). D-09 accepts `"Name" <addr@domain>`; the
  // validator extracts the bracketed substring and regex-tests that.
  const fromEmailValid = (() => {
    const v = values.defaultFromEmail.trim();
    if (v.length === 0) return true;
    const bracketMatch = v.match(/^".*"\s*<([^>]+)>\s*$/);
    const testValue = bracketMatch ? bracketMatch[1].trim() : v;
    return EMAIL_REGEX.test(testValue);
  })();

  // Phase 38 — CC is a comma-separated list (D-04, D-05). Empty entries
  // (trailing comma) are ignored. Any malformed entry invalidates the whole.
  const ccEmailValid = (() => {
    const v = values.defaultCcEmail;
    if (v.trim().length === 0) return true;
    const entries = v
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return entries.every((e) => EMAIL_REGEX.test(e));
  })();

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

      {/* Phase 38 — Send Update sender config (SETT-10). D-01: appended after
          Studio Location, no sub-header. D-02: placeholder is the literal
          default; empty is a valid "use default" state. D-03: inline-on-blur
          validation; Save is never disabled. */}
      <div>
        <FieldLabel>Send Update — From</FieldLabel>
        <input
          type="email"
          className="luxury-input w-full"
          value={values.defaultFromEmail}
          onChange={handle("defaultFromEmail")}
          placeholder="office@lasprezz.com"
          autoComplete="email"
        />
        {!fromEmailValid ? (
          <div
            className="mt-1"
            style={{ fontSize: "10.5px", color: "#9B3A2A" }}
          >
            Enter a valid email address.
          </div>
        ) : null}
        <HelperText>
          {'Default "from" address for Send Update emails. Leave empty to use office@lasprezz.com.'}
        </HelperText>
      </div>

      {/* Phase 38 — Send Update CC (SETT-11). D-04/D-05: single text input,
          comma-separated, per-entry regex. D-07: helper copy mentions the
          comma-separation affordance. */}
      <div>
        <FieldLabel>Send Update — CC</FieldLabel>
        <input
          type="email"
          className="luxury-input w-full"
          value={values.defaultCcEmail}
          onChange={handle("defaultCcEmail")}
          placeholder="liz@lasprezz.com"
          autoComplete="email"
        />
        {!ccEmailValid ? (
          <div
            className="mt-1"
            style={{ fontSize: "10.5px", color: "#9B3A2A" }}
          >
            Enter a valid email address.
          </div>
        ) : null}
        <HelperText>
          {'Default "cc" address(es) for Send Update emails. Comma-separate multiple. Leave empty to use liz@lasprezz.com.'}
        </HelperText>
      </div>
    </div>
  );
}

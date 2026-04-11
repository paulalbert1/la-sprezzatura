import { Mail } from "lucide-react";
import type { ChangeEvent } from "react";
import TagInput from "../ui/TagInput";

// Phase 34 Plan 03 — RenderingConfigSection
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § 1.4 (Rendering Configuration)

export interface RenderingConfigValues {
  renderingAllocation: number;
  renderingImageTypes: string[];
  renderingExcludedUsers: string[];
}

export interface RenderingConfigSectionProps {
  values: RenderingConfigValues;
  onChange: (next: RenderingConfigValues) => void;
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

export default function RenderingConfigSection({
  values,
  onChange,
}: RenderingConfigSectionProps) {
  const handleAllocation = (e: ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value, 10);
    onChange({
      ...values,
      renderingAllocation: Number.isFinite(n) && n >= 1 ? n : 1,
    });
  };

  return (
    <div className="flex flex-col" style={{ gap: "20px" }}>
      <div>
        <FieldLabel>Monthly Rendering Limit</FieldLabel>
        <input
          type="number"
          className="luxury-input"
          style={{ width: "120px" }}
          value={values.renderingAllocation}
          onChange={handleAllocation}
          min={1}
          step={1}
          placeholder="50"
        />
        <HelperText>
          Maximum AI renderings per designer per month. Takes effect immediately for new usage checks.
        </HelperText>
      </div>

      <div>
        <FieldLabel>Image Types</FieldLabel>
        <TagInput
          tags={values.renderingImageTypes}
          onChange={(next) =>
            onChange({ ...values, renderingImageTypes: next })
          }
          placeholder="Add image type"
          validator="none"
          emptyHint="Options Liz can pick from when classifying a rendering input image."
        />
      </div>

      <div>
        <FieldLabel>Excluded Users</FieldLabel>
        <TagInput
          tags={values.renderingExcludedUsers}
          onChange={(next) =>
            onChange({ ...values, renderingExcludedUsers: next })
          }
          placeholder="user@lasprezz.com"
          validator="email"
          chipIcon={<Mail className="w-3 h-3" />}
          emptyHint="Email addresses of users who cannot use the rendering tool. Stored as-is; sanitization happens server-side."
        />
      </div>
    </div>
  );
}

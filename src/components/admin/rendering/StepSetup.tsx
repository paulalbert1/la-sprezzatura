import type {
  WizardData,
  ProjectOption,
} from "../../../lib/rendering/types";
import { STYLE_PRESETS } from "../../../lib/rendering/types";

interface StepSetupProps {
  wizardData: WizardData;
  onChange: (data: Partial<WizardData>) => void;
  projects: ProjectOption[];
}

const ASPECT_RATIOS: Array<WizardData["aspectRatio"]> = ["16:9", "1:1", "4:3"];

/**
 * Step 1 of the rendering wizard: session title, project, aspect ratio, style preset.
 *
 * RNDR-10 regression preserved (D-13 verbatim-port rule): the Style Preset dropdown
 * lives on THIS step (Step 1). The long-form prompt textarea lives on Step 4
 * (StepDescribe.tsx). The two fields are separated so user input to one does not
 * clobber the other.
 *
 * Ported from src/sanity/components/rendering/Wizard/StepSetup.tsx lines 101-149 with
 * @sanity/ui swapped for Tailwind + admin .luxury-input class. The Studio version
 * fetched projects via useClient(); this admin version receives projects as a prop
 * from the Astro page frontmatter (Risk 4 resolution).
 */
export function StepSetup({ wizardData, onChange, projects }: StepSetupProps) {
  const labelClass =
    "block text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#6B5E52] mb-1";

  return (
    <div className="flex flex-col gap-4">
      {/* Session title (required) */}
      <div>
        <label htmlFor="wizard-session-title" className={labelClass}>
          Session title
        </label>
        <input
          id="wizard-session-title"
          type="text"
          className="luxury-input w-full"
          placeholder="e.g., Living room Concept A"
          value={wizardData.sessionTitle}
          onChange={(e) => onChange({ sessionTitle: e.target.value })}
        />
      </div>

      {/* Project (optional) */}
      <div>
        <label htmlFor="wizard-project" className={labelClass}>
          Project
        </label>
        <select
          id="wizard-project"
          className="luxury-input w-full"
          value={wizardData.projectId ?? ""}
          onChange={(e) =>
            onChange({ projectId: e.target.value ? e.target.value : null })
          }
        >
          <option value="">-- None (scratchpad) --</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Aspect ratio (3-button radio group) */}
      <div>
        <span className={labelClass}>Aspect ratio</span>
        <div
          className="flex gap-2"
          role="radiogroup"
          aria-label="Aspect ratio"
        >
          {ASPECT_RATIOS.map((ratio) => {
            const isActive = wizardData.aspectRatio === ratio;
            return (
              <button
                key={ratio}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => onChange({ aspectRatio: ratio })}
                className={
                  isActive
                    ? "px-4 py-2 rounded-lg text-sm border-[0.5px] border-[#9A7B4B] bg-[#F5EDD8] text-[#9A7B4B] transition-colors"
                    : "px-4 py-2 rounded-lg text-sm border-[0.5px] border-[#D4C8B8] text-[#6B5E52] hover:bg-[#FDFBF8] transition-colors"
                }
              >
                {ratio}
              </button>
            );
          })}
        </div>
      </div>

      {/* Style preset (RNDR-10: on Step 1, NOT on Step 4) */}
      <div>
        <label htmlFor="wizard-style-preset" className={labelClass}>
          Style preset
        </label>
        <select
          id="wizard-style-preset"
          className="luxury-input w-full"
          value={wizardData.stylePreset}
          onChange={(e) => onChange({ stylePreset: e.target.value })}
        >
          {STYLE_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

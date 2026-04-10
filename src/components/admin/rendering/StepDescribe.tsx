import type { WizardData } from "../../../lib/rendering/types";

interface StepDescribeProps {
  wizardData: WizardData;
  onChange: (data: Partial<WizardData>) => void;
  isGenerating: boolean;
}

/**
 * Step 4 of the rendering wizard: free-text design vision prompt.
 *
 * RNDR-10 regression preserved (D-13 verbatim-port rule): this step renders the
 * Design Vision textarea. It does NOT render a Style Preset dropdown — that
 * lives on Step 1 (StepSetup.tsx). The two fields are separated so user input
 * to one does not clobber the other.
 *
 * Ported from src/sanity/components/rendering/Wizard/StepDescribe.tsx with
 * @sanity/ui swapped for Tailwind + .luxury-input. The generation error banner
 * lives on the parent WizardContainer (rendered below the step content card).
 */
export function StepDescribe({
  wizardData,
  onChange,
  isGenerating,
}: StepDescribeProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="wizard-design-vision"
          className="block text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#6B5E52] mb-1"
        >
          Design vision
        </label>
        <textarea
          id="wizard-design-vision"
          className="luxury-input w-full"
          rows={8}
          disabled={isGenerating}
          placeholder="Describe the mood, materials, and feel you want. Keep it specific but not overly prescriptive."
          value={wizardData.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
        <p className="text-[11.5px] text-[#9E8E80] mt-1">
          Describe the mood, materials, and feel you want. Keep it specific but
          not overly prescriptive.
        </p>
      </div>
    </div>
  );
}

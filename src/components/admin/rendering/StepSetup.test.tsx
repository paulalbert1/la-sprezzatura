import { describe, it } from "vitest";
// RNDR-10: Field separation — Source: StepSetup.tsx (Style Preset dropdown on Step 1) + StepDescribe.tsx (Design Vision on Step 4)
// Fix in place: Style Preset is on Step 1, Design Vision textarea is on Step 4 (separate steps, no overlap)
describe("StepSetup (admin)", () => {
  it.todo("renders a Style Preset dropdown (not a textarea) with STYLE_PRESETS options");
  it.todo("does NOT render a Design Vision textarea (that lives on Step 4 / StepDescribe)");
  it.todo("Style Preset dropdown has placeholder 'Select a style...'");
});

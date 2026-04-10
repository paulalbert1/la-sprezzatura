import { describe, it } from "vitest";
// RNDR-06: maxVisitedStep navigation
// Source of truth: src/sanity/components/rendering/Wizard/WizardContainer.tsx lines 19-21, 196-280
// Port action: copy maxVisitedStep logic verbatim; swap @sanity/ui for Tailwind divs
describe("WizardContainer (admin)", () => {
  it.todo("starts at step 1, maxVisitedStep=1, steps 2-4 are disabled");
  it.todo("after completing step 1, maxVisitedStep advances to 2 and step 2 becomes clickable");
  it.todo("after completing step 2 (with images), step 3 (Classify) becomes clickable");
  it.todo("clicking a completed step circle calls setCurrentStep with that step number");
  it.todo("future steps (beyond maxVisitedStep) are not clickable (aria-disabled=true)");
  it.todo("Classify step is disabled when no images are uploaded, even if step 2 was visited");
});

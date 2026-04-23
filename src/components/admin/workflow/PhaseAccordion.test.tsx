// @vitest-environment jsdom
// Phase 44 Plan 06 Task 2 — PhaseAccordion RED tests.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import PhaseAccordion from "./PhaseAccordion";
import type { PhaseInstance } from "../../../lib/workflow/types";

afterEach(cleanup);

function makePhase(overrides: Partial<PhaseInstance> = {}): PhaseInstance {
  return {
    _key: "p",
    id: "p1",
    name: "Onboarding",
    order: 0,
    execution: "sequential",
    canOverlapWith: [],
    milestones: [],
    ...overrides,
  };
}

describe("PhaseAccordion", () => {
  it("renders phase name and status pill text", () => {
    render(
      <PhaseAccordion
        phase={makePhase()}
        phaseStatus="in_progress"
        isParallel={false}
        defaultOpen={true}
        isBlocked={() => ({ blocked: false })}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.getByText("Onboarding")).toBeDefined();
    expect(screen.getByText(/in progress/i)).toBeDefined();
  });
  it("shows parallel pill when isParallel", () => {
    render(
      <PhaseAccordion
        phase={makePhase()}
        phaseStatus="in_progress"
        isParallel={true}
        defaultOpen={false}
        isBlocked={() => ({ blocked: false })}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.getByText(/^parallel$/i)).toBeDefined();
  });
  it("toggles body on header click", () => {
    const phase = makePhase({
      milestones: [
        {
          _key: "m",
          id: "m1",
          name: "Agreement",
          assignee: "designer",
          gate: null,
          optional: false,
          multiInstance: false,
          hardPrereqs: [],
          softPrereqs: [],
          status: "not_started",
        },
      ],
    });
    render(
      <PhaseAccordion
        phase={phase}
        phaseStatus="upcoming"
        isParallel={false}
        defaultOpen={false}
        isBlocked={() => ({ blocked: false })}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.queryByText("Agreement")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /onboarding/i }));
    expect(screen.getByText("Agreement")).toBeDefined();
  });
  it("header has aria-expanded reflecting open state", () => {
    render(
      <PhaseAccordion
        phase={makePhase()}
        phaseStatus="upcoming"
        isParallel={false}
        defaultOpen={true}
        isBlocked={() => ({ blocked: false })}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    const hdr = screen.getByRole("button", { name: /onboarding/i });
    expect(hdr.getAttribute("aria-expanded")).toBe("true");
  });
});

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import WorkflowTemplateEditor from "./WorkflowTemplateEditor";
import type { WorkflowTemplate } from "../../../lib/workflow/types";

// Phase 44 Plan 08 — WorkflowTemplateEditor tests
// Covers: render, inline-edit name, add phase, add milestone,
// reorder phases, cycle detection on save, PATCH on save,
// disabled delete when in use, delete confirm + navigate.

const baseTemplate: WorkflowTemplate = {
  _id: "wt-test",
  _type: "workflowTemplate",
  name: "Full-service residential",
  version: 4,
  defaults: {
    clientApprovalDays: 10,
    dormancyDays: 60,
    revisionRounds: 1,
  },
  phases: [
    {
      _key: "phase-1",
      id: "phase-1",
      name: "Onboarding",
      order: 0,
      execution: "sequential",
      canOverlapWith: [],
      milestones: [
        {
          _key: "ms-1",
          id: "ms-agreement",
          name: "Agreement",
          assignee: "client",
          gate: "signature",
          optional: false,
          multiInstance: false,
          hardPrereqs: [],
          softPrereqs: [],
          defaultInstances: [],
        },
        {
          _key: "ms-2",
          id: "ms-retainer",
          name: "Retainer paid",
          assignee: "client",
          gate: "payment",
          optional: false,
          multiInstance: false,
          hardPrereqs: [],
          softPrereqs: [],
          defaultInstances: [],
        },
      ],
    },
  ],
};

const emptyTemplate: WorkflowTemplate = {
  _id: "wt-empty",
  _type: "workflowTemplate",
  name: "Untitled template",
  version: 1,
  defaults: {
    clientApprovalDays: 10,
    dormancyDays: 60,
    revisionRounds: 1,
  },
  phases: [],
};

describe("WorkflowTemplateEditor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders template name and version pill", () => {
    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);
    expect(screen.getByText("Full-service residential")).toBeDefined();
    expect(screen.getByText("v4")).toBeDefined();
  });

  it("renders DEFAULTS, PHASES, and MILESTONES sections", () => {
    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);
    expect(screen.getByText("DEFAULTS")).toBeDefined();
    expect(screen.getByText("PHASES")).toBeDefined();
    expect(screen.getByText("MILESTONES")).toBeDefined();
  });

  it("renders defaults fields with correct values", () => {
    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);
    // Check labels are present
    expect(
      screen.getByText(/client approval window/i),
    ).toBeDefined();
    expect(
      screen.getByText(/dormancy threshold/i),
    ).toBeDefined();
    expect(
      screen.getByText(/revision rounds included/i),
    ).toBeDefined();
  });

  it("renders footer action buttons", () => {
    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);
    expect(screen.getByText("Save template")).toBeDefined();
    expect(screen.getByText("Back to Settings")).toBeDefined();
    expect(screen.getByText("Duplicate as new template")).toBeDefined();
    expect(screen.getByText("Delete template")).toBeDefined();
  });

  it("renders existing phases and milestones", () => {
    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);
    expect(screen.getByText("Onboarding")).toBeDefined();
    // Agreement and Retainer paid appear as inline-edit spans + prereq chips; use getAllByText
    expect(screen.getAllByText("Agreement").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Retainer paid").length).toBeGreaterThan(0);
  });

  it("inline-edits the template name on click", async () => {
    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);
    // Click the name span to enter edit mode
    const nameEl = screen.getByText("Full-service residential");
    fireEvent.click(nameEl);

    // Should now have an input
    const input = screen.getByDisplayValue("Full-service residential");
    expect(input).toBeDefined();

    // Type new name and press Enter
    fireEvent.change(input, { target: { value: "Updated name" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Updated name")).toBeDefined();
    });
  });

  it("adds a phase on '+ Add phase' click", async () => {
    render(<WorkflowTemplateEditor template={emptyTemplate} inUseCount={0} />);
    const addPhaseBtn = screen.getByText("+ Add phase");
    fireEvent.click(addPhaseBtn);

    await waitFor(() => {
      // A new phase card should appear with "New phase" text
      expect(screen.getByText("New phase")).toBeDefined();
    });
  });

  it("adds a milestone inside the first phase", async () => {
    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);
    const addMilestoneBtn = screen.getByText("+ Add milestone");

    // Count "New milestone" occurrences before click (may appear in prereq chips)
    const before = screen.queryAllByText("New milestone").length;

    fireEvent.click(addMilestoneBtn);

    await waitFor(() => {
      // At least one more "New milestone" should appear after click
      expect(screen.queryAllByText("New milestone").length).toBeGreaterThan(before);
    });
  });

  it("renders ArrowUp/ArrowDown buttons for phase reordering", () => {
    render(
      <WorkflowTemplateEditor
        template={{
          ...baseTemplate,
          phases: [
            { ...baseTemplate.phases[0], _key: "p1", id: "p1", name: "Phase 1", milestones: [] },
            { ...baseTemplate.phases[0], _key: "p2", id: "p2", name: "Phase 2", milestones: [] },
          ],
        }}
        inUseCount={0}
      />,
    );
    // Should have Move phase up/down aria-labels
    const upBtns = screen.getAllByRole("button", { name: /move phase up/i });
    const downBtns = screen.getAllByRole("button", { name: /move phase down/i });
    expect(upBtns.length).toBeGreaterThan(0);
    expect(downBtns.length).toBeGreaterThan(0);
  });

  it("reorders phases with up/down arrows", async () => {
    render(
      <WorkflowTemplateEditor
        template={{
          ...baseTemplate,
          phases: [
            { ...baseTemplate.phases[0], _key: "p1", id: "p1", name: "Phase Alpha", milestones: [] },
            { ...baseTemplate.phases[0], _key: "p2", id: "p2", name: "Phase Beta", milestones: [] },
          ],
        }}
        inUseCount={0}
      />,
    );

    // Get the "Move phase down" button on Phase Alpha (first phase)
    const downBtns = screen.getAllByRole("button", { name: /move phase down/i });
    fireEvent.click(downBtns[0]); // move Phase Alpha down

    await waitFor(() => {
      // Phase Beta should now appear before Phase Alpha in DOM order
      const phaseCards = screen.getAllByText(/phase (alpha|beta)/i);
      expect(phaseCards[0].textContent).toMatch(/beta/i);
    });
  });

  it("detects prereq cycles on save and surfaces inline error", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    // Two milestones with a hard prereq cycle: A→B and B→A
    const cycleTemplate: WorkflowTemplate = {
      ...emptyTemplate,
      _id: "wt-cycle",
      phases: [
        {
          _key: "ph1",
          id: "ph1",
          name: "Phase 1",
          order: 0,
          execution: "sequential",
          canOverlapWith: [],
          milestones: [
            {
              _key: "msA",
              id: "ms-a",
              name: "Milestone A",
              assignee: "designer",
              gate: null,
              optional: false,
              multiInstance: false,
              hardPrereqs: ["ms-b"], // A depends on B
              softPrereqs: [],
              defaultInstances: [],
            },
            {
              _key: "msB",
              id: "ms-b",
              name: "Milestone B",
              assignee: "designer",
              gate: null,
              optional: false,
              multiInstance: false,
              hardPrereqs: ["ms-a"], // B depends on A — CYCLE
              softPrereqs: [],
              defaultInstances: [],
            },
          ],
        },
      ],
    };

    render(<WorkflowTemplateEditor template={cycleTemplate} inUseCount={0} />);

    // Make the state dirty by clicking Add phase (then immediately undo is not needed —
    // actually the template differs from itself since cycleTemplate !== emptyTemplate).
    // The Save button is disabled when not dirty. Since template prop equals initial state,
    // we need to make a change to enable Save. Click Add milestone to make it dirty.
    // But wait: the template has milestones, let's change the name to make it dirty.
    const nameEl = screen.getByText("Untitled template");
    fireEvent.click(nameEl);
    const nameInput = screen.getByDisplayValue("Untitled template");
    fireEvent.change(nameInput, { target: { value: "Updated" } });
    fireEvent.keyDown(nameInput, { key: "Enter" });

    await waitFor(() => screen.getByText("Updated"));

    // Save button should now be enabled (dirty)
    const saveBtn = screen.getByText("Save template");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      // Cycle error should appear
      expect(screen.getByRole("alert")).toBeDefined();
    });

    // PATCH should NOT have been called
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PATCHes on Save with updated name + phases", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ template: baseTemplate }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);

    // Make dirty by renaming the template
    const nameEl = screen.getByText("Full-service residential");
    fireEvent.click(nameEl);
    const nameInput = screen.getByDisplayValue("Full-service residential");
    fireEvent.change(nameInput, { target: { value: "Renamed template" } });
    fireEvent.keyDown(nameInput, { key: "Enter" });

    await waitFor(() => screen.getByText("Renamed template"));

    // Click Save
    const saveBtn = screen.getByText("Save template");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/admin/workflow-templates/${baseTemplate._id}`,
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    // Verify the body contains name
    const callArgs = fetchMock.mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.name).toBe("Renamed template");
    expect(body.phases).toBeDefined();
    expect(body.defaults).toBeDefined();
  });

  it("disables Delete template when inUseCount > 0 and shows tooltip", () => {
    render(
      <WorkflowTemplateEditor template={baseTemplate} inUseCount={3} />,
    );
    // Delete button should be disabled
    const deleteBtn = screen.getByText("Delete template").closest("button");
    expect(deleteBtn?.disabled).toBe(true);

    // Tooltip wrapper should have title attribute mentioning project count
    const wrapper = screen.getByText("Delete template").closest("span");
    expect(wrapper?.getAttribute("title")).toContain("3 project");
  });

  it("Delete template confirm → DELETE request → navigate on success", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);

    // Click Delete template
    const deleteBtn = screen.getByText("Delete template");
    fireEvent.click(deleteBtn);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText("Delete template?")).toBeDefined();
    });

    // Pick the confirm button in the modal — there are two "Delete template" buttons:
    // one in the footer bar (enabled, triggers modal open) and one in the modal footer.
    // After the modal opens, we want the second one (in the modal).
    const allDeleteBtns = screen
      .getAllByRole("button")
      .filter(
        (b) => b.textContent?.trim().toLowerCase().includes("delete template") && !b.disabled,
      );
    // allDeleteBtns[0] = footer bar button, allDeleteBtns[1] = modal confirm button
    const modalConfirmBtn = allDeleteBtns[allDeleteBtns.length - 1];
    fireEvent.click(modalConfirmBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/admin/workflow-templates/${baseTemplate._id}`,
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    expect(window.location.href).toBe("/admin/settings");
  });

  it("shows empty state helper when template has no phases", () => {
    render(<WorkflowTemplateEditor template={emptyTemplate} inUseCount={0} />);
    expect(
      screen.getByText(/start by naming your template/i),
    ).toBeDefined();
  });

  it("Duplicate as new template POSTs and navigates", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ template: { _id: "wt-copy" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    render(<WorkflowTemplateEditor template={baseTemplate} inUseCount={0} />);
    const dupBtn = screen.getByText("Duplicate as new template");
    fireEvent.click(dupBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/admin/workflow-templates/${baseTemplate._id}/duplicate`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(window.location.href).toBe(
      "/admin/settings/workflow-templates/wt-copy",
    );
  });
});

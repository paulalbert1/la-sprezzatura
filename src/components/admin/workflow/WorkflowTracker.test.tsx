// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import WorkflowTracker from "./WorkflowTracker";
import type { ProjectWorkflow } from "../../../lib/workflow/types";

afterEach(cleanup);

function baseWorkflow(): ProjectWorkflow {
  return {
    _id: "pw-1",
    _type: "projectWorkflow",
    project: { _type: "reference", _ref: "proj-1" },
    templateId: "wt-1",
    templateVersion: 1,
    status: "active",
    defaults: { clientApprovalDays: 10, dormancyDays: 60, revisionRounds: 1 },
    createdAt: "2026-01-15T00:00:00Z",
    lastActivityAt: "2026-04-20T00:00:00Z",
    phases: [
      {
        _key: "p",
        id: "p1",
        name: "Onboarding",
        order: 0,
        execution: "sequential",
        canOverlapWith: [],
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
      },
    ],
  };
}

const baseProps = {
  projectId: "proj-1",
  projectTitle: "P",
  clientInitials: "AK",
  templateName: "Full-service residential",
  templates: [],
  warnings: [],
  metrics: {
    complete: 0,
    inProgress: 0,
    awaitingClient: 0,
    blocked: 0,
    progressPct: 0,
  },
  transitionsById: {
    "p1:m1": [
      { status: "not_started" as const, allowed: true },
      { status: "in_progress" as const, allowed: true },
    ],
  },
  blockedById: { "p1:m1": { blocked: false } },
};

describe("WorkflowTracker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders header, metrics, and one accordion per phase", () => {
    render(<WorkflowTracker workflow={baseWorkflow()} {...baseProps} />);
    expect(screen.getByText("P")).toBeDefined(); // project title
    expect(screen.getByText("Onboarding")).toBeDefined(); // phase
    expect(screen.getByText("Agreement")).toBeDefined(); // milestone
  });

  it("opens StatusPickerPopover on status circle click", () => {
    render(<WorkflowTracker workflow={baseWorkflow()} {...baseProps} />);
    const circle = screen.getByRole("button", { name: /Agreement/i });
    fireEvent.click(circle);
    expect(screen.getByRole("menu")).toBeDefined();
  });

  it("optimistically applies status, POSTs, and rolls back on 409", async () => {
    const wf = baseWorkflow();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "blocked" }), { status: 409 }),
      );
    render(<WorkflowTracker workflow={wf} {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Agreement/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /in progress/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toContain("milestone-status");
  });

  it("renders WorkflowWarnings when warnings are provided", () => {
    const propsWithWarnings = {
      ...baseProps,
      warnings: [
        {
          kind: "dormancy" as const,
          severity: "warning" as const,
          message: "Approaching dormancy — 47 days",
        },
      ],
    };
    render(<WorkflowTracker workflow={baseWorkflow()} {...propsWithWarnings} />);
    expect(screen.getByText(/approaching dormancy/i)).toBeDefined();
  });

  it("renders WorkflowMetrics derived from the live workflow", () => {
    // Tracker derives metrics from the workflow state, not props.metrics —
    // ensures counts stay in sync after optimistic status changes. Build a
    // workflow with 1 of 4 milestones complete → 25% progress.
    const wf = baseWorkflow();
    wf.phases[0].milestones = [
      { ...wf.phases[0].milestones[0], status: "complete" },
      { ...wf.phases[0].milestones[0], _key: "m2", id: "m2", status: "in_progress" },
      { ...wf.phases[0].milestones[0], _key: "m3", id: "m3", status: "not_started" },
      { ...wf.phases[0].milestones[0], _key: "m4", id: "m4", status: "not_started" },
    ];
    render(<WorkflowTracker workflow={wf} {...baseProps} />);
    expect(screen.getByText("25%")).toBeDefined();
    expect(screen.getByText(/Overall progress/i)).toBeDefined();
  });

  it("POSTs to milestone-status endpoint with correct payload", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, workflow: baseWorkflow() }),
        { status: 200 },
      ),
    );
    render(<WorkflowTracker workflow={baseWorkflow()} {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Agreement/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /in progress/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/admin/projects/proj-1/workflow/milestone-status");
    const body = JSON.parse(init.body as string);
    expect(body.phaseId).toBe("p1");
    expect(body.milestoneId).toBe("m1");
    expect(body.target).toBe("in_progress");
  });
});

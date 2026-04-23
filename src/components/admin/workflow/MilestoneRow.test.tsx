// @vitest-environment jsdom
// Phase 44 Plan 06 Task 2 — MilestoneRow RED tests.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import MilestoneRow from "./MilestoneRow";
import type { MilestoneInstance } from "../../../lib/workflow/types";

afterEach(cleanup);

function makeMs(overrides: Partial<MilestoneInstance> = {}): MilestoneInstance {
  return {
    _key: "k",
    id: "m1",
    name: "Agreement",
    assignee: "designer",
    gate: null,
    optional: false,
    multiInstance: false,
    hardPrereqs: [],
    softPrereqs: [],
    status: "not_started",
    ...overrides,
  };
}

describe("MilestoneRow", () => {
  it("renders milestone name", () => {
    render(
      <MilestoneRow
        phaseId="p1"
        milestone={makeMs()}
        isBlocked={false}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.getByText("Agreement")).toBeDefined();
  });
  it("renders completion date when status=complete", () => {
    render(
      <MilestoneRow
        phaseId="p1"
        milestone={makeMs({ status: "complete", completedAt: "2026-04-20T00:00:00Z" })}
        isBlocked={false}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.getByText(/Apr 20/i)).toBeDefined();
  });
  it("renders gate sub-message when supplied", () => {
    render(
      <MilestoneRow
        phaseId="p1"
        milestone={makeMs()}
        isBlocked={false}
        gateSubMessage="Requires payment · 8 biz days waiting"
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.getByText(/requires payment/i)).toBeDefined();
  });
  it("renders block reason sub-message when isBlocked", () => {
    render(
      <MilestoneRow
        phaseId="p1"
        milestone={makeMs()}
        isBlocked={true}
        blockReason="Blocked by A"
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.getByText(/blocked by a/i)).toBeDefined();
  });
  it("renders optional pill when milestone.optional and status !== skipped", () => {
    render(
      <MilestoneRow
        phaseId="p1"
        milestone={makeMs({ optional: true })}
        isBlocked={false}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.getByText(/^optional$/i)).toBeDefined();
  });
  it("does NOT render optional pill when status === skipped", () => {
    render(
      <MilestoneRow
        phaseId="p1"
        milestone={makeMs({ optional: true, status: "skipped" })}
        isBlocked={false}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.queryByText(/^optional$/i)).toBeNull();
  });
  it("applies line-through when skipped", () => {
    render(
      <MilestoneRow
        phaseId="p1"
        milestone={makeMs({ status: "skipped" })}
        isBlocked={false}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    const name = screen.getByText("Agreement");
    expect(name.style.textDecoration).toMatch(/line-through/);
  });
  it("renders multi-instance sub-rows when milestone.instances present", () => {
    const ms = makeMs({
      multiInstance: true,
      instances: [
        {
          _key: "i1",
          name: "ABC Carpet",
          status: "complete",
          fromTemplate: true,
          completedAt: "2026-04-05T00:00:00Z",
        },
        {
          _key: "i2",
          name: "Mike's Electric",
          status: "in_progress",
          fromTemplate: true,
        },
      ],
    });
    render(
      <MilestoneRow
        phaseId="p1"
        milestone={ms}
        isBlocked={false}
        onStatusClick={vi.fn()}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    expect(screen.getByText("ABC Carpet")).toBeDefined();
    expect(screen.getByText("Mike's Electric")).toBeDefined();
    expect(screen.getByText(/Add contractor/i)).toBeDefined();
  });
  it("calls onStatusClick with instanceKey when a sub-row circle is clicked", () => {
    const onStatusClick = vi.fn();
    const ms = makeMs({
      multiInstance: true,
      instances: [
        { _key: "i1", name: "ABC Carpet", status: "not_started", fromTemplate: true },
      ],
    });
    render(
      <MilestoneRow
        phaseId="p1"
        milestone={ms}
        isBlocked={false}
        onStatusClick={onStatusClick}
        onAddInstance={vi.fn()}
        onRemoveInstance={vi.fn()}
      />,
    );
    const circles = screen.getAllByRole("button", { name: /change status/i });
    // The first circle is the parent (disabled); the next ones are sub-rows.
    const subCircle = circles.find((c) =>
      c.getAttribute("aria-label")?.includes("ABC Carpet"),
    );
    if (subCircle) fireEvent.click(subCircle);
    expect(onStatusClick).toHaveBeenCalledWith("p1", "m1", "i1", expect.any(HTMLElement));
  });
});

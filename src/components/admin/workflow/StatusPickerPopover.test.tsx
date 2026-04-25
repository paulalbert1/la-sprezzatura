// @vitest-environment jsdom
// Phase 44 Plan 06 Task 1 — StatusPickerPopover RED tests.
//
// Tests intentionally fail until StatusPickerPopover.tsx is implemented.

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import StatusPickerPopover from "./StatusPickerPopover";
import type { MilestoneStatus } from "../../../lib/workflow/types";

const baseTransitions = [
  { status: "not_started" as MilestoneStatus, allowed: true },
  { status: "in_progress" as MilestoneStatus, allowed: true },
  { status: "awaiting_client" as MilestoneStatus, allowed: false, reason: "Requires payment" },
  { status: "complete" as MilestoneStatus, allowed: false, reason: "Hard prereq not met" },
];

function WithAnchor(
  props: Omit<React.ComponentProps<typeof StatusPickerPopover>, "anchorEl">,
) {
  const [el, setEl] = React.useState<HTMLElement | null>(null);
  return (
    <>
      <button ref={(n) => setEl(n)}>anchor</button>
      <StatusPickerPopover {...props} anchorEl={el} />
    </>
  );
}

afterEach(cleanup);

describe("StatusPickerPopover", () => {
  it("renders an aria-labeled menu (no eyebrow heading)", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(
      <WithAnchor
        transitions={baseTransitions}
        currentStatus="not_started"
        optionalSkip={false}
        onPick={onPick}
        onClose={onClose}
      />,
    );
    // The menu role + aria-label provides accessible context — no visible
    // heading needed (the popover is self-explanatory).
    const menu = screen.getByRole("menu", { name: /change status/i });
    expect(menu).toBeDefined();
  });
  it("does not render 'Skipped' row when optionalSkip is false", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(
      <WithAnchor
        transitions={baseTransitions}
        currentStatus="not_started"
        optionalSkip={false}
        onPick={onPick}
        onClose={onClose}
      />,
    );
    expect(screen.queryByRole("menuitem", { name: /skipped/i })).toBeNull();
  });
  it("marks disabled rows with aria-disabled and surfaces reason", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(
      <WithAnchor
        transitions={baseTransitions}
        currentStatus="not_started"
        optionalSkip={false}
        onPick={onPick}
        onClose={onClose}
      />,
    );
    const disabled = screen.getByRole("menuitem", { name: /awaiting client/i });
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(disabled.textContent).toMatch(/requires payment/i);
  });
  it("calls onPick when an allowed row is clicked", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(
      <WithAnchor
        transitions={baseTransitions}
        currentStatus="not_started"
        optionalSkip={false}
        onPick={onPick}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /in progress/i }));
    expect(onPick).toHaveBeenCalledWith("in_progress");
  });
  it("Escape key closes the popover", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(
      <WithAnchor
        transitions={baseTransitions}
        currentStatus="not_started"
        optionalSkip={false}
        onPick={onPick}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
  it("renders nothing when anchorEl is null", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(
      <StatusPickerPopover
        anchorEl={null}
        transitions={baseTransitions}
        currentStatus="not_started"
        optionalSkip={false}
        onPick={onPick}
        onClose={onClose}
      />,
    );
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

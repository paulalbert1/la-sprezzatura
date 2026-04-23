// @vitest-environment jsdom
// Phase 44 Plan 06 Task 1 — StatusCircle RED tests.
//
// Tests intentionally fail until StatusCircle.tsx is implemented.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import StatusCircle from "./StatusCircle";

afterEach(cleanup);

describe("StatusCircle", () => {
  it("renders with aria-label describing milestone and current status", () => {
    render(<StatusCircle status="in_progress" milestoneName="Agreement" />);
    const btn = screen.getByRole("button", { name: /Agreement.*in_progress/i });
    expect(btn).toBeDefined();
  });
  it("is non-clickable when isBlocked=true", () => {
    const onClick = vi.fn();
    render(
      <StatusCircle
        status="not_started"
        milestoneName="m"
        isBlocked
        blockReason="Missing prereq"
        onClick={onClick}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
  it("calls onClick with anchor element when clickable", () => {
    const onClick = vi.fn();
    render(<StatusCircle status="not_started" milestoneName="m" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(expect.any(HTMLElement));
  });
  it("tooltips blockReason when blocked", () => {
    render(
      <StatusCircle status="not_started" milestoneName="m" isBlocked blockReason="Blocked by A" />,
    );
    expect(screen.getByRole("button").getAttribute("title")).toContain("Blocked by A");
  });
  it("supports 12px sub-row size", () => {
    const { container } = render(
      <StatusCircle status="complete" milestoneName="m" size={12} />,
    );
    const el = container.querySelector("[data-status-circle]") as HTMLElement;
    expect(el?.style.width).toBe("12px");
  });
});

// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import WorkflowWarnings from "./WorkflowWarnings";

afterEach(cleanup);

describe("WorkflowWarnings", () => {
  it("renders nothing when empty", () => {
    const { container } = render(<WorkflowWarnings warnings={[]} />);
    expect(container.textContent).toBe("");
  });

  it("renders warning text for each item", () => {
    render(
      <WorkflowWarnings
        warnings={[
          { kind: "dormancy", severity: "warning", message: "Approaching dormancy — 47 days" },
          { kind: "approval_overdue", severity: "warning", message: "X: awaiting client for 12 days" },
        ]}
      />,
    );
    expect(screen.getByText(/approaching dormancy/i)).toBeDefined();
    expect(screen.getByText(/awaiting client/i)).toBeDefined();
  });

  it("surfaces dormant severity as role=alert", () => {
    render(
      <WorkflowWarnings
        warnings={[{ kind: "dormant", severity: "error", message: "Dormant" }]}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/dormant/i);
  });

  it("collapses overflow above 4 warnings", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      kind: "dormancy" as const,
      severity: "warning" as const,
      message: `w${i}`,
    }));
    render(<WorkflowWarnings warnings={many} />);
    expect(screen.getByText(/3 more warnings/i)).toBeDefined();
  });

  it("expands overflow on click", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      kind: "dormancy" as const,
      severity: "warning" as const,
      message: `warning-message-${i}`,
    }));
    render(<WorkflowWarnings warnings={many} />);
    fireEvent.click(screen.getByText(/3 more warnings/i));
    // After expansion, all 6 messages should be visible
    expect(screen.getByText("warning-message-3")).toBeDefined();
    expect(screen.getByText("warning-message-4")).toBeDefined();
    expect(screen.getByText("warning-message-5")).toBeDefined();
  });

  it("renders role=status for warning severity", () => {
    render(
      <WorkflowWarnings
        warnings={[{ kind: "dormancy", severity: "warning", message: "Approaching dormancy" }]}
      />,
    );
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/approaching dormancy/i);
  });
});

// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import WorkflowMetrics from "./WorkflowMetrics";

afterEach(cleanup);

describe("WorkflowMetrics", () => {
  it("renders four metric labels and numbers", () => {
    render(
      <WorkflowMetrics
        metrics={{
          complete: 14,
          inProgress: 2,
          awaitingClient: 3,
          blocked: 5,
          progressPct: 58,
        }}
      />,
    );
    expect(screen.getByText("Complete")).toBeDefined();
    expect(screen.getByText("14")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText(/Awaiting client/i)).toBeDefined();
    expect(screen.getByText("Blocked")).toBeDefined();
  });

  it("renders progress bar with pct", () => {
    render(
      <WorkflowMetrics
        metrics={{
          complete: 0,
          inProgress: 0,
          awaitingClient: 0,
          blocked: 0,
          progressPct: 42,
        }}
      />,
    );
    expect(screen.getByText("42%")).toBeDefined();
    expect(screen.getByText(/Overall progress/i)).toBeDefined();
  });

  it("renders the four count values correctly", () => {
    render(
      <WorkflowMetrics
        metrics={{
          complete: 5,
          inProgress: 3,
          awaitingClient: 2,
          blocked: 1,
          progressPct: 60,
        }}
      />,
    );
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("renders progress bar at 100%", () => {
    render(
      <WorkflowMetrics
        metrics={{
          complete: 10,
          inProgress: 0,
          awaitingClient: 0,
          blocked: 0,
          progressPct: 100,
        }}
      />,
    );
    expect(screen.getByText("100%")).toBeDefined();
  });
});

// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import WorkflowStatusCard from "./WorkflowStatusCard";

afterEach(cleanup);

describe("WorkflowStatusCard", () => {
  it("renders 'No projects have workflows yet' when hasAnyWorkflows=false", () => {
    render(<WorkflowStatusCard awaitingClientCount={0} approachingDormancyCount={0} blockedMilestonesCount={0} hasAnyWorkflows={false} />);
    expect(screen.getByText(/no projects have workflows yet/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /create a template/i })).toBeDefined();
  });

  it("renders three rows with labels when hasAnyWorkflows=true", () => {
    render(<WorkflowStatusCard awaitingClientCount={3} approachingDormancyCount={1} blockedMilestonesCount={5} hasAnyWorkflows={true} />);
    expect(screen.getByText(/^awaiting client$/i)).toBeDefined();
    expect(screen.getByText(/^approaching dormancy$/i)).toBeDefined();
    expect(screen.getByText(/^blocked milestones$/i)).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
  });

  it("rows with count > 0 render as links", () => {
    render(<WorkflowStatusCard awaitingClientCount={3} approachingDormancyCount={0} blockedMilestonesCount={5} hasAnyWorkflows={true} />);
    expect(screen.getByRole("link", { name: /awaiting client.*3/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /blocked milestones.*5/i })).toBeDefined();
  });

  it("rows with count 0 do NOT render as links", () => {
    render(<WorkflowStatusCard awaitingClientCount={0} approachingDormancyCount={0} blockedMilestonesCount={0} hasAnyWorkflows={true} />);
    // "Approaching dormancy" row exists but is not a link
    const row = screen.getByText(/^approaching dormancy$/i).closest("a");
    expect(row).toBeNull();
  });

  it("renders 'View all workflows' footer link when hasAnyWorkflows=true", () => {
    render(<WorkflowStatusCard awaitingClientCount={1} approachingDormancyCount={0} blockedMilestonesCount={0} hasAnyWorkflows={true} />);
    expect(screen.getByRole("link", { name: /view all workflows/i })).toBeDefined();
  });

  it("renders 'WORKFLOW STATUS' eyebrow", () => {
    render(<WorkflowStatusCard awaitingClientCount={0} approachingDormancyCount={0} blockedMilestonesCount={0} hasAnyWorkflows={true} />);
    expect(screen.getByText(/^workflow status$/i)).toBeDefined();
  });
});

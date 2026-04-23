// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import WorkflowHeader from "./WorkflowHeader";

afterEach(cleanup);

const baseWf = { _id: "pw-1", status: "active" as const, createdAt: "2026-01-15T00:00:00Z", templateId: "wt-1" };

describe("WorkflowHeader", () => {
  it("renders avatar with client initials", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="Koenig - Great Room"
        clientInitials="AK"
        templateName="Full-service residential"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    expect(screen.getByText("AK")).toBeDefined();
  });

  it("renders project title at heading size", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="Koenig - Great Room"
        clientInitials="AK"
        templateName="Full-service residential"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    expect(screen.getByText("Koenig - Great Room")).toBeDefined();
  });

  it("renders 'Started {date}' in sub-line", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="p"
        clientInitials="AK"
        templateName="t"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    expect(screen.getByText(/Jan 15/)).toBeDefined();
  });

  it("shows active status pill when workflow.status === 'active'", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="p"
        clientInitials="AK"
        templateName="t"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    expect(screen.getByText(/^active$/i)).toBeDefined();
  });

  it("shows Reactivate in overflow menu only when dormant", () => {
    const wf = { ...baseWf, status: "dormant" as const };
    render(
      <WorkflowHeader
        workflow={wf as never}
        projectTitle="p"
        clientInitials="AK"
        templateName="t"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /project workflow options/i }));
    expect(screen.getByText(/Reactivate/i)).toBeDefined();
  });

  it("does not show Reactivate when status is active", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="p"
        clientInitials="AK"
        templateName="t"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /project workflow options/i }));
    expect(screen.queryByText(/Reactivate/i)).toBeNull();
  });

  it("has aria-label on the overflow button per UI-SPEC", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="p"
        clientInitials="AK"
        templateName="t"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    const btn = screen.getByRole("button", { name: /project workflow options/i });
    expect(btn).toBeDefined();
  });

  it("shows Terminate in overflow when status is active", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="p"
        clientInitials="AK"
        templateName="t"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /project workflow options/i }));
    expect(screen.getByText(/Terminate workflow/i)).toBeDefined();
  });

  it("shows Change template in overflow menu", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="p"
        clientInitials="AK"
        templateName="t"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /project workflow options/i }));
    expect(screen.getByText(/Change template/i)).toBeDefined();
  });

  it("shows View template in overflow menu", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="p"
        clientInitials="AK"
        templateName="t"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /project workflow options/i }));
    expect(screen.getByText(/View template/i)).toBeDefined();
  });

  it("renders template name in sub-line", () => {
    render(
      <WorkflowHeader
        workflow={baseWf as never}
        projectTitle="p"
        clientInitials="AK"
        templateName="Full-service residential"
        onChangeTemplate={vi.fn()}
        onTerminate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    expect(screen.getByText(/Full-service residential/)).toBeDefined();
  });
});

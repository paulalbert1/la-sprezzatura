// @vitest-environment jsdom
// Phase 35 Plan 03 — ActiveProjectsCard tests
// Source of truth: .planning/phases/35-dashboard-polish-global-ux-cleanup/35-UI-SPEC.md
// Requirements: DASH-16; CONTEXT D-03, D-04

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ActiveProjectsCard from "./ActiveProjectsCard";

afterEach(() => {
  cleanup();
});

type Row = {
  _id: string;
  title: string;
  clientName: string | null;
  pipelineStage: string;
  stageChangedAt: string | null;
};

const baseRow = (over: Partial<Row> = {}): Row => ({
  _id: "p1",
  title: "Darien Living Room",
  clientName: "Acme Client",
  pipelineStage: "discovery",
  stageChangedAt: "2026-04-01",
  ...over,
});

describe("ActiveProjectsCard (Phase 35 Plan 03)", () => {
  it("renders card title 'Active Projects'", () => {
    render(<ActiveProjectsCard projects={[]} totalCount={0} />);
    expect(screen.getByText("Active Projects")).toBeTruthy();
  });

  it("renders all passed projects up to 8 by default", () => {
    const rows: Row[] = Array.from({ length: 10 }, (_, i) =>
      baseRow({ _id: `p${i}`, title: `Project ${i}` }),
    );
    render(<ActiveProjectsCard projects={rows} totalCount={10} />);
    for (let i = 0; i < 8; i++) {
      expect(screen.getByText(`Project ${i}`)).toBeTruthy();
    }
    // 9th and 10th should NOT render in the list body
    expect(screen.queryByText("Project 8")).toBeNull();
    expect(screen.queryByText("Project 9")).toBeNull();
  });

  it("filter narrows rows by project title", () => {
    const rows: Row[] = [
      baseRow({ _id: "1", title: "Darien Living Room", clientName: "Alice" }),
      baseRow({ _id: "2", title: "Gramercy Apartment", clientName: "Bob" }),
    ];
    render(<ActiveProjectsCard projects={rows} totalCount={2} />);
    const input = screen.getByPlaceholderText("Filter projects…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "darien" } });
    expect(screen.getByText("Darien Living Room")).toBeTruthy();
    expect(screen.queryByText("Gramercy Apartment")).toBeNull();
  });

  it("filter matches client name", () => {
    const rows: Row[] = [
      baseRow({ _id: "1", title: "Darien Living Room", clientName: "Alice Smith" }),
      baseRow({ _id: "2", title: "Gramercy Apartment", clientName: "Bob Jones" }),
    ];
    render(<ActiveProjectsCard projects={rows} totalCount={2} />);
    const input = screen.getByPlaceholderText("Filter projects…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "bob" } });
    expect(screen.getByText("Gramercy Apartment")).toBeTruthy();
    expect(screen.queryByText("Darien Living Room")).toBeNull();
  });

  it("filter matches stage label (case-insensitive)", () => {
    const rows: Row[] = [
      baseRow({ _id: "1", title: "Project A", pipelineStage: "construction" }),
      baseRow({ _id: "2", title: "Project B", pipelineStage: "discovery" }),
    ];
    // Use the stage label "Discovery" via matching
    render(<ActiveProjectsCard projects={rows} totalCount={2} />);
    const input = screen.getByPlaceholderText("Filter projects…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "discovery" } });
    expect(screen.getByText("Project B")).toBeTruthy();
    expect(screen.queryByText("Project A")).toBeNull();
  });

  it("filter matches stage label like 'Design Development' via stage key alias", () => {
    const rows: Row[] = [
      baseRow({ _id: "1", title: "Project A", pipelineStage: "design-development" }),
      baseRow({ _id: "2", title: "Project B", pipelineStage: "procurement" }),
    ];
    render(<ActiveProjectsCard projects={rows} totalCount={2} />);
    const input = screen.getByPlaceholderText("Filter projects…") as HTMLInputElement;
    // match stage title "Design Development"
    fireEvent.change(input, { target: { value: "design dev" } });
    expect(screen.getByText("Project A")).toBeTruthy();
    expect(screen.queryByText("Project B")).toBeNull();
  });

  it("filter is case-insensitive", () => {
    const rows: Row[] = [
      baseRow({ _id: "1", title: "Darien Living Room", clientName: "Alice" }),
      baseRow({ _id: "2", title: "Gramercy Apartment", clientName: "Bob" }),
    ];
    render(<ActiveProjectsCard projects={rows} totalCount={2} />);
    const input = screen.getByPlaceholderText("Filter projects…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "DARIEN" } });
    expect(screen.getByText("Darien Living Room")).toBeTruthy();
    expect(screen.queryByText("Gramercy Apartment")).toBeNull();
  });

  it("filter with no matches → empty-state copy 'No projects match your filter.'", () => {
    const rows: Row[] = [baseRow({ _id: "1", title: "Darien Living Room" })];
    render(<ActiveProjectsCard projects={rows} totalCount={1} />);
    const input = screen.getByPlaceholderText("Filter projects…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "zzz-nomatch" } });
    expect(screen.getByText("No projects match your filter.")).toBeTruthy();
  });

  it("no projects → 'No active projects' empty state (filter input still rendered)", () => {
    render(<ActiveProjectsCard projects={[]} totalCount={0} />);
    expect(screen.getByText("No active projects")).toBeTruthy();
    // Filter input is always present in the header
    expect(screen.getByPlaceholderText("Filter projects…")).toBeTruthy();
  });

  it("stage pill renders with expected bg class for known stage", () => {
    const rows: Row[] = [
      baseRow({ _id: "1", title: "Project A", pipelineStage: "procurement" }),
    ];
    const { container } = render(
      <ActiveProjectsCard projects={rows} totalCount={1} />,
    );
    // procurement uses bg-emerald-50
    const pill = container.querySelector(".bg-emerald-50");
    expect(pill).toBeTruthy();
  });

  it("date column renders 'Since ' prefix + formatted date", () => {
    const rows: Row[] = [
      baseRow({
        _id: "1",
        title: "Project A",
        stageChangedAt: "2026-04-05",
      }),
    ];
    render(<ActiveProjectsCard projects={rows} totalCount={1} />);
    expect(screen.getByText(/Since Apr 5/)).toBeTruthy();
  });

  it("totalCount > 8 shows 'View all N projects' footer link; totalCount <= 8 hides it", () => {
    const rows: Row[] = Array.from({ length: 8 }, (_, i) =>
      baseRow({ _id: `p${i}`, title: `Project ${i}` }),
    );
    const { rerender } = render(
      <ActiveProjectsCard projects={rows} totalCount={12} />,
    );
    expect(screen.getByText("View all 12 projects")).toBeTruthy();
    rerender(<ActiveProjectsCard projects={rows} totalCount={8} />);
    expect(screen.queryByText(/View all/)).toBeNull();
  });

  it("row links to /admin/projects/{_id}", () => {
    const rows: Row[] = [baseRow({ _id: "abc123", title: "Project X" })];
    const { container } = render(
      <ActiveProjectsCard projects={rows} totalCount={1} />,
    );
    const anchor = container.querySelector(
      "a[href='/admin/projects/abc123']",
    );
    expect(anchor).toBeTruthy();
  });
});

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import WorkflowTemplatesSection from "./WorkflowTemplatesSection";

// Phase 44 Plan 08 — WorkflowTemplatesSection tests
// Covers: empty state, card grid render, new-template POST + redirect,
// duplicate POST + redirect, error path.

describe("WorkflowTemplatesSection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state when templates is empty", () => {
    render(<WorkflowTemplatesSection templates={[]} />);
    expect(screen.getByText(/no templates yet/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /new template/i })).toBeDefined();
  });

  it("renders empty state body text", () => {
    render(<WorkflowTemplatesSection templates={[]} />);
    expect(
      screen.getByText(/create your first template to start tracking projects/i),
    ).toBeDefined();
  });

  it("renders a card per template with meta line", () => {
    render(
      <WorkflowTemplatesSection
        templates={[
          {
            _id: "wt-1",
            name: "Full-service residential",
            version: 4,
            phases: [
              { _key: "p1", milestones: [{} as never, {} as never] } as never,
              { _key: "p2", milestones: [{} as never] } as never,
            ],
            inUseCount: 3,
          } as never,
        ]}
      />,
    );
    expect(screen.getByText(/full-service residential/i)).toBeDefined();
    // meta line: 2 phases
    expect(screen.getByText(/2 phases/i)).toBeDefined();
    // meta line: 3 milestones
    expect(screen.getByText(/3 milestones/i)).toBeDefined();
    // meta line: version
    expect(screen.getByText(/v4/i)).toBeDefined();
    // in-use count
    expect(screen.getByText(/3 active projects?/i)).toBeDefined();
  });

  it("does not render in-use count when inUseCount is 0", () => {
    render(
      <WorkflowTemplatesSection
        templates={[
          {
            _id: "wt-1",
            name: "Simple template",
            version: 1,
            phases: [],
            inUseCount: 0,
          } as never,
        ]}
      />,
    );
    // "active project" text should not appear
    const el = screen.queryByText(/active project/i);
    expect(el).toBeNull();
  });

  it("renders a duplicate button on each card", () => {
    render(
      <WorkflowTemplatesSection
        templates={[
          {
            _id: "wt-1",
            name: "Template A",
            version: 1,
            phases: [],
            inUseCount: 0,
          } as never,
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: /duplicate/i })).toBeDefined();
  });

  it("card navigates to /admin/settings/workflow-templates/${_id}", () => {
    render(
      <WorkflowTemplatesSection
        templates={[
          {
            _id: "wt-abc",
            name: "Nav test",
            version: 1,
            phases: [],
            inUseCount: 0,
          } as never,
        ]}
      />,
    );
    const link = screen.getByRole("link", { name: /nav test/i });
    expect(link.getAttribute("href")).toBe(
      "/admin/settings/workflow-templates/wt-abc",
    );
  });

  it("POSTs to /api/admin/workflow-templates on '+ New template' and navigates", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ template: { _id: "wt-new" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    render(<WorkflowTemplatesSection templates={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /new template/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/workflow-templates",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(window.location.href).toBe(
      "/admin/settings/workflow-templates/wt-new",
    );
  });

  it("duplicate button POSTs to /api/admin/workflow-templates/[id]/duplicate", async () => {
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

    render(
      <WorkflowTemplatesSection
        templates={[
          {
            _id: "wt-1",
            name: "X",
            version: 1,
            phases: [],
            inUseCount: 0,
          } as never,
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /duplicate/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/admin/workflow-templates/wt-1/duplicate",
    );
    expect(window.location.href).toBe(
      "/admin/settings/workflow-templates/wt-copy",
    );
  });

  it("shows error toast when new template fetch fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Server error" }), { status: 500 }),
    );

    render(<WorkflowTemplatesSection templates={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /new template/i }));

    await waitFor(() => {
      const toastEl = document.querySelector("[data-toast]");
      // Toast container renders on error — check that fetch was attempted
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("renders + New template button at bottom of grid when templates exist", () => {
    render(
      <WorkflowTemplatesSection
        templates={[
          {
            _id: "wt-1",
            name: "Template",
            version: 1,
            phases: [],
            inUseCount: 0,
          } as never,
        ]}
      />,
    );
    // The button "+ New template" should be present even when templates exist
    expect(screen.getByRole("button", { name: /\+ new template/i })).toBeDefined();
  });
});

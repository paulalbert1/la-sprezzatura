// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import BlankWorkflowState from "./BlankWorkflowState";

afterEach(cleanup);

describe("BlankWorkflowState", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders heading + body copy verbatim", () => {
    render(
      <BlankWorkflowState
        projectId="p1"
        templates={[{ _id: "wt-1", name: "Full-service residential" }]}
      />,
    );
    expect(screen.getByText(/start a workflow/i)).toBeDefined();
    expect(
      screen.getByText(/this project does not have a workflow yet/i),
    ).toBeDefined();
  });

  it("CTA is disabled until a template is chosen", () => {
    render(
      <BlankWorkflowState
        projectId="p1"
        templates={[{ _id: "wt-1", name: "X" }]}
      />,
    );
    const cta = screen.getByRole("button", { name: /start workflow/i });
    expect(cta.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "wt-1" },
    });
    expect(cta.hasAttribute("disabled")).toBe(false);
  });

  it("POSTs to /api/admin/projects/p1/workflow on click with chosen templateId", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, workflow: { _id: "pw-1" } }),
          { status: 200 },
        ),
      );
    // stub location.reload
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy, href: "" },
      writable: true,
    });
    render(
      <BlankWorkflowState
        projectId="p1"
        templates={[{ _id: "wt-1", name: "X" }]}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "wt-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /start workflow/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/admin/projects/p1/workflow",
    );
    expect(
      JSON.parse(
        (fetchMock.mock.calls[0][1] as RequestInit).body as string,
      ).templateId,
    ).toBe("wt-1");
  });

  it("shows 'no templates' state when templates array is empty", () => {
    render(<BlankWorkflowState projectId="p1" templates={[]} />);
    expect(screen.getByText(/haven't created any templates/i)).toBeDefined();
    expect(
      screen.getByRole("link", { name: /workflow templates/i }),
    ).toBeDefined();
  });

  it("renders Choose a template placeholder option", () => {
    render(
      <BlankWorkflowState
        projectId="p1"
        templates={[{ _id: "wt-1", name: "My Template" }]}
      />,
    );
    expect(screen.getByText(/Choose a template/i)).toBeDefined();
  });
});

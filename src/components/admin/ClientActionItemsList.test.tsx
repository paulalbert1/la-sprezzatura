// @vitest-environment jsdom
// src/components/admin/ClientActionItemsList.test.tsx
// Phase 35 Plan 05 Task 3 — DASH-20/21/22 on the client Tasks card.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ClientActionItemsList from "./ClientActionItemsList";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.restoreAllMocks();
  (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, itemKey: "k-new" }),
    });
});

function makeItems(opts: { active: number; completed: number }) {
  const items: Array<{
    _key: string;
    description: string;
    dueDate: string | null;
    completed: boolean;
    completedAt: string | null;
    createdAt: string;
  }> = [];
  for (let i = 0; i < opts.active; i++) {
    items.push({
      _key: `a-${i}`,
      description: `Active item ${i}`,
      dueDate: "2026-05-15",
      completed: false,
      completedAt: null,
      createdAt: "2026-04-01T00:00:00.000Z",
    });
  }
  for (let i = 0; i < opts.completed; i++) {
    items.push({
      _key: `c-${i}`,
      description: `Completed item ${i}`,
      dueDate: null,
      completed: true,
      completedAt: "2026-04-10T00:00:00.000Z",
      createdAt: "2026-04-01T00:00:00.000Z",
    });
  }
  return items;
}

describe("ClientActionItemsList (Phase 35 Plan 05 Task 3)", () => {
  it("renders `+ Add task` outline button in the card header", () => {
    render(
      <ClientActionItemsList
        items={makeItems({ active: 1, completed: 0 })}
        projectId="proj-1"
      />,
    );
    const btn = screen.getByRole("button", { name: /add task/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toMatch(/border-terracotta/);
  });

  it("hides completed items by default", () => {
    render(
      <ClientActionItemsList
        items={makeItems({ active: 2, completed: 2 })}
        projectId="proj-1"
      />,
    );
    expect(screen.getByText("Active item 0")).toBeInTheDocument();
    expect(screen.getByText("Active item 1")).toBeInTheDocument();
    expect(screen.queryByText("Completed item 0")).toBeNull();
    expect(screen.queryByText("Completed item 1")).toBeNull();
  });

  it("renders `Show completed (N)` when completed items exist", () => {
    render(
      <ClientActionItemsList
        items={makeItems({ active: 1, completed: 3 })}
        projectId="proj-1"
      />,
    );
    expect(screen.getByText(/show completed \(3\)/i)).toBeInTheDocument();
  });

  it("clicking the reveal shows completed rows and swaps to `Hide completed`", () => {
    render(
      <ClientActionItemsList
        items={makeItems({ active: 1, completed: 2 })}
        projectId="proj-1"
      />,
    );
    const reveal = screen.getByRole("button", { name: /show completed \(2\)/i });
    fireEvent.click(reveal);
    expect(screen.getByText("Completed item 0")).toBeInTheDocument();
    expect(screen.getByText("Completed item 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hide completed/i }),
    ).toBeInTheDocument();
  });

  it("renders no reveal link when zero completed items exist", () => {
    render(
      <ClientActionItemsList
        items={makeItems({ active: 3, completed: 0 })}
        projectId="proj-1"
      />,
    );
    expect(screen.queryByText(/show completed/i)).toBeNull();
    expect(screen.queryByText(/hide completed/i)).toBeNull();
  });

  it("clicking the header `+ Add task` button focuses the quick-add input", () => {
    render(
      <ClientActionItemsList
        items={makeItems({ active: 1, completed: 0 })}
        projectId="proj-1"
      />,
    );
    const btn = screen.getByRole("button", { name: /add task/i });
    const input = screen.getByPlaceholderText(
      /add an? (action )?(task|item)/i,
    ) as HTMLInputElement;
    fireEvent.click(btn);
    expect(document.activeElement).toBe(input);
  });
});

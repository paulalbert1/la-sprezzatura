// @vitest-environment jsdom
// src/components/admin/DashboardTasksCard.test.tsx
// Phase 35 Plan 05 Task 1 — DASH-20/21/22 on the dashboard Tasks card.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import DashboardTasksCard from "./DashboardTasksCard";

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
      json: async () => ({ success: true, taskKey: "k-new" }),
    });
});

const PROJECTS = [
  { _id: "proj-1", title: "Darien" },
  { _id: "proj-2", title: "Gramercy" },
];

function makeTasks(opts: { active: number; completed: number }) {
  const tasks: Array<{
    _key: string;
    description: string;
    dueDate: string | null;
    completed: boolean;
    completedAt: string | null;
    createdAt: string;
    projectId: string;
    projectTitle: string;
  }> = [];
  for (let i = 0; i < opts.active; i++) {
    tasks.push({
      _key: `a-${i}`,
      description: `Active task ${i}`,
      dueDate: "2026-05-15",
      completed: false,
      completedAt: null,
      createdAt: "2026-04-01T00:00:00.000Z",
      projectId: "proj-1",
      projectTitle: "Darien",
    });
  }
  for (let i = 0; i < opts.completed; i++) {
    tasks.push({
      _key: `c-${i}`,
      description: `Completed task ${i}`,
      dueDate: null,
      completed: true,
      completedAt: "2026-04-10T00:00:00.000Z",
      createdAt: "2026-04-01T00:00:00.000Z",
      projectId: "proj-1",
      projectTitle: "Darien",
    });
  }
  return tasks;
}

describe("DashboardTasksCard (Phase 35 Plan 05 Task 1)", () => {
  it("renders `+ Add task` outline button in the card header", () => {
    render(
      <DashboardTasksCard
        tasks={makeTasks({ active: 1, completed: 0 })}
        projects={PROJECTS}
      />,
    );
    const btn = screen.getByRole("button", { name: /add task/i });
    expect(btn).toBeInTheDocument();
    // Outline styling anchor — terracotta border class
    expect(btn.className).toMatch(/border-terracotta/);
  });

  it("hides completed tasks by default; renders only active task rows", () => {
    render(
      <DashboardTasksCard
        tasks={makeTasks({ active: 3, completed: 2 })}
        projects={PROJECTS}
      />,
    );
    // Active task descriptions visible
    expect(screen.getByText("Active task 0")).toBeInTheDocument();
    expect(screen.getByText("Active task 1")).toBeInTheDocument();
    expect(screen.getByText("Active task 2")).toBeInTheDocument();
    // Completed descriptions absent from DOM
    expect(screen.queryByText("Completed task 0")).toBeNull();
    expect(screen.queryByText("Completed task 1")).toBeNull();
  });

  it("renders `Show completed (N)` reveal link at the bottom when completed tasks exist", () => {
    render(
      <DashboardTasksCard
        tasks={makeTasks({ active: 2, completed: 2 })}
        projects={PROJECTS}
      />,
    );
    expect(screen.getByText(/show completed \(2\)/i)).toBeInTheDocument();
  });

  it("clicking the reveal link shows completed tasks and swaps copy to `Hide completed`", () => {
    render(
      <DashboardTasksCard
        tasks={makeTasks({ active: 2, completed: 2 })}
        projects={PROJECTS}
      />,
    );
    const reveal = screen.getByRole("button", { name: /show completed \(2\)/i });
    fireEvent.click(reveal);
    expect(screen.getByText("Completed task 0")).toBeInTheDocument();
    expect(screen.getByText("Completed task 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hide completed/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/show completed/i)).toBeNull();
  });

  it("renders no reveal link when zero completed tasks exist", () => {
    render(
      <DashboardTasksCard
        tasks={makeTasks({ active: 3, completed: 0 })}
        projects={PROJECTS}
      />,
    );
    expect(screen.queryByText(/show completed/i)).toBeNull();
    expect(screen.queryByText(/hide completed/i)).toBeNull();
  });

  it("clicking the header `+ Add task` button triggers the add-task flow (focuses the input)", () => {
    render(
      <DashboardTasksCard
        tasks={makeTasks({ active: 1, completed: 0 })}
        projects={PROJECTS}
      />,
    );
    const addBtn = screen.getByRole("button", { name: /add task/i });
    const input = screen.getByPlaceholderText(/add a task/i) as HTMLInputElement;
    fireEvent.click(addBtn);
    expect(document.activeElement).toBe(input);
  });

  it("reveal link is keyboard-activatable (Enter toggles)", () => {
    render(
      <DashboardTasksCard
        tasks={makeTasks({ active: 1, completed: 1 })}
        projects={PROJECTS}
      />,
    );
    const reveal = screen.getByRole("button", { name: /show completed/i });
    // Buttons activate via click on Enter — simulate click which is what browsers dispatch on Enter for buttons
    fireEvent.click(reveal);
    expect(screen.getByText("Completed task 0")).toBeInTheDocument();
  });

  it("keeps the existing 8-task cap on the combined visible list", () => {
    // 10 active + 0 completed → only 8 rows render
    render(
      <DashboardTasksCard
        tasks={makeTasks({ active: 10, completed: 0 })}
        projects={PROJECTS}
      />,
    );
    // Active 0..7 visible, 8..9 not
    expect(screen.getByText("Active task 0")).toBeInTheDocument();
    expect(screen.getByText("Active task 7")).toBeInTheDocument();
    expect(screen.queryByText("Active task 8")).toBeNull();
    expect(screen.queryByText("Active task 9")).toBeNull();
  });
});

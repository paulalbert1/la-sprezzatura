import { describe, it, expect } from "vitest";
import { computeSmartScrollTarget } from "./ganttScroll";
import type { GanttTask } from "./ganttTypes";

/** Helper: create a minimal GanttTask with required fields */
function makeTask(
  id: string,
  start: Date,
  end: Date | null = null,
): GanttTask {
  return {
    id,
    text: `Task ${id}`,
    start,
    end,
    type: "task",
    parent: null,
    open: true,
    progress: 0,
    _category: "contractor",
  };
}

describe("computeSmartScrollTarget", () => {
  it("returns index of first task whose end >= now when now is before all tasks (upcoming tasks exist)", () => {
    const tasks = [
      makeTask("a", new Date("2026-06-01"), new Date("2026-06-10")),
      makeTask("b", new Date("2026-07-01"), new Date("2026-07-15")),
    ];
    const now = new Date("2026-05-01"); // Before all tasks
    const result = computeSmartScrollTarget(tasks, now);
    expect(result).toBe(0); // First task is the nearest upcoming
  });

  it("returns index of first task whose end >= now when now is mid-project (active task)", () => {
    const tasks = [
      makeTask("a", new Date("2026-05-01"), new Date("2026-05-10")),
      makeTask("b", new Date("2026-06-01"), new Date("2026-06-15")),
      makeTask("c", new Date("2026-07-01"), new Date("2026-07-10")),
    ];
    const now = new Date("2026-06-05"); // Mid-project, during task b
    const result = computeSmartScrollTarget(tasks, now);
    expect(result).toBe(1); // Task b is the active task (end >= now)
  });

  it("returns 0 (first task) when now is after all tasks (all in past)", () => {
    const tasks = [
      makeTask("a", new Date("2026-01-01"), new Date("2026-01-10")),
      makeTask("b", new Date("2026-02-01"), new Date("2026-02-15")),
    ];
    const now = new Date("2026-12-01"); // After all tasks
    const result = computeSmartScrollTarget(tasks, now);
    expect(result).toBe(0); // Fallback to first task
  });

  it("returns null when tasks array is empty", () => {
    const result = computeSmartScrollTarget([], new Date("2026-06-01"));
    expect(result).toBeNull();
  });

  it("handles tasks with null end dates by falling back to start date for comparison", () => {
    const tasks = [
      makeTask("a", new Date("2026-05-01"), null), // null end -> uses start
      makeTask("b", new Date("2026-06-01"), new Date("2026-06-15")),
    ];
    const now = new Date("2026-05-15"); // After task a's start, before task b's end
    const result = computeSmartScrollTarget(tasks, now);
    // Task a: end is null, falls back to start (2026-05-01) which is < now
    // Task b: end is 2026-06-15 which is >= now
    expect(result).toBe(1); // Task b is the first whose effective end >= now
  });

  it("sorts tasks by start date internally — input order does not matter", () => {
    const tasks = [
      makeTask("c", new Date("2026-07-01"), new Date("2026-07-10")), // Latest
      makeTask("a", new Date("2026-05-01"), new Date("2026-05-10")), // Earliest
      makeTask("b", new Date("2026-06-01"), new Date("2026-06-15")), // Middle
    ];
    const now = new Date("2026-06-05"); // During task b
    const result = computeSmartScrollTarget(tasks, now);
    // After sorting: [a (idx 0), b (idx 1), c (idx 2)]
    // Task a: end 2026-05-10 < now -> skip
    // Task b: end 2026-06-15 >= now -> return idx 1
    expect(result).toBe(1);
  });
});

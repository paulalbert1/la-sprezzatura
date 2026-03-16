import { describe, it, expect } from "vitest";
import {
  sortMilestones,
  getMilestoneProgress,
  getMilestoneStatus,
  formatRelativeDate,
} from "./milestoneUtils";
import type { Milestone } from "./milestoneUtils";

describe("sortMilestones", () => {
  it("sorts by date ascending, null dates last", () => {
    const milestones: Milestone[] = [
      { _key: "c", name: "C", date: "2025-03-15", completed: false },
      { _key: "a", name: "A", date: null, completed: false },
      { _key: "b", name: "B", date: "2025-01-10", completed: false },
    ];
    const sorted = sortMilestones(milestones);
    expect(sorted.map((m) => m._key)).toEqual(["b", "c", "a"]);
  });
});

describe("getMilestoneProgress", () => {
  it("computes progress for 4 of 7 completed", () => {
    const milestones: Milestone[] = [
      { _key: "1", name: "A", date: null, completed: true },
      { _key: "2", name: "B", date: null, completed: true },
      { _key: "3", name: "C", date: null, completed: true },
      { _key: "4", name: "D", date: null, completed: true },
      { _key: "5", name: "E", date: null, completed: false },
      { _key: "6", name: "F", date: null, completed: false },
      { _key: "7", name: "G", date: null, completed: false },
    ];
    const progress = getMilestoneProgress(milestones);
    expect(progress).toEqual({ total: 7, completed: 4, percent: 57 });
  });

  it("returns zeros for empty milestones", () => {
    const progress = getMilestoneProgress([]);
    expect(progress).toEqual({ total: 0, completed: 0, percent: 0 });
  });
});

describe("getMilestoneStatus", () => {
  it('returns "completed" for completed milestone', () => {
    const milestone: Milestone = {
      _key: "1",
      name: "A",
      date: "2025-01-01",
      completed: true,
    };
    expect(getMilestoneStatus(milestone, false)).toBe("completed");
  });

  it('returns "overdue" for incomplete milestone with past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const milestone: Milestone = {
      _key: "1",
      name: "A",
      date: pastDate.toISOString().split("T")[0],
      completed: false,
    };
    expect(getMilestoneStatus(milestone, false)).toBe("overdue");
  });

  it('returns "current" for the first incomplete milestone', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const milestone: Milestone = {
      _key: "1",
      name: "A",
      date: futureDate.toISOString().split("T")[0],
      completed: false,
    };
    expect(getMilestoneStatus(milestone, true)).toBe("current");
  });

  it('returns "upcoming" for incomplete milestones after the first', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    const milestone: Milestone = {
      _key: "1",
      name: "A",
      date: futureDate.toISOString().split("T")[0],
      completed: false,
    };
    expect(getMilestoneStatus(milestone, false)).toBe("upcoming");
  });
});

describe("formatRelativeDate", () => {
  it('returns "in 4 days" for date 4 days in future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 4);
    expect(formatRelativeDate(future.toISOString().split("T")[0])).toBe(
      "in 4 days",
    );
  });

  it('returns "today" for today\'s date', () => {
    const today = new Date();
    expect(formatRelativeDate(today.toISOString().split("T")[0])).toBe(
      "today",
    );
  });

  it('returns "2 days ago" for date 2 days in past', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(formatRelativeDate(past.toISOString().split("T")[0])).toBe(
      "2 days ago",
    );
  });
});

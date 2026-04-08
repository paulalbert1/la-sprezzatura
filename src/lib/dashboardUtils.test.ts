import { describe, it, expect } from "vitest";
import { subDays, addDays } from "date-fns";
import {
  isTaskOverdue,
  isMilestoneOverdue,
  getDaysInStage,
  getOverdueBannerData,
} from "./dashboardUtils";

describe("isTaskOverdue", () => {
  it("returns false for task with no dueDate", () => {
    expect(isTaskOverdue({ completed: false })).toBe(false);
    expect(isTaskOverdue({ dueDate: null, completed: false })).toBe(false);
  });

  it("returns false for completed task with past dueDate", () => {
    const pastDate = subDays(new Date(), 5).toISOString().split("T")[0];
    expect(isTaskOverdue({ dueDate: pastDate, completed: true })).toBe(false);
  });

  it("returns true for uncompleted task with dueDate yesterday", () => {
    const yesterday = subDays(new Date(), 1).toISOString().split("T")[0];
    expect(isTaskOverdue({ dueDate: yesterday, completed: false })).toBe(true);
  });

  it("returns false for uncompleted task with dueDate tomorrow", () => {
    const tomorrow = addDays(new Date(), 1).toISOString().split("T")[0];
    expect(isTaskOverdue({ dueDate: tomorrow, completed: false })).toBe(false);
  });

  it("returns false for uncompleted task with dueDate undefined", () => {
    expect(isTaskOverdue({ dueDate: undefined })).toBe(false);
  });
});

describe("isMilestoneOverdue", () => {
  it("returns false for completed milestone with past date", () => {
    const pastDate = subDays(new Date(), 3).toISOString().split("T")[0];
    expect(isMilestoneOverdue({ date: pastDate, completed: true })).toBe(false);
  });

  it("returns true for uncompleted milestone with past date", () => {
    const pastDate = subDays(new Date(), 3).toISOString().split("T")[0];
    expect(isMilestoneOverdue({ date: pastDate, completed: false })).toBe(true);
  });

  it("returns false for milestone with no date", () => {
    expect(isMilestoneOverdue({ completed: false })).toBe(false);
    expect(isMilestoneOverdue({ date: null, completed: false })).toBe(false);
  });

  it("returns false for uncompleted milestone with future date", () => {
    const futureDate = addDays(new Date(), 10).toISOString().split("T")[0];
    expect(isMilestoneOverdue({ date: futureDate, completed: false })).toBe(false);
  });
});

describe("getDaysInStage", () => {
  it("returns 0 for null input", () => {
    expect(getDaysInStage(null)).toBe(0);
  });

  it("returns 0 for undefined input", () => {
    expect(getDaysInStage(undefined)).toBe(0);
  });

  it("returns positive number for date 5 days ago", () => {
    const fiveDaysAgo = subDays(new Date(), 5).toISOString();
    const result = getDaysInStage(fiveDaysAgo);
    expect(result).toBeGreaterThanOrEqual(4);
    expect(result).toBeLessThanOrEqual(6);
  });

  it("returns 0 for today", () => {
    const today = new Date().toISOString();
    expect(getDaysInStage(today)).toBe(0);
  });
});

describe("getOverdueBannerData", () => {
  it("returns all zeros when no items are overdue", () => {
    const futureMilestone = { date: addDays(new Date(), 5).toISOString().split("T")[0], completed: false };
    const completedTask = { dueDate: subDays(new Date(), 2).toISOString().split("T")[0], completed: true };
    const result = getOverdueBannerData([futureMilestone], [completedTask]);
    expect(result).toEqual({ total: 0, milestoneCount: 0, taskCount: 0 });
  });

  it("returns correct counts when both milestones and tasks are overdue", () => {
    const pastDate = subDays(new Date(), 3).toISOString().split("T")[0];
    const overdueMilestone1 = { date: pastDate, completed: false };
    const overdueMilestone2 = { date: pastDate, completed: false };
    const overdueTask = { dueDate: pastDate, completed: false };
    const result = getOverdueBannerData(
      [overdueMilestone1, overdueMilestone2],
      [overdueTask],
    );
    expect(result).toEqual({ total: 3, milestoneCount: 2, taskCount: 1 });
  });

  it("returns { total: 0, milestoneCount: 0, taskCount: 0 } for empty arrays", () => {
    const result = getOverdueBannerData([], []);
    expect(result).toEqual({ total: 0, milestoneCount: 0, taskCount: 0 });
  });

  it("counts only overdue items among mixed data", () => {
    const pastDate = subDays(new Date(), 2).toISOString().split("T")[0];
    const futureDate = addDays(new Date(), 5).toISOString().split("T")[0];
    const milestones = [
      { date: pastDate, completed: false },   // overdue
      { date: pastDate, completed: true },    // not overdue (completed)
      { date: futureDate, completed: false }, // not overdue (future)
    ];
    const tasks = [
      { dueDate: pastDate, completed: false },  // overdue
      { dueDate: futureDate, completed: false }, // not overdue (future)
    ];
    const result = getOverdueBannerData(milestones, tasks);
    expect(result).toEqual({ total: 2, milestoneCount: 1, taskCount: 1 });
  });
});

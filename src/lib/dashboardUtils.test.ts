import { describe, it, expect } from "vitest";
import { subDays, addDays } from "date-fns";
import {
  isTaskOverdue,
  isMilestoneOverdue,
  getDaysInStage,
  getOverdueBannerData,
  isProcurementOverdue,
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
    expect(result.total).toBe(0);
    expect(result.milestoneCount).toBe(0);
    expect(result.taskCount).toBe(0);
    expect(result.firstMilestone).toBeNull();
    expect(result.firstTask).toBeNull();
  });

  it("returns correct counts when both milestones and tasks are overdue", () => {
    const pastDate = subDays(new Date(), 3).toISOString().split("T")[0];
    const overdueMilestone1 = { date: pastDate, completed: false, name: "M1", projectTitle: "P1" };
    const overdueMilestone2 = { date: pastDate, completed: false, name: "M2", projectTitle: "P1" };
    const overdueTask = { dueDate: pastDate, completed: false, description: "T1", projectTitle: "P2" };
    const result = getOverdueBannerData(
      [overdueMilestone1, overdueMilestone2],
      [overdueTask],
    );
    expect(result.total).toBe(3);
    expect(result.milestoneCount).toBe(2);
    expect(result.taskCount).toBe(1);
    expect(result.firstMilestone?.name).toBe("M1");
    expect(result.firstTask?.description).toBe("T1");
    expect(result.projectCount).toBe(2);
  });

  it("returns zeros for empty arrays", () => {
    const result = getOverdueBannerData([], []);
    expect(result.total).toBe(0);
    expect(result.milestoneCount).toBe(0);
    expect(result.taskCount).toBe(0);
    expect(result.projectCount).toBe(0);
  });

  it("counts only overdue items among mixed data", () => {
    const pastDate = subDays(new Date(), 2).toISOString().split("T")[0];
    const futureDate = addDays(new Date(), 5).toISOString().split("T")[0];
    const milestones = [
      { date: pastDate, completed: false, name: "M1", projectTitle: "P1" },
      { date: pastDate, completed: true, name: "M2", projectTitle: "P1" },
      { date: futureDate, completed: false, name: "M3", projectTitle: "P2" },
    ];
    const tasks = [
      { dueDate: pastDate, completed: false, description: "T1", projectTitle: "P1" },
      { dueDate: futureDate, completed: false, description: "T2", projectTitle: "P2" },
    ];
    const result = getOverdueBannerData(milestones, tasks);
    expect(result.total).toBe(2);
    expect(result.milestoneCount).toBe(1);
    expect(result.taskCount).toBe(1);
    expect(result.projectCount).toBe(1);
  });
});

describe("isProcurementOverdue", () => {
  it("returns true when expectedDeliveryDate is past and status is ordered", () => {
    const pastDate = subDays(new Date(), 3).toISOString().split("T")[0];
    expect(isProcurementOverdue({ expectedDeliveryDate: pastDate, status: "ordered" })).toBe(true);
  });

  it("returns true when expectedDeliveryDate is past and status is warehouse", () => {
    const pastDate = subDays(new Date(), 3).toISOString().split("T")[0];
    expect(isProcurementOverdue({ expectedDeliveryDate: pastDate, status: "warehouse" })).toBe(true);
  });

  it("returns true when expectedDeliveryDate is past and status is in-transit", () => {
    const pastDate = subDays(new Date(), 3).toISOString().split("T")[0];
    expect(isProcurementOverdue({ expectedDeliveryDate: pastDate, status: "in-transit" })).toBe(true);
  });

  it("returns true when expectedDeliveryDate is past and status is pending", () => {
    const pastDate = subDays(new Date(), 3).toISOString().split("T")[0];
    expect(isProcurementOverdue({ expectedDeliveryDate: pastDate, status: "pending" })).toBe(true);
  });

  it("returns false when status is delivered even if date is past", () => {
    const pastDate = subDays(new Date(), 5).toISOString().split("T")[0];
    expect(isProcurementOverdue({ expectedDeliveryDate: pastDate, status: "delivered" })).toBe(false);
  });

  it("returns false when status is installed even if date is past", () => {
    const pastDate = subDays(new Date(), 5).toISOString().split("T")[0];
    expect(isProcurementOverdue({ expectedDeliveryDate: pastDate, status: "installed" })).toBe(false);
  });

  it("returns false when expectedDeliveryDate is null", () => {
    expect(isProcurementOverdue({ expectedDeliveryDate: null, status: "ordered" })).toBe(false);
  });

  it("returns false when expectedDeliveryDate is in the future", () => {
    const futureDate = addDays(new Date(), 10).toISOString().split("T")[0];
    expect(isProcurementOverdue({ expectedDeliveryDate: futureDate, status: "ordered" })).toBe(false);
  });

  it("returns false when expectedDeliveryDate is undefined", () => {
    expect(isProcurementOverdue({ status: "ordered" })).toBe(false);
  });
});

// Phase 37: getNetPrice removed (D-13) -- no price data remains in the app.

import { describe, it, expect } from "vitest";
import {
  isProjectVisible,
  isProjectCompleted,
  isProjectReopened,
} from "./projectVisibility";

describe("isProjectVisible", () => {
  it("returns true for project with no completedAt (active)", () => {
    expect(isProjectVisible({})).toBe(true);
    expect(isProjectVisible({ completedAt: null })).toBe(true);
  });

  it("returns true for project completed 10 days ago (within warranty window)", () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    expect(
      isProjectVisible({ completedAt: tenDaysAgo.toISOString() }),
    ).toBe(true);
  });

  it("returns true for project completed 31 days ago (still within 365d warranty window)", () => {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    expect(
      isProjectVisible({
        completedAt: thirtyOneDaysAgo.toISOString(),
        projectStatus: "completed",
      }),
    ).toBe(true);
  });

  it("returns false for project completed 366 days ago (past 365d warranty window)", () => {
    const past = new Date();
    past.setDate(past.getDate() - 366);
    expect(
      isProjectVisible({
        completedAt: past.toISOString(),
        projectStatus: "completed",
      }),
    ).toBe(false);
  });

  it("returns true for project completed 400 days ago but reopened (overrides warranty window)", () => {
    const past = new Date();
    past.setDate(past.getDate() - 400);
    expect(
      isProjectVisible({
        completedAt: past.toISOString(),
        projectStatus: "reopened",
      }),
    ).toBe(true);
  });
});

describe("isProjectCompleted", () => {
  it('returns true when projectStatus is "completed"', () => {
    expect(isProjectCompleted({ projectStatus: "completed" })).toBe(true);
  });

  it('returns false when projectStatus is "active"', () => {
    expect(isProjectCompleted({ projectStatus: "active" })).toBe(false);
  });
});

describe("isProjectReopened", () => {
  it('returns true when projectStatus is "reopened"', () => {
    expect(isProjectReopened({ projectStatus: "reopened" })).toBe(true);
  });
});

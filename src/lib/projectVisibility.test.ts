import { describe, it, expect } from "vitest";
import {
  isProjectVisible,
  isProjectCompleted,
  isProjectReopened,
  getProjectAccessState,
} from "./projectVisibility";

describe("isProjectVisible", () => {
  it("returns true for project with no completedAt (active)", () => {
    expect(isProjectVisible({})).toBe(true);
    expect(isProjectVisible({ completedAt: null })).toBe(true);
  });

  it("returns true for project completed 10 days ago (within 30d window)", () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    expect(
      isProjectVisible({ completedAt: tenDaysAgo.toISOString() }),
    ).toBe(true);
  });

  it("returns false for project completed 31 days ago (past 30d window)", () => {
    const past = new Date();
    past.setDate(past.getDate() - 31);
    expect(
      isProjectVisible({
        completedAt: past.toISOString(),
        projectStatus: "completed",
      }),
    ).toBe(false);
  });

  it("returns true for project completed 60 days ago but reopened (overrides 30d window)", () => {
    const past = new Date();
    past.setDate(past.getDate() - 60);
    expect(
      isProjectVisible({
        completedAt: past.toISOString(),
        projectStatus: "reopened",
      }),
    ).toBe(true);
  });

  // Manual override: clientPortalVisibility = "shown"
  it("returns true for project completed 200 days ago when clientPortalVisibility=shown", () => {
    const past = new Date();
    past.setDate(past.getDate() - 200);
    expect(
      isProjectVisible({
        completedAt: past.toISOString(),
        projectStatus: "completed",
        clientPortalVisibility: "shown",
      }),
    ).toBe(true);
  });

  // Manual override: clientPortalVisibility = "hidden"
  it("returns false for active project when clientPortalVisibility=hidden", () => {
    expect(
      isProjectVisible({
        projectStatus: "active",
        clientPortalVisibility: "hidden",
      }),
    ).toBe(false);
  });

  it("returns false for recently completed project when clientPortalVisibility=hidden", () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    expect(
      isProjectVisible({
        completedAt: tenDaysAgo.toISOString(),
        projectStatus: "completed",
        clientPortalVisibility: "hidden",
      }),
    ).toBe(false);
  });

  // "auto" is the same as unset
  it("treats clientPortalVisibility=auto identically to unset", () => {
    const past = new Date();
    past.setDate(past.getDate() - 31);
    expect(
      isProjectVisible({
        completedAt: past.toISOString(),
        projectStatus: "completed",
        clientPortalVisibility: "auto",
      }),
    ).toBe(false);
  });
});

describe("getProjectAccessState", () => {
  it("returns 'active' for an active project (no completedAt)", () => {
    expect(getProjectAccessState({ projectStatus: "active" })).toBe("active");
  });

  it("returns 'completed-visible' for a project completed 10 days ago", () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    expect(
      getProjectAccessState({
        completedAt: tenDaysAgo.toISOString(),
        projectStatus: "completed",
      }),
    ).toBe("completed-visible");
  });

  it("returns 'expired' for a project completed 60 days ago with auto visibility", () => {
    const past = new Date();
    past.setDate(past.getDate() - 60);
    expect(
      getProjectAccessState({
        completedAt: past.toISOString(),
        projectStatus: "completed",
      }),
    ).toBe("expired");
  });

  it("returns 'completed-visible' for a project completed 200 days ago with override 'shown'", () => {
    const past = new Date();
    past.setDate(past.getDate() - 200);
    expect(
      getProjectAccessState({
        completedAt: past.toISOString(),
        projectStatus: "completed",
        clientPortalVisibility: "shown",
      }),
    ).toBe("completed-visible");
  });

  it("returns 'hidden' for any project with override 'hidden'", () => {
    expect(
      getProjectAccessState({
        projectStatus: "active",
        clientPortalVisibility: "hidden",
      }),
    ).toBe("hidden");
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

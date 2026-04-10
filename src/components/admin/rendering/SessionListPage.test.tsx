import { describe, it, expect } from "vitest";
import {
  filterSessions,
  getOwnerDisplayName,
  resolveEmptyState,
  formatRelativeTime,
} from "./SessionListPage";
import type { RenderingSession } from "../../../lib/rendering/types";

// RNDR-01: Session list with all-tenant sessions + project filter + Mine filter
// Source of truth: 33-02-PLAN.md <tasks> Task 2 behavior table and
// 33-UI-SPEC.md § 2 (SessionList), § 6 (Mine chip), § 7 (ownership stamp)

function makeSession(overrides: Partial<RenderingSession> = {}): RenderingSession {
  return {
    _id: "session-" + Math.random().toString(36).slice(2, 8),
    sessionTitle: "Untitled",
    project: null,
    aspectRatio: "16:9",
    description: "",
    status: "complete",
    createdBy: "me@test.com",
    createdAt: new Date().toISOString(),
    images: [],
    renderings: [],
    conversation: [],
    ...overrides,
  };
}

describe("SessionListPage.filterSessions", () => {
  it("returns all sessions when no project filter and Mine is off", () => {
    const sessions = [
      makeSession({ _id: "a" }),
      makeSession({ _id: "b" }),
    ];
    const result = filterSessions(sessions, "", false, "me@test.com");
    expect(result).toHaveLength(2);
  });

  it("filters by project id when projectFilter is set", () => {
    const sessions = [
      makeSession({ _id: "a", project: { _id: "proj-1", title: "Alpha" } }),
      makeSession({ _id: "b", project: { _id: "proj-2", title: "Beta" } }),
      makeSession({ _id: "c", project: null }),
    ];
    const result = filterSessions(sessions, "proj-1", false, "me@test.com");
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe("a");
  });

  it("filters to only the current user's sessions when isMine is true", () => {
    const sessions = [
      makeSession({ _id: "a", createdBy: "me@test.com" }),
      makeSession({ _id: "b", createdBy: "other@test.com" }),
      makeSession({ _id: "c", createdBy: "me@test.com" }),
    ];
    const result = filterSessions(sessions, "", true, "me@test.com");
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.createdBy === "me@test.com")).toBe(true);
  });

  it("combines project and Mine filters (AND semantics)", () => {
    const sessions = [
      makeSession({
        _id: "a",
        createdBy: "me@test.com",
        project: { _id: "proj-1", title: "A" },
      }),
      makeSession({
        _id: "b",
        createdBy: "other@test.com",
        project: { _id: "proj-1", title: "A" },
      }),
      makeSession({
        _id: "c",
        createdBy: "me@test.com",
        project: { _id: "proj-2", title: "B" },
      }),
    ];
    const result = filterSessions(sessions, "proj-1", true, "me@test.com");
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe("a");
  });

  it("returns empty when Mine is on and no sessions belong to the user", () => {
    const sessions = [
      makeSession({ createdBy: "other@test.com" }),
      makeSession({ createdBy: "another@test.com" }),
    ];
    const result = filterSessions(sessions, "", true, "me@test.com");
    expect(result).toHaveLength(0);
  });
});

describe("SessionListPage.getOwnerDisplayName", () => {
  const tenantAdmins = [
    { email: "liz@lasprezz.com", name: "Elizabeth Olivier", sanityUserId: "liz@lasprezz.com" },
    { email: "paul@lasprezz.com", name: "Paul Albert", sanityUserId: "paul@lasprezz.com" },
  ];

  it("returns 'You' when createdBy matches the current sanityUserId", () => {
    expect(getOwnerDisplayName("liz@lasprezz.com", "liz@lasprezz.com", tenantAdmins)).toBe("You");
  });

  it("returns the admin display name when another designer owns the session", () => {
    expect(getOwnerDisplayName("paul@lasprezz.com", "liz@lasprezz.com", tenantAdmins)).toBe("Paul Albert");
  });

  it("returns 'Unknown designer' when createdBy is not in the tenant admin list", () => {
    expect(getOwnerDisplayName("orphan@example.com", "liz@lasprezz.com", tenantAdmins)).toBe("Unknown designer");
  });
});

describe("SessionListPage.resolveEmptyState", () => {
  it("returns 'no-sessions' when the unfiltered list is empty", () => {
    expect(resolveEmptyState(0, false)).toBe("no-sessions");
  });

  it("returns 'no-mine' when Mine is on and the filtered list is empty", () => {
    expect(resolveEmptyState(0, true)).toBe("no-mine");
  });

  it("returns 'populated' when the filtered list has at least one row", () => {
    expect(resolveEmptyState(3, false)).toBe("populated");
    expect(resolveEmptyState(1, true)).toBe("populated");
  });
});

describe("SessionListPage.formatRelativeTime", () => {
  it("returns 'just now' for a timestamp within the last minute", () => {
    const now = Date.now();
    const iso = new Date(now - 20_000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("just now");
  });

  it("returns minutes-ago for a timestamp under an hour old", () => {
    const now = Date.now();
    const iso = new Date(now - 5 * 60_000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("5m ago");
  });

  it("returns hours-ago for a timestamp under a day old", () => {
    const now = Date.now();
    const iso = new Date(now - 2 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("2h ago");
  });

  it("returns days-ago for a timestamp under a month old", () => {
    const now = Date.now();
    const iso = new Date(now - 3 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("3d ago");
  });
});

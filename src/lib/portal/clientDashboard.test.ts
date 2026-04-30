// src/lib/portal/clientDashboard.test.ts
// Phase 34 Plan 06 — client dashboard resolver tests.
//
// Exercises the pure resolver module extracted from /portal/client/[token].astro.
// The .astro route is not unit-tested (astro check + build covers it); all
// resolution logic lives here so we can mock `sanity:client` cleanly.
//
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md
// D-19 revised; threats T-34-06 (forwarded link), T-34-07 (regen kills session).

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock sanity:client BEFORE importing the module under test so the module's
// top-level import binds to the mock fetch.
const fetchMock = vi.fn();
vi.mock("sanity:client", () => ({
  sanityClient: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

// Mock the queries module so getProjectsByClientId routes through a stub we
// control. The real implementation also calls sanityClient.fetch; we keep it
// separate so fetchMock stays focused on the client-by-token query.
const getProjectsByClientIdMock = vi.fn();
vi.mock("../../sanity/queries", () => ({
  getProjectsByClientId: (...args: unknown[]) => getProjectsByClientIdMock(...args),
}));

// Import AFTER the mocks so the module resolves them at bind time.
import {
  resolveClientByToken,
  getClientDashboardData,
  hashPortalToken,
} from "./clientDashboard";

beforeEach(() => {
  fetchMock.mockReset();
  getProjectsByClientIdMock.mockReset();
});

describe("clientDashboard resolver (Phase 34 Plan 06)", () => {
  it("resolveClientByToken returns client doc when token matches", async () => {
    fetchMock.mockResolvedValueOnce({
      _id: "client-sarah",
      name: "Sarah Smith",
      email: "sarah@example.com",
      portalToken: "tok_valid_1",
    });

    const result = await resolveClientByToken("tok_valid_1");

    expect(result).toEqual({
      _id: "client-sarah",
      name: "Sarah Smith",
      email: "sarah@example.com",
      portalToken: "tok_valid_1",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Query passes the token as a GROQ parameter named `purl` (named away
    // from `token` to sidestep a @sanity/client TS overload-inference quirk
    // — see comment in CLIENT_BY_PORTAL_TOKEN_QUERY).
    const [, params] = fetchMock.mock.calls[0];
    expect(params).toEqual({ purl: "tok_valid_1" });
  });

  it("resolveClientByToken returns null when token does not match", async () => {
    fetchMock.mockResolvedValueOnce(null);

    const result = await resolveClientByToken("tok_nonexistent");

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolveClientByToken returns null when token is empty string", async () => {
    const result = await resolveClientByToken("");

    expect(result).toBeNull();
    // Short-circuit guard: must NOT hit Sanity on empty input.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolveClientByToken returns null when token is undefined", async () => {
    const result = await resolveClientByToken(undefined);

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getClientDashboardData returns { client, projects: [] } for client with zero projects", async () => {
    fetchMock.mockResolvedValueOnce({
      _id: "client-empty",
      name: "Empty Client",
      email: "empty@example.com",
      portalToken: "tok_empty",
    });
    getProjectsByClientIdMock.mockResolvedValueOnce([]);

    const result = await getClientDashboardData("tok_empty");

    expect(result).not.toBeNull();
    expect(result?.client._id).toBe("client-empty");
    expect(result?.projects).toEqual([]);
    expect(getProjectsByClientIdMock).toHaveBeenCalledWith("client-empty");
  });

  it("getClientDashboardData filters projects via isProjectVisible", async () => {
    fetchMock.mockResolvedValueOnce({
      _id: "client-mixed",
      name: "Mixed Client",
      email: "mixed@example.com",
      portalToken: "tok_mixed",
    });

    // Three projects:
    //   - active (no completedAt) → visible
    //   - completed >30 days ago → hidden (past auto-window)
    //   - reopened (overrides auto-window) → visible
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    getProjectsByClientIdMock.mockResolvedValueOnce([
      {
        _id: "proj-active",
        title: "Active",
        pipelineStage: "concept",
        engagementType: "full-interior-design",
        completedAt: null,
        projectStatus: "active",
      },
      {
        _id: "proj-old-done",
        title: "Old Done",
        pipelineStage: "closeout",
        engagementType: "styling-refreshing",
        completedAt: sixtyDaysAgo.toISOString(),
        projectStatus: "completed",
      },
      {
        _id: "proj-reopened",
        title: "Reopened",
        pipelineStage: "installation",
        engagementType: "full-interior-design",
        completedAt: sixtyDaysAgo.toISOString(),
        projectStatus: "reopened",
      },
    ]);

    const result = await getClientDashboardData("tok_mixed");

    expect(result).not.toBeNull();
    expect(result?.projects).toHaveLength(2);
    expect(result?.projects.map((p) => p._id)).toEqual([
      "proj-active",
      "proj-reopened",
    ]);
  });

  it("getClientDashboardData preserves order from PROJECTS_BY_CLIENT_QUERY (pipelineStage asc)", async () => {
    fetchMock.mockResolvedValueOnce({
      _id: "client-ordered",
      name: "Ordered Client",
      email: "ordered@example.com",
      portalToken: "tok_ordered",
    });

    // Query contract: results arrive pre-sorted by pipelineStage ASC.
    // Resolver MUST preserve that order (filter is stable).
    getProjectsByClientIdMock.mockResolvedValueOnce([
      { _id: "a", title: "A", pipelineStage: "concept", engagementType: "full-interior-design", completedAt: null },
      { _id: "b", title: "B", pipelineStage: "design-development", engagementType: "styling-refreshing", completedAt: null },
      { _id: "c", title: "C", pipelineStage: "installation", engagementType: "full-interior-design", completedAt: null },
    ]);

    const result = await getClientDashboardData("tok_ordered");

    expect(result?.projects.map((p) => p._id)).toEqual(["a", "b", "c"]);
  });

  it("getClientDashboardData returns null when client cannot be resolved", async () => {
    fetchMock.mockResolvedValueOnce(null);

    const result = await getClientDashboardData("tok_bogus");

    expect(result).toBeNull();
    // Must short-circuit before fetching projects on null client.
    expect(getProjectsByClientIdMock).not.toHaveBeenCalled();
  });

  it("portalTokenHash is derivable from client.portalToken via hashPortalToken helper", () => {
    // Deterministic: same input → same hash.
    const h1 = hashPortalToken("tok_abcd1234");
    const h2 = hashPortalToken("tok_abcd1234");
    expect(h1).toBe(h2);

    // SHA-256 base64 = 44 chars (for any non-empty input).
    expect(h1).toHaveLength(44);

    // Different input → different hash (collision-resistant in practice).
    const h3 = hashPortalToken("tok_WXYZ9999");
    expect(h3).not.toBe(h1);

    // Token is NOT the hash (one-way).
    expect(h1).not.toBe("tok_abcd1234");
  });
});

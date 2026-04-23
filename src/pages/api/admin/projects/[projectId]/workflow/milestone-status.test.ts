// Phase 44 Plan 05 Task 3 — milestone-status endpoint tests.
// Engine-gated POST: 409 when canTransition blocked, 200 on allowed transition.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const { mockGetSession, mockFetch, mockSet, mockCommit, mockCanTransition } = vi.hoisted(() => {
  const mockCommit = vi.fn().mockResolvedValue({});
  const mockSet = vi.fn(() => ({ commit: mockCommit }));
  return {
    mockGetSession: vi.fn(),
    mockFetch: vi.fn(),
    mockSet,
    mockCommit,
    mockCanTransition: vi.fn(),
  };
});

const mockPatch = vi.fn(() => ({ set: mockSet }));

vi.mock("../../../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({
    fetch: mockFetch,
    patch: mockPatch,
  }),
}));

vi.mock("../../../../../../lib/workflow/engine", () => ({
  canTransition: mockCanTransition,
}));

vi.mock("../../../../../../sanity/queries", () => ({
  PROJECT_WORKFLOW_QUERY: "PROJECT_WORKFLOW_QUERY",
}));

import { POST } from "./milestone-status";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/projects/proj-1/workflow/milestone-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type RouteCtx = {
  request: Request;
  params: Record<string, string | undefined>;
  cookies: AstroCookies;
};

const PROJECT_ID = "proj-1";

// A workflow with one phase + one milestone (for locate-by-id logic)
const PHASE_KEY = "phase-key-1";
const MS_KEY = "ms-key-1";
const WORKFLOW = {
  _id: "wf-1",
  _type: "projectWorkflow",
  status: "active",
  phases: [
    {
      _key: PHASE_KEY,
      id: "design",
      milestones: [
        {
          _key: MS_KEY,
          id: "kickoff",
          status: "not_started",
          startedAt: undefined,
        },
      ],
    },
  ],
};

function adminSession() {
  mockGetSession.mockResolvedValue({
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCommit.mockResolvedValue({});
  // Default: fetch returns workflow on first call, same on second (re-fetch)
  mockFetch.mockResolvedValue(WORKFLOW);
});

describe("POST /workflow/milestone-status", () => {
  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest({ phaseId: "design", milestoneId: "kickoff", target: "in_progress" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when no tenantId", async () => {
    mockGetSession.mockResolvedValue({ entityId: "admin", role: "admin" });
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest({ phaseId: "design", milestoneId: "kickoff", target: "in_progress" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when target is not an allowed status", async () => {
    adminSession();
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest({ phaseId: "design", milestoneId: "kickoff", target: "invalid_status" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when workflow not found", async () => {
    adminSession();
    mockFetch.mockResolvedValue(null);
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest({ phaseId: "design", milestoneId: "kickoff", target: "in_progress" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(404);
  });

  it("returns 409 when engine blocks the transition", async () => {
    adminSession();
    mockFetch.mockResolvedValue(WORKFLOW);
    mockCanTransition.mockReturnValue({ allowed: false, reason: "Blocked by prereqs" });
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest({ phaseId: "design", milestoneId: "kickoff", target: "complete" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Blocked by prereqs");
  });

  it("returns 200 and applies patch on allowed transition", async () => {
    adminSession();
    mockFetch.mockResolvedValue(WORKFLOW);
    mockCanTransition.mockReturnValue({ allowed: true });
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest({ phaseId: "design", milestoneId: "kickoff", target: "in_progress" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith("wf-1");
    expect(mockCommit).toHaveBeenCalledTimes(1);
    const setArg = (mockSet.mock.calls as unknown as [Record<string, unknown>][])[0][0];
    expect(typeof setArg.lastActivityAt).toBe("string");
  });

  it("sets startedAt when transitioning to in_progress for a never-started milestone", async () => {
    adminSession();
    mockFetch.mockResolvedValue(WORKFLOW); // startedAt is undefined on WORKFLOW milestone
    mockCanTransition.mockReturnValue({ allowed: true });
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest({ phaseId: "design", milestoneId: "kickoff", target: "in_progress" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const setArg = (mockSet.mock.calls as unknown as [Record<string, unknown>][])[0][0];
    const startedAtKey = `phases[_key=="${PHASE_KEY}"].milestones[_key=="${MS_KEY}"].startedAt`;
    expect(typeof setArg[startedAtKey]).toBe("string");
  });

  it("uses instanceKey path for sub-row transitions", async () => {
    adminSession();
    mockFetch.mockResolvedValue(WORKFLOW);
    mockCanTransition.mockReturnValue({ allowed: true });
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest({
        phaseId: "design",
        milestoneId: "kickoff",
        target: "in_progress",
        instanceKey: "inst-key-abc",
      }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const setArg = (mockSet.mock.calls as unknown as [Record<string, unknown>][])[0][0];
    const instanceStatusKey = `phases[_key=="${PHASE_KEY}"].milestones[_key=="${MS_KEY}"].instances[_key=="inst-key-abc"].status`;
    expect(setArg[instanceStatusKey]).toBe("in_progress");
  });
});

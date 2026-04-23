// Phase 44 Plan 05 Task 3 — instance endpoint tests.
// POST add ContractorInstance / DELETE remove ContractorInstance.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const {
  mockGetSession,
  mockFetch,
  mockCommit,
  mockSet,
  mockUnset,
  mockSetIfMissing,
  mockAppend,
} = vi.hoisted(() => {
  const mockCommit = vi.fn().mockResolvedValue({});

  // Chain-aware builder for setIfMissing().append().set().commit() and
  // unset().set().commit() patterns used by instance.ts.
  const builder: Record<string, unknown> = {};
  const mockSet = vi.fn().mockImplementation(() => builder);
  const mockUnset = vi.fn().mockImplementation(() => builder);
  const mockSetIfMissing = vi.fn().mockImplementation(() => builder);
  const mockAppend = vi.fn().mockImplementation(() => builder);
  builder.set = mockSet;
  builder.unset = mockUnset;
  builder.setIfMissing = mockSetIfMissing;
  builder.append = mockAppend;
  builder.commit = mockCommit;

  return {
    mockGetSession: vi.fn(),
    mockFetch: vi.fn(),
    mockCommit,
    mockSet,
    mockUnset,
    mockSetIfMissing,
    mockAppend,
  };
});

const mockPatch = vi.fn(() => ({
  set: mockSet,
  unset: mockUnset,
  setIfMissing: mockSetIfMissing,
  append: mockAppend,
}));

vi.mock("../../../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({
    fetch: mockFetch,
    patch: mockPatch,
  }),
}));

vi.mock("../../../../../../sanity/queries", () => ({
  PROJECT_WORKFLOW_QUERY: "PROJECT_WORKFLOW_QUERY",
}));

import { POST, DELETE } from "./instance";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeRequest(method: string, body: unknown): Request {
  return new Request("http://localhost/api/admin/projects/proj-1/workflow/instance", {
    method,
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
const PHASE_KEY = "phase-key-1";
const MS_KEY = "ms-key-1";

const WORKFLOW_MULTI = {
  _id: "wf-1",
  status: "active",
  phases: [
    {
      _key: PHASE_KEY,
      id: "design",
      milestones: [
        {
          _key: MS_KEY,
          id: "permits",
          status: "not_started",
          multiInstance: true,
          instances: [],
        },
      ],
    },
  ],
};

const WORKFLOW_SINGLE = {
  ...WORKFLOW_MULTI,
  phases: [
    {
      _key: PHASE_KEY,
      id: "design",
      milestones: [
        {
          _key: MS_KEY,
          id: "kickoff",
          status: "not_started",
          multiInstance: false,
          instances: [],
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
  mockFetch.mockResolvedValue(WORKFLOW_MULTI);
});

// ===== POST tests =====

describe("POST /workflow/instance (add)", () => {
  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { phaseId: "design", milestoneId: "permits", name: "Sub A" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when milestone.multiInstance is false", async () => {
    adminSession();
    mockFetch.mockResolvedValue(WORKFLOW_SINGLE);
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { phaseId: "design", milestoneId: "kickoff", name: "Sub A" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/multiple instances/i);
  });

  it("returns 400 when name is missing", async () => {
    adminSession();
    mockFetch.mockResolvedValue(WORKFLOW_MULTI);
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { phaseId: "design", milestoneId: "permits" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
  });

  it("returns 200 and appends new instance with fromTemplate=false", async () => {
    adminSession();
    mockFetch.mockResolvedValue(WORKFLOW_MULTI);
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { phaseId: "design", milestoneId: "permits", name: "Contractor A" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith("wf-1");
    // append should be called with the instances path + the new instance object
    expect(mockAppend).toHaveBeenCalledTimes(1);
    const appendArgs = (mockAppend.mock.calls as unknown as [string, unknown[]][])[0];
    const instancePath = appendArgs[0];
    expect(instancePath).toContain("instances");
    const newInstance = (appendArgs[1] as Record<string, unknown>[])[0];
    expect(newInstance.name).toBe("Contractor A");
    expect(newInstance.fromTemplate).toBe(false);
    expect(newInstance.status).toBe("not_started");
    expect(typeof newInstance._key).toBe("string");
    // lastActivityAt must be set
    expect(mockSet).toHaveBeenCalled();
    const setArg = (mockSet.mock.calls as unknown as [Record<string, unknown>][])[0][0];
    expect(typeof setArg.lastActivityAt).toBe("string");
  });
});

// ===== DELETE tests =====

describe("DELETE /workflow/instance (remove)", () => {
  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await (DELETE as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("DELETE", {
        phaseId: "design",
        milestoneId: "permits",
        instanceKey: "inst-abc",
      }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 200 and calls unset on the matching instance key", async () => {
    adminSession();
    mockFetch.mockResolvedValue(WORKFLOW_MULTI);
    const res = await (DELETE as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("DELETE", {
        phaseId: "design",
        milestoneId: "permits",
        instanceKey: "inst-abc",
      }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith("wf-1");
    expect(mockUnset).toHaveBeenCalledTimes(1);
    const unsetArg = (mockUnset.mock.calls as unknown as [string[]][])[0][0];
    expect(unsetArg[0]).toContain('inst-abc');
    // lastActivityAt must be set
    expect(mockSet).toHaveBeenCalled();
    const setArg = (mockSet.mock.calls as unknown as [Record<string, unknown>][])[0][0];
    expect(typeof setArg.lastActivityAt).toBe("string");
  });
});

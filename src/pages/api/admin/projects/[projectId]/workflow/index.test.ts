// Phase 44 Plan 05 Task 2 — Workflow lifecycle endpoint tests.
// POST instantiate / DELETE terminate / PATCH reactivate + changeTemplate.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const { mockGetSession, mockFetch, mockCreate, mockSet, mockCommit } = vi.hoisted(() => {
  const mockCommit = vi.fn();
  const mockSet = vi.fn(() => ({ commit: mockCommit }));
  return {
    mockGetSession: vi.fn(),
    mockFetch: vi.fn(),
    mockCreate: vi.fn(),
    mockSet,
    mockCommit,
  };
});

const mockPatch = vi.fn(() => ({ set: mockSet }));

vi.mock("../../../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({
    fetch: mockFetch,
    create: mockCreate,
    patch: mockPatch,
  }),
}));

// Deterministic seed returned by instantiateFromTemplate
const MOCK_SEED = {
  _type: "projectWorkflow" as const,
  templateId: "tmpl-1",
  templateVersion: 1,
  status: "active" as const,
  defaults: { clientApprovalDays: 5, dormancyDays: 30, revisionRounds: 2 },
  createdAt: "2026-01-01T12:00:00Z",
  lastActivityAt: "2026-01-01T12:00:00Z",
  phases: [],
};

vi.mock("../../../../../../lib/workflow/engine", () => ({
  instantiateFromTemplate: vi.fn(() => MOCK_SEED),
}));

vi.mock("../../../../../../sanity/queries", () => ({
  PROJECT_WORKFLOW_QUERY: "PROJECT_WORKFLOW_QUERY",
  WORKFLOW_TEMPLATE_BY_ID_QUERY: "WORKFLOW_TEMPLATE_BY_ID_QUERY",
}));

// Import routes AFTER mocks
import { POST, DELETE, PATCH } from "./index";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeRequest(method: string, body: unknown): Request {
  return new Request(
    "http://localhost/api/admin/projects/proj-1/workflow",
    {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

type RouteCtx = {
  request: Request;
  params: Record<string, string | undefined>;
  cookies: AstroCookies;
};

function adminSession() {
  mockGetSession.mockResolvedValue({
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
  });
}

function noSession() {
  mockGetSession.mockResolvedValue(null);
}

function nonAdminSession() {
  mockGetSession.mockResolvedValue({ entityId: "c1", role: "contractor" });
}

function noTenantSession() {
  mockGetSession.mockResolvedValue({ entityId: "admin", role: "admin" });
}

const PROJECT_ID = "proj-1";
const TEMPLATE = {
  _id: "tmpl-1",
  _type: "workflowTemplate" as const,
  name: "Standard",
  version: 1,
  defaults: { clientApprovalDays: 5, dormancyDays: 30, revisionRounds: 2 },
  phases: [],
};
const ACTIVE_WORKFLOW = {
  _id: "wf-1",
  _type: "projectWorkflow",
  status: "active",
  project: { _type: "reference", _ref: PROJECT_ID },
};
const DORMANT_WORKFLOW = { ...ACTIVE_WORKFLOW, status: "dormant" };

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({ _id: "wf-new", ...MOCK_SEED });
  mockCommit.mockResolvedValue({});
});

// ===== POST tests =====

describe("POST /workflow (instantiate)", () => {
  it("returns 401 when no session", async () => {
    noSession();
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { templateId: "tmpl-1" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when non-admin", async () => {
    nonAdminSession();
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { templateId: "tmpl-1" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when no tenantId", async () => {
    noTenantSession();
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { templateId: "tmpl-1" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when templateId is missing", async () => {
    adminSession();
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", {}),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/templateId/i);
  });

  it("returns 409 when workflow already active", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(ACTIVE_WORKFLOW);
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { templateId: "tmpl-1" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/already exists/i);
  });

  it("returns 404 when template not found", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(null) // no existing workflow
      .mockResolvedValueOnce(null); // template not found
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { templateId: "tmpl-missing" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/template not found/i);
  });

  it("returns 200 with workflow on happy path", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(null) // no existing workflow
      .mockResolvedValueOnce(TEMPLATE); // template found
    const res = await (POST as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("POST", { templateId: "tmpl-1" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; workflow: unknown };
    expect(body.success).toBe(true);
    expect(body.workflow).toBeTruthy();
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const created = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect((created.project as { _ref: string })._ref).toBe(PROJECT_ID);
  });
});

// ===== DELETE tests =====

describe("DELETE /workflow (terminate)", () => {
  it("returns 401 when no session", async () => {
    noSession();
    const res = await (DELETE as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("DELETE", {}),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when no workflow exists", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(null);
    const res = await (DELETE as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("DELETE", {}),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 and sets status=terminated + terminatedAt + lastActivityAt", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(ACTIVE_WORKFLOW);
    const res = await (DELETE as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("DELETE", {}),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith("wf-1");
    const setArg = (mockSet.mock.calls as unknown as [Record<string, unknown>][])[0][0];
    expect(setArg.status).toBe("terminated");
    expect(typeof setArg.terminatedAt).toBe("string");
    expect(typeof setArg.lastActivityAt).toBe("string");
  });
});

// ===== PATCH tests =====

describe("PATCH /workflow (reactivate + changeTemplate)", () => {
  it("returns 401 when no session", async () => {
    noSession();
    const res = await (PATCH as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("PATCH", { action: "reactivate" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when action is invalid", async () => {
    adminSession();
    const res = await (PATCH as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("PATCH", { action: "unknown" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
  });

  it("reactivate: returns 409 when current status is not dormant", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(ACTIVE_WORKFLOW); // status=active
    const res = await (PATCH as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("PATCH", { action: "reactivate" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(409);
  });

  it("reactivate: returns 200 and sets status=active + lastActivityAt", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(DORMANT_WORKFLOW);
    const res = await (PATCH as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("PATCH", { action: "reactivate" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const setArg = (mockSet.mock.calls as unknown as [Record<string, unknown>][])[0][0];
    expect(setArg.status).toBe("active");
    expect(typeof setArg.lastActivityAt).toBe("string");
  });

  it("changeTemplate: returns 400 when templateId is missing", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(ACTIVE_WORKFLOW);
    const res = await (PATCH as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("PATCH", { action: "changeTemplate" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/templateId/i);
  });

  it("changeTemplate: returns 200 and replaces phases + updates templateId", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(ACTIVE_WORKFLOW) // existing workflow
      .mockResolvedValueOnce(TEMPLATE); // new template
    const res = await (PATCH as unknown as (c: RouteCtx) => Promise<Response>)({
      request: makeRequest("PATCH", { action: "changeTemplate", templateId: "tmpl-1" }),
      params: { projectId: PROJECT_ID },
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith("wf-1");
    const setArg = (mockSet.mock.calls as unknown as [Record<string, unknown>][])[0][0];
    expect(setArg.templateId).toBe("tmpl-1");
    expect(Array.isArray(setArg.phases)).toBe(true);
    expect(setArg.status).toBe("active");
    expect(typeof setArg.lastActivityAt).toBe("string");
    expect(typeof setArg.createdAt).toBe("string");
  });
});

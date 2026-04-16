// Phase 39 Plan 01 Task 2 — POST /api/admin/work-orders contract tests.
// Mirrors src/pages/api/send-update.test.ts hoisted-mock pattern.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const { mockGetSession, mockCreate } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("../../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({
    create: mockCreate,
  }),
}));

// Import route AFTER mocks so the module graph picks them up.
import { POST } from "./index";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/work-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type RouteCtx = { request: Request; cookies: AstroCookies };
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

function adminSession() {
  mockGetSession.mockResolvedValue({
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({ _id: "wo-created-123" });
});

describe("POST /api/admin/work-orders (Phase 39 Plan 01)", () => {
  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await callPost({
      request: makeRequest({
        projectId: "p",
        contractorId: "c",
        specialInstructions: "x",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when session is non-admin", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "c1",
      role: "contractor",
    });
    const res = await callPost({
      request: makeRequest({
        projectId: "p",
        contractorId: "c",
        specialInstructions: "x",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when admin session has no tenantId", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "admin",
      role: "admin",
    });
    const res = await callPost({
      request: makeRequest({
        projectId: "p",
        contractorId: "c",
        specialInstructions: "x",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when specialInstructions is missing/empty", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        projectId: "p",
        contractorId: "c",
        specialInstructions: "   ",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/special instructions/i);
  });

  it("returns 400 when projectId missing", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        contractorId: "c",
        specialInstructions: "x",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when contractorId missing", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        projectId: "p",
        specialInstructions: "x",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
  });

  it("calls client.create with the correct workOrder doc shape", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        projectId: "proj-abc",
        contractorId: "con-xyz",
        selectedItemKeys: ["k1", "k2"],
        specialInstructions: "Please proceed",
        customFields: [{ key: "Due date", value: "2026-05-01", preset: true }],
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledTimes(1);

    const arg = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(arg._type).toBe("workOrder");
    expect(arg.project).toEqual({
      _type: "reference",
      _ref: "proj-abc",
    });
    expect(arg.contractor).toEqual({
      _type: "reference",
      _ref: "con-xyz",
    });
    expect(arg.selectedItemKeys).toEqual(["k1", "k2"]);
    expect(arg.specialInstructions).toBe("Please proceed");
    expect(arg.customFields).toEqual([
      { key: "Due date", value: "2026-05-01", preset: true },
    ]);
    // createdAt + updatedAt set to ISO strings
    expect(typeof arg.createdAt).toBe("string");
    expect(typeof arg.updatedAt).toBe("string");
    expect(() => new Date(arg.createdAt as string).toISOString()).not.toThrow();
    expect(() => new Date(arg.updatedAt as string).toISOString()).not.toThrow();
  });

  it("returns { success, workOrderId } on create success", async () => {
    adminSession();
    mockCreate.mockResolvedValueOnce({ _id: "wo-abc-001" });
    const res = await callPost({
      request: makeRequest({
        projectId: "p",
        contractorId: "c",
        specialInstructions: "instr",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; workOrderId: string };
    expect(body.success).toBe(true);
    expect(body.workOrderId).toBe("wo-abc-001");
  });
});

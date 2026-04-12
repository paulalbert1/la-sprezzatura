// src/pages/api/send-update/preview.test.ts
// Phase 34 Plan 04 Task 2 — GET /api/send-update/preview contract tests.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 2

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// ---------------------------------------------------------------------------
// Mock scaffolding
// ---------------------------------------------------------------------------
const { mockGetSession, mockFetch, mockPatch } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFetch: vi.fn(),
  mockPatch: vi.fn(),
}));

vi.mock("../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    fetch: mockFetch,
    patch: mockPatch,
  },
}));

// Import AFTER mocks so the route picks them up.
import { GET } from "./preview";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeUrl(qs: Record<string, string> = {}): URL {
  const u = new URL("http://localhost/api/send-update/preview");
  for (const [k, v] of Object.entries(qs)) u.searchParams.set(k, v);
  return u;
}

type RouteCtx = { url: URL; cookies: AstroCookies };
const callGet = (ctx: RouteCtx): Promise<Response> =>
  (GET as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

function adminSession() {
  mockGetSession.mockResolvedValue({
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
  });
}

function baseProjectSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    _id: "project-abc",
    title: "Preview Project",
    engagementType: "full-interior-design",
    clients: [
      {
        client: {
          _id: "client-sarah",
          name: "Sarah",
          email: "sarah@x.com",
          portalToken: "sarah-token",
        },
      },
    ],
    milestones: [
      { _key: "m1", name: "M1", date: "2026-04-01", completed: false },
    ],
    procurementItems: [],
    artifacts: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/send-update/preview (Phase 34 Plan 04)", () => {
  it("GET rejects unauthenticated request with 401", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await callGet({
      url: makeUrl({ projectId: "project-abc" }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("GET rejects non-admin session with 401 (T-34-04)", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "c-1",
      role: "client",
    });
    const res = await callGet({
      url: makeUrl({ projectId: "project-abc" }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("GET with valid admin session returns 200 and Content-Type 'text/html; charset=utf-8'", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(baseProjectSnapshot());
    const res = await callGet({
      url: makeUrl({ projectId: "project-abc" }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
  });

  it("response body is full HTML from buildSendUpdateEmail (contains project.title)", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(baseProjectSnapshot());
    const res = await callGet({
      url: makeUrl({ projectId: "project-abc" }),
      cookies: makeCookies(),
    });
    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Project Update: Preview Project");
  });

  it("honors clientId query param for per-client CTA preview", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          {
            client: {
              _id: "target-client",
              name: "Target",
              email: "target@x.com",
              portalToken: "token-xyz",
            },
          },
        ],
      }),
    );
    const res = await callGet({
      url: makeUrl({
        projectId: "project-abc",
        usePersonalLinks: "true",
        clientId: "target-client",
      }),
      cookies: makeCookies(),
    });
    const html = await res.text();
    expect(html).toContain("/portal/client/token-xyz");
    expect(html).not.toContain("/portal/dashboard");
  });

  it("does NOT call sanityWriteClient.patch (read-only endpoint)", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(baseProjectSnapshot());
    await callGet({
      url: makeUrl({ projectId: "project-abc" }),
      cookies: makeCookies(),
    });
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it("does NOT lazy-generate portalToken when clientId has no token", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          {
            client: {
              _id: "no-token-client",
              name: "NoToken",
              email: "no@x.com",
              portalToken: undefined,
            },
          },
        ],
      }),
    );
    const res = await callGet({
      url: makeUrl({
        projectId: "project-abc",
        usePersonalLinks: "true",
        clientId: "no-token-client",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    // Falls back to generic dashboard link — no lazy gen.
    const html = await res.text();
    expect(html).toContain("/portal/dashboard");
    expect(html).not.toContain("/portal/client/");
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it("section flags are parsed from query string and passed to buildSendUpdateEmail", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        milestones: [
          {
            _key: "m1",
            name: "MilestoneOne",
            date: "2026-04-01",
            completed: false,
          },
        ],
      }),
    );
    const res = await callGet({
      url: makeUrl({
        projectId: "project-abc",
        sections: JSON.stringify({ milestones: false }),
      }),
      cookies: makeCookies(),
    });
    const html = await res.text();
    // milestones:false → section suppressed
    expect(html).not.toContain("MilestoneOne");
  });
});

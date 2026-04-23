import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const { mockGetSession, mockFetch, mockCreateIfNotExists } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFetch: vi.fn(),
  mockCreateIfNotExists: vi.fn(),
}));
vi.mock("../../../../lib/session", () => ({ getSession: mockGetSession }));
vi.mock("../../../../lib/tenantClient", () => ({
  getTenantClient: () => ({ fetch: mockFetch, createIfNotExists: mockCreateIfNotExists }),
}));

import { POST } from "./seed";

function makeCookies(): AstroCookies { return {} as AstroCookies; }
function adminSession() { mockGetSession.mockResolvedValue({ role: "admin", tenantId: "t" }); }

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateIfNotExists.mockResolvedValue({});
});

describe("POST /api/admin/workflow-templates/seed", () => {
  it("401 without admin session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST({ cookies: makeCookies() } as never);
    expect(res.status).toBe(401);
  });

  it("403 with admin but no tenantId", async () => {
    mockGetSession.mockResolvedValue({ role: "admin" });
    const res = await POST({ cookies: makeCookies() } as never);
    expect(res.status).toBe(403);
  });

  it("created:3, skipped:0 on fresh run", async () => {
    adminSession();
    // ALL_SEEDS has 3 seeds — mock fetch returns 0 (not exists) for each
    mockFetch.mockResolvedValue(0);
    const res = await POST({ cookies: makeCookies() } as never);
    expect(res.status).toBe(200);
    const data = await res.json() as { created: number; skipped: number; total: number };
    expect(data.created).toBe(3);
    expect(data.skipped).toBe(0);
    expect(data.total).toBe(3);
    expect(mockCreateIfNotExists).toHaveBeenCalledTimes(3);
  });

  it("created:0, skipped:3 on re-run (all already exist)", async () => {
    adminSession();
    // All seeds already present — fetch returns > 0 for each
    mockFetch.mockResolvedValue(1);
    const res = await POST({ cookies: makeCookies() } as never);
    expect(res.status).toBe(200);
    const data = await res.json() as { created: number; skipped: number; total: number };
    expect(data.created).toBe(0);
    expect(data.skipped).toBe(3);
    expect(data.total).toBe(3);
    expect(mockCreateIfNotExists).not.toHaveBeenCalled();
  });

  it("created:1, skipped:2 when only one seed is missing", async () => {
    adminSession();
    // First seed missing, remaining two already exist
    mockFetch
      .mockResolvedValueOnce(0)
      .mockResolvedValue(1);
    const res = await POST({ cookies: makeCookies() } as never);
    expect(res.status).toBe(200);
    const data = await res.json() as { created: number; skipped: number; total: number };
    expect(data.created).toBe(1);
    expect(data.skipped).toBe(2);
    expect(data.total).toBe(3);
  });

  it("500 when Sanity throws", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(0);
    mockCreateIfNotExists.mockRejectedValueOnce(new Error("db error"));
    const res = await POST({ cookies: makeCookies() } as never);
    expect(res.status).toBe(500);
  });
});

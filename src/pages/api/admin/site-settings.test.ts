// src/pages/api/admin/site-settings.test.ts
// Phase 34 Plan 03 — tests for /api/admin/site-settings
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-05..D-12;
// threat T-34-01; plan 34-03-PLAN.md Task 1

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// vi.mock factories are hoisted above imports. Any bindings they reference
// must be declared via vi.hoisted() or inline inside the factory.
const {
  mockGetSession,
  mockFetch,
  mockCommit,
  mockAppend,
  mockSet,
  mockUnset,
  mockSetIfMissing,
  mockPatch,
} = vi.hoisted(() => {
  // The builder chain collects calls so tests can assert on the full
  // sequence. Every chainable method returns the same builder object.
  const builder: Record<string, any> = {};
  const commit = vi.fn().mockResolvedValue({});
  const append = vi.fn().mockImplementation(() => builder);
  const set = vi.fn().mockImplementation(() => builder);
  const unset = vi.fn().mockImplementation(() => builder);
  const setIfMissing = vi.fn().mockImplementation(() => builder);
  builder.commit = commit;
  builder.append = append;
  builder.set = set;
  builder.unset = unset;
  builder.setIfMissing = setIfMissing;
  const patch = vi.fn().mockReturnValue(builder);
  return {
    mockGetSession: vi.fn(),
    mockFetch: vi.fn(),
    mockCommit: commit,
    mockAppend: append,
    mockSet: set,
    mockUnset: unset,
    mockSetIfMissing: setIfMissing,
    mockPatch: patch,
  };
});

vi.mock("../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    patch: mockPatch,
    fetch: mockFetch,
  },
}));

// Route import must happen AFTER vi.mock calls above.
import { POST } from "./site-settings";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/site-settings", {
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
  // Re-assert chain returns after clearAllMocks wipes implementation state.
  mockSetIfMissing.mockImplementation(() => ({
    commit: mockCommit,
    append: mockAppend,
    set: mockSet,
    unset: mockUnset,
    setIfMissing: mockSetIfMissing,
  }));
  mockAppend.mockImplementation(() => ({
    commit: mockCommit,
    append: mockAppend,
    set: mockSet,
    unset: mockUnset,
    setIfMissing: mockSetIfMissing,
  }));
  mockSet.mockImplementation(() => ({
    commit: mockCommit,
    append: mockAppend,
    set: mockSet,
    unset: mockUnset,
    setIfMissing: mockSetIfMissing,
  }));
  mockUnset.mockImplementation(() => ({
    commit: mockCommit,
    append: mockAppend,
    set: mockSet,
    unset: mockUnset,
    setIfMissing: mockSetIfMissing,
  }));
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue({
    setIfMissing: mockSetIfMissing,
    set: mockSet,
    append: mockAppend,
    unset: mockUnset,
    commit: mockCommit,
  });
});

describe("POST /api/admin/site-settings (Phase 34 Plan 03)", () => {
  it("POST rejects non-admin session with 401 (T-34-01)", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "c-1",
      role: "client",
    });
    const res = await callPost({
      request: makeRequest({ action: "update", general: { siteTitle: "x" } }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it("POST action='update' patches siteSettings doc with allowed fields only", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        action: "update",
        general: {
          siteTitle: "La Sprezzatura",
          tagline: "Interior Design",
          contactEmail: "hello@lasprezz.com",
          contactPhone: "(516) 555-0123",
          studioLocation: "Long Island, NY",
        },
        socialLinks: {
          instagram: "https://instagram.com/lasprezz",
          pinterest: "",
          houzz: "",
        },
        renderingAllocation: 50,
        renderingImageTypes: ["Floor Plan"],
        renderingExcludedUsers: [],
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith("siteSettings");
    expect(mockSet).toHaveBeenCalledTimes(1);
    const setPayload = mockSet.mock.calls[0][0];
    expect(setPayload.siteTitle).toBe("La Sprezzatura");
    expect(setPayload.contactEmail).toBe("hello@lasprezz.com");
    expect(setPayload.renderingAllocation).toBe(50);
    // Arbitrary unknown fields must NOT leak into the patch
    expect(setPayload.evilField).toBeUndefined();
  });

  it("POST action='update' with renderingAllocation=0 returns 400", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({ action: "update", renderingAllocation: 0 }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/renderingAllocation/);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("POST action='update' with renderingAllocation=1 returns 200", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({ action: "update", renderingAllocation: 1 }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
  });

  it("POST action='update' with renderingAllocation=50 returns 200", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({ action: "update", renderingAllocation: 50 }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
  });

  it("POST action='appendHeroSlide' with empty alt returns 400", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        action: "appendHeroSlide",
        assetId: "image-abc-800x600-jpg",
        alt: "",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    expect(mockAppend).not.toHaveBeenCalled();
  });

  it("POST action='appendHeroSlide' persists { _type: 'image', asset: { _type: 'reference', _ref: ... }, alt }", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        action: "appendHeroSlide",
        assetId: "image-abc-800x600-jpg",
        alt: "Hero image of living room",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    // The first append call is the hero slide push; the second is the
    // updateLog entry.
    const heroAppendCall = mockAppend.mock.calls.find(
      (call) => call[0] === "heroSlideshow",
    );
    expect(heroAppendCall).toBeTruthy();
    const [, slides] = heroAppendCall!;
    expect(slides).toHaveLength(1);
    const slide = slides[0];
    expect(slide.image._type).toBe("image");
    expect(slide.image.asset._type).toBe("reference");
    expect(slide.image.asset._ref).toBe("image-abc-800x600-jpg");
    expect(slide.alt).toBe("Hero image of living room");
    expect(typeof slide._key).toBe("string");
    expect(slide._key.length).toBeGreaterThan(0);
  });

  it("POST action='appendHeroSlide' rejects payloads containing a blob pathname instead of asset ref", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        action: "appendHeroSlide",
        assetId: "uploads/hero/photo.jpg", // blob pathname — must reject
        alt: "Hero image",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/image-/);
    expect(mockAppend).not.toHaveBeenCalled();
  });

  it("POST action='reorderHeroSlideshow' uses arrayMove order from request", async () => {
    adminSession();
    // The reorder flow re-fetches the current heroSlideshow so it can rebuild
    // the array in the new client-provided order.
    mockFetch.mockResolvedValueOnce({
      heroSlideshow: [
        { _key: "k1", alt: "first" },
        { _key: "k2", alt: "second" },
        { _key: "k3", alt: "third" },
      ],
    });

    const res = await callPost({
      request: makeRequest({
        action: "reorderHeroSlideshow",
        order: ["k3", "k1", "k2"],
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const heroSetCall = mockSet.mock.calls.find(
      (call) => call[0] && "heroSlideshow" in call[0],
    );
    expect(heroSetCall).toBeTruthy();
    const setPayload = heroSetCall![0];
    expect(setPayload.heroSlideshow.map((s: any) => s._key)).toEqual([
      "k3",
      "k1",
      "k2",
    ]);
  });

  it("POST action='removeHeroSlide' uses _key to target the row", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({ action: "removeHeroSlide", _key: "k2" }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockUnset).toHaveBeenCalledWith([
      'heroSlideshow[_key=="k2"]',
    ]);
  });

  it("POST action='update' with contactEmail missing '@' returns 400", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        action: "update",
        general: { contactEmail: "not-an-email" },
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/contactEmail/);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("POST action='update' with siteTitle > 60 chars returns 400", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        action: "update",
        general: { siteTitle: "x".repeat(61) },
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/siteTitle/);
  });

  it("uses singleton _id='siteSettings' convention for the target document", async () => {
    adminSession();
    await callPost({
      request: makeRequest({
        action: "update",
        general: { siteTitle: "x" },
      }),
      cookies: makeCookies(),
    });
    expect(mockPatch).toHaveBeenCalledWith("siteSettings");
    const setIfMissingCall = mockSetIfMissing.mock.calls[0][0];
    expect(setIfMissingCall._type).toBe("siteSettings");
  });

  it("writes an updateLog entry with timestamp on every successful save", async () => {
    adminSession();
    await callPost({
      request: makeRequest({
        action: "update",
        general: { siteTitle: "x" },
      }),
      cookies: makeCookies(),
    });
    const logAppendCall = mockAppend.mock.calls.find(
      (call) => call[0] === "updateLog",
    );
    expect(logAppendCall).toBeTruthy();
    const [, entries] = logAppendCall!;
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(typeof entry.savedAt).toBe("string");
    // ISO timestamp shape
    expect(entry.savedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
    expect(entry.action).toBe("update");
    expect(entry.actor).toBe("paul@lasprezz.com");
    expect(typeof entry._key).toBe("string");
  });
});

// Phase 40 Plan 01 — VEND-03: updateTrades action
describe("POST /api/admin/site-settings — updateTrades (Phase 40 Plan 01)", () => {
  it("rejects non-admin session with 401", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "c-1", role: "client" });
    const res = await callPost({
      request: makeRequest({ action: "updateTrades", trades: ["electrician"] }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it("returns 400 when trades is not an array", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({ action: "updateTrades", trades: "electrician" }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/array/);
  });

  it("returns 400 when trades contains an empty string", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({ action: "updateTrades", trades: ["electrician", ""] }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/non-empty/);
  });

  it("returns 400 when trades contains a whitespace-only string", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({ action: "updateTrades", trades: ["electrician", "   "] }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/non-empty/);
  });

  it("patches siteSettings with trimmed trades array on valid input", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({
        action: "updateTrades",
        trades: ["  electrician  ", "plumber", "hvac"],
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith("siteSettings");
    const setCall = mockSet.mock.calls.find(
      (call) => call[0] && "trades" in call[0],
    );
    expect(setCall).toBeTruthy();
    expect(setCall![0].trades).toEqual(["electrician", "plumber", "hvac"]);
  });

  it("accepts an empty array to clear the trades catalog", async () => {
    adminSession();
    const res = await callPost({
      request: makeRequest({ action: "updateTrades", trades: [] }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const setCall = mockSet.mock.calls.find(
      (call) => call[0] && "trades" in call[0],
    );
    expect(setCall).toBeTruthy();
    expect(setCall![0].trades).toEqual([]);
  });

  it("appends an updateLog entry with action='updateTrades'", async () => {
    adminSession();
    await callPost({
      request: makeRequest({ action: "updateTrades", trades: ["electrician"] }),
      cookies: makeCookies(),
    });
    const logAppendCall = mockAppend.mock.calls.find(
      (call) => call[0] === "updateLog",
    );
    expect(logAppendCall).toBeTruthy();
    const [, entries] = logAppendCall!;
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("updateTrades");
  });
});

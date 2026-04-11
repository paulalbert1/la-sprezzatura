import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock sanity write client
const mockFetch = vi.fn();
const mockCommit = vi.fn().mockResolvedValue({});
const mockInc = vi.fn().mockReturnValue({ commit: mockCommit });
const mockPatch = vi.fn().mockReturnValue({ inc: mockInc });
const mockCreateOrReplace = vi.fn().mockResolvedValue({});
vi.mock("../sanity/writeClient", () => ({
  sanityWriteClient: {
    fetch: mockFetch,
    patch: mockPatch,
    createOrReplace: mockCreateOrReplace,
  },
}));

// Store original env
const originalEnv = { ...import.meta.env };

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/rendering/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  import.meta.env.STUDIO_API_SECRET = "test-secret-123";
  import.meta.env.GEMINI_API_KEY = "test-gemini-key";
  import.meta.env.RENDERING_TEST_MODE = undefined;

  // Default: no excluded users
  mockFetch.mockResolvedValue({
    renderingExcludedUsers: [],
    renderingAllocation: 50,
  });
});

afterEach(() => {
  Object.assign(import.meta.env, originalEnv);
});

describe("validateRenderingAuth", () => {
  it("returns 401 when x-studio-token header is missing", async () => {
    const { validateRenderingAuth } = await import("./renderingAuth");
    const request = makeRequest({ sanityUserId: "user1" });
    const result = await validateRenderingAuth(request);

    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.error).toBeTruthy();
  });

  it("returns 401 when x-studio-token does not match STUDIO_API_SECRET", async () => {
    const { validateRenderingAuth } = await import("./renderingAuth");
    const request = makeRequest(
      { sanityUserId: "user1" },
      { "x-studio-token": "wrong-secret" },
    );
    const result = await validateRenderingAuth(request);

    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  it("returns 400 when sanityUserId is missing from body", async () => {
    const { validateRenderingAuth } = await import("./renderingAuth");
    const request = makeRequest(
      {},
      { "x-studio-token": "test-secret-123" },
    );
    const result = await validateRenderingAuth(request);

    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain("sanityUserId");
  });

  it("returns 403 when user is in renderingExcludedUsers", async () => {
    mockFetch.mockResolvedValueOnce({
      renderingExcludedUsers: ["blocked-user"],
      renderingAllocation: 50,
    });

    const { validateRenderingAuth } = await import("./renderingAuth");
    const request = makeRequest(
      { sanityUserId: "blocked-user" },
      { "x-studio-token": "test-secret-123" },
    );
    const result = await validateRenderingAuth(request);

    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(403);
  });

  it("returns 503 when GEMINI_API_KEY is not set", async () => {
    import.meta.env.GEMINI_API_KEY = "";

    const { validateRenderingAuth } = await import("./renderingAuth");
    const request = makeRequest(
      { sanityUserId: "user1" },
      { "x-studio-token": "test-secret-123" },
    );
    const result = await validateRenderingAuth(request);

    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(503);
    expect(result.error).toContain("not configured");
  });

  it("returns 503 bypassed when RENDERING_TEST_MODE is true and no GEMINI_API_KEY", async () => {
    import.meta.env.GEMINI_API_KEY = "";
    import.meta.env.RENDERING_TEST_MODE = "true";

    const { validateRenderingAuth } = await import("./renderingAuth");
    const request = makeRequest(
      { sanityUserId: "user1" },
      { "x-studio-token": "test-secret-123" },
    );
    const result = await validateRenderingAuth(request);

    expect(result.authorized).toBe(true);
    expect(result.sanityUserId).toBe("user1");
  });

  it("returns authorized: true with sanityUserId when all checks pass", async () => {
    const { validateRenderingAuth } = await import("./renderingAuth");
    const request = makeRequest(
      { sanityUserId: "user1" },
      { "x-studio-token": "test-secret-123" },
    );
    const result = await validateRenderingAuth(request);

    expect(result.authorized).toBe(true);
    expect(result.sanityUserId).toBe("user1");
    expect(result.error).toBeUndefined();
    expect(result.statusCode).toBeUndefined();
  });
});

describe("checkUsageQuota", () => {
  it("returns allowed: true when under quota", async () => {
    // Mock: existing usage doc with count 10, limit 50
    mockFetch
      .mockResolvedValueOnce({ renderingAllocation: 50 })
      .mockResolvedValueOnce({ _id: "usage-user1-2026-03", count: 10, limit: 50, bytesStored: 1000 });

    const { checkUsageQuota } = await import("./renderingAuth");
    const result = await checkUsageQuota("user1");

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(10);
    expect(result.limit).toBe(50);
    expect(result.remaining).toBe(40);
  });

  it("returns allowed: false when at or over quota", async () => {
    mockFetch
      .mockResolvedValueOnce({ renderingAllocation: 50 })
      .mockResolvedValueOnce({ _id: "usage-user1-2026-03", count: 50, limit: 50, bytesStored: 5000 });

    const { checkUsageQuota } = await import("./renderingAuth");
    const result = await checkUsageQuota("user1");

    expect(result.allowed).toBe(false);
    expect(result.count).toBe(50);
    expect(result.remaining).toBe(0);
  });

  it("creates new renderingUsage document if none exists", async () => {
    mockFetch
      .mockResolvedValueOnce({ renderingAllocation: 50 })
      .mockResolvedValueOnce(null);

    const { checkUsageQuota } = await import("./renderingAuth");
    const result = await checkUsageQuota("user1");

    expect(mockCreateOrReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: "renderingUsage",
        count: 0,
        limit: 50,
        bytesStored: 0,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.count).toBe(0);
    expect(result.remaining).toBe(50);
  });
});

describe("incrementUsage", () => {
  it("increments count and bytesStored atomically", async () => {
    const { incrementUsage } = await import("./renderingAuth");
    await incrementUsage("user1", 1024);

    expect(mockPatch).toHaveBeenCalled();
    expect(mockInc).toHaveBeenCalledWith({ count: 1, bytesStored: 1024 });
    expect(mockCommit).toHaveBeenCalled();
  });

  it("uses sanitized doc ID when sanityUserId is an email", async () => {
    const { incrementUsage } = await import("./renderingAuth");
    await incrementUsage("paul@lasprezz.com", 512);

    // Doc ID must not contain `@` or `.` — Sanity rejects them
    const patchCalls = mockPatch.mock.calls;
    expect(patchCalls.length).toBeGreaterThan(0);
    const passedDocId = patchCalls[0][0] as string;
    expect(passedDocId).not.toContain("@");
    expect(passedDocId).toMatch(/^usage-paul-lasprezz-com-\d{4}-\d{2}$/);
  });
});

describe("buildUsageDocId", () => {
  it("replaces @ in email-format user IDs with hyphen", async () => {
    const { buildUsageDocId } = await import("./renderingAuth");
    expect(buildUsageDocId("paul@lasprezz.com", "2026-04")).toBe(
      "usage-paul-lasprezz-com-2026-04",
    );
  });

  it("replaces dots as well so the final ID is visually consistent", async () => {
    const { buildUsageDocId } = await import("./renderingAuth");
    expect(buildUsageDocId("liz@lasprezz.com", "2026-04")).toBe(
      "usage-liz-lasprezz-com-2026-04",
    );
  });

  it("leaves already-safe user IDs unchanged", async () => {
    const { buildUsageDocId } = await import("./renderingAuth");
    expect(buildUsageDocId("user1", "2026-04")).toBe("usage-user1-2026-04");
    expect(buildUsageDocId("paul_lasprezz_com", "2026-04")).toBe(
      "usage-paul_lasprezz_com-2026-04",
    );
  });

  it("produces only Sanity-legal characters", async () => {
    const { buildUsageDocId } = await import("./renderingAuth");
    const docId = buildUsageDocId("weird user!@#$%^&*()+=", "2026-04");
    expect(docId).toMatch(/^[a-zA-Z0-9._-]+$/);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock renderingAuth module — partial mock keeps the real buildUsageDocId
// so usage.ts can compute Sanity-legal doc IDs from sanitized user IDs.
const mockCheckUsageQuota = vi.fn();
vi.mock("../../../lib/renderingAuth", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/renderingAuth")>(
    "../../../lib/renderingAuth",
  );
  return {
    ...actual,
    checkUsageQuota: mockCheckUsageQuota,
  };
});

// Mock sanity write client
const mockFetch = vi.fn();
vi.mock("../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    fetch: mockFetch,
  },
}));

// Store original env
const originalEnv = { ...import.meta.env };

function makeRequest(
  params: Record<string, string> = {},
  headers: Record<string, string> = {},
): Request {
  const url = new URL("http://localhost/api/rendering/usage");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString(), {
    method: "GET",
    headers: {
      ...headers,
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  import.meta.env.STUDIO_API_SECRET = "test-secret";

  // Default: checkUsageQuota returns allowed with count/limit/remaining
  mockCheckUsageQuota.mockResolvedValue({
    allowed: true,
    count: 10,
    limit: 50,
    remaining: 40,
  });

  // Default: usage doc fetch returns bytesStored
  mockFetch.mockResolvedValue({ bytesStored: 2048 });
});

describe("GET /api/rendering/usage", () => {
  it("returns 401 when x-studio-token is missing", async () => {
    const { GET } = await import("./usage");
    const request = makeRequest({ sanityUserId: "user-abc" });
    const url = new URL(request.url);
    const response = await GET({ request, url } as any);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 401 when x-studio-token is invalid", async () => {
    const { GET } = await import("./usage");
    const request = makeRequest(
      { sanityUserId: "user-abc" },
      { "x-studio-token": "wrong-token" },
    );
    const url = new URL(request.url);
    const response = await GET({ request, url } as any);

    expect(response.status).toBe(401);
  });

  it("returns 400 when sanityUserId is missing", async () => {
    const { GET } = await import("./usage");
    const request = makeRequest(
      {},
      { "x-studio-token": "test-secret" },
    );
    const url = new URL(request.url);
    const response = await GET({ request, url } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("sanityUserId");
  });

  it("returns 200 with usage data when valid", async () => {
    const { GET } = await import("./usage");
    const request = makeRequest(
      { sanityUserId: "user-abc" },
      { "x-studio-token": "test-secret" },
    );
    const url = new URL(request.url);
    const response = await GET({ request, url } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sanityUserId).toBe("user-abc");
    expect(body.count).toBe(10);
    expect(body.limit).toBe(50);
    expect(body.remaining).toBe(40);
    // Month should match current YYYY-MM format
    expect(body.month).toMatch(/^\d{4}-\d{2}$/);
  });

  it("calls checkUsageQuota with provided sanityUserId", async () => {
    const { GET } = await import("./usage");
    const request = makeRequest(
      { sanityUserId: "user-abc" },
      { "x-studio-token": "test-secret" },
    );
    const url = new URL(request.url);
    await GET({ request, url } as any);

    expect(mockCheckUsageQuota).toHaveBeenCalledWith("user-abc");
  });
});

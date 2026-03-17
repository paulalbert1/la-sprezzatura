import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock renderingAuth module
const mockValidateRenderingAuth = vi.fn();
const mockCheckUsageQuota = vi.fn();
const mockIncrementUsage = vi.fn();
vi.mock("../../../lib/renderingAuth", () => ({
  validateRenderingAuth: (...args: unknown[]) =>
    mockValidateRenderingAuth(...args),
  checkUsageQuota: (...args: unknown[]) => mockCheckUsageQuota(...args),
  incrementUsage: (...args: unknown[]) => mockIncrementUsage(...args),
}));

// Mock sanity write client
const mockCreate = vi.fn();
const mockSanityFetch = vi.fn();
const mockCommit = vi.fn().mockResolvedValue({});
const mockSet = vi.fn().mockReturnValue({
  append: vi.fn().mockReturnValue({ commit: mockCommit }),
  commit: mockCommit,
});
const mockPatch = vi.fn().mockReturnValue({ set: mockSet, commit: mockCommit });
vi.mock("../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    create: (...args: unknown[]) => mockCreate(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    fetch: (...args: unknown[]) => mockSanityFetch(...args),
  },
}));

// Mock @vercel/functions
const mockWaitUntil = vi.fn();
vi.mock("@vercel/functions", () => ({
  waitUntil: (...args: unknown[]) => mockWaitUntil(...args),
}));

// Mock @vercel/blob
const mockPut = vi.fn();
vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockPut(...args),
}));

// Mock geminiClient
const mockGenerateRendering = vi.fn();
const mockFetchAndEncodeImage = vi.fn();
vi.mock("../../../lib/geminiClient", () => ({
  generateRendering: (...args: unknown[]) => mockGenerateRendering(...args),
  fetchAndEncodeImage: (...args: unknown[]) => mockFetchAndEncodeImage(...args),
}));

// Mock promptBuilder
const mockBuildLuxuryPrompt = vi.fn().mockReturnValue("test prompt");
const mockBuildImageRoleLabel = vi.fn().mockReturnValue("TEST LABEL:");
vi.mock("../../../lib/promptBuilder", () => ({
  buildLuxuryPrompt: (...args: unknown[]) => mockBuildLuxuryPrompt(...args),
  buildImageRoleLabel: (...args: unknown[]) => mockBuildImageRoleLabel(...args),
}));

// Mock generateToken
vi.mock("../../../lib/generateToken", () => ({
  generatePortalToken: () => "test1234",
}));

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/rendering/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-studio-token": "test-secret",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/rendering/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when auth fails", async () => {
    mockValidateRenderingAuth.mockResolvedValue({
      authorized: false,
      error: "Invalid token",
      statusCode: 401,
    });

    const { POST } = await import("./generate");
    const request = makeRequest({
      description: "A modern living room",
      sessionTitle: "Test Session",
      sanityUserId: "user1",
    });
    const response = await POST({ request } as any);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 403 with QUOTA_EXCEEDED when monthly limit reached", async () => {
    mockValidateRenderingAuth.mockResolvedValue({
      authorized: true,
      sanityUserId: "user1",
    });
    mockCheckUsageQuota.mockResolvedValue({
      allowed: false,
      count: 50,
      limit: 50,
      remaining: 0,
    });

    const { POST } = await import("./generate");
    const request = makeRequest({
      description: "A modern living room",
      sessionTitle: "Test Session",
      sanityUserId: "user1",
    });
    const response = await POST({ request } as any);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("QUOTA_EXCEEDED");
    expect(body.usage).toEqual({ count: 50, limit: 50, remaining: 0 });
  });

  it("returns 400 with MISSING_DESCRIPTION when description is missing", async () => {
    mockValidateRenderingAuth.mockResolvedValue({
      authorized: true,
      sanityUserId: "user1",
    });
    mockCheckUsageQuota.mockResolvedValue({
      allowed: true,
      count: 5,
      limit: 50,
      remaining: 45,
    });

    const { POST } = await import("./generate");
    const request = makeRequest({
      sessionTitle: "Test Session",
      sanityUserId: "user1",
    });
    const response = await POST({ request } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("MISSING_DESCRIPTION");
  });

  it("returns 400 with MISSING_TITLE when no sessionId and no sessionTitle", async () => {
    mockValidateRenderingAuth.mockResolvedValue({
      authorized: true,
      sanityUserId: "user1",
    });
    mockCheckUsageQuota.mockResolvedValue({
      allowed: true,
      count: 5,
      limit: 50,
      remaining: 45,
    });

    const { POST } = await import("./generate");
    const request = makeRequest({
      description: "A modern living room",
      sanityUserId: "user1",
    });
    const response = await POST({ request } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("MISSING_TITLE");
  });

  it("returns 202 with sessionId when all validations pass", async () => {
    mockValidateRenderingAuth.mockResolvedValue({
      authorized: true,
      sanityUserId: "user1",
    });
    mockCheckUsageQuota.mockResolvedValue({
      allowed: true,
      count: 5,
      limit: 50,
      remaining: 45,
    });
    mockCreate.mockResolvedValue({ _id: "session-123" });

    const { POST } = await import("./generate");
    const request = makeRequest({
      description: "A modern living room",
      sessionTitle: "Test Session",
      sanityUserId: "user1",
    });
    const response = await POST({ request } as any);

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.status).toBe("generating");
    expect(body.sessionId).toBe("session-123");
    expect(body.message).toBeTruthy();
  });

  it("calls waitUntil with a Promise on successful 202", async () => {
    mockValidateRenderingAuth.mockResolvedValue({
      authorized: true,
      sanityUserId: "user1",
    });
    mockCheckUsageQuota.mockResolvedValue({
      allowed: true,
      count: 5,
      limit: 50,
      remaining: 45,
    });
    mockCreate.mockResolvedValue({ _id: "session-456" });

    const { POST } = await import("./generate");
    const request = makeRequest({
      description: "A modern living room",
      sessionTitle: "Test Session",
      sanityUserId: "user1",
    });
    await POST({ request } as any);

    expect(mockWaitUntil).toHaveBeenCalledTimes(1);
    // waitUntil should be called with a Promise
    const arg = mockWaitUntil.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Promise);
  });
});

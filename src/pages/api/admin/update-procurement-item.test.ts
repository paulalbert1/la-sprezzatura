import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
vi.mock("../../../lib/session", () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock("../../../lib/generateToken", () => ({
  generatePortalToken: () => "testkey1",
}));

const mockCommit = vi.fn(() => Promise.resolve());
const mockUnset = vi.fn(() => ({ commit: mockCommit }));
const mockSet = vi.fn(() => ({ commit: mockCommit }));
const mockAppend = vi.fn(() => ({ commit: mockCommit }));
const mockSetIfMissing = vi.fn(() => ({ append: mockAppend }));
const mockPatch = vi.fn(() => ({
  set: mockSet,
  unset: mockUnset,
  setIfMissing: mockSetIfMissing,
}));

vi.mock("../../../sanity/writeClient", () => ({
  sanityWriteClient: {
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

import { POST } from "./update-procurement-item";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/update-procurement-item", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeCookies() {
  return {} as any;
}

describe("POST /api/admin/update-procurement-item", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is null", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await POST({
      request: makeRequest({}),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when action is missing", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({ projectId: "p1" }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 when projectId is missing", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({ action: "add", fields: { name: "Test" } }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 for add action without name", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "add",
        fields: { manufacturer: "Kravet" },
      }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Name is required");
  });

  it("returns 400 for add action with non-integer retailPrice", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "add",
        fields: { name: "Sofa", retailPrice: 12.5 },
      }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("retailPrice must be an integer (cents)");
  });

  it("returns 400 for add action with non-integer clientCost", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "add",
        fields: { name: "Sofa", clientCost: 99.9 },
      }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("clientCost must be an integer (cents)");
  });

  it("returns 200 for add action with valid fields and includes generated _key", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    mockCommit.mockResolvedValueOnce({});

    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "add",
        fields: {
          name: "Italian Marble Slab",
          manufacturer: "Calacatta",
          status: "ordered",
          quantity: 2,
          retailPrice: 150000,
          clientCost: 180000,
        },
      }),
      cookies: makeCookies(),
    } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.item._key).toBe("testkey1");
    expect(body.item.name).toBe("Italian Marble Slab");
    expect(body.item.manufacturer).toBe("Calacatta");

    expect(mockPatch).toHaveBeenCalledWith("p1");
    expect(mockSetIfMissing).toHaveBeenCalledWith({ procurementItems: [] });
    expect(mockAppend).toHaveBeenCalledWith(
      "procurementItems",
      expect.arrayContaining([
        expect.objectContaining({ _key: "testkey1", name: "Italian Marble Slab" }),
      ]),
    );
    expect(mockCommit).toHaveBeenCalled();
  });

  it("returns 400 for edit action with non-integer retailPrice", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "edit",
        itemKey: "k1",
        fields: { retailPrice: 12.5 },
      }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("retailPrice must be an integer (cents)");
  });

  it("returns 400 for edit action with non-integer clientCost", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "edit",
        itemKey: "k1",
        fields: { clientCost: 99.9 },
      }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("clientCost must be an integer (cents)");
  });

  it("returns 400 for edit action without itemKey", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "edit",
        fields: { name: "Updated" },
      }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 200 for edit action with valid fields", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    mockCommit.mockResolvedValueOnce({});

    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "edit",
        itemKey: "k1",
        fields: { name: "Updated Name", status: "in-transit" },
      }),
      cookies: makeCookies(),
    } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockPatch).toHaveBeenCalledWith("p1");
    expect(mockSet).toHaveBeenCalledWith({
      'procurementItems[_key=="k1"].name': "Updated Name",
      'procurementItems[_key=="k1"].status': "in-transit",
    });
    expect(mockCommit).toHaveBeenCalled();
  });

  it("returns 400 for remove action without itemKey", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "remove",
      }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 200 for remove action with valid fields", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    mockCommit.mockResolvedValueOnce({});

    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "remove",
        itemKey: "k1",
      }),
      cookies: makeCookies(),
    } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockPatch).toHaveBeenCalledWith("p1");
    expect(mockUnset).toHaveBeenCalledWith(['procurementItems[_key=="k1"]']);
    expect(mockCommit).toHaveBeenCalled();
  });

  it("returns 400 for invalid action", async () => {
    mockGetSession.mockResolvedValueOnce({ entityId: "a1", role: "admin" });
    const res = await POST({
      request: makeRequest({
        projectId: "p1",
        action: "invalid",
      }),
      cookies: makeCookies(),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid action");
  });
});

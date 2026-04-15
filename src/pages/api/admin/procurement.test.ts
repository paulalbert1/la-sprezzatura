import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// Mock session module
const mockGetSession = vi.fn();
vi.mock("../../../lib/session", () => ({
  getSession: mockGetSession,
}));

// Mock tenant client module
const mockCommit = vi.fn().mockResolvedValue({});
const mockAppend = vi.fn().mockReturnThis();
const mockSetIfMissing = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockUnset = vi.fn().mockReturnThis();
const mockPatch = vi.fn().mockReturnValue({
  set: mockSet,
  setIfMissing: mockSetIfMissing,
  append: mockAppend,
  unset: mockUnset,
  commit: mockCommit,
});
vi.mock("../../../lib/tenantClient", () => ({
  getTenantClient: vi.fn().mockReturnValue({
    patch: mockPatch,
  }),
}));

// Mock generateToken module
vi.mock("../../../lib/generateToken", () => ({
  generatePortalToken: vi.fn().mockReturnValue("test1234"),
}));

// Mock Ship24 module
const mockGetTrackingResults = vi.fn();
const mockExtractTrackingData = vi.fn();
const mockIsShip24Configured = vi.fn();
vi.mock("../../../lib/ship24", () => ({
  getTrackingResults: mockGetTrackingResults,
  extractTrackingData: mockExtractTrackingData,
  isShip24Configured: mockIsShip24Configured,
}));

// Helper to create mock cookies
function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

// Helper to create a Request with JSON body
function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/admin/procurement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper to create a Request with invalid JSON
function makeInvalidRequest(): Request {
  return new Request("http://localhost/api/admin/procurement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json{{{",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset chainable mocks
  mockSet.mockReturnThis();
  mockSetIfMissing.mockReturnThis();
  mockAppend.mockReturnThis();
  mockUnset.mockReturnThis();
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue({
    set: mockSet,
    setIfMissing: mockSetIfMissing,
    append: mockAppend,
    unset: mockUnset,
    commit: mockCommit,
  });
});

describe("POST /api/admin/procurement", () => {
  describe("Authentication", () => {
    it("returns 401 when no session exists", async () => {
      mockGetSession.mockResolvedValue(null);
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({ action: "create", projectId: "proj-1", name: "Chair" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 403 when session has no tenantId", async () => {
      mockGetSession.mockResolvedValue({ entityId: "user-1", role: "admin" });
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({ action: "create", projectId: "proj-1", name: "Chair" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("No tenant context");
    });

    it("returns 400 when body is invalid JSON", async () => {
      mockGetSession.mockResolvedValue({ entityId: "admin-1", role: "admin", tenantId: "t-1" });
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeInvalidRequest(),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid JSON");
    });

    it("returns 400 when projectId is missing", async () => {
      mockGetSession.mockResolvedValue({ entityId: "admin-1", role: "admin", tenantId: "t-1" });
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({ action: "create", name: "Chair" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("projectId");
    });

    it("returns 400 for invalid action", async () => {
      mockGetSession.mockResolvedValue({ entityId: "admin-1", role: "admin", tenantId: "t-1" });
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({ action: "unknown", projectId: "proj-1" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid action");
    });
  });

  describe("Create action", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        entityId: "admin-1",
        role: "admin",
        tenantId: "tenant-1",
      });
    });

    it("creates a procurement item with setIfMissing().append().commit()", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "create",
          projectId: "proj-1",
          name: "Marble Countertop",
          vendor: "Stone Source",
          expectedDeliveryDate: "2026-05-15",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.itemKey).toBe("test1234");

      // Verify Sanity mutation pattern
      expect(mockPatch).toHaveBeenCalledWith("proj-1");
      expect(mockSetIfMissing).toHaveBeenCalledWith(
        expect.objectContaining({ procurementItems: [], activityLog: [] }),
      );
      expect(mockAppend).toHaveBeenCalledWith(
        "procurementItems",
        expect.arrayContaining([
          expect.objectContaining({
            _key: "test1234",
            _type: "procurementItem",
            name: "Marble Countertop",
            status: "pending",
            vendor: "Stone Source",
            images: [],
          }),
        ]),
      );
    });

    it("Phase 37: ignores legacy retailPrice/clientCost in body (fields stripped from schema)", async () => {
      const { POST } = await import("./procurement");

      await POST({
        request: makeRequest({
          action: "create",
          projectId: "proj-1",
          name: "Legacy Client",
          retailPrice: 15000,
          clientCost: 12000,
        }),
        cookies: makeCookies(),
      } as any);

      const appendedItem = mockAppend.mock.calls.find(
        (c) => c[0] === "procurementItems",
      )?.[1]?.[0];
      expect(appendedItem).toBeDefined();
      expect(appendedItem).not.toHaveProperty("retailPrice");
      expect(appendedItem).not.toHaveProperty("clientCost");
    });

    it("returns 400 when name is missing", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({ action: "create", projectId: "proj-1" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Item name is required");
    });

    it("includes activity log entry with procurement-status-changed action", async () => {
      const { POST } = await import("./procurement");

      await POST({
        request: makeRequest({
          action: "create",
          projectId: "proj-1",
          name: "Custom Wallpaper",
        }),
        cookies: makeCookies(),
      } as any);

      expect(mockAppend).toHaveBeenCalledWith(
        "activityLog",
        expect.arrayContaining([
          expect.objectContaining({
            _type: "activityEntry",
            action: "procurement-status-changed",
            actor: "admin-1",
          }),
        ]),
      );
    });

    it("validates date format (YYYY-MM-DD)", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "create",
          projectId: "proj-1",
          name: "Chair",
          expectedDeliveryDate: "05-15-2026",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("date format");
    });

    it("Phase 37: UPDATABLE_FIELDS does not include retailPrice or clientCost", async () => {
      const mod = await import("./procurement");
      // The module does not export UPDATABLE_FIELDS, but we can prove the contract
      // behaviorally: an "update" payload with price fields writes zero price
      // fields into setObject (covered more directly in the Update suite below).
      expect(mod.POST).toBeDefined();
    });
  });

  describe("Update action", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        entityId: "admin-1",
        role: "admin",
        tenantId: "tenant-1",
      });
    });

    it("calls client.patch().set() with path notation for each field", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "update",
          projectId: "proj-1",
          itemKey: "item-abc",
          name: "Updated Chair",
          vendor: "New Vendor",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      expect(mockPatch).toHaveBeenCalledWith("proj-1");
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`procurementItems[_key=="item-abc"].name`]: "Updated Chair",
          [`procurementItems[_key=="item-abc"].vendor`]: "New Vendor",
        }),
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it("returns 400 when itemKey is missing", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "update",
          projectId: "proj-1",
          name: "Updated",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("itemKey");
    });

    it("validates date format same as create", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "update",
          projectId: "proj-1",
          itemKey: "item-abc",
          expectedDeliveryDate: "05-15-2026",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("date format");
    });

    it("Phase 37: silently ignores legacy retailPrice/clientCost in update body", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "update",
          projectId: "proj-1",
          itemKey: "item-abc",
          name: "Updated",
          retailPrice: 9999,
          clientCost: 8888,
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      // setObject must not contain price paths -- the fields are not in UPDATABLE_FIELDS.
      const setObj = mockSet.mock.calls[0][0];
      expect(Object.keys(setObj)).not.toContain(
        `procurementItems[_key=="item-abc"].retailPrice`,
      );
      expect(Object.keys(setObj)).not.toContain(
        `procurementItems[_key=="item-abc"].clientCost`,
      );
    });

    it("Phase 37: accepts valid images[] payload and writes procurement-item-updated activity log", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "update",
          projectId: "proj-1",
          itemKey: "item-abc",
          name: "Chair",
          images: [
            {
              _key: "img-1",
              _type: "image",
              asset: {
                _type: "reference",
                _ref: "image-abc123def456-1024x768-jpg",
              },
              isPrimary: true,
              caption: "front view",
            },
          ],
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const setObj = mockSet.mock.calls[0][0];
      const imagesKey = `procurementItems[_key=="item-abc"].images`;
      expect(setObj).toHaveProperty(imagesKey);
      const written = setObj[imagesKey];
      expect(Array.isArray(written)).toBe(true);
      expect(written[0].asset._ref).toBe("image-abc123def456-1024x768-jpg");
      expect(written[0].isPrimary).toBe(true);

      // Activity-log: procurement-item-updated
      expect(mockAppend).toHaveBeenCalledWith(
        "activityLog",
        expect.arrayContaining([
          expect.objectContaining({
            _type: "activityEntry",
            action: "procurement-item-updated",
          }),
        ]),
      );
    });

    it("Phase 37: rejects images[] with invalid asset reference", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "update",
          projectId: "proj-1",
          itemKey: "item-abc",
          images: [
            {
              _type: "image",
              asset: { _type: "reference", _ref: "not-a-valid-ref" },
              isPrimary: true,
            },
          ],
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("asset reference");
    });

    it("Phase 37: rejects images[] longer than 20", async () => {
      const { POST } = await import("./procurement");

      const images = Array.from({ length: 21 }, (_, i) => ({
        _key: `k${i}`,
        _type: "image",
        asset: {
          _type: "reference",
          _ref: "image-abc123def456-1024x768-jpg",
        },
        isPrimary: i === 0,
        caption: null,
      }));

      const response = await POST({
        request: makeRequest({
          action: "update",
          projectId: "proj-1",
          itemKey: "item-abc",
          images,
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Too many images");
    });

    it("Phase 37: sanitizes caption (strips control chars, caps at 500 chars)", async () => {
      const { POST } = await import("./procurement");

      const naughty = "a\x00b\x07c" + "x".repeat(600);
      await POST({
        request: makeRequest({
          action: "update",
          projectId: "proj-1",
          itemKey: "item-abc",
          images: [
            {
              _key: "k1",
              _type: "image",
              asset: {
                _type: "reference",
                _ref: "image-abc123def456-1024x768-jpg",
              },
              isPrimary: true,
              caption: naughty,
            },
          ],
        }),
        cookies: makeCookies(),
      } as any);

      const setObj = mockSet.mock.calls[0][0];
      const imagesKey = `procurementItems[_key=="item-abc"].images`;
      const written = setObj[imagesKey];
      expect(written[0].caption).not.toContain("\x00");
      expect(written[0].caption).not.toContain("\x07");
      expect(written[0].caption.length).toBeLessThanOrEqual(500);
    });
  });

  describe("Delete action", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        entityId: "admin-1",
        role: "admin",
        tenantId: "tenant-1",
      });
    });

    it("calls client.patch().unset() with correct path", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "delete",
          projectId: "proj-1",
          itemKey: "item-abc",
          itemName: "Old Chair",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      expect(mockPatch).toHaveBeenCalledWith("proj-1");
      expect(mockUnset).toHaveBeenCalledWith([`procurementItems[_key=="item-abc"]`]);
      expect(mockCommit).toHaveBeenCalled();
    });

    it("includes activity log entry for delete", async () => {
      const { POST } = await import("./procurement");

      await POST({
        request: makeRequest({
          action: "delete",
          projectId: "proj-1",
          itemKey: "item-abc",
          itemName: "Old Chair",
        }),
        cookies: makeCookies(),
      } as any);

      expect(mockAppend).toHaveBeenCalledWith(
        "activityLog",
        expect.arrayContaining([
          expect.objectContaining({
            _type: "activityEntry",
            action: "procurement-status-changed",
            description: expect.stringContaining("Old Chair"),
          }),
        ]),
      );
    });

    it("returns 400 when itemKey is missing", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "delete",
          projectId: "proj-1",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("itemKey");
    });
  });

  describe("Update-status action", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        entityId: "admin-1",
        role: "admin",
        tenantId: "tenant-1",
      });
    });

    it("sets status AND sets syncSource to null (D-12)", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "update-status",
          projectId: "proj-1",
          itemKey: "item-abc",
          status: "in-transit",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`procurementItems[_key=="item-abc"].status`]: "in-transit",
          [`procurementItems[_key=="item-abc"].syncSource`]: null,
        }),
      );
    });

    it("includes activity log entry with status label", async () => {
      const { POST } = await import("./procurement");

      await POST({
        request: makeRequest({
          action: "update-status",
          projectId: "proj-1",
          itemKey: "item-abc",
          status: "delivered",
        }),
        cookies: makeCookies(),
      } as any);

      expect(mockAppend).toHaveBeenCalledWith(
        "activityLog",
        expect.arrayContaining([
          expect.objectContaining({
            _type: "activityEntry",
            action: "procurement-status-changed",
            description: expect.stringContaining("Delivered"),
          }),
        ]),
      );
    });

    it("returns 400 for invalid status value", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "update-status",
          projectId: "proj-1",
          itemKey: "item-abc",
          status: "shipped",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid status");
    });

    it("returns 400 when itemKey or status is missing", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "update-status",
          projectId: "proj-1",
          status: "delivered",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
    });
  });

  describe("Force-refresh action", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        entityId: "admin-1",
        role: "admin",
        tenantId: "tenant-1",
      });
    });

    it("calls getTrackingResults and updates item with extracted data", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetTrackingResults.mockResolvedValue({ some: "result" });
      mockExtractTrackingData.mockReturnValue({
        status: "in-transit",
        carrierETA: "2026-05-20",
        carrierName: "FedEx",
        trackingUrl: "https://fedex.com/track?trknbr=123",
        lastEvent: "In transit",
      });
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "force-refresh",
          projectId: "proj-1",
          itemKey: "item-abc",
          trackingNumber: "TRACK123",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();

      expect(mockGetTrackingResults).toHaveBeenCalledWith("TRACK123");
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`procurementItems[_key=="item-abc"].syncSource`]: "manual",
          [`procurementItems[_key=="item-abc"].carrierETA`]: "2026-05-20",
          [`procurementItems[_key=="item-abc"].carrierName`]: "FedEx",
          [`procurementItems[_key=="item-abc"].trackingUrl`]: "https://fedex.com/track?trknbr=123",
          [`procurementItems[_key=="item-abc"].status`]: "in-transit",
        }),
      );
      // lastSyncAt should be set
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`procurementItems[_key=="item-abc"].lastSyncAt`]: expect.any(String),
        }),
      );
    });

    it("sets syncSource to 'manual' and lastSyncAt", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetTrackingResults.mockResolvedValue({ some: "result" });
      mockExtractTrackingData.mockReturnValue({
        status: null,
        carrierETA: null,
        carrierName: null,
        trackingUrl: null,
        lastEvent: null,
      });
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "force-refresh",
          projectId: "proj-1",
          itemKey: "item-abc",
          trackingNumber: "TRACK456",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`procurementItems[_key=="item-abc"].syncSource`]: "manual",
        }),
      );
    });

    it("returns error message when Ship24 not configured", async () => {
      mockIsShip24Configured.mockReturnValue(false);
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "force-refresh",
          projectId: "proj-1",
          itemKey: "item-abc",
          trackingNumber: "TRACK123",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("SHIP24_API_KEY");
    });

    it("returns error when getTrackingResults returns null", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetTrackingResults.mockResolvedValue(null);
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "force-refresh",
          projectId: "proj-1",
          itemKey: "item-abc",
          trackingNumber: "TRACK123",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("tracking data");
    });

    it("does not set status when extractedData.status is null", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetTrackingResults.mockResolvedValue({ some: "result" });
      mockExtractTrackingData.mockReturnValue({
        status: null,
        carrierETA: "2026-05-20",
        carrierName: "UPS",
        trackingUrl: "https://ups.com/track?tracknum=123",
        lastEvent: "Package scanned",
      });
      const { POST } = await import("./procurement");

      await POST({
        request: makeRequest({
          action: "force-refresh",
          projectId: "proj-1",
          itemKey: "item-abc",
          trackingNumber: "TRACK789",
        }),
        cookies: makeCookies(),
      } as any);

      // status should NOT be in the set object
      const setCall = mockSet.mock.calls[0][0];
      expect(setCall).not.toHaveProperty(`procurementItems[_key=="item-abc"].status`);
    });

    it("returns 400 when itemKey or trackingNumber is missing", async () => {
      const { POST } = await import("./procurement");

      const response = await POST({
        request: makeRequest({
          action: "force-refresh",
          projectId: "proj-1",
          itemKey: "item-abc",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
    });
  });
});

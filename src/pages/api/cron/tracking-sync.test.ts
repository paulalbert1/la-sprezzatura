import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock tenant client module
const mockCommit = vi.fn().mockResolvedValue({});
const mockSet = vi.fn().mockReturnThis();
const mockPatch = vi.fn().mockReturnValue({
  set: mockSet,
  commit: mockCommit,
});
const mockTenantClient = {
  patch: mockPatch,
};
vi.mock("../../../lib/tenantClient", () => ({
  getTenantClient: vi.fn().mockReturnValue(mockTenantClient),
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

// Mock sanity queries module
const mockGetAdminProcurementCronData = vi.fn();
vi.mock("../../../sanity/queries", () => ({
  getAdminProcurementCronData: mockGetAdminProcurementCronData,
}));

// Helper to create a GET request with authorization header
function makeRequest(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }
  return new Request("http://localhost/api/cron/tracking-sync", {
    method: "GET",
    headers,
  });
}

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  process.env.CRON_SECRET = "test-secret";

  // Reset chainable mocks
  mockSet.mockReturnThis();
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue({
    set: mockSet,
    commit: mockCommit,
  });
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("GET /api/cron/tracking-sync", () => {
  describe("Authentication", () => {
    it("returns 401 when Authorization header is missing", async () => {
      const { GET } = await import("./tracking-sync");

      const response = await GET({
        request: makeRequest(),
      } as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 401 when Bearer token is wrong", async () => {
      const { GET } = await import("./tracking-sync");

      const response = await GET({
        request: makeRequest("wrong-secret"),
      } as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("proceeds to sync when valid CRON_SECRET is provided", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetAdminProcurementCronData.mockResolvedValue([]);
      const { GET } = await import("./tracking-sync");

      const response = await GET({
        request: makeRequest("test-secret"),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe("complete");
    });
  });

  describe("Ship24 configuration check", () => {
    it("returns 200 with skipped message when Ship24 not configured", async () => {
      mockIsShip24Configured.mockReturnValue(false);
      const { GET } = await import("./tracking-sync");

      const response = await GET({
        request: makeRequest("test-secret"),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe("skipped");
      expect(body.reason).toContain("SHIP24_API_KEY");
    });
  });

  describe("Sync logic", () => {
    it("queries all active projects via getAdminProcurementCronData", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetAdminProcurementCronData.mockResolvedValue([]);
      const { GET } = await import("./tracking-sync");

      await GET({
        request: makeRequest("test-secret"),
      } as any);

      expect(mockGetAdminProcurementCronData).toHaveBeenCalledWith(mockTenantClient);
    });

    it("calls getTrackingResults for each trackable item", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetAdminProcurementCronData.mockResolvedValue([
        {
          _id: "proj-1",
          trackableItems: [
            { _key: "item-1", trackingNumber: "TRACK001", status: "ordered", lastSyncAt: null },
            { _key: "item-2", trackingNumber: "TRACK002", status: "in-transit", lastSyncAt: null },
          ],
        },
      ]);
      mockGetTrackingResults.mockResolvedValue({ some: "result" });
      mockExtractTrackingData.mockReturnValue({
        status: "in-transit",
        carrierETA: "2026-05-20",
        carrierName: "FedEx",
        trackingUrl: "https://fedex.com/track",
        lastEvent: "In transit",
      });
      const { GET } = await import("./tracking-sync");

      await GET({
        request: makeRequest("test-secret"),
      } as any);

      expect(mockGetTrackingResults).toHaveBeenCalledWith("TRACK001");
      expect(mockGetTrackingResults).toHaveBeenCalledWith("TRACK002");
      expect(mockGetTrackingResults).toHaveBeenCalledTimes(2);
    });

    it("skips items where lastSyncAt is within 12 hours", async () => {
      const recentSync = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(); // 6 hours ago
      mockIsShip24Configured.mockReturnValue(true);
      mockGetAdminProcurementCronData.mockResolvedValue([
        {
          _id: "proj-1",
          trackableItems: [
            { _key: "item-1", trackingNumber: "TRACK001", status: "ordered", lastSyncAt: recentSync },
            { _key: "item-2", trackingNumber: "TRACK002", status: "in-transit", lastSyncAt: null },
          ],
        },
      ]);
      mockGetTrackingResults.mockResolvedValue({ some: "result" });
      mockExtractTrackingData.mockReturnValue({
        status: null,
        carrierETA: null,
        carrierName: null,
        trackingUrl: null,
        lastEvent: null,
      });
      const { GET } = await import("./tracking-sync");

      const response = await GET({
        request: makeRequest("test-secret"),
      } as any);

      // Only item-2 should be synced (item-1 was recently synced)
      expect(mockGetTrackingResults).toHaveBeenCalledTimes(1);
      expect(mockGetTrackingResults).toHaveBeenCalledWith("TRACK002");

      const body = await response.json();
      expect(body.skipped).toBe(1);
    });

    it("on Ship24 failure for an item, logs warning and continues with next item (D-08)", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetAdminProcurementCronData.mockResolvedValue([
        {
          _id: "proj-1",
          trackableItems: [
            { _key: "item-1", trackingNumber: "FAIL001", status: "ordered", lastSyncAt: null },
            { _key: "item-2", trackingNumber: "TRACK002", status: "in-transit", lastSyncAt: null },
          ],
        },
      ]);
      mockGetTrackingResults
        .mockResolvedValueOnce(null) // first item fails
        .mockResolvedValueOnce({ some: "result" }); // second succeeds
      mockExtractTrackingData.mockReturnValue({
        status: "in-transit",
        carrierETA: "2026-05-20",
        carrierName: "FedEx",
        trackingUrl: null,
        lastEvent: "In transit",
      });
      const { GET } = await import("./tracking-sync");

      const response = await GET({
        request: makeRequest("test-secret"),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.synced).toBe(1);
      expect(body.failed).toBe(1);
    });

    it("updates item with status, carrierETA, carrierName, trackingUrl, lastSyncAt, syncSource=cron", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetAdminProcurementCronData.mockResolvedValue([
        {
          _id: "proj-1",
          trackableItems: [
            { _key: "item-1", trackingNumber: "TRACK001", status: "ordered", lastSyncAt: null },
          ],
        },
      ]);
      mockGetTrackingResults.mockResolvedValue({ some: "result" });
      mockExtractTrackingData.mockReturnValue({
        status: "in-transit",
        carrierETA: "2026-05-20",
        carrierName: "FedEx",
        trackingUrl: "https://fedex.com/track?trknbr=TRACK001",
        lastEvent: "In transit",
      });
      const { GET } = await import("./tracking-sync");

      await GET({
        request: makeRequest("test-secret"),
      } as any);

      expect(mockPatch).toHaveBeenCalledWith("proj-1");
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`procurementItems[_key=="item-1"].carrierETA`]: "2026-05-20",
          [`procurementItems[_key=="item-1"].carrierName`]: "FedEx",
          [`procurementItems[_key=="item-1"].trackingUrl`]: "https://fedex.com/track?trknbr=TRACK001",
          [`procurementItems[_key=="item-1"].syncSource`]: "cron",
          [`procurementItems[_key=="item-1"].status`]: "in-transit",
        }),
      );
      // lastSyncAt should be set (ISO string)
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`procurementItems[_key=="item-1"].lastSyncAt`]: expect.any(String),
        }),
      );
    });

    it("only updates status if extractTrackingData returns non-null status", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetAdminProcurementCronData.mockResolvedValue([
        {
          _id: "proj-1",
          trackableItems: [
            { _key: "item-1", trackingNumber: "TRACK001", status: "ordered", lastSyncAt: null },
          ],
        },
      ]);
      mockGetTrackingResults.mockResolvedValue({ some: "result" });
      mockExtractTrackingData.mockReturnValue({
        status: null,
        carrierETA: "2026-05-20",
        carrierName: "UPS",
        trackingUrl: null,
        lastEvent: null,
      });
      const { GET } = await import("./tracking-sync");

      await GET({
        request: makeRequest("test-secret"),
      } as any);

      const setCall = mockSet.mock.calls[0][0];
      expect(setCall).not.toHaveProperty(`procurementItems[_key=="item-1"].status`);
      expect(setCall).toHaveProperty(`procurementItems[_key=="item-1"].syncSource`, "cron");
    });

    it("returns summary with synced count and skipped count", async () => {
      mockIsShip24Configured.mockReturnValue(true);
      mockGetAdminProcurementCronData.mockResolvedValue([]);
      const { GET } = await import("./tracking-sync");

      const response = await GET({
        request: makeRequest("test-secret"),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty("status", "complete");
      expect(body).toHaveProperty("synced");
      expect(body).toHaveProperty("skipped");
      expect(body).toHaveProperty("failed");
      expect(body).toHaveProperty("total");
    });
  });
});

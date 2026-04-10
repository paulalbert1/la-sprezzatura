import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Ship24TrackingResult } from "./ship24";

// Store original env
const originalEnv = { ...process.env };

describe("ship24", () => {
  beforeEach(() => {
    process.env.SHIP24_API_KEY = "test-key-abc123";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("isShip24Configured", () => {
    it("returns true when SHIP24_API_KEY is set", async () => {
      const { isShip24Configured } = await import("./ship24");
      expect(isShip24Configured()).toBe(true);
    });

    it("returns false when SHIP24_API_KEY is empty", async () => {
      process.env.SHIP24_API_KEY = "";
      const { isShip24Configured } = await import("./ship24");
      expect(isShip24Configured()).toBe(false);
    });

    it("returns false when SHIP24_API_KEY is undefined", async () => {
      delete process.env.SHIP24_API_KEY;
      const { isShip24Configured } = await import("./ship24");
      expect(isShip24Configured()).toBe(false);
    });
  });

  describe("mapShip24Status", () => {
    let mapShip24Status: (status: string) => string | null;

    beforeEach(async () => {
      const mod = await import("./ship24");
      mapShip24Status = mod.mapShip24Status;
    });

    it('maps "info_received" to "ordered"', () => {
      expect(mapShip24Status("info_received")).toBe("ordered");
    });

    it('maps "in_transit" to "in-transit"', () => {
      expect(mapShip24Status("in_transit")).toBe("in-transit");
    });

    it('maps "out_for_delivery" to "in-transit"', () => {
      expect(mapShip24Status("out_for_delivery")).toBe("in-transit");
    });

    it('maps "available_for_pickup" to "warehouse"', () => {
      expect(mapShip24Status("available_for_pickup")).toBe("warehouse");
    });

    it('maps "delivered" to "delivered"', () => {
      expect(mapShip24Status("delivered")).toBe("delivered");
    });

    it('maps "pending" to null (no status change)', () => {
      expect(mapShip24Status("pending")).toBeNull();
    });

    it('maps "exception" to null (no auto-change)', () => {
      expect(mapShip24Status("exception")).toBeNull();
    });

    it('maps "failed_attempt" to "in-transit"', () => {
      expect(mapShip24Status("failed_attempt")).toBe("in-transit");
    });

    it("maps unknown values to null", () => {
      expect(mapShip24Status("some_unknown_status")).toBeNull();
    });
  });

  describe("extractTrackingData", () => {
    let extractTrackingData: (result: Ship24TrackingResult) => import("./ship24").ExtractedTrackingData;

    beforeEach(async () => {
      const mod = await import("./ship24");
      extractTrackingData = mod.extractTrackingData;
    });

    const makeResult = (overrides?: Partial<Ship24TrackingResult>): Ship24TrackingResult => ({
      tracker: {
        trackerId: "tracker-123",
        trackingNumber: "1Z999AA10123456784",
        courierCode: ["ups"],
      },
      shipment: {
        statusMilestone: "in_transit",
        statusCode: null,
        delivery: {
          estimatedDeliveryDate: "2026-04-15T00:00:00Z",
          courierEstimatedDeliveryDate: null,
          service: "Ground",
        },
      },
      events: [
        {
          eventId: "evt-1",
          status: "Package in transit",
          occurrenceDatetime: "2026-04-10T14:00:00Z",
          statusMilestone: "in_transit",
          courierCode: "ups",
          location: "New York, NY",
        },
      ],
      ...overrides,
    });

    it("extracts status, carrierETA, carrierName, trackingUrl, and lastEvent", () => {
      const result = extractTrackingData(makeResult());
      expect(result.status).toBe("in-transit");
      expect(result.carrierETA).toBe("2026-04-15");
      expect(result.carrierName).toBe("UPS");
      expect(result.trackingUrl).toBe(
        "https://www.ups.com/track?tracknum=1Z999AA10123456784",
      );
      expect(result.lastEvent).toBe("Package in transit");
    });

    it("returns null carrierETA when estimatedDeliveryDate is absent", () => {
      const result = extractTrackingData(
        makeResult({
          shipment: {
            statusMilestone: "in_transit",
            statusCode: null,
            delivery: {
              estimatedDeliveryDate: null,
              courierEstimatedDeliveryDate: null,
              service: null,
            },
          },
        }),
      );
      expect(result.carrierETA).toBeNull();
    });

    it("falls back to courierEstimatedDeliveryDate.to when estimatedDeliveryDate is null", () => {
      const result = extractTrackingData(
        makeResult({
          shipment: {
            statusMilestone: "in_transit",
            statusCode: null,
            delivery: {
              estimatedDeliveryDate: null,
              courierEstimatedDeliveryDate: {
                from: "2026-04-14T00:00:00Z",
                to: "2026-04-16T00:00:00Z",
              },
              service: null,
            },
          },
        }),
      );
      expect(result.carrierETA).toBe("2026-04-16");
    });

    it("returns null carrierName when courierCode is empty", () => {
      const result = extractTrackingData(
        makeResult({
          tracker: {
            trackerId: "tracker-123",
            trackingNumber: "ABC123",
            courierCode: [],
          },
        }),
      );
      expect(result.carrierName).toBeNull();
    });

    it("capitalizes FedEx carrier name correctly", () => {
      const result = extractTrackingData(
        makeResult({
          tracker: {
            trackerId: "tracker-123",
            trackingNumber: "123456789012",
            courierCode: ["fedex"],
          },
        }),
      );
      expect(result.carrierName).toBe("FedEx");
    });

    it("returns null trackingUrl for unknown carriers", () => {
      const result = extractTrackingData(
        makeResult({
          tracker: {
            trackerId: "tracker-123",
            trackingNumber: "XYZ123",
            courierCode: ["ontrac"],
          },
        }),
      );
      expect(result.trackingUrl).toBeNull();
    });

    it("returns null lastEvent when events array is empty", () => {
      const result = extractTrackingData(makeResult({ events: [] }));
      expect(result.lastEvent).toBeNull();
    });
  });

  describe("createAndTrack", () => {
    let createAndTrack: (trackingNumber: string) => Promise<Ship24TrackingResult | null>;

    beforeEach(async () => {
      const mod = await import("./ship24");
      createAndTrack = mod.createAndTrack;
    });

    it("calls POST with correct URL and headers", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              trackings: [
                {
                  tracker: { trackerId: "t1", trackingNumber: "1Z123", courierCode: ["ups"] },
                  shipment: {
                    statusMilestone: "in_transit",
                    statusCode: null,
                    delivery: { estimatedDeliveryDate: null, courierEstimatedDeliveryDate: null, service: null },
                  },
                  events: [],
                },
              ],
            },
          }),
      };
      const fetchSpy = vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

      const result = await createAndTrack("1Z123");
      expect(fetch).toHaveBeenCalledWith(
        "https://api.ship24.com/public/v1/trackers/track",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-key-abc123",
          }),
        }),
      );
      expect(result).not.toBeNull();
      expect(result?.tracker.trackingNumber).toBe("1Z123");
    });

    it("returns null on non-ok response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
      const result = await createAndTrack("BAD123");
      expect(result).toBeNull();
    });
  });

  describe("getTrackingResults", () => {
    let getTrackingResults: (trackingNumber: string) => Promise<Ship24TrackingResult | null>;

    beforeEach(async () => {
      const mod = await import("./ship24");
      getTrackingResults = mod.getTrackingResults;
    });

    it("calls GET with correct URL and headers", async () => {
      const trackingResult = {
        tracker: { trackerId: "t1", trackingNumber: "1Z456", courierCode: ["ups"] },
        shipment: {
          statusMilestone: "delivered",
          statusCode: null,
          delivery: { estimatedDeliveryDate: null, courierEstimatedDeliveryDate: null, service: null },
        },
        events: [],
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ data: { trackings: [trackingResult] } }),
        }),
      );

      const result = await getTrackingResults("1Z456");
      expect(fetch).toHaveBeenCalledWith(
        "https://api.ship24.com/public/v1/trackers/search/1Z456/results",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-key-abc123",
          }),
        }),
      );
      expect(result?.shipment.statusMilestone).toBe("delivered");
    });

    it("returns null on non-ok response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
      const result = await getTrackingResults("NOTFOUND");
      expect(result).toBeNull();
    });

    it("falls back to createAndTrack when results are empty", async () => {
      // First call (GET search) returns empty, second call (POST track) returns data
      const trackingResult = {
        tracker: { trackerId: "t1", trackingNumber: "NEW123", courierCode: ["fedex"] },
        shipment: {
          statusMilestone: "info_received",
          statusCode: null,
          delivery: { estimatedDeliveryDate: null, courierEstimatedDeliveryDate: null, service: null },
        },
        events: [],
      };
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { trackings: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { trackings: [trackingResult] } }),
        });
      vi.stubGlobal("fetch", fetchMock);

      const result = await getTrackingResults("NEW123");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result?.shipment.statusMilestone).toBe("info_received");
    });
  });
});

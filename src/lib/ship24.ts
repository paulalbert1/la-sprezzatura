/**
 * Ship24 API client for tracking aggregation.
 * Server-side only -- never import in client components.
 *
 * @see https://docs.ship24.com/trackers
 */

const SHIP24_BASE = "https://api.ship24.com/public/v1";

// -- Types --

export interface Ship24TrackingResult {
  tracker: {
    trackerId: string;
    trackingNumber: string;
    courierCode: string[];
  };
  shipment: {
    statusMilestone: string;
    statusCode: string | null;
    delivery: {
      estimatedDeliveryDate: string | null;
      courierEstimatedDeliveryDate: {
        from: string | null;
        to: string | null;
      } | null;
      service: string | null;
    };
  };
  events: Array<{
    eventId: string;
    status: string | null;
    occurrenceDatetime: string;
    statusMilestone: string;
    courierCode: string | null;
    location: string | null;
  }>;
}

export interface ExtractedTrackingData {
  /** Mapped project status or null if no change */
  status: string | null;
  /** ISO date string (YYYY-MM-DD) */
  carrierETA: string | null;
  /** Human-readable carrier name from courierCode */
  carrierName: string | null;
  /** Direct tracking URL if available */
  trackingUrl: string | null;
  /** Latest event description */
  lastEvent: string | null;
}

// -- Tracking URL patterns (mirrors src/lib/trackingUrl.ts) --

const TRACKING_URLS: Record<string, string> = {
  ups: "https://www.ups.com/track?tracknum=",
  fedex: "https://www.fedex.com/fedextrack/?trknbr=",
  usps: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
};

// -- Carrier name formatting --

const CARRIER_DISPLAY_NAMES: Record<string, string> = {
  ups: "UPS",
  fedex: "FedEx",
  usps: "USPS",
  dhl: "DHL",
};

function formatCarrierName(courierCode: string): string {
  return (
    CARRIER_DISPLAY_NAMES[courierCode.toLowerCase()] ||
    courierCode.toUpperCase()
  );
}

// -- Status Mapping --

const STATUS_MAP: Record<string, string | null> = {
  info_received: "ordered",
  in_transit: "in-transit",
  out_for_delivery: "in-transit",
  available_for_pickup: "warehouse",
  delivered: "delivered",
  failed_attempt: "in-transit",
  pending: null,
  exception: null,
};

/**
 * Map a Ship24 statusMilestone to a project procurement status.
 * Returns null when the status should not trigger an auto-update.
 */
export function mapShip24Status(statusMilestone: string): string | null {
  if (statusMilestone === "exception") {
    console.warn(
      `[ship24] Exception status received -- no auto-change applied`,
    );
  }
  return STATUS_MAP[statusMilestone] ?? null;
}

// -- Configuration --

/** Check if Ship24 API key is configured */
export function isShip24Configured(): boolean {
  return !!process.env.SHIP24_API_KEY;
}

// -- API Helpers --

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.SHIP24_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// -- API Functions --

/**
 * Create a tracker and get initial tracking results.
 * Use for first-time lookups of a tracking number.
 */
export async function createAndTrack(
  trackingNumber: string,
): Promise<Ship24TrackingResult | null> {
  try {
    const res = await fetch(`${SHIP24_BASE}/trackers/track`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ trackingNumber }),
    });
    if (!res.ok) {
      console.error(
        `[ship24] createAndTrack failed: ${res.status}`,
      );
      return null;
    }
    const json = await res.json();
    return json.data?.trackings?.[0] ?? null;
  } catch (err) {
    console.error(`[ship24] createAndTrack error:`, err);
    return null;
  }
}

/**
 * Get tracking results for a previously registered tracking number.
 * Falls back to createAndTrack if the tracker doesn't exist yet.
 */
export async function getTrackingResults(
  trackingNumber: string,
): Promise<Ship24TrackingResult | null> {
  try {
    const res = await fetch(
      `${SHIP24_BASE}/trackers/search/${encodeURIComponent(trackingNumber)}/results`,
      { headers: getHeaders() },
    );
    if (!res.ok) {
      console.error(
        `[ship24] getTrackingResults failed: ${res.status}`,
      );
      return null;
    }
    const json = await res.json();
    const result = json.data?.trackings?.[0] ?? null;

    // If no results, the tracker may not exist yet -- fall back to create
    if (!result) {
      return createAndTrack(trackingNumber);
    }
    return result;
  } catch (err) {
    console.error(`[ship24] getTrackingResults error:`, err);
    return null;
  }
}

/**
 * Extract structured tracking data from a Ship24 result.
 */
export function extractTrackingData(
  result: Ship24TrackingResult,
): ExtractedTrackingData {
  const status = mapShip24Status(result.shipment.statusMilestone);

  // Extract ETA: prefer estimatedDeliveryDate, fall back to courierEstimatedDeliveryDate.to
  let carrierETA: string | null = null;
  const rawETA = result.shipment.delivery.estimatedDeliveryDate;
  const courierETA =
    result.shipment.delivery.courierEstimatedDeliveryDate?.to;

  if (rawETA) {
    carrierETA = rawETA.split("T")[0]; // Extract YYYY-MM-DD
  } else if (courierETA) {
    carrierETA = courierETA.split("T")[0];
  }

  // Extract carrier name
  const firstCourier = result.tracker.courierCode[0];
  const carrierName = firstCourier ? formatCarrierName(firstCourier) : null;

  // Build tracking URL from known carriers
  let trackingUrl: string | null = null;
  if (firstCourier) {
    const baseUrl = TRACKING_URLS[firstCourier.toLowerCase()];
    if (baseUrl) {
      trackingUrl = `${baseUrl}${result.tracker.trackingNumber}`;
    }
  }

  // Latest event
  const lastEvent = result.events[0]?.status ?? null;

  return {
    status,
    carrierETA,
    carrierName,
    trackingUrl,
    lastEvent,
  };
}

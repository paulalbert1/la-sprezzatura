export type TrackingInfo = {
  carrier: "ups" | "fedex" | "usps" | "unknown";
  url: string | null;
};

const UPS_RE = /^1Z[A-Z0-9]{16}$/i;
const FEDEX_RE = /^\d{12,22}$/;
const USPS_NUMERIC_RE = /^\d{20,34}$/;
const USPS_ALPHA_RE = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

const TRACKING_URLS = {
  ups: "https://www.ups.com/track?tracknum=",
  fedex: "https://www.fedex.com/fedextrack/?trknbr=",
  usps: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
} as const;

/**
 * Detect shipping carrier from a tracking number and return
 * the carrier name plus a tracking URL.
 * Whitespace is stripped before matching.
 */
export function getTrackingInfo(trackingNumber: string): TrackingInfo {
  const cleaned = trackingNumber.replace(/\s+/g, "");

  if (UPS_RE.test(cleaned)) {
    return { carrier: "ups", url: `${TRACKING_URLS.ups}${cleaned}` };
  }

  if (USPS_NUMERIC_RE.test(cleaned) || USPS_ALPHA_RE.test(cleaned)) {
    return { carrier: "usps", url: `${TRACKING_URLS.usps}${cleaned}` };
  }

  if (FEDEX_RE.test(cleaned)) {
    return { carrier: "fedex", url: `${TRACKING_URLS.fedex}${cleaned}` };
  }

  return { carrier: "unknown", url: null };
}

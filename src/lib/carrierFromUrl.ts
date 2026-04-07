export interface CarrierInfo {
  carrier: string;
  label: string;
}

/**
 * Detect shipping carrier from a tracking URL domain.
 * Returns carrier identifier and display label, or null if URL is invalid.
 */
export function getCarrierFromUrl(trackingUrl: string): CarrierInfo | null {
  if (!trackingUrl) return null;
  try {
    const hostname = new URL(trackingUrl).hostname.toLowerCase();
    if (hostname.includes("fedex.com")) return { carrier: "fedex", label: "FedEx" };
    if (hostname.includes("ups.com")) return { carrier: "ups", label: "UPS" };
    if (hostname.includes("usps.com")) return { carrier: "usps", label: "USPS" };
    if (hostname.includes("dhl.com")) return { carrier: "dhl", label: "DHL" };
    return { carrier: "unknown", label: "Track" };
  } catch {
    return null;
  }
}

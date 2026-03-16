import { describe, it, expect } from "vitest";
import { getTrackingInfo } from "./trackingUrl";

describe("getTrackingInfo", () => {
  it("detects UPS tracking number", () => {
    const result = getTrackingInfo("1Z999AA10123456784");
    expect(result.carrier).toBe("ups");
    expect(result.url).toBe(
      "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    );
  });

  it("detects FedEx tracking number", () => {
    const result = getTrackingInfo("123456789012");
    expect(result.carrier).toBe("fedex");
    expect(result.url).toContain("fedextrack");
  });

  it("detects USPS tracking number", () => {
    const result = getTrackingInfo("92055901755477000000000000");
    expect(result.carrier).toBe("usps");
    expect(result.url).toContain("TrackConfirmAction");
  });

  it("returns unknown for invalid tracking number", () => {
    const result = getTrackingInfo("INVALID");
    expect(result.carrier).toBe("unknown");
    expect(result.url).toBeNull();
  });

  it("handles spaces in tracking number", () => {
    const result = getTrackingInfo("1Z 999 AA1 0123456784");
    expect(result.carrier).toBe("ups");
    expect(result.url).toBe(
      "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    );
  });
});

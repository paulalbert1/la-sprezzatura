// src/lib/portal/portalBrand.ts
//
// Portal-side brand strings sourced from siteSettings. Mirrors the
// shape getTenantBrand() returns for emails, but adds the fields the
// portal renders (page title display name + mailto contact) and drops
// the email-only signoff/location fields.
//
// v5.3 single-tenant. v6.0 multi-tenant work would change this to
// getPortalBrand(tenantId); the call sites already pass through this
// function so the swap is a one-place change.

import type { SanityClient } from "@sanity/client";

export interface PortalBrand {
  /** Uppercased siteTitle for header + footer wordmark renders. */
  wordmark: string;
  /** As-stored siteTitle for page titles (e.g. "Dashboard | La Sprezzatura"). */
  displayName: string;
  /** mailto: target for portal footers + form error messages. */
  contactEmail: string;
}

// Safe defaults match the long-standing single-tenant literals so an
// empty siteSettings doc (or a Sanity outage) still renders sensible
// strings instead of an empty wordmark / mailto.
export const DEFAULT_PORTAL_BRAND: PortalBrand = {
  wordmark: "LA SPREZZATURA",
  displayName: "La Sprezzatura",
  contactEmail: "office@lasprezz.com",
};

interface SiteSettingsRow {
  siteTitle?: string | null;
  contactEmail?: string | null;
}

export async function getPortalBrand(
  client: SanityClient,
): Promise<PortalBrand> {
  let row: SiteSettingsRow | null = null;
  try {
    row = (await client.fetch(
      `*[_type == "siteSettings"][0]{ siteTitle, contactEmail }`,
    )) as SiteSettingsRow | null;
  } catch {
    return DEFAULT_PORTAL_BRAND;
  }

  const siteTitle = row?.siteTitle?.trim() || DEFAULT_PORTAL_BRAND.displayName;
  const contactEmail =
    row?.contactEmail?.trim() || DEFAULT_PORTAL_BRAND.contactEmail;

  return {
    wordmark: siteTitle.toUpperCase(),
    displayName: siteTitle,
    contactEmail,
  };
}

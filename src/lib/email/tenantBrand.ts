// src/lib/email/tenantBrand.ts
// Phase 46-04 -- closed-enum signature register (D-29).
//
// v5.3 hardcodes a single tenant for tests + safe fallback. Production code
// reads from siteSettings (Sanity) via getTenantBrand() so the signoff name,
// location, and wordmark are admin-editable in /admin/settings without a
// code change. v6.0 multi-tenant work makes the resolver per-tenant.
//
// Pattern: sibling of src/lib/email/system.ts.
//
// Schema note: a closed-enum register (formal | casual) replaces the prior
// single-field signoffName so SendUpdate (formal) and WorkOrder (casual)
// CAN render different signature lines without a per-template branch in
// EmailShell. As of the Settings-driven rewrite, both registers resolve to
// the same Settings string by design (one input field per the operator's
// explicit ask) -- the enum stays for forward-compat with v6.0 if a tenant
// later wants distinct registers.

import type { SanityClient } from "@sanity/client";

export interface TenantBrand {
  wordmark: string;
  signoffNameFormal: string;   // SendUpdate (signoffStyle="formal")
  signoffNameCasual: string;   // WorkOrder  (signoffStyle="casual" default)
  signoffLocation: string;
}

// Test-fixture default. Production paths call getTenantBrand() and only
// fall back to this if Sanity is unreachable. Kept at module scope so
// fixtures.shared.ts and existing snapshot baselines stay byte-identical.
export const LA_SPREZZATURA_TENANT: TenantBrand = {
  wordmark: "LA SPREZZATURA",
  signoffNameFormal: "Elizabeth Lewis",
  signoffNameCasual: "Elizabeth",
  signoffLocation: "Darien, CT",
};

/** v5.3 single-tenant accessor. v6.0 will replace with `getTenantBrand(tenantId)`. */
export function getDefaultTenantBrand(): TenantBrand {
  return LA_SPREZZATURA_TENANT;
}

interface TenantBrandSiteSettingsRow {
  siteTitle?: string | null;
  signoffName?: string | null;
  studioLocation?: string | null;
}

/**
 * Resolve the production TenantBrand from siteSettings.
 *
 * - wordmark <- siteTitle (uppercased), falls back to "" so the wordmark
 *   row collapses gracefully if Settings has no value.
 * - signoffNameFormal AND signoffNameCasual <- the same `signoffName`
 *   field. Per operator design (single input in Settings), both registers
 *   render the same string. The closed enum stays in the schema for
 *   forward-compat.
 * - signoffLocation <- studioLocation (already in Settings), falls back
 *   to "" so EmailShell's footer renders `{name}` alone (no trailing
 *   ` · `) when location is empty.
 *
 * Failure mode: if the Sanity fetch throws, return LA_SPREZZATURA_TENANT
 * so the email still ships rather than 500ing the whole send. The fallback
 * placeholder is preferable to a hard failure during a real send -- the
 * operator notices "wrong name" faster than they notice "send didn't fire".
 */
export async function getTenantBrand(client: SanityClient): Promise<TenantBrand> {
  let row: TenantBrandSiteSettingsRow | null = null;
  try {
    row = (await client.fetch(
      `*[_type == "siteSettings"][0]{ siteTitle, signoffName, studioLocation }`,
    )) as TenantBrandSiteSettingsRow | null;
  } catch {
    return LA_SPREZZATURA_TENANT;
  }

  const siteTitle = row?.siteTitle?.trim() ?? "";
  const signoff = row?.signoffName?.trim() ?? "";
  const location = row?.studioLocation?.trim() ?? "";

  return {
    wordmark: siteTitle ? siteTitle.toUpperCase() : LA_SPREZZATURA_TENANT.wordmark,
    signoffNameFormal: signoff,
    signoffNameCasual: signoff,
    signoffLocation: location,
  };
}

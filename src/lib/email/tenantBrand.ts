// src/lib/email/tenantBrand.ts
// Phase 46-04 -- closed-enum signature register (D-29).
//
// v5.3 hardcodes a single tenant. v6.0 multi-tenant work replaces this with a
// per-tenant lookup (Sanity siteSettings or src/config/tenants.json). This
// module exists as the single, obvious place to rip out and replace.
//
// Pattern: sibling of src/lib/email/system.ts.
//
// Schema note: a closed-enum register (formal | casual) replaces the prior
// single-field signoffName so SendUpdate (formal: "Elizabeth Lewis") and
// WorkOrder (casual: "Elizabeth") render different signature lines without
// a per-template branch in EmailShell. Adding a new register requires a
// schema addition here -- do NOT widen with a string cast at the call site.

export interface TenantBrand {
  wordmark: string;
  signoffNameFormal: string;   // "Elizabeth Lewis" -- used by SendUpdate (signoffStyle="formal")
  signoffNameCasual: string;   // "Elizabeth"        -- used by WorkOrder (signoffStyle="casual" default)
  signoffLocation: string;
}

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

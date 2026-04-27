// src/lib/email/tenantBrand.ts
// Phase 46 -- tenant brand constants for <EmailShell> (D-6).
//
// v5.3 hardcodes a single tenant. v6.0 multi-tenant work replaces this with a
// per-tenant lookup (Sanity siteSettings or src/config/tenants.json). This
// module exists as the single, obvious place to rip out and replace.
//
// Pattern: sibling of src/lib/email/system.ts.

export interface TenantBrand {
  wordmark: string;
  signoffName: string;
  signoffLocation: string;
}

export const LA_SPREZZATURA_TENANT: TenantBrand = {
  wordmark: "LA SPREZZATURA",
  signoffName: "Elizabeth",
  signoffLocation: "Darien, CT",
};

/** v5.3 single-tenant accessor. v6.0 will replace with `getTenantBrand(tenantId)`. */
export function getDefaultTenantBrand(): TenantBrand {
  return LA_SPREZZATURA_TENANT;
}

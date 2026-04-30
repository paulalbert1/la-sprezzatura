/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

declare namespace App {
  interface Locals {
    clientId: string | undefined;
    contractorId: string | undefined;
    buildingManagerEmail: string | undefined;
    tenantId: string | undefined;
    role: 'client' | 'contractor' | 'building_manager' | 'admin' | undefined;
    sanityUserId: string | undefined; // Resolved from tenant admin config for admin sessions
    /**
     * Phase 49 (Plan 49-01) — D-04 verbatim. Hydrated by middleware when
     * the session has session.impersonating set: locals.role/clientId/etc
     * reflect the IMPERSONATED viewer, while this field carries the
     * underlying admin attribution for the banner (Phase 50) and audit
     * writers (Plan 49-03). adminEntityId stays the admin's session
     * entityId per D-01 (role never swapped).
     */
    impersonating?: {
      adminEmail: string;
      adminEntityId: string;
      mintedAt: string;
    };
  }
}

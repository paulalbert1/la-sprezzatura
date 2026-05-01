// src/emails/fixtures.shared.ts
// Phase 46 -- shared test fixtures across SendUpdate and WorkOrder.
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-6)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (fixtures.shared.ts)
//
// Currently exports a single SAMPLE_TENANT constant matching the v5.3
// hardcoded shape used by EmailShell (D-6). Both sendUpdate/fixtures.ts and
// workOrder/fixtures.ts import from here so a v6.0 multi-tenant migration
// flips one constant. Test fixtures stay isolated from the production
// LA_SPREZZATURA_TENANT constant in src/lib/email/tenantBrand.ts.

import type { TenantBrand } from "../lib/email/tenantBrand";

export const SAMPLE_TENANT: TenantBrand = {
  wordmark: "LA SPREZZATURA",
  signoffNameFormal: "Elizabeth Olivier",   // sync with D-14 update to LA_SPREZZATURA_TENANT
  signoffNameCasual: "Elizabeth",
  signoffLocation: "Darien, CT",
};

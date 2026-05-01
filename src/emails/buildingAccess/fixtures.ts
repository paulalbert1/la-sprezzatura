// src/emails/buildingAccess/fixtures.ts
// Phase 48 -- typed fixture exports for BuildingAccess snapshot tests (D-01, D-11).
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-01, D-06, D-11)
//   .planning/phases/48-smaller-transactional-emails/48-PATTERNS.md (buildingAccess/fixtures.ts)

import type { TenantBrand } from "../../lib/email/tenantBrand";
import { LA_SPREZZATURA_TENANT } from "../../lib/email/tenantBrand";

export interface BuildingAccessEmailInput {
  buildingManager: { name?: string; email: string };
  project: { _id: string; title: string };
  magicLink: string;
  expiresInSeconds: number;
  preheader?: string;
  tenant?: TenantBrand;
}

export function baseInput(
  overrides: Partial<BuildingAccessEmailInput> = {},
): BuildingAccessEmailInput {
  return {
    buildingManager: { name: "Daniel Park", email: "daniel@buildingmgmt.com" },
    project: { _id: "P1", title: "Acme Commercial Tower" },
    magicLink: "https://example.com/building/verify?token=test-token-bld456",
    expiresInSeconds: 900,
    tenant: LA_SPREZZATURA_TENANT,
    ...overrides,
  };
}

export const FIXTURES = {
  default: () => baseInput(),
  longProjectTitle: () =>
    baseInput({
      project: {
        _id: "P2",
        title:
          "The Very Long Estate Name That Stresses Column Widths Across All Email Clients",
      },
    }),
};

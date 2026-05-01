// src/emails/workOrderAccess/fixtures.ts
// Phase 48 -- typed fixture exports for WorkOrderAccess snapshot tests (D-01, D-23 cardinality variants).
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-01, D-06, D-10)
//   .planning/phases/48-smaller-transactional-emails/48-PATTERNS.md (workOrderAccess/fixtures.ts)
//
// Three fixtures: default (single project), multipleProjects (stresses join),
// noProjects (empty projectNames branch).

import type { TenantBrand } from "../../lib/email/tenantBrand";
import { LA_SPREZZATURA_TENANT } from "../../lib/email/tenantBrand";

export interface WorkOrderAccessEmailInput {
  contractor: { name: string; email: string };
  projectNames: string[];
  magicLink: string;
  /**
   * Phase 48 D-06 — sourced from MAGIC_LINK_ACCESS_TTL_SECONDS at the call site.
   * Templates derive expiry copy via formatExpiryCopy(expiresInSeconds); never
   * import the constant directly (48-RESEARCH Pitfall 2).
   */
  expiresInSeconds: number;
  preheader?: string;
  tenant?: TenantBrand;
}

export function baseInput(
  overrides: Partial<WorkOrderAccessEmailInput> = {},
): WorkOrderAccessEmailInput {
  return {
    contractor: { name: "Marco DeLuca", email: "marco@deluca.com" },
    projectNames: ["Acme Home"],
    magicLink: "https://example.com/workorder/verify?token=test-token-abc123",
    expiresInSeconds: 900,
    tenant: LA_SPREZZATURA_TENANT,
    ...overrides,
  };
}

export const FIXTURES = {
  default: () => baseInput(),
  multipleProjects: () =>
    baseInput({
      projectNames: ["Acme Home", "Beta Loft", "Gamma Lake House"],
    }),
  noProjects: () => baseInput({ projectNames: [] }),
};

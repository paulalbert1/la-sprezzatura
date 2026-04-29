// src/emails/workOrder/fixtures.ts
// Phase 46 -- typed fixture exports for WorkOrder snapshot tests (D-20).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-20)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (workOrder/fixtures.ts)
//
// Two fixtures: default and longTitle (stresses table column widths).

import type { TenantBrand } from "../../lib/email/tenantBrand";
import { LA_SPREZZATURA_TENANT } from "../../lib/email/tenantBrand";

export interface WorkOrderEmailInput {
  project: { _id: string; title: string };
  contractor: { _id: string; name: string; email: string };
  workOrderId: string;
  baseUrl: string;
  fromDisplayName: string;
  verifyUrl?: string;
  preheader?: string;
  tenant?: TenantBrand;
}

export function baseInput(overrides: Partial<WorkOrderEmailInput> = {}): WorkOrderEmailInput {
  return {
    project: { _id: "P1", title: "Acme Home" },
    contractor: { _id: "C1", name: "Marco DeLuca", email: "marco@deluca.com" },
    workOrderId: "WO1",
    baseUrl: "https://example.com",
    fromDisplayName: "Liz Albert",
    tenant: LA_SPREZZATURA_TENANT,
    ...overrides,
  };
}

export const FIXTURES = {
  default: () => baseInput(),
  longTitle: () =>
    baseInput({
      project: {
        _id: "P2",
        title:
          "The Very Long Estate Name That Stresses Column Widths Across All Email Clients",
      },
    }),
};

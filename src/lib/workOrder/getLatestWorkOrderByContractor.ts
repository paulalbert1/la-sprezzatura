import { getTenantClient } from "../tenantClient";

// Phase 39 Plan 03 Task 3 — per-(project, contractor) latest workOrder fetch
//
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-03-PLAN.md § Task 3
//   .planning/phases/39-work-order-documents-panels/39-CONTEXT.md D-02, D-03
//
// Returns the most recent workOrder document for a (projectId, contractorId)
// pair, or null if none exists. "Most recent" = highest createdAt (sent or
// unsent). The chip renders "Sent {date}" only when lastSentAt is set; that
// decision lives in the React component, not here.
//
// Lives as a dedicated helper (not nested in the project GROQ projection) so
// index.astro's projection stays readable and grep-verifiable. Tenant
// isolation: callers pass tenantId → getTenantClient → correct dataset.
// Cross-tenant queries are impossible via this path.

export interface LatestWorkOrderResult {
  _id: string;
  lastSentAt: string | null;
}

export async function getLatestWorkOrderByContractor(
  tenantId: string,
  projectId: string,
  contractorId: string,
): Promise<LatestWorkOrderResult | null> {
  const client = getTenantClient(tenantId);
  const result = await client.fetch<LatestWorkOrderResult | null>(
    `*[_type == "workOrder" && project._ref == $projectId && contractor._ref == $contractorId]
       | order(createdAt desc)[0]{ _id, lastSentAt }`,
    { projectId, contractorId },
  );
  return result ?? null;
}

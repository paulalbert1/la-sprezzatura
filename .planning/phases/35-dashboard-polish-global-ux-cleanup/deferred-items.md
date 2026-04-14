# Phase 35 — Deferred Items

Out-of-scope issues surfaced during execution. Do NOT fix in this phase.

## Pre-existing test failures (23 tests, all unrelated to Phase 35 scope)

Discovered: Plan 35-01 Task 2 verification run of `npx vitest run`.

Pre-existing per STATE.md note: "Pre-existing test failures (14 tests) need cleanup". Now 23 — grew during v5.0 without cleanup.

Failing suites (none touched by Plan 35-01 changes):

- `src/lib/__tests__/tenantAudit.test.ts` — domain hardcoded-string audit
- `src/lib/__tests__/fetchAndEncodeImage.test.ts`
- `src/lib/sendUpdate/emailTemplate.test.ts` (5 tests + snapshot)
- `src/lib/tenantClient.test.ts` (2 tests)
- `src/lib/formatCurrency.test.ts` (3 tests) — fractional-cents assertions
- `src/pages/api/blob-serve.test.ts` (2 tests)
- `src/pages/api/send-update/preview.test.ts`
- `src/lib/artifactUtils.test.ts` (3 tests)
- `src/lib/rendering/contractorColors.test.ts` (3 tests)
- `src/components/admin/SendUpdateModal.test.tsx`
- `src/sanity/schemas/contractor.test.ts` — expects predefined trades list but schema is freeform

None overlap with `src/lib/trades.ts`, `src/components/admin/QuickAssignTypeahead.tsx`, `src/components/admin/EntityListPage.tsx`, `src/components/portal/ContractorSection.astro`, or `src/pages/admin/dashboard.astro`.

Recommend a dedicated cleanup plan in v5.1 after this milestone's feature work lands.

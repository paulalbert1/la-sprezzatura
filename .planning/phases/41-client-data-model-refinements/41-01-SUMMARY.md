---
phase: 41-client-data-model-refinements
plan: "01"
subsystem: api
tags: [sanity, groq, phone-format, schema, vitest, tdd]

# Dependency graph
requires:
  - phase: 40-vendor-onboarding
    provides: address block on EntityDetailForm, getTenantClient pattern, trades lib pattern
provides:
  - formatPhone(raw) pure utility exported from src/lib/format.ts
  - Client schema without preferredContact field
  - GROQ projections (getAdminClients, getAdminClientDetail, ADMIN_DASHBOARD_PROJECTS_QUERY) with no preferredContact references
  - clients.ts API create/update handlers that do not read or write preferredContact
affects:
  - 41-02 (UI sweep: EntityListPage, ContactCardPopover, EntityDetailForm, ContactCardWrapper, ClientChipWithRegenerate)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - formatPhone() follows same pure-function export pattern as formatTrade() in src/lib/trades.ts
    - TDD: RED commit (test file with failing import) followed by GREEN commit (implementation)

key-files:
  created:
    - src/lib/format.ts
    - src/lib/format.test.ts
  modified:
    - src/sanity/schemas/client.ts
    - src/sanity/queries.ts
    - src/pages/api/admin/clients.ts
    - src/sanity/schemas/client.test.ts

key-decisions:
  - "formatPhone extracts all digits via /\\D/g; returns (NNN) NNN-NNNN for exactly 10 digits; raw input unchanged otherwise (safe fallback for non-US numbers)"
  - "Phone stored raw in Sanity — no normalization on save; display format is render-time only"
  - "No Sanity data migration for orphaned preferredContact values — field removed from schema/queries/API; existing documents retain inert orphaned data per D-18"

patterns-established:
  - "Phone display pattern: store raw, format at render time via formatPhone() from src/lib/format.ts"

requirements-completed:
  - CLNT-10
  - CLNT-13

# Metrics
duration: 5min
completed: 2026-04-22
---

# Phase 41 Plan 01: Client Data Model Refinements — Backend Foundation Summary

**formatPhone() pure utility with 10-test vitest suite, plus complete preferredContact removal from Sanity schema, GROQ queries, and API handler**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-22T17:03:52Z
- **Completed:** 2026-04-22T17:08:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `src/lib/format.ts` with `formatPhone()` following the same pure-function pattern as `formatTrade()` — digit extraction via regex, 10-digit US format, safe fallback for everything else
- Created `src/lib/format.test.ts` with 10 vitest unit tests covering all specified behaviors (all pass)
- Removed `preferredContact` from all three backend surfaces: Sanity client schema, four GROQ projection sites in queries.ts, and create/update handlers in clients.ts API
- Confirmed address object (street/city/state/zip) retained in client schema per CLNT-11 verification requirement

## Task Commits

Each task was committed atomically:

1. **Task 1: Create formatPhone() — RED gate** - `6502c65` (test)
2. **Task 1: Create formatPhone() — GREEN gate** - `3e2ea46` (feat)
3. **Task 2: Remove preferredContact from schema/queries/API** - `49ec32e` (feat)
4. **Rule 1 fix: Remove stale preferredContact test case** - `e927a2a` (fix)

## Files Created/Modified

- `src/lib/format.ts` — `formatPhone(raw: string | undefined | null): string` export; digit extraction, 10-digit formatting, raw fallback
- `src/lib/format.test.ts` — 10 vitest unit tests covering: raw 10-digit, parenthetical, hyphen, dot, 11-digit passthrough, 7-digit passthrough, empty string, null, undefined, whitespace-only
- `src/sanity/schemas/client.ts` — Removed `preferredContact` defineField block; address object with street/city/state/zip retained
- `src/sanity/queries.ts` — Removed `clientPreferredContact` alias from ADMIN_DASHBOARD_PROJECTS_QUERY; removed `preferredContact` from getAdminClients and getAdminClientDetail projections
- `src/pages/api/admin/clients.ts` — Removed `preferredContact` from create body destructuring + type annotation + payload spread; removed from update body destructuring + type annotation + `.set()` patch
- `src/sanity/schemas/client.test.ts` — Removed test case for the now-deleted `preferredContact` field (Rule 1 fix)

## Decisions Made

- `formatPhone()` placed in `src/lib/format.ts` (named `format.ts` per D-02 plan decision, consistent with existing `lib/` utility convention)
- Safe fallback: non-10-digit inputs returned unchanged, never mangled — handles non-US numbers, partial entries, test data
- No data migration for orphaned `preferredContact` values in Sanity Content Lake — per D-18, inert since nothing reads the field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed stale preferredContact test case from client.test.ts**
- **Found during:** Task 2 verification sweep
- **Issue:** `src/sanity/schemas/client.test.ts` contained a test that verified the now-deleted `preferredContact` defineField — it would fail after schema removal
- **Fix:** Removed the single `it('has field "preferredContact"...')` test case from the describe block
- **Files modified:** `src/sanity/schemas/client.test.ts`
- **Verification:** `npx vitest run src/sanity/schemas/client.test.ts` passes all 10 remaining tests
- **Committed in:** `e927a2a`

---

**Total deviations:** 1 auto-fixed (Rule 1 — stale test blocking correctness)
**Impact on plan:** Necessary to keep test suite green after schema change. No scope creep.

## Issues Encountered

- `grep -c` exits 1 on zero-match count, requiring individual per-file checks for the acceptance criteria verification. No functional issue.

## Known Stubs

None — `formatPhone` is a complete pure function with no stub patterns. No callers are wired yet (Plan 41-02 responsibility), but the function itself is complete.

## Threat Flags

No new threat surface introduced. `formatPhone` is a pure render-time utility with no network, storage, or logging side effects (T-41-01-04 verified). Backend write surface is narrower after this plan (preferredContact key stripped from accepted body keys).

## Next Phase Readiness

- `formatPhone` is ready to import in Plan 41-02 via `import { formatPhone } from '../../lib/format'`
- All backend `preferredContact` references cleared — Plan 41-02 UI sweep has no backend artifacts to patch against
- CLNT-11 address round-trip confirmed at schema/query/API level — Plan 41-02 integration UAT will complete the end-to-end verification

---
*Phase: 41-client-data-model-refinements*
*Completed: 2026-04-22*

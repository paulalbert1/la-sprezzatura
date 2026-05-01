---
phase: 48
plan: "01"
subsystem: email
tags: [email, ttl, tenantBrand, foundation, tdd]
dependency_graph:
  requires: []
  provides:
    - "src/lib/portal/tokenTtl.ts — TTL constants + formatExpiryCopy (Plans 02, 03, 04)"
    - "LA_SPREZZATURA_TENANT.signoffNameFormal = Elizabeth Olivier (D-14 fix)"
    - "SAMPLE_TENANT in sync with production fallback (A2)"
  affects:
    - "src/emails/sendUpdate (snapshot updated)"
    - "src/emails/workOrder (snapshot rebased to current date)"
tech_stack:
  added: []
  patterns:
    - "Co-located test files (*.test.ts) in src/lib/portal/ — matches existing portal lib convention"
    - "TDD RED/GREEN cycle for both new modules"
key_files:
  created:
    - src/lib/portal/tokenTtl.ts
    - src/lib/portal/tokenTtl.test.ts
    - src/lib/email/tenantBrand.test.ts
  modified:
    - src/lib/email/tenantBrand.ts
    - src/emails/fixtures.shared.ts
    - src/emails/sendUpdate/SendUpdate.test.ts
    - src/emails/sendUpdate/__snapshots__/SendUpdate.test.ts.snap
    - src/emails/workOrder/__snapshots__/WorkOrder.test.ts.snap
decisions:
  - "D-14 fix applied: signoffNameFormal changed from 'Elizabeth Lewis' to 'Elizabeth Olivier' in LA_SPREZZATURA_TENANT and SAMPLE_TENANT"
  - "Single-file tokenTtl.ts chosen (constants + formatExpiryCopy co-located) per 48-PATTERNS.md recommendation"
  - "WorkOrder snapshot date drift accepted: fixture uses new Date() so date advances daily — structural HTML unchanged"
metrics:
  duration: "3m 28s"
  completed: "2026-04-30"
  tasks_completed: 3
  files_changed: 9
---

# Phase 48 Plan 01: Foundation — TTL Module + D-14 Signoff Fix Summary

TTL constants module (`tokenTtl.ts`) with `formatExpiryCopy()` helper created as EMAIL-05 single import surface; `LA_SPREZZATURA_TENANT.signoffNameFormal` corrected to "Elizabeth Olivier" (D-14) with matching SAMPLE_TENANT update (A2) and Phase 46 snapshot regen.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `5165bfd` | feat(48-01): create tokenTtl.ts TTL constants module (D-04, D-05) |
| Task 2 | `a0abed1` | feat(48-01): fix D-14 signoff name and add tenantBrand pinned-value tests |
| Task 3 | `44eb7b8` | chore(48-01): regenerate Phase 46 snapshots after D-14 name fix |

## Task Results

### Task 1: tokenTtl.ts + tokenTtl.test.ts

Created `src/lib/portal/tokenTtl.ts` exporting:
- `MAGIC_LINK_ACCESS_TTL_SECONDS = 900` (15 minutes — magic link access TTL)
- `WORK_ORDER_SEND_TTL_SECONDS = 604800` (7 days — forward-compat, not yet wired per D-04 open question)
- `formatExpiryCopy(seconds)` — renders human-readable expiry copy used in email body

9 unit tests green covering both constants and all 7 `formatExpiryCopy` branches (seconds, minute, minutes, hour, hours, day, days).

### Task 2: D-14 fix + tenantBrand.test.ts

Applied D-14 name correction in two places:
- `src/lib/email/tenantBrand.ts`: `signoffNameFormal: "Elizabeth Lewis"` → `"Elizabeth Olivier"`
- `src/emails/fixtures.shared.ts`: same change to keep SAMPLE_TENANT in sync (A2)

Created `src/lib/email/tenantBrand.test.ts` with 8 pinned-value tests covering D-14 fallback contract and A2 fixture/production sync.

### Task 3: Phase 46 Snapshot Regen

- `SendUpdate.test.ts.snap`: footer signoff changed from `Elizabeth Lewis · Darien, CT` to `Elizabeth Olivier · Darien, CT` — name-string-only change, no structural HTML drift
- `WorkOrder.test.ts.snap`: date-only drift (April 29 → April 30, today's date) — casual register uses `signoffNameCasual` ("Elizabeth", unchanged); no name change
- Fixed hardcoded `expect(html).toContain("Elizabeth Lewis")` assertion in `SendUpdate.test.ts` (was a D-29 regression guard; updated to reflect corrected D-14 value)
- Full sweep: 207 tests green across `src/emails`, `src/lib/portal`, `src/lib/email`

## Verification

```
npm test -- src/lib/portal src/lib/email src/emails/sendUpdate src/emails/workOrder
```
143 tests, all green.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale "Elizabeth Lewis" assertion in SendUpdate.test.ts**
- **Found during:** Task 3 (snapshot regen)
- **Issue:** `SendUpdate.test.ts` had a hardcoded `expect(html).toContain("Elizabeth Lewis")` labeled as a D-29 regression guard. After Task 2's D-14 fix, this test correctly failed because the production value changed. The test was pinning the wrong value.
- **Fix:** Updated test description and assertion to use `"Elizabeth Olivier"` — the corrected D-14 value
- **Files modified:** `src/emails/sendUpdate/SendUpdate.test.ts`
- **Commit:** `44eb7b8`

### Out-of-Scope Notes (deferred)

`src/pages/api/admin/work-orders/[id]/send.test.ts` and `src/pages/api/admin/impersonate/imper-03.test.ts` contain inline mock fixtures that still use `signoffNameFormal: "Elizabeth Lewis"`. These are test-isolation mocks (not production `SAMPLE_TENANT` or `LA_SPREZZATURA_TENANT`) and are outside this plan's scope. They do not affect production email rendering (production path calls `getTenantBrand()` which reads from Sanity). Logged for cleanup in a future maintenance pass.

## Known Stubs

None — all module exports are fully implemented and tested.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- [x] `src/lib/portal/tokenTtl.ts` exists
- [x] `src/lib/portal/tokenTtl.test.ts` exists
- [x] `src/lib/email/tenantBrand.ts` updated (`Elizabeth Olivier`)
- [x] `src/lib/email/tenantBrand.test.ts` exists
- [x] `src/emails/fixtures.shared.ts` updated (`Elizabeth Olivier`)
- [x] `src/emails/sendUpdate/__snapshots__/SendUpdate.test.ts.snap` updated
- [x] `src/emails/workOrder/__snapshots__/WorkOrder.test.ts.snap` regenerated
- [x] Commits `5165bfd`, `a0abed1`, `44eb7b8` all present in git log
- [x] 207 tests green

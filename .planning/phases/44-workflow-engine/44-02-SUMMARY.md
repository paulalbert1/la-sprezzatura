---
phase: 44
plan: 02
subsystem: workflow-engine
tags: [workflow, engine, pure-logic, tdd, business-days, prereqs, gates]
dependency_graph:
  requires: [44-01]
  provides: [engine-module, arrayUtils, businessDays, fixtures]
  affects: [all-workflow-api-routes, tracker-ui, dashboard-card]
tech_stack:
  added: []
  patterns:
    - Pure stateless TypeScript engine module (no IO)
    - UTC-noon normalization for date-fns business-day math
    - Factory-function fixture pattern for typed test data
key_files:
  created:
    - src/lib/workflow/engine.ts
    - src/lib/workflow/engine.test.ts
    - src/lib/workflow/businessDays.ts
    - src/lib/workflow/businessDays.test.ts
    - src/lib/workflow/arrayUtils.ts
    - src/lib/workflow/arrayUtils.test.ts
    - src/lib/workflow/__fixtures__/workflows.ts
  modified:
    - src/lib/workflow/businessDays.ts (UTC-noon fix applied during GREEN)
decisions:
  - "UTC-noon normalization in businessDaysBetween: date-fns differenceInBusinessDays uses local time; midnight UTC timestamps (e.g. 2026-04-17T00:00:00Z) become Thursday evening in Eastern timezone, shifting biz-day counts by one. Fix: normalize both dates to UTC noon before calling date-fns."
  - "skipped satisfies hard prereqs (Assumption A1 from RESEARCH): isPrereqSatisfied returns true for both complete and skipped statuses. Documented for UAT with Liz."
  - "getAvailableTransitions suppresses 'skipped' from menu (not just marks it disabled) when milestone is not optional — cleaner UX than showing a disabled option."
  - "computeMetrics counts skipped milestones as complete for progressPct — skipped work is done work."
metrics:
  duration: "~5 minutes"
  completed: "2026-04-23"
  tasks: 3
  files: 7
---

# Phase 44 Plan 02: Workflow Engine (Pure Logic) Summary

Pure server-side workflow engine with hard-prereq enforcement, gate clearance, phase-overlap (canOverlapWith), optional-skip protection, calendar-day dormancy, and business-day approval timeout — all stateless, IO-free, 38 tests green.

## What Was Built

### Task 1: arrayUtils + businessDays (RED → GREEN)

`src/lib/workflow/arrayUtils.ts` — `moveItem<T>` reorder helper used by phase/milestone up-down buttons (D-08). Pure, returns new array, handles boundary and out-of-range idx without mutation.

`src/lib/workflow/businessDays.ts` — `businessDaysBetween` and `addBusinessDays` wrappers around date-fns. Includes UTC-noon normalization to prevent timezone edge cases (see Deviations below).

12 unit tests green.

### Task 2: Fixtures + Engine Test File (RED phase)

`src/lib/workflow/__fixtures__/workflows.ts` — composable factory functions: `buildMilestoneTemplate`, `buildPhaseTemplate`, `buildTemplate`, `buildMilestoneInstance`, `buildPhaseInstance`, `buildWorkflow`, `buildKoenigExample`. `buildKoenigExample()` mirrors spec §5 with the `trade-coord` → `project-management` `canOverlapWith` relationship for Pitfall 5 tests.

`src/lib/workflow/engine.test.ts` — 26 assertions covering all 10 engine exports: canTransition (prereqs, gates, skip), computeDerivedStatus, isPhaseStartable (overlap), isBlocked, detectDormancy, isApprovalOverdue (business days), computeMetrics, computeWarnings, instantiateFromTemplate, getAvailableTransitions.

RED state confirmed: engine.ts did not exist when committed.

### Task 3: Engine Implementation (GREEN + implicit REFACTOR)

`src/lib/workflow/engine.ts` — 10 exported pure functions, zero IO imports:

- `canTransition`: enforces hard prereqs (isPrereqSatisfied), gate clearance (GATES_REQUIRING_CLEAR map), optional-skip guard (Pitfall 6: hasDownstreamStarted), phase startability
- `getAvailableTransitions`: suppresses "skipped" from menu when not optional
- `computeDerivedStatus`: priority order awaiting_client > awaiting_payment > in_progress > not_started; skipped = complete for aggregation
- `isBlocked`: prereqs + phase startability
- `isPhaseStartable`: earlier phases must be all-done OR declare `canOverlapWith` containing this phase id (Pitfall 5)
- `detectDormancy`: calendar-day math (spec §9)
- `isApprovalOverdue`: business-day math via businessDaysBetween (Pitfall 4)
- `computeWarnings`: dormant status → early return; approaching dormancy at 75% threshold; per-milestone approval overdue/severely overdue
- `computeMetrics`: counts complete+skipped, in_progress, awaiting_client+awaiting_payment, blocked (not_started + isBlocked)
- `instantiateFromTemplate`: deep-clones template at current version, pre-populates ContractorInstance[] from defaultInstances with fromTemplate: true, status: not_started, fresh crypto.randomUUID() _keys

All 38 tests pass.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (tests) | 15752f9, 2f96d44 | `test(44): ...` commits precede implementation |
| GREEN (impl) | 99ba9cf | `feat(44): implement workflow engine (green)` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] UTC-noon normalization in businessDaysBetween**

- **Found during:** Task 3 GREEN — test `isApprovalOverdue > counts business days` returned 2 instead of 1
- **Issue:** `date-fns` `differenceInBusinessDays` uses local time zone. `new Date("2026-04-17T00:00:00Z")` is Friday midnight UTC but Thursday 8pm Eastern, so date-fns counted it as Thursday → Monday = 2 business days instead of Friday → Monday = 1.
- **Fix:** Added `toUTCNoon(d)` helper in `businessDays.ts` that normalizes both inputs to `Date.UTC(..., 12, 0, 0)` before passing to date-fns. This ensures the local-time day-of-week matches the UTC calendar date.
- **Files modified:** `src/lib/workflow/businessDays.ts`
- **Commit:** 99ba9cf (included with engine implementation)
- **Tests:** businessDays.test.ts uses noon UTC and was already passing; the fix also makes engine.test.ts cases with midnight UTC inputs pass correctly.

## Known Stubs

None. The engine module is fully wired: all functions operate on typed inputs and return typed outputs. No placeholders, no TODO/FIXME, no hardcoded empty returns.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced in this plan. Engine is purely a pure-function TypeScript module consumed by later plans' API handlers.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/lib/workflow/engine.ts | FOUND |
| src/lib/workflow/arrayUtils.ts | FOUND |
| src/lib/workflow/businessDays.ts | FOUND |
| src/lib/workflow/__fixtures__/workflows.ts | FOUND |
| .planning/phases/44-workflow-engine/44-02-SUMMARY.md | FOUND |
| Task 1 commit 15752f9 | FOUND |
| Task 2 commit 2f96d44 | FOUND |
| Task 3 commit 99ba9cf | FOUND |
| All 38 tests pass | VERIFIED |

---
phase: 44-workflow-engine
plan: 05
subsystem: api
tags: [sanity, workflow, engine, api-routes, vitest]

# Dependency graph
requires:
  - phase: 44-workflow-engine plan 01
    provides: ProjectWorkflow types, MilestoneStatus enum, WorkflowTemplate types
  - phase: 44-workflow-engine plan 02
    provides: canTransition(), instantiateFromTemplate() engine functions
  - phase: 44-workflow-engine plan 04
    provides: PROJECT_WORKFLOW_QUERY, WORKFLOW_TEMPLATE_BY_ID_QUERY in queries.ts

provides:
  - POST /api/admin/projects/[projectId]/workflow — instantiate workflow from template
  - DELETE /api/admin/projects/[projectId]/workflow — terminate workflow
  - PATCH /api/admin/projects/[projectId]/workflow — reactivate (dormant→active) or changeTemplate (in-place re-instantiation)
  - POST /api/admin/projects/[projectId]/workflow/milestone-status — engine-gated milestone/sub-row transition
  - POST /api/admin/projects/[projectId]/workflow/instance — add ContractorInstance sub-row
  - DELETE /api/admin/projects/[projectId]/workflow/instance — remove ContractorInstance sub-row

affects:
  - 44-workflow-engine plan 07 (WorkflowTracker UI fires POSTs against these endpoints)
  - 44-workflow-engine plan 08 (BlankWorkflowState fires POST to instantiate)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Engine-gated write: fetch workflow → canTransition() → patch (409 on disallowed)"
    - "ALLOWED_STATUSES allowlist in milestone-status prevents unknown status strings (T-44-05-07)"
    - "Sanity _key-predicate patch paths: phases[_key==\"K\"].milestones[_key==\"K\"].status"
    - "setIfMissing().append().set().commit() chain for ContractorInstance add (mirrors artifact-crud.ts)"
    - "unset([path]).set({lastActivityAt}).commit() chain for ContractorInstance remove"

key-files:
  created:
    - src/pages/api/admin/projects/[projectId]/workflow/index.ts
    - src/pages/api/admin/projects/[projectId]/workflow/index.test.ts
    - src/pages/api/admin/projects/[projectId]/workflow/milestone-status.ts
    - src/pages/api/admin/projects/[projectId]/workflow/milestone-status.test.ts
    - src/pages/api/admin/projects/[projectId]/workflow/instance.ts
    - src/pages/api/admin/projects/[projectId]/workflow/instance.test.ts
  modified: []

key-decisions:
  - "Task 1 (queries.ts) was already committed in Plan 01; no new commit needed — queries were added as part of the schema foundation plan"
  - "PATCH index.ts: missing action value returns 400 (not 409) — invalid input, not a state conflict"
  - "milestone-status uses ALLOWED_STATUSES.includes(target) allowlist before engine call — T-44-05-07"
  - "instance POST guards multiInstance===true before append — T-44-05-05"
  - "Both instance endpoints re-fetch workflow via PROJECT_WORKFLOW_QUERY after mutation to return authoritative state"
  - "TS mock.calls type widened via unknown cast to avoid tuple-length-0 inference from vitest mock types"

patterns-established:
  - "Pattern: engine-gated write (load → validate → patch) for all milestone transitions"
  - "Pattern: every mutation endpoint returns { workflow: updatedDoc } by re-fetching after commit"

requirements-completed: [WF-03, WF-04, WF-06, WF-07]

# Metrics
duration: 5min
completed: 2026-04-23
---

# Phase 44 Plan 05: Project Workflow API Endpoints Summary

**Three endpoint files (6 HTTP handlers) for workflow lifecycle management and engine-gated milestone/instance transitions, with 33 tests green across all routes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-23T22:56:17Z
- **Completed:** 2026-04-23T23:01:26Z
- **Tasks:** 3 (Task 1 pre-completed; Tasks 2-3 executed)
- **Files created:** 6 (3 route files + 3 test files)

## Accomplishments

- Workflow lifecycle endpoint: POST instantiate (409 if exists), DELETE terminate, PATCH reactivate/changeTemplate — all with lastActivityAt on every success path
- Engine-gated milestone-status endpoint: runs `canTransition()` server-side before any patch; 409 with typed reason when engine blocks; _key-predicate Sanity paths for both top-level milestones and sub-row instances
- Instance CRUD endpoint: POST guards multiInstance===true; DELETE unsets by _key; both endpoints re-fetch and return authoritative workflow state
- 33 tests green: auth gates (401/403), input validation (400), state guards (409), 404s, and happy paths for all 6 handlers

## Task Commits

1. **Task 1: queries.ts entries** — Pre-completed in Plan 01 (commit `656e89a` / `ebaded1`); no new commit
2. **Task 2: Workflow lifecycle endpoints** — `2fff90b` (feat)
3. **Task 3: Milestone-status + Instance endpoints** — `46e72b5` (feat)

**Plan metadata:** (committed with state update)

## Files Created/Modified

- `src/pages/api/admin/projects/[projectId]/workflow/index.ts` — POST/DELETE/PATCH lifecycle handlers (instantiate, terminate, reactivate, changeTemplate)
- `src/pages/api/admin/projects/[projectId]/workflow/index.test.ts` — 19 tests for lifecycle endpoint
- `src/pages/api/admin/projects/[projectId]/workflow/milestone-status.ts` — Engine-gated POST transition handler
- `src/pages/api/admin/projects/[projectId]/workflow/milestone-status.test.ts` — 8 tests for milestone-status
- `src/pages/api/admin/projects/[projectId]/workflow/instance.ts` — POST add / DELETE remove ContractorInstance
- `src/pages/api/admin/projects/[projectId]/workflow/instance.test.ts` — 6 tests for instance CRUD

## Decisions Made

- Task 1 queries were already committed in Plan 01's feat commit — recognized as pre-completed, no duplicate commit created
- `ALLOWED_STATUSES` allowlist in milestone-status.ts validates target before engine call — T-44-05-07 defense in depth
- PATCH reactivate returns 409 (not 400) when status is not dormant — it's a state conflict, not invalid input
- Vitest mock.calls typed via `as unknown as [Record<string, unknown>][]` to work around tuple-length-0 inference from mock type declarations

## Deviations from Plan

None — plan executed exactly as written. Task 1 was pre-completed (queries already in queries.ts from Plan 01); Tasks 2 and 3 executed per spec.

## Issues Encountered

- Vitest mock type inference treats `mock.calls` as a `[]` (empty tuple) when using the default `vi.fn()` type, causing TS2493 index errors. Resolved by casting via `unknown` — a common pattern when asserting on specific call arguments. No functional impact.

## Next Phase Readiness

- All three endpoint files are ready for consumption by:
  - Plan 07 WorkflowTracker UI (milestone status changes, instance add/remove)
  - Plan 08 BlankWorkflowState (POST to instantiate from template)
  - Plan 10 settings overflow menu (PATCH reactivate/changeTemplate, DELETE terminate)
- Engine remains the sole arbiter of transition legality — client cannot bypass prereqs or gates

## Self-Check: PASSED

- FOUND: `src/pages/api/admin/projects/[projectId]/workflow/index.ts`
- FOUND: `src/pages/api/admin/projects/[projectId]/workflow/milestone-status.ts`
- FOUND: `src/pages/api/admin/projects/[projectId]/workflow/instance.ts`
- FOUND: `.planning/phases/44-workflow-engine/44-05-SUMMARY.md`
- FOUND: commit `2fff90b` (Task 2)
- FOUND: commit `46e72b5` (Task 3)

---
*Phase: 44-workflow-engine*
*Completed: 2026-04-23*

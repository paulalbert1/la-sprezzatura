---
phase: 44-workflow-engine
plan: 09
subsystem: ui
tags: [astro, ssr, workflow, tracker, dormancy, engine-integration]

requires:
  - phase: 44-01
    provides: ProjectWorkflow and WorkflowTemplate TypeScript types + schemas
  - phase: 44-02
    provides: Engine functions — detectDormancy, computeWarnings, computeMetrics, getAvailableTransitions, isBlocked, isApprovalOverdue
  - phase: 44-03
    provides: Frappe Gantt retirement + schedule.astro stub baseline
provides:
  - schedule.astro rebuilt as SSR page hosting WorkflowTracker or BlankWorkflowState
  - Lazy dormancy evaluation (D-15) on page load — auto-PATCH status="dormant" when threshold exceeded
  - Server-side engine precomputation (transitionsById, blockedById, gateSubMessageById, overdueReasonById, warnings, metrics)
  - PROJECT_WORKFLOW_QUERY and WORKFLOW_TEMPLATE_BY_ID_QUERY GROQ constants in queries.ts
  - WorkflowTracker and BlankWorkflowState component stubs with correct props interfaces
affects:
  - 44-07 (Plans 06/07 must replace the stubs with full implementations)
  - 44-10 (Dashboard workflow card reads projectWorkflow documents)
  - 44-11 (Template editor settings page)

tech-stack:
  added: []
  patterns:
    - SSR engine precomputation pattern: engine runs server-side, serialized computed maps pass to client as props
    - Lazy dormancy: detectDormancy on every page load with immediate PATCH if threshold exceeded (D-15)
    - Component stub scaffold: stub file with correct props interface allows page to compile while implementation is pending

key-files:
  created:
    - src/components/admin/workflow/WorkflowTracker.tsx
    - src/components/admin/workflow/BlankWorkflowState.tsx
  modified:
    - src/pages/admin/projects/[projectId]/schedule.astro
    - src/sanity/queries.ts

key-decisions:
  - "Template name is fetched on demand via a follow-up client.fetch (not stored in projectWorkflow snapshot) — tolerates template deletion via '(deleted template)' fallback"
  - "SERVER-SIDE ONLY: engine.ts is never imported client-side — all engine outputs pass as serialized props to the island"
  - "WorkflowTracker and BlankWorkflowState stubs created as Rule 3 auto-fix — full implementations deferred to Plans 06/07"
  - "PROJECT_WORKFLOW_QUERY added to queries.ts as Rule 3 auto-fix — Plan 05 had not yet run"

patterns-established:
  - "Engine precomputation pattern: compute transitionsById/blockedById/gateSubMessageById/overdueReasonById server-side before island hydration"
  - "Lazy dormancy D-15: workflow.status === 'active' check + detectDormancy() + PATCH at page load"

requirements-completed: [WF-03, WF-05, WF-06, WF-07]

duration: 4min
completed: 2026-04-23
---

# Phase 44 Plan 09: Schedule.astro SSR Rebuild Summary

**schedule.astro rebuilt as SSR page with server-side engine precomputation, lazy dormancy evaluation (D-15), and tracker/blank-state routing — engine.ts never crosses the server/client boundary**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-23T22:37:00Z
- **Completed:** 2026-04-23T22:41:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- Gutted the Plan 03 stub and rebuilt schedule.astro with full SSR fetch + engine integration
- Lazy dormancy detection (D-15): evaluates `detectDormancy(workflow)` on page load; if dormant and status is 'active', PATCHes status='dormant' immediately before render
- Server-side precomputation of all engine outputs: transitionsById, blockedById, gateSubMessageById, overdueReasonById, warnings, metrics — client receives ready-to-render props
- Project client initials computed from `client->firstName`/`client->lastName` with project title fallback
- Added `PROJECT_WORKFLOW_QUERY` and `WORKFLOW_TEMPLATE_BY_ID_QUERY` to `queries.ts` (Rule 3 auto-fix)
- Created `WorkflowTracker.tsx` and `BlankWorkflowState.tsx` stub components with correct props interfaces (Rule 3 auto-fix)

## Task Commits

1. **Task 1: Gut and rebuild schedule.astro** — `97efc48` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/pages/admin/projects/[projectId]/schedule.astro` — Rebuilt SSR page with engine integration, dormancy check, tenant-scoped fetches, and conditional tracker/blank-state rendering
- `src/sanity/queries.ts` — Added `PROJECT_WORKFLOW_QUERY` and `WORKFLOW_TEMPLATE_BY_ID_QUERY` exports
- `src/components/admin/workflow/WorkflowTracker.tsx` — Stub scaffold with correct `WorkflowTrackerProps` interface (to be replaced by Plan 07)
- `src/components/admin/workflow/BlankWorkflowState.tsx` — Stub scaffold with correct `BlankWorkflowStateProps` interface (to be replaced by Plan 07)

## Decisions Made

- Template name is fetched on demand from Sanity (not snapshotted on projectWorkflow) — uses `(deleted template)` fallback if template was deleted
- Engine computation is strictly server-side: plan enforced, no engine import in any TSX file
- Stub components created with accurate prop types so Plans 06/07 can replace them without changing the Astro page

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added PROJECT_WORKFLOW_QUERY + WORKFLOW_TEMPLATE_BY_ID_QUERY to queries.ts**
- **Found during:** Task 1 (schedule.astro rebuild)
- **Issue:** Plan 09 imports `PROJECT_WORKFLOW_QUERY` from queries.ts, but Plan 05 (which adds it) had not been executed yet
- **Fix:** Added both GROQ constants to queries.ts verbatim per Plan 05 Task 1 spec
- **Files modified:** src/sanity/queries.ts
- **Verification:** `grep -c "export const PROJECT_WORKFLOW_QUERY" src/sanity/queries.ts` returns 1
- **Committed in:** 97efc48

**2. [Rule 3 - Blocking] Created WorkflowTracker and BlankWorkflowState component stubs**
- **Found during:** Task 1 (schedule.astro rebuild)
- **Issue:** Plan 09 imports both components from `src/components/admin/workflow/`, but Plans 06/07 (which build them) had not been executed yet; `tsc --noEmit` would fail without the module
- **Fix:** Created stub `.tsx` files with correct props interfaces matching the Plan 07 spec; stubs render a placeholder string instead of actual UI
- **Files modified:** src/components/admin/workflow/WorkflowTracker.tsx, src/components/admin/workflow/BlankWorkflowState.tsx
- **Verification:** `npx tsc --noEmit` produces zero new errors; all errors are pre-existing in unrelated files
- **Committed in:** 97efc48

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking dependency)
**Impact on plan:** Both auto-fixes necessary for the plan to compile. No scope creep — added exactly what Plan 05/07 specified for these artifacts. Full implementations deferred to those plans.

## Known Stubs

| Component | File | Reason |
|-----------|------|--------|
| `WorkflowTracker` | `src/components/admin/workflow/WorkflowTracker.tsx` | Plan 07 not yet executed; stub has correct props interface |
| `BlankWorkflowState` | `src/components/admin/workflow/BlankWorkflowState.tsx` | Plan 07 not yet executed; stub has correct props interface |

These stubs are intentional scaffolding. They will be replaced by Plan 07 without requiring changes to schedule.astro (the props interface is already correct).

## Issues Encountered

- Pre-existing TypeScript errors in 14 unrelated files (EntityListPage.test.tsx, ArtifactApprovalForm.tsx, geminiClient.ts, projectWorkflow.test.ts, image.ts, queries.ts line 92). All pre-date Plan 09 and are out of scope per the deviation scope boundary rule.

## Next Phase Readiness

- schedule.astro is complete and will auto-upgrade when Plans 06/07 replace the stubs
- Plans 04, 05, 06, 07, 08 still need to execute (template CRUD, API endpoints, component primitives, tracker shell)
- The route `/admin/projects/[id]/schedule` currently renders a placeholder UI; blank state becomes functional once Plan 07 ships

---
*Phase: 44-workflow-engine*
*Completed: 2026-04-23*

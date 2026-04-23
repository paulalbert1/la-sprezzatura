---
phase: 44-workflow-engine
plan: 11
subsystem: ui
tags: [dashboard, react, sanity, groq, ssr, workflow, astro]

# Dependency graph
requires:
  - phase: 44-workflow-engine
    plan: 01
    provides: "types.ts — ProjectWorkflow, MilestoneStatus, WorkflowTemplateDefaults"
  - phase: 44-workflow-engine
    plan: 02
    provides: "engine.ts — workflow engine (server-side only)"
provides:
  - "DASHBOARD_WORKFLOW_STATS_QUERY — lightweight GROQ projection for dashboard card"
  - "WorkflowStatusCard — React component with three workflow health count rows"
  - "Dashboard integration — SSR-computed counts mounted on /admin/dashboard"
affects:
  - "44-workflow-engine (end-to-end smoke verification — Task 3 checkpoint)"
  - "Future plans consuming dashboard layout"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lightweight GROQ projection + in-memory aggregation for dashboard cards (avoids heavy server-side joins)"
    - "SSR-computed counts passed as props to React island — engine runs server-side, card is pure UI"
    - "Status-based approximation for blocked count (documented in code; tracker page is source of truth)"

key-files:
  created:
    - src/components/admin/workflow/WorkflowStatusCard.tsx
    - src/components/admin/workflow/WorkflowStatusCard.test.tsx
  modified:
    - src/sanity/queries.ts
    - src/pages/admin/dashboard.astro

key-decisions:
  - "WorkflowStatusCard placed in right column above Tasks card — dashboard uses a 2-col grid (not 12-col), so 'first row next to Tasks' maps to top of right column"
  - "Blocked milestone count uses status-based approximation (not full engine.computeMetrics) because the lightweight projection omits phase.order, phase.execution, and gate fields — dashboard card is a signal, not authority; tracker page has full fidelity"
  - "Zero-state card (hasAnyWorkflows=false) collapses to helper text — card does NOT hide when counts are all zero but workflows exist"

patterns-established:
  - "Dashboard card pattern: eyebrow + 0.5px #E8DDD0 border + #FFFEFB bg + 10px radius — matches existing cards"
  - "Count rows: count > 0 → <a> link with amber color; count === 0 → <span> with muted color"

requirements-completed: [WF-08]

# Metrics
duration: 3min
completed: 2026-04-23
---

# Phase 44 Plan 11: Dashboard Workflow Status Card Summary

**SSR-computed WorkflowStatusCard on /admin/dashboard showing awaiting-client, approaching-dormancy, and blocked-milestone counts derived from a lightweight GROQ projection with in-memory aggregation**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-23T23:25:27Z
- **Completed:** 2026-04-23T23:28:17Z
- **Tasks:** 2 of 3 complete (Task 3 is a human-verify checkpoint — paused)
- **Files modified:** 4

## Accomplishments

- Added `DASHBOARD_WORKFLOW_STATS_QUERY` to `src/sanity/queries.ts` — fetches active/dormant workflows with lightweight projection (no gate fields, no phase.order/execution)
- Implemented `WorkflowStatusCard` React component with three count rows (Awaiting client / Approaching dormancy / Blocked milestones), zero-state, footer link, and eyebrow header matching existing card chrome
- Mounted card on `/admin/dashboard` via SSR frontmatter fetch + in-memory aggregation — three counts computed before React hydration
- 6 Vitest tests passing (TDD RED→GREEN)

## Task Commits

1. **Task 1: Add DASHBOARD_WORKFLOW_STATS_QUERY + WorkflowStatusCard component** - `31e1550` (feat — TDD)
2. **Task 2: dashboard.astro — fetch stats and mount card** - `13f6955` (feat)
3. **Task 3: Phase 44 end-to-end smoke verification** — checkpoint:human-verify (paused, awaiting user approval)

## Files Created/Modified

- `src/components/admin/workflow/WorkflowStatusCard.tsx` — Dashboard card: three count rows + zero-state + footer link
- `src/components/admin/workflow/WorkflowStatusCard.test.tsx` — 6 Vitest tests covering all branches
- `src/sanity/queries.ts` — Appended DASHBOARD_WORKFLOW_STATS_QUERY (lightweight workflow payload)
- `src/pages/admin/dashboard.astro` — Imported card + query, added SSR fetch/compute block, mounted card in right column

## Decisions Made

- WorkflowStatusCard placed in right column above DashboardTasksCard — the current dashboard is a 2-col grid (not 12-col as UI-SPEC assumed), so "first row next to Tasks card" maps naturally to top of right column
- Blocked milestone approximation: uses `status === "not_started" AND hardPrereq status NOT in [complete, skipped]` from the same lightweight projection — documented in code comment per plan spec; dashboard is a signal, tracker page is source of truth
- Zero-state behavior: card collapses to helper text when `hasAnyWorkflows=false`; shows muted "0" rows when workflows exist but all counts are zero (per UI-SPEC Claude's discretion resolution)

## Deviations from Plan

None — plan executed exactly as written. The 12-col grid note in UI-SPEC was a guidance note, not a constraint; the 2-col layout on the actual dashboard is the correct placement target.

## Issues Encountered

- Pre-existing `npx tsc --noEmit` errors in unrelated files (EntityListPage.test.tsx, PhaseAccordion.tsx, ArtifactApprovalForm.tsx, geminiClient.ts, queries.ts line 92) — all pre-date this plan, none in files modified here. Out of scope per deviation rules scope boundary.

## Known Stubs

None — WorkflowStatusCard receives real SSR-computed counts from GROQ. The card is fully wired.

## Threat Flags

None — tenant isolation is maintained via `getTenantClient(tenantId)` in dashboard.astro frontmatter (same pattern as all other dashboard data fetches). Query-param filter values on row links are static strings, not user input.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Task 3 (human-verify checkpoint) is the final gate for Phase 44
- All 11 plans are committed; Task 3 asks user to walk through the full end-to-end smoke test (template CRUD → instantiate → transition → multi-instance → dashboard reflects)
- Phase 44 will be complete once the user approves the smoke verification

---
*Phase: 44-workflow-engine*
*Completed: 2026-04-23*

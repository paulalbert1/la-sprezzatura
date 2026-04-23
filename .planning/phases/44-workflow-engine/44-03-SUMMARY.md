---
phase: 44-workflow-engine
plan: "03"
subsystem: workflow
tags: [cleanup, seed-data, frappe-gantt, tdd]
dependency_graph:
  requires: [44-01]
  provides: [seeds-module, gantt-retirement]
  affects: [44-04, schedule-astro]
tech_stack:
  added: []
  removed: [frappe-gantt, "@svar-ui/react-gantt"]
  patterns: [tdd-red-green, type-only-import]
key_files:
  created:
    - src/lib/workflow/seeds.ts
    - src/lib/workflow/seeds.test.ts
  modified:
    - src/pages/admin/projects/[projectId]/schedule.astro
    - package.json
    - package-lock.json
  deleted:
    - src/components/admin/ScheduleEditor.tsx
    - src/lib/gantt/GanttChart.tsx
    - src/lib/gantt/frappe-gantt.css
    - src/lib/gantt/gantt.css
    - src/lib/gantt/ganttColors.test.ts
    - src/lib/gantt/ganttColors.ts
    - src/lib/gantt/ganttDates.test.ts
    - src/lib/gantt/ganttDates.ts
    - src/lib/gantt/ganttTransforms.test.ts
    - src/lib/gantt/ganttTransforms.ts
    - src/lib/gantt/ganttTypes.ts
    - src/pages/api/admin/schedule-date.ts
    - src/pages/api/admin/schedule-dependency.ts
    - src/pages/api/admin/schedule-event.ts
decisions:
  - Three starter template constants exported from seeds.ts use deterministic kebab-case ids and _key fields per Sanity requirements
  - schedule.astro patched with inline GROQ fetch for project title (no non-existent getProjectById import) — minimal stub until Plan 09 WorkflowTracker replaces it
  - Pre-existing typecheck errors (geminiClient, ArtifactApprovalForm, etc.) confirmed unrelated to gantt removal; not touched per scope boundary rule
metrics:
  duration: "~10 minutes"
  completed: "2026-04-23"
  tasks_completed: 2
  files_changed: 17
---

# Phase 44 Plan 03: Seed Data + Frappe Gantt Retirement Summary

Three starter workflow templates encoded as type-safe TypeScript data and Frappe Gantt fully retired — ScheduleEditor, gantt utilities, three schedule API routes, and both npm packages removed with zero new test failures.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Define starter templates in seeds.ts (TDD) | a8eb782 (RED), f8602ca (GREEN) | seeds.ts, seeds.test.ts |
| 2 | Retire Frappe Gantt | f72c176 | 14 deletions, schedule.astro patch, package.json |

## What Was Built

### Task 1: Starter Template Seeds (TDD)

`src/lib/workflow/seeds.ts` exports three `WorkflowTemplate` constants conforming to the type surface from Plan 01:

- **`SEED_FULL_SERVICE_RESIDENTIAL`** — 6 phases, 26 milestones (Onboarding, Design development, Trade coordination, Project management & procurement, Installation, Walkthrough & closeout). Trade coordination phase has 4 multi-instance milestones with 3 default instances each (Carpet installer, Electrician, Painter). Installation has 1 multi-instance milestone with 4 defaults (Furniture delivery, Carpet install, Window treatments, Lighting). Payment gates on Retainer paid and Merchandise payment; approval gates on Client selects option and Trade contract.

- **`SEED_DESIGN_CONSULTATION`** — 3 phases, 8 milestones (Onboarding, Consultation, Follow-up). Lightweight engagement — no procurement, no trades, no installation. Two optional milestones in Follow-up phase.

- **`SEED_STAGING`** — 5 phases, 10 milestones (Onboarding, Preparation, Staging, Photography, De-staging). Unique de-staging phase with property-sold approval gate. Multi-instance delivery/placement and furniture pickup milestones.

All seeds use spec §9 contract-derived defaults: `clientApprovalDays: 10`, `dormancyDays: 60`, `revisionRounds: 1`, `version: 1`.

Every phase carries a `_key` and every milestone carries a `_key` for Sanity array validation. All milestone ids are deterministic kebab-case slugs with guaranteed uniqueness within each template.

**TDD gate compliance:**
- RED commit `a8eb782` — 9 failing shape tests
- GREEN commit `f8602ca` — all 9 tests pass

### Task 2: Frappe Gantt Retirement

Deleted 14 files totalling ~3,800 lines:
- `src/components/admin/ScheduleEditor.tsx` (1,528-line React island)
- `src/lib/gantt/` (10 files: GanttChart.tsx, frappe-gantt.css, gantt.css, ganttColors/Dates/Transforms/Types with tests)
- `src/pages/api/admin/schedule-date.ts`, `schedule-dependency.ts`, `schedule-event.ts`

Removed 33 npm packages: `frappe-gantt`, `@svar-ui/react-gantt`, and their transitive deps.

Patched `schedule.astro` with a minimal placeholder (inline GROQ fetch for project title + "under construction" message) to keep the branch deployable between Plan 03 and Plan 09 when `WorkflowTracker` replaces it fully.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-existent `getProjectById` import in schedule.astro placeholder**
- **Found during:** Task 2
- **Issue:** Plan template used `getProjectById` which does not exist in `src/sanity/queries.ts`. Using it would cause a build error.
- **Fix:** Used an inline GROQ fetch via the tenant client directly (`client.fetch<{_id:string; title:string}|null>(...)`) — the same pattern used by `getAdminScheduleData`. No new query function needed.
- **Files modified:** `src/pages/admin/projects/[projectId]/schedule.astro`
- **Commit:** f72c176

## Known Stubs

- `schedule.astro` renders "Schedule UI under construction" — intentional placeholder. Plan 09 will replace with `WorkflowTracker` component. The plan explicitly documents this as a temporary stub.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. Deleted code reduced attack surface by removing three schedule mutation API routes.

## Self-Check: PASSED

- `src/lib/workflow/seeds.ts` — EXISTS
- `src/lib/workflow/seeds.test.ts` — EXISTS (9/9 tests pass)
- Commit `a8eb782` — EXISTS (RED test commit)
- Commit `f8602ca` — EXISTS (GREEN implementation commit)
- Commit `f72c176` — EXISTS (Frappe Gantt retirement)
- `src/lib/gantt/` — GONE
- `src/components/admin/ScheduleEditor.tsx` — GONE
- `package.json` — no `frappe-gantt` or `@svar-ui/react-gantt` references

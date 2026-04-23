---
phase: 44
plan: "07"
subsystem: workflow-ui
tags: [components, tracker-shell, react-island, tdd]
dependency_graph:
  requires: [44-01, 44-02, 44-05, 44-06]
  provides: [WorkflowTracker island, WorkflowHeader, WorkflowMetrics, WorkflowWarnings, BlankWorkflowState]
  affects: [schedule.astro (Plan 09 mount point)]
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN with @vitest-environment jsdom + afterEach(cleanup)
    - Optimistic-with-rollback: snap wf state → POST → replace on success or rollback + toast on error
    - Per-island ToastContainer provider (React context does not cross Astro island boundaries)
    - StatusPickerPopover portal mounted from WorkflowTracker via state (picker context)
key_files:
  created:
    - src/components/admin/workflow/WorkflowHeader.tsx
    - src/components/admin/workflow/WorkflowHeader.test.tsx
    - src/components/admin/workflow/WorkflowMetrics.tsx
    - src/components/admin/workflow/WorkflowMetrics.test.tsx
    - src/components/admin/workflow/WorkflowWarnings.tsx
    - src/components/admin/workflow/WorkflowWarnings.test.tsx
    - src/components/admin/workflow/BlankWorkflowState.test.tsx
    - src/components/admin/workflow/WorkflowTracker.test.tsx
  modified:
    - src/components/admin/workflow/BlankWorkflowState.tsx (stub → full implementation)
    - src/components/admin/workflow/WorkflowTracker.tsx (stub → full implementation)
decisions:
  - afterEach(cleanup) required in all React island tests — jsdom accumulates portal/DOM nodes across tests without it (same pattern as Plan 06 portal components)
  - Overflow menu div aria-label changed from "Project workflow options" to "Workflow options" to avoid duplicate with button aria-label causing getByRole to find multiple elements
  - WorkflowTracker onChangeTemplate/onTerminate use toast stub for now — full lifecycle modals deferred to Plan 09 Astro page integration
  - derivePhaseStatus is a local pure function in WorkflowTracker (not imported from engine.ts) — engine is server-only, cannot run on client
metrics:
  duration: "~6 minutes"
  completed: "2026-04-23T23:18:07Z"
  tasks_completed: 3
  files_created: 10
  files_modified: 2
  tests_added: 32
  tests_passing: 56
---

# Phase 44 Plan 07: Tracker Shell Components Summary

**One-liner:** WorkflowTracker island with Header + Metrics + Warnings + PhaseAccordion composition, optimistic status updates with rollback, and BlankWorkflowState POSTing to the lifecycle endpoint.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | WorkflowHeader + WorkflowMetrics + WorkflowWarnings | `0e715f6` | 6 files created |
| 2 | BlankWorkflowState (fetch + CTA) | `86ecf23` | 2 files (test created, impl replaced stub) |
| 3 | WorkflowTracker (island root + optimistic status + API) | `cdb4ba7` | 2 files (test created, impl replaced stub) |

## What Was Built

### WorkflowHeader (`0e715f6`)
- 36px avatar circle with client initials on `#F3EDE3` bg / `#6B5E52` text
- Project name at 15/600, sub-line `{templateName} · Started {Month D, YYYY}` at 11px muted
- Status pill with 4 states: active `#EEF3E3/#27500A`, dormant `#FBEEE8/#9B3A2A`, complete `#EEF3E3/#27500A`, terminated `#F3EDE3/#9E8E80`
- Overflow menu with 4 items: Change template, Terminate workflow (hidden when terminated), Reactivate (only when dormant), View template (opens in new tab)
- `aria-label="Project workflow options"` on trigger button per UI-SPEC flag
- Outside click + Escape key closes menu

### WorkflowMetrics (`0e715f6`)
- 4-card grid (`grid-cols-4 gap-2`) on `#F3EDE3` (parchment) surface
- Colors: Complete `#27500A`, In progress `#9A7B4B`, Awaiting client `#854F0B`, Blocked `#6B5E52`
- Progress bar: 8px tall `#F3EDE3` track, fill color by pct (>60 → `#27500A`, 30-60 → `#9A7B4B`, ≤30 → `#854F0B`)
- Label row: "Overall progress" (left) + "{pct}%" (right) at 11px muted

### WorkflowWarnings (`0e715f6`)
- Severity-driven colors: error/dormant → `#FBEEE8/#9B3A2A`; warning → `#FAEEDA/#854F0B`
- `role="alert"` on error severity; `role="status"` on warning severity
- Collapse at >4: shows first 3 + `+N more warnings` expandable button
- Expand-on-click reveals all remaining warnings

### BlankWorkflowState (`86ecf23`)
- Luxury card (max-width 420px, centered, `#FFFEFB` bg, 0.5px warm border, 10px radius)
- Native `<select>` with "Choose a template…" placeholder, CTA disabled until selection
- POSTs `{ templateId }` to `/api/admin/projects/${projectId}/workflow`; on success → `window.location.reload()`
- On error → toast with server's error message via `useToast()`
- No-templates branch shows explanatory copy + link to `Go to Settings → Workflow Templates`
- Wrapped in `<ToastContainer>`

### WorkflowTracker (`cdb4ba7`)
- Full island root: composes WorkflowHeader → WorkflowWarnings → WorkflowMetrics → PhaseAccordions → StatusPickerPopover
- `picker` state: `{ anchor, phaseId, milestoneId, instanceKey? } | null` — mounts StatusPickerPopover when set
- `handlePick`: optimistic close of picker → POST to milestone-status → on success replaces `wf` with server response → on failure restores snapshot + toast
- `handleAddInstance` / `handleRemoveInstance`: POST/DELETE to `/instance` with same snap/restore pattern
- `derivePhaseStatus`: local pure function (not from engine.ts — engine is server-only)
- `defaultOpen`: first phase always open if no phase is in_progress

## Test Coverage

All 56 workflow component tests pass:

```
✓ WorkflowMetrics.test.tsx         (4 tests)
✓ WorkflowWarnings.test.tsx        (6 tests)
✓ StatusCircle.test.tsx            (5 tests)   ← Plan 06
✓ StatusPickerPopover.test.tsx     (6 tests)   ← Plan 06
✓ BlankWorkflowState.test.tsx      (5 tests)
✓ WorkflowHeader.test.tsx          (11 tests)
✓ PhaseAccordion.test.tsx          (4 tests)   ← Plan 06
✓ MilestoneRow.test.tsx            (9 tests)   ← Plan 06
✓ WorkflowTracker.test.tsx         (6 tests)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] `afterEach(cleanup)` added to all three Plan 07 test files**
- **Found during:** Task 1 GREEN run — "Found multiple elements" errors in jsdom
- **Issue:** jsdom accumulates DOM nodes across tests without explicit cleanup; the vitest.config.ts environment defaults to node with per-component jsdom opt-in, so global cleanup doesn't run automatically
- **Fix:** Added `afterEach(cleanup)` to WorkflowHeader.test.tsx, WorkflowMetrics.test.tsx, WorkflowWarnings.test.tsx (and proactively to BlankWorkflowState.test.tsx and WorkflowTracker.test.tsx)
- **Files modified:** All 5 test files

**2. [Rule 1 - Bug] Overflow menu `aria-label` de-duplication**
- **Found during:** Task 1 GREEN run — test `getByRole("button", { name: /project workflow options/i })` found two elements (trigger button + menu div)
- **Fix:** Changed menu `div[role="menu"]` `aria-label` from `"Project workflow options"` to `"Workflow options"` — the button retains the exact UI-SPEC flag label
- **Files modified:** WorkflowHeader.tsx

## Known Stubs

None — all plan deliverables are fully implemented. WorkflowTracker's `onChangeTemplate` and `onTerminate` callbacks show a temporary toast message (placeholder for AdminModal confirms per UI-SPEC). The full lifecycle modal flow is the responsibility of Plan 09 (schedule.astro Astro page integration).

## Threat Surface Scan

No new network endpoints introduced in this plan. All API calls originate from client-side fetch in existing endpoint paths validated by Plan 05 API routes. No `dangerouslySetInnerHTML` used anywhere in the workflow component directory (grep-verified).

## Self-Check: PASSED

- [x] WorkflowHeader.tsx exists
- [x] WorkflowMetrics.tsx exists
- [x] WorkflowWarnings.tsx exists
- [x] BlankWorkflowState.tsx exists (fully implemented)
- [x] WorkflowTracker.tsx exists (fully implemented)
- [x] Commit `0e715f6` exists
- [x] Commit `86ecf23` exists
- [x] Commit `cdb4ba7` exists
- [x] 56 tests pass
- [x] No `dangerouslySetInnerHTML`

---
phase: 44-workflow-engine
plan: "06"
subsystem: workflow-tracker-components
tags: [components, tracker, react, tdd, accessibility]
dependency_graph:
  requires: [44-01, 44-02]
  provides: [StatusCircle, StatusPickerPopover, MilestoneRow, PhaseAccordion]
  affects: [44-07-WorkflowTracker]
tech_stack:
  added: []
  patterns:
    - StatusCircle: button role with aria-label/aria-disabled, 6-status color system per UI-SPEC
    - StatusPickerPopover: createPortal to body, role=menu/menuitem, ArrowUp/Down nav, Escape+outside-click dismiss
    - MilestoneRow: date-fns date formatting (timezone-safe date-part slicing), StatusCircle composition, inline add/remove confirm
    - PhaseAccordion: CollapsibleSection keyboard pattern adapted, ChevronRight rotation, role=button+aria-expanded
key_files:
  created:
    - src/components/admin/workflow/StatusCircle.tsx
    - src/components/admin/workflow/StatusCircle.test.tsx
    - src/components/admin/workflow/StatusPickerPopover.tsx
    - src/components/admin/workflow/StatusPickerPopover.test.tsx
    - src/components/admin/workflow/MilestoneRow.tsx
    - src/components/admin/workflow/MilestoneRow.test.tsx
    - src/components/admin/workflow/PhaseAccordion.tsx
    - src/components/admin/workflow/PhaseAccordion.test.tsx
  modified: []
decisions:
  - StatusPickerPopover uses createPortal to document.body so it escapes overflow-hidden containers in the accordion body
  - Date formatting uses date-part slicing (isoStr.slice(0, 10)) not parseISO to avoid UTC-midnight timezone shift to previous day in Eastern time
  - afterEach(cleanup) required in portal tests — jsdom reuses document between tests, causing accumulated portal nodes and "multiple elements" query errors
  - StatusCircle omits redundant role="button" attribute (button element already has implicit button role); avoids "multiple elements" test error
  - MilestoneRow assignee dot colors defined as unquoted object keys (TypeScript idiom); plan's grep acceptance check uses quoted string pattern that requires -E flag
  - PhaseAccordion always hides body when not expanded (unmount pattern matches CollapsibleSection.tsx analog, avoids state leaks)
metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_created: 8
  files_modified: 0
  completed_date: "2026-04-23"
---

# Phase 44 Plan 06: Tracker Primitive Components Summary

**One-liner:** Four tracker UI primitives — StatusCircle (6-status color system), StatusPickerPopover (portal + keyboard nav), MilestoneRow (assignee dot, optional pill, multi-instance sub-rows), PhaseAccordion (expand/collapse, parallel pill, status pill) — with 24 passing TDD tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | StatusCircle + StatusPickerPopover (+ tests) | e35f516 | StatusCircle.tsx, StatusCircle.test.tsx, StatusPickerPopover.tsx, StatusPickerPopover.test.tsx |
| 2 | MilestoneRow + PhaseAccordion (+ tests) | 2051481 | MilestoneRow.tsx, MilestoneRow.test.tsx, PhaseAccordion.tsx, PhaseAccordion.test.tsx |

## Test Results

24 tests across 4 files — all passing.

| File | Tests | Result |
|------|-------|--------|
| StatusCircle.test.tsx | 5 | PASS |
| StatusPickerPopover.test.tsx | 6 | PASS |
| MilestoneRow.test.tsx | 9 | PASS |
| PhaseAccordion.test.tsx | 4 | PASS |

## Acceptance Criteria Verification

- `test -f src/components/admin/workflow/StatusCircle.tsx` — PASS
- `test -f src/components/admin/workflow/StatusPickerPopover.tsx` — PASS
- `grep -c "#27500A" StatusCircle.tsx` — 2 (complete color) — PASS
- `grep -c "#9A7B4B" StatusCircle.tsx` — 2 (in_progress gold) — PASS
- `grep -c "#854F0B" StatusCircle.tsx` — 1 (awaiting amber) — PASS
- `grep -c "#FAEEDA" StatusCircle.tsx` — 1 (awaiting fill) — PASS
- `grep -c 'role="menu"' StatusPickerPopover.tsx` — 1 — PASS
- `grep -c 'role="menuitem"' StatusPickerPopover.tsx` — 2 — PASS
- `grep -c "createPortal" StatusPickerPopover.tsx` — 2 (import + call) — PASS
- `grep -c "AdminModal" StatusPickerPopover.tsx` — 1 (comment only — "NOT AdminModal") — PASS (spirit: no import/usage)
- `grep -c "Escape" StatusPickerPopover.tsx` — 3 — PASS
- `grep -ci "change status" StatusPickerPopover.tsx` — 2 — PASS
- `grep -c "StatusCircle" MilestoneRow.tsx` — 4 — PASS
- `grep -c "line-through" MilestoneRow.tsx` — 2 — PASS
- `grep -c "Add contractor" MilestoneRow.tsx` — 2 — PASS
- `grep -c "instances" MilestoneRow.tsx` — 2 — PASS
- Assignee colors (`designer/client/vendor/trade`) present as unquoted object keys — PASS
- `grep -c "MilestoneRow" PhaseAccordion.tsx` — 8 — PASS
- `grep -c "aria-expanded" PhaseAccordion.tsx` — 2 — PASS
- `grep -ci "parallel" PhaseAccordion.tsx` — 6 — PASS
- No `dangerouslySetInnerHTML` in any workflow component — PASS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Timezone shift in date formatting**
- **Found during:** Task 2 (MilestoneRow test: "renders completion date when status=complete")
- **Issue:** `parseISO("2026-04-20T00:00:00Z")` returns Apr 19 in Eastern timezone (UTC midnight = previous evening local), causing test failure
- **Fix:** Slice ISO string to date portion (`isoStr.slice(0, 10)`) and construct local date via `new Date(year, month-1, day)`, avoiding UTC-to-local shift
- **Files modified:** `src/components/admin/workflow/MilestoneRow.tsx`
- **Commit:** 2051481

**2. [Rule 1 - Bug] Redundant role="button" on button element**
- **Found during:** Task 1 (StatusCircle tests: "Found multiple elements with role button")
- **Issue:** `<button role="button">` gives button element two button roles; testing-library's `getByRole("button")` found duplicates
- **Fix:** Removed explicit `role="button"` attribute — `<button>` has implicit button role
- **Files modified:** `src/components/admin/workflow/StatusCircle.tsx`
- **Commit:** e35f516

**3. [Rule 1 - Bug] Portal DOM accumulation between tests**
- **Found during:** Task 1 (StatusPickerPopover tests: "Found multiple elements with role menu")
- **Issue:** React portals render to `document.body` which jsdom shares across tests; without cleanup, menus accumulate
- **Fix:** Added `afterEach(cleanup)` to StatusPickerPopover.test.tsx and StatusCircle.test.tsx
- **Files modified:** Test files only
- **Commit:** e35f516

## Known Stubs

None. All four components are fully wired — props flow to rendered DOM with correct behavior. No placeholder text or hardcoded empty values.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. All new surfaces are purely presentational React components. Threat model mitigations verified:

| Threat | Status |
|--------|--------|
| T-44-06-01 XSS via milestone.name | Mitigated — React auto-escapes all JSX text nodes; no dangerouslySetInnerHTML anywhere |
| T-44-06-02 StatusPickerPopover bypasses engine via keyboard | Mitigated — component is presentational; disabled rows have `disabled` HTML attribute blocking click; server re-validates on POST |
| T-44-06-03 Outside-click listener leaks | Mitigated — useEffect cleanup removes event listener on unmount; afterEach(cleanup) in tests confirms no accumulation |

## Self-Check: PASSED

All 9 files found on disk. Both task commits (e35f516, 2051481) verified in git log.

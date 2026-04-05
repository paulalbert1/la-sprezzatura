---
phase: 19-gantt-layout-polish
plan: 02
subsystem: sanity-studio-layout
tags: [css, mutation-observer, pane-hiding, dom-manipulation]
dependency_graph:
  requires: []
  provides: [LAYOUT-01-css-pane-hiding, mutation-observer-pane-management]
  affects: [src/sanity/studio.css, src/sanity/components/StudioNavbar.tsx]
tech_stack:
  added: []
  patterns: [CSS-first-then-JS-backup, MutationObserver-over-polling]
key_files:
  created: []
  modified:
    - src/sanity/studio.css
    - src/sanity/components/StudioNavbar.tsx
decisions:
  - CSS-first pane hiding prevents flash before JS runs; MutationObserver provides instant backup
  - requestAnimationFrame ensures DOM is ready before observer.observe()
  - Observer targets structure-tool container with document.body fallback
metrics:
  duration: 105s
  completed: 2026-04-05T21:11:18Z
  tasks_completed: 1
  tasks_total: 1
  files_modified: 2
---

# Phase 19 Plan 02: Reliable First Pane Hiding Summary

CSS-first `[data-pane-index="0"]` hiding rule eliminates Content pane flash, with MutationObserver replacing 4x setTimeout + setInterval polling for instant re-hide on navigation.

## What Was Done

### Task 1: Add CSS-first pane hiding and replace setInterval with MutationObserver

**Commit:** 02cc25b

**Part A -- CSS-first pane hiding (studio.css):**
- Added `[data-pane-index="0"] { display: none !important; }` rule that hides the Content type list pane before any JavaScript runs
- Added `[data-pane-index="0"] + * { display: none !important; }` to hide the divider/resizer that follows the first pane
- Placed immediately before the existing SIDEBAR / PANE LIST section for logical grouping

**Part B -- MutationObserver replacement (StudioNavbar.tsx):**
- Removed the 4 `setTimeout(hideFirstPane, ...)` calls at 100ms, 500ms, 1500ms, and 3000ms
- Removed the `setInterval(hideFirstPane, 2000)` polling loop
- Added single initial `hideFirstPane()` call for any panes already in DOM
- Added `MutationObserver` that calls `hideFirstPane()` instantly when Sanity re-renders panes on navigation
- Observer targets `[data-testid="structure-tool"]` with `document.body` fallback
- Observer config: `{ childList: true, subtree: true, attributes: true, attributeFilter: ['data-pane-index', 'style', 'hidden'] }`
- Uses `requestAnimationFrame` to ensure DOM is ready before observing
- Cleanup via `observer.disconnect()` in useEffect return

**Preserved unchanged:**
- `hideFirstPane()` function (lines 39-80) -- all 3 DOM strategies intact
- `findDocListPane()` function (lines 86-102) -- sidebar toggle dependency
- Force-light-mode localStorage/data-scheme block (lines 126-143)
- `toggleSidebar` callback and all JSX

## Verification Results

| Check | Result |
|-------|--------|
| CSS `[data-pane-index="0"]` rule in studio.css | PASS |
| CSS adjacent sibling rule for divider | PASS |
| MutationObserver in StudioNavbar.tsx | PASS |
| observer.disconnect() in cleanup | PASS |
| setInterval removed | PASS |
| setTimeout(hideFirstPane removed | PASS |
| hideFirstPane function preserved | PASS |
| force-light-mode preserved | PASS |
| toggleSidebar preserved | PASS |
| vitest run (gantt + utility tests) | PASS (pre-existing blob-serve/rendering failures unrelated) |

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- no stubs, placeholders, or hardcoded empty values introduced.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 02cc25b | feat(19-02): CSS-first pane hiding with MutationObserver backup |

## Self-Check: PASSED

- FOUND: src/sanity/studio.css
- FOUND: src/sanity/components/StudioNavbar.tsx
- FOUND: .planning/phases/19-gantt-layout-polish/19-02-SUMMARY.md
- FOUND: commit 02cc25b

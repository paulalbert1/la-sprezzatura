---
phase: 35-dashboard-polish-global-ux-cleanup
plan: 01
subsystem: admin-ui-foundations
tags: [trades, formatters, dates, dashboard, DASH-10, DASH-19]
dependency-graph:
  requires: []
  provides:
    - "formatTrade(slug) utility at src/lib/trades.ts — every admin + portal trade render site consumes it"
    - "absolute-date pattern (format(parseISO(d), 'MMM d')) replacing every relative-time string on admin surfaces"
  affects:
    - ".planning/phases/35-dashboard-polish-global-ux-cleanup/* (downstream plans reuse formatTrade and absolute dates)"
    - "DASH-10, DASH-19 partially complete; dashboard + project detail + contractor pill sites covered"
tech-stack:
  added: []
  patterns:
    - "display-only trade formatting via centralized map + normaliser fallback"
    - "absolute MMM d dates with red-600 for overdue (no badge chrome)"
key-files:
  created:
    - src/lib/trades.ts
    - src/lib/trades.test.ts
    - .planning/phases/35-dashboard-polish-global-ux-cleanup/deferred-items.md
  modified:
    - src/components/admin/QuickAssignTypeahead.tsx
    - src/components/admin/EntityListPage.tsx
    - src/components/portal/ContractorSection.astro
    - src/pages/admin/dashboard.astro
    - src/pages/admin/projects/[projectId]/index.astro
    - src/components/admin/ProcurementEditor.tsx
decisions:
  - "Use hyphen-preserving 'Electrical rough-in' form per D-14 canonical; underscore/unknown slugs normalise to sentence case"
  - "Preserve raw slugs as the on-wire / state representation; swap only rendered text"
  - "Kept overdue banner long-form 'N days overdue' copy per D-08 copywriting row"
  - "Extended scope of Task 3 to include admin project-detail page and ProcurementEditor (Rule 2: incomplete purge would break DASH-10 must-have)"
metrics:
  duration: "~7 minutes (execution time after worktree recovery)"
  completed: "2026-04-14"
  tasks_completed: 3
  commits: 4
---

# Phase 35 Plan 01: Dashboard Foundations — formatTrade + relative-time purge Summary

One-liner: Centralised trade-slug display via `formatTrade(slug)` and purged every relative-time string from admin surfaces, replacing them with absolute `MMM d` dates. Foundation for the rest of Phase 35.

## What shipped

### Task 1: formatTrade utility

`src/lib/trades.ts` exports:

- `TRADE_LABELS: Record<string, string>` — canonical sentence-case strings for every slug referenced anywhere in the codebase (26 entries). Covers the Plan 35-01 canonical list (construction-phase trades: `electrical-rough-in`, `hvac`, `painting`, ...) plus the legacy `EntityDetailForm` options (`electrician`, `plumber`, `custom-millwork`, `tile-stone`, `window-treatments`, `other`).
- `formatTrade(slug: string | undefined | null): string` — returns the mapped label for known slugs; otherwise replaces hyphens/underscores with spaces, lowercases, and capitalises only the first letter. Empty/null/undefined return `""`.

Test coverage in `src/lib/trades.test.ts`: 20 Vitest cases, all green.

Commits: `66cf8ae` (test RED), `88bbedb` (feat GREEN).

### Task 2: render-site swap

- `src/components/admin/QuickAssignTypeahead.tsx` — trade-picker dropdown now renders `{formatTrade(trade)}`. Raw slug still used for `key`, `onClick → handleTradeSelect(trade)`, and the contractor-assign API payload.
- `src/components/admin/EntityListPage.tsx` — pill labels pass through `formatTrade`. Search field now matches both raw slugs and formatted labels (`[...entity.trades, ...entity.trades.map(formatTrade)].join(' ').toLowerCase()`), so typing either `electrical-rough-in` or `electrical rough-in` hits.
- `src/components/portal/ContractorSection.astro` — portal contractor trade pill renders `{formatTrade(trade)}`.

Commit: `4e6a117`.

### Task 3: relative-time purge (admin scope)

- `src/pages/admin/dashboard.astro`
  - Deleted dead helpers `getDaysOverdueStr` and `getDaysUntilStr`.
  - Removed `formatDistanceToNow` and `differenceInDays` imports (unused).
  - Active Projects card: `{daysInStage}d` → `Since {format(parseISO(project.stageChangedAt), 'MMM d')}`. `daysStale = daysInStage >= 14` still drives the red-600 semibold treatment.
- `src/pages/admin/projects/[projectId]/index.astro`
  - Header meta: `{daysInStage}d in stage` → `Since {MMM d}` (absolute).
  - Dropped the now-unused `getDaysInStage` import.
- `src/components/admin/ProcurementEditor.tsx`
  - Sync indicator: `Synced {formatDistanceToNow(..., { addSuffix: true })}` → `Synced {format(parseISO(item.lastSyncAt), 'MMM d')}`. Removed `formatDistanceToNow` from date-fns import.
- Overdue banner long-form `N days overdue` copy (dashboard.astro lines 95, 104) preserved intentionally per D-08.

Commit: `d0a0f42`.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 66cf8ae | test(35-01): add failing test for formatTrade utility |
| 2 | 88bbedb | feat(35-01): implement formatTrade utility and TRADE_LABELS map |
| 3 | 4e6a117 | feat(35-01): swap admin + portal trade render sites to formatTrade() |
| 4 | d0a0f42 | feat(35-01): purge relative-time strings from admin surfaces (DASH-10) |

## Acceptance criteria

- `grep -n "export function formatTrade" src/lib/trades.ts` → 1 match ✓
- `grep -n "export const TRADE_LABELS" src/lib/trades.ts` → 1 match ✓
- `npx vitest run src/lib/trades.test.ts` → 20 passed, 0 failed ✓
- `grep -rn "formatTrade" src/components/admin/ src/components/portal/` → 9 matches (>= 3 required) ✓
- `grep -rn "formatDistanceToNow" src/pages/admin/ src/components/admin/` → 0 matches ✓
- `grep -rn "getDaysOverdueStr|getDaysUntilStr" src/pages/admin/ src/components/admin/` → 0 matches ✓
- `grep -n "{daysInStage}d" src/pages/admin/dashboard.astro` → 0 matches ✓
- `grep -n 'Since \${format' src/pages/admin/dashboard.astro` → 1 match ✓
- Overdue banner `day(s) overdue` long-form copy preserved (lines 95, 104) ✓
- `npx vitest run src/lib/dashboardUtils.test.ts` → 32 passed ✓
- `handleTradeSelect(trade)` still called with raw slug (line 283) ✓

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 — missing critical functionality] Extended admin-scope purge to project-detail page and ProcurementEditor**

- **Found during:** Task 3 final sweep (`grep -rn "formatDistanceToNow\|{.*}d.*stage" src/pages/admin/ src/components/admin/`)
- **Issue:** Plan Task 3 named only `src/pages/admin/dashboard.astro`, but DASH-10 must-have is "no relative-time badges render on any admin surface". Two other admin sites rendered them: `src/pages/admin/projects/[projectId]/index.astro` (`{daysInStage}d in stage` header pill) and `src/components/admin/ProcurementEditor.tsx` (`formatDistanceToNow` on lastSyncAt). Leaving them unfixed would invalidate the plan's must-have truth `No relative-time badges (...) render on any admin surface`.
- **Fix:** Replaced both with absolute `MMM d` dates matching the dashboard pattern. Dropped the unused `getDaysInStage` import from index.astro and dropped `formatDistanceToNow` from ProcurementEditor's date-fns import.
- **Files modified:** `src/pages/admin/projects/[projectId]/index.astro`, `src/components/admin/ProcurementEditor.tsx`
- **Commit:** `d0a0f42`

### Deferred issues (out of scope)

**23 pre-existing test failures** — surfaced by full `npx vitest run`. None touch files modified by this plan. STATE.md already notes "Pre-existing test failures (14 tests) need cleanup"; the count grew during v5.0 without cleanup. Details logged to `.planning/phases/35-dashboard-polish-global-ux-cleanup/deferred-items.md`. Recommend a dedicated cleanup plan in v5.1 after feature work lands.

### Worktree recovery

The worktree branch `worktree-agent-a6aa4e2b` was created from commit `ffbfebc` (a stale line predating v5.0), not the expected base `cb4fbe9` (main HEAD). Recovered by resetting the branch to the correct base and checking out all files from `cb4fbe9`; no work lost (the stale commits remain reachable via reflog and other worktree branches). Untracked Sanity Studio artefacts materialised by the checkout were left in place (out-of-scope cleanup).

## Self-Check: PASSED

- `src/lib/trades.ts` exists ✓
- `src/lib/trades.test.ts` exists ✓
- Commit `66cf8ae` found in git log ✓
- Commit `88bbedb` found in git log ✓
- Commit `4e6a117` found in git log ✓
- Commit `d0a0f42` found in git log ✓
- `src/lib/trades.ts` exports `formatTrade` and `TRADE_LABELS` ✓
- `formatTrade` imported in 3 admin/portal component files ✓
- All 20 + 32 tests in trades.test.ts + dashboardUtils.test.ts pass ✓
- 0 `formatDistanceToNow` / `getDaysOverdueStr` / `getDaysUntilStr` references remain on admin surfaces ✓

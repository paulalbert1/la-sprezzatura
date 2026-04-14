---
phase: 35-dashboard-polish-global-ux-cleanup
plan: 03
subsystem: admin-dashboard
tags: [dashboard, projects, DASH-16, react-island, filter]
dependency-graph:
  requires:
    - "Plan 35-01 absolute-date convention (Since {MMM d}) — preserved on the right-aligned stage-date column"
    - "Plan 35-02 <CardFilterInput /> primitive at src/components/admin/ui/CardFilterInput.tsx — reused verbatim"
  provides:
    - "<ActiveProjectsCard /> React island replacing the inline Astro Active Projects card"
    - "STAGE_COLORS Tailwind class map now exported from src/lib/portalStages.ts"
  affects:
    - "src/pages/admin/dashboard.astro (Projects card replaced; local STAGE_COLORS map removed; dead imports pruned)"
    - "src/lib/portalStages.ts (new STAGE_COLORS export — same palette previously inline in dashboard.astro and LinkedProjects.tsx)"
tech-stack:
  added: []
  patterns:
    - "React island replaces Astro template for interactive card (filter + state)"
    - "Filter state scoped to the card (useState, no persistence, resets on reload — D-04)"
    - "Stage label match via STAGE_META[key].title — single source of truth for display strings"
key-files:
  created:
    - src/components/admin/ActiveProjectsCard.tsx
    - src/components/admin/ActiveProjectsCard.test.tsx
  modified:
    - src/lib/portalStages.ts
    - src/pages/admin/dashboard.astro
decisions:
  - "Promoted the Tailwind STAGE_COLORS map to portalStages.ts as a named export (canonical). The dashboard + ActiveProjectsCard consume it; LinkedProjects.tsx still has an identical inline copy (out of scope — consolidating it in a focused sweep avoids surprise visual diffs on that page). ProjectsGrid.tsx uses a different hex-based palette and is intentionally excluded."
  - "Filter input lives in the card header (below the title + divider, with py-3 vertical rhythm) — matches UpcomingDeliveriesCard from Plan 02 for visual symmetry between the two left-column cards."
  - "Card always renders the filter input, even in the 'No active projects' empty state. This matches the UI-SPEC 'Primary Visual Anchors' row where the filter is a header fixture."
  - "Stage label match uses STAGE_META[key].title (e.g., 'Design Development'), not the raw slug, so users typing what they *see* in the stage pill get hits (D-03)."
metrics:
  duration: "~7 minutes"
  completed: "2026-04-14"
  tasks_completed: 2
  commits: 3
---

# Phase 35 Plan 03: Active Projects card — filter + React island Summary

One-liner: Lifted the Active Projects dashboard card into a React island (`<ActiveProjectsCard />`) with a live free-text filter matching project name, client name, and stage label per DASH-16 / D-03 / D-04. Visual parity with the pre-refactor inline Astro card.

## What shipped

### Task 1: ActiveProjectsCard React island

`src/components/admin/ActiveProjectsCard.tsx` — owns:

- **Filter state** (`useState<string>("")`). Case-insensitive substring match over `title`, `clientName ?? ""`, and `STAGE_META[pipelineStage]?.title ?? ""`. Live per-keystroke, no debounce. Resets on reload per D-04 (useState only, no URL param / localStorage).
- **Row cap**: slices the incoming `projects` prop to 8 before filtering — same cap as the pre-refactor `displayProjects = data.activeProjects.slice(0, 8)` in dashboard.astro.
- **Empty states** (per 35-UI-SPEC copywriting contract):
  - No projects at all → `"No active projects"`
  - Filter non-empty AND no matches → `"No projects match your filter."`
- **Row visual** — preserved verbatim from the inline Astro version:
  - Project title (`text-[13.5px] font-medium font-body text-charcoal`, truncate)
  - Client name below (`text-[11.5px] text-stone-light font-body`, truncate, `mt-0.5`)
  - Stage pill using `STAGE_COLORS[stage]` bg/text classes (`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold`)
  - Right-aligned absolute date `Since {MMM d}` from `stageChangedAt`; `red-600 font-semibold` when `getDaysInStage >= 14`, else `text-stone-light`
- **Footer**: `View all {totalCount} projects` link rendered only when `totalCount > 8`. Links to `/admin/projects` unchanged.
- **Props shape**: `{ projects: ProjectRow[]; totalCount: number }` where `ProjectRow = { _id, title, clientName, pipelineStage, stageChangedAt }` — exported for callers.

`src/lib/portalStages.ts` — new export:

```ts
export const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  discovery: { bg: "bg-stone-100", text: "text-stone-600" },
  concept: { bg: "bg-amber-50", text: "text-amber-800" },
  "design-development": { bg: "bg-blue-50", text: "text-blue-800" },
  procurement: { bg: "bg-emerald-50", text: "text-emerald-800" },
  installation: { bg: "bg-violet-50", text: "text-violet-800" },
  closeout: { bg: "bg-stone-100", text: "text-stone-600" },
};
```

Test coverage (`src/components/admin/ActiveProjectsCard.test.tsx`): 13 Vitest cases, all green.

Commits: `34931b3` (test RED), `147edd7` (feat GREEN).

### Task 2: dashboard.astro wiring

`src/pages/admin/dashboard.astro`:

- Added import `ActiveProjectsCard from "../../components/admin/ActiveProjectsCard.tsx"`.
- Replaced the entire inline `<div>…</div>` Active Projects card (pre-refactor lines 96–151) with:
  ```astro
  <ActiveProjectsCard
    client:load
    projects={data.activeProjects}
    totalCount={data.activeProjects.length}
  />
  ```
- Removed the local `STAGE_COLORS` map (now imported from portalStages.ts via the card).
- Removed the `displayProjects = data.activeProjects.slice(0, 8)` helper — the island caps internally.
- Pruned now-unused imports from the frontmatter: `STAGE_META`, `type StageKey` (from portalStages), and `getDaysInStage` (from dashboardUtils). `format`/`parseISO` stay — still used for the page-level `today` date.
- Left-column ordering preserved: Active Projects above Upcoming Deliveries.

Commit: `13c668b`.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 34931b3 | test(35-03): add failing test for ActiveProjectsCard |
| 2 | 147edd7 | feat(35-03): implement ActiveProjectsCard React island with filter |
| 3 | 13c668b | feat(35-03): mount ActiveProjectsCard island on dashboard |

## Acceptance criteria

Task 1 — ActiveProjectsCard:

- `grep -c "Active Projects" src/components/admin/ActiveProjectsCard.tsx` → 2 (>= 1) ✓
- `grep -c "Filter projects" src/components/admin/ActiveProjectsCard.tsx` → 2 (placeholder `Filter projects…` + ariaLabel `Filter projects`; substring present) ✓
- `grep -c "No projects match your filter" src/components/admin/ActiveProjectsCard.tsx` → 1 ✓
- `grep -c "CardFilterInput" src/components/admin/ActiveProjectsCard.tsx` → 2 (import + usage) ✓
- `grep -c "Since " src/components/admin/ActiveProjectsCard.tsx` → 1 ✓
- `grep -cE "STAGE_META|STAGE_COLORS" src/components/admin/ActiveProjectsCard.tsx` → 5 (>= 2) ✓
- 13 vitest cases pass ✓

Task 2 — dashboard wiring:

- `grep -c "import ActiveProjectsCard" src/pages/admin/dashboard.astro` → 1 ✓
- `grep -c "<ActiveProjectsCard" src/pages/admin/dashboard.astro` → 1 ✓
- `<ActiveProjectsCard client:load` present on the mount ✓
- `grep -c "Active Projects</h2>" src/pages/admin/dashboard.astro` → 0 (inline card removed) ✓
- `grep -c "displayProjects" src/pages/admin/dashboard.astro` → 0 ✓
- `npx vitest run` (plan-adjacent subset) → 85 passed, 0 failed ✓

## Deviations from Plan

### Auto-fixed issues

None. All modifications stayed within the plan's stated file set. No Rule 1 / Rule 2 / Rule 3 fixes triggered.

### Deferred issues (out of scope)

**Dead code in dashboard.astro** — `formatMilestoneDate`, `overdueMilestones`, and `upcomingMilestones` are defined but unused after Plan 35-02 shrank the card set. Not introduced by this plan; see `deferred-items.md` for the broader dashboard cleanup backlog.

**`LinkedProjects.tsx` still declares a local `STAGE_COLORS`** identical to the one now exported from `portalStages.ts`. Consolidating means a focused sweep of that component's imports; keeping it out of this plan avoids an unrelated diff on a non-dashboard surface. Added to `deferred-items.md`.

**`ProjectsGrid.tsx` uses a different hex-value palette** for stage colors. Intentionally not merged into the canonical map — the two palettes render different surfaces (pill chips vs. card backgrounds) and reconciling them requires a UI-SPEC decision, not a mechanical merge.

### Worktree recovery

The worktree branch started at commit `ffbfebc` (ancestor of the expected base `e4714b5`, which includes Plan 35-01 and 35-02 commits plus the 35-05 worktree merge). Fast-forwarded via `git merge --ff-only e4714b5` before starting work — no conflicts, no work lost. The plan file `35-03-PLAN.md` (and `35-CONTEXT.md`, `35-UI-SPEC.md`) were not yet tracked in the main branch at this ref; copied from the canonical path in the main repo at `/Users/paulalbert/Dropbox/GitHub/la-sprezzatura/.planning/phases/35-dashboard-polish-global-ux-cleanup/` into the worktree for read-only reference (not committed). Standard recovery pattern matching Plans 35-01 and 35-02.

## Self-Check: PASSED

- `src/components/admin/ActiveProjectsCard.tsx` exists ✓
- `src/components/admin/ActiveProjectsCard.test.tsx` exists ✓
- `src/lib/portalStages.ts` modified (new STAGE_COLORS export) ✓
- `src/pages/admin/dashboard.astro` modified (mounts `<ActiveProjectsCard />`) ✓
- Commit `34931b3` in git log ✓
- Commit `147edd7` in git log ✓
- Commit `13c668b` in git log ✓
- 13 ActiveProjectsCard tests + 9 CardFilterInput tests + 11 UpcomingDeliveriesCard tests + 20 trades tests + 32 dashboardUtils tests → 85 passed ✓
- 0 `displayProjects` / `Active Projects</h2>` references remain on `src/pages/admin/dashboard.astro` ✓

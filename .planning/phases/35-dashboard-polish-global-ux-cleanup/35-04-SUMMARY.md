---
phase: 35-dashboard-polish-global-ux-cleanup
plan: 04
subsystem: admin-dashboard
tags: [dashboard, contractors, quick-assign, DASH-17, DASH-18, trades]
dependency-graph:
  requires:
    - "Plan 35-01 formatTrade(slug) utility at src/lib/trades.ts — used in quick-assign success copy and Contractor card trade pills"
  provides:
    - "Dashboard Contractor card with + Add new contractor header CTA routing to /admin/contractors/new"
    - "QuickAssignTypeahead single-trade bypass: contractors with exactly one trade skip the picker and assign directly"
    - "getAdminDashboardData now returns data.contractors (top 6 by _createdAt desc)"
  affects:
    - "src/pages/admin/dashboard.astro (new Contractor card in right column)"
    - "src/sanity/queries.ts (ADMIN_DASHBOARD_CONTRACTORS_QUERY + Promise.all extension)"
    - "src/components/admin/QuickAssignTypeahead.tsx (handleSelect branch + showConfirmation trade-label overload)"
tech-stack:
  added: []
  patterns:
    - "Dashboard data loader parallel-fetches Contractor list via GROQ; render is a pure Astro card (no React island) since no interactive state required"
    - "Single-trade bypass routed through the existing assignContractor path so tests, state transitions, and confirmation timer are all reused — no new code paths in the state machine"
    - "Confirmation copy takes an optional formatted-trade label; legacy callers (multi-trade picker, clients) unchanged via default-free second arg"
key-files:
  created:
    - src/components/admin/QuickAssignTypeahead.test.tsx
  modified:
    - src/components/admin/QuickAssignTypeahead.tsx
    - src/pages/admin/dashboard.astro
    - src/sanity/queries.ts
decisions:
  - "Contractor card rendered inline as Astro markup (no React island) — no filter, no disclosure, no client-side state. Matches the card chrome of ActiveProjectsCard visually but avoids unnecessary islands on an SSR page."
  - "Card placed in the right column, below DashboardTasksCard — per plan guidance (right column is visually lighter post-35-02/03)."
  - "Reused the existing inline confirmation chip (setConfirmMessage) rather than wiring a ToastContainer into the QuickAssignTypeahead call sites. QuickAssignTypeahead is used in multiple places and adding a ToastContainer dependency would require a parent provider everywhere. The inline chip already exists and the UI-SPEC copy slots into it cleanly."
  - "Trade pills on the Contractor card capped at 3 per row with max-w-[55%] clamp so wide lists don't overflow card width; overflow trades are silently dropped (future enhancement: '+N more' affordance, deferred)."
  - "Left the /admin/contractors/new create page out of scope — the plan and STATE.md explicitly note this as a separate backlog item ('Admin contractor create/edit form — replace retired Studio contractor management'). The CTA links to the future URL per the plan's href contract."
metrics:
  duration: "~10 minutes (execution time after worktree recovery)"
  completed: "2026-04-14"
  tasks_completed: 2
  commits: 3
---

# Phase 35 Plan 04: Contractor Card + Single-Trade Bypass Summary

One-liner: Added a dashboard Contractor card with a `+ Add new contractor` CTA and bypassed the trade-picker in `QuickAssignTypeahead` when the selected contractor has exactly one trade (DASH-17, DASH-18).

## What shipped

### Task 1: Single-trade bypass (DASH-18)

`src/components/admin/QuickAssignTypeahead.tsx`:

- `handleSelect` for contractors now branches on `entity.trades.length === 1` — calls `assignContractor(entity, entity.trades[0])` directly and returns, never touching `selectingTrade`.
- `assignContractor` passes `formatTrade(trade)` to `showConfirmation` so single-trade success copy reads `Assigned {name} as {formattedTrade}.` (matches UI-SPEC copywriting row).
- `showConfirmation` accepts an optional `tradeLabel` second arg; when provided, produces the new copy; when absent, falls back to the legacy `{name} assigned` (keeps client + multi-trade paths byte-identical).
- 0-trade and 2+ trade branches unchanged: picker still renders, "No trades listed" fallback still renders.

`src/components/admin/QuickAssignTypeahead.test.tsx` (new file, 5 Vitest cases):

1. Contractor with 1 trade → assigns immediately, trade picker NEVER renders, POST body carries the single trade
2. Contractor with 1 trade → success confirmation uses formatted trade label (`Assigned Solo Trade Co as Electrical rough-in.`)
3. Contractor with 2+ trades → picker renders with each option passing through `formatTrade` (no bypass)
4. Contractor with 0 trades → `No trades listed` fallback still renders
5. Client entity → unaffected by bypass; POSTs to `/api/admin/clients`, not `/api/admin/contractors`; picker never shows

Commits: `cd5f6bb` (test RED), `fac2f4d` (feat GREEN).

### Task 2: Dashboard Contractor card + Add-new-contractor CTA (DASH-17)

`src/sanity/queries.ts`:

- New `ADMIN_DASHBOARD_CONTRACTORS_QUERY` — `*[_type == "contractor"] | order(_createdAt desc) [0...6] { _id, name, company, trades }`.
- `getAdminDashboardData` parallel-fetches contractors alongside the existing five queries (no extra network round trips — single `Promise.all`). Returned payload gains `data.contractors: { _id, name, company, trades }[]`.

`src/pages/admin/dashboard.astro`:

- Imports `formatTrade` from `src/lib/trades`.
- New Contractor card in the right column below `DashboardTasksCard`. Chrome matches `ActiveProjectsCard`: same `px-5 pt-[18px] pb-0` header band, same 10.5px uppercase `Contractors` label, same `#E8DDD0` hairline divider, same row rhythm.
- Header-right anchor: `<a href="/admin/contractors/new" class="inline-flex items-center gap-1.5 text-[13px] font-body text-terracotta border border-terracotta/40 rounded-md px-3 py-1 hover:bg-terracotta/5 transition-colors focus:outline-none focus:ring-1 focus:ring-terracotta">` with inline lucide `Plus` SVG (14px) + `Add new contractor`. Style matches UI-SPEC § "Header-right action button".
- Row list: contractor name (13.5px medium charcoal), optional company line (11.5px stone-light), and up to 3 trade pills rendered via `formatTrade(trade)` (stone-tone pills). Row links to `/admin/contractors/{_id}`.
- Empty state: `No contractors yet.` in `text-sm text-stone text-center py-6`.
- No modal introduced (grep for `AdminModal` on dashboard.astro → 0).

Commit: `796057f`.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | cd5f6bb | test(35-04): add failing tests for QuickAssignTypeahead single-trade bypass |
| 2 | fac2f4d | feat(35-04): single-trade bypass in QuickAssignTypeahead (DASH-18) |
| 3 | 796057f | feat(35-04): add Contractor card with Add-new-contractor CTA (DASH-17) |

## Acceptance criteria

Task 1 — QuickAssignTypeahead:

- `grep -n "trades.length === 1\|trades?.length === 1" src/components/admin/QuickAssignTypeahead.tsx` → 1 match (line 215) ✓
- `grep -c "formatTrade" src/components/admin/QuickAssignTypeahead.tsx` → 3 matches (import + picker render + confirmation) ✓
- Test file has 5 test cases covering single/multi/zero-trade + client paths ✓
- `npx vitest run src/components/admin/QuickAssignTypeahead.test.tsx` → 5 passed ✓
- Multi-trade picker behavior preserved (test 3 asserts) ✓

Task 2 — Dashboard Contractor card:

- `grep -n 'href="/admin/contractors/new"' src/pages/admin/dashboard.astro` → 1 match ✓
- `grep -n "Add new contractor" src/pages/admin/dashboard.astro` → 2 matches (1 code + 1 comment) ✓
- `grep -o "terracotta" src/pages/admin/dashboard.astro | wc -l` → 4 occurrences (text-terracotta, border-terracotta/40, bg-terracotta/5, ring-terracotta) ✓
- `grep -n "focus:ring-terracotta" src/pages/admin/dashboard.astro` → 1 match ✓
- Anchor sits inside the card header (same `<div class="flex items-center justify-between">` as the h2 title) ✓
- No `AdminModal` added — `grep -n "AdminModal" src/pages/admin/dashboard.astro` → 0 ✓

Plan-adjacent test suite sanity:

- `npx vitest run QuickAssignTypeahead.test.tsx trades.test.ts ActiveProjectsCard.test.tsx UpcomingDeliveriesCard.test.tsx CardFilterInput.test.tsx` → 58 passed, 0 failed ✓

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — blocking issue] Implicit-any on `data.contractors.map((contractor) => ...)` in dashboard.astro**

- **Found during:** `npx astro check` after Task 2 implementation.
- **Issue:** The new Contractor card mapper introduced `ts(7006) Parameter 'contractor' implicitly has an 'any' type` because `data.contractors` inherits `getAdminDashboardData`'s loose return-type inference. Other map callbacks on the page already produce the same warning (pre-existing; see Plan 35-02 summary), but this one was introduced by my change so it's in-scope.
- **Fix:** Inline-typed the map parameter as `(contractor: { _id: string; name: string; company: string | null; trades: string[] | null })`. No return-type inference change needed.
- **Files modified:** `src/pages/admin/dashboard.astro` (fixed inline before commit).
- **Commit:** `796057f`.

### Deferred issues (out of scope)

**`/admin/contractors/new` route does not exist yet** — The CTA links there per the plan's href contract, but the create page itself is listed in STATE.md Pending Todos ("Admin contractor create/edit form — replace retired Studio contractor management"). The plan explicitly scopes out the create page ("the existing full contractor create page"). UAT must note: clicking the CTA will 404 until that route is built. Logged to `deferred-items.md`.

**Pre-existing TypeScript errors in dashboard.astro** — 4 implicit-`any` errors on pre-Plan-04 mapper callbacks (lines 30, 31, 32, 102). Not introduced by this plan. Already catalogued by Plan 35-02's summary.

**Untracked Sanity Studio artifacts** — Still materialized in the working tree (`sanity.config.ts`, `src/sanity/actions/*`, `src/sanity/components/*`, etc.). Matches the state after Plans 01–03; intentionally not committed. See 35-01-SUMMARY.md § "Worktree recovery" for context.

### Worktree recovery

The worktree branch was created from commit `ffbfebc` (ancestor of the expected base `faf3e6a`, which includes Plan 35-01/02/03/05 commits). Recovered via `git reset --soft faf3e6aebc1da1a318c8bdf81e3433a891e65748 && git checkout HEAD -- .` per the worktree bootstrap instructions. Soft reset left a pile of pre-existing untracked-but-now-indexed Sanity Studio files staged; unstaged them with `git reset HEAD .` before committing to keep Plan 04 commits scoped to just the two tasks' files. Copied `35-04-PLAN.md`, `35-CONTEXT.md`, `35-UI-SPEC.md` from the main repo into the worktree's `.planning/phases/…` for read-only reference (not committed). No work lost.

## Self-Check: PASSED

- `src/components/admin/QuickAssignTypeahead.test.tsx` exists ✓
- `src/components/admin/QuickAssignTypeahead.tsx` modified (bypass + trade-label confirmation) ✓
- `src/pages/admin/dashboard.astro` modified (Contractor card + CTA) ✓
- `src/sanity/queries.ts` modified (ADMIN_DASHBOARD_CONTRACTORS_QUERY + Promise.all extension) ✓
- Commit `cd5f6bb` in git log ✓
- Commit `fac2f4d` in git log ✓
- Commit `796057f` in git log ✓
- 5 QuickAssignTypeahead tests + plan-adjacent subset (58 total) → all green ✓
- `href="/admin/contractors/new"` present on dashboard.astro ✓
- `trades.length === 1` bypass branch present on QuickAssignTypeahead.tsx line 215 ✓

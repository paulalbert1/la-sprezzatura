---
phase: 35-dashboard-polish-global-ux-cleanup
plan: 02
subsystem: admin-dashboard
tags: [dashboard, deliveries, DASH-11, DASH-12, DASH-13, DASH-14, DASH-15, react-island, filter, ship24]
dependency-graph:
  requires:
    - "Plan 35-01 absolute-date format convention (format(parseISO(d), 'MMM d')) — reused for carrier ETA rendering"
  provides:
    - "<CardFilterInput /> shared primitive at src/components/admin/ui/CardFilterInput.tsx — reusable for Projects card filter (downstream plan 35-03)"
    - "<UpcomingDeliveriesCard /> React island replacing the inline Astro Deliveries card on /admin/dashboard"
    - "getAdminDashboardData delivery rows now carry clientName + delivered flag + lowercase carrier slug"
  affects:
    - "src/pages/admin/dashboard.astro (Deliveries card replaced)"
    - "src/sanity/queries.ts (ADMIN_DASHBOARD_DELIVERIES_QUERY widened to include delivered items)"
tech-stack:
  added: []
  patterns:
    - "React island replaces Astro template for interactive card (filter + disclosure)"
    - "GROQ pre-resolves display fields (clientName) to avoid client-side joins"
    - "Ship24 carrierName normalised to lowercase at flattener boundary so rendering layer uses slug-keyed maps"
key-files:
  created:
    - src/components/admin/ui/CardFilterInput.tsx
    - src/components/admin/ui/CardFilterInput.test.tsx
    - src/components/admin/UpcomingDeliveriesCard.tsx
    - src/components/admin/UpcomingDeliveriesCard.test.tsx
  modified:
    - src/sanity/queries.ts
    - src/pages/admin/dashboard.astro
decisions:
  - "GROQ widened to include delivered rows with a derived `delivered: status == \"delivered\"` flag (D-06 alternative A) — keeps a single network fetch; card hides delivered rows until user opts in, matching the no-extra-loads UX intent"
  - "clientName pulled via project's primary client join (`clients[0].client->name`) — matches the pre-existing pattern in getPortalProjectBaseData (queries.ts:729)"
  - "carrier field stored as lowercase slug at flattener boundary; card uses `{ fedex, ups, usps }` match map — keeps the client component pure, no string normalisation in the render pass"
  - "Added `delivered` status to DELIVERY_STATUS map inside UpcomingDeliveriesCard (emerald tone) so revealed delivered rows still render a pill — the UI-SPEC did not require this but a blank status cell for disclosed rows would look broken (Rule 2: missing critical functionality)"
  - "Kept `DELIVERY_STATUS`, `formatDeliveryDate` out of the shared lib on purpose — scoped to the card, where it is the only consumer (one owner per concept)"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-14"
  tasks_completed: 3
  commits: 6
---

# Phase 35 Plan 02: Upcoming Deliveries card rebuild Summary

One-liner: Replaced the static Astro Deliveries card with an interactive React island — "Upcoming Deliveries" with a live free-text filter, delivered-history disclosure, client-name-first row layout, and carrier ETA gated on Ship24 tracked carriers ({FedEx, UPS, USPS}).

## What shipped

### Task 1: `<CardFilterInput />` shared primitive

`src/components/admin/ui/CardFilterInput.tsx` — controlled text input with:

- Leading `Search` icon (14px, `text-stone-light`) inside a `pl-8` wrapper.
- Trailing `X` clear button rendered only when `value.length > 0`; click calls `onChange("")`.
- Live per-keystroke `onChange` (no debounce).
- `aria-label` falls back to `placeholder`; `ariaLabel` prop overrides.
- Exact UI-SPEC classes: `text-[13px] font-body text-charcoal bg-transparent border border-stone-light/40 rounded-md px-3 py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-terracotta placeholder:text-stone-light`.
- `className` prop merges onto outer wrapper for width overrides.
- `type="text"`, `autoComplete="off"`, `spellCheck={false}`.

Test coverage (`src/components/admin/ui/CardFilterInput.test.tsx`): 9 vitest cases, all green.

Commits: `4065442` (test RED), `674c410` (feat GREEN).

### Task 2: `<UpcomingDeliveriesCard />` React island

`src/components/admin/UpcomingDeliveriesCard.tsx` — owns:

- **Filter state** (`useState<string>("")`). Case-insensitive substring match against `name | clientName | projectTitle | trackingNumber | carrier`. Synchronous, no debounce.
- **Delivered-history disclosure** (`useState<boolean>(false)`). Shows `Show delivered ({N})` link at card bottom when `deliveredCount > 0`; swaps to `Hide delivered` when expanded. Reload resets to hidden.
- **Row visual order** — client name (lead, `text-sm font-medium text-charcoal`), item (11px `text-stone-light`), project (11px `text-stone-light`); status pill + carrier ETA right-aligned.
- **Carrier ETA gating** — renders `ETA {MMM d} · {Carrier}` only when `carrier` is one of `{fedex, ups, usps}` AND `expectedDeliveryDate` present; otherwise the slot is omitted (not an empty string).
- **Empty states** — `"All caught up — no undelivered items."` when none outstanding; `"No deliveries match your filter."` when filter hides all matches.
- **Status pills** — carries forward the original `DELIVERY_STATUS` map (ordered/warehouse/in-transit) plus a new `delivered` tone (emerald) for the disclosed rows.

Test coverage (`src/components/admin/UpcomingDeliveriesCard.test.tsx`): 11 vitest cases, all green.

Commits: `9815027` (test RED), `9e81e9e` (feat GREEN).

### Task 3: Dashboard wiring + GROQ extension

**`src/sanity/queries.ts`**:

- `ADMIN_DASHBOARD_DELIVERIES_QUERY` widened from `status in ["ordered","warehouse","in-transit"]` to include `"delivered"`. Each row now carries a derived `delivered: status == "delivered"` boolean.
- Project row now projects `clientName: clients[0].client->name` (same pattern used by `getPortalProjectBaseData`).
- Flattener surfaces `clientName` onto each row and converts the pre-existing `carrierName` (`"FedEx"`, `"UPS"`, ...) to a lowercase `carrier` slug, so the render layer uses a simple slug-keyed map.

**`src/pages/admin/dashboard.astro`**:

- Imports `UpcomingDeliveriesCard` and replaces the inline Deliveries card (lines 153–197 of the pre-change file) with `<UpcomingDeliveriesCard client:load deliveries={data.deliveries} />`.
- Removes `displayDeliveries = data.deliveries.slice(0, 6)` (card owns its own rendering cap via filter + disclosure).
- Removes `formatDeliveryDate` helper and the `DELIVERY_STATUS` constant (both moved into the card).

Commits: `1776bf1` (wiring + query), `25e9e15` (comment scrub).

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 4065442 | test(35-02): add failing test for CardFilterInput primitive |
| 2 | 674c410 | feat(35-02): implement CardFilterInput primitive |
| 3 | 9815027 | test(35-02): add failing tests for UpcomingDeliveriesCard |
| 4 | 9e81e9e | feat(35-02): implement UpcomingDeliveriesCard React island |
| 5 | 1776bf1 | feat(35-02): wire UpcomingDeliveriesCard into dashboard + extend delivery query |
| 6 | 25e9e15 | chore(35-02): scrub formatDeliveryDate from dashboard.astro comment |

## Acceptance criteria

Task 1 — CardFilterInput:

- `grep -n "export default function CardFilterInput" src/components/admin/ui/CardFilterInput.tsx` → 1 ✓
- `grep -c "lucide-react" src/components/admin/ui/CardFilterInput.tsx` → 1 ✓
- `grep -c "Search" src/components/admin/ui/CardFilterInput.tsx` → 3 (>= 1) ✓
- `grep -c "focus:ring-terracotta" src/components/admin/ui/CardFilterInput.tsx` → 1 ✓
- `grep -c "text-[13px]" src/components/admin/ui/CardFilterInput.tsx` → 1 ✓
- 9 vitest cases pass ✓

Task 2 — UpcomingDeliveriesCard:

- `grep -c "Upcoming Deliveries" src/components/admin/UpcomingDeliveriesCard.tsx` → 1 ✓
- `grep -c "Filter deliveries" src/components/admin/UpcomingDeliveriesCard.tsx` → 2 (>= 1) ✓
- `grep -c "Show delivered" src/components/admin/UpcomingDeliveriesCard.tsx` → 2 (>= 1) ✓
- `grep -c "Hide delivered" src/components/admin/UpcomingDeliveriesCard.tsx` → 2 (>= 1) ✓
- `grep -c "All caught up" src/components/admin/UpcomingDeliveriesCard.tsx` → 2 (>= 1) ✓
- `grep -c "No deliveries match your filter" src/components/admin/UpcomingDeliveriesCard.tsx` → 1 ✓
- `grep -cE "FedEx|UPS|USPS" src/components/admin/UpcomingDeliveriesCard.tsx` → 3 (>= 3) ✓
- `grep -cE "fedex|ups|usps" src/components/admin/UpcomingDeliveriesCard.tsx` → 4 (>= 3) ✓
- `grep -c "CardFilterInput" src/components/admin/UpcomingDeliveriesCard.tsx` → 2 (>= 2) ✓
- 11 vitest cases pass ✓

Task 3 — Dashboard wiring:

- `grep -c "import UpcomingDeliveriesCard" src/pages/admin/dashboard.astro` → 1 ✓
- `grep -c "<UpcomingDeliveriesCard" src/pages/admin/dashboard.astro` → 1 ✓
- `grep "UpcomingDeliveriesCard client:load" src/pages/admin/dashboard.astro` → 1 ✓
- `grep -c "Deliveries</h2>" src/pages/admin/dashboard.astro` → 0 ✓
- `grep -cE "formatDeliveryDate|displayDeliveries" src/pages/admin/dashboard.astro` → 0 ✓
- `grep -c delivered src/sanity/queries.ts` → 5 (>= 1) ✓
- `grep -c clientName src/sanity/queries.ts` → 11 (>= 1) ✓
- `grep -c trackingNumber src/sanity/queries.ts` → 7 (>= 1) ✓
- `grep -c carrier src/sanity/queries.ts` → 7 (>= 1) ✓
- `npx vitest run src/components/admin/ui/CardFilterInput.test.tsx src/components/admin/UpcomingDeliveriesCard.test.tsx src/lib/trades.test.ts src/lib/dashboardUtils.test.ts` → 72 passed, 0 failed ✓

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 — missing critical functionality] Added `delivered` tone to DELIVERY_STATUS map**

- **Found during:** Task 2 implementation.
- **Issue:** The legacy `DELIVERY_STATUS` map only had `ordered | warehouse | in-transit`. Widening the query to return delivered rows meant the disclosed rows would render no status pill (the component short-circuits when `statusInfo` is undefined). A blank status cell next to a delivered item would look broken and mis-signal "unknown status" for a revealed history row.
- **Fix:** Added `delivered: { label: "Delivered", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" }` to the card-local map. Emerald was chosen to echo the existing procurement success tone elsewhere in v5.0 (`procurement` stage color at dashboard.astro:44).
- **Files modified:** `src/components/admin/UpcomingDeliveriesCard.tsx` (card-local map only — no other sites carry this tone in this plan).
- **Commit:** `9e81e9e`.

### Deferred issues (out of scope)

**Pre-existing TypeScript errors in dashboard.astro and other files** — `astro check` reports 41 errors across the codebase; 5 are in dashboard.astro and relate to implicit-`any` parameters on pre-existing `.map((p) =>` callsites that were introduced before Plan 35-02. None touch the code introduced or modified by this plan. Catalogued (by count) in `.planning/phases/35-dashboard-polish-global-ux-cleanup/deferred-items.md`; no action taken.

**Pre-existing vitest failures** — already recorded in `deferred-items.md` by Plan 35-01 (23 suites unrelated to Phase 35 scope). Re-ran the same plan-adjacent subset (trades + dashboardUtils + new CardFilterInput + UpcomingDeliveriesCard) and it passes 72/72.

### Worktree recovery

The worktree branch was created from commit `ffbfebc` (ancestor of the expected base `78ac258`, which includes Plan 35-01 commits `66cf8ae..d0a0f42`). Fast-forwarded via `git merge --ff-only 78ac258` before starting work — no conflicts, no work lost, all four Plan 35-01 commits now in the history. This matches the "stale worktree base" recovery pattern noted in the 35-01 summary.

## Self-Check: PASSED

- `src/components/admin/ui/CardFilterInput.tsx` exists ✓
- `src/components/admin/ui/CardFilterInput.test.tsx` exists ✓
- `src/components/admin/UpcomingDeliveriesCard.tsx` exists ✓
- `src/components/admin/UpcomingDeliveriesCard.test.tsx` exists ✓
- `src/pages/admin/dashboard.astro` modified (mounts UpcomingDeliveriesCard island) ✓
- `src/sanity/queries.ts` modified (delivered + clientName + carrier projected) ✓
- Commit `4065442` in git log ✓
- Commit `674c410` in git log ✓
- Commit `9815027` in git log ✓
- Commit `9e81e9e` in git log ✓
- Commit `1776bf1` in git log ✓
- Commit `25e9e15` in git log ✓
- 9 CardFilterInput tests + 11 UpcomingDeliveriesCard tests + 20 trades tests + 32 dashboardUtils tests → 72 passed ✓
- 0 `formatDeliveryDate` / `displayDeliveries` / `DELIVERY_STATUS` / `Deliveries</h2>` references remain on `src/pages/admin/dashboard.astro` ✓

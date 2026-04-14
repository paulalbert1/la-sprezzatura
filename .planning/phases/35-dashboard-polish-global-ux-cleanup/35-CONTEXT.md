# Phase 35: Dashboard Polish & Global UX Cleanup - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Liz's admin dashboard surfaces only action-required signal: no relative-time badges, an "Upcoming Deliveries" card with free-text filter and delivered-history disclosure, a free-text filter on the Projects card, a working contractor quick-add + single-trade auto-assign, sentence-case trade labels everywhere, and Tasks cards that expose "Add task" and hide completed work by default.

Requirements scope: DASH-10 through DASH-22 (13 reqs). No scope for schedule/Gantt, procurement modal (Phase 37), or vendor/client model refinements (Phase 40/41).
</domain>

<decisions>
## Implementation Decisions

### Filter behavior (DASH-15, DASH-16)
- **D-01:** Live per-keystroke filtering on both Upcoming Deliveries and Projects cards. Client-side only; no debounce (lists are small, <100 rows).
- **D-02:** Upcoming Deliveries filter matches item name, client name, project name, and tracking number / carrier (case-insensitive substring).
- **D-03:** Projects filter matches project name, client name, and stage label (case-insensitive substring).
- **D-04:** Filter text resets on page reload (useState in the card component, no persistence, no URL param).

### Delivered history disclosure (DASH-12)
- **D-05:** Delivered items surface via an inline "Show delivered (N)" link at the bottom of the Upcoming Deliveries card. Click appends delivered rows inline below active rows. No modal, no separate route.
- **D-06:** By default only undelivered rows render; delivered rows hydrate on first expand and stay visible until reload.

### Carrier ETA (DASH-14)
- **D-07:** When Ship24 has no tracked carrier, the ETA slot renders nothing (collapsed). No "No tracking" label, no fallback to expected install date. Keeps the card noise-free and consistent with D-08.

### Relative-time badges (DASH-10)
- **D-08:** Purge all `Nd` / `Nw` / `formatDistanceToNow()` outputs from every admin surface (dashboard + project detail + client/contractor pages). Replace with absolute dates (e.g., `Apr 22`). Includes overdue ticks — use absolute due date instead.
- **D-09:** `formatDistanceToNow` imports from `date-fns` stay only if used in a non-admin surface (portal, emails); otherwise remove.

### Upcoming Deliveries card rename + rows (DASH-11, DASH-13)
- **D-10:** Card title renamed from "Deliveries" to "Upcoming Deliveries".
- **D-11:** Row visual order: client name (lead) → item → project. Carrier ETA secondary, per D-07.

### Add-contractor entry (DASH-17)
- **D-12:** "Add new contractor" button on the dashboard Contractor card routes to `/admin/contractors/new` (the existing full contractor create page). No new modal, no inline mini-form.

### Quick-assign single-trade (DASH-18)
- **D-13:** When the selected contractor has exactly one trade, skip the trade-picker step and assign directly. When multiple trades, the picker still shows.

### Trade label rendering (DASH-19)
- **D-14:** Display-only: introduce a single `formatTrade(slug)` util (e.g., `electrical-rough-in` → `Electrical rough-in`). Slugs stay in Sanity; every render site swaps to use the util. No data migration.
- **D-15:** Util covers all current trades plus unknown-slug fallback (title-case the slug on the fly).

### Tasks cards (DASH-20, DASH-21, DASH-22)
- **D-16:** "Add task" button renders in the card header, right-aligned, on the dashboard Tasks card, project-detail Tasks card, and client Tasks card.
- **D-17:** Completed tasks hidden by default. A "Show completed (N)" reveal link expands them inline. State is `useState` in the card — remount/reload resets to hidden. No sessionStorage, no URL param.

### Claude's Discretion
- Exact button styling, icon choice, and spacing for the new filter inputs and Add task / Add new contractor buttons (follow existing Tailwind + shadcn-style patterns in `src/components/admin/ui/`).
- Whether to extract a reusable `<CardFilterInput>` component or inline the filter in each card (pick whichever yields cleaner diffs).
- Whether `formatTrade` lives in `src/lib/formatters.ts`, `src/lib/trades.ts`, or alongside the trade constants.
- Absolute-date format when replacing relative-time badges (likely `MMM d` via existing date-fns usage; fall back to `MMM d, yyyy` if ambiguity arises).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase baseline
- `.planning/phases/30-dashboard-and-task-management/30-CONTEXT.md` — Dashboard Phase 30 baseline; layout and data-fetching choices this phase builds on.
- `.planning/phases/31-client-contractor-and-portfolio-management/31-CONTEXT.md` — Contractor quick-assign + QuickAssignTypeahead baseline (D-13 modifies this flow).
- `.planning/phases/32-procurement-editor/32-CONTEXT.md` — Procurement item schema and delivery status taxonomy (D-05, D-07 reference delivered status).

### Requirements
- `.planning/REQUIREMENTS.md` §DASH-10..22 — Acceptance criteria for every decision above.
- `.planning/ROADMAP.md` Phase 35 — Goal + success criteria (6 outcomes).

### Code entry points
- `src/pages/admin/dashboard.astro` — Dashboard page; renders Projects, Deliveries, Tasks cards.
- `src/components/admin/DashboardTasksCard.tsx` — Tasks card (D-16, D-17).
- `src/components/admin/QuickAssignTypeahead.tsx` — Contractor quick-assign (D-13).
- `src/components/admin/ContactCardWrapper.tsx` / `ContactCardPopover.tsx` — Contractor card on dashboard (D-12).
- `src/lib/dashboardUtils.ts` — Date/overdue helpers; absolute-date replacements land here (D-08).
- `src/lib/portalStages.ts` — Stage metadata (Projects filter stage-label match, D-03).

No external ADRs — requirements are fully captured in decisions above.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/admin/ui/` — existing admin primitives (AdminToast, AdminModal) — filter input styling should follow these.
- `src/lib/dashboardUtils.ts` — `getDaysInStage`, `isMilestoneOverdue`, `getOverdueBannerData` — already computes overdue state; absolute-date replacements slot in here.
- `date-fns` already imported across dashboard code (`format`, `parseISO`, `differenceInDays`) — no new deps for D-08.

### Established Patterns
- Dashboard is Astro SSR + React island components (`client:load`) — filter state must live in React components, not Astro frontmatter.
- Tailwind CSS + per-stage color palette in `dashboard.astro` (STAGE_COLORS, DELIVERY_STATUS). Keep consistent.
- Contractor CRUD routes live under `/admin/contractors/[...]` — create page exists; D-12 reuses it.
- Trade slugs are currently rendered with ad-hoc `.replace()` / `toLowerCase()` in multiple components — centralizing via `formatTrade` (D-14) will remove duplication.

### Integration Points
- Dashboard data loader: `getAdminDashboardData(client)` in `src/sanity/queries.ts`. No schema changes needed — filters are client-side, delivered items already available via existing query (or add a `delivered: true` variant if current query filters them out — check during planning).
- Ship24 carrier detection: existing tracking integration returns a `carrier` field; D-07 renders ETA only when that field is one of `fedex | ups | usps`.
</code_context>

<specifics>
## Specific Ideas

- Live-filter feel should match the snappy typeahead in `QuickAssignTypeahead` — no spinner, no debounce lag.
- Absolute dates read like "Apr 22" (short month + day) — matches the existing `formatMilestoneDate` helper in `dashboard.astro`.
- "Show delivered (N)" link styled like a muted secondary action, centered at the card bottom — not a button.
- Hide-completed reveal text should follow the same pattern: "Show completed (N)" inline link, gray-500, underline on hover.
</specifics>

<deferred>
## Deferred Ideas

- Scheduled/saved filters on Deliveries or Projects — out of scope for v5.1.
- Global search across clients/projects/contractors from the dashboard — separate initiative; not in phase requirements.
- Trade data migration to stored sentence-case values — explicitly rejected in favor of display-only formatting (D-14). Revisit only if a future phase needs it.
- Exposing delivered-history as its own page (/admin/deliveries) — not needed for v5.1; inline disclosure covers it.
- URL-param filter state for linkable filtered views — not needed for Liz's solo-user workflow.

### Reviewed Todos (not folded)
No pending todos matched Phase 35 scope at capture time.
</deferred>

---

*Phase: 35-dashboard-polish-global-ux-cleanup*
*Context gathered: 2026-04-14*

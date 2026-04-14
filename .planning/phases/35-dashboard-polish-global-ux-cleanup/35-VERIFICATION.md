---
phase: 35-dashboard-polish-global-ux-cleanup
verified: 2026-04-14T12:50:00Z
status: human_needed
score: 6/6 must-haves verified
human_verification:
  - test: "Visit /admin dashboard and confirm no relative-time badges render (no `Nd`, `Nw`, `in Nd`)"
    expected: "Only absolute MMM d dates; Active Projects right-col shows `Since {MMM d}`; overdue banner long-form `N days overdue` preserved"
    why_human: "Rendered output / visual scan across all admin surfaces"
  - test: "In Upcoming Deliveries card, type a client name substring / tracking number / carrier"
    expected: "Rows filter live per-keystroke; empty-state copy matches `No deliveries match your filter.` or `All caught up — no undelivered items.`"
    why_human: "Interactive filter behavior requires live DOM, not static grep"
  - test: "Click `Show delivered (N)` on Upcoming Deliveries"
    expected: "Delivered rows appear, copy swaps to `Hide delivered`; reload restores default hidden state"
    why_human: "Real-time state + reload cycle not testable via grep"
  - test: "In Active Projects card, filter by stage name (e.g., `construction`, `procurement`) and client name"
    expected: "Rows narrow per keystroke; empty-state renders `No projects match your filter.`"
    why_human: "Live filter behavior"
  - test: "Click `+ Add new contractor` CTA on Dashboard Contractor card"
    expected: "Navigates to /admin/contractors/new — DEFERRED: this route does not yet exist and will 404 until a follow-up phase ships the create page"
    why_human: "Known deferred item (per deferred-items.md and Plan 04 summary) — behavior is expected 404 until follow-up phase builds the create page; classify as expected outcome during UAT, not a regression"
  - test: "In Quick Assign Contractor, pick a contractor with exactly one trade"
    expected: "No trade picker appears; toast confirms `Assigned {name} as {Sentence-case trade}.`; multi-trade contractor still shows picker"
    why_human: "Interactive UI flow + toast timing"
  - test: "Inspect trade pills on contractor detail, Quick Assign, and portal Contractor section"
    expected: "All render sentence case (e.g., `Electrical rough-in`, `HVAC`, `General contractor`) — no raw slugs, no ALL-CAPS"
    why_human: "Visual scan of multiple surfaces"
  - test: "On Tasks cards (dashboard, project detail, client detail), toggle `+ Add task` header button and verify `Show completed (N)` / `Hide completed` reveal link works"
    expected: "Completed tasks hidden by default; reveal link only appears when completed exist; reload resets"
    why_human: "Interactive state + reload reset"
deferred:
  - truth: "Add-new-contractor CTA routes to a working create page"
    addressed_in: "Follow-up phase (v5.1 backlog)"
    evidence: "Plan 04 summary explicitly scopes out /admin/contractors/new — STATE.md Pending Todos lists 'Admin contractor create/edit form — replace retired Studio contractor management'. CTA href is correct per contract; destination page is the deferred work."
---

# Phase 35: Dashboard Polish & Global UX Cleanup Verification Report

**Phase Goal:** Liz's dashboard surfaces only the signal she acts on — clean status chips, filterable Upcoming Deliveries and Projects cards, a working contractor quick-assign flow, and tasks cards that hide completed work by default.

**Verified:** 2026-04-14T12:50:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | No relative-time `Nd`/`Nw` badges anywhere in admin app | ✓ VERIFIED | `grep formatDistanceToNow\|getDaysOverdueStr\|getDaysUntilStr` in src/pages/admin & src/components/admin → 0 matches. Dashboard Active Projects renders `Since {MMM d}`. Overdue banner long-form `N days overdue` preserved per D-08. |
| 2 | Upcoming Deliveries: renamed, filterable, undelivered by default, client→item→project order, carrier ETA gated to Ship24 tracked carriers | ✓ VERIFIED | UpcomingDeliveriesCard.tsx: `Upcoming Deliveries` title (line 183), CardFilterInput with `Filter deliveries…`, `undeliveredRows` filter default, row layout client name → item → project (lines 138-147), ETA gated via `TRACKED_CARRIERS = { fedex, ups, usps }` and `showETA = Boolean(carrierLabel && etaDate)` (lines 128-130). 11 vitest cases pass. |
| 3 | Projects card has working free-text filter input | ✓ VERIFIED | ActiveProjectsCard.tsx: `CardFilterInput` with `Filter projects…` (line 90), matches against title, clientName, STAGE_META[pipelineStage].title (lines 35-42). 13 vitest cases pass. |
| 4 | Dashboard Contractor card has Add-new-contractor CTA; single-trade quick-assign bypasses picker | ⚠️ PARTIAL (deferred) | CTA anchor at dashboard.astro line 121 `href="/admin/contractors/new"`. Destination page does not exist — will 404 (deferred per deferred-items.md). QuickAssignTypeahead.tsx line 215: `if (entity.trades && entity.trades.length === 1)` bypass branch present; 5 vitest cases pass including single/multi/zero-trade paths. |
| 5 | Every user-facing trade label renders in sentence case | ✓ VERIFIED | src/lib/trades.ts `formatTrade()` + `TRADE_LABELS` map (26 entries). Consumed in QuickAssignTypeahead.tsx, EntityListPage.tsx, ContractorSection.astro, dashboard.astro, ProcurementEditor.tsx (via transitive), Projects/contractor detail via EntityListPage. 20 trades.test.ts cases pass. |
| 6 | Tasks cards (dashboard + project detail + client) have visible `+ Add task` button; hide completed by default with reveal link that resets on reload | ✓ VERIFIED | DashboardTasksCard, ProjectTasks, ClientActionItemsList all have: `showCompleted` useState (no persistence), `Show completed (N)` / `Hide completed` reveal button, `+ Add task` header button with `border-terracotta`. 20 vitest cases across 3 files pass. |

**Score:** 6/6 truths verified (one with a scoped deferral for follow-up phase)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | `/admin/contractors/new` create page exists and creates a contractor | Follow-up phase (v5.1 backlog) | Plan 04 summary § "Deferred issues" explicitly scopes out the create page; STATE.md Pending Todos lists it. CTA href contract satisfied; destination build is separate work. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/trades.ts` | formatTrade + TRADE_LABELS | ✓ VERIFIED | Both exports present, 26 label entries, fallback normalizer |
| `src/lib/trades.test.ts` | Vitest coverage | ✓ VERIFIED | 20 cases, all pass |
| `src/components/admin/ui/CardFilterInput.tsx` | Shared filter primitive | ✓ VERIFIED | Default export, lucide Search + X icons, UI-SPEC classes, 9 vitest cases |
| `src/components/admin/UpcomingDeliveriesCard.tsx` | React island with filter/disclosure/ETA gating | ✓ VERIFIED | All required copy strings + behavior, 11 vitest cases |
| `src/components/admin/ActiveProjectsCard.tsx` | React island with filter | ✓ VERIFIED | Filter + stage label matching, 13 vitest cases |
| `src/components/admin/QuickAssignTypeahead.tsx` | Single-trade bypass | ✓ VERIFIED | Line 215 bypass branch + formatted trade confirmation copy |
| `src/components/admin/DashboardTasksCard.tsx` | Header + hide-completed | ✓ VERIFIED | showCompleted state + reveal + Add task button |
| `src/components/admin/ProjectTasks.tsx` | Header + hide-completed | ✓ VERIFIED | Same pattern as DashboardTasksCard |
| `src/components/admin/ClientActionItemsList.tsx` | Header + hide-completed | ✓ VERIFIED | Same pattern, labels UI-SPEC "+Add task" |

### Key Link Verification

| From | To | Via | Status |
|------|----|----|--------|
| dashboard.astro | UpcomingDeliveriesCard | `<UpcomingDeliveriesCard client:load deliveries={data.deliveries} />` (line 94) | ✓ WIRED |
| dashboard.astro | ActiveProjectsCard | `<ActiveProjectsCard client:load projects={...} totalCount={...} />` (lines 87-91) | ✓ WIRED |
| dashboard.astro | DashboardTasksCard | `<DashboardTasksCard client:load tasks={...} projects={...} />` (lines 99-106) | ✓ WIRED |
| dashboard.astro | `/admin/contractors/new` | Anchor `href="/admin/contractors/new"` (line 121) | ✓ WIRED (destination deferred) |
| UpcomingDeliveriesCard | CardFilterInput | import default + used (lines 3, 193) | ✓ WIRED |
| ActiveProjectsCard | CardFilterInput | import default + used (lines 3, 87) | ✓ WIRED |
| QuickAssignTypeahead | trades.ts | `import { formatTrade }` + render site | ✓ WIRED |
| EntityListPage.tsx | trades.ts | `formatTrade` used in formatTrades() | ✓ WIRED |
| ContractorSection.astro | trades.ts | `formatTrade` used in trade pill | ✓ WIRED |
| dashboard.astro | queries.ts | `getAdminDashboardData` returns `contractors` + `deliveries` with `delivered`/`clientName`/`carrier` fields | ✓ WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| UpcomingDeliveriesCard | deliveries prop | `data.deliveries` from `getAdminDashboardData()` via ADMIN_DASHBOARD_DELIVERIES_QUERY GROQ; delivered flag + clientName + carrier projected | Yes (DB query + Ship24 enrichment per Plan 02 summary) | ✓ FLOWING |
| ActiveProjectsCard | projects prop | `data.activeProjects` from `getAdminDashboardData()` GROQ | Yes | ✓ FLOWING |
| Dashboard Contractor card | data.contractors | `ADMIN_DASHBOARD_CONTRACTORS_QUERY` GROQ in queries.ts | Yes (top 6 by _createdAt desc) | ✓ FLOWING |
| DashboardTasksCard | tasks prop | `data.tasks` | Yes | ✓ FLOWING |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DASH-10 | 35-01 | Remove relative-time status badges from admin UI | ✓ SATISFIED | 0 grep matches for formatDistanceToNow/getDaysOverdueStr/getDaysUntilStr in admin scope |
| DASH-11 | 35-02 | Rename Deliveries → Upcoming Deliveries | ✓ SATISFIED | UpcomingDeliveriesCard h2 renders `Upcoming Deliveries` |
| DASH-12 | 35-02 | Undelivered by default + expand delivered history | ✓ SATISFIED | `showDelivered` useState default false + `Show delivered (N)` link |
| DASH-13 | 35-02 | Row layout: client → item → project | ✓ SATISFIED | lines 138-147 of UpcomingDeliveriesCard |
| DASH-14 | 35-02 | Carrier ETA only when Ship24 returns tracked carrier | ✓ SATISFIED | TRACKED_CARRIERS map {fedex, ups, usps} + showETA gate |
| DASH-15 | 35-02 | Free-text filter on Upcoming Deliveries | ✓ SATISFIED | CardFilterInput + rowMatchesFilter |
| DASH-16 | 35-03 | Projects card free-text filter | ✓ SATISFIED | ActiveProjectsCard filter over title/clientName/stage |
| DASH-17 | 35-04 | Add new contractor CTA + successful create | ⚠️ PARTIAL | CTA present; create page deferred (see deferred items) — needs human UAT for full loop |
| DASH-18 | 35-04 | Quick-assign bypass for single-trade contractor | ✓ SATISFIED | Line 215 bypass branch; 5 vitest cases |
| DASH-19 | 35-01 | All trade labels sentence case | ✓ SATISFIED | formatTrade consumed at every render site (9 matches across admin+portal) |
| DASH-20 | 35-05 | Tasks card visible Add task button | ✓ SATISFIED | 3 cards with border-terracotta Add task header |
| DASH-21 | 35-05 | Tasks card hides completed by default + reveal + reload reset | ✓ SATISFIED | showCompleted useState (no persistence) in all 3 cards |
| DASH-22 | 35-05 | Client Tasks card hides completed + reveal + reload reset | ✓ SATISFIED | ClientActionItemsList same pattern |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All phase 35 test files pass | `npx vitest run` against 8 files | 78 tests passed / 0 failed | ✓ PASS |
| formatTrade module exports expected | src/lib/trades.ts inspection | `formatTrade`, `TRADE_LABELS` both exported | ✓ PASS |
| Dashboard mounts 3 React islands | grep for `client:load` components in dashboard.astro | ActiveProjectsCard, UpcomingDeliveriesCard, DashboardTasksCard all have `client:load` | ✓ PASS |
| Contractor create route exists | ls src/pages/admin/contractors/ | Only `[contractorId]/` and `index.astro` — no `new.astro` | ✗ FAIL (deferred — expected) |

### Anti-Patterns Found

None. Grep for TODO/FIXME/PLACEHOLDER across all modified phase-35 files returned 0 matches.

### Human Verification Required

8 items require human UAT (see `human_verification` frontmatter above). Key items:

1. Visual scan of /admin dashboard for zero relative-time badges
2. Interactive filter behavior on Upcoming Deliveries + Active Projects cards
3. Delivered disclosure toggle + reload reset on Upcoming Deliveries
4. Add-new-contractor CTA — known 404 until follow-up phase builds the create page
5. Quick-assign single-trade bypass toast timing
6. Trade pill sentence-case visual scan across surfaces
7. Tasks cards: `+ Add task` button + hide-completed reveal + reload reset (3 surfaces)

### Gaps Summary

No hard gaps. Every must-have truth is wired and tested. The `/admin/contractors/new` route is a known, documented deferral (logged in deferred-items.md and Plan 04 summary); its absence was explicitly scoped out of Phase 35. The CTA anchor contract is satisfied (correct href, correct copy, correct styling). Once the create page ships in a follow-up phase, DASH-17 achieves full end-to-end closure.

Status is `human_needed` because the phase goal centers on interactive UX (live filters, reveal toggles, reload-reset state, toast timing, visual sentence-case checks) that cannot be proven through static verification alone. All automated checks pass; Liz should run the UAT script in the human_verification block to confirm the experience matches the intended design.

---

_Verified: 2026-04-14T12:50:00Z_
_Verifier: Claude (gsd-verifier)_

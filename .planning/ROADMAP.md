# Roadmap: La Sprezzatura

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-03-15)
- ✅ **v2.0 Client Portal Foundation** - Phases 5-6 (completed 2026-04-03)
- ✅ **v2.5 Contractor & Commercial Workflows** - Phases 7-8 (completed 2026-04-03)
- 📋 **v3.0 AI Rendering & Go-Live** - Phases 9-12 (Phase 12 deferred)
- ✅ **v3.1 Rendering Tool Polish** - Phases 13-14 (completed 2026-04-03)
- 🚫 **v4.0 Project Schedule** - Phase 15 complete; Phases 16-17 **superseded by v5.2 Schedule Rebuild**
- ✅ **v5.0 Admin Platform Completion** - Phases 29-34 (shipped 2026-04-12)
- 🚧 **v5.1 Admin UX Polish & Workflow Additions** - Phases 35-41 (in progress)
- 📋 **v5.2 Schedule Rebuild** - TBD (needs brainstorming)
- 📋 **v6.0 Linha Platform** - TBD (planned)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) — SHIPPED 2026-03-15</summary>

- [x] Phase 1: Project Scaffold and Staging Deploy (1/1 plans)
- [x] Phase 2: Public Portfolio Site (4/4 plans)
- [x] Phase 3: Client Operations Portal (2/2 plans)

See: `.planning/milestones/` (if archived) or git history for full details.

</details>

<details>
<summary>✅ v2.0 Client Portal Foundation (Phases 5-6) — completed 2026-04-03</summary>

- [x] Phase 5: Data Foundation, Auth, and Infrastructure (4/4 plans)
- [x] Phase 6: Portal Features (5/5 plans)

</details>

<details>
<summary>✅ v2.5 Contractor & Commercial Workflows (Phases 7-8) — completed 2026-04-03</summary>

- [x] Phase 7: Schema Extensions, Multi-Role Auth, and Document Storage (3/3 plans)
- [x] Phase 8: Contractor Portal, Building Manager Portal, and Client Contractor Visibility (3/3 plans)

</details>

<details>
<summary>✅ v3.1 Rendering Tool Polish (Phases 13-14) — completed 2026-04-03</summary>

- [x] Phase 13: Wizard Infrastructure and Layout Fixes (2/2 plans)
- [x] Phase 14: Image Experience and Field Clarity (2/2 plans)

</details>

<details>
<summary>✅ v5.0 Admin Platform Completion (Phases 29-34) — SHIPPED 2026-04-12</summary>

**Delivered:** Custom `/admin/*` app (Linha) with tenant-aware architecture, all management features, and Sanity Studio retired.

- [x] Phase 29: Tenant-Aware Platform Foundation (3/3 plans) — completed 2026-04-08
- [x] Phase 30: Dashboard and Task Management (4/4 plans) — completed 2026-04-08
- [x] Phase 31: Client, Contractor, and Portfolio Management (4/4 plans) — completed 2026-04-09
- [x] Phase 32: Procurement Editor (3/3 plans) — completed 2026-04-10
- [x] Phase 33: Rendering Tool Relocation (7/7 plans) — completed 2026-04-11
- [x] Phase 34: Settings and Studio Retirement (7/7 plans) — completed 2026-04-12

Full details: `.planning/milestones/v5.0-ROADMAP.md`

</details>

### v3.0 AI Rendering & Go-Live (Phase 12 Deferred)

**Milestone Goal:** Equip Liz with an AI rendering tool for photorealistic room visualizations, complete business operations, polish the public site, and consolidate DNS.

- [x] **Phase 9: Send Update, Investment Proposals, and Public Site Polish** (completed 2026-04-03)
- [x] **Phase 10: AI Rendering Engine** (completed 2026-03-17)
- [x] **Phase 11: Rendering Studio Tool and Design Options Gallery** (completed 2026-03-18)
- [ ] **Phase 12: DNS Cutover and Go-Live** — DNS consolidation to Cloudflare, email to lasprezz.com, domain redirects, and Wix replacement

### Phase 12: DNS Cutover and Go-Live
**Goal**: All 4 domains consolidated on Cloudflare with working Microsoft 365 email at lasprezz.com, domain redirects active, and lasprezz.com serving the new site from Vercel
**Depends on**: Phase 11
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-06
**Plans**: 3 plans

Plans:
- [ ] 12-01-PLAN.md -- Pre-cutover DNS audit and M365 email migration
- [ ] 12-02-PLAN.md -- Domain transfers to Cloudflare, DNS configuration for Vercel + email
- [ ] 12-03-PLAN.md -- Secondary domain redirects, email aliases, go-live verification

### v4.0 Project Schedule (Gantt Chart) — Phases 16-17 Superseded

**Milestone Goal (original):** Visual, interactive project timeline in the admin app for sequencing contractors, procurement, milestones, and custom events.

- [x] **Phase 15: Schema and Read-Only Timeline** (3/3 plans, completed)
- 🚫 **Phase 16: Drag-and-Drop, Write-back, Undo, and Tooltips** — **Superseded by v5.2 Schedule Rebuild**
- 🚫 **Phase 17: Appointment Sub-markers, Overlap Highlighting, and Procurement Lifecycle Bars** — **Superseded by v5.2 Schedule Rebuild**

v5.2 replaces Frappe Gantt with a configurable designer workflow template. Phase 16-17 scope (drag-and-drop write-back, lifecycle bars, overlap highlighting) will be re-evaluated during v5.2 brainstorming and reincorporated only if still relevant to the new template approach.

### v5.1 Admin UX Polish & Workflow Additions (Phases 35-41) — In Progress

**Milestone Goal:** Refine the v5.0 admin app based on Liz's hands-on feedback, add Work Order and Documents panels to project detail, remove pricing exposure from procurement, and tighten vendor/client data models.

**Note on ordering:** Phase 38 (Send Update Sender Config) precedes Phase 39 (Work Order & Documents) so that WORK-05's email-send implementation can consume Settings-driven sender values without a retrofit.

- [x] **Phase 35: Dashboard Polish & Global UX Cleanup** — 13 reqs (DASH-10..22) (completed 2026-04-14)
- [x] **Phase 36: Projects List & Archive Lifecycle** — 5 reqs (PROJ-01..05) (completed 2026-04-14)
- [x] **Phase 37: Procurement Privacy & Modal Editor** — 5 reqs (PROC-10..14) (completed 2026-04-15)
- [ ] **Phase 38: Send Update Sender Config** — 3 reqs (SETT-10..12)
- [ ] **Phase 39: Work Order & Documents Panels** — 8 reqs (WORK-01..05, DOCS-01..03)
- [ ] **Phase 40: Contractor/Vendor Rename, Trades CRUD & 1099 Support** — 5 reqs (VEND-01..05)
- [ ] **Phase 41: Client Data Model Refinements** — 4 reqs (CLNT-10..13)

### Phase 35: Dashboard Polish & Global UX Cleanup
**Goal**: Liz's dashboard surfaces only the signal she acts on: clean status chips, filterable Upcoming Deliveries and Projects cards, a working contractor quick-assign flow, and tasks cards that hide completed work by default
**Depends on**: v5.0 (Phase 30 Dashboard baseline)
**Requirements**: DASH-10, DASH-11, DASH-12, DASH-13, DASH-14, DASH-15, DASH-16, DASH-17, DASH-18, DASH-19, DASH-20, DASH-21, DASH-22
**Success Criteria** (what must be TRUE):
  1. Liz sees no relative-time "8d / 1w" badges anywhere in the admin app
  2. The Upcoming Deliveries card is renamed, filterable by free text, shows only undelivered items by default, and renders client → item → project in that visual order with carrier ETA only when Ship24 provides one
  3. The Projects card has a working free-text filter input that narrows the visible list
  4. Liz can add a new contractor directly from the Dashboard Contractor card and the quick-assign flow skips the trade prompt when a contractor has a single trade
  5. Every user-facing trade label renders in sentence case (no slugs, no all-caps)
  6. Tasks cards (dashboard + project detail + client) have a visible "Add task" button and hide completed tasks by default with a reveal link that resets on reload
**Plans**: 5 plans
**UI hint**: yes

Plans:
- [x] 35-01-PLAN.md — Wave 1: formatTrade utility + admin relative-time purge (DASH-10, DASH-19)
- [x] 35-02-PLAN.md — Wave 2: Upcoming Deliveries card (rename + filter + delivered disclosure + carrier ETA gating) (DASH-11..15)
- [x] 35-03-PLAN.md — Wave 3: Active Projects card free-text filter (DASH-16)
- [x] 35-04-PLAN.md — Wave 4: Dashboard Contractor card + single-trade quick-assign bypass (DASH-17, DASH-18)
- [x] 35-05-PLAN.md — Wave 2: Tasks cards header Add-task + hide-completed toggle (dashboard + project + client) (DASH-20, DASH-21, DASH-22)

### Phase 36: Projects List & Archive Lifecycle
**Goal**: Completed projects are visually distinct, can be archived manually or automatically after 90 days, and archived projects live in a read-only view that doesn't clutter the active list
**Depends on**: Phase 35
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05
**Success Criteria** (what must be TRUE):
  1. The projects list visually separates active from completed projects with a horizontal divider and muted styling on the completed group
  2. Liz can manually archive a completed project from its detail page
  3. Completed projects auto-archive 90 days after their completion date
  4. A "View archived projects" link opens a read-only archived view
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [x] 36-01-PLAN.md — Schema, query projection, and archive/unarchive Astro actions (PROJ-03)
- [x] 36-02-PLAN.md — Three-tier ProjectsGrid + ProjectArchiveMenu detail-header island (PROJ-01, PROJ-02, PROJ-03, PROJ-05)
- [x] 36-03-PLAN.md — Vercel Cron auto-archive endpoint + vercel.ts migration (PROJ-04)

### Phase 37: Procurement Privacy & Modal Editor
**Goal**: Procurement hides all pricing information from the admin UI, and item editing moves from inline-row editing to a view-then-edit modal that shows every field with support for multiple images
**Depends on**: v5.0 (Phase 32 Procurement Editor baseline)
**Requirements**: PROC-10, PROC-11, PROC-12, PROC-13, PROC-14
**Success Criteria** (what must be TRUE):
  1. Clicking any procurement row opens a modal showing every field of the item in read mode
  2. The modal has an explicit Edit action that switches it into editable mode
  3. No price, cost, retail, net, profit, or markup field is visible anywhere in the procurement UI
  4. The "Delivery" column and field label read "Expected install date" throughout the procurement editor
  5. A procurement item can have multiple images uploaded to it
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [x] 37-01-PLAN.md — Wave 0 test harness (schema + queries + modal + portal + closeout + migration tests) (PROC-10..14)
- [x] 37-02-PLAN.md — Schema + reader strip + portal rework + closeout copy + migration run (PROC-12, PROC-13, PROC-14)
- [x] 37-03-PLAN.md — AdminModal size=lg + ProcurementItemModal + ProcurementImageGallery + ProcurementEditor refactor (PROC-10, PROC-11, PROC-13, PROC-14)

### Phase 38: Send Update Sender Config
**Goal**: Settings stores the default from/cc addresses used by Send Update (and the upcoming Work Order email in Phase 39), replacing any hardcoded office@/liz@ references
**Depends on**: v5.0 (Phase 34 Send Update baseline)
**Requirements**: SETT-10, SETT-11, SETT-12
**Success Criteria** (what must be TRUE):
  1. Settings exposes a default "from" address for Send Update that defaults to office@lasprezz.com
  2. Settings exposes a default "cc" address for Send Update that defaults to liz@lasprezz.com
  3. Send Update emails are sent using the from/cc values read from Settings at send time
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 38-01-PLAN.md — Settings schema + UI + API passthrough for defaultFromEmail / defaultCcEmail (SETT-10, SETT-11)
- [ ] 38-02-PLAN.md — Send pipeline wiring + SendUpdateModal dynamic label (SETT-12)

### Phase 39: Work Order & Documents Panels
**Goal**: Project detail gains two new panels — Work Order (compose + email a work order from selected procurement items, custom fields, and special instructions) and Documents (upload, list, preview, and delete project documents)
**Depends on**: Phase 38 (Work Order email send consumes Settings-driven sender config from SETT-10/11); Phase 37 (procurement modal baseline for item selection)
**Requirements**: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, DOCS-01, DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):
  1. Project detail page shows a Work Order panel alongside existing panels
  2. Liz can create a work order by selecting N procurement items from the project, adding custom fields, and writing free-text special instructions
  3. A work order can be sent as email from the Settings-configured from address with the Settings-configured cc address (default office@lasprezz.com / liz@lasprezz.com)
  4. Project detail page shows a Documents panel alongside existing panels
  5. Liz can upload PDF and image documents to a project and then list, preview, and delete them
**Plans**: TBD (estimated 4)
**UI hint**: yes

### Phase 40: Contractor/Vendor Rename, Trades CRUD & 1099 Support
**Goal**: "Contractor" becomes "Contractor / Vendor" across the admin UI; trades are first-class records Liz can manage (create/rename/delete); contractor records gain physical address fields and a 1099 document slot with a visible badge
**Depends on**: v5.0 (Phase 31 Contractor CRUD baseline)
**Requirements**: VEND-01, VEND-02, VEND-03, VEND-04, VEND-05
**Success Criteria** (what must be TRUE):
  1. Every "Contractor" label, header, and nav entry in the admin UI reads "Contractor / Vendor"
  2. The contractor list renders trades as distinct pills in sentence case
  3. Liz can create, rename, and delete trade names from a trades manager UI
  4. Contractor / Vendor records capture physical address fields (street, city, state, zip)
  5. Liz can upload a 1099 document to a contractor record and the record shows a clearly-designated 1099 badge
**Plans**: TBD (estimated 3)
**UI hint**: yes

### Phase 41: Client Data Model Refinements
**Goal**: Client schema is tightened — phone numbers render consistently everywhere (clients, contractors, popovers), physical address fields are captured, the list columns reflect the new shape, and the unused preferred-contact field is removed
**Depends on**: v5.0 (Phase 31 Client CRUD baseline)
**Requirements**: CLNT-10, CLNT-11, CLNT-12, CLNT-13
**Success Criteria** (what must be TRUE):
  1. Phone numbers render in a single consistent format across the client list, contractor list, popovers, and detail views
  2. Client records capture physical address fields (street, city, state, zip)
  3. The Clients list columns are name, address, email, phone (no other columns)
  4. The "Preferred contact" field is absent from both the client schema and the UI
**Plans**: TBD (estimated 2-3)
**UI hint**: yes

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-3 | v1.0 | 7/7 | Shipped | 2026-03-15 |
| 5-6 | v2.0 | 9/9 | Complete | 2026-04-03 |
| 7-8 | v2.5 | 6/6 | Complete | 2026-04-03 |
| 9-11 | v3.0 | 12/12 | Complete (Phase 12 deferred) | 2026-04-03 |
| 12 | v3.0 | 0/3 | Not started | - |
| 13-14 | v3.1 | 4/4 | Complete | 2026-04-03 |
| 15 | v4.0 | 3/3 | Complete | 2026-04-04 |
| 16-17 | v4.0 | — | Superseded by v5.2 | - |
| 29-34 | v5.0 | 28/28 | Shipped | 2026-04-12 |
| 35 | v5.1 | 5/5 | Complete    | 2026-04-14 |
| 36 | v5.1 | 4/4 | Complete   | 2026-04-14 |
| 37 | v5.1 | 3/3 | Complete   | 2026-04-15 |
| 38 | v5.1 | 1/2 | In Progress|  |
| 39 | v5.1 | 0/4 | Not started | - |
| 40 | v5.1 | 0/3 | Not started | - |
| 41 | v5.1 | 0/3 | Not started | - |

---
*Roadmap created: 2026-03-14*
*v1.0 shipped: 2026-03-15*
*v5.0 shipped: 2026-04-12 — archived to milestones/v5.0-ROADMAP.md*
*v5.1 planned: 2026-04-14 — 7 phases, 43 requirements, 22 plans estimated*

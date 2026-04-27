# Roadmap: La Sprezzatura

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-03-15)
- ✅ **v2.0 Client Portal Foundation** - Phases 5-6 (completed 2026-04-03)
- ✅ **v2.5 Contractor & Commercial Workflows** - Phases 7-8 (completed 2026-04-03)
- 📋 **v3.0 AI Rendering & Go-Live** - Phases 9-12 (Phase 12 deferred)
- ✅ **v3.1 Rendering Tool Polish** - Phases 13-14 (completed 2026-04-03)
- 🚫 **v4.0 Project Schedule** - Phase 15 complete; Phases 16-17 **superseded (Schedule Rebuild displaced to a future milestone)**
- ✅ **v5.0 Admin Platform Completion** - Phases 29-34 (shipped 2026-04-12)
- ✅ **v5.1 Admin UX Polish & Workflow Additions** - Phases 35-41 (completed 2026-04-22, Phase 41 carried to v5.2)
- ✅ **v5.2 Trades Directory** - Phases 41-43 (completed 2026-04-23)
- 🚧 **Workflow Engine (Phase 44)** - interim phase between v5.2 and v5.3 (in progress)
- 🚧 **v5.3 Third-Party Views & Outbound Email Polish** - Phases 45-52 (in progress)
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
- 🚫 **Phase 16: Drag-and-Drop, Write-back, Undo, and Tooltips** — **Superseded (Schedule Rebuild deferred to a future milestone)**
- 🚫 **Phase 17: Appointment Sub-markers, Overlap Highlighting, and Procurement Lifecycle Bars** — **Superseded (Schedule Rebuild deferred to a future milestone)**

A future Schedule Rebuild milestone will replace Frappe Gantt with a configurable designer workflow template. Phase 16-17 scope (drag-and-drop write-back, lifecycle bars, overlap highlighting) will be re-evaluated during that milestone's brainstorming and reincorporated only if still relevant.

### v5.1 Admin UX Polish & Workflow Additions (Phases 35-40) — Complete

**Milestone Goal:** Refine the v5.0 admin app based on Liz's hands-on feedback, add Work Order and Documents panels to project detail, remove pricing exposure from procurement, and tighten vendor/client data models.

**Note on ordering:** Phase 38 (Send Update Sender Config) precedes Phase 39 (Work Order & Documents) so that WORK-05's email-send implementation can consume Settings-driven sender values without a retrofit.

- [x] **Phase 35: Dashboard Polish & Global UX Cleanup** — 13 reqs (DASH-10..22) (completed 2026-04-14)
- [x] **Phase 36: Projects List & Archive Lifecycle** — 5 reqs (PROJ-01..05) (completed 2026-04-14)
- [x] **Phase 37: Procurement Privacy & Modal Editor** — 5 reqs (PROC-10..14) (completed 2026-04-15)
- [x] **Phase 38: Send Update Sender Config** — 3 reqs (SETT-10..12) (completed 2026-04-15)
- [x] **Phase 39: Work Order & Documents Panels** — 8 reqs (WORK-01..05, DOCS-01..03) (completed 2026-04-15)
- [x] **Phase 40: Contractor/Vendor Rename, Trades CRUD & 1099 Support** — 5 reqs (VEND-01..05) (completed 2026-04-22)

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
- [x] 38-02-PLAN.md — Send pipeline wiring + SendUpdateModal dynamic label (SETT-12)

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
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 39-01-PLAN.md — Wave 1: workOrder schema + projectDocuments[] + API scaffolding (WORK-02, WORK-03, WORK-04, DOCS-02, DOCS-03)
- [x] 39-02-PLAN.md — Wave 2: DocumentsPanel + UploadDocumentModal + project-detail mount (DOCS-01, DOCS-02, DOCS-03)
- [x] 39-03-PLAN.md — Wave 2: WorkOrderComposeModal + ContractorChipSendAction + chip integration (WORK-01, WORK-02, WORK-03, WORK-04)
- [x] 39-04-PLAN.md — Wave 3: Email template + send endpoint + WorkOrderView + admin+portal pages + dashboard list + chip/modal send wiring (WORK-01, WORK-05)

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
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [x] 40-01-PLAN.md — Wave 1: Schema fields + GROQ queries + API handlers (VEND-03, VEND-04, VEND-05)
- [x] 40-02-PLAN.md — Wave 1: Label rename across admin UI and portal (VEND-01, VEND-02)
- [x] 40-03-PLAN.md — Wave 2: TradesCatalogSection + Settings wiring + EntityDetailForm address/docType/catalog (VEND-03, VEND-04, VEND-05)

### v5.2 Trades Directory (Phases 41-43)

**Milestone Goal:** Elevate the Contractor/Vendor concept into a first-class "Trades" entity with its own `/admin/trades` routes, a relationship field (contractor|vendor) that drives document checklists, display name logic, a completeness indicator in list view, and a polished detail page with a meta line. Phase 41 (client data model refinements) carries forward from v5.1.

- [x] **Phase 41: Client Data Model Refinements** — 4 reqs (CLNT-10..13) (completed 2026-04-23)
- [x] **Phase 42: Trades Entity — Routes, Schema, and Display** — 5 reqs (TRAD-01, TRAD-02, TRAD-03, TRAD-05, TRAD-07)
- [x] **Phase 43: Document Checklists, Settings Config, and Completeness** — 3 reqs (TRAD-04, TRAD-06, TRAD-08) (completed 2026-04-23)

## Phase Details

### Phase 41: Client Data Model Refinements
**Goal**: Client schema is tightened — phone numbers render consistently everywhere (clients, contractors, popovers), physical address fields are captured, the list columns reflect the new shape, and the unused preferred-contact field is removed
**Depends on**: v5.0 (Phase 31 Client CRUD baseline)
**Requirements**: CLNT-10, CLNT-11, CLNT-12, CLNT-13
**Success Criteria** (what must be TRUE):
  1. Phone numbers render in a single consistent format across the client list, contractor list, popovers, and detail views
  2. Client records capture physical address fields (street, city, state, zip)
  3. The Clients list columns are name, address, email, phone (no other columns)
  4. The "Preferred contact" field is absent from both the client schema and the UI
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 41-01-PLAN.md — Wave 1: formatPhone utility + colocated tests + client schema/queries/API preferredContact purge (CLNT-10 foundation, CLNT-11 verification, CLNT-13 backend)
- [x] 41-02-PLAN.md — Wave 2: UI sweep across 5 admin components (formatPhone application, list column reshape, address sort/search, preferredContact UI purge) (CLNT-10, CLNT-11, CLNT-12, CLNT-13)

### Phase 42: Trades Entity — Routes, Schema, and Display
**Goal**: The Trades entity has its own `/admin/trades` routes, a `contractor | vendor` relationship field that drives display names and meta line rendering, and the 1099 document slot is unified into the contractor checklist schema rather than living as a standalone badge
**Depends on**: Phase 40 (contractor schema baseline, trades[], address{}, contractorDocuments[])
**Requirements**: TRAD-01, TRAD-02, TRAD-03, TRAD-05, TRAD-07
**Success Criteria** (what must be TRUE):
  1. All `/admin/contractors` URLs, nav links, and breadcrumbs throughout the admin app and portal resolve as `/admin/trades`
  2. Each Trades record has a relationship field with exactly two options: contractor or vendor
  3. The entity label reads "Contractor" or "Vendor" (never "Contractor / Vendor") wherever the record's relationship type is known — list view, detail view, popovers, nav context, and work order panels
  4. Trades detail page shows a compact meta line below the name: primary trade · relationship type · city, state
  5. No standalone 1099 badge or section exists on the detail page; the 1099 slot is part of the contractor document checklist schema
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 42-01-PLAN.md — Wave 1: Schema foundation (relationship field + checklistItems[] + GROQ + API + relationshipLabel helper) (TRAD-02, TRAD-07)
- [x] 42-02-PLAN.md — Wave 2: Route rename + UI sweep + detail meta line (TRAD-01, TRAD-03, TRAD-05)

### Phase 43: Document Checklists, Settings Config, and Completeness
**Goal**: Trades detail page shows a relationship-scoped document checklist; checklist item types are configurable from Settings; and the Trades list view shows an amber completeness indicator on any record missing required fields or documents
**Depends on**: Phase 42 (relationship field, unified document schema); Phase 34 (Settings baseline)
**Requirements**: TRAD-04, TRAD-06, TRAD-08
**Success Criteria** (what must be TRUE):
  1. Trades detail page shows a document checklist scoped to the record's relationship type: contractor checklist includes W-9, certificate of insurance, trade license, and 1099; vendor checklist includes vendor agreement and tax form
  2. Liz can add and rename checklist item types per relationship type from Settings; an item type with any uploaded document cannot be removed
  3. Trades list view shows an amber completeness indicator on any record where required fields or required documents are missing
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 43-01-PLAN.md — Wave 0: GROQ extensions + API action branches + Wave 0 test scaffolding (TRAD-04, TRAD-06, TRAD-08 enablement)
- [x] 43-02-PLAN.md — Wave 1: TradeChecklist component + EntityDetailForm integration + detail page wiring (TRAD-06)
- [x] 43-03-PLAN.md — Wave 1: ChecklistConfigSection + SettingsPage wiring (Contractor/Vendor Checklist sections) (TRAD-08)
- [x] 43-04-PLAN.md — Wave 1: EntityListPage amber completeness dot + Trades list Astro page wiring (TRAD-04)

### Workflow Engine (Phase 44) — interim phase between v5.2 and v5.3

**Goal:** Replace the Frappe Gantt chart with a configurable designer workflow engine. Liz defines reusable workflow templates (phases, milestones, gates, multi-instance contractors) in Settings and instantiates them per project. The engine enforces prerequisite logic, client approval gates, dormancy detection, and payment gates derived from her design services agreement.

- 🚧 **Phase 44: Workflow Engine** — template management, project tracker UI, engine rules, and instantiation flow

### Phase 44: Workflow Engine
**Goal**: Replace the Frappe Gantt with a three-layer workflow system: Templates (designer-defined in Settings), Instances (per-project snapshots), and Engine (prerequisite + gate enforcement). Liz can define workflow types (Full-service residential, Design consultation, Staging), instantiate them per project, and track milestone status with gate indicators, multi-instance contractor sub-rows, and dormancy/approval warnings.
**Depends on**: Phase 34 (Settings baseline); Phase 43 (Trades schema for contractor references)
**Requirements**: WF-01, WF-02, WF-03, WF-04, WF-05, WF-06, WF-07, WF-08
**Canonical refs**: /Users/paulalbert/Downloads/workflow-engine-spec.md, /Users/paulalbert/Downloads/project_tracker_koenig.html
**Plans**: 11 plans
**UI hint**: yes

Plans:
- [ ] 44-01-PLAN.md — Wave 1: Sanity schemas (workflowTemplate + projectWorkflow) + shared type surface (WF-01, WF-03, WF-04)
- [ ] 44-02-PLAN.md — Wave 1: Pure engine module + businessDays + arrayUtils + fixtures (TDD) (WF-04, WF-07)
- [ ] 44-03-PLAN.md — Wave 1: Starter template seed data + Frappe Gantt retirement (16 deletions + 2 npm deps) (WF-03)
- [ ] 44-04-PLAN.md — Wave 2: Workflow template API routes (index/[id]/duplicate/seed) with in-use delete guard + version auto-increment (WF-01, WF-02)
- [ ] 44-05-PLAN.md — Wave 2: Project workflow lifecycle + engine-gated milestone-status + instance endpoints + GROQ queries (WF-03, WF-04, WF-06, WF-07)
- [ ] 44-06-PLAN.md — Wave 2: Tracker primitive components (StatusCircle, StatusPickerPopover, MilestoneRow, PhaseAccordion) (WF-05, WF-06)
- [ ] 44-07-PLAN.md — Wave 3: Tracker shell components (WorkflowTracker, Header, Metrics, Warnings, BlankWorkflowState) with optimistic+rollback (WF-03, WF-05, WF-06, WF-07)
- [ ] 44-08-PLAN.md — Wave 3: WorkflowTemplatesSection + WorkflowTemplateEditor with inline-edit, cycle detection, save/delete/duplicate (WF-01, WF-02)
- [ ] 44-09-PLAN.md — Wave 4: schedule.astro gutted + rebuilt; lazy dormancy; server-side engine precomputation (WF-03, WF-05, WF-06, WF-07)
- [ ] 44-10-PLAN.md — Wave 4: Settings integration + /admin/settings/workflow-templates/[id] editor page (WF-01, WF-02)
- [ ] 44-11-PLAN.md — Wave 4: Dashboard WorkflowStatusCard + SSR stats + end-to-end smoke checkpoint (WF-08)

### v5.3 Third-Party Views & Outbound Email Polish (Phases 45-52)

**Milestone Goal:** Bring everything a non-admin recipient sees (clients, contractors, building managers) into visual + voice consistency with the admin polish work shipped in v5.1/v5.2, and tighten outbound email so messages from the studio render reliably across Outlook desktop, Gmail, and Apple Mail and read as professional and on-brand. Add a designer-impersonation preview so the studio can reliably preview what each recipient sees and audit before sending.

**Track structure (two parallel tracks converging on portal polish + UAT):**

- **Email track** — Phase 45 (Foundations) → Phase 46 (Send Update + Work Order migration) → Phase 48 (Smaller transactional emails)
- **Portal/Impersonation track** — Phase 47 (Portal Layout Hoist) parallel with Email track → Phase 49 (Impersonation Architecture, parallel with Email) → Phase 50 (Impersonation UI, depends on 47 and 49)
- **Convergence** — Phase 51 (Portal Visual + Voice Pass, consumes 47 / 50 / 45) → Phase 52 (Cross-cutting QA / UAT)

**Resolved decisions (do not re-litigate):**

- **D-1**: Adopt `react-email` this milestone (Position B). Future-proof for v6.0 per-tenant theming; Outlook safety via Litmus harness; single shared `brand-tokens.ts` source of truth across portal CSS and email theme.
- **D-2**: Impersonation audit log lives in a dedicated Sanity `impersonationAudit` document type (per-tenant). Keeps audit churn out of `siteSettings`.
- **D-3**: `/workorder/*` and `/building/*` get the impersonation banner only in v5.3 (self-gating component drops into existing page bodies). Full layout migration of those routes deferred to v5.4.

- [x] **Phase 45: Email Foundations** — 4 reqs (EMAIL-08 ✓, EMAIL-09 ✓, EMAIL-10 ✓, EMAIL-11 ✓). 5/5 plans complete 2026-04-26. Asset host live at email-assets.sprezzahub.com (Cloudflare DNS-only / grey cloud, Vercel-backed, cookie-less, year-immutable cache); sender domain lasprezz.com aligned for Resend SES (DKIM + SPF + DMARC all green); merge-gate procedure documented at docs/email-merge-gate.md.
- [ ] **Phase 46: Send Update + Work Order Migration** — 5 reqs (EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-06, EMAIL-07)
- [ ] **Phase 47: Portal Layout Hoist** — 1 req (PORTAL-05)
- [ ] **Phase 48: Smaller Transactional Emails** — 2 reqs (EMAIL-04, EMAIL-05)
- [ ] **Phase 49: Impersonation Architecture** — 6 reqs (IMPER-02, IMPER-03, IMPER-04, IMPER-06, IMPER-07, IMPER-08)
- [ ] **Phase 50: Impersonation UI** — 2 reqs (IMPER-01, IMPER-05)
- [ ] **Phase 51: Portal Visual + Voice Pass** — 6 reqs (PORTAL-01, PORTAL-02, PORTAL-03, PORTAL-06, AUTH-01, AUTH-02)
- [ ] **Phase 52: Cross-Cutting QA / UAT** — 1 req (PORTAL-04)

### Phase 45: Email Foundations
**Goal**: A reusable email rendering foundation is in place — shared brand tokens between portal and email, react-email scaffolding, an Outlook-safe testing harness with golden HTML snapshots of the existing two templates as a regression baseline, a stable cookie-less image asset host, and verified DKIM/SPF/DMARC alignment for the production sender domain — so subsequent template phases can ship visual + voice changes with regressions caught automatically.
**Depends on**: Phase 34 (Settings/Send Update baseline); Phase 39 (Work Order email baseline)
**Requirements**: EMAIL-08, EMAIL-09, EMAIL-10, EMAIL-11
**Success Criteria** (what must be TRUE):
  1. A single `src/lib/brand-tokens.ts` module is consumed by both Tailwind config and the email theme — changing a color in one place updates both portal CSS and email rendering (EMAIL-08)
  2. Golden HTML snapshots exist for `buildSendUpdateEmail` and `buildWorkOrderEmail` covering every section toggle and optional-field permutation, and a Litmus / Email on Acid harness produces Outlook 2016 / 2019 / 365 visual diffs as the merge gate for any subsequent template change (EMAIL-09)
  3. Email assets (logo, brand mark) load from a stable, cookie-less CDN endpoint (e.g. `email-assets.lasprezz.com`) with proper caching headers (EMAIL-10)
  4. The Resend dashboard shows green DKIM, SPF, and DMARC alignment for the production sender domain, verified before the next phase ships any template change (EMAIL-11)
**Plans**: 5 plans (3 waves)

Plans:
- [x] 45-01-PLAN.md (foundation) — Wave 0: package.json deps + npm scripts + Playwright Chromium install (complete 2026-04-26 — see 45-01-SUMMARY.md)
- [x] 45-02-PLAN.md (tokens) — Wave 1: brand-tokens.ts + scripts/generate-theme-css.ts + global.css @import swap (EMAIL-08) (complete 2026-04-26 — see 45-02-SUMMARY.md)
- [x] 45-03-PLAN.md (asset host + DNS + merge gate) — Wave 2: sprezza-hub-email-assets repo + Vercel project + Cloudflare CNAME, lasprezz.com SPF amendment, Resend dashboard verify, docs/email-merge-gate.md, first real Outlook desktop scaffold render to liz@lasprezz.com (EMAIL-10, EMAIL-11) (complete 2026-04-26 — see 45-03-SUMMARY.md)
- [x] 45-04-PLAN.md (react-email scaffold) — Wave 2: src/emails/_theme.ts + __scaffold.tsx + scaffold.test.ts (EMAIL-08 proof-of-pipeline)
- [x] 45-05-PLAN.md (snapshot harness) — Wave 2: Send Update permutation + Work Order baseline Vitest snaps + playwright.config.ts + first Playwright spec at 3 viewports (EMAIL-09)

**UI hint**: yes

### Phase 46: Send Update + Work Order Migration
**Goal**: The two existing email templates (Send Update weekly digest and Work Order) are ported to the react-email foundation, render correctly across Outlook desktop / Gmail / Apple Mail, ship plain-text fallbacks, carry preheader copy, use Outlook-safe `<table>` markup, and the Send Update digest carries a List-Unsubscribe header for Gmail bulk-sender compliance.
**Depends on**: Phase 45 (foundation, snapshots, asset host, DKIM)
**Requirements**: EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-06, EMAIL-07
**Success Criteria** (what must be TRUE):
  1. The Send Update digest and Work Order email both render without layout collapse in Outlook 2016 / 2019 / 365, Gmail web, Gmail iOS, Apple Mail macOS, and Apple Mail iOS, verified via attached Litmus / EOA screenshots in the phase summary (EMAIL-01)
  2. Both templates send with a plain-text MIME alternative produced by `render(component, { plainText: true })` — every `resend.emails.send` call passes both `html` and `text` (EMAIL-02)
  3. Both templates include preheader text that renders as the inbox preview line in Gmail and Apple Mail (EMAIL-03)
  4. The Send Update digest carries a List-Unsubscribe header (RFC 8058 one-click format) on every send (EMAIL-06)
  5. The Send Update layout uses `<table role="presentation">` outer markup with pixel units, no `flex` / `grid` / `rem` / shorthand `border-radius` for layout, matching the Outlook-safe pattern already proven in the existing Work Order template (EMAIL-07)
**Plans**: TBD
**UI hint**: yes

### Phase 47: Portal Layout Hoist
**Goal**: Portal chrome (header, footer, banner slot) is hoisted into a single `PortalLayout.astro` shell with extracted `PortalHeader` and `PortalFooter` components, so every recipient-facing page in `/portal/*` shares one source of truth for brand mark, role-aware sub-label, sign-out, and the layout slot that the impersonation banner will occupy in Phase 50.
**Depends on**: v5.0 (Phase 34 portal baseline); none from email track (parallelizable)
**Requirements**: PORTAL-05
**Success Criteria** (what must be TRUE):
  1. A single `PortalLayout.astro` shell renders the same header and footer chrome on every `/portal/*` page (dashboard, project, PURL landing, login, verify, role-select via a `bare` prop), and changing brand-mark wording in one component updates every page (PORTAL-05)
  2. `PortalHeader.astro` and `PortalFooter.astro` are extracted as standalone components, no recipient page inlines its own brand mark or footer
  3. `PortalLayout.astro` exposes a layout slot for the impersonation banner that renders nothing today (component is built in Phase 50) and renders a sticky banner once Phase 50 lands — verified by mounting a stub banner during this phase
**Plans**: TBD
**UI hint**: yes

### Phase 48: Smaller Transactional Emails
**Goal**: The three remaining transactional invitation templates (artifact-ready, contractor work-order access, building-manager access) are built on the react-email foundation, share the same shell as Send Update / Work Order, ship plain-text fallbacks and preheaders by default, and carry the link-fallback copy and link-expiry messaging that mark them as deliberate transactional artifacts rather than disposable system mail.
**Depends on**: Phase 45 (foundation); Phase 46 (migration pattern proven)
**Requirements**: EMAIL-04, EMAIL-05
**Success Criteria** (what must be TRUE):
  1. Every transactional invitation email (Work Order, artifact-ready, contractor access, building access) shows a visible "or paste this link" line under the primary CTA with the literal URL selectable for copy-paste — verified by sending a test of each template type to a corporate inbox that strips the CTA button (EMAIL-04)
  2. Every transactional invitation email includes copy stating how long the link remains valid, sourced from the same TTL constant the redemption endpoint enforces (EMAIL-05)
**Plans**: TBD
**UI hint**: yes

### Phase 49: Impersonation Architecture
**Goal**: The server-side foundation for designer impersonation is in place — wrapped admin session schema (`impersonatedBy` field), one-shot mint/redeem token flow with Redis GETDEL, dedicated `impersonationAudit` Sanity document, middleware-enforced read-only gate on every mutation endpoint, hard 30-minute TTL, and a CI test that proves cross-tenant impersonation is structurally impossible — so the UI in Phase 50 can surface the feature against a load-bearing security boundary that's already proven correct.
**Depends on**: v5.0 (Phase 29 tenant model + session middleware); none from email/layout tracks (parallelizable)
**Requirements**: IMPER-02, IMPER-03, IMPER-04, IMPER-06, IMPER-07, IMPER-08
**Success Criteria** (what must be TRUE):
  1. Any non-safe HTTP method (POST / PATCH / PUT / DELETE) attempted from an impersonated session returns 401 — verified by a CI test that mints an impersonation cookie and POSTs to a representative admin and portal mutation endpoint (IMPER-02)
  2. Calls to `resend.emails.send` from any endpoint reached during an impersonated session return 403 before mail is dispatched, verified by a CI test against `/api/send-update` and the work-order send endpoint (IMPER-03)
  3. Every impersonation session is scoped to one (recipient, project) pair encoded in the wrapped payload and auto-expires after a 30-minute TTL — verified by inspecting the redeemed session shape and a server-side TTL enforcement test (IMPER-04)
  4. Every impersonation start, exit, and timeout creates an append-only entry on the `impersonationAudit` Sanity document with admin email, target role + entityId, tenantId, projectId, mintedAt, exitedAt, and exit reason — verified by reading the audit doc after a manual end-to-end run (IMPER-06)
  5. A CI test on every PR sends a cross-tenant `recipientId` to `/api/admin/impersonate` and asserts the response is 403 with no Redis token written (IMPER-07)
  6. Impersonation start requires fresh admin authentication: if the admin session was minted more than the configured threshold ago, the mint endpoint returns 401 with a re-prompt code instead of issuing a token (IMPER-08)
**Plans**: TBD

### Phase 50: Impersonation UI
**Goal**: Designer-facing surfaces — the recipient picker on admin entity detail pages, the one-shot impersonation start flow that opens in a new tab, and the persistent banner with admin identity, target identity, and one-click exit rendered on every recipient route — make Phase 49's architecture usable. The banner self-gates so it renders correctly on `/portal/*`, `/workorder/*`, and `/building/*` even though only `/portal/*` uses the new `PortalLayout` shell.
**Depends on**: Phase 47 (banner slot in PortalLayout); Phase 49 (mint/redeem, audit log, read-only gate)
**Requirements**: IMPER-01, IMPER-05
**Success Criteria** (what must be TRUE):
  1. From `/admin/clients/[id]`, `/admin/trades/[id]`, and any other admin entity detail page where a recipient is identifiable, Liz can click "Preview as <recipient>" — the resulting flow opens the appropriate portal in a new tab as that recipient (client, contractor, or building manager), driven by a tenant-scoped GROQ recipient picker and never by free-text input (IMPER-01)
  2. A persistent banner renders on every recipient-facing page during impersonation displaying admin email, target role + display name, and a one-click "Exit preview" form-button — visible at top of viewport on `/portal/*`, `/workorder/*`, and `/building/*` at both desktop and 375×667 mobile widths (IMPER-05)
**Plans**: TBD
**UI hint**: yes

### Phase 51: Portal Visual + Voice Pass
**Goal**: Recipient-facing portal pages match the admin's card-header band system and brand voice from v5.1/v5.2; clients arriving on a project portal see a "What's next?" card calling out their immediate action; section-level last-activity timestamps reassure them the data is current; mobile rendering works on iPhone-sized viewports; and recipients arriving with expired or regenerated tokens see distinct, recoverable copy instead of a generic login screen. Liz uses the impersonation flow from Phase 50 to QA every change without sending mail to real recipients.
**Depends on**: Phase 47 (portal layout shell); Phase 50 (impersonation preview for QA); Phase 45 (brand tokens for visual consistency with email)
**Requirements**: PORTAL-01, PORTAL-02, PORTAL-03, PORTAL-06, AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. A client landing on `/portal/project/[id]` sees a "What's next?" card at the top of the page identifying their immediate action or the next expected event, derived from open action items and pending artifact reviews (PORTAL-01)
  2. Each major section of the project portal (milestones, procurement, artifacts, contractors, design options) shows a last-activity timestamp in human-readable form (e.g. "updated 2 days ago") (PORTAL-02)
  3. Every portal page (`/portal/*`, `/workorder/*`, `/building/*`) renders correctly at 375×667 mobile viewport with no horizontal scroll, body text readable without zoom, and tap targets at least 44pt (PORTAL-03)
  4. Portal voice and visual rhythm match the admin's card-header band system (`.card-header`, brand tokens, sentence-case-via-CSS-uppercase) — a side-by-side comparison of admin and portal cards shows consistent header treatment (PORTAL-06)
  5. A recipient arriving with an expired or regenerated token lands on a login screen with distinct, reason-coded copy explaining what happened and how to recover, not a generic "please sign in" — at least four reason codes (`token_regenerated`, `link_expired`, `link_invalid`, `session_timeout`) each render distinct copy (AUTH-01)
  6. Login, verify, and role-select pages render in the polished portal shell from Phase 47 (via `bare={true}` to suppress the chrome that's wrong for unauthenticated pages) with consistent typography and spacing matching the rest of the portal (AUTH-02)
**Plans**: TBD
**UI hint**: yes

### Phase 52: Cross-Cutting QA / UAT
**Goal**: A single coherent end-to-end pass exercises every recipient surface — Liz performs a real impersonation as each recipient role, sends a real Send Update digest, opens the project portal at desktop and mobile widths, walks through the auth recovery copy for every reason code, and a representative subset of routes passes WCAG 2.1 AA assertions via @axe-core/playwright — catching any inter-phase regression before milestone close.
**Depends on**: Phases 45-51
**Requirements**: PORTAL-04
**Success Criteria** (what must be TRUE):
  1. A representative subset of portal routes (project, dashboard, login, verify) pass WCAG 2.1 AA assertions via @axe-core/playwright with zero violations — results attached to phase summary (PORTAL-04)
  2. End-to-end UAT pass: Liz impersonates one client, one contractor, and one building manager (each on a different project), confirms the banner is visible, exits cleanly, sends a real Send Update digest, opens it in Outlook desktop / Gmail / Apple Mail iOS, opens the resulting portal link, and confirms the polished portal renders correctly at desktop and 375×667 mobile widths
  3. Outlook 2016 / 2019 / 365 screenshots and iPhone 12-mini screenshots of every refreshed email and portal page are attached to the phase summary
  4. The `impersonationAudit` document is reviewed and shows clean enter/exit pairs with no orphaned entries, confirming the audit trail captured every preview Liz performed during UAT
**Plans**: TBD

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
| 35 | v5.1 | 5/5 | Complete | 2026-04-14 |
| 36 | v5.1 | 4/4 | Complete | 2026-04-14 |
| 37 | v5.1 | 3/3 | Complete | 2026-04-15 |
| 38 | v5.1 | 2/2 | Complete | 2026-04-15 |
| 39 | v5.1 | 4/4 | Complete | 2026-04-15 |
| 40 | v5.1 | 3/3 | Complete | 2026-04-22 |
| 41 | v5.2 | 3/3 | Complete    | 2026-04-23 |
| 42 | v5.2 | 3/3 | Complete    | 2026-04-23 |
| 43 | v5.2 | 4/4 | Complete    | 2026-04-23 |
| 44 | (interim) | 0/11 | In progress | - |
| 45 | v5.3 | 4/4 | Complete   | 2026-04-26 |
| 46 | v5.3 | 0/TBD | Not started | - |
| 47 | v5.3 | 0/TBD | Not started | - |
| 48 | v5.3 | 0/TBD | Not started | - |
| 49 | v5.3 | 0/TBD | Not started | - |
| 50 | v5.3 | 0/TBD | Not started | - |
| 51 | v5.3 | 0/TBD | Not started | - |
| 52 | v5.3 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-03-14*
*v1.0 shipped: 2026-03-15*
*v5.0 shipped: 2026-04-12 — archived to milestones/v5.0-ROADMAP.md*
*v5.1 planned: 2026-04-14 — 7 phases, 43 requirements, 22 plans estimated*
*v5.2 planned: 2026-04-22 — 3 phases, 12 requirements, ~9 plans estimated*
*Phase 41 planned: 2026-04-22 — 2 plans (backend foundation + UI sweep)*
*v5.3 planned: 2026-04-26 — 8 phases (45-52), 27 requirements, plans TBD per phase*

# La Sprezzatura

## What This Is

A full digital platform for La Sprezzatura, an interior design studio run by Elizabeth ("Liz") on Long Island / New York. The project includes a custom-built portfolio website, multi-role client/contractor/building-manager portal, AI rendering tool, and a custom admin app (Linha) that replaced Sanity Studio as the sole management interface. The platform uses tenant-aware architecture, positioning it for multi-tenant extraction in v6.0.

## Core Value

A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work — the site itself is the first project a potential client experiences.

## Milestone Plan

| Milestone | Focus | Phases | Status |
|-----------|-------|--------|--------|
| v1.0 MVP | Public site, portfolio, CMS, basic portal | 1-3 | Shipped 2026-03-15 |
| v2.0 Client Portal Foundation | Auth, client data, engagement types, core portal features | 5-6 | Complete 2026-04-03 |
| v2.5 Contractor & Commercial Workflows | Contractor portal, building manager portal, residential/commercial toggle | 7-8 | Complete 2026-04-03 |
| v3.0 AI Rendering & Go-Live | AI rendering tool, send update, investment proposals, site polish | 9-12 | Phase 12 deferred |
| v3.1 Rendering Tool Polish | Fix wizard UX, image previews, multi-upload, blob reliability | 13-14 | Complete 2026-04-03 |
| v4.0 Project Schedule | Interactive Gantt chart for project sequencing | 15-17 | Phase 15 complete |
| v5.0 Admin Platform | Custom /admin/* app replacing Sanity Studio | 29-34 | Shipped 2026-04-12 |
| v5.1 Admin UX Polish | Hands-on UX refinements, Work Order + Documents panels, vendor/client schema updates | 35-41 | In progress |
| v5.2 Schedule Rebuild | Retire Frappe Gantt, configurable designer template workflow | TBD | Needs brainstorming |
| v6.0 Linha Platform | Multi-tenant extraction, Turborepo monorepo, onboarding wizard | TBD | Planned |

## Current Milestone: v5.1 Admin UX Polish & Workflow Additions

**Goal:** Refine the v5.0 admin app based on Liz's hands-on feedback, add Work Order and Documents panels to project detail, remove pricing exposure from procurement, and tighten vendor/client data models.

**Target features:**
- Dashboard polish — rename Deliveries → Upcoming Deliveries, free-text filters, remove relative-time status noise, fix Contractor card bugs, visible task add + hide-completed
- Projects list — completed-project visual separation, manual + 90-day auto-archive, archived view
- Procurement — row-to-modal view/edit, strip all pricing fields (privacy), rename Delivery → Expected install date, multi-image upload
- NEW Work Order panel — select procurement items + custom fields + special instructions → send via office@lasprezz.com
- NEW Documents panel — upload contracts and addenda to a project
- Send Update sender config — from/cc sourced from Settings
- Contractors/Vendors — rename to "Contractor / Vendor", trade pills + trades CRUD, address field, 1099 upload
- Clients — consistent phone formatting, address field, updated columns, drop "preferred contact"

## Current State (after v5.0)

**Shipped:** Custom `/admin/*` app with tenant-aware architecture. Sanity Studio fully retired (51 files deleted, studioBasePath dropped). The admin app is the sole management interface for projects, clients, contractors, procurement, rendering, portfolio, settings, and Send Update.

**Tech stack:** Astro 6, React (islands), Sanity CMS (Content Lake only — no Studio), Tailwind CSS, Vercel, Upstash Redis, Vercel Blob, Gemini (AI rendering), Ship24 (tracking), Resend (email), bcryptjs (admin auth)

**LOC:** ~46,800 TypeScript/TSX/Astro/CSS

**Admin features shipped in v5.0:**
- Tenant-aware platform foundation (per-tenant Sanity clients, admin auth, middleware)
- Dashboard with active projects, deliveries, tasks, overdue detection
- Client and contractor CRUD with search, popovers, quick-assign, delete protection
- Procurement editor with 6-stage pipeline, Ship24 tracking, daily cron
- AI rendering tool (wizard, chat refinement, promote to Design Options, usage tracking)
- Portfolio management with toggle, edit, drag-and-drop reorder
- Site settings, hero slideshow, rendering config
- Send Update email with per-client personal portal links (PURL)
- Client dashboard at /portal/client/[token]

## Requirements

### Validated

- ✓ Custom-built portfolio website with 5 core sections: Home, Portfolio, Services, About, Contact — v1.0
- ✓ Polished visual design — warm neutrals, editorial typography, generous whitespace — v1.0
- ✓ CMS (Sanity) with form-like editing for portfolio management — v1.0
- ✓ Portfolio gallery with project pages, lightbox, filterable by room type — v1.0
- ✓ Contact form with email notification via Resend — v1.0
- ✓ Hosting on Vercel with automatic GitHub deploys — v1.0
- ✓ Basic client portal with PURL access, pipeline status, milestone timeline — v1.0
- ✓ SEO foundations (meta, OG, structured data, sitemap) — v1.0
- ✓ Platform foundation — tenant-scoped architecture (tenant model, scoped auth, per-tenant config) — v5.0
- ✓ Dashboard — cross-project overview (active projects, deliveries, tasks) — v5.0
- ✓ Task management — per-project tasks with due dates, dashboard integration — v5.0
- ✓ Procurement editor — inline editing, status badges, auto-tracking via Ship24 — v5.0
- ✓ Client + contractor CRUD — forms, quick-assign, contact popovers, internal notes — v5.0
- ✓ Portfolio management — curate completed projects for public site — v5.0
- ✓ Rendering tool relocation — port from Studio, fix UX bugs, retest AI — v5.0
- ✓ Settings + Studio retirement — settings form, Send Update, hero slideshow — v5.0

### Active (v3.0 — remaining)

- [ ] DNS consolidation — all 4 domains to Cloudflare
- [ ] Email consolidation to @lasprezz.com on Microsoft 365 with SPF/DKIM/DMARC

### Active (v5.1 — in progress)

- [ ] Dashboard polish — upcoming-deliveries rename, free-text filters, contractor card fixes, tasks add/hide, remove relative-time status noise
- [ ] Projects list — completed-project styling, manual archive, 90-day auto-archive, archived view
- [ ] Procurement — row-to-modal editor, strip pricing fields, rename install-date column, multi-image upload
- [ ] Work Order panel — select procurement items, custom fields, special instructions, email send
- [ ] Documents panel — upload contracts and project documentation
- [ ] Send Update sender config sourced from Settings (office@ / cc liz@)
- [ ] Contractors/Vendors rename + trade pills + trades CRUD + address + 1099 support
- [ ] Client data model — phone formatting, address field, updated columns, drop preferred-contact

### Deferred (v4.0 — Gantt)

- Phases 16-17 superseded by v5.2 Schedule Rebuild (Frappe Gantt retirement)

### Planned (v6.0 — Linha Platform)

- [ ] Turborepo monorepo — packages/core, packages/portal, packages/rendering, templates/
- [ ] La Sprezzatura migrated as reserved template
- [ ] 3-5 public designer templates (Aria, Forma, Verra)
- [ ] Admin dashboard at admin.linha.com — designer management, usage, billing, health
- [ ] Onboarding wizard — guided provisioning (Sanity dataset, Vercel project, domain, billing)
- [ ] Per-designer Vercel deployments with Sanity multi-dataset isolation

### Out of Scope

- Real-time chat / chatbot — high complexity, not core to studio value
- Video content hosting — storage/bandwidth costs disproportionate to value
- Mobile native app — web-first, responsive design handles mobile
- Houzz Pro subscription — keep free listing only, $99/mo not justified
- Blog at launch — deferred until Liz has bandwidth for content creation
- 3D floor plan generation — separate tooling (SketchUp etc.), not part of the website
- Dubsado — evaluate later only if proposal/contract workflow becomes a pain point

## Context

- **Current site:** Wix at lasprezz.com — sparse content, no dedicated service/about/contact pages, poor SEO
- **Domains:** 4 domains across Wix and GoDaddy registrars — need consolidation to Cloudflare
- **Email:** Microsoft 365 via lasprezzaturany.com. lasprezz.com MX configured for M365.
- **Portfolio:** 4-5 completed projects with photography, plus Instagram content
- **Content approach:** Photos-first, minimal long-form writing. Let the work speak for itself.
- **Builder:** Paul (proficient developer, building with Claude Code assistance). Liz is the client/business owner — average tech comfort, needs simple admin UX.
- **Design priority:** Polished, cutting-edge design is the #1 requirement. The site must look nothing like a template.
- **Agents:** Should be relatively self-directed during execution — Paul wants minimal hand-holding of the build process.
- **Financial tools:** Moving from FreshBooks to QuickBooks for richer integration ecosystem
- **Admin app:** Custom `/admin/*` app (Linha) is the sole management interface. Sanity Studio retired as of v5.0.
- **Multi-tenant readiness:** Tenant-scoped architecture in place (Level 1). Phase 34 APIs still use global sanityWriteClient (tech debt for v6.0).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Custom build over Squarespace | Template fingerprints unacceptable for luxury brand | ✓ Good |
| Microsoft 365 over Google Workspace | Already in use, migration disruptive | ✓ Good |
| Astro 6 over Next.js | Content-first site with islands architecture; better performance for portfolio-heavy site | ✓ Good |
| PURL over account-based portal access | Zero friction for clients, appropriate security for interior design data | ✓ Good — upgraded to magic link in v2.0 |
| Restructure v2.0 into v2.0/v2.5/v3.0 | v2.0 had 43 requirements across 4 phases — scope creep | ✓ Good |
| Product name: Linha | Admin platform is the product; La Sprezzatura is one tenant/instance | ✓ Good |
| Multi-tenant from v5.0 (Level 1) | Tenant-scoped architecture baked in from start; no hardcoded single-tenant assumptions | ✓ Good — minor gaps (Phase 34 APIs, cron) accepted as tech debt |
| Sanity Studio retired immediately (not 30-day deprecation) | No external users depend on Studio; admin app covers all features | ✓ Good |
| Ship24 for tracking | Aggregator API for auto-checking carrier status; free tier (100 calls/mo) sufficient | ✓ Good |
| PURL tokens stored as plaintext in Sanity | Bookmark-level credentials; middleware hashes per-request; regenerate is recovery path | — Accepted risk |
| Gemini for AI rendering | Pro-level quality at Flash speed; ~$0.07/image at 1K; model configurable via env var | ✓ Good |

## Constraints

- **Framework:** Astro 6 with Sanity CMS (Content Lake only — Studio retired)
- **Code location:** ~/Dropbox/GitHub/la-sprezzatura
- **Admin UX:** Must be simple enough for Liz to use independently — form-based editing, no technical concepts exposed
- **Budget:** Minimize monthly costs — leverage free tiers (Vercel, Sanity, Cloudinary, Resend). Realistic Day 1: ~$51/mo (M365 + QuickBooks + Sanity)
- **Design:** Luxury interior design aesthetic: warm neutrals, editorial typography, generous whitespace
- **Email:** Stay on Microsoft 365
- **Admin:** Custom /admin/* app is the sole management interface (Sanity Studio retired)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? Move to Out of Scope with reason
2. Requirements validated? Move to Validated with phase reference
3. New requirements emerged? Add to Active
4. Decisions to log? Add to Key Decisions
5. "What This Is" still accurate? Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check: still the right priority?
3. Audit Out of Scope: reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-14 — v5.1 milestone started (Admin UX Polish & Workflow Additions)*

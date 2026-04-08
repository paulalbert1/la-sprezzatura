# La Sprezzatura

## What This Is

A full digital platform for La Sprezzatura, an interior design studio run by Elizabeth ("Liz") on Long Island / New York. The project replaces a low-performing Wix site (38% SEO, 2 indexed pages) with a custom-built portfolio website, client operations portal, and integrated business tooling — designed to attract high-end clients and automate studio operations.

## Core Value

A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work — the site itself is the first project a potential client experiences.

## Milestone Plan

| Milestone | Focus | Phases |
|-----------|-------|--------|
| v1.0 MVP | Public site, portfolio, CMS, basic portal | 1-3 |
| v2.0 Client Portal Foundation | Auth, client data, engagement types, core portal features | 5-6 |
| v2.5 Contractor & Commercial Workflows | Contractor portal, building manager portal, residential/commercial toggle | 7-8 |
| v3.0 AI Rendering & Go-Live | AI rendering tool, send update, investment proposals, site polish | 9-12 |
| v3.1 Rendering Tool Polish | Fix wizard UX, image previews, multi-upload, blob reliability | 13-14 |
| v4.0 Project Schedule | Interactive Gantt chart for project sequencing | 15-17 |
| v5.0 Admin Platform | Custom /admin/* app replacing Sanity Studio | 18-28 (foundation), 29+ (completion) |
| v6.0 Linha Platform | Multi-tenant extraction, Turborepo monorepo, onboarding wizard | TBD |

## Current Milestone: v5.0 Admin Platform Completion

**Goal:** Complete the custom `/admin/*` app (Linha) with tenant-aware architecture, all management features, and dashboard — so Sanity Studio can be fully retired.

**Target features:**
- Platform foundation — tenant-scoped architecture (Level 1: no hardcoded assumptions, tenant context on every request)
- Dashboard — cross-project overview with milestones, deliveries, tasks, activity feed (per mockup)
- Task management — per-project task list with due dates, integrated into dashboard
- Procurement editor — inline editing, status badges, auto-tracking via Ship24/EasyPost (daily cron + force refresh)
- Client + contractor CRUD — forms, quick-assign, contact card popovers, internal notes
- Portfolio management — curate which completed projects appear on public site
- Rendering tool relocation — port from Sanity Studio to admin, fix 5 UX bugs, retest AI
- Settings + Studio retirement — settings form, Send Update relocation, hero slideshow, deprecation

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

### Active (v3.0)

- [ ] AI rendering tool in Sanity Studio — guided wizard with floor plans, space photos, inspiration, and text prompt
- [ ] Gemini-powered image generation — photorealistic 1K room renderings
- [ ] Conversational refinement — iterate on renderings with multi-turn context
- [ ] Design Options — promote renderings as client-facing gallery items with captions
- [ ] Client portal Design Options gallery — favorites, comments, confidentiality notice
- [ ] Usage tracking — per-designer monthly allocation with hard cap
- [ ] Send Update — templated email to client with current portal state + optional note + delivery log
- [ ] Budget proposals — tiered pricing artifacts (Best/Better/Good) per project
- [ ] Fantastical Openings booking — replace Cal.com embed on contact page
- [ ] Home page hero visual refresh — more impact, animation
- [ ] DNS consolidation — all 4 domains to Cloudflare
- [ ] Email consolidation to @lasprezz.com on Microsoft 365 with SPF/DKIM/DMARC
- [ ] Professional email addresses: liz@lasprezz.com, info@lasprezz.com, paul@lasprezz.com

### Active (v5.0 — Admin Platform Completion)

- [x] Platform foundation — tenant-scoped architecture (tenant model, scoped auth, per-tenant config) — Phase 29
- [ ] Dashboard — cross-project overview (milestones, deliveries, tasks, activity feed)
- [ ] Task management — per-project tasks with due dates, dashboard integration
- [ ] Procurement editor — inline editing, status badges, auto-tracking via aggregator API
- [ ] Client + contractor CRUD — forms, quick-assign, contact popovers, internal notes
- [ ] Portfolio management — curate completed projects for public site
- [ ] Rendering tool relocation — port from Studio, fix UX bugs, retest AI
- [ ] Settings + Studio retirement — settings form, Send Update, hero slideshow, deprecation

### Deferred

- [ ] Gantt drag-and-drop rescheduling with Sanity field sync (v4.0 Phase 16)
- [ ] Gantt appointment sub-markers, overlap highlighting, procurement lifecycle bars (v4.0 Phase 17)
- [ ] DNS cutover and go-live — all 4 domains to Cloudflare (v3.0 Phase 12)
- [ ] AI rendering improvements — revisit later

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
- **Email:** Currently on Microsoft 365 via lasprezzaturany.com, lasprezz.com MX misconfigured (points to Google)
- **Portfolio:** 4-5 completed projects with photography, plus Instagram content. Projects include Darien, Flower Hill Office, Gramercy Apartment, North Shore Bathroom
- **Content approach:** Photos-first, minimal long-form writing for now. Let the work speak for itself.
- **Builder:** Paul (proficient developer, building with Claude Code assistance). Liz is the client/business owner — average tech comfort, needs simple CMS UX.
- **Design priority:** Polished, cutting-edge design is the #1 requirement. The site must look nothing like a template. UI/UX Pro Max skill available for design quality during execution.
- **Agents:** Should be relatively self-directed during execution — Paul wants minimal hand-holding of the build process.
- **Financial tools:** Moving from FreshBooks to QuickBooks for richer integration ecosystem
- **Existing planning:** Comprehensive Digital Strategy doc (Feb 2026) and Website Planning Report (Mar 2026) in this directory

## Constraints

- **Framework:** Astro 6 with Sanity CMS (decided in v1.0 research)
- **Code location:** Repo will be created in ~/Dropbox/GitHub/ (not in this planning directory)
- **CMS UX:** Must be simple enough for Liz to use independently — form-based editing, no technical concepts exposed
- **Budget:** Minimize monthly costs at launch — leverage free tiers (Vercel, Sanity, Cloudinary, Cal.com, Resend). Realistic Day 1: ~$36/mo (Google Workspace + QuickBooks)
- **Design:** Must define visual identity through research — no existing brand guide. Luxury interior design aesthetic: warm neutrals, editorial typography, generous whitespace
- **Email:** Stay on Microsoft 365 (already in use) — do NOT migrate to Google Workspace

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Custom build over Squarespace | Template fingerprints unacceptable for luxury brand; developer (Paul) finds visual editor counterproductive | — Pending |
| Custom build over Houzz Pro | $99/mo too expensive; features overlap with tools being assembled; keep free listing only | — Pending |
| Microsoft 365 over Google Workspace | Already in use, migration disruptive, no reason to switch | — Pending |
| Astro 6 over Next.js | Content-first site with islands architecture; better performance for portfolio-heavy site; Sanity integration mature | ✓ Good |
| Fantastical over Cal.com | Liz already uses Fantastical as daily calendar; avoids dual availability management | — Pending |
| PURL over account-based portal access | Zero friction for clients, faster to build, appropriate security for interior design data | ⚠️ Revisit — upgrading to magic link in v2.0 |
| Restructure v2.0 into v2.0/v2.5/v3.0 | v2.0 had 43 requirements across 4 phases — scope creep. Split into foundation (v2.0), contractor/commercial (v2.5), operations + go-live (v3.0) | ✓ Good |
| Engagement type on project schema | Full Interior Design / Styling & Refreshing / Carpet Curating controls available features. Added to v2.0 data foundation so schema is right from day one | ✓ Good |
| Cloudflare for DNS | At-cost pricing, fastest authoritative DNS, consolidates 4 domains under one registrar | — Pending |
| AI rendering via Sanity Studio custom tool | Keeps designer in existing workspace; API service layer matches existing patterns; extractable to Linha | — Pending |
| Gemini (Nano Banana 2) for image generation | Pro-level quality at Flash speed; strong spatial understanding; ~$0.07/image at 1K; model configurable via env var | — Pending |
| Build AI rendering in la-sprezzatura first | Liz gets value immediately; all features exist before Linha extraction = cleaner migration | — Pending |
| v3.0 absorbs old v3.0 + AI rendering | Combined milestone avoids a thin v3.0; rendering is the marquee feature for go-live | — Pending |
| Product name: Linha | Admin platform is the product; La Sprezzatura is one tenant/instance. Other designers will use it. | — Pending |
| Multi-tenant from v5.0 (Level 1) | Tenant-scoped architecture baked in from start; no hardcoded single-tenant assumptions. Manual provisioning for now; self-service onboarding in v6.0. | — Pending |
| Ship24 or EasyPost for tracking | Aggregator API for auto-checking UPS/FedEx/DHL status. Ship24 free tier (100 calls/mo) likely sufficient; EasyPost ~$3/mo fallback. | — Pending |
| Sanity Studio retirement via deprecation | 30-day deprecation banner before removal; admin must have all features verified first | — Pending |

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
*Last updated: 2026-04-08 — Phase 29 complete (tenant-aware platform foundation)*

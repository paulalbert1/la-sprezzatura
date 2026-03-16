# La Sprezzatura

## What This Is

A full digital platform for La Sprezzatura, an interior design studio run by Elizabeth ("Liz") on Long Island / New York. The project replaces a low-performing Wix site (38% SEO, 2 indexed pages) with a custom-built portfolio website, client operations portal, and integrated business tooling — designed to attract high-end clients and automate studio operations.

## Core Value

A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work — the site itself is the first project a potential client experiences.

## Milestone Plan

| Milestone | Focus | Phases |
|-----------|-------|--------|
| v2.0 Client Portal Foundation | Auth, client data, engagement types, core portal features | 5-6 |
| v2.5 Contractor & Commercial Workflows | Contractor portal, building manager portal, residential/commercial toggle | 7-8 |
| v3.0 Business Operations & Go-Live | Send Update emails, investment proposals, public site polish, DNS cutover | 9-10 |

## Current Milestone: v2.0 Client Portal Foundation

**Goal:** Secure portal access via magic link auth, client data model with engagement types, core portal features (milestones, procurement, artifacts) — the foundation every subsequent milestone builds on.

**Target features:**
- Magic link auth (replacing raw PURL access)
- Client data model (contact info, address, preferred contact method)
- Engagement type per project (Full Interior Design / Styling & Refreshing / Carpet Curating)
- Custom per-project milestones with dates (replacing generic 6-stage pipeline)
- Line-item procurement tracker (status, cost, retail, savings — managed in Sanity)
- Project artifacts with versioning and approval workflow
- Post-project workflow (close document, warranty)
- Rate limiter upgrade + Resend domain verification

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

### Active (v2.0)

- [ ] Magic link auth — cookie-based sessions, no passwords
- [ ] Client data model in Sanity — phone, email, preferred contact, address per client
- [ ] Engagement type toggle — Full Interior Design / Styling & Refreshing / Carpet Curating
- [ ] Custom per-project milestones with dates (not generic pipeline stages)
- [ ] Procurement tracker — line items with status/cost/retail/savings, managed in Sanity
- [ ] Project artifacts with versioning, approval workflow, and decision log
- [ ] Post-project workflow — close document, warranty, reopen

### Planned (v2.5)

- [ ] Contractor portal — magic link, floor plans, scope, estimate, minimal client info
- [ ] Residential vs Commercial toggle
- [ ] Building manager portal — magic link, commercial only, COIs, legal docs
- [ ] Client sees contractor name + on-site schedule

### Planned (v3.0)

- [ ] Send Update — templated email to client with current portal state + optional note + delivery log
- [ ] Budget proposals — tiered pricing artifacts (Best/Better/Good) per project
- [ ] Fantastical Openings booking — replace Cal.com embed on contact page
- [ ] Home page hero visual refresh — more impact, animation
- [ ] DNS consolidation — all 4 domains to Cloudflare
- [ ] Email consolidation to @lasprezz.com on Microsoft 365 with SPF/DKIM/DMARC
- [ ] Professional email addresses: liz@lasprezz.com, info@lasprezz.com, paul@lasprezz.com

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
| Restructure v2.0 into v2.0/v2.5/v3.0 | v2.0 had 43 requirements across 4 phases — scope creep. Split into foundation (v2.0), contractor/commercial (v2.5), operations + go-live (v3.0) | — Pending |
| Engagement type on project schema | Full Interior Design / Styling & Refreshing / Carpet Curating controls available features. Added to v2.0 data foundation so schema is right from day one | — Pending |
| Cloudflare for DNS | At-cost pricing, fastest authoritative DNS, consolidates 4 domains under one registrar | — Pending |

---
*Last updated: 2026-03-16 after v2.0 restructure into v2.0/v2.5/v3.0*

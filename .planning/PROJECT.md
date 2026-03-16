# La Sprezzatura

## What This Is

A full digital platform for La Sprezzatura, an interior design studio run by Elizabeth ("Liz") on Long Island / New York. The project replaces a low-performing Wix site (38% SEO, 2 indexed pages) with a custom-built portfolio website, client operations portal, and integrated business tooling — designed to attract high-end clients and automate studio operations.

## Core Value

A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work — the site itself is the first project a potential client experiences.

## Current Milestone: v2.0 Client Portal Platform + Go-Live

**Goal:** Expand the basic client portal into Liz's primary client operations tool — with per-project milestones, procurement tracking, tiered budget proposals, client data management, and ad hoc update emails — polish the public site, swap to Fantastical booking, and go live via DNS cutover.

**Target features:**
- Client data model (contact info, address, preferred contact method)
- Custom per-project milestones with dates (replacing generic 6-stage pipeline)
- Line-item procurement tracker (status, cost, retail, savings — evolves over time)
- Budget proposals as versioned artifacts (Best/Better/Good tiers, client customizes)
- "Send Update" — templated email snapshot of portal state + optional note + logging
- Swap Cal.com for Fantastical Openings on contact page
- Home page hero refresh (more visual impact / animation)
- DNS cutover and go-live (from v1.0 Phase 4)

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

### Active

- [ ] Client data model in Sanity — phone, email, preferred contact, address per client
- [ ] Custom per-project milestones with dates (not generic pipeline stages)
- [ ] Procurement tracker — line items with status/cost/retail/savings, managed in Sanity
- [ ] Budget proposals — tiered pricing artifacts (Best/Better/Good) per project
- [ ] Send Update — templated email to client with current portal state + optional note + delivery log
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
| PURL over account-based portal access | Zero friction for clients, faster to build, appropriate security for interior design data | — Pending |
| Cloudflare for DNS | At-cost pricing, fastest authoritative DNS, consolidates 4 domains under one registrar | — Pending |

---
*Last updated: 2026-03-15 after v2.0 milestone start*

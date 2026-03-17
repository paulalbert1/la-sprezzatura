# Linha — Multi-Tenant Designer Platform Design Spec

**Date:** 2026-03-17
**Status:** Approved
**Approach:** A — Turborepo Monorepo with per-designer deployments

## Overview

Linha is a multi-tenant platform for interior designers. Each designer gets a white-labeled portfolio website (custom domain, no Linha branding), a universal client/contractor/building manager portal, AI rendering tools, and a Sanity Studio for content management. La Sprezzatura (Liz's brand) is the first customer.

The platform is built as a Turborepo monorepo with shared packages, a template system for public-facing sites, and a per-designer Vercel deployment model. Paul operates the platform via an admin dashboard and onboarding wizard.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Turborepo monorepo | Shared code changes propagate instantly; standard pattern for multi-app platforms; best for concurrent development |
| Sanity multi-dataset (one per designer) | Complete data isolation; no cross-tenant query filtering needed; Sanity supports this natively |
| One Vercel deployment per designer | Each designer's site, portal, API routes, and Studio are self-contained; no shared API routing complexity; template differences handled at build time |
| Universal portal, themed per designer | One portal codebase to maintain; designer's logo/colors injected via CSS variables and brand config |
| 3-5 site templates + La Sprezzatura as reserved | Designers get a professionally designed site without structural customization; La Sprezzatura's design is exclusive to Liz |
| Admin dashboard as standalone app | Clean separation from designer/client concerns; can query across all datasets; deploys independently |
| Onboarding wizard over raw CLI | Guided experience prevents errors; adapts to domain scenarios; persists checklist state |
| Build concurrently with la-sprezzatura | Platform architecture established now; la-sprezzatura migrates into the monorepo as the first template |
| Invitation-only, Paul-operated | Not self-serve signup; 2-5 designers in year 1; white-glove onboarding |
| Billing: setup fee + monthly + AI overage | Three revenue streams; manual invoicing for V1; Stripe integration deferred |

## Platform Name

**Linha** — Portuguese for "line" (as in a design line, a clean line). The platform brand is invisible to end users; designers' clients see only the designer's brand.

## Monorepo Structure

```
linha/
├── packages/
│   ├── core/              # Shared platform foundation
│   │   ├── schemas/        # Sanity document types (client, project, contractor, etc.)
│   │   ├── queries/        # GROQ query constants and functions
│   │   ├── auth/           # Magic link, session management, multi-role auth
│   │   ├── api/            # Shared API route handlers (blob-serve, notify, etc.)
│   │   └── utils/          # Rate limiting, email (Resend), PDF generation
│   │
│   ├── portal/            # Universal portal UI
│   │   ├── components/     # Dashboard, milestones, procurement, artifacts, design options
│   │   ├── layouts/        # Portal page layouts (login, dashboard, project detail)
│   │   └── styles/         # Portal CSS (accepts brand color/logo as CSS variables)
│   │
│   ├── rendering/         # AI rendering feature
│   │   ├── tool/           # Sanity Studio custom tool (wizard, refinement, sessions)
│   │   ├── api/            # Generate, refine, promote, react, usage routes
│   │   └── schemas/        # renderingSession, designOption, renderingUsage types
│   │
│   └── cli/               # Onboarding & admin CLI (fallback for admin dashboard)
│       ├── create-designer  # Scaffold new designer
│       ├── sync-schemas     # Push schema changes to all datasets
│       ├── usage-report     # Pull usage across all designers
│       └── list-designers   # List active designers
│
├── templates/
│   ├── base/              # Shared Astro config, middleware, /studio, portal routes, API routes
│   ├── la-sprezzatura/    # Liz's reserved template (extends base)
│   ├── template-aria/     # Public template 1
│   ├── template-forma/    # Public template 2
│   └── template-verra/    # Public template 3
│
├── apps/
│   └── admin/             # Admin dashboard (admin.linha.com)
│       ├── designers/      # Designer list, onboarding status, billing
│       ├── usage/          # Cross-designer usage & cost tracking
│       ├── billing/        # Invoicing, subscription management
│       └── onboarding/     # Guided wizard for adding new designers
│
├── turbo.json             # Turborepo build orchestration
├── package.json           # Workspace root
└── .env.example           # Shared env var template
```

### Package Responsibilities

**`packages/core`** — The platform foundation. Everything that's currently in la-sprezzatura's `src/lib/`, `src/sanity/schemas/`, `src/actions/`, and `src/pages/api/`. All Sanity schemas, GROQ queries, auth logic, API route handlers, and utility functions.

**`packages/portal`** — The universal portal UI. React components for dashboard, milestones, procurement, artifacts, design options gallery, warranty claims. Portal layouts. Accepts brand configuration (colors, logo) via CSS custom properties.

**`packages/rendering`** — The AI rendering feature (as specified in the AI rendering design spec). Sanity Studio custom tool, API route handlers, and rendering-specific schemas.

**`packages/cli`** — Node.js CLI tool for platform operations. Fallback for the admin dashboard wizard. Commands: `create-designer`, `sync-schemas`, `usage-report`, `list-designers`.

## Multi-Tenancy

### Data Isolation

- One Sanity project, multiple datasets: `liz`, `jane-doe-interiors`, `alex-design`, etc.
- Each dataset contains identical schemas (deployed via `cli/sync-schemas` or admin dashboard)
- All data access is scoped by dataset — the Sanity client is configured with `SANITY_DATASET` from environment variables
- No cross-dataset queries except from the admin dashboard
- Cross-tenant data leakage is architecturally impossible — each deployment connects to exactly one dataset

### Per-Designer Deployment

Each designer = one Vercel project containing:
- Public-facing site (template pages)
- Client/contractor/building manager portal (`/portal/*`)
- API routes (`/api/*`)
- Sanity Studio (`/studio`)

All routes read `SANITY_DATASET` from the environment. No runtime domain-to-designer resolution needed.

**Environment variables per designer Vercel project:**
- `SANITY_DATASET` — designer's dataset name
- `SANITY_PROJECT_ID` — shared Sanity project
- `SANITY_API_TOKEN` — dataset-scoped write token
- `GEMINI_API_KEY` — shared or per-designer (cost allocation)
- `GEMINI_IMAGE_MODEL` — configurable model ID
- `STUDIO_API_SECRET` — per-designer secret for Studio → API auth
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — Upstash Redis (shared instance, key-prefixed by dataset)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob (shared store, path-prefixed by dataset)
- `RESEND_API_KEY` — shared or per-designer

**Trade-off:** A bug fix in shared code requires redeploying all designer sites. Turborepo + Vercel's monorepo support handles this — `git push` triggers rebuilds only for affected packages/templates. At 2-5 designers this is manageable.

## Template System

### templates/base

The shared foundation that all templates extend. Contains:
- `astro.config.mjs` — Sanity, Vercel adapter, Tailwind, React plugins pre-configured
- Middleware — auth, session, rate limiting
- Portal pages — `/portal/login`, `/portal/dashboard`, `/portal/project/[id]`
- Studio route — `/studio`
- All API routes — `/api/*`
- Shared layouts — portal layout, studio layout

### Template Structure

Each template extends `templates/base` and defines only:
- Public pages — home, portfolio, services, about, contact
- CSS theme — colors, fonts, spacing
- Template-specific components — hero variants, gallery layouts, navigation style
- A `brand.config.ts` file

### brand.config.ts

Each designer instance provides this configuration:

```typescript
export const brand = {
  name: "La Sprezzatura",
  logo: "/logo.svg",
  colors: {
    primary: "#...",
    secondary: "#...",
    accent: "#...",
    neutral: "#...",
  },
  fonts: {
    heading: "...",
    body: "...",
  },
  domain: "lasprezz.com",
  socialLinks: {
    instagram: "...",
    pinterest: "...",
    houzz: "...",
  },
  portalConfidentialityNotice: {
    residential: "These design options are prepared exclusively for your project. Please do not share outside your household.",
    commercial: "These design options are prepared exclusively for your project. Please do not share outside your organization.",
  },
}
```

The portal reads brand config to inject the designer's logo, colors, and custom copy. CSS custom properties are set at the root layout level.

### Template Catalog

- `la-sprezzatura` — reserved, hidden from catalog. Liz's bespoke design.
- 3-5 public templates — each with a distinct aesthetic. Named (e.g., Aria, Forma, Verra), not numbered.
- All templates share identical portal, Studio, and API functionality — only public-facing pages differ.
- Templates assume minimal content — a designer can launch with a few portfolio pieces and a bio.

## Admin Dashboard

Standalone Astro + React app at `admin.linha.com`. Paul's operational hub.

### Auth

Hardcoded email allowlist + magic link auth (reusing the same magic link pattern from `packages/core`). Paul is the only admin user for V1.

### Designers Overview

- List of all designers: name, domain, template, dataset name, status (active / onboarding / suspended)
- Quick links to each designer's site, Studio, and Vercel project
- Onboarding checklist per designer (dataset created, domain configured, Sanity user added, first content published)
- Designer detail view with full configuration and history

### Usage & Costs

- AI rendering usage across all designers — current month counts vs. allocations
- Aggregated Gemini API costs (count × $0.07 per image at 1K)
- Storage usage per designer (Vercel Blob)
- Trend charts — monthly usage over time

### Billing

- Per-designer billing status: subscription tier, monthly fee, AI rendering usage
- Invoice generation (manual for V1 — exportable data, not Stripe integration)
- Payment status tracking
- Setup fee tracking per designer

### Platform Health

- Schema sync status — which designers are on the latest schema version
- Deployment status per designer (last deploy date, build status)
- Vercel project links

## Onboarding Wizard

Web-based guided wizard at `admin.linha.com/onboarding/new`. CLI fallback at `linha create-designer`.

### Step 1 — Designer Info

- Business name (required)
- Designer name (required)
- Email (validated format, checked for uniqueness against existing designers)
- Phone (optional)
- Wizard auto-generates a dataset slug from the business name (e.g., "Jane Doe Interiors" → `jane-doe-interiors`), shows it for confirmation

### Step 2 — Template Selection

- Shows available templates with visual preview descriptions
- Reserved templates marked as unavailable
- Confirms selection: "Jane Doe Interiors will use the Aria template. Correct?"

### Step 3 — Domain

Adapts based on the designer's domain situation:

**"Does this designer already have a domain?"**

- **Yes, they own it →** "Enter the domain" → validates it resolves → "Who manages the DNS?"
  - **Designer manages DNS →** wizard outputs exact records later + generates an email with instructions for the designer
  - **Paul manages DNS →** "Which registrar?" → wizard outputs registrar-specific instructions (Cloudflare, GoDaddy, Namecheap)
  - **Needs migration to Cloudflare →** wizard flags as manual pre-step and pauses: "Migrate domain to Cloudflare first, then re-run from this step"
- **No, they need a domain →** suggests 3-5 domain options based on business name → "Purchase the domain, then re-run from this step"
- **Not ready yet →** continues without domain, site deploys on a temporary Vercel URL. Domain can be configured later from the admin dashboard.

### Step 4 — Billing Setup

- Monthly subscription tier (shows available tiers with prices)
- AI rendering allocation (default: 50/month, adjustable)
- Setup fee collected? (yes/no — record keeping, not payment processing)
- Creates billing record in admin dataset

### Step 5 — Review & Confirm

Summary table of all selections. "Ready to provision? This will:" followed by a list of all automated actions. Requires explicit confirmation.

### Step 6 — Provisioning

Runs each step sequentially with live status:
1. ✓/✗ Create Sanity dataset
2. ✓/✗ Deploy schemas to dataset
3. ✓/✗ Invite designer to Sanity (sends email via Sanity Management API)
4. ✓/✗ Generate STUDIO_API_SECRET
5. ✓/✗ Create Vercel project with environment variables
6. ✓/✗ Configure custom domain on Vercel (if provided)
7. ✓/✗ Trigger initial deployment
8. ✓/✗ Send welcome email to designer (via Resend)
9. ✓/✗ Create designer record in admin dataset

If a step fails: shows error, offers "retry this step" or "skip and continue." Skipped steps become pending tasks in the admin dashboard.

### Step 7 — DNS Instructions (if domain provided)

- Shows exact DNS records to configure, formatted for the registrar selected in Step 3
- "Verify DNS" button — checks if records have propagated
- If Paul manages DNS: "Open Cloudflare dashboard for this domain?" (opens browser)
- If designer manages DNS: "Send DNS instructions to designer?" → sends a clear, non-technical email with exact records and screenshots

### Step 8 — Post-Provisioning Checklist

Persists in the admin dashboard under the designer's record:
- ☐ DNS propagated (auto-checks periodically, or manual verify button)
- ☐ Designer accepted Sanity invite
- ☐ SSL certificate issued (automatic after DNS propagation)
- ☐ Designer added initial content
- ☐ Schedule onboarding walkthrough call

## Migration Path

La Sprezzatura → Linha monorepo migration, executed in phases.

### Phase 1 — Create the monorepo shell

- Create `linha` repo in `~/Dropbox/GitHub/`
- Set up Turborepo workspace configuration
- Create directory structure: `packages/`, `templates/`, `apps/`
- No application code yet — just scaffolding and tooling

### Phase 2 — Extract shared code into packages

Move from `la-sprezzatura/src/` into packages:

| Source (la-sprezzatura) | Destination (linha) |
|------------------------|---------------------|
| `src/sanity/schemas/*` | `packages/core/schemas/` |
| `src/lib/session.ts`, `redis.ts`, `rateLimiter.ts` | `packages/core/auth/` |
| `src/lib/sanity.ts`, `queries.ts` | `packages/core/queries/` |
| `src/lib/email.ts`, `pdfClose.ts` | `packages/core/utils/` |
| `src/actions/*` | `packages/core/api/` |
| `src/pages/api/*` | `packages/core/api/` |
| `src/components/portal/*` | `packages/portal/components/` |
| `src/pages/portal/*` | `packages/portal/layouts/` |

Each package gets its own `package.json` and `tsconfig.json`.

### Phase 3 — Create templates/base

- Shared Astro config, middleware, `/studio` route, portal page routes
- Imports from `packages/core` and `packages/portal`
- Defines the `brand.config.ts` interface

### Phase 4 — La Sprezzatura becomes a template

- Public pages (`src/pages/` — home, portfolio, services, about, contact) → `templates/la-sprezzatura/`
- CSS, design components, and assets move with it
- `brand.config.ts` configured for Liz
- Extends `templates/base`
- La Sprezzatura's existing Vercel project reconnects to the monorepo path
- Verify site works identically before switching

### Phase 5 — First public templates

- Create 3 template shells (home page + placeholder pages each)
- Each extends `templates/base` with a distinct design aesthetic
- Fleshed out incrementally as designers onboard

### Post-Migration

- The `la-sprezzatura` repo is archived (git history preserved)
- The monorepo becomes the single source of truth
- Liz's live site continues working throughout — no downtime during migration

## Technical Notes

### Sanity Configuration

- One Sanity project with multiple datasets
- Sanity project ID is shared across all deployments
- Each dataset gets a scoped API token (write access to only that dataset)
- Schema changes deployed via `packages/cli/sync-schemas` which iterates all active datasets
- Sanity Studio auth is per-project — designers invited to the project are granted access to their specific dataset

### Vercel Configuration

- All designer Vercel projects point to the same `linha` monorepo
- Each project's root directory is set to their template path (e.g., `templates/la-sprezzatura`)
- Turborepo's `turbo.json` defines the dependency graph so Vercel rebuilds correctly
- Vercel's monorepo support detects which projects are affected by a push

### Redis (Upstash)

- Single Upstash Redis instance shared across all designers
- Key prefix namespacing: `{dataset}:session:`, `{dataset}:ratelimit:`, etc.
- Same KV_REST_API_URL/TOKEN for all designer deployments
- Isolation is at the key prefix level, not the database level

### Blob Storage (Vercel Blob)

- Single Vercel Blob store shared across all designers
- Path prefix namespacing: `{dataset}/renderings/`, `{dataset}/documents/`, etc.
- Same BLOB_READ_WRITE_TOKEN for all designer deployments
- Isolation is at the path prefix level

### Email (Resend)

- Shared Resend account for V1
- Each designer's emails come from their own verified domain (e.g., `send.janedoedesign.com`)
- Domain verification is part of the onboarding process (DNS records)
- Email templates are parameterized with brand config (logo, colors, business name)

### Cost Allocation

- Gemini API costs: tracked per-designer via `renderingUsage` documents in each dataset
- Vercel costs: one project per designer, costs visible in Vercel dashboard
- Redis/Blob: shared infrastructure, costs split proportionally if needed (or absorbed as platform overhead at 2-5 designers)

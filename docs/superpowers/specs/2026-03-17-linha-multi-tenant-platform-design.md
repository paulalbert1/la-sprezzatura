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
│   └── rendering/         # AI rendering feature
│       ├── tool/           # Sanity Studio custom tool (wizard, refinement, sessions)
│       ├── api/            # Generate, refine, promote, react, usage routes
│       └── schemas/        # renderingSession, designOption, renderingUsage types
│
├── templates/
│   ├── base/              # Shared Astro config, middleware, /admin, portal routes, API routes
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

**No separate CLI package.** All operations (designer provisioning, schema sync, usage reports) are implemented as admin dashboard features. The dashboard's API routes can be called programmatically if scripting is needed later.

## Multi-Tenancy

### Data Isolation

- One Sanity project, multiple datasets: `liz`, `jane-doe-interiors`, `alex-design`, etc.
- Each dataset contains identical schemas (deployed via admin dashboard's schema sync feature)
- All data access is scoped by dataset — the Sanity client is configured with `SANITY_DATASET` from environment variables
- No cross-dataset queries except from the admin dashboard
- Cross-tenant data leakage is architecturally impossible — each deployment connects to exactly one dataset

### Per-Designer Deployment

Each designer = one Vercel project containing:
- Public-facing site (template pages)
- Client/contractor/building manager portal (`/portal/*`)
- API routes (`/api/*`)
- Sanity Studio (`/admin` — existing path, kept for bookmark continuity)

All routes read `SANITY_DATASET` from the environment. No runtime domain-to-designer resolution needed.

**Environment variables per designer Vercel project:**
- `SANITY_DATASET` — designer's dataset name
- `SANITY_PROJECT_ID` — shared Sanity project
- `SANITY_API_TOKEN` — project-level write token (dataset isolation enforced by `SANITY_DATASET` on the client, not the token)
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
- Studio route — `/admin`
- All API routes — `/api/*`
- Shared layouts — portal layout, studio layout

### Template Composition Mechanism

Astro does not have native template inheritance. The composition works through **Astro integrations** and **package imports**:

1. **`templates/base` is an npm workspace package** (not a standalone Astro app). It exports:
   - An Astro integration (`linhaBaseIntegration`) that uses Astro's `injectRoute` API to register portal pages, API routes, and the `/admin` Studio route
   - Middleware as an importable function
   - Shared layouts as importable Astro components

2. **Each template is a full, deployable Astro app.** Its `astro.config.mjs` imports and registers the base integration:

   ```typescript
   import { linhaBaseIntegration } from '@linha/base';

   export default defineConfig({
     integrations: [
       linhaBaseIntegration(), // injects portal, API, /admin routes
       sanity({ ... }),
       react(),
     ],
   });
   ```

3. **Route precedence:** Astro's file-based routing takes precedence over injected routes. If a template defines `src/pages/index.astro`, it overrides any injected `/` route from the base. This means templates can override any base route if needed, but by default they only define public pages — the injected portal/API routes fill in the rest.

4. **Middleware:** Each template's `src/middleware.ts` imports and delegates to the base middleware:
   ```typescript
   import { linhaMiddleware } from '@linha/base';
   export const onRequest = linhaMiddleware;
   ```

5. **Portal components:** Templates import portal layouts/components from `@linha/portal` — they are regular React/Astro components, not magic. The portal pages injected by the base integration already reference these.

This means each template is a normal Astro project that happens to import shared functionality via workspace packages. No build-time merging, no symlinks, no magic.

### Template Structure

Each template is a deployable Astro app that defines only:
- Public pages — home, portfolio, services, about, contact
- CSS theme — colors, fonts, spacing
- Template-specific components — hero variants, gallery layouts, navigation style
- A `brand.config.ts` file
- An `astro.config.mjs` that registers the base integration

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

Web-based guided wizard at `admin.linha.com/onboarding/new`.

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
5. ✓/✗ Create Vercel project with environment variables (via Vercel REST API; requires `VERCEL_API_TOKEN` configured on admin app)
6. ✓/✗ Configure custom domain on Vercel (if provided)
7. ✓/✗ Create Resend sending domain (`send.designerdomain.com`) via Resend API
8. ✓/✗ Trigger initial deployment
9. ✓/✗ Send welcome email to designer (via Resend)
10. ✓/✗ Create designer record in admin dataset

If a step fails: shows error, offers "retry this step" or "skip and continue." Skipped steps become pending tasks in the admin dashboard.

### Step 7 — DNS Instructions (if domain provided)

- Shows exact DNS records to configure, formatted for the registrar selected in Step 3
- Includes both site DNS records (CNAME/A for Vercel) and email DNS records (SPF/DKIM for Resend sending domain)
- "Verify DNS" button — checks if records have propagated (both site and email)
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

| Source (la-sprezzatura) | Destination (linha) | Notes |
|------------------------|---------------------|-------|
| `src/sanity/schemas/*` | `packages/core/schemas/` | |
| `src/lib/session.ts`, `redis.ts`, `rateLimiter.ts` | `packages/core/auth/` | Refactor `redis.ts` to auto-prefix all keys with `SANITY_DATASET` for tenant isolation |
| `src/lib/sanity.ts`, `queries.ts` | `packages/core/queries/` | |
| `src/lib/email.ts`, `pdfClose.ts` | `packages/core/utils/` | |
| `src/actions/*` (business logic) | `packages/core/api/` | Extract plain TypeScript functions from `defineAction` wrappers |
| `src/actions/*` (Astro wrappers) | `templates/base/src/actions/` | Thin `defineAction` wrappers that call `packages/core/api` functions |
| `src/pages/api/*` | `packages/core/api/` | Route handlers as exportable functions |
| `src/components/portal/*` | `packages/portal/components/` | |
| `src/pages/portal/*` | `packages/portal/layouts/` | Injected via `linhaBaseIntegration` `injectRoute` |
| AI rendering code (when built) | `packages/rendering/` | Studio tool, API handlers, schemas |

Each package gets its own `package.json` and `tsconfig.json`.

### Phase 3 — Create templates/base

- Shared Astro config, middleware, `/admin` route, portal page routes
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

- La Sprezzatura's git history is imported into the monorepo via `git subtree add` at the `templates/la-sprezzatura` path, preserving full commit history for traceability
- The original `la-sprezzatura` repo is then archived as read-only
- The monorepo becomes the single source of truth
- Liz's live site continues working throughout — no downtime during migration

## Technical Notes

### Admin Data Architecture

The admin dashboard has its own Sanity dataset (`linha-admin`) storing:
- Designer records (name, email, domain, template, dataset slug, status, onboarding checklist, billing tier)
- Billing records (subscription status, payment history, setup fee tracking)
- Platform configuration (available templates, subscription tiers, default allocations)

Cross-dataset queries for usage data: the admin app holds read-only API tokens for every designer dataset. It queries each dataset's `renderingUsage` documents directly. Token management is automated during onboarding (Step 6 generates a read-only token and stores it in the admin dataset's designer record).

The admin dashboard's Vercel project has environment variables: `SANITY_DATASET=linha-admin`, `SANITY_PROJECT_ID`, `VERCEL_API_TOKEN` (for provisioning), `RESEND_API_KEY`, plus the list of designer dataset tokens.

### Sanity Configuration

- One Sanity project with multiple datasets
- Sanity project ID is shared across all deployments
- Each dataset gets a scoped API token (write access to only that dataset)
- Schema changes deployed via the admin dashboard (or `cli/sync-schemas` fallback) which iterates all active datasets
- Schema changes must be additive only (new fields, new types). Removing or renaming fields requires a deprecation step: mark old field hidden in Studio, deploy, migrate data, then remove in a subsequent release. This prevents data loss across datasets.
- Partial sync failures (e.g., 3 of 5 datasets updated) are surfaced in the admin dashboard's Platform Health section with per-dataset status and a "retry failed" action
- Sanity Studio auth is per-project — designers invited to the project are granted access to their specific dataset

### Vercel Configuration

- All designer Vercel projects point to the same `linha` monorepo
- Each project's root directory is set to their template path (e.g., `templates/la-sprezzatura`)
- Turborepo's `turbo.json` defines the dependency graph so Vercel rebuilds correctly
- Vercel's monorepo support detects which projects are affected by a push
- **Plan requirement:** Vercel Pro plan ($20/month per team) is needed for 60s serverless function timeout (required by AI rendering's `waitUntil` pattern). All designer projects can run under one Vercel team. Designer projects without AI rendering enabled could run on Hobby, but Pro is recommended for consistency.
- The manual `.env` parsing in la-sprezzatura's `astro.config.mjs` must be replaced with Vercel's build-time environment variable injection (standard in monorepo setups). This is a migration requirement in Phase 2.

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

### AI Rendering Sequencing

The AI rendering feature (see companion spec `2026-03-17-ai-rendering-design.md`) may be built in la-sprezzatura before the monorepo migration. If so, the rendering code is extracted into `packages/rendering` during migration Phase 2. The migration table includes this as a row. If rendering is built after migration, it goes directly into `packages/rendering`.

### Email (Resend)

- Shared Resend account for V1
- Each designer's emails come from their own verified domain (e.g., `send.janedoedesign.com`)
- Domain verification is part of the onboarding process (DNS records)
- Email templates are parameterized with brand config (logo, colors, business name)

### Cost Allocation

- Gemini API costs: tracked per-designer via `renderingUsage` documents in each dataset
- Vercel costs: one project per designer (~$20/month Pro plan), costs visible in Vercel dashboard
- Redis/Blob: shared infrastructure, costs split proportionally if needed (or absorbed as platform overhead at 2-5 designers)

### Known Risks & Accepted Trade-offs

| Risk | Mitigation | Revisit When |
|------|-----------|--------------|
| Redis shared token — key prefix isolation is convention-enforced, not token-enforced | `packages/core/auth` auto-prefixes all keys with `SANITY_DATASET`; code review enforces this | Platform scales beyond white-glove operation; consider per-designer Redis databases |
| Blob shared token — path prefix isolation is convention-enforced, not token-enforced | `packages/core` auto-prefixes all Blob paths with `SANITY_DATASET`; code review enforces this | Platform scales beyond white-glove operation; consider per-designer Blob stores |
| Vercel Pro cost scales linearly ($20/designer/month) | Acceptable at 2-5 designers; included in subscription pricing | 10+ designers; evaluate Vercel Teams or alternative deployment |
| Schema sync is push-based, not guaranteed atomic across datasets | Admin dashboard surfaces partial failures with retry; additive-only schema policy | Need for breaking schema changes; build a migration runner |

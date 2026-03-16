# Phase 5: Data Foundation, Auth, and Infrastructure - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Clients securely access the portal via magic link authentication (replacing raw PURL access), the Sanity schema supports all v2.0 data structures (clients, projects with structured addresses, many-to-many relationships), the rate limiter is upgraded from in-memory to persistent storage, and Resend email infrastructure is production-ready with domain verification. This is the foundation every subsequent phase (6-8) builds on.

</domain>

<decisions>
## Implementation Decisions

### Magic Link Auth Flow
- Login page: branded email entry form at `/portal/login` — luxury aesthetic matching public site, not a SaaS login
- Client enters email, receives magic link email, clicks link, gets cookie-based session — no password or account creation
- Magic link expiry: 15 minutes from generation
- Session duration: 30 days (cookie-based, httpOnly, secure)
- Multi-device: each device gets its own session — no device limit, no session invalidation on new login
- Old PURL links (`/portal/[token]`): redirect to login page with a message ("We've upgraded your portal — enter your email to continue")
- Single-use magic links: link is consumed on first click, cannot be reused
- Rate limit magic link requests per email address to prevent abuse

### Client Dashboard
- After login, client lands on a project dashboard showing all their projects as cards
- Card grid layout: each card shows project name, current pipeline stage badge, and a visual indicator
- Auto-redirect: if client has exactly 1 project, skip dashboard and go straight to project detail view
- Projects shown: active projects first, completed projects below with muted visual treatment
- Greeting: "Welcome back, {firstName}" with subtitle "{N} active project(s)"
- Tap/click a card to drill into the full portal view (existing MilestoneTimeline, StatusBadge components)

### Client Data Model in Sanity
- New `client` document type: name, email (unique, used for magic link lookup), phone, preferred contact method (Liz's internal note — not client-facing), structured address
- Preferred contact method: dropdown with Phone, Email, Text — this is how Liz prefers to reach the client, NOT a client-set preference
- Structured address fields on client: street, city, state, zip — used as client home/billing address
- Structured address fields on project: street, city, state, zip + admin notes field — used as project location (may differ from client address)
- When creating a new project, Liz can copy the client's address as the default project location
- Client-to-project linking: reference array field (`clients`) on project schema pointing to client documents
- Primary contact: toggle per client reference on the project (one client designated as primary)
- A client can have multiple projects; a project can have multiple clients (CLNT-05)
- Existing `clientName` string field on project is replaced by client reference relationship

### Email Infrastructure
- Sender domain: `send.lasprezz.com` (subdomain isolates transactional email from Microsoft 365 on lasprezz.com)
- Sender address: `noreply@send.lasprezz.com`
- Display name: "La Sprezzatura"
- Subject line for magic links: "Your La Sprezzatura Portal Access"
- Branded HTML email template for magic links — warm neutrals, logo, Cormorant Garamond heading, clean layout (reuses contact form auto-response pattern, establishes template for Phase 7 Send Update emails)
- SPF/DKIM on send.lasprezz.com configured to coexist with Microsoft 365 MX on lasprezz.com
- Resend domain verification for send.lasprezz.com (CNAME records)

### Rate Limiter Upgrade
- Upgrade from in-memory Map to persistent storage (serverless-compatible)
- Per-email-address throttling for magic link requests (not just IP-based)
- Must survive Vercel serverless cold starts

### Financial Data Foundation
- All financial values stored as integer cents (PROC-03) — decided at roadmap level, implemented in Sanity schema field validation

### Claude's Discretion
- Auth library choice (custom implementation vs lucia vs oslo) — pick what works best with Astro + Vercel serverless
- Session token generation and storage mechanism
- Persistent rate limiter backing store (Vercel KV, Upstash Redis, or other)
- Exact login page design details (layout, animation, error states)
- Magic link token format and length
- How to handle "email not found" on login (reveal vs don't reveal whether email exists)
- Dashboard card design details (spacing, shadows, hover states)
- Address copy mechanism in Sanity Studio (custom action vs manual)
- Whether to add a logout button or let sessions expire naturally

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing codebase (code repo at ~/Dropbox/GitHub/la-sprezzatura/)
- `src/sanity/schemas/project.ts` — Current project schema with pipelineStage, portalToken, clientName, portalEnabled fields (will be extended)
- `src/sanity/schemas/index.ts` — Schema registry (new client type must be registered here)
- `src/pages/portal/[token].astro` — Current PURL portal page (will be replaced/redirected)
- `src/components/portal/` — PortalLayout.astro, MilestoneTimeline.astro, StatusBadge.astro (reusable in authenticated portal)
- `src/actions/index.ts` — Astro Actions pattern with Resend integration and HTML email template (pattern reference for magic link emails)
- `src/lib/rateLimit.ts` — Current in-memory rate limiter (will be upgraded to persistent)
- `src/lib/generateToken.ts` — Crypto token generation (reusable for magic link tokens)
- `src/lib/portalStages.ts` — Stage metadata and constants
- `astro.config.mjs` — SSR/Vercel config, .env loading pattern

### Planning documents
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-05, CLNT-04, CLNT-05, PROC-03, INFRA-07, INFRA-08 requirement definitions
- `.planning/ROADMAP.md` — Phase 5 success criteria and dependency chain
- `.planning/phases/03-client-operations-portal/03-CONTEXT.md` — Phase 3 portal decisions (PURL design, portal layout, milestone timeline, Sanity UX patterns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PortalLayout.astro`: HTML shell with noindex/nofollow, preloaded fonts, footer — extend for authenticated portal pages
- `MilestoneTimeline.astro`: 6-stage visual timeline with completed/current/future states — reuse in project detail view
- `StatusBadge.astro`: Pipeline stage badge component — reuse on dashboard cards and detail view
- `ContactForm.tsx`: React form component with validation — pattern reference for login form
- `submitContact` action: Astro Action with Zod validation, Resend email, rate limiting — pattern reference for magic link action
- `generateToken.ts`: Crypto token generation — reuse for magic link tokens
- HTML email template in actions/index.ts: Branded email with inline CSS, tables, brand colors — extend for magic link email

### Established Patterns
- Astro 6 hybrid SSR (`output: "server"`) with Vercel adapter — portal pages are SSR, public pages can be static
- Sanity queries via `@sanity/client` with GROQ — queries defined in `src/sanity/queries.ts`
- Astro Actions: `defineAction({ accept, input, handler })` with Zod schemas and ActionError
- IP extraction: `x-forwarded-for` header (first part) or `x-real-ip`
- Environment variables: public vars prefixed `PUBLIC_`, secrets in `.env`, manual loader in astro.config.mjs
- React components (.tsx) for interactive UI, Astro components (.astro) for static layouts
- Design tokens: Cormorant Garamond (`--font-heading`), DM Sans (`--font-body`), terracotta #C4836A, cream #FAF8F5

### Integration Points
- `src/sanity/schemas/`: new `client.ts` schema file, extend `project.ts` with client references and structured address
- `src/pages/portal/`: new `login.astro`, `dashboard.astro`, restructured routes under auth middleware
- `src/actions/`: new magic link action (send link, verify link)
- `src/lib/`: upgrade rateLimit.ts, add session management utilities
- `src/middleware.ts` (new): Astro middleware for session validation on protected `/portal/*` routes
- `sanity.config.ts`: add client document type to structure tool, update desk structure

</code_context>

<specifics>
## Specific Ideas

- Old PURL links should redirect gracefully with a message — clients may have bookmarked `/portal/[token]` links
- Address fields needed on BOTH client (home/billing) and project (location) — projects for same client may be at different locations
- Liz needs ability to easily copy a client's address to a new project's location field
- Admin notes field on project location (e.g., "Gate code: 1234", "Enter through back door")
- Dashboard auto-redirect for single-project clients — avoids unnecessary click for common case
- Branded HTML magic link email establishes the template pattern for Phase 7's "Send Update" emails
- "Preferred contact method" is Liz's internal operational note, NOT a client-facing preference picker

</specifics>

<deferred>
## Deferred Ideas

- Project location admin notes could evolve into a richer "site details" section (gate codes, parking, key lockbox) — future enhancement
- Address autocomplete / geocoding for structured address fields — nice-to-have, not Phase 5
- Client profile photo or avatar — not needed for operations portal

</deferred>

---

*Phase: 05-data-foundation-auth-and-infrastructure*
*Context gathered: 2026-03-16*

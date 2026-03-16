# Phase 3: Client Operations Portal - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a PURL-based client project portal to the staging site. Clients visit a unique URL (no login) and see their project status, current pipeline stage, and a visual milestone timeline. Liz manages everything through the same Sanity Studio she already uses. No email notifications, file sharing, selections, or approval workflows — those are v2 (CLNT-04 through CLNT-09).

</domain>

<decisions>
## Implementation Decisions

### PURL Token Design
- Each project gets a cryptographically random token stored in Sanity (e.g., `xK9mP2qR`) — 8 alphanumeric characters, ~218 trillion combinations
- Portal URL format: `/portal/[token]` — clean, reveals nothing about the client or project
- Token generated automatically when Liz creates a new project in Sanity (default empty = portal not yet active for that project)
- Token is NOT the project slug — slugs are public portfolio URLs, tokens are private portal access
- Brute-force protection: rate limiting on portal route (reuse existing rate limiter pattern from contact form API route)

### Portal Page Layout
- Match the luxury aesthetic of the public site — same warm neutrals, Cormorant Garamond headings, DM Sans body, generous whitespace
- Not a "dashboard" — it should feel like a branded client experience, not a SaaS app
- Information hierarchy top-to-bottom:
  1. Project name as large heading with La Sprezzatura branding
  2. Status badge (current stage name) — prominent, colored
  3. Visual milestone timeline showing all 6 stages with current stage highlighted
  4. Brief stage description — what's happening now and what comes next
- No sidebar, no navigation beyond the portal page itself — single-page experience
- Minimal footer with La Sprezzatura contact info
- Mobile-first — most clients will check on their phone

### Milestone Timeline Visualization
- Horizontal stepper on desktop, vertical on mobile (responsive flip)
- All 6 stages shown: Discovery, Concept, Design Development, Procurement, Installation, Closeout
- Current stage: filled/highlighted with accent color (warm terracotta from the design system)
- Completed stages: subtle checkmark or filled dot
- Future stages: muted/outlined
- No dates or duration estimates on the timeline — just stage labels and status (v2 can add richer milestone data)
- Current stage gets a brief description below the timeline: 1-2 sentences about what this stage involves

### Status Badge
- Pill-shaped badge next to or below the project name
- Shows the current stage name (e.g., "Design Development")
- Color-coded: warm accent for active stages, muted green for Closeout/complete
- Single badge — no separate "Active/Paused/Complete" status. The pipeline stage IS the status.

### Sanity Studio UX for Liz
- Unhide the existing `pipelineStage` field on the project schema — already has all 6 stages defined
- Add new fields to project schema:
  - `portalToken` (string, read-only in Studio) — auto-generated 8-char alphanumeric token
  - `clientName` (string) — client's name for the portal greeting
  - `portalEnabled` (boolean, default false) — toggle to activate/deactivate the portal link
- Liz's workflow: create project in Sanity, toggle "Portal Enabled" on, share the generated URL with client
- Portal URL displayed in Sanity Studio as a read-only field so Liz can copy-paste it to send to clients
- Pipeline stage update: Liz picks new stage from dropdown, saves, client sees it immediately (no deploy needed — SSR page)

### Rendering Approach
- Server-side rendered (SSR) — portal pages must NOT be statically generated (content changes when Liz updates Sanity)
- Astro page at `src/pages/portal/[token].astro` with `export const prerender = false`
- Query Sanity on each request: find project where `portalToken == token` AND `portalEnabled == true`
- If no match: render a generic "Project not found" page (no information leakage about whether the token was close to valid)
- No caching on portal pages — always fresh from Sanity

### Claude's Discretion
- Exact token generation implementation (crypto.randomBytes or nanoid — whatever works in Vercel serverless)
- Stepper/timeline component implementation details
- Exact responsive breakpoints for timeline flip
- Stage description copy (can be generic per stage or Liz-editable — Claude's call on complexity)
- Whether portalToken auto-generates on document creation or via a Sanity action button
- 404/invalid-token page design details
- Whether to add a "Powered by La Sprezzatura" subtle footer branding

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `project.ts` Sanity schema: already has `pipelineStage` field with all 6 stages, currently `hidden: true` — just unhide and extend
- `BaseLayout.astro`: base HTML layout with meta tags — reuse for portal page layout
- `global.css` + Tailwind v4: design tokens (colors, fonts, spacing) already defined — portal inherits the system
- Contact form API route: rate limiting pattern exists — reuse for portal route protection
- `SanityImage.astro`: image component — reuse if portal shows project imagery
- Design system components in `src/components/ui/`: buttons, typography patterns

### Established Patterns
- Astro 6 hybrid output mode: supports both static and SSR pages — portal pages use SSR (`prerender = false`)
- Sanity queries via `sanity:client` virtual module or direct client import
- Phase 2 decision: `astro.config.mjs` manually parses `.env` for Sanity config
- View transitions with `astro:page-load` / `astro:before-swap` lifecycle events
- Cormorant Garamond (`--font-heading`) + DM Sans (`--font-body`) font variables

### Integration Points
- `src/sanity/schemas/project.ts`: extend with portalToken, clientName, portalEnabled fields
- `src/sanity/schemas/index.ts`: no new schema types needed — extending existing project type
- `src/pages/portal/[token].astro`: new SSR page (only new page in this phase)
- `astro.config.mjs`: sitemap filter should exclude `/portal/*` routes

</code_context>

<specifics>
## Specific Ideas

- Portal should feel like receiving a beautifully designed project update from your interior designer — not logging into a contractor's app
- The 6 pipeline stages mirror Liz's actual workflow (Discovery through Closeout) — already defined in the schema
- PURL approach chosen specifically for zero-friction client experience — Liz texts or emails the link, client clicks, done
- STATE.md flagged "Astro Server Islands + PURL pattern has no documented examples" — research should validate SSR approach
- Portal is staging-only until Phase 4 DNS cutover — same as all other pages

</specifics>

<deferred>
## Deferred Ideas

- Milestone email notifications (CLNT-04) — branded transactional emails when stage changes. v2.
- File sharing in portal (CLNT-06) — mood boards, floor plans, contracts. v2.
- Selections display (CLNT-07) and approval workflow (CLNT-08) — materials/furniture approval. v2.
- Post-project review automation (CLNT-09) — review requests on completion. v2.
- Magic link authentication (GROW-03) — upgrade from PURL to Clerk auth for repeat access. v2.
- Rich milestone data (dates, descriptions, deliverables per stage) — keep timeline simple for v1.
- QuickBooks integration for invoice status in portal (CLNT-05) — v2.

</deferred>

---

*Phase: 03-client-operations-portal*
*Context gathered: 2026-03-14*

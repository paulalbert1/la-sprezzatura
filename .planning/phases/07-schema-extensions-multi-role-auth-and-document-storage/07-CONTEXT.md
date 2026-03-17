# Phase 7: Schema Extensions, Multi-Role Auth, and Document Storage - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The Sanity schema supports contractors, building managers, residential/commercial classification, and engagement type feature gating; the auth system handles multi-role sessions with namespace isolation; and private documents are stored in Vercel Blob with signed URLs. All architectural decisions are resolved before any portal UI is built in Phase 8. Phase 7 delivers schemas, auth infrastructure, and a placeholder contractor page — not the full contractor or building manager portal UIs.

</domain>

<decisions>
## Implementation Decisions

### Contractor Data Model
- New `contractor` document type (separate from `client`), registered in schema index and Studio sidebar
- Contractor fields: name, email (unique, used for magic link lookup), phone, company, trades (array of predefined options with custom/Other: Electrician, Plumber, Painter, General Contractor, Custom Millwork, Flooring, HVAC)
- No status field on contractor — all contractors always visible in Studio
- Project gets a `contractors` inline array of assignment objects (like `clients[]` pattern)
- Each assignment object: contractor reference, estimateFile (Vercel Blob), estimateAmount (integer cents — both fields available, Liz fills whichever applies), scope of work (rich text / block content), date range (startDate, endDate), internal notes (plain text, contractor does NOT see)
- Contractor-facing view is called "Work Order" — this naming is contractor-facing only; Studio still shows "Contractors" group/tab
- Contractors group/tab hidden in Studio for non-Full Interior Design projects
- Floor plans: project-level array (not per-assignment) — all contractors on a project see the same floor plans
- Bidirectional navigation: from project see assigned contractors, from contractor document see assigned projects (computed reverse reference view in Studio)

### Multi-Role Session Architecture
- Session model supports all 3 roles from day one: client, contractor, building_manager
- If an email exists in both client and contractor tables, login flow presents role selection
- Contractor sees a dashboard of all assigned projects after login (like client dashboard), not project-specific links
- Same 30-day session TTL as clients
- Same rate limits as clients
- Same luxury La Sprezzatura aesthetic on contractor login page
- "Send Work Order Access" document action on contractor document in Sanity Studio — per-contractor action (not bulk)
- Action calls API route (same pattern as notify-artifact: document action → /api/send-workorder-access → Resend)
- Magic link email uses same branded template as clients, includes project name(s) the contractor is assigned to
- Subject line variant for contractors (e.g., "Your La Sprezzatura Work Order Access")
- Phase 7 includes a placeholder authenticated page at the contractor route showing "Welcome, [Name]. Your work orders will appear here." — proves end-to-end auth flow including role-based routing

### Studio Field Gating (ENGMT-02)
- Engagement type controls visibility of entire groups/tabs, not individual fields
- Full Interior Design: ALL tabs visible (Content, Portal, Milestones, Procurement, Artifacts, Contractors, + commercial fields if commercial)
- Styling & Refreshing: Content, Portal, Milestones, Artifacts only (Procurement and Contractors tabs hidden)
- Carpet Curating: same as Styling & Refreshing
- Data is preserved when engagement type changes — fields are just hidden, no confirmation dialog, no data deletion
- Residential/Commercial toggle on project — building manager fields and COI/legal docs section hidden unless commercial

### Building Manager Data
- Building manager contact info (name, email, phone) as inline object on the project document — NOT a separate document type
- Hidden unless project is classified as commercial
- Building manager portal auth is Phase 8 (BLDG-02), but the data model and session role support are Phase 7

### COI (Certificate of Insurance) Schema
- Inline array on commercial projects: issuer/company name, file (Vercel Blob), expiration date, coverage type (General Liability, Workers Comp, Professional Liability, Other), policy number
- Hidden unless project is commercial
- Building manager sees these in Phase 8; Liz can start uploading in Phase 7 via Studio

### Legal Documents Schema
- Separate inline array on commercial projects: document name, file (Vercel Blob), optional description
- Hidden unless project is commercial
- For building requirements, access rules, etc. Building manager sees in Phase 8

### Floor Plans Schema
- Project-level inline array: plan name, file (Vercel Blob), optional description
- Visible for Full Interior Design projects (hidden for Styling & Refreshing / Carpet Curating)
- Contractors and building managers see these in Phase 8

### Claude's Discretion
- Session architecture (role field in Redis value vs separate cookies per role)
- Login URL strategy (separate /workorder/login vs single page with auto-detect)
- Which documents go to Vercel Blob vs stay on Sanity CDN (DOCS-01 scope)
- Blob-Sanity integration approach (custom Studio input component vs API-based upload)
- Signed URL expiry TTL (balance security vs usability)
- Residential/Commercial toggle UI (boolean checkbox vs dropdown)
- Tab placement for commercial fields (Portal tab vs separate Building tab)
- Contractor trade dropdown predefined values (base list provided, Claude refines)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing auth infrastructure
- `src/lib/session.ts` — Current session create/get/clear with Redis, stores `session:{token}` → `clientId`. Must be extended for multi-role support
- `src/middleware.ts` — Route protection for `/portal/*`, injects `context.locals.clientId`. Must be extended for role-based routing
- `src/lib/redis.ts` — Upstash Redis client (shared across sessions, rate limiting)
- `src/lib/rateLimit.ts` — Per-email rate limiting pattern (reuse for contractor magic links)
- `src/lib/generateToken.ts` — Crypto token generation (reuse for contractor session tokens)

### Sanity schemas
- `src/sanity/schemas/project.ts` — Project schema with engagementType, clients[], groups, milestones/procurement/artifacts inline arrays. Phase 7 extends with contractors[], buildingManager, COIs, legalDocs, floorPlans, and conditional visibility
- `src/sanity/schemas/client.ts` — Client document type pattern (reference for contractor document type)
- `src/sanity/schemas/index.ts` — Schema registry (add contractor type)

### Sanity Studio actions
- `sanity.config.ts` — Document actions registration pattern (NotifyClientAction, CompleteProjectAction, ReopenProjectAction). Add SendWorkOrderAccessAction on contractor type
- `src/sanity/actions/notifyClient.ts` — Pattern reference: Studio document action calling API route for email sending

### API and email
- `src/actions/index.ts` — Astro Actions with Resend email templates (branded HTML email pattern)
- `src/pages/api/close-document.ts` — API route pattern (reference for /api/send-workorder-access)

### Portal pages
- `src/pages/portal/login.astro` — Client login page (pattern reference for contractor login)
- `src/pages/portal/verify.astro` — Magic link verification (extend or duplicate for contractor flow)
- `src/pages/portal/dashboard.astro` — Client dashboard (pattern reference for contractor dashboard)

### GROQ queries
- `src/sanity/queries.ts` — Existing queries including CLIENT_BY_EMAIL_QUERY, PROJECTS_BY_CLIENT_QUERY. Add contractor equivalents

### Design system
- `src/styles/global.css` — Color tokens, typography, animations. Contractor pages use same luxury aesthetic

### Planning
- `.planning/REQUIREMENTS.md` — Phase 7 requirements: ENGMT-02, PRJT-01, PRJT-02, CONTR-01, CONTR-02, CONTR-05, CONTR-06, CONTR-07, BLDG-01, DOCS-01
- `.planning/ROADMAP.md` — Phase 7 success criteria, dependency on Phase 6
- `.planning/phases/05-data-foundation-auth-and-infrastructure/05-CONTEXT.md` — Phase 5 auth decisions (magic link flow, session design, email infrastructure)
- `.planning/phases/06-portal-features/06-CONTEXT.md` — Phase 6 decisions (portal-side engagement type gating, artifact workflow, document action patterns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `session.ts`: createSession/getSession/clearSession — extend to store role alongside entity ID
- `generateToken.ts`: generatePortalToken(32) — reuse for contractor magic link tokens
- `NotifyClientAction` + `/api/notify-artifact`: Document action → API route → Resend email pattern — clone for SendWorkOrderAccessAction
- `LoginForm.tsx`: React form with validation and error handling — pattern reference for contractor login
- `PortalLayout.astro`: Layout wrapper with noindex, brand fonts — reuse for contractor pages
- `StatusBadge.astro`, `Button.astro`: Reusable UI components
- Branded HTML email template (inline CSS, tables, La Sprezzatura brand colors)

### Established Patterns
- Sanity `hidden` callback for conditional field visibility: `hidden: ({ parent }) => parent?.artifactType !== "custom"` — extend for engagement type and commercial toggle gating
- Sanity field groups: `groups: [{ name: "content", ... }, { name: "portal", ... }]` — add Contractors group with conditional visibility
- Inline arrays on project for related data (milestones, procurement, artifacts) — same pattern for COIs, legal docs, floor plans, contractors
- Document actions appended to `prev` to preserve built-in Sanity actions
- Astro middleware: defineMiddleware with route-based checks and context.locals injection
- GROQ parameterized queries with exported constants + async wrapper functions
- Financial values as integer cents with `.integer().min(0)` validation

### Integration Points
- `src/sanity/schemas/project.ts`: add contractors[], buildingManager{}, cois[], legalDocs[], floorPlans[], isCommercial, conditional hidden callbacks
- `src/sanity/schemas/contractor.ts`: new document type
- `src/sanity/schemas/index.ts`: register contractor
- `sanity.config.ts`: add contractor to structure tool, add SendWorkOrderAccessAction on contractor type
- `src/middleware.ts`: extend for role-based routing (client vs contractor vs building_manager paths)
- `src/lib/session.ts`: extend Redis value to include role
- `src/pages/workorder/` or similar: contractor login, verify, dashboard, placeholder page
- `src/pages/api/send-workorder-access.ts`: API route for contractor magic link email
- `src/sanity/queries.ts`: add contractor-by-email, projects-by-contractor queries

</code_context>

<specifics>
## Specific Ideas

- Contractor-facing portal is called "Work Order" — this is the term contractors see, not "Contractor Portal"
- "Send Work Order Access" action on the contractor document (per-contractor, not bulk from project)
- Magic link email to contractors includes project name(s) they're assigned to — "You have work orders for [Project Name]"
- Bidirectional navigation in Studio: contractor document shows computed list of assigned projects (reverse reference), project shows assigned contractors
- Trade field is multi-select array — a contractor can have multiple trades (e.g., GC + Custom Millwork)
- Scope of work is rich text (block content) for formatting — bullets, headings, etc.
- Internal notes field on each assignment is for Liz only (e.g., "needs building access badge") — never visible to contractor
- COI entries include coverage type (GL, Workers Comp, Professional) and policy number — more detail than just name/file/date
- All engagement type gating is "hide, don't delete" — switching types preserves data, just toggles visibility

</specifics>

<deferred>
## Deferred Ideas

- Contractor portal full UI (scope, floor plans, estimates, deadline, notes display) — Phase 8
- Building manager portal full UI and magic link auth — Phase 8
- Client-facing contractor schedule visibility (CVIS-01) — Phase 8
- Bulk "Send Work Orders" action from project document (send to all assigned contractors at once) — future enhancement
- Contractor status/active tracking — revisit if Liz accumulates many inactive contractors
- Address autocomplete/geocoding — carried from Phase 5 deferral

</deferred>

---

*Phase: 07-schema-extensions-multi-role-auth-and-document-storage*
*Context gathered: 2026-03-16*

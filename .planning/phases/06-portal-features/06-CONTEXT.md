# Phase 6: Portal Features - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The authenticated portal becomes Liz's primary client communication tool. Clients see custom per-project milestones with dates, a procurement table with statuses and savings (never client cost), uploadable artifacts with version history and approval workflow, and post-project warranty access. Everything is managed by Liz through Sanity Studio. Portal-side engagement type gating controls which sections are visible per project type.

</domain>

<decisions>
## Implementation Decisions

### Project Detail Page Layout
- Single scroll page at `/portal/project/[id]` — all sections stacked vertically with clear section headers
- Compact header: project name + StatusBadge (pipeline stage) + engagement type label
- Section order: Milestones → Procurement → Artifacts (post-project section appears only when relevant)
- Confidentiality notice: subtle persistent banner below header — "This portal is private to you. Please don't share your access link."
- Empty sections show header + friendly message ("No milestones added yet. Liz will update this as your project progresses.")
- Navigation: back link to dashboard + sign out — Claude's discretion on showing back link for single-project clients vs multi-project
- All data stored as inline arrays on the project document in Sanity (not separate document types)
- Sanity Studio organized with field groups/tabs: Content | Portal | Milestones | Procurement | Artifacts (extends existing Content + Portal pattern)

### Engagement Type Gating (Portal-side)
- Full Interior Design: all sections visible (milestones, procurement, artifacts, post-project)
- Styling & Refreshing: milestones + artifacts only (no procurement table, no close document)
- Carpet Curating: milestones + artifacts only (same as Styling & Refreshing)
- Full Sanity Studio field gating (ENGMT-02) deferred to Phase 7 — Phase 6 only controls portal display

### Milestone Display
- Existing 6-stage pipeline (MilestoneTimeline component) shown as compact status bar at top of milestones section
- Custom milestones listed below as detailed timeline — two levels: macro (pipeline) and micro (milestones)
- Milestones are free-form: name, date, completion status, optional description — NOT linked to pipeline stages
- Always sorted by date (Liz can enter in any order in Sanity)
- Date display: absolute date ("Mar 20") + relative indicator for upcoming ("in 4 days")
- Overdue indicator: subtle visual treatment (stone/amber, not red) for past-due incomplete milestones
- Progress summary at section header: "Milestones — 4 of 7 complete" with slim progress bar
- Subtle completion animation when milestone transitions to done
- Client notes per milestone: "Add a note" option, timestamped, visible to Liz in Sanity
- All client notes visible to all clients on shared projects (attributed to author)
- Notes stored via Sanity mutation API (server-side, using Sanity write token)

### Procurement Table
- Table showing: item name, status badge, install date, MSRP/retail price, per-item savings, tracking number
- **Client cost is NEVER displayed on the portal** — only MSRP and savings (retail minus client cost)
- Footer row with total savings: "You saved $X vs. retail"
- Fixed status set from PROC-01: Ordered, Warehouse, In Transit, Pending, Delivered, Installed
- All financial values stored as integer cents (PROC-03, carried from Phase 5)
- Tracking number field: Liz enters in Sanity, auto-detect carrier (UPS, FedEx, USPS by format) and render as clickable link to carrier tracking page
- Sorting/filtering: Claude's discretion based on expected item volume

### Artifact Workflow
- Artifact types: fixed set (proposal, floor plan, design board, contract, warranty, close document) PLUS ability for Liz to add custom types via free-text field
- Known types get special behavior (e.g., "Signed" badge for contracts); custom types get generic handling
- Artifact display: Claude's discretion on card grid vs list/table
- Version history: current version prominent with full detail; "Previous versions" collapsible section below with muted display
- Approval flow: "Approve" or "Request Changes" buttons with confirmation dialog
  - Approve: confirmation checkbox — "I confirm this approval on behalf of all parties associated with this project." (fixed wording, AUTH-04)
  - Request Changes: required feedback text field (client must explain what to change)
  - Approvals are final from client side — cannot be revoked by client
  - Liz CAN upload a new version (resets approval cycle) or revoke an approval from Sanity Studio
- Decision log: Claude's discretion on inline timeline vs collapsible history
- All decisions timestamped and attributed to client identity
- Contract artifacts: special "signed version" field — Liz uploads signed PDF, client sees "Signed" badge, signed PDF becomes primary download
- File storage: Sanity CDN for Phase 6 (Vercel Blob with signed URLs deferred to Phase 7)
- Downloads: download button on each artifact version (PDFs download, images open in lightbox with download)
- Client notes on artifacts at review points (ARTF-09), stored via Sanity mutation API

### Artifact Notifications
- No automatic email on upload — Liz has a "Notify Client" button per artifact in Sanity Studio
- Sends branded email: "Liz has uploaded a new [type] for your review. View it in your portal."
- Each notification logged with timestamp on the artifact (visible to Liz)
- Full Send Update feature (portal snapshot email) deferred to Phase 9

### Post-Project & Warranty
- Completed projects: same layout but with "Project Complete" banner, muted styling, action buttons disabled, read-only
- Completed projects visible for 30 days after completion, then hidden from portal
- Liz can reopen any completed project from Sanity Studio (for warranty or other reasons), which makes it visible again
- Close document: auto-generated branded PDF from project data (milestones, procurement totals with savings vs MSRP, approved artifacts), includes La Sprezzatura branding and optional personal note from Liz
- Project completion: confirmation dialog in Sanity Studio with checklist ("This will generate a close document, start 30-day visibility countdown, disable client actions")
- Warranty/reopen: flexible — Liz reopens for any reason, client can submit freeform text description + optional photo upload for claims
- Reopen flow details: Claude's discretion on exact UX

### Claude's Discretion
- Back link behavior for single-project vs multi-project clients
- Artifact display format (card grid vs list)
- Decision log display (inline timeline vs collapsible)
- Procurement table sorting/filtering approach
- Milestone individual display style (vertical timeline vs cards)
- Loading states and error handling
- Exact spacing, shadows, hover states
- Reopen/warranty exact UX flow
- PDF generation approach for close document

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing portal code
- `src/components/portal/PortalLayout.astro` — Layout wrapper for all authenticated portal pages (noindex, brand fonts, footer)
- `src/components/portal/MilestoneTimeline.astro` — 6-stage pipeline visual timeline (reuse as compact status bar)
- `src/components/portal/StatusBadge.astro` — Pipeline stage badge component (reuse on project detail header)
- `src/components/portal/LoginForm.tsx` — React form pattern (model for artifact approval/notes forms)
- `src/components/ui/Button.astro` — Reusable button with primary/secondary/outline variants
- `src/components/ui/FilterPills.astro` — Toggle filter UI (potential reuse for procurement status filters)
- `src/components/SanityImage.astro` — Responsive image component with LQIP (reuse for artifact images)

### Sanity schemas
- `src/sanity/schemas/project.ts` — Project schema with portal group, engagement type, clients array, pipeline stage. Phase 6 adds milestones/procurement/artifacts inline arrays and new field groups
- `src/sanity/schemas/client.ts` — Client schema with name, email, address
- `src/sanity/schemas/index.ts` — Schema registry (update with new types if any)

### Queries and data
- `src/sanity/queries.ts` — GROQ queries including CLIENT_BY_EMAIL_QUERY, PROJECTS_BY_CLIENT_QUERY, CLIENT_BY_ID_QUERY. Phase 6 adds project detail query with milestones/procurement/artifacts
- `src/lib/portalStages.ts` — Stage metadata constants (6 stages with descriptions)

### Auth and infrastructure
- `src/middleware.ts` — Session validation middleware protecting /portal/* routes (no changes needed)
- `src/lib/session.ts` — Session create/get/clear with Redis (no changes needed)
- `src/lib/redis.ts` — Upstash Redis client (no changes needed)
- `src/lib/rateLimit.ts` — Rate limiting patterns (extend for artifact actions if needed)
- `src/actions/index.ts` — Astro Actions pattern with Resend email templates (model for notify/approval actions)

### Portal pages
- `src/pages/portal/dashboard.astro` — Dashboard page with project cards, greeting, sign out
- `src/pages/portal/login.astro` — Login page (no changes needed)
- `src/pages/portal/verify.astro` — Magic link verification (no changes needed)

### Design system
- `src/styles/global.css` — Color tokens (cream #FAF8F5, terracotta #C4836A, charcoal #2C2926, stone #8A8478), typography (Cormorant Garamond headings, DM Sans body), fade-in-up animation

### Planning
- `.planning/REQUIREMENTS.md` — Phase 6 requirements: CLNT-06/07, MILE-01/02/03, PROC-01/02, ARTF-01/02/03/04/08/09, PORT-05/06/07, POST-01/02/03/04
- `.planning/ROADMAP.md` — Phase 6 success criteria and dependency on Phase 5
- `.planning/phases/05-data-foundation-auth-and-infrastructure/05-CONTEXT.md` — Phase 5 decisions (auth flow, client data model, email infrastructure, financial data patterns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PortalLayout.astro`: HTML shell for all portal pages — extend for project detail page
- `MilestoneTimeline.astro`: 6-stage visual timeline — reuse as compact pipeline status bar at top of milestones section
- `StatusBadge.astro`: Pipeline stage badge — reuse on project detail header
- `Button.astro`: Primary/secondary/outline buttons — reuse for approve, request changes, submit notes, download
- `FilterPills.astro`: Toggle filter UI — potential reuse for procurement status filtering
- `SanityImage.astro`: Responsive image with LQIP — reuse for artifact image previews
- `LoginForm.tsx`: React form with state management, validation, error handling — pattern reference for approval form and notes form
- `generateToken.ts`: Crypto token generation — may be useful for artifact/claim identifiers
- Branded HTML email template in actions/index.ts — extend for "Notify Client" artifact emails

### Established Patterns
- Astro 6 hybrid SSR with Vercel adapter — portal pages are SSR
- Sanity GROQ queries with parameterized variables (never string interpolation)
- Astro Actions: defineAction with Zod schemas, ActionError for validation
- React (.tsx) for interactive components (client:load), Astro (.astro) for static layouts
- Design tokens: Cormorant Garamond headings, DM Sans body, cream/terracotta/charcoal/stone palette
- Field groups in Sanity project schema (Content | Portal) — extend with Milestones | Procurement | Artifacts
- Financial values as integer cents with .integer().min(0) validation
- Session via context.locals.clientId (injected by middleware)

### Integration Points
- `src/sanity/schemas/project.ts`: add milestones, procurement, artifacts inline arrays + new field groups
- `src/sanity/queries.ts`: add PROJECT_DETAIL_QUERY with full nested data
- `src/pages/portal/project/[projectId].astro`: new project detail page (main Phase 6 page)
- `src/components/portal/`: new components for milestones, procurement table, artifacts, approval form, notes
- `src/actions/index.ts`: new actions for artifact approval, notes submission, notify client
- `sanity.config.ts`: add document actions for "Notify Client" button and project completion confirmation

</code_context>

<specifics>
## Specific Ideas

- Tracking numbers should auto-detect carrier (UPS, FedEx, USPS) and render as clickable links to carrier tracking
- Client cost must NEVER be displayed on the portal — only MSRP and savings ("You saved $X vs. retail")
- Branded close document PDF with La Sprezzatura logo, brand colors, and optional personal note from Liz
- "Notify Client" button in Sanity Studio per artifact — manual trigger, not automatic on upload
- Completion confirmation in Sanity Studio: checklist dialog before marking project complete
- Completed projects auto-hide after 30 days — Liz can reopen to make visible again
- All client notes visible to all clients on shared projects (transparency for couples/families)
- Pipeline-as-macro, milestones-as-micro: two-level timeline approach
- Overdue milestones get subtle amber treatment, not alarming red
- Auto-detection of tracking numbers for carrier-specific tracking links (UPS 1Z*, FedEx 12-22 digits, USPS 20+ digits)

</specifics>

<deferred>
## Deferred Ideas

- Live tracking API integration (UPS, FedEx, etc. status auto-lookup) — new capability, own phase
- Full ENGMT-02 Sanity Studio field gating by engagement type — Phase 7
- Vercel Blob with signed URLs for private document storage — Phase 7 (DOCS-01)
- Full Send Update portal snapshot email from Sanity Studio — Phase 9 (SEND-01/02/03)
- Address autocomplete / geocoding — deferred from Phase 5
- Client profile photo or avatar — not needed for operations portal

</deferred>

---

*Phase: 06-portal-features*
*Context gathered: 2026-03-16*

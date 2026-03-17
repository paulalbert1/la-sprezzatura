# Phase 8: Contractor Portal, Building Manager Portal, and Client Contractor Visibility - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Contractors can view their assigned project scope, floor plans, estimates, appointments, and notes through a branded "Work Order" portal. Building managers can access COI documents, legal docs, and client contact info for commercial projects via their own portal. Clients can see which contractors are assigned to their Full Interior Design project with on-site appointment dates. All three portal UIs are built on the auth and schema infrastructure from Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Contractor Work Order Page
- Single scroll page at `/workorder/project/[projectId]` — all info stacked vertically (matches client portal pattern)
- Section order: Header (project name, address, date range) → Appointments → Scope of Work → Floor Plans → Estimate → Notes from Liz → Contractor Notes → Contact Liz → Sign Out
- Dashboard at `/workorder/dashboard` already exists with project cards — auto-redirect to project detail for single-project contractors (matching client portal behavior)
- Pipeline stage NOT shown to contractor — keep work order view focused on their assignment
- Contractor sees own assignment only — no visibility into other contractors on the same project

### Appointments (Schema Addition)
- Add `appointments` array to each contractor assignment inline object on project
- Each appointment entry: `dateTime` (datetime), `label` (string, e.g., "Measurement", "Install Day 1", "Touch-up"), `notes` (text, e.g., "Bring 2\" molding samples")
- Appointment notes are visible to the contractor (per-visit instructions from Liz)
- Clients see appointment date + time + label only — NOT the notes
- Past appointments shown with muted visual treatment (both contractor and client views)
- This replaces simple startDate/endDate as the primary scheduling mechanism — startDate/endDate remain as the general engagement window

### Estimate Display
- Show both estimate amount (formatted as dollars) AND download button for estimate PDF (Vercel Blob signed URL)
- If only amount is entered, show amount only; if only file is uploaded, show download only; if both, show both
- Estimate amount formatted from integer cents to display (e.g., 150000 → $1,500.00)

### Floor Plans
- Inline preview + download for each floor plan
- Image files (PNG, JPG) show thumbnail preview with download button
- PDF files show as named card with download button only
- All downloads via Vercel Blob signed URLs

### Scope of Work + Notes from Liz
- Scope of work: existing rich text (block content) field — formal job brief
- Add new `contractorNotes` plain-text field on the assignment — informal/changing instructions from Liz (e.g., "gate code changed to 5678")
- Both fields visible to contractor on the work order page

### Contractor Note Submission
- Simple one-way note submission form on the work order page — contractor can leave a note for Liz
- Stored as an inline array on the contractor assignment (similar to client milestone notes pattern): text, contractorName, timestamp
- NOT chat/messaging — one-way, no replies, no threading
- Liz sees notes in Sanity Studio on the project's contractor assignment
- Out of Scope "Contractor messaging/chat" refers to interactive chat — this is a simple note log

### Empty States
- Friendly per-section messages when content is missing: "Scope of work will be shared soon.", "No floor plans uploaded yet.", "Estimate details coming soon.", etc.
- Contractor still sees header with project name, address, and dates even when sections are empty

### Contact Liz
- Show Liz's phone and email at the bottom of the work order page
- Contact info sourced from a Sanity "Site Settings" singleton document (reusable across the site, Liz can update)
- "For questions about this project, contact Liz" with phone and email displayed

### Building Manager Portal — Auth & Login
- Separate login page at `/building/login` (follows /workorder/login pattern)
- Separate verify at `/building/verify`
- Session role: `building_manager` (already supported in Phase 7 session model)
- Middleware extended to handle `/building/*` routes with building_manager role check
- Magic link trigger: "Send Building Access" button on the project document in Sanity Studio — appears only when project is commercial AND has building manager email
- Follows notifyClient API route pattern: Studio button → /api/send-building-access → Resend
- Magic link email uses same branded template, subject: "Your La Sprezzatura Building Portal Access"
- Same 30-day session TTL and rate limits as other roles

### Building Manager Portal — Page Layout
- Single project page (auto-redirect for single project, dashboard if building manager email appears on multiple commercial projects)
- Page header: project name + project address
- Client contact section: primary client name, email, phone
- COI section: list of certificates with issuer name, coverage type, expiration date, policy number, download link
- COI expiration badges: green (valid), amber (expiring within 30 days), red (expired)
- Legal documents section: list of docs with name, description, download link
- Contractor info section: contractor names + trades shown inline, "Contact Liz for more details" for phone/license/contact info
- "Contact Liz" footer with phone/email from Site Settings singleton

### Client Contractor Visibility (CVIS-01)
- New "Contractors" section on client project detail page at `/portal/project/[projectId]`
- Section placement: after Milestones, before Procurement
- Only visible for Full Interior Design engagement type
- Hidden entirely if no contractors are assigned (no empty state message)
- Each contractor card shows: name, trade(s), appointment dates with labels
- Appointment notes NOT shown to client — only date, time, label
- Past appointments visible but visually muted
- Primary contact name only shown to contractor (not all clients on shared projects)

### Information Boundaries Summary
| Data | Client Sees | Contractor Sees | Building Manager Sees |
|------|------------|-----------------|----------------------|
| Client name | (self) | Primary contact name only | Primary client name + email + phone |
| Client contact | (self) | "Contact Liz" — no email/phone | Email + phone |
| Project address | Yes | Yes | Yes |
| Contractor names | Yes (name + trade + appointments) | Own assignment only | Names + trades, "Contact Liz" for more |
| Scope of work | No | Yes | No |
| Floor plans | No | Yes (download + preview) | No |
| Estimate | No | Yes (amount + PDF) | No |
| COIs | No | No | Yes (with expiration badges) |
| Legal docs | No | No | Yes (download) |
| Pipeline stage | Yes | No | No |
| Milestones | Yes | No | No |
| Procurement | Yes | No | No |
| Admin notes (gate codes) | No | No | No |

### Claude's Discretion
- Exact component structure for work order detail page
- Signed URL expiry TTL for document downloads
- Building manager dashboard layout (rare multi-project case)
- Contractor note form styling and placement
- Site Settings singleton schema fields beyond phone/email
- Whether appointment label field should have predefined options or free text
- Loading states and error handling
- Mobile responsive breakpoints for all three portal views

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing contractor auth infrastructure (Phase 7)
- `src/pages/workorder/login.astro` — Contractor login page (pattern for /building/login)
- `src/pages/workorder/verify.astro` — Contractor magic link verify (pattern for /building/verify)
- `src/pages/workorder/dashboard.astro` — Contractor dashboard with project cards (extend with auto-redirect + link to detail page)
- `src/components/portal/WorkOrderLoginForm.tsx` — React login form for contractor (pattern for building manager login form)
- `src/middleware.ts` — Route protection for /portal/* and /workorder/*, must add /building/* block

### Existing client portal (Phase 6 — extend for CVIS-01)
- `src/pages/portal/project/[projectId].astro` — Client project detail page (add Contractors section)
- `src/components/portal/MilestoneSection.astro` — Section component pattern (model for ContractorSection)
- `src/components/portal/PortalLayout.astro` — Layout wrapper for all portal pages (reuse for building manager)

### Sanity schemas
- `src/sanity/schemas/project.ts` — Project schema with contractors[], floorPlans[], buildingManager{}, cois[], legalDocs[], isCommercial. Must add appointments[] to contractor assignment, contractorNotes field, and contractor submission notes array
- `src/sanity/schemas/contractor.ts` — Contractor document type
- `src/sanity/schemas/index.ts` — Schema registry

### Sanity Studio actions and config
- `sanity.config.ts` — Document actions registration, Studio structure. Add "Send Building Access" action on project type
- `src/sanity/actions/sendWorkOrderAccess.tsx` — Pattern for SendBuildingAccessAction
- `src/sanity/actions/notifyClient.ts` — Document action → API route pattern

### Auth and session
- `src/lib/session.ts` — Multi-role session model (client, contractor, building_manager roles)
- `src/pages/portal/role-select.astro` — Role selection for dual-role emails (may need extension for building_manager)
- `src/components/portal/RoleSelectionForm.tsx` — Role selection form component

### API routes
- `src/pages/api/send-workorder-access.ts` — API route for contractor magic link (pattern for /api/send-building-access)
- `src/pages/api/blob-serve.ts` — Vercel Blob signed URL serving (reuse for floor plan, estimate, COI, legal doc downloads)

### GROQ queries
- `src/sanity/queries.ts` — Contractor queries (getContractorByEmail, getContractorById, getProjectsByContractorId). Must add project detail query for contractor view, building manager queries, and extended project detail query for CVIS-01

### Design system
- `src/styles/global.css` — Color tokens (cream, terracotta, charcoal, stone), typography, animations

### Planning
- `.planning/REQUIREMENTS.md` — Phase 8 requirements: CONTR-03, CONTR-04, BLDG-02, BLDG-03, BLDG-04, BLDG-05, BLDG-06, CVIS-01
- `.planning/ROADMAP.md` — Phase 8 success criteria and dependency on Phase 7
- `.planning/phases/07-schema-extensions-multi-role-auth-and-document-storage/07-CONTEXT.md` — Phase 7 decisions (contractor data model, multi-role sessions, Vercel Blob, building manager data, COI schema, engagement type gating)
- `.planning/phases/06-portal-features/06-CONTEXT.md` — Phase 6 decisions (project detail page layout, milestone section, procurement, artifacts, client notes pattern)
- `.planning/phases/05-data-foundation-auth-and-infrastructure/05-CONTEXT.md` — Phase 5 decisions (magic link auth flow, session design, email infrastructure, dashboard auto-redirect pattern)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PortalLayout.astro`: HTML shell for all portal pages — reuse for contractor work order detail and building manager portal
- `WorkOrderLoginForm.tsx`: Contractor login form — pattern for BuildingManagerLoginForm
- `StatusBadge.astro`: Pipeline stage badge — NOT used on contractor view but reusable for COI expiration badges (green/amber/red)
- `Button.astro`: Primary/secondary/outline buttons — reuse for download, note submission
- `MilestoneSection.astro`: Section component with header and items — pattern for ContractorSection on client portal
- `ClientNoteForm.tsx`: React form for client note submission — pattern for contractor note form
- Branded HTML email template in actions/index.ts — extend for building manager magic link email
- `BlobFileInput` Sanity component — already used for floor plans, estimates, COIs, legal docs
- `blob-serve.ts` API route — serves Vercel Blob files with signed URLs

### Established Patterns
- Contractor assignment is inline array on project with contractor reference + assignment fields
- Vercel Blob for private documents (floor plans, estimates, COIs, legal docs) with signed URL serving
- Document action → API route → Resend email pattern (NotifyClient, SendWorkOrderAccess)
- Astro SSR pages with middleware-injected session data (context.locals)
- Client note pattern: Astro Action with Zod schema → Sanity mutation API → inline array append
- GROQ select() for conditional data inclusion based on engagement type
- Multi-role session: JSON { entityId, role } in Redis, role-based middleware routing

### Integration Points
- `src/sanity/schemas/project.ts`: add appointments[] to contractor assignment, contractorNotes field, contractor submission notes array
- `src/sanity/schemas/index.ts`: add siteSettings singleton type
- `sanity.config.ts`: add siteSettings to Studio structure, add SendBuildingAccessAction on project type
- `src/middleware.ts`: add /building/* route block with building_manager role check
- `src/pages/workorder/project/[projectId].astro`: new contractor work order detail page
- `src/pages/workorder/dashboard.astro`: add auto-redirect for single-project contractors + link to detail
- `src/pages/building/login.astro`, `verify.astro`, `dashboard.astro`, `project/[projectId].astro`: new building manager pages
- `src/pages/api/send-building-access.ts`: new API route for building manager magic link
- `src/sanity/queries.ts`: new queries for work order detail, building manager lookup, extended client project detail with contractor data
- `src/pages/portal/project/[projectId].astro`: add Contractors section (CVIS-01)
- `src/components/portal/ContractorSection.astro`: new component for client contractor visibility
- `src/actions/index.ts`: new action for contractor note submission

</code_context>

<specifics>
## Specific Ideas

- Contractor-facing portal is called "Work Order" — this naming carries from Phase 7
- Appointments array replaces simple startDate/endDate as the primary scheduling display — Liz adds per-visit entries like "Measurement", "Install Day 1", "Touch-up" with date, time, and notes
- Appointment notes are contractor-visible instructions (e.g., "Bring 2\" molding samples") — client sees date/time/label only
- Contractor note submission is one-way (like client milestone notes), NOT interactive chat — clarified against Out of Scope "Contractor messaging/chat"
- Contact info for "Contact Liz" comes from a new Site Settings Sanity singleton — reusable across the whole site
- COI expiration uses traffic-light color scheme: green (valid), amber (expiring within 30 days), red (expired)
- Building manager sees contractor names + trades inline without needing to "request" — "Contact Liz" for deeper info (phone, license details)
- Building manager portal is the simplest of the three — mostly document viewing and contact info
- All three portals use the same luxury La Sprezzatura aesthetic
- Floor plan previews: inline thumbnail for images, named card for PDFs

</specifics>

<deferred>
## Deferred Ideas

- Bulk "Send Work Orders" action from project document (send to all assigned contractors at once) — deferred from Phase 7
- Contractor status/active tracking — revisit if Liz accumulates many inactive contractors
- Building manager approval workflow — explicitly out of scope ("Document exchange only — no sign-off or approval chain for v2.5")
- Contractor messaging/chat — out of scope (simple one-way notes added instead)
- Address autocomplete/geocoding — carried from Phase 5 deferral
- Building manager notification when new COI is uploaded — future enhancement

</deferred>

---

*Phase: 08-contractor-portal-building-manager-and-client-visibility*
*Context gathered: 2026-03-16*

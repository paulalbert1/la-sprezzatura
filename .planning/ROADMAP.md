# Roadmap: La Sprezzatura

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-03-15)
- 🚧 **v2.0 Client Portal Foundation** - Phases 5-6 (in progress)
- 📋 **v2.5 Contractor & Commercial Workflows** - Phases 7-8 (planned)
- 📋 **v3.0 AI Rendering & Go-Live** - Phases 9-12 (planned)
- 📋 **v3.1 Rendering Tool Polish** - Phases 13-14 (planned)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-3) - SHIPPED 2026-03-15</summary>

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Project Scaffold and Staging Deploy** - Create the Astro project with Sanity CMS and deploy to a Vercel preview URL with automatic GitHub deploys
- [x] **Phase 2: Public Portfolio Site** - Build the complete public-facing site on the staging URL with portfolio, CMS, luxury design, integrations, and SEO
- [x] **Phase 3: Client Operations Portal** - Add PURL-based client project portal with status tracking, milestones, and pipeline management in Sanity on staging

### Phase 1: Project Scaffold and Staging Deploy
**Goal**: A working Astro project deployed to a Vercel preview URL with automatic GitHub deploys and Sanity Studio connected
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-05
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md -- Scaffold Astro 6 project with Sanity, Tailwind, Vercel and deploy to staging

### Phase 2: Public Portfolio Site
**Goal**: A visually stunning, fast-loading portfolio website on the Vercel staging URL that showcases Liz's work, communicates services, captures leads, and scores 90%+ on SEO audits
**Depends on**: Phase 1
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-07, DSGN-01, DSGN-02, DSGN-03, SEO-01, SEO-02, SEO-03, SEO-04, SEO-05
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md -- Design system, Sanity schemas, layout shell, and reusable components
- [x] 02-02-PLAN.md -- Home page and portfolio experience (gallery, project pages, lightbox)
- [x] 02-03-PLAN.md -- Services, Process, About, and Privacy pages
- [x] 02-04-PLAN.md -- Contact form (Resend), Cal.com booking, GSAP animations, sitemap, and visual review

### Phase 3: Client Operations Portal
**Goal**: Active clients can visit a unique project URL (no login) on the staging site and see their project status, current pipeline stage, and milestone timeline
**Depends on**: Phase 2
**Requirements**: CLNT-01, CLNT-02, CLNT-03
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md -- Schema extension, utility modules, Sanity Studio portal fields, and unit tests
- [x] 03-02-PLAN.md -- Portal page components, SSR page with token lookup, and visual review

</details>

**Note:** v1.0 Phase 4 (DNS Cutover) was planned but not executed. Its requirements (INFRA-01 through INFRA-04, INFRA-06) are carried forward into v3.0 Phase 12.

### v2.0 Client Portal Foundation (In Progress)

**Milestone Goal:** Secure portal access via magic link auth, client data model with engagement types, core portal features (milestones, procurement, artifacts, post-project workflow) -- the foundation every subsequent milestone builds on.

**Phase Numbering:**
- Integer phases (5, 6): Planned milestone work
- Decimal phases (5.1, 6.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 5: Data Foundation, Auth, and Infrastructure** - Client/project schemas, engagement type toggle, magic-link auth, rate limiter upgrade, and Resend domain verification
- [x] **Phase 6: Portal Features** - Milestones, procurement, artifacts, post-project workflow, and portal UX on the authenticated portal (completed 2026-04-03)

### v2.5 Contractor & Commercial Workflows (Planned)

**Milestone Goal:** Extend the portal platform to contractors and building managers -- residential/commercial project classification, engagement type gating of portal features, contractor portal with scoped project access, building manager portal for commercial compliance documents, and private document storage via Vercel Blob.

- [x] **Phase 7: Schema Extensions, Multi-Role Auth, and Document Storage** - Contractor and building manager data models, residential/commercial toggle, engagement type feature gating, multi-role session model, and Vercel Blob document storage foundation (completed 2026-04-03)
- [x] **Phase 8: Contractor Portal, Building Manager Portal, and Client Contractor Visibility** - Contractor portal UI (scope, floor plans, estimates), building manager portal UI (COIs, legal docs), and client-facing contractor schedule (completed 2026-04-03)

### v3.0 AI Rendering & Go-Live (Planned)

**Milestone Goal:** Equip Liz with an AI rendering tool for photorealistic room visualizations, complete business operations (send update, investment proposals), polish the public site, and consolidate DNS -- the final milestone before extracting to the Linha multi-tenant platform.

- [x] **Phase 9: Send Update, Investment Proposals, and Public Site Polish** - Email capstone with portal snapshot, tiered budget proposals with client selection, hero animation refresh, and Fantastical booking swap (completed 2026-04-03)
- [x] **Phase 10: AI Rendering Engine** - Rendering schemas, Gemini API integration, generate/refine/status API routes, usage tracking, and Vercel Blob image storage (completed 2026-03-17)
- [x] **Phase 11: Rendering Studio Tool and Design Options Gallery** - Sanity Studio custom tool (wizard, refinement, session management), promote-to-Design-Option workflow, and client portal Design Options gallery with favorites and comments (completed 2026-03-18)
- [ ] **Phase 12: DNS Cutover and Go-Live** - DNS consolidation to Cloudflare, email to lasprezz.com, domain redirects, and Wix replacement

## Phase Details

### Phase 5: Data Foundation, Auth, and Infrastructure
**Goal**: Clients can securely access the portal via magic link, the Sanity schema supports all v2.0 data (clients, milestones, procurement, artifacts), engagement type is set per project, and email infrastructure is production-ready -- the foundation every subsequent phase builds on
**Depends on**: Phase 3 (v1.0)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, CLNT-04, CLNT-05, ENGMT-01, PROC-03, INFRA-07, INFRA-08
**Success Criteria** (what must be TRUE):
  1. A client enters their email on the portal login page, receives a magic link email, clicks it, and lands on a dashboard showing their projects -- no password or account creation involved
  2. The client closes their browser, reopens the portal URL days later, and is still logged in (cookie-based session persists)
  3. An unauthenticated visitor sees only a branded login page requesting their email -- no project names, statuses, or client data are visible
  4. Liz can create a client record in Sanity Studio with name, email, phone, address, and preferred contact method, link that client to one or more projects, and set each project's engagement type (Full Interior Design, Styling & Refreshing, or Carpet Curating)
  5. Sending a test email from the verified send.lasprezz.com domain delivers successfully to Gmail, Outlook, and Yahoo inboxes with SPF/DKIM passing
**Plans**: 4 plans

Plans:
- [x] 05-01-PLAN.md -- Sanity schemas (client type, project extensions, engagement type) and GROQ queries
- [x] 05-02-PLAN.md -- Upstash Redis client, persistent rate limiter, session helpers, and middleware
- [x] 05-03-PLAN.md -- Magic link auth flow (actions, verify, login, dashboard, PURL redirect, logout)
- [x] 05-04-PLAN.md -- Upstash Redis setup, Resend domain DNS verification, and end-to-end visual verification

### Phase 6: Portal Features
**Goal**: The authenticated portal is Liz's primary client communication tool -- clients see custom milestones with dates, a procurement table with savings, uploadable artifacts with version history and approval workflow, and post-project warranty access -- all managed by Liz through Sanity Studio
**Depends on**: Phase 5
**Requirements**: CLNT-06, CLNT-07, MILE-01, MILE-02, MILE-03, PROC-01, PROC-02, ARTF-01, ARTF-02, ARTF-03, ARTF-04, ARTF-08, ARTF-09, PORT-05, PORT-06, PORT-07, POST-01, POST-02, POST-03, POST-04
**Success Criteria** (what must be TRUE):
  1. A client logs in and sees a dashboard greeting them by name with all their active and completed projects; clicking a project shows custom milestones with dates and completion indicators, a procurement table with line-item statuses and total savings, and uploaded artifacts with version history
  2. Liz uploads a new version of a design board artifact in Sanity Studio; the client sees the new version as current and previous versions visually muted, and can approve/select versions with their decisions recorded in a timestamped log
  3. Liz marks the final milestone complete and generates a close document; the client sees the project as completed but can still access it, and Liz can later reopen it for warranty work that the client can submit through the portal
  4. The portal displays a confidentiality notice about not sharing the access link, and clients can submit notes at artifact review points and milestone checkpoints
**Plans**: 5 plans

Plans:
- [ ] 06-01-PLAN.md -- Schema extensions (milestones, procurement, artifacts), utility libraries with tests, GROQ queries, and Sanity write client
- [ ] 06-02-PLAN.md -- Project detail page, milestones section, procurement table, dashboard 30-day visibility filter
- [ ] 06-03-PLAN.md -- Artifact section UI, approval/notes React forms, and Astro Actions for client interactions
- [ ] 06-04-PLAN.md -- Wire artifacts into page, Sanity Studio document actions (Notify Client, Complete Project, Reopen)
- [ ] 06-05-PLAN.md -- Close document PDF generation, warranty claim form, post-project features

### Phase 7: Schema Extensions, Multi-Role Auth, and Document Storage
**Goal**: The Sanity schema supports contractors, building managers, residential/commercial classification, and engagement type feature gating; the auth system handles multi-role sessions with namespace isolation; and private documents are stored in Vercel Blob with signed URLs -- all architectural decisions resolved before any portal UI is built
**Depends on**: Phase 6
**Requirements**: ENGMT-02, PRJT-01, PRJT-02, CONTR-01, CONTR-02, CONTR-05, CONTR-06, CONTR-07, BLDG-01, DOCS-01
**Success Criteria** (what must be TRUE):
  1. Liz can create contractor records in Sanity Studio (name, email, phone, company, trade), assign contractors to Full Interior Design projects, and upload a final estimate per contractor per project; contractor fields are hidden for non-Full Interior Design engagement types
  2. Liz can toggle a project between Residential and Commercial; commercial projects show building manager contact fields and a COI section in Sanity Studio, while residential projects hide them entirely
  3. A contractor receives a magic link email, clicks it, and lands on a session-gated page -- the session carries a role that prevents access to client portal routes, and vice versa
  4. COI documents, floor plans, and legal documents uploaded through Sanity Studio are stored in Vercel Blob with signed URLs; direct Blob URLs without a valid signature return an error
**Plans**: 3 plans

Plans:
- [ ] 07-01-PLAN.md -- Contractor document type, project schema extensions (contractors[], buildingManager, COIs, legalDocs, floorPlans, isCommercial), engagement type field gating, GROQ queries
- [ ] 07-02-PLAN.md -- Vercel Blob infrastructure (BlobFileInput Studio component, upload API route, authenticated serve proxy)
- [ ] 07-03-PLAN.md -- Multi-role session upgrade, contractor magic link flow (login, verify, dashboard), SendWorkOrderAccess Studio action, role selection

### Phase 8: Contractor Portal, Building Manager Portal, and Client Contractor Visibility
**Goal**: Contractors can view their assigned project scope, floor plans, estimates, and notes through a branded portal; building managers can access COI documents, legal docs, and client contact info for commercial projects; and clients can see which contractors are assigned to their project with on-site schedule dates
**Depends on**: Phase 7
**Requirements**: CONTR-03, CONTR-04, BLDG-02, BLDG-03, BLDG-04, BLDG-05, BLDG-06, CVIS-01
**Success Criteria** (what must be TRUE):
  1. A contractor logs in via magic link and sees their assigned project with floor plans (downloadable via signed URL), scope of work, deadline, estimate, and notes -- but sees only the client name and project address with a "contact Liz" notice instead of client email or phone
  2. A building manager logs in via magic link on a commercial project and sees the client name and contact info, a COI section with certificates showing expiration date badges, a legal documents section with downloadable PDFs, and can request contractor info (name and license only, with "contact Liz" for more)
  3. A client viewing their Full Interior Design project on the portal sees a contractor section showing assigned contractor names and on-site schedule dates
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md -- Schema extensions (appointments, contractor notes), GROQ queries with information boundaries, middleware, COI utility, building manager magic link infra, SendBuildingAccessAction
- [ ] 08-02-PLAN.md -- Contractor work order detail page, dashboard modifications, ContractorNoteForm
- [ ] 08-03-PLAN.md -- Building manager auth flow and portal (login, verify, dashboard, project detail), ExpirationBadge, ContractorSection (CVIS-01), role selection extension

### Phase 9: Send Update, Investment Proposals, and Public Site Polish
**Goal**: Liz can send branded email updates that snapshot the full portal state to clients, present tiered investment proposals (Best/Better/Good) that clients can customize, and the public site has a visually impactful hero and modern booking -- the final features before AI rendering
**Depends on**: Phase 8
**Requirements**: SEND-01, SEND-02, SEND-03, ARTF-05, ARTF-06, ARTF-07, BOOK-01, SITE-08
**Success Criteria** (what must be TRUE):
  1. Liz clicks "Send Update" on a project in Sanity Studio, adds an optional personal note, previews the email, confirms, and the client receives a branded email showing current milestones, procurement status, and pending artifact reviews -- the delivery is logged with timestamp and recipient on the project
  2. Liz creates a proposal artifact with Good/Better/Best tiers and line items; the client views the tiers on the portal, selects their preferred tier (or mixes items across tiers), and completes a readiness check with eagerness rating and reservations capture before approval
  3. A first-time visitor to the home page sees the hero text animate in with character-level GSAP SplitText animation creating a strong visual first impression
  4. The contact page links to Fantastical Openings for booking with no Cal.com embed or dead code remaining in the codebase
**Plans**: 3 plans

Plans:
- [ ] 09-01-PLAN.md -- Schema extensions (updateLog, investmentSummary), GROQ queries, SendUpdateAction Studio dialog, send-update API route, branded email template
- [ ] 09-02-PLAN.md -- Investment proposal tier cards (InvestmentSummary.astro), tier selection form (TierSelectionForm.tsx), selectTier Astro Action, ArtifactCard wiring
- [x] 09-03-PLAN.md -- Hero slideshow with crossfade + Ken Burns + GSAP SplitText animation, siteSettings heroSlideshow schema, Cal.com dead code cleanup

### Phase 10: AI Rendering Engine
**Goal**: The server-side rendering pipeline is fully operational -- Sanity schemas for sessions, outputs, and usage tracking are deployed, API routes handle generation, conversational refinement, and polling with Gemini integration, usage is enforced per-designer per-month with hard cap, and generated images are stored in Vercel Blob -- all backend infrastructure ready before building the Studio UI
**Depends on**: Phase 9
**Requirements**: RNDR-01, RNDR-02, RNDR-03, RNDR-06, RNDR-07
**Success Criteria** (what must be TRUE):
  1. A POST to /api/rendering/generate with a valid session ID, prompt, and input images creates a renderingSession document in Sanity, calls Gemini to produce a photorealistic 1K room rendering, stores the output image in Vercel Blob, and returns the session with the new rendering appended
  2. A POST to /api/rendering/refine with a session ID and refinement text sends the full conversation history (previous prompt + refinement instruction) to Gemini, produces a new rendering version, and preserves the complete multi-turn context on the session
  3. GET /api/rendering/usage returns the current designer's monthly generation count, limit, and remaining quota; POST to /api/rendering/generate returns a 403 with a clear message when the monthly limit is reached; failed generations do not increment the usage counter
  4. GET /api/rendering/status polls a session and returns its current status (generating/complete/error); the generate endpoint uses Vercel waitUntil to process the Gemini call after returning an immediate response
**Plans**: 4 plans

Plans:
- [ ] 10-01-PLAN.md -- Sanity schemas (renderingSession, designOption, renderingUsage), siteSettings extensions, GROQ queries, schema tests, npm deps, maxDuration config
- [ ] 10-02-PLAN.md -- Library modules (promptBuilder, geminiClient, renderingAuth) with unit tests
- [ ] 10-03-PLAN.md -- Core API routes (generate with waitUntil, refine with multi-turn, status polling)
- [ ] 10-04-PLAN.md -- Supporting API routes (usage quota, promote/unpromote Design Options, client reactions)

### Phase 11: Rendering Studio Tool and Design Options Gallery
**Goal**: Liz can create rendering sessions, upload inputs through a guided wizard, generate and refine renderings, and promote favorites as Design Options visible to clients -- the complete AI rendering workflow from designer creation to client consumption
**Depends on**: Phase 10
**Requirements**: RNDR-04, RNDR-05
**Success Criteria** (what must be TRUE):
  1. Liz opens the Rendering tool in Sanity Studio, creates a new session linked to a project, uploads a floor plan and inspiration images through a 4-step wizard, describes her vision, and generates a rendering -- the session list shows all her sessions filterable by project with a persistent usage counter badge
  2. After generating a rendering, Liz clicks "Promote to Design Options" on her preferred rendering, adds a caption, and a designOption document is created linking to the same Blob image -- the rendering shows a star icon indicating it has been promoted
  3. A client viewing their project on the portal sees a Design Options gallery with promoted renderings displayed in a grid (2-up mobile, 3-up desktop), can click to expand in a lightbox, favorite options with a heart toggle, and leave comments -- with a confidentiality notice adapted to residential/commercial
  4. Only promoted renderings are visible to clients -- the rendering session, wizard inputs, iteration history, and unpromoted outputs are never exposed on the portal
**Plans**: 4 plans

Plans:
- [x] 11-01-PLAN.md -- Foundation: shared types, tool plugin registration, UsageBadge, HEIC upload support, dual-auth blob serving, env vars
- [x] 11-02-PLAN.md -- Studio Session List and 4-Step Wizard (Setup, Upload, Classify, Describe + Generate)
- [x] 11-03-PLAN.md -- Studio Chat View (refinement), RenderingCard actions, PromoteDialog, DesignOptionsTab
- [x] 11-04-PLAN.md -- Portal Design Options gallery (responsive grid, lightbox with favorites and comments), visual verification

### Phase 12: DNS Cutover and Go-Live
**Goal**: All 4 domains consolidated on Cloudflare with working Microsoft 365 email at lasprezz.com, domain redirects active, and lasprezz.com serving the new site from Vercel -- replacing Wix with minimal downtime and zero email disruption
**Depends on**: Phase 11
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Visiting lasprezz.com in a browser shows the new site (not Wix) with a valid HTTPS certificate
  2. Sending an email to liz@lasprezz.com delivers to her Microsoft 365 inbox with MX, SPF, DKIM, and DMARC all passing
  3. Visiting lasprezzaturany.com, lasprezzny.com, and casadeolivier.com in a browser redirects to lasprezz.com with HTTPS
  4. All 4 domains show Cloudflare as the authoritative nameserver (verified via dig or whois)
  5. Liz confirms she can send and receive email at liz@lasprezz.com, info@lasprezz.com, and paul@lasprezz.com within 1 hour of cutover
**Plans**: 3 plans

Plans:
- [ ] 12-01-PLAN.md -- Pre-cutover DNS audit and M365 email migration (GoDaddy to Microsoft direct)
- [ ] 12-02-PLAN.md -- Domain transfers to Cloudflare, DNS configuration for Vercel + email, Resend verification
- [ ] 12-03-PLAN.md -- Secondary domain redirects, email aliases, go-live verification, and service teardown

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Scaffold and Staging Deploy | v1.0 | 1/1 | Complete | 2026-03-14 |
| 2. Public Portfolio Site | v1.0 | 4/4 | Complete | 2026-03-14 |
| 3. Client Operations Portal | v1.0 | 2/2 | Complete | 2026-03-15 |
| 4. DNS Cutover and Go-Live | v1.0 | 0/1 | Deferred (moved to v3.0 Phase 12) | - |
| 5. Data Foundation, Auth, and Infrastructure | v2.0 | 4/4 | Complete | 2026-03-16 |
| 6. Portal Features | v2.0 | 0/5 | Complete    | 2026-04-03 |
| 7. Schema Extensions, Multi-Role Auth, and Document Storage | v2.5 | 0/3 | Complete    | 2026-04-03 |
| 8. Contractor Portal, Building Manager Portal, and Client Contractor Visibility | v2.5 | 0/3 | Complete    | 2026-04-03 |
| 9. Send Update, Investment Proposals, and Public Site Polish | v3.0 | 1/3 | Complete    | 2026-04-03 |
| 10. AI Rendering Engine | 4/4 | Complete    | Complete    | 2026-04-03 |
| 11. Rendering Studio Tool and Design Options Gallery | 4/4 | Complete    | 2026-03-18 | - |
| 12. DNS Cutover and Go-Live | v3.0 | 0/3 | Not started | - |

---
*Roadmap created: 2026-03-14*
*v1.0 shipped: 2026-03-15 (Phases 1-3)*
*v2.0 roadmap created: 2026-03-16*
*Restructured into v2.0/v2.5/v3.0: 2026-03-16*
*Phase 5 plans created: 2026-03-16*
*Phase 6 plans created: 2026-03-16*
*Phase 7 plans created: 2026-03-16*
*Phase 8 plans created: 2026-03-17*
*v3.0 roadmap expanded: 2026-03-17 (AI Rendering phases 10-11 added, DNS moved to Phase 12)*
*Phase 9 plans created: 2026-03-17 (3 plans in 2 waves)*
*Phase 10 plans created: 2026-03-17 (4 plans in 2 waves)*
*Phase 11 plans created: 2026-03-18 (4 plans in 2 waves)*
*Phase 12 plans created: 2026-03-18 (3 plans in 3 waves -- operations runbook, no code changes)*

### v3.1 Rendering Tool Polish

**Milestone Goal:** Make the AI rendering wizard intuitive and reliable so Liz can use it with real clients. Fix UX blockers found during first real testing.

- [x] **Phase 13: Wizard Infrastructure and Layout Fixes** - Fix step navigation, blob upload reliability, filename overflow, and classify step responsive layout (completed 2026-04-03)
- [x] **Phase 14: Image Experience and Field Clarity** - Add image previews, multi-image upload, and simplify the setup/describe field overlap (completed 2026-04-03)

## Progress (v3.1)

| # | Phase | Plans | Status | Completed |
|---|-------|-------|--------|-----------|
| 13. Wizard Infrastructure and Layout Fixes | v3.1 | 2/2 | Complete    | 2026-04-03 |
| 14. Image Experience and Field Clarity | v3.1 | 2/2 | Complete    | 2026-04-03 |

### Phase 13: Wizard Infrastructure and Layout Fixes
**Goal**: The wizard stepper allows free navigation between completed steps, blob uploads work reliably everywhere, long filenames don't break layout, and the classify step is responsive
**Depends on**: Phase 11 (existing rendering tool)
**Requirements**: RNAV-01, RNAV-02, RUPL-01, RIMG-03, RUX-02
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md -- Hybrid blob upload (server-side PUT + client fallback), retry button, CSS filename truncation in Upload step
- [x] 13-02-PLAN.md -- maxVisitedStep stepper navigation with disabled Classify state, Classify card max-width and filename truncation

**Success criteria:**
1. Designer clicks a completed step indicator and the wizard jumps to that step with all data preserved
2. Designer uploads an image on both localhost and the production Vercel URL without CORS errors
3. A filename longer than 60 characters is truncated with ellipsis in both upload and classify views
4. Classify step fields don't overflow or stack awkwardly on a 1440px-wide screen

### Phase 14: Image Experience and Field Clarity
**Goal**: Uploaded images show visual previews, multiple images can be uploaded at once, and the setup/describe steps have clear distinct purposes
**Depends on**: Phase 13 (upload must work before previews matter)
**Requirements**: RIMG-01, RIMG-02, RUX-01
**Plans**: 2 plans

Plans:
- [x] 14-01-PLAN.md -- Types foundation (localPreviewUrl, STYLE_PRESETS), style dropdown in StepSetup, Classify preview fallback
- [x] 14-02-PLAN.md -- StepUpload overhaul: instant previews, parallel upload (concurrency=3), 120px thumbnails, PDF fallback, memory cleanup

**Success criteria:**
1. After uploading an image, a thumbnail preview appears (not just the filename)
2. Designer can drag 3 images onto the upload area and all 3 are uploaded and classified
3. Setup step and Describe step have clearly labeled, non-overlapping fields

---
*Phase 13 plans created: 2026-04-03 (2 plans in 1 wave -- parallel execution)*
*Phase 14 plans created: 2026-04-03 (2 plans in 2 waves -- sequential execution)*

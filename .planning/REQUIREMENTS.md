# Requirements: La Sprezzatura

**Defined:** 2026-03-14
**Core Value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work

## v1 Requirements (Complete -- Phases 1-3)

### Infrastructure

- [x] **INFRA-05**: Deploy site on Vercel with automatic GitHub deploys -- Phase 1

### Portfolio & Content

- [x] **PORT-01**: Portfolio gallery displaying 4-5 completed projects, filterable by room type and style -- Phase 2
- [x] **PORT-02**: Individual project pages with full-bleed imagery and lightbox detail views -- Phase 2
- [x] **PORT-03**: Case study narrative per project -- design challenge, approach, outcome, and client testimonial -- Phase 2
- [x] **PORT-04**: CMS (Sanity) with form-like editing experience so Liz can manage portfolio projects and site copy independently -- Phase 2

### Site Pages

- [x] **SITE-01**: Home page with hero imagery and clear value proposition -- Phase 2
- [x] **SITE-02**: Services page with clear offerings and service package descriptions -- Phase 2
- [x] **SITE-03**: Design process page -- numbered "how we work" with timeline expectations -- Phase 2
- [x] **SITE-04**: About page with Liz's story, professional photo, and design philosophy -- Phase 2
- [x] **SITE-05**: Contact form with project intake questions and auto-response email via Resend -- Phase 2
- [x] **SITE-07**: Privacy policy page -- Phase 2

### Design & Performance

- [x] **DSGN-01**: Luxury visual design -- warm neutrals, editorial typography, generous whitespace -- Phase 2
- [x] **DSGN-02**: Mobile-first responsive design with touch-optimized galleries -- Phase 2
- [x] **DSGN-03**: Image optimization pipeline via Sanity Image CDN -- Phase 2

### SEO

- [x] **SEO-01**: Unique meta titles and descriptions on all pages -- Phase 2
- [x] **SEO-02**: Open Graph tags for social sharing with portfolio imagery -- Phase 2
- [x] **SEO-03**: Structured data -- LocalBusiness schema markup -- Phase 2
- [x] **SEO-04**: XML sitemap generation -- Phase 2
- [x] **SEO-05**: Proper heading hierarchy and semantic HTML -- Phase 2

### Client Operations (Basic Portal)

- [x] **CLNT-01**: Basic client portal accessible via PURL -- Phase 3
- [x] **CLNT-02**: Portal displays project name, status badge, pipeline stage, milestone timeline -- Phase 3
- [x] **CLNT-03**: Project pipeline schema in Sanity with 6 stages -- Phase 3

## v2.0 Requirements (Client Portal Foundation -- Phases 5-6)

### Authentication (AUTH)

- [x] **AUTH-01**: Client receives a magic link email to access the portal -- no password or account creation -- Phase 5
- [x] **AUTH-02**: Magic link grants a cookie-based session that persists across visits -- Phase 5
- [x] **AUTH-03**: Authenticated client sees a dashboard of all their projects (active and historical) -- Phase 5
- [x] **AUTH-04**: Artifact approvals, notes, and decisions are attributed to the authenticated client's identity; when signing off, primary contact confirms they are approving on behalf of all parties (checkbox) -- Phase 5
- [x] **AUTH-05**: Unauthenticated visitors see a branded login page requesting their email -- no project data exposed -- Phase 5

### Client Data (CLNT)

- [x] **CLNT-04**: Liz can create client records in Sanity with name, email, phone, address, and preferred contact method -- Phase 5
- [x] **CLNT-05**: A client can have multiple projects and a project can have multiple clients; one client is designated as the primary contact -- Phase 5
- [x] **CLNT-06**: Portal greets client by name and shows all their active and historical projects -- Phase 6
- [x] **CLNT-07**: Active clients can view completed projects alongside current ones (e.g., living room done, bedroom in progress) -- Phase 6

### Engagement Type (ENGMT)

- [x] **ENGMT-01**: Liz can set engagement type on a project: Full Interior Design, Styling & Refreshing, or Carpet Curating -- Phase 5

### Milestones (MILE)

- [x] **MILE-01**: Liz can define custom per-project milestones with name, date, and completion status in Sanity -- Phase 6
- [x] **MILE-02**: Client sees milestone timeline with dates and completion indicators on the portal -- Phase 6
- [x] **MILE-03**: The 6-stage pipeline is retained as high-level status alongside detailed milestones -- Phase 6

### Procurement (PROC)

- [x] **PROC-01**: Liz can add procurement line items with name, status (Ordered/Warehouse/In Transit/Pending/Delivered/Installed), install date, client cost, retail price -- Phase 6
- [x] **PROC-02**: Client sees procurement table on portal with statuses and savings (retail minus client cost) -- Phase 6
- [x] **PROC-03**: All financial values stored as integer cents to prevent rounding errors -- Phase 5

### Project Artifacts (ARTF)

- [x] **ARTF-01**: Liz can upload project artifacts of configurable types (proposal, floor plan, design board, contract, warranty, close document) -- Phase 6
- [x] **ARTF-02**: Artifacts support revisions -- new versions are created, previous versions remain viewable but visually muted -- Phase 6
- [x] **ARTF-03**: Client can review and select/approve artifact versions; non-selected versions are muted -- Phase 6
- [x] **ARTF-04**: All selections, approvals, and decisions are recorded in a decision log with timestamps -- Phase 6
- [x] **ARTF-08**: Contract artifacts support upload of a signed version by the designer -- Phase 6
- [x] **ARTF-09**: Client can provide notes/feedback on artifacts at review points -- Phase 6

### Portal Experience (PORT)

- [x] **PORT-05**: Portal displays a confidentiality notice about not sharing the access link -- Phase 6
- [x] **PORT-06**: Client can submit notes at appropriate workflow points (artifacts, milestones) -- Phase 6
- [x] **PORT-07**: Portal shows all project artifacts with current status, version history, and decision log -- Phase 6

### Post-Project (POST)

- [x] **POST-01**: After final milestone, Liz can generate a project close document (PDF) -- Phase 6
- [x] **POST-02**: Liz can reopen a completed project for warranty work -- Phase 6
- [x] **POST-03**: Liz can upload warranty items to a reopened project -- Phase 6
- [x] **POST-04**: Client can submit a warranty claim through the portal on a reopened project -- Phase 6

### Infrastructure (INFRA)

- [x] **INFRA-07**: Rate limiter upgraded from in-memory to persistent storage for serverless -- Phase 5
- [ ] **INFRA-08**: Resend domain verified for lasprezz.com with SPF/DKIM coexisting with Microsoft 365 -- Phase 5

## v2.5 Requirements (Contractor & Commercial Workflows -- Phases 7-8)

### Engagement Type & Classification (ENGMT/PRJT)

- [x] **ENGMT-02**: Engagement type controls which Sanity Studio fields and portal features are visible per project -- Phase 7
- [x] **PRJT-01**: Liz can toggle a project between Residential and Commercial -- Phase 7
- [x] **PRJT-02**: Commercial projects show building manager fields and COI section in Sanity Studio; residential projects hide them -- Phase 7

### Contractor Portal (CONTR)

- [x] **CONTR-01**: Liz can create contractor records in Sanity with name, email, phone, company, and trade -- Phase 7
- [x] **CONTR-02**: Contractor receives a magic link email to access their portal view -- no password or account creation -- Phase 7
- [x] **CONTR-03**: Contractor portal shows floor plans, scope of work, deadline, notes, and next steps for assigned projects -- Phase 8
- [x] **CONTR-04**: Contractor sees client name and project address only -- no client email, phone, or contact info ("contact Liz" shown instead) -- Phase 8
- [x] **CONTR-05**: Liz uploads final estimate as PDF or inputs the dollar amount per contractor per project -- Phase 7
- [x] **CONTR-06**: Contractor portal is only available for Full Interior Design projects -- Phase 7
- [x] **CONTR-07**: Contractor can be assigned to multiple projects; a project can have multiple contractors -- Phase 7

### Building Manager Portal (BLDG)

- [x] **BLDG-01**: Liz can add building manager contact info (name, email, phone) to commercial projects -- Phase 7
- [x] **BLDG-02**: Building manager receives a magic link email to access their portal view -- Phase 8
- [x] **BLDG-03**: Building manager sees client name and contact info for the project -- Phase 8
- [x] **BLDG-04**: Building manager has a COI section showing certificates of insurance with expiration dates -- Phase 8
- [x] **BLDG-05**: Building manager has a legal documents section for building requirements and PDFs -- Phase 8
- [x] **BLDG-06**: Building manager can request contractor info (name, license -- not direct contact, "contact Liz" for more) -- Phase 8

### Client Contractor Visibility (CVIS)

- [x] **CVIS-01**: Client sees contractor name and on-site schedule dates on their project portal -- Phase 8

### Document Storage (DOCS)

- [x] **DOCS-01**: COI documents, floor plans, and legal documents stored with private access (Vercel Blob with signed URLs, not public Sanity CDN) -- Phase 7

## v3.0 Requirements (AI Rendering & Go-Live -- Phases 9-12)

### AI Rendering (RNDR)

- [x] **RNDR-01**: Liz can create a rendering session in Sanity Studio linked to a project (or as scratchpad), uploading floor plan, space photos, and inspiration images through a guided 4-step wizard -- Phase 10
- [x] **RNDR-02**: Liz generates a photorealistic 1K room rendering by describing her design vision -- the AI uses uploaded inputs to produce the image -- Phase 10
- [x] **RNDR-03**: Liz refines a rendering through a conversational chat interface -- each refinement produces a new version while preserving the full session history -- Phase 10
- [ ] **RNDR-04**: Liz promotes a rendering to a "Design Option" with a caption, making it visible to clients on the portal -- Phase 11
- [ ] **RNDR-05**: Client sees promoted design options in a gallery on their project portal, can favorite options and leave comments -- Phase 11
- [x] **RNDR-06**: Studio shows a persistent usage counter and blocks generation at the monthly limit -- Phase 10
- [x] **RNDR-07**: Per-designer monthly generation counts are tracked for billing and cost control -- Phase 10

### Send Update (SEND)

- [x] **SEND-01**: Liz can trigger "Send Update" from Sanity Studio via a document action on the project -- Phase 9
- [x] **SEND-02**: Email includes current milestones, procurement status, pending artifact reviews, and an optional personal note from Liz -- Phase 9
- [x] **SEND-03**: Every sent update is logged with timestamp and recipient on the project -- Phase 9

### Project Artifacts - Investment Proposals (ARTF)

- [x] **ARTF-05**: Proposal artifacts include an Investment Summary with designer-defined pricing tiers and line items -- Phase 9
- [x] **ARTF-06**: Client selects their preferred investment tier; selections can evolve (mix items across tiers) -- Phase 9
- [x] **ARTF-07**: Proposal approval includes a readiness check -- eagerness rating (1-5) and "any reservations?" capture -- Phase 9

### Booking (BOOK)

- [x] **BOOK-01**: Contact page links to Fantastical Openings for booking, replacing Cal.com embed -- Phase 9

### Public Site Polish (SITE)

- [x] **SITE-08**: Home page hero has enhanced visual impact with GSAP SplitText animation -- Phase 9

### Infrastructure (INFRA)

- [ ] **INFRA-01**: DNS consolidation -- all 4 domains (lasprezz.com, lasprezzaturany.com, lasprezzny.com, casadeolivier.com) to Cloudflare -- Phase 12
- [ ] **INFRA-02**: Email consolidation to @lasprezz.com on Microsoft 365 with SPF/DKIM/DMARC -- Phase 12
- [ ] **INFRA-03**: Professional email addresses: liz@lasprezz.com, info@lasprezz.com, paul@lasprezz.com -- Phase 12
- [ ] **INFRA-04**: Redirect consolidation -- secondary domains redirect to lasprezz.com -- Phase 12
- [ ] **INFRA-06**: Cloudflare DNS with SSL for all domains -- Phase 12

## Future Requirements

Deferred beyond v3.0. Tracked but not in current roadmap.

### Portfolio Enhancements

- **PORT-08**: Before/after interactive image comparison sliders on project pages
- **PORT-09**: Instagram feed integration -- curated embed for fresh content

### Growth

- **GROW-01**: Plausible privacy-friendly analytics (no cookie banner)
- **GROW-02**: Local SEO service pages -- location-targeted for Long Island, North Shore, NYC
- **GROW-03**: Blog / editorial content capability in CMS
- **GROW-04**: Email marketing capability via Kit (ConvertKit) with signup form

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| QuickBooks integration | Designer confirmed unnecessary -- not needed for studio operations |
| Live chat / chatbot | Solo designer cannot deliver instant availability. Unanswered chats worse than no chat. |
| Video content hosting | Storage/bandwidth costs disproportionate to value. Embed Vimeo if needed. |
| E-commerce / product shop | Design services are the product. E-commerce requires fulfillment infrastructure. |
| Mobile native app | Responsive web handles mobile. Native app unjustified for studio scale. |
| Houzz Pro subscription | $99/mo not justified. Keep free listing for discovery. |
| 3D floor plan / AR visualization | $8K-60K+ to implement. Use SketchUp as standalone. Share renderings as images. |
| Multi-language support | English only. Near-zero return for NY metro luxury design market. |
| Real-time push notifications | Interior design moves on weekly/monthly cadence. Email sufficient. |
| Dubsado CRM | Premature. Contact form + Fantastical + portal covers needs. |
| Google Workspace migration | Stay on Microsoft 365 -- already in use, no reason to switch. |
| Multi-party contract signing | Single approval per artifact for v2.0. Revisit if co-signer workflow needed. |
| Building manager approval workflow | Document exchange only -- no sign-off or approval chain for v2.5 |
| Contractor messaging/chat | Contractors contact Liz directly -- portal is read-only job brief |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

### v1 Requirements (Complete)

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-05 | Phase 1 | Complete |
| PORT-01, PORT-02, PORT-03, PORT-04 | Phase 2 | Complete |
| SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-07 | Phase 2 | Complete |
| DSGN-01, DSGN-02, DSGN-03 | Phase 2 | Complete |
| SEO-01, SEO-02, SEO-03, SEO-04, SEO-05 | Phase 2 | Complete |
| CLNT-01, CLNT-02, CLNT-03 | Phase 3 | Complete |

### v2.0 Requirements (Client Portal Foundation)

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05 | Phase 5 | Complete |
| CLNT-04, CLNT-05 | Phase 5 | Complete |
| ENGMT-01 | Phase 5 | Complete |
| PROC-03 | Phase 5 | Complete |
| INFRA-07 | Phase 5 | Complete |
| INFRA-08 | Phase 5 | Deferred (Wix DNS limitation -- revisit at Phase 12) |
| CLNT-06, CLNT-07 | Phase 6 | Pending |
| MILE-01, MILE-02, MILE-03 | Phase 6 | Pending |
| PROC-01, PROC-02 | Phase 6 | Pending |
| ARTF-01, ARTF-02, ARTF-03, ARTF-04, ARTF-08, ARTF-09 | Phase 6 | Pending |
| PORT-05, PORT-06, PORT-07 | Phase 6 | Pending |
| POST-01, POST-02, POST-03, POST-04 | Phase 6 | Pending |

### v2.5 Requirements (Contractor & Commercial)

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENGMT-02, PRJT-01, PRJT-02 | Phase 7 | Pending |
| CONTR-01, CONTR-02, CONTR-05, CONTR-06, CONTR-07 | Phase 7 | Pending |
| BLDG-01 | Phase 7 | Complete |
| DOCS-01 | Phase 7 | Complete |
| CONTR-03, CONTR-04 | Phase 8 | Pending |
| BLDG-02, BLDG-03, BLDG-04, BLDG-05, BLDG-06 | Phase 8 | Complete |
| CVIS-01 | Phase 8 | Complete |

### v3.0 Requirements (AI Rendering & Go-Live)

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEND-01, SEND-02, SEND-03 | Phase 9 | Pending |
| ARTF-05, ARTF-06, ARTF-07 | Phase 9 | Pending |
| BOOK-01 | Phase 9 | Complete |
| SITE-08 | Phase 9 | Complete |
| RNDR-01, RNDR-02, RNDR-03 | Phase 10 | Pending |
| RNDR-06, RNDR-07 | Phase 10 | Pending |
| RNDR-04, RNDR-05 | Phase 11 | Pending |
| INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-06 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 21 total (all complete)
- v2.0 requirements: 31 total (Phases 5-6)
- v2.5 requirements: 18 total (Phases 7-8)
- v3.0 requirements: 20 total (Phases 9-12)
- Total: 90
- Unmapped: 0

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-17 after v3.0 roadmap created (20 requirements mapped to Phases 9-12)*

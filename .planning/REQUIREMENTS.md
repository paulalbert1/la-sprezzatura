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

## v2 Requirements

Requirements for milestone v2.0: Client Portal Platform + Go-Live.

### Authentication (AUTH)

- [ ] **AUTH-01**: Client receives a magic link email to access the portal -- no password or account creation -- Phase 5
- [ ] **AUTH-02**: Magic link grants a cookie-based session that persists across visits -- Phase 5
- [ ] **AUTH-03**: Authenticated client sees a dashboard of all their projects (active and historical) -- Phase 5
- [ ] **AUTH-04**: Artifact approvals, notes, and decisions are attributed to the authenticated client's identity; when signing off, primary contact confirms they are approving on behalf of all parties (checkbox) -- Phase 5
- [ ] **AUTH-05**: Unauthenticated visitors see a branded login page requesting their email -- no project data exposed -- Phase 5

### Client Data (CLNT)

- [ ] **CLNT-04**: Liz can create client records in Sanity with name, email, phone, address, and preferred contact method -- Phase 5
- [ ] **CLNT-05**: A client can have multiple projects and a project can have multiple clients; one client is designated as the primary contact -- Phase 5
- [ ] **CLNT-06**: Portal greets client by name and shows all their active and historical projects -- Phase 6
- [ ] **CLNT-07**: Active clients can view completed projects alongside current ones (e.g., living room done, bedroom in progress) -- Phase 6

### Milestones (MILE)

- [ ] **MILE-01**: Liz can define custom per-project milestones with name, date, and completion status in Sanity -- Phase 6
- [ ] **MILE-02**: Client sees milestone timeline with dates and completion indicators on the portal -- Phase 6
- [ ] **MILE-03**: The 6-stage pipeline is retained as high-level status alongside detailed milestones -- Phase 6

### Procurement (PROC)

- [ ] **PROC-01**: Liz can add procurement line items with name, status (Ordered/Warehouse/In Transit/Pending/Delivered/Installed), install date, client cost, retail price -- Phase 6
- [ ] **PROC-02**: Client sees procurement table on portal with statuses and savings (retail minus client cost) -- Phase 6
- [ ] **PROC-03**: All financial values stored as integer cents to prevent rounding errors -- Phase 5

### Project Artifacts (ARTF)

- [ ] **ARTF-01**: Liz can upload project artifacts of configurable types (proposal, floor plan, design board, contract, warranty, close document) -- Phase 6
- [ ] **ARTF-02**: Artifacts support revisions -- new versions are created, previous versions remain viewable but visually muted -- Phase 6
- [ ] **ARTF-03**: Client can review and select/approve artifact versions; non-selected versions are muted -- Phase 6
- [ ] **ARTF-04**: All selections, approvals, and decisions are recorded in a decision log with timestamps -- Phase 6
- [ ] **ARTF-05**: Proposal artifacts include an Investment Summary with designer-defined pricing tiers and line items -- Phase 7
- [ ] **ARTF-06**: Client selects their preferred investment tier; selections can evolve (mix items across tiers) -- Phase 7
- [ ] **ARTF-07**: Proposal approval includes a readiness check -- eagerness rating (1-5) and "any reservations?" capture -- Phase 7
- [ ] **ARTF-08**: Contract artifacts support upload of a signed version by the designer -- Phase 6
- [ ] **ARTF-09**: Client can provide notes/feedback on artifacts at review points -- Phase 6

### Portal Experience (PORT)

- [ ] **PORT-05**: Portal displays a confidentiality notice about not sharing the access link -- Phase 6
- [ ] **PORT-06**: Client can submit notes at appropriate workflow points (artifacts, milestones) -- Phase 6
- [ ] **PORT-07**: Portal shows all project artifacts with current status, version history, and decision log -- Phase 6

### Send Update (SEND)

- [ ] **SEND-01**: Liz can trigger "Send Update" from Sanity Studio via a document action on the project -- Phase 7
- [ ] **SEND-02**: Email includes current milestones, procurement status, pending artifact reviews, and an optional personal note from Liz -- Phase 7
- [ ] **SEND-03**: Every sent update is logged with timestamp and recipient on the project -- Phase 7

### Post-Project (POST)

- [ ] **POST-01**: After final milestone, Liz can generate a project close document (PDF) -- Phase 6
- [ ] **POST-02**: Liz can reopen a completed project for warranty work -- Phase 6
- [ ] **POST-03**: Liz can upload warranty items to a reopened project -- Phase 6
- [ ] **POST-04**: Client can submit a warranty claim through the portal on a reopened project -- Phase 6

### Booking (BOOK)

- [ ] **BOOK-01**: Contact page links to Fantastical Openings for booking, replacing Cal.com embed -- Phase 7

### Public Site Polish (SITE)

- [ ] **SITE-08**: Home page hero has enhanced visual impact with GSAP SplitText animation -- Phase 7

### Infrastructure (INFRA)

- [ ] **INFRA-07**: Rate limiter upgraded from in-memory to persistent storage for serverless -- Phase 5
- [ ] **INFRA-08**: Resend domain verified for lasprezz.com with SPF/DKIM coexisting with Microsoft 365 -- Phase 5
- [ ] **INFRA-01**: DNS consolidation -- all 4 domains (lasprezz.com, lasprezzaturany.com, lasprezzny.com, casadeolivier.com) to Cloudflare -- Phase 8
- [ ] **INFRA-02**: Email consolidation to @lasprezz.com on Microsoft 365 with SPF/DKIM/DMARC -- Phase 8
- [ ] **INFRA-03**: Professional email addresses: liz@lasprezz.com, info@lasprezz.com, paul@lasprezz.com -- Phase 8
- [ ] **INFRA-04**: Redirect consolidation -- secondary domains redirect to lasprezz.com -- Phase 8
- [ ] **INFRA-06**: Cloudflare DNS with SSL for all domains -- Phase 8

## Future Requirements

Deferred beyond v2.0. Tracked but not in current roadmap.

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

### v2 Requirements

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 5 | Pending |
| AUTH-02 | Phase 5 | Pending |
| AUTH-03 | Phase 5 | Pending |
| AUTH-04 | Phase 5 | Pending |
| AUTH-05 | Phase 5 | Pending |
| CLNT-04 | Phase 5 | Pending |
| CLNT-05 | Phase 5 | Pending |
| PROC-03 | Phase 5 | Pending |
| INFRA-07 | Phase 5 | Pending |
| INFRA-08 | Phase 5 | Pending |
| MILE-01 | Phase 6 | Pending |
| MILE-02 | Phase 6 | Pending |
| MILE-03 | Phase 6 | Pending |
| PROC-01 | Phase 6 | Pending |
| PROC-02 | Phase 6 | Pending |
| ARTF-01 | Phase 6 | Pending |
| ARTF-02 | Phase 6 | Pending |
| ARTF-03 | Phase 6 | Pending |
| ARTF-04 | Phase 6 | Pending |
| ARTF-08 | Phase 6 | Pending |
| ARTF-09 | Phase 6 | Pending |
| PORT-05 | Phase 6 | Pending |
| PORT-06 | Phase 6 | Pending |
| PORT-07 | Phase 6 | Pending |
| CLNT-06 | Phase 6 | Pending |
| CLNT-07 | Phase 6 | Pending |
| POST-01 | Phase 6 | Pending |
| POST-02 | Phase 6 | Pending |
| POST-03 | Phase 6 | Pending |
| POST-04 | Phase 6 | Pending |
| SEND-01 | Phase 7 | Pending |
| SEND-02 | Phase 7 | Pending |
| SEND-03 | Phase 7 | Pending |
| ARTF-05 | Phase 7 | Pending |
| ARTF-06 | Phase 7 | Pending |
| ARTF-07 | Phase 7 | Pending |
| SITE-08 | Phase 7 | Pending |
| BOOK-01 | Phase 7 | Pending |
| INFRA-01 | Phase 8 | Pending |
| INFRA-02 | Phase 8 | Pending |
| INFRA-03 | Phase 8 | Pending |
| INFRA-04 | Phase 8 | Pending |
| INFRA-06 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 21 total (all complete)
- v2 requirements: 43 total
- Mapped to phases: 43/43
- Unmapped: 0

**By phase:**
- Phase 5 (Data Foundation, Auth, and Infrastructure): 10 requirements
- Phase 6 (Portal Features): 20 requirements
- Phase 7 (Send Update, Investment Proposals, and Public Site Polish): 8 requirements
- Phase 8 (DNS Cutover and Go-Live): 5 requirements

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-16 after v2.0 roadmap creation (all 43 v2 requirements mapped)*

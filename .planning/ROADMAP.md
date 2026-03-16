# Roadmap: La Sprezzatura

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-03-15)
- 🚧 **v2.0 Client Portal Platform + Go-Live** - Phases 5-8 (in progress)

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

**Note:** v1.0 Phase 4 (DNS Cutover) was planned but not executed. Its requirements (INFRA-01 through INFRA-04, INFRA-06) are carried forward into v2.0 Phase 8.

### v2.0 Client Portal Platform + Go-Live (In Progress)

**Milestone Goal:** Expand the basic client portal into Liz's primary client operations tool -- per-project milestones, procurement tracking, artifact management with tiered budget proposals, client data model with magic-link auth, ad hoc update emails -- then polish the public site and go live via DNS cutover.

**Phase Numbering:**
- Integer phases (5, 6, 7, 8): Planned milestone work
- Decimal phases (5.1, 6.1): Urgent insertions (marked with INSERTED)

- [ ] **Phase 5: Data Foundation, Auth, and Infrastructure** - Client/project schemas, magic-link auth, rate limiter upgrade, and Resend domain verification
- [ ] **Phase 6: Portal Features** - Milestones, procurement, artifacts, post-project workflow, and portal UX on the authenticated portal
- [ ] **Phase 7: Send Update, Investment Proposals, and Public Site Polish** - Email capstone, tiered budget proposals, hero animation refresh, and Fantastical booking swap
- [ ] **Phase 8: DNS Cutover and Go-Live** - DNS consolidation to Cloudflare, email to lasprezz.com, domain redirects, and Wix replacement

## Phase Details

### Phase 5: Data Foundation, Auth, and Infrastructure
**Goal**: Clients can securely access the portal via magic link, the Sanity schema supports all v2.0 data (clients, milestones, procurement, artifacts), and email infrastructure is production-ready -- the foundation every subsequent phase builds on
**Depends on**: Phase 3 (v1.0)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, CLNT-04, CLNT-05, PROC-03, INFRA-07, INFRA-08
**Success Criteria** (what must be TRUE):
  1. A client enters their email on the portal login page, receives a magic link email, clicks it, and lands on a dashboard showing their projects -- no password or account creation involved
  2. The client closes their browser, reopens the portal URL days later, and is still logged in (cookie-based session persists)
  3. An unauthenticated visitor sees only a branded login page requesting their email -- no project names, statuses, or client data are visible
  4. Liz can create a client record in Sanity Studio with name, email, phone, address, and preferred contact method, and link that client to one or more projects
  5. Sending a test email from the verified send.lasprezz.com domain delivers successfully to Gmail, Outlook, and Yahoo inboxes with SPF/DKIM passing
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Portal Features
**Goal**: The authenticated portal is Liz's primary client communication tool -- clients see custom milestones with dates, a procurement table with savings, uploadable artifacts with version history and approval workflow, and post-project warranty access -- all managed by Liz through Sanity Studio
**Depends on**: Phase 5
**Requirements**: MILE-01, MILE-02, MILE-03, PROC-01, PROC-02, ARTF-01, ARTF-02, ARTF-03, ARTF-04, ARTF-08, ARTF-09, PORT-05, PORT-06, PORT-07, CLNT-06, CLNT-07, POST-01, POST-02, POST-03, POST-04
**Success Criteria** (what must be TRUE):
  1. A client logs in and sees a dashboard greeting them by name with all their active and completed projects; clicking a project shows custom milestones with dates and completion indicators, a procurement table with line-item statuses and total savings, and uploaded artifacts with version history
  2. Liz uploads a new version of a design board artifact in Sanity Studio; the client sees the new version as current and previous versions visually muted, and can approve/select versions with their decisions recorded in a timestamped log
  3. Liz marks the final milestone complete and generates a close document; the client sees the project as completed but can still access it, and Liz can later reopen it for warranty work that the client can submit through the portal
  4. The portal displays a confidentiality notice about not sharing the access link, and clients can submit notes at artifact review points and milestone checkpoints
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

### Phase 7: Send Update, Investment Proposals, and Public Site Polish
**Goal**: Liz can send branded email updates that snapshot the full portal state to clients, present tiered budget proposals (Best/Better/Good) that clients can customize, and the public site has a visually impactful hero and modern booking -- the final features before go-live
**Depends on**: Phase 6
**Requirements**: SEND-01, SEND-02, SEND-03, ARTF-05, ARTF-06, ARTF-07, SITE-08, BOOK-01
**Success Criteria** (what must be TRUE):
  1. Liz clicks "Send Update" on a project in Sanity Studio, adds an optional personal note, previews the email, confirms, and the client receives a branded email showing current milestones, procurement status, and pending artifact reviews -- the delivery is logged with timestamp and recipient on the project
  2. Liz creates a proposal artifact with Good/Better/Best tiers and line items; the client views the tiers on the portal, selects their preferred tier (or mixes items across tiers), and completes a readiness check with eagerness rating and reservations capture before approval
  3. A first-time visitor to the home page sees the hero text animate in with character-level GSAP SplitText animation creating a strong visual first impression
  4. The contact page links to Fantastical Openings for booking with no Cal.com embed or dead code remaining in the codebase
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: DNS Cutover and Go-Live
**Goal**: All 4 domains consolidated on Cloudflare with working Microsoft 365 email at lasprezz.com, domain redirects active, and lasprezz.com serving the new site from Vercel -- replacing Wix with minimal downtime and zero email disruption
**Depends on**: Phase 7
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Visiting lasprezz.com in a browser shows the new site (not Wix) with a valid HTTPS certificate
  2. Sending an email to liz@lasprezz.com delivers to her Microsoft 365 inbox with MX, SPF, DKIM, and DMARC all passing
  3. Visiting lasprezzaturany.com, lasprezzny.com, and casadeolivier.com in a browser redirects to lasprezz.com with HTTPS
  4. All 4 domains show Cloudflare as the authoritative nameserver (verified via dig or whois)
  5. Liz confirms she can send and receive email at liz@lasprezz.com, info@lasprezz.com, and paul@lasprezz.com within 1 hour of cutover
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7 -> 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Scaffold and Staging Deploy | v1.0 | 1/1 | Complete | 2026-03-14 |
| 2. Public Portfolio Site | v1.0 | 4/4 | Complete | 2026-03-14 |
| 3. Client Operations Portal | v1.0 | 2/2 | Complete | 2026-03-15 |
| 4. DNS Cutover and Go-Live | v1.0 | 0/1 | Deferred (moved to v2.0 Phase 8) | - |
| 5. Data Foundation, Auth, and Infrastructure | v2.0 | 0/? | Not started | - |
| 6. Portal Features | v2.0 | 0/? | Not started | - |
| 7. Send Update, Investment Proposals, and Public Site Polish | v2.0 | 0/? | Not started | - |
| 8. DNS Cutover and Go-Live | v2.0 | 0/? | Not started | - |

---
*Roadmap created: 2026-03-14*
*v1.0 shipped: 2026-03-15 (Phases 1-3)*
*v2.0 roadmap created: 2026-03-16*

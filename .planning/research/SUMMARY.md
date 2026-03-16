# Project Research Summary

**Project:** La Sprezzatura v2.0 -- Client Portal Platform
**Domain:** Interior design client operations portal (extending production portfolio site)
**Researched:** 2026-03-15
**Confidence:** HIGH

## Executive Summary

La Sprezzatura v2.0 transforms an existing production portfolio site (Astro 6, Sanity, Vercel) from a read-only client portal with a generic 6-stage pipeline into a full client operations platform. The specific goal is to replace the Canva PDFs and manual emails Elizabeth Olivier currently uses to communicate project milestones, procurement statuses, and budget proposals to luxury interior design clients spending $50K-200K. The existing stack is proven and deployed. v2.0 adds only two npm packages (@react-email/components and @react-email/render), one new environment variable (SANITY_WRITE_TOKEN), and unlocks GSAP plugins already bundled. Everything else is Sanity schema extensions, new Astro components, and a single new server action.

The recommended build strategy follows a strict dependency chain in five phases: (1) data foundation and email infrastructure first -- schemas must exist before any portal feature can read from them, and DNS records for Resend domain verification need propagation time; (2) portal display components that render milestones, procurement, and savings; (3) the "Send Update" email capstone that snapshots portal state and sends branded emails via Resend with delivery logging; (4) hero animation refresh and dead code cleanup; (5) budget proposals deferred to v2.x as the highest-complexity feature, validated after the core portal proves its value with real clients.

The top risks requiring Phase 1 prevention are: financial data stored as IEEE 754 floats producing rounding errors (store all currency as integer cents), email delivery failing silently because Resend sandbox only sends to the account owner (verify a custom domain before writing any Send Update code), and the project document becoming a schema monolith by absorbing all CRM fields (extract client as a separate document type, use field groups aggressively). Each risk has a specific prevention strategy that must be implemented before any downstream feature is built. The research is high-confidence across all four areas -- the stack is production-proven, features are derived from competitor analysis and direct workflow understanding, architecture extends existing patterns, and pitfalls are identified from codebase inspection and documented failure modes.

## Key Findings

### Recommended Stack

The v1.0 stack (Astro 6, Sanity 5.16+, React 19, Tailwind 4, GSAP 3.14, Resend, TypeScript, Biome, Vitest) is validated and unchanged. v2.0 adds minimal surface area: two packages, one env var.

**New additions only:**
- **@react-email/components + @react-email/render:** Build branded "Send Update" emails as composable React components instead of 160+ line inline HTML template literals. Compatible with React 19.2 and Tailwind 4 as of React Email 5.0.
- **SANITY_WRITE_TOKEN (env var):** Enables server-side mutations via the existing @sanity/client (v7.17.x). Used exclusively in Astro server actions to log email deliveries. No new package needed.
- **GSAP SplitText (already installed):** Free in GSAP 3.13+ (project is at 3.14.x). Character/word-level text animation for the hero refresh.

**Removed:**
- **@calcom/embed-react:** Dead dependency. Fantastical Openings replaced Cal.com and is link-only (no embed exists). Already swapped in production.

**What NOT to add:** No database (Sanity IS the database), no auth library (PURLs remain for v2.0), no PDF generation (browser print-to-PDF suffices), no chart libraries (data is tabular), no standalone Zod (Astro 6 includes it via astro:schema), no Lenis smooth scroll (GSAP ScrollSmoother is available if needed), no QuickBooks integration (not yet migrated from FreshBooks).

**Net change:** +2 packages, -1 package, +1 env var. Zero additional monthly costs.

### Expected Features

**Must have (table stakes -- replace Liz's manual Canva/email workflow):**
- **Client data model** -- phone, email, address, preferred contact per project. Foundation for all other features.
- **Custom per-project milestones** -- replace the generic 6-stage pipeline with dated entries like "Cabinet delivery: April 15" with Upcoming/Current/Completed status.
- **Procurement tracking** -- line items with vendor, status (Specifying through Installed), client cost, retail price.
- **Savings visibility** -- total retail vs. total client cost. The single best ROI communication feature: "You saved $4,200 on this project so far."
- **"Send Update" email** -- one-click branded email from Sanity Studio with portal snapshot, optional personal note, and delivery logging.
- **Home page hero refresh** -- GSAP SplitText character-level animation for stronger first impression.

**Should have (v2.0 differentiators):**
- **Budget proposals with tiered pricing** -- Good/Better/Best tiers with line items and portal display.
- **Update delivery audit trail** -- every email logged with timestamp, recipient, Resend message ID.
- **Enhanced PortalUrlDisplay** -- environment-aware URLs, last update date, copy-to-clipboard.
- **Branded portal experience** -- warm neutrals, editorial typography matching the public site. The portal IS a design artifact.

**Defer (v2.x/v3+):**
- Budget versioning (add after proposals are validated with a real client)
- QuickBooks integration (Liz has not yet migrated from FreshBooks)
- Selections approval workflow (unnecessary at 3-5 active projects)
- Client login/auth (PURLs with 24+ char tokens sufficient at current scale)
- In-portal messaging (email and phone work fine for a solo designer)
- PDF export of portal content (the portal IS the living document)
- File sharing (Canva handles visual deliverables, clients receive files via email)

### Architecture Approach

The portal remains a single SSR page at `/portal/[token]` composing section components (milestones, procurement, budget) from a single expanded GROQ query. All portal data renders server-side with zero client JavaScript shipped. The only new write path is the `sendUpdate` server action, which sends email via Resend and appends a log entry to Sanity via a write-capable client instance. Client data is a separate Sanity document type (one client can have multiple projects). Milestones, procurement items, and update logs stay as inline arrays on the project document -- they are tightly coupled to their project and never queried independently. This is validated against Sanity's documented limits: a project with 20 milestones, 50 procurement items, and 3 budget proposals uses roughly 200-300 attributes, well within the 1,000 attribute limit.

**Major components:**
1. **`client` schema (new)** -- separate document type for contact info, referenced by projects via Sanity reference
2. **`project` schema (extended)** -- adds milestones[], procurement[], budgetProposals[], updateLog[] as inline arrays, plus client reference replacing the plain clientName string
3. **Portal display components (new)** -- MilestoneTimeline v2 (custom milestones with dates), ProcurementTable (line items with status and savings), BudgetProposal (tiered display), composed in [token].astro
4. **`sendUpdate` server action (new)** -- fetch project + client via GROQ, render React Email template, send via Resend, log delivery via Sanity write client
5. **`sanity/mutations.ts` (new)** -- write-capable Sanity client instance (useCdn: false, write token) for server-side append operations only

### Critical Pitfalls

1. **Float currency storage produces rounding errors** -- Sanity's number type is IEEE 754 float. `3499.99 + 1250.50` can produce `4750.490000000001`. Store ALL financial values as integer cents (349999 not 3499.99). Add custom Studio input component for dollar display. Validate with `rule.integer().min(0)`. Perform arithmetic in the rendering layer only, never in GROQ. Must be decided in Phase 1 before any financial field is created -- retrofitting requires migrating every document.

2. **Email delivery fails silently without domain verification** -- Resend sandbox only delivers to the account owner's email. Sending to client addresses requires a verified custom domain. Use a subdomain (send.lasprezz.com) to avoid SPF record conflicts with Microsoft 365. Set up DNS records in Phase 1, before writing any Send Update code. Test delivery to Gmail, Outlook, and Yahoo specifically -- they reject unauthenticated messages at the SMTP level in 2026.

3. **Schema monolith degrades Studio editing** -- Adding milestones, procurement, budget, email logs, client contact info, and address data to the project document creates a 30+ field document with two different audiences. Extract client to a separate document type. Use Sanity field groups extensively (Portfolio, Portal, Milestones, Procurement, Proposals). Keep the project document focused.

4. **Budget proposals edited after sending create disputes** -- Sanity documents are mutable. A sent proposal that gets edited means the client and designer disagree on what was proposed. Model proposals with explicit version numbers and status fields (draft/sent/accepted/superseded). Make `sent` proposals read-only in Studio via conditional readOnly rules. New versions created via duplicate action.

5. **In-memory rate limiter ineffective on Vercel serverless** -- The existing Map-based rate limiters (there are two duplicate implementations) lose state across Lambda instances. Acceptable for v2.0 launch at low traffic with Vercel Fluid compute, but should be consolidated into one module and upgraded to Upstash Redis before financial data is exposed at scale.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Data Foundation and Email Infrastructure
**Rationale:** Every portal feature depends on the schema. Email infrastructure (Resend domain verification, SPF/DKIM DNS records) has 24-48 hour propagation delays. Starting both in Phase 1 means schemas are ready for Phase 2 components and email is ready for Phase 3 Send Update.
**Delivers:** Client document type, extended project schema (milestones, procurement, budgetProposals, updateLog fields with integer-cents financial storage), Sanity write client module, verified Resend sending domain, consolidated rate limiter, environment-aware PortalUrlDisplay, PURL token length increase to 24+ characters.
**Addresses features:** Client data model, schema design, financial data integrity, email infrastructure setup, code cleanup (duplicate rate limiter), Studio UX (field groups).
**Avoids pitfalls:** Schema monolith (separate client type), float currency (integer cents from day one), silent email failure (domain verified early), PortalUrlDisplay hardcoding (environment-aware URLs), PII without controls (document PII data map, review Sanity roles).
**Stack used:** Sanity built-in schema types, @sanity/client write token configuration, Resend domain verification.

### Phase 2: Portal Display Components
**Rationale:** With schemas in place and test data entered in Sanity Studio, build the visual portal. Display components have no external service dependencies and can be iterated visually. This is purely Astro SSR components consuming GROQ data.
**Delivers:** Rewritten MilestoneTimeline (custom milestones with actual dates replacing generic pipeline), ProcurementTable (line items with status badges, client cost, retail price, savings column, aggregate savings summary), expanded GROQ portal query, updated [token].astro page composition with section components.
**Addresses features:** Custom milestones, procurement tracking, savings visibility.
**Avoids pitfalls:** Client-side state management (keep everything SSR, zero JS shipped), over-fetching (use GROQ projections for only displayed fields), empty state handling (graceful rendering when a project has zero milestones or procurement items).
**Architecture pattern:** Portal as single-page SSR composition. No tabs, no sub-pages, no client-side routing.

### Phase 3: Send Update Email
**Rationale:** The capstone feature that reads from all portal data sources (milestones, procurement) and composes a branded snapshot email. Requires Phase 1 (schemas, write client, verified domain) and Phase 2 (portal display components define what "state" looks like) to be complete.
**Delivers:** React Email template for portal updates (milestone summary, procurement status, optional personal note), sendUpdate Astro server action, Sanity write-back for delivery logging (timestamp, recipient, Resend message ID), Sanity Studio document action button with email preview modal before sending.
**Addresses features:** Send Update email, delivery logging, update audit trail.
**Avoids pitfalls:** Silent email failures (delivery logging from day one, error surfaced to Liz in Studio), accidental sends (preview modal with confirm/cancel before sending), webhook-based triggers (explicit action button only, not fired on every document save), React Email template bloat (Gmail clips emails over 102KB -- keep templates concise).
**Stack used:** @react-email/components, @react-email/render, Resend SDK (existing), Sanity write client.

### Phase 4: Hero Refresh and Cleanup
**Rationale:** Fully independent of portal work. No dependencies on Phases 1-3. Can run in parallel with Phase 3 or after. Groups two independent public-site tasks into one coherent phase.
**Delivers:** GSAP SplitText hero text reveal animation (character-level stagger), removal of CalBooking.tsx component and @calcom/embed-react dependency, verified Fantastical Openings link-only integration on contact page.
**Addresses features:** Home page hero refresh, Cal.com dead code cleanup.
**Avoids pitfalls:** Fantastical embed assumption (link-only, no widget exists -- design CTA accordingly), GSAP cleanup on Astro View Transitions (use astro:before-swap event, already implemented in ScrollAnimations.astro).
**Stack used:** GSAP SplitText (already installed at 3.14.x), no new packages.

### Phase 5 (v2.x): Budget Proposals
**Rationale:** Highest-complexity feature with three levels of nested arrays (proposals > tiers > line items), versioning semantics, conditional read-only rules in Studio, and the most complex portal display component. Deferring until the core portal (milestones + procurement + Send Update) is validated with real clients provides a feedback loop before investing in the most complex feature. Trigger: Liz has a new client where she wants to present budget options digitally instead of via Canva PDF.
**Delivers:** Budget proposal display on portal (tiered Good/Better/Best view with line items and totals), proposal versioning (version number, status, immutability on sent proposals), budget summary section in Send Update email, "Previous versions" accordion on portal for transparency.
**Addresses features:** Budget proposals, budget versioning, tier selection tracking.
**Avoids pitfalls:** Mutable proposals (version + status model with conditional readOnly from the start), deeply nested array editing UX issues (research Sanity's behavior with 3 levels of nesting during planning).

### Phase Ordering Rationale

- **Schema before components:** GROQ queries cannot be written until fields exist. Components cannot be designed until data shape is known. Phase 1 must precede Phase 2.
- **Display before email:** The Send Update email snapshots the portal state. The portal display components define what that state looks like. Build the view first (Phase 2), then the snapshot (Phase 3).
- **Email infrastructure in Phase 1, not Phase 3:** DNS propagation for SPF/DKIM takes 24-48 hours. Starting domain verification in Phase 1 means it is verified and tested when Phase 3 coding begins. No blocking delay.
- **Budget proposals deferred to Phase 5:** Three levels of nested arrays, versioning semantics, conditional read-only rules, and the most complex display component. Shipping milestones + procurement + Send Update first gives Liz immediate value and provides real-world feedback before building the most complex feature.
- **Hero refresh is independent:** No portal dependency. Grouped with Cal.com cleanup into a coherent "public site polish" phase that can slot anywhere.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Send Update):** The Sanity Studio custom document action that calls an Astro server action endpoint (`/_actions/sendUpdate`) may need CORS configuration or a shared secret for authentication. The exact Studio document action plugin API for triggering external HTTP calls needs prototyping.
- **Phase 5 (Budget Proposals):** Conditional `readOnly` rules in Sanity for sent proposals need verification. The editing UX for three levels of nested arrays (proposals > tiers > line items) should be tested with real data before committing to the schema shape.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Data Foundation):** Sanity schema creation, reference types, field groups, write client configuration -- all well-documented with official examples and guides.
- **Phase 2 (Portal Display):** Astro SSR components consuming GROQ data, Tailwind styling. Extends the existing [token].astro page pattern already in production.
- **Phase 4 (Hero + Cleanup):** GSAP SplitText has extensive documentation, examples, and CodePen demos. Dependency removal is straightforward npm uninstall.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack is production-deployed. New additions (@react-email v1.0.8/v2.0.4, Sanity write token) verified against official npm packages and docs. Version compatibility confirmed: React Email 5.0 supports React 19.2 + Tailwind 4. Only 2 new packages. |
| Features | HIGH | Feature set derived from competitor analysis (Studio Designer, Mydoma, DesignFiles, Design Manager) and direct understanding of Liz's current manual workflow. Clear dependency chain documented. MVP vs. defer boundaries are crisp. |
| Architecture | HIGH | Extends existing production patterns (SSR portal page, Sanity schemas, server actions). Data modeling decision (inline arrays vs. separate documents) validated against Sanity's documented constraints (32MB document limit, 1000 attributes per document). Build order follows verified dependency chain. |
| Pitfalls | HIGH | Pitfalls identified from direct codebase inspection (duplicate rate limiters, hardcoded PortalUrlDisplay URL, 8-char tokens, float number fields) and documented failure patterns (IEEE 754 rounding in GROQ, Resend sandbox limitations, Sanity webhook false triggers). Prevention strategies are specific and phase-mapped. |

**Overall confidence:** HIGH

### Gaps to Address

- **Sanity Studio document action API for Send Update trigger:** The mechanism for a Studio button that calls an external Astro endpoint needs prototyping during Phase 3 planning. Determine whether to use a custom document action plugin (better UX, more complex) or an admin-only form rendered in the portal (simpler, less integrated).
- **PURL token migration:** Increasing token length from 8 to 24+ characters requires regenerating existing tokens. Liz must reshare portal links with any active clients. Coordinate timing with Phase 1 deployment.
- **Resend + Microsoft 365 DNS coexistence:** SPF record merging or subdomain isolation for transactional email alongside M365 corporate email needs exact DNS record validation during Phase 1. Subdomain approach (send.lasprezz.com) is recommended to avoid conflicts entirely.
- **Financial data access tiering:** Procurement costs and budget proposals visible via PURL may be a privacy concern for luxury clients. Evaluate during Phase 2 whether a lightweight verification step (email OTP) is needed before financial sections, or whether 24+ character PURL tokens provide adequate security for launch.
- **React Email vs. inline HTML for email templates:** Architecture research recommends inline HTML for consistency with existing contact form patterns. Stack research recommends React Email for composability of complex portal update emails (milestone tables, procurement summaries). Recommend resolving in favor of React Email given the template complexity -- but the architecture recommendation to extract shared email chrome into a helper function is valid regardless of approach.

## Sources

### Primary (HIGH confidence)
- [React Email 5.0 Release](https://resend.com/blog/react-email-5) -- Tailwind 4, React 19.2 support
- [@react-email/components npm](https://www.npmjs.com/package/@react-email/components) -- v1.0.8
- [@react-email/render npm](https://www.npmjs.com/package/@react-email/render) -- v2.0.4, async render
- [Sanity Mutation API](https://www.sanity.io/docs/http-reference/mutation) -- server-side write operations
- [Sanity Technical Limits](https://www.sanity.io/docs/content-lake/technical-limits) -- 32MB document size, 1000 attributes
- [Sanity: Deciding Fields and Relationships](https://www.sanity.io/docs/developer-guides/deciding-fields-and-relationships) -- inline vs. referenced data modeling
- [Sanity GROQ Data Types](https://www.sanity.io/docs/specifications/groq-data-types) -- float arithmetic imprecision warning
- [Sanity Number Type](https://www.sanity.io/docs/number-type) -- precision validation vs. storage behavior
- [Sanity Array Type](https://www.sanity.io/docs/studio/array-type) -- nested array restrictions
- [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction) -- custom domain requirements
- [Resend Email Authentication Guide](https://resend.com/blog/email-authentication-a-developers-guide) -- SPF/DKIM/DMARC
- [Microsoft 365 Email Authentication](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-about) -- subdomain for third-party senders
- [Fantastical Openings Help](https://flexibits.com/fantastical/help/openings) -- link-only scheduling, no embed
- [GSAP 3.13 Release](https://gsap.com/blog/3-13/) -- SplitText rewrite, now free
- [GSAP Free After Webflow Acquisition](https://webflow.com/blog/gsap-becomes-free) -- all plugins free
- [Astro Actions](https://docs.astro.build/en/guides/actions/) -- server action definitions
- Codebase inspection: src/actions/index.ts, src/lib/rateLimit.ts, src/sanity/schemas/project.ts, src/sanity/components/PortalUrlDisplay.tsx, src/lib/generateToken.ts

### Secondary (MEDIUM confidence)
- [Studio Designer Features](https://www.studiodesigner.com/features/client-portal/) -- competitor analysis
- [Mydoma Studio Features](https://mydomastudio.com/features/client-portal/) -- competitor analysis
- [DesignFiles Procurement](https://join.designfiles.co/features/interior-design-procurement-software/) -- competitor analysis
- [Design Manager Purchasing](https://www.designmanager.com/feature/purchasing) -- competitor analysis
- [Upstash Edge Rate Limiting](https://upstash.com/blog/edge-rate-limiting) -- serverless rate limiting alternative
- [Vercel Fluid Compute](https://vercel.com/blog/scale-to-one-how-fluid-solves-cold-starts) -- instance reuse mitigating in-memory state loss
- [Sanity Schema Best Practices](https://www.halo-lab.com/blog/creating-schema-in-sanity) -- modular schema patterns

---
*Research completed: 2026-03-15*
*Ready for roadmap: yes*

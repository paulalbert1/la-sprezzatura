# Feature Research

**Domain:** Interior design client operations portal (v2.0 -- extending existing portfolio site + basic portal)
**Researched:** 2026-03-15
**Confidence:** HIGH

## Context: What Already Exists

The v1.0 build delivered a complete public portfolio site and a basic client portal. This research focuses exclusively on the v2.0 client portal platform features. The existing foundation includes:

- **Public site:** Home, Portfolio (gallery + project pages + lightbox), Services, Process, About, Contact, Privacy
- **Contact form:** Resend email with auto-response and branded HTML templates
- **Booking:** Fantastical Openings link (already replaced Cal.com embed)
- **Basic portal:** PURL access (`/portal/[token]`), 6-stage pipeline (Discovery through Closeout), status badge, milestone timeline
- **Sanity schemas:** `project` (with `portalToken`, `portalEnabled`, `pipelineStage`, `clientName`), `service`, `siteSettings`
- **Infrastructure:** SSR on Vercel, rate limiting, generic 404 for invalid tokens

The v2.0 milestone transforms the portal from a read-only status page into Liz's primary client operations tool. The goal is to replace the Canva PDFs she currently sends clients for schedules, order summaries, and budget overviews, while Canva remains her tool for visual design boards and mood boards.

## Industry Landscape

Interior design project management is served by platforms costing $49-$159/month per user (DesignFiles $49, Mydoma $64, Studio Designer $72-$109, Houzz Pro $99-$159). These are all-in-one tools: CRM, procurement, invoicing, client portal, presentations, and accounting. La Sprezzatura does not need all-in-one. It needs the client-facing pieces -- status visibility, procurement tracking, budget presentation -- built into the custom platform Liz already uses, with Sanity as the single source of truth for all data.

The competitive advantage of a custom-built portal over SaaS platforms: the portal looks and feels like the La Sprezzatura brand (not a generic software UI), data lives in a system Paul controls, and there are no per-user monthly fees. The tradeoff is build time, which is acceptable given the existing Astro + Sanity foundation.

## Feature Landscape

### Table Stakes (Clients and Liz Expect These)

These features are table stakes because Liz currently delivers this information manually (via Canva PDFs and email). The portal must at minimum match her current manual process. Industry platforms all offer these. Missing any of them means the portal fails to reduce Liz's workload.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Client data model** (phone, email, preferred contact, address) | Liz needs client contact info stored with the project, not in her head or scattered across email threads. Every CRM and project management tool has this. | LOW | Extend existing `project` schema in Sanity with contact fields. Group in a "Client Details" tab in Studio. `preferredContact` as dropdown (Phone/Email/Text). Address as structured object (street, city, state, zip). This data feeds the "Send Update" feature. |
| **Custom per-project milestones with dates** | The current 6-stage generic pipeline (Discovery through Closeout) cannot represent real project timelines. Liz needs "Kitchen cabinets delivered 4/15" and "Tile installation starts 5/1" -- not just which of 6 phases the project is in. Clients ask "when?" not just "where?" | MEDIUM | Array of milestone objects in Sanity: `{title, date, status, notes}`. Status: Upcoming/In Progress/Complete. Replaces the fixed `STAGES` array in the portal view with project-specific milestones. Keep the overall pipeline stage as a separate high-level indicator. The MilestoneTimeline component gets rewritten to render dynamic milestones with actual dates. |
| **Line-item procurement tracking** | Furniture and fixture procurement is the core of an interior design project. Clients currently get Canva PDF order summaries. They want to know: "Has my sofa shipped? When does the lighting arrive?" Studio Designer, Design Manager, and Programa all have item-level procurement tracking. | MEDIUM | Array of procurement items in Sanity per project: `{itemName, vendor, status, clientCost, retailPrice, notes}`. Status values: Ordered / Warehouse / In Transit / Delivered / Installed / Pending. Display savings (retail - client cost) per item and in aggregate. Portal shows a clean table with status indicators. Liz updates statuses in Sanity Studio as items move through the pipeline. |
| **Budget proposals as versioned artifacts** | Liz currently creates tiered budget presentations in Canva. The industry standard is 2-3 budget tiers (Good/Better/Best or Bronze/Silver/Gold) so clients can choose their investment level, then customize. Proposify, Qwilr, and Studio Designer all support tiered proposals. This is how Liz already works -- the tool just needs to formalize it. | HIGH | Separate `budgetProposal` document type in Sanity, referenced by project. Each proposal has: version number, date, status (Draft/Presented/Selected/Archived), and 3 tiers. Each tier: name, total, and an array of line items `{category, item, cost, notes}`. When a client selects a tier, Liz marks it "Selected" and can then edit the line items as the project evolves. Portal displays the selected tier's breakdown. Versioning lets Liz create updated proposals without losing history. |
| **"Send Update" templated email** | Liz manually writes client update emails. This is the #1 time drain she wants eliminated. Studio Designer and Mydoma auto-generate client-facing project summaries. An email that snapshots the current portal state (milestones, procurement status, next steps) + an optional personal note gives clients a branded, information-rich update in one click from Sanity Studio. | HIGH | Custom Sanity Studio action (button in the document view) that: (1) renders a branded HTML email template with current project data (milestones, procurement summary, budget status), (2) appends Liz's optional note, (3) sends via Resend to the client's email, (4) logs the send in a `updateLog` array on the project document. Uses the same branded email style as the existing contact form auto-response. Delivery logging is critical -- Liz needs to know what she sent and when. |

### Differentiators (Competitive Advantage)

Features that elevate the La Sprezzatura portal beyond what SaaS platforms offer, or that are notably absent from competing small-studio operations.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Savings visibility in procurement** | Most procurement tools show cost to client. Showing retail price alongside client cost and the savings delta gives clients a tangible, ongoing reminder of the value of working with a designer. "You saved $4,200 on this project so far." This is a trust-builder that SaaS platforms do not emphasize because they are designer-facing, not client-facing. | LOW | Already part of the procurement line items. Add a summary row: total retail, total client cost, total savings. Format as currency. This is the single best ROI communication feature in the portal. |
| **Branded portal experience** | SaaS portals (Studio Designer, Mydoma) look like software. The La Sprezzatura portal looks like the La Sprezzatura website -- warm neutrals, editorial typography, generous whitespace. Every client interaction reinforces the brand. The portal IS a design artifact. | LOW | Already partially achieved with PortalLayout. Extend the design language to procurement tables, milestone timelines with dates, and budget displays. The custom build makes this possible; SaaS platforms never will. |
| **Update email with delivery logging** | Most small studios send ad hoc emails with no record. The "Send Update" feature creates an audit trail: what was communicated, when, with what project state. This protects Liz ("I sent you the update on March 3rd showing the chairs were in transit") and gives clients confidence. | MEDIUM | The `updateLog` array on the project document: `{sentAt, recipientEmail, note, snapshotSummary}`. `snapshotSummary` is a short text string generated at send time (e.g., "6 of 12 items delivered, 3 milestones complete"). Viewable in Sanity Studio. Not shown in client portal -- this is for Liz's records. |
| **One-click portal link in Sanity** | The existing `PortalUrlDisplay` custom component already shows the PURL in Sanity Studio. Extending this to show last update sent, client last viewed (if possible), and a quick "Copy link" + "Send Update" button turns the Sanity project document into a client operations dashboard. | LOW | Enhance the existing `PortalUrlDisplay` React component in Sanity Studio. Add last-sent date from `updateLog`. Copy-to-clipboard already works. |
| **Budget proposal versioning** | Most platforms let you create a proposal. Few make it easy to create v2 after the client says "I like tier 2 but can we swap the dining table?" Versioning means Liz creates a new version, the old one is archived, and the client always sees the current active proposal. No confusion about "which PDF was the latest?" | MEDIUM | The `budgetProposal` document has a `version` number and `status`. Only one proposal per project can be status=Selected at a time. Previous versions are status=Archived and still accessible in Sanity Studio for reference. The portal always shows the Selected version. |
| **Home page hero visual refresh** | While not a portal feature, refreshing the hero section with more visual impact and animation raises the bar for the public-facing site. First impressions matter for client acquisition. | MEDIUM | GSAP-powered hero with parallax imagery, text reveal animations, and more editorial visual treatment. Builds on the existing GSAP ScrollTrigger infrastructure. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build in v2.0.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full invoicing / payment in portal** | "Clients should pay through the portal." | QuickBooks handles invoicing. Rebuilding payment processing (Stripe, ACH) in a custom portal is weeks of work with PCI compliance implications. QuickBooks already sends professional invoices with payment links. Duplicating this is not worth the complexity. | Add a "View Invoice" link in the portal that deep-links to the QuickBooks payment page. Or display invoice status (Paid/Outstanding) read from QuickBooks via Zapier. Do not process payments. |
| **Selections approval workflow** | "Clients should approve/decline items in the portal." | Approval workflows need notification systems, conflict resolution (what if the client declines everything?), comment threads, and revision tracking. This is a full SaaS feature. Liz's current process is a phone call or email -- which works at her project volume (3-5 active). | Show procurement items with their status. For approvals, Liz sends a Canva mood board and discusses on a call. Formalize approvals only if client volume exceeds what personal communication can handle. |
| **Real-time procurement status sync** | "Item statuses should update automatically from vendors." | No vendor API exists for this. Design Manager and Studio Designer require manual status updates too. Automated sync would require per-vendor integrations with companies that do not offer APIs. | Liz updates statuses in Sanity Studio when she gets shipping notifications. Manual but simple and reliable. The portal reflects whatever Sanity has. |
| **Client login / password system** | "As we add more features, clients need accounts." | Still not justified at 3-5 active projects. PURLs work. Password resets, forgotten passwords, and account management create support burden. The PURL token is already 22 characters of random base62 -- brute-force infeasible. | Stay with PURLs for v2.0. Evaluate magic link auth (Clerk) only if client count exceeds 10+ concurrent projects or if sensitive financial data is exposed in the portal. |
| **Client messaging / chat in portal** | "Clients should be able to message through the portal." | Chat creates an expectation of immediate response. Liz is a solo designer, not a support team. Unread message indicators create anxiety on both sides. | Email and phone remain the communication channels. The "Send Update" feature handles outbound. Inbound goes through normal email. |
| **PDF export of portal content** | "Clients should be able to download a PDF of their project status." | PDF generation from dynamic HTML is fragile, ugly, and a maintenance burden. Libraries like Puppeteer or wkhtmltopdf are heavy dependencies. | The portal IS the living document. The "Send Update" email serves as a snapshot. If a client needs a paper record, they can print the portal page (add print-friendly CSS, which is trivial). |
| **Drag-and-drop reordering of milestones** | "Liz should drag milestones to reorder." | Complex Sanity Studio customization for a feature used rarely. Milestones are typically created once and updated as dates change, not frequently reordered. | Milestones render in date order. Add an `order` field as a fallback for milestones without dates. Sanity's default array UI with move up/down handles the rare reorder case. |

## Feature Dependencies

```
Client Data Model (contact fields on project)
    |-- required by --> Send Update (needs client email address)
    |-- required by --> Budget Proposal (needs client to present to)

Custom Per-Project Milestones
    |-- requires --> Project schema extension (array of milestone objects)
    |-- displayed in --> Portal page (replaces generic pipeline timeline)
    |-- included in --> Send Update email (milestone summary)

Procurement Tracking
    |-- requires --> Project schema extension (array of procurement items)
    |-- displayed in --> Portal page (item table with statuses)
    |-- included in --> Send Update email (procurement summary)
    |-- enhances --> Savings Visibility (retail vs client cost math)

Budget Proposals
    |-- requires --> New budgetProposal document type in Sanity
    |-- requires --> Reference from project to budgetProposal(s)
    |-- displayed in --> Portal page (selected tier breakdown)
    |-- included in --> Send Update email (budget overview)
    |-- enhances --> Budget Versioning (archive old, activate new)

Send Update Email
    |-- requires --> Client Data Model (email address to send to)
    |-- requires --> Resend integration (already exists for contact form)
    |-- requires --> React Email template (branded HTML)
    |-- requires --> Custom Sanity Studio action (button + UI)
    |-- reads from --> Milestones, Procurement, Budget (for snapshot)
    |-- writes to --> Update Log (delivery record on project)

Fantastical Openings Booking
    |-- replaces --> Cal.com link (already done -- contact page uses Fantastical link)
    |-- independent of --> Portal features
    |-- note: Already implemented. Fantastical Openings is link-based only (no embed/iframe).

Home Page Hero Refresh
    |-- requires --> GSAP (already installed)
    |-- independent of --> Portal features
    |-- enhances --> Public site visual impact
```

### Dependency Notes

- **Client Data Model is the foundation.** Send Update cannot work without an email address on the project. Build this first.
- **Milestones, Procurement, and Budget are parallel workstreams.** They all extend the project schema but are independent of each other. Can be built and shipped incrementally.
- **Send Update is the capstone.** It reads from all other features (milestones, procurement, budget) to compose the email. Build it last after the data sources exist.
- **Budget Proposals are the highest-complexity feature.** A separate document type with versioning, tier structure, and line items. Start with a simple single-version approach if time is tight; add versioning as an enhancement.
- **Fantastical booking is already done.** The contact page already links to Fantastical Openings. No embed exists (Fantastical is link-only, not embeddable like Cal.com was). Confirm this is acceptable or add a styled booking section around the external link.
- **Home page hero is fully independent.** Can be done in any order. No dependencies on portal work.

## MVP Definition

### Launch With (v2.0 Core)

The minimum to make the portal operational for Liz's current clients. These features replace the Canva PDFs and manual email updates.

- [ ] **Client data model** -- phone, email, preferred contact, address per project. Foundation for everything else.
- [ ] **Custom milestones with dates** -- per-project milestones replace the generic 6-stage pipeline in the portal view. Liz creates milestones like "Cabinet delivery: April 15" instead of picking from a fixed list.
- [ ] **Procurement tracking** -- line items with status, client cost, retail price. Portal shows a clean table. Liz updates in Sanity Studio.
- [ ] **Savings visibility** -- total retail vs total client cost, savings amount. Automatic from procurement data.
- [ ] **Send Update email** -- one-click branded email from Sanity Studio with portal snapshot + optional note + delivery log.
- [ ] **Home page hero refresh** -- more visual impact for the public site.

### Add After Validation (v2.x)

Features to add once the core portal is in use with real clients.

- [ ] **Budget proposals** -- tiered pricing artifacts. Add after milestones and procurement are stable, because budget proposals reference many of the same items. Trigger: Liz has a new client where she wants to present options digitally instead of via Canva PDF.
- [ ] **Budget versioning** -- multiple proposal versions per project. Trigger: Liz needs to revise a presented budget and keep history.
- [ ] **Update log visible in Sanity Studio** -- browsable history of all "Send Update" emails per project. Immediate implementation logs the data; polished Sanity UI to browse logs can come later.
- [ ] **Print-friendly portal CSS** -- `@media print` stylesheet for clients who want a paper copy of their project status.

### Future Consideration (v3+)

Features to defer until the portal has proven its value with real clients.

- [ ] **QuickBooks integration** -- display invoice status in portal. Defer until Liz has migrated from FreshBooks to QuickBooks and the accounting workflow is stable.
- [ ] **Selections approval workflow** -- in-portal approve/decline of materials and furniture. Defer until client volume exceeds what phone/email can handle.
- [ ] **File sharing in portal** -- mood boards, floor plans, contracts. Defer because Canva handles visual deliverables well and clients already receive files via email.
- [ ] **Magic link authentication** -- passwordless login via email. Defer until concurrent project count exceeds 10+ or portal contains financially sensitive data.
- [ ] **Client-initiated messaging** -- in-portal communication. Defer indefinitely; email and phone work.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Client data model | HIGH | LOW | P1 |
| Custom per-project milestones | HIGH | MEDIUM | P1 |
| Procurement tracking (line items) | HIGH | MEDIUM | P1 |
| Savings visibility | HIGH | LOW | P1 |
| Send Update email | HIGH | HIGH | P1 |
| Home page hero refresh | MEDIUM | MEDIUM | P1 |
| Budget proposals (tiered) | HIGH | HIGH | P2 |
| Budget versioning | MEDIUM | MEDIUM | P2 |
| Update log in Sanity Studio | MEDIUM | LOW | P2 |
| Print-friendly portal CSS | LOW | LOW | P2 |
| QuickBooks integration | MEDIUM | HIGH | P3 |
| Selections approval workflow | MEDIUM | HIGH | P3 |
| File sharing in portal | MEDIUM | MEDIUM | P3 |
| Magic link auth | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v2.0 -- features that replace Liz's manual Canva + email workflow
- P2: Should have, add when the core portal is stable and in use
- P3: Future consideration, evaluate based on real usage patterns

## Competitor Feature Analysis

| Feature | Studio Designer ($72-109/mo) | Mydoma ($64-99/mo) | DesignFiles ($49-69/mo) | Design Manager ($varies) | La Sprezzatura v2.0 |
|---------|-----|-----|-----|-----|-----|
| Client portal | Full-featured: approvals, payments, project tracking | Branded hub: presentations, approvals, invoices, messaging | Client collaboration: presentations, contracts, portal | Not client-facing; designer-side only | PURL-based: milestones, procurement, budget, branded to match site |
| Procurement tracking | Full PO management, vendor communication, receiving reports | Product sourcing with markup | Product sourcing, PO generation | Enterprise PO management with receiving, warehousing, CFA tracking | Line-item tracking with status, cost, retail, savings. Manual update by Liz. |
| Budget/proposals | Proposals via portal, PDF, or interactive docs | Branded presentations with approval | Templates with e-signature | Detailed cost tracking with markup | Tiered proposals (Good/Better/Best) with versioning. Portal displays selected tier. |
| Client communication | Portal notifications, email | In-portal messaging, email | Email notifications | Reports only (no client portal) | "Send Update" branded email with portal state snapshot + delivery logging |
| Milestone tracking | Phase-based project management | Task-based project tracking | Task tracking with deadlines | Project scheduling | Custom per-project milestones with dates, status, and notes |
| Item status tracking | Ordered/Received/Delivered with dates | Basic status tracking | Order tracking | Ship date, receive date, CFA date, quantity tracking | Ordered/Warehouse/In Transit/Delivered/Installed/Pending |
| Cost to designer | $72-109/mo per user | $64-99/mo per user | $49-69/mo per user | Custom pricing | $0/mo (custom built, Sanity free tier, Resend free tier) |

**Key insight:** La Sprezzatura's portal does not need to match SaaS feature depth. It needs to match the information clients receive today (via Canva PDFs) in a better format (a living portal page), while reducing Liz's time spent creating and sending those PDFs. The SaaS platforms solve for 20-person firms with multiple project managers. La Sprezzatura solves for one designer with 3-5 active projects who wants to look polished and save time.

## Sources

- [Studio Designer - Client Portal](https://www.studiodesigner.com/features/client-portal/) -- client-facing features: approvals, payments, project tracking
- [Studio Designer - Procurement](https://www.studiodesigner.com/features/interior-design-procurement/) -- propose, source, procure workflow
- [Design Manager - Purchasing](https://www.designmanager.com/feature/purchasing) -- PO management, item status tracking, receiving reports
- [Design Manager - Purchase Order Status](https://www.designmanager.com/blog/dm-tips-purchase-order-status-window) -- ship date, receive date, CFA tracking fields
- [DesignFiles - Procurement Software](https://join.designfiles.co/features/interior-design-procurement-software/) -- PO generation, budget tracking, client collaboration
- [Mydoma Studio - Client Portal](https://mydomastudio.com/features/client-portal/) -- branded client hub, approvals, invoices, messaging
- [Programa - Procurement](https://programa.design/interior-design-procurement-software) -- FF&E management, specification sheets
- [Interior Design Pricing Packages - DesignFiles Blog](https://blog.designfiles.co/interior-design-pricing-packages/) -- tiered pricing strategies
- [Interior Design Proposal Presentation - Programa Blog](https://programa.design/blog/interior-design-proposal-presentation) -- proposal best practices
- [Fantastical Openings Help](https://flexibits.com/fantastical/help/openings) -- link-based scheduling, no embed support
- [Fantastical Scheduling](https://flexibits.com/fantastical/scheduling) -- Zapier integration, conference call support
- [Interior Design Procurement Process - Designed for the Creative Mind](https://www.designedforthecreativemind.com/blog/what-is-the-interior-design-procurement-process-behind-the-scenes-series) -- status tracking: ordered, shipped, received, delivered, installed
- [Inventory Management for Interior Designers - Design Logistics Group](https://www.designlogisticsgroup.net/post/inventory-management-for-interior-designers-best-practices-checklist) -- warehouse management, receiving best practices
- [Sanity Docs - Object Type](https://www.sanity.io/docs/studio/object-type) -- nested object patterns for Sanity schemas
- [Sanity Docs - Schema Field Types](https://www.sanity.io/docs/schema-field-types) -- array and reference field best practices
- [Sanity Docs - Fields and Relationships](https://www.sanity.io/docs/developer-guides/deciding-fields-and-relationships) -- nested vs referenced document patterns
- [Client Email Templates for Interior Designers - IDCO Studio](https://www.idco.studio/client-email-templates) -- communication templates and best practices
- [Resend - Email Templates](https://resend.com/docs/dashboard/emails/email-templates) -- templated email with variable substitution
- [React Email](https://github.com/resend/react-email) -- React component-based email templates

---
*Feature research for: La Sprezzatura v2.0 Client Portal Platform*
*Researched: 2026-03-15*

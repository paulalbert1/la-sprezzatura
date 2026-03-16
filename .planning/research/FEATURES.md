# Feature Research

**Domain:** Interior design contractor portal, building manager portal, and engagement type system (v2.5 — extending v2.0 client portal foundation)
**Researched:** 2026-03-16
**Confidence:** HIGH

## Context: What v2.5 Adds

v2.0 delivered the client portal: magic link auth, client data model, custom milestones, procurement tracking, artifacts, engagement types on the project schema. v2.5 extends the platform into the contractor and commercial workflows that Full Interior Design projects require.

The three new surfaces:

1. **Contractor portal** — Magic link access for trades and installers. Full Interior Design projects only. Contractors see what they need to do their job; nothing more.
2. **Building manager portal** — Magic link access for commercial property managers. Commercial projects only. Document exchange for COIs and legal requirements.
3. **Residential vs Commercial toggle** — A project-level classification that controls which features and portal types are enabled.

The engagement type field (`Full Interior Design / Styling & Refreshing / Carpet Curating`) was added to the project schema in v2.0. v2.5 uses that field to gate the contractor portal.

---

## Prior Research (v2.0 — Already Built or In-Flight)

The following features are out of scope for this research. They are documented in the archived v2.0 FEATURES.md context:

- Client portal with magic link auth
- Client data model (contact, address, preferred contact)
- Custom per-project milestones with dates
- Procurement tracking with savings visibility
- Project artifacts and approval workflow
- Send Update email
- Engagement type enum on project schema

---

## Contractor Portal

### What Contractors Actually Need

Research into Buildertrend's subcontractor portal, construction industry norms, and the specific context (Liz as a solo designer coordinating trades) produces a clear, minimal information model. Contractors are non-technical, access the portal infrequently, and have one job: show up prepared.

Industry standard: contractors get job location, scope, schedule, and documents. They do NOT get client contact information (that creates a situation where the contractor bypasses the GC/designer). Buildertrend's model is the clearest reference — subs see job info and documents but never internal pricing or client contact details.

### Table Stakes (Contractors Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Job address** | Contractors need to know where to show up. Standard in every construction portal. | LOW | Display project address. Source from client data model (already on project schema in v2.0). Do NOT show client name in a way that invites direct contact. Show "Project at [address]" — address only, no client name. |
| **Scope of work** | Defines exactly what the contractor is hired to do. Without this, every site visit starts with a negotiation. | LOW | Rich text field on project in Sanity (`contractorScope`). Liz writes this per contractor engagement. Renders as formatted text in the portal. |
| **Floor plans** | Contractors need the layout to plan their work. Standard document in any renovation. | MEDIUM | File upload field(s) on the project document in Sanity. PDFs and images. Display with a lightbox or direct PDF link in the portal. Reuse the artifacts infrastructure from v2.0 or add a dedicated `contractorDocs` array. |
| **Deadline / key dates** | When the work needs to be done. Prevents "I didn't know the timeline" disputes. | LOW | One or more date fields: `contractorStartDate`, `contractorDeadline`. Optionally pull from the custom milestones already on the project. Display as a clear date block, not buried in prose. |
| **Project notes** | Site-specific instructions, access codes, parking, building rules, material locations, etc. Liz writes these; contractors read them. | LOW | Plain text or rich text field (`contractorNotes`) in Sanity. Separate from scope of work — scope is the job; notes are the logistics. |
| **Estimate visibility (designer-controlled)** | Contractors want to know what they'll be paid. The portal needs to show either the agreed final number or a PDF attachment — whichever Liz provides. | LOW | Two-mode field: Liz either enters a final number (`estimateAmount`) OR attaches a PDF (`estimatePdf`). Only one is shown at a time. The portal shows whichever is populated. Never show itemized internal costs — only the contractor-facing figure. |
| **Next steps** | What action does the contractor take after reading the portal? Keeps things moving without Liz having to follow up. | LOW | Short text field (`contractorNextSteps`) — e.g., "Call Liz to confirm material delivery date before starting." Free text, Liz writes it. |

### Differentiators (What Makes This Better Than a PDF)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"Refer to Liz" directive** | Makes the privacy model explicit. The portal is not a client contact sheet — it's a job brief. Displaying a prominent "Questions? Contact Liz" line with Liz's number eliminates any ambiguity about who the contractor communicates with. | LOW | Hard-coded text in the portal layout, not configurable. Always present. Liz's business phone/email pulled from `siteSettings` in Sanity. |
| **Magic link access (no account)** | Contractors do not have accounts or passwords to manage. Liz sends a link; they click it; they see the job. Appropriate for people who are on a job site with a phone, not at a desk. | MEDIUM | Extend the existing magic link auth system from v2.0. Generate a contractor-specific token on the project document. Different URL path from client portal: `/contractor/[token]`. Token scoped to contractor view — cannot access client portal data even with URL manipulation. |
| **Branded but minimal UI** | The portal looks like La Sprezzatura, not a generic construction app. First impression for a contractor: this designer runs a tight operation. | LOW | Reuse PortalLayout and design tokens. Strip out client-specific sections (milestones, procurement, budget). Show only the contractor data model fields. Clean, direct, no clutter. |
| **Document download without login friction** | Floor plans and PDFs should open or download immediately on link click. Contractors do not want to navigate a file system. | LOW | Direct file URLs from Sanity CDN. Display as a prominent button: "Download Floor Plans (PDF)". No multi-level navigation. |

### Anti-Features (Do Not Build for Contractor Portal)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Client contact information** | "Contractors need to reach the client directly sometimes." | This is exactly what Liz does not want. It creates a situation where contractors negotiate scope or schedule changes directly with the client, bypassing Liz. Liz coordinates everything. | Display "Questions? Contact Liz: [phone]" prominently. The message is: all project communication goes through the designer. |
| **Contractor-to-designer messaging in portal** | "Contractors should be able to ask questions through the portal." | Adds notification complexity and an expectation of real-time response. Liz does not want another inbox. Contractors can text or call — that's how trades work. | Show Liz's contact info. Contractors call or text. Keep it simple. |
| **Contractor accounts / profiles** | "Store contractor info, past jobs, ratings." | This is contractor CRM territory. Out of scope for a single-designer studio managing 3-5 projects. The portal is a job brief, not a contractor management system. | Contractors are managed as people Liz knows. The portal is per-project, not per-contractor. |
| **Change order workflow** | "Contractors should submit change orders through the portal." | Full change order management (submission, review, pricing, approval) is an enterprise construction feature. Adds weeks of complexity. | Changes are handled via phone/email between Liz and the contractor, as they are today. |
| **Photo upload by contractor** | "Contractors should document their work in the portal." | Adds storage management, review workflow, and notification complexity. Liz visits the site; she takes photos herself. | Not built. Contractors email photos if needed. |
| **Contractor-side estimate submission / bidding** | "Contractors should submit bids through the portal." | Bid management is pre-engagement. The portal is for active, engaged contractors. Bids happen via email and phone, as they do today. | Portal only shows confirmed, active contractor information. |

---

## Building Manager Portal

### What Building Managers Actually Need

NYC commercial renovations require COI collection before work begins. Building managers are gatekeepers: they must see that the contractor has appropriate insurance coverage and that the design firm's work complies with building-specific legal requirements. They do not need to see detailed project budgets or client procurement lists.

Key finding from NYC COI research: building managers require the contractor to name the building/management company as "additionally insured" on the COI. They want to see general liability ($1-2M), workers' comp, and sometimes umbrella coverage. The ACORD 25 form is the standard document format.

Building managers are professional property administrators, not Liz's clients. The portal serves them as a document drop and communication channel, not a project status dashboard.

### Table Stakes (Building Managers Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Client / project identification** | Building managers need to know which tenant/unit the work is for. They manage many units simultaneously. | LOW | Show: building address, unit or suite number, client name (unlike the contractor portal, the building manager is a professional stakeholder who needs to know whose project this is), project type, designer name and contact info. |
| **COI document section** | The COI is the primary document a building manager needs before approving any contractor work. This is the whole reason the portal exists. | MEDIUM | A dedicated `cois` array on the project document: `{contractor, insuranceCompany, policyNumber, expirationDate, coverageTypes[], documentFile}`. Upload in Sanity. Portal displays as a list with expiration dates and a download button per COI. If a COI is expired, show a visual warning. |
| **Legal documents section** | Building-specific forms, compliance letters, alteration agreements. Varies by building but all commercial renovations require some form of paperwork. | MEDIUM | Generic `legalDocs` array on the project: `{docType, description, uploadedAt, file}`. Liz uploads whatever the building requires. Portal displays as a download list. No workflow — just document hosting and download. |
| **Designer / firm contact info** | Building managers need to reach Liz directly for questions, not the client. | LOW | Hard-coded from `siteSettings`. Always present. Include: firm name, designer name, phone, email. |
| **Contractor info section (on request)** | Building managers sometimes need to verify contractor credentials directly. Not always required upfront — they may ask for it. | LOW | Show contractor name and license number if populated on the project. This is the one place the contractor's business identity is visible. Not the same as the contractor portal — this is for the building manager's verification purposes. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **COI expiration awareness** | A COI that expires mid-project is a compliance failure. Showing expiration dates prominently, with a visual warning for expired or soon-to-expire certificates, keeps the building manager informed and prevents work stoppages. | LOW | Compare `expirationDate` against current date. Show a red "Expired" or yellow "Expiring soon (< 30 days)" badge next to each COI. No automated reminders — just visual state in the portal. Liz sees the same badges in Sanity Studio. |
| **Magic link access, no account required** | Building managers do not want another system login. One link per project, shared by Liz when the project is ready. Professional, low-friction. | MEDIUM | Same magic link infrastructure as client and contractor portals. Third token type: `buildingManagerToken`. Separate URL path: `/building/[token]`. Scoped to only the building manager view — cannot access client or contractor portal data. |
| **Clean document download experience** | Building managers are downloading documents to print, email, or file. Every document should be immediately downloadable as a PDF with one click. No preview-first flows. | LOW | Direct CDN links for all uploaded files. Label each document clearly by type. "Download COI — [Contractor Name] (expires [date])" is the button text. |

### Anti-Features (Do Not Build for Building Manager Portal)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Approval workflow (manager approves documents)** | "The building manager should approve COIs before work begins." | Approval workflows require notifications, status tracking, re-upload flows, and audit trails. This is a full compliance management product. La Sprezzatura does not need to replicate TrustLayer or myCOI. The portal is a document drop, not a compliance platform. | Liz manages approval conversations over email and phone. The portal provides the documents. Approvals happen outside the system. |
| **Document request feature** | "The building manager should be able to request specific documents through the portal." | Creates a task management layer: requests, notifications, fulfillment tracking. Adds complexity for a very rare interaction pattern. Liz handles 3-5 commercial projects at most. | Building managers email or call Liz to request documents. Liz uploads to Sanity and re-shares the portal link. |
| **Building manager messaging in portal** | "The building manager should be able to ask questions in the portal." | Same problem as contractor messaging: creates an inbox Liz did not ask for. Building managers are professionals who will email or call. | Contact info for Liz is always visible. Communication is out-of-band. |
| **Multi-project view for building managers** | "A building in NYC might have multiple La Sprezzatura projects." | Building managers with multiple active projects would theoretically benefit from a dashboard. But this is a theoretical problem — the reality is Liz has 3-5 total active projects, likely 1-2 commercial. Building-level dashboards are enterprise CRM features. | One portal link per project. If the same building manager oversees two projects, they get two links. Simple. |

---

## Engagement Type System (Residential vs Commercial Toggle)

### What This Controls

The engagement type is already on the project schema from v2.0. v2.5 adds a second axis: residential vs commercial project classification. Together these two fields gate which portal views and data fields are available:

| Classification | Contractor Portal | Building Manager Portal | COIs Required | Legal Docs Section |
|----------------|------------------|------------------------|---------------|--------------------|
| Full Interior Design, Residential | YES | NO | NO | NO |
| Full Interior Design, Commercial | YES | YES | YES | YES |
| Styling & Refreshing, Residential | NO | NO | NO | NO |
| Styling & Refreshing, Commercial | NO | YES | YES | YES |
| Carpet Curating, Residential | NO | NO | NO | NO |
| Carpet Curating, Commercial | NO | YES | YES | YES |

Key decisions embedded in this matrix:
- Contractor portal is Full Interior Design only (because only Full Interior Design projects involve installation and trade coordination)
- Building manager portal is commercial only (building managers are irrelevant for residential)
- COIs and legal docs are commercial only (residential homes do not require COI submission to a building manager)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Residential vs Commercial field on project** | The system needs to know which project type it is to show/hide the right portal views and fields in Sanity Studio. Without this, the contractor and building manager portal logic cannot be conditionalized. | LOW | Add `projectType` field to the Sanity project schema: `enum('residential', 'commercial')`. Default: residential. Single select. |
| **Conditional field display in Sanity Studio** | When `projectType = residential`, the building manager section should not appear in Sanity Studio. When `engagementType != 'fullInteriorDesign'`, the contractor section should not appear. This reduces clutter for Liz — she should only see fields that are relevant. | MEDIUM | Use Sanity's `hidden` callback on field definitions: `hidden: ({document}) => document?.projectType !== 'commercial'`. Apply to: `buildingManagerToken`, `cois`, `legalDocs`, and the building manager section group. Similarly, gate contractor fields on engagement type. |
| **Portal routing by token type** | Each token type (client, contractor, building manager) must route to a different portal view with different data. The system must not allow token confusion — a contractor token cannot accidentally render a client view. | LOW | Token type is embedded in the token schema or derived from which field it matches. Check order: `portalToken` → client view, `contractorToken` → contractor view, `buildingManagerToken` → building manager view. If none match: generic 404. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Schema-driven gating (no code flags)** | Field visibility and portal feature availability are controlled by Sanity document data, not hardcoded feature flags. Adding a new commercial project automatically reveals the building manager fields in Studio. No code changes needed to enable features for a new project. | MEDIUM | The `hidden` callbacks on Sanity fields and conditional rendering in the portal components both read from the same project document fields. Single source of truth in Sanity. |
| **Engagement type controls UX depth throughout** | `Styling & Refreshing` and `Carpet Curating` projects do not need milestones in the same depth as Full Interior Design. Showing a simplified portal view for lower-engagement projects lets Liz tailor the client experience without separate portal templates. | LOW | In the client portal, use `engagementType` to show/hide sections. For Styling & Refreshing: show milestones and artifacts, but skip procurement and budget. For Carpet Curating: show milestones only (deadline and delivery). This is a progressive disclosure pattern — the same portal template adapts to complexity level. |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Sub-types for each engagement** | "Carpet Curating could be residential or commercial." | The current scope has Carpet Curating as a simpler residential engagement. Adding a residential/commercial axis to all three engagement types creates 6 combinations, most of which are theoretical. Complexity ahead of actual need. | Default Carpet Curating and Styling & Refreshing to residential behavior unless the project is explicitly commercial. The commercial toggle is sufficient to activate building manager features regardless of engagement type. |
| **Public-facing engagement type filter on portfolio** | "Visitors should filter portfolio by engagement type." | Engagement types are internal business categories, not visitor-facing language. "Carpet Curating" means nothing to a prospective client browsing a portfolio. | Keep portfolio filtering by room type (kitchen, living room, office) — language visitors understand. Engagement types stay internal. |

---

## Feature Dependencies

```
Residential/Commercial Toggle (projectType field)
    |-- required by --> Building Manager Portal (commercial only)
    |-- required by --> COI section visibility (commercial only)
    |-- required by --> Legal docs section visibility (commercial only)
    |-- required by --> Conditional field display in Sanity Studio

Engagement Type (already exists from v2.0)
    |-- required by --> Contractor Portal (Full Interior Design only)
    |-- required by --> Contractor section visibility in Sanity Studio
    |-- controls --> Portal section depth (milestones/procurement/artifacts shown per type)

Magic Link Auth System (v2.0)
    |-- extended by --> Contractor token generation (contractorToken field)
    |-- extended by --> Building Manager token generation (buildingManagerToken field)
    |-- required by --> Contractor Portal route (/contractor/[token])
    |-- required by --> Building Manager Portal route (/building/[token])

Client Data Model — Address (v2.0)
    |-- required by --> Contractor Portal (shows project address)

Project Milestones (v2.0)
    |-- optionally displayed in --> Contractor Portal (key dates / deadline)

Contractor Portal
    |-- requires --> projectType (address) from Client Data Model
    |-- requires --> contractorToken on project document
    |-- requires --> engagementType = 'fullInteriorDesign'
    |-- reads --> contractorScope, contractorNotes, contractorNextSteps, estimateAmount/Pdf
    |-- reads --> contractorDocs (floor plans, PDFs)
    |-- does NOT read --> client contact info, procurement data, budget data

Building Manager Portal
    |-- requires --> projectType = 'commercial'
    |-- requires --> buildingManagerToken on project document
    |-- reads --> cois[], legalDocs[], client name + address, contractor name + license
    |-- does NOT read --> procurement data, budget data, client phone/email

COI Section
    |-- requires --> projectType = 'commercial'
    |-- lives on --> project document in Sanity (cois[] array)
    |-- displayed in --> Building Manager Portal
    |-- displayed in --> Sanity Studio (for Liz to manage)

Legal Docs Section
    |-- requires --> projectType = 'commercial'
    |-- lives on --> project document in Sanity (legalDocs[] array)
    |-- displayed in --> Building Manager Portal
    |-- displayed in --> Sanity Studio (for Liz to manage)
```

### Dependency Notes

- **v2.0 magic link auth is the foundation for both portals.** The contractor and building manager portals are the same auth pattern with different token fields and different rendered views. Do not build a separate auth system — extend the existing token infrastructure.
- **Address from v2.0 client data model feeds the contractor portal.** The contractor needs to know where to go. This is already on the project document from v2.0.
- **The engagement type field from v2.0 gates the contractor portal.** No additional schema work needed to determine if contractor features should be enabled — check `engagementType === 'fullInteriorDesign'`.
- **The new residential/commercial toggle is the only schema addition with broad implications.** It unlocks the building manager portal, COI section, and legal docs. Add it to the project schema early in the phase.
- **Contractor and building manager portals are parallel, not dependent on each other.** A commercial Full Interior Design project uses both. A commercial Styling & Refreshing project uses only the building manager portal. They share infrastructure (magic links, layout) but are independent views.

---

## MVP Definition

### Launch With (v2.5 Core)

The minimum to make contractor and commercial workflows operational.

- [ ] **Residential/commercial toggle** (`projectType` field) — gating mechanism for everything commercial. Without it, the building manager portal cannot be conditionalized. Build first.
- [ ] **Contractor portal** — `/contractor/[token]` route. Shows: address, scope, floor plans, deadline, notes, estimate, next steps, "refer to Liz" contact. Magic link token generation in Sanity. Gated on `engagementType = fullInteriorDesign`.
- [ ] **Building manager portal** — `/building/[token]` route. Shows: client name + address, COI list with download links and expiration badges, legal docs download list, designer contact info, contractor name/license. Magic link token generation in Sanity. Gated on `projectType = commercial`.
- [ ] **COI document management in Sanity** — `cois[]` array on project document with contractor name, expiration date, file upload. Conditional display in Studio on `projectType = commercial`.
- [ ] **Legal docs in Sanity** — `legalDocs[]` array on project document with doc type, description, file. Conditional display in Studio.
- [ ] **Client sees contractor on-site schedule** — Small addition to the client portal: when `contractorToken` is populated, show contractor name and on-site dates in the milestones section. Clients know who is coming and when. This was explicitly called out in the v2.5 requirements.

### Add After Validation (v2.5+)

- [ ] **COI expiration alerts to Liz** — Email or Sanity Studio notification when a COI is within 30 days of expiring. Currently only visual badges in the portal. Add alerts once the COI workflow is established and Liz knows which contractors run long projects.
- [ ] **Contractor portal with milestone pull-through** — Instead of separate `contractorStartDate`/`contractorDeadline` fields, pull from the custom milestones already on the project and filter for milestones tagged as contractor-relevant. More powerful but requires milestone tagging — defer until the milestone system is proven in production.

### Future Consideration (v3+)

- [ ] **Building manager multi-project view** — If Liz regularly works in the same commercial building, a landing page that lists all active projects in that building for the same building manager contact. Premature at current project volume.
- [ ] **COI renewal workflow** — Automated reminder emails to contractors when COIs are near expiration. Requires contractor email storage and Resend integration extension. Only worth building if commercial project volume increases.
- [ ] **Contractor bid submission** — Pre-engagement portal for contractors to submit estimates. Only relevant if Liz moves to a formal bidding process.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Residential/commercial toggle (`projectType`) | HIGH | LOW | P1 |
| Contractor portal (scope, floor plans, deadline, estimate) | HIGH | MEDIUM | P1 |
| Building manager portal (COIs, legal docs, contact info) | HIGH | MEDIUM | P1 |
| COI document section in Sanity + portal | HIGH | LOW | P1 |
| Legal docs section in Sanity + portal | MEDIUM | LOW | P1 |
| Client sees contractor on-site schedule | MEDIUM | LOW | P1 |
| Conditional field display in Sanity Studio | MEDIUM | LOW | P1 |
| COI expiration visual badges | MEDIUM | LOW | P1 |
| Engagement type controls portal section depth | MEDIUM | MEDIUM | P2 |
| COI expiration alerts to Liz | LOW | MEDIUM | P2 |
| Contractor portal with milestone pull-through | LOW | MEDIUM | P3 |
| Building manager multi-project view | LOW | HIGH | P3 |
| COI renewal workflow to contractors | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v2.5 launch — features that deliver contractor and commercial workflows
- P2: Add once v2.5 is stable and in use with real projects
- P3: Future consideration, evaluate based on actual commercial project volume

---

## Competitor Feature Analysis

| Feature | Buildertrend (residential construction) | Procore (commercial construction) | Studio Designer (interior design) | La Sprezzatura v2.5 |
|---------|---|---|---|---|
| Contractor / sub portal | Full: schedule, documents, bids, RFIs, selections, messaging | Full: submittals, RFIs, change orders, drawings, daily logs | Not a contractor-facing tool | Minimal: scope, floor plans, deadline, estimate, notes. No messaging, no bid management. |
| Client info visibility for subs | Explicitly hidden: subs see job address, not client contact | Access-controlled per user role | N/A | Address only. "Refer to Liz" for all communication. |
| Document sharing | File folders, permission-based access | Drawing log with version control | File sharing via portal | Direct download links: floor plans, estimate PDF. Flat list, no folders. |
| Building manager / compliance | Not applicable (residential focus) | Submittal tracking, RFI, inspection | Not built | COI document list with expiration dates, legal docs, download links. No approval workflow. |
| COI management | Not built | COI tracking via integrations | Not built | COI array with expiration date display. Visual badges for expired/expiring. No automated tracking. |
| Engagement type gating | Not applicable | Not applicable | Not applicable (all-or-nothing) | Full Interior Design gates contractor portal. Commercial gates building manager. Same platform, different surfaces per project type. |
| Cost to designer | $499-$799/mo | $375+/mo | $72-109/mo | $0/mo additional (extends existing Sanity + Vercel + Resend stack) |

**Key insight:** Buildertrend and Procore solve for large teams with dozens of active subs and formal compliance workflows. La Sprezzatura's contractor portal is intentionally minimal — a digital job brief, not a project management system. The competitive advantage is that it exists at all (most single-designer studios share PDFs via email), it looks like the La Sprezzatura brand, and it lives in the same system as everything else.

---

## Sources

- [Buildertrend - Subcontractor Overview](https://buildertrend.com/help-article/subcontractor-overview/) — what subs see in the portal; confirmation that client contact info is explicitly hidden from subs
- [Buildertrend - Sub Portal Job Information](https://helpcenter.buildertrend.net/en/articles/4274896-sub-portal-job-information) — job address, notes, project manager contact visible to subs
- [Buildertrend - Subcontractor Software](https://buildertrend.com/communication/subcontractor-software/) — scope of work, documents, schedule features
- [COI Requirements for NY Projects - BGES Group](https://bgesgroup.com/certificate-of-insurance-coi-requirements-for-ny-projects-a-contractors-guide) — NY-specific: general liability $1M/$2M, workers' comp statutory, additional insured endorsements required, ACORD 25 standard form
- [NYC Building COI Requirements - Avant-Garde Moving](https://www.avantgardemoving.com/blog/nyc-building-rules-coi-requirements-essential-guide) — building managers require contractor to name building as additional insured; submit before work begins
- [Brick Underground - COI in NYC](https://www.brickunderground.com/live/whats-a-certificate-of-insurance-nyc) — COI workflow for NYC residential buildings; same pattern applies to commercial
- [Vendor COI Guide - GetJones](https://getjones.com/blog/vendor-certificate-of-insurance-guide/) — COI fields: insured name, coverage types, limits, expiration date, certificate holder
- [Top COI Tracking Software 2025 - Vertikal RMS](https://www.vertikalrms.com/article/best-coi-tracking-software-2025-top-coi-platforms-for-contractors/) — enterprise COI tracking landscape; confirms manual upload + display is the baseline for small firms
- [What is COI in CRE - Visitt](https://visitt.io/glossary/certificate-of-insurance-coi) — building manager's role: collecting COIs from every party interacting with the property
- [Magic Links Guide - Postmark](https://postmarkapp.com/blog/magic-links) — magic links best practices: expiration, one-time use, email deliverability
- [Magic Links for Contractors - Descope](https://www.descope.com/blog/post/magic-link-uses) — use case: supplier/vendor portals where partners access infrequently; eliminates password support burden
- [Full-Service Interior Design - KED Interiors](https://www.kedinteriors.com/blog-2-1/what-full-service-interior-design-really-includes-and-why-its-not-la-carte) — Full Interior Design scope: space planning, procurement, contractor coordination, installation oversight
- [Interior Styling vs Interior Design - L+P](https://www.lp-interiors.com/blog/interior-styling-vs-interior-design) — Styling: no contractor coordination, no construction. Confirms engagement type drives whether a contractor portal is needed.
- [Commercial vs Residential Interior Design - Blackwell & Jennings](https://www.blackwellandjennings.com/blog/what-are-the-differences-between-residential-and-commercial-interior-design) — commercial adds: building codes, stricter material specs, COIs, stakeholder complexity (building manager, property owner, tenant)
- [Sanity - Hidden Callback Docs](https://www.sanity.io/docs/conditional-fields) — `hidden` callback on field definitions for conditional display in Studio

---
*Feature research for: La Sprezzatura v2.5 — Contractor Portal, Building Manager Portal, Residential/Commercial Workflows*
*Researched: 2026-03-16*

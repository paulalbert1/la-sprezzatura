# Architecture Research

**Domain:** Client operations portal expansion for existing Astro 6 + Sanity interior design studio platform
**Researched:** 2026-03-15
**Confidence:** HIGH

## System Overview (v2.0)

```
                      VISITOR / CLIENT BROWSER
                                |
                  +-------------+---------------+
                  |             |               |
          PUBLIC SITE    CLIENT PORTAL     SANITY STUDIO
          (prerender)    (SSR, PURL)       (/admin)
          /             /portal/[token]
          /portfolio
          /services
          /contact
                  |             |               |
                  +------+------+-------+-------+
                         |              |
              +---------------------+   |
              |  ASTRO 6 (VERCEL)   |   |
              |  output: "server"   |   |
              |                     |   |
              |  src/pages/         |   |
              |  src/actions/       |   |
              |  src/lib/           |   |
              +--+------+------+---+   |
                 |      |      |       |
           +-----+  +---+--+  +--+    |
           |        |      |   |      |
        SANITY   RESEND   (v2)  |   Sanity Cloud
        (Read)   (Email)  Send  |   (Write via
                  Update  |     |    Studio UI)
                          |     |
                   Fantastical  Cloudflare
                   Openings     (DNS/CDN)
                   (external
                    link)
```

### What Changes from v1.0 to v2.0

| Area | v1.0 (Current) | v2.0 (Target) | Change Type |
|------|----------------|---------------|-------------|
| Sanity schemas | 3 types: project, service, siteSettings | 4 types: project (extended), client (new), service, siteSettings | New type + modified type |
| Portal page | Single SSR page showing pipeline stage + generic timeline | Multi-section SSR page: milestones, procurement, budget proposals | Modified page (significant) |
| GROQ queries | Simple portal token lookup returning 3 fields | Rich portal query returning client, milestones, procurement, proposals | Modified query |
| Server actions | 1 action: submitContact | 2 actions: submitContact, sendUpdate | New action |
| Email templates | Contact form notification + auto-response (inline HTML) | Add portal update email template | New template |
| Sanity Studio | Basic project editing, 2 field groups (content, portal) | Extended project editing, 3+ field groups, client document management | Modified config |
| Contact page | Cal.com embed component + Fantastical link | Fantastical link only (remove Cal.com) | Modified page (simplification) |
| Portal components | 3: PortalLayout, StatusBadge, MilestoneTimeline | 6+: add ProcurementTable, BudgetProposal, UpdateSection | New components |

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `project` schema (extended) | Portfolio content + portal operations: milestones, procurement, budget proposals, update log | Sanity document type with field groups: content, portal, milestones, procurement, proposals |
| `client` schema (new) | Client contact info: name, email, phone, address, preferred contact method | Sanity document type, referenced by project |
| Portal page `/portal/[token]` | Render full portal dashboard from GROQ data | Astro SSR page with expanded component tree |
| `sendUpdate` action (new) | Compose + send branded email snapshot of portal state to client, log delivery | Astro server action calling Resend + writing log entry to Sanity via mutation API |
| Portal components (new) | Render milestones, procurement table, budget proposals in portal | Astro components consuming GROQ-fetched data |
| Contact page (modified) | Remove Cal.com embed, keep Fantastical link | Remove CalBooking.tsx import, remove @calcom/embed-react dep |

## Data Modeling Decisions

This is the most critical architectural decision for v2.0. Each feature needs a clear answer: inline array on the project document, or separate document type with references?

### Decision Framework Applied

Sanity's guidance: use separate document types when content needs independent management, filtering, or growth potential. Use inline objects when the structure serves a narrow, supporting purpose within its parent.

For La Sprezzatura, the decision factor is **Liz's editing UX**. She manages one project at a time in Sanity Studio. Procurement items, milestones, and budget tiers are meaningless outside their parent project. They will never be queried independently ("show all milestones across all projects" is not a use case). Inline arrays keep everything on one editing screen, which is simpler for a non-technical user.

**Exception:** Client data. A client may have multiple projects over time. Client contact info (phone, email, address) should not be duplicated across projects. A separate `client` document type with a reference from `project` is the right call.

### Sanity Technical Constraints Verified

- Max document size: 32 MB (HIGH confidence -- verified via official docs)
- Max attributes per document: 1,000 on free/growth plans (HIGH confidence)
- Arrays cannot contain arrays directly (must wrap in objects) (HIGH confidence)
- An interior design project with 20 milestones, 50 procurement items, and 3 budget proposals will use roughly 200-300 attributes -- well within limits

### Recommended Data Model

#### 1. `client` Document Type (NEW)

```typescript
// src/sanity/schemas/client.ts
defineType({
  name: "client",
  title: "Client",
  type: "document",
  fields: [
    { name: "name", type: "string", title: "Client Name" },
    { name: "email", type: "string", title: "Email" },
    { name: "phone", type: "string", title: "Phone" },
    { name: "preferredContact", type: "string", title: "Preferred Contact Method",
      options: { list: ["email", "phone", "text"] } },
    { name: "address", type: "object", title: "Address", fields: [
      { name: "street", type: "string" },
      { name: "city", type: "string" },
      { name: "state", type: "string" },
      { name: "zip", type: "string" },
    ]},
  ],
})
```

**Rationale:** Separate document because a client may have multiple projects. Contact info changes once, updates everywhere. Liz manages clients as first-class entities in Studio.

#### 2. `project` Schema Extensions (MODIFIED)

Add to existing project schema in the `portal` field group:

```typescript
// New field: reference to client document
defineField({
  name: "client",
  title: "Client",
  type: "reference",
  to: [{ type: "client" }],
  group: "portal",
}),

// Replace pipelineStage with custom milestones
defineField({
  name: "milestones",
  title: "Project Milestones",
  type: "array",
  group: "portal",
  of: [{
    type: "object",
    name: "milestone",
    title: "Milestone",
    fields: [
      { name: "title", type: "string", title: "Milestone" },
      { name: "targetDate", type: "date", title: "Target Date" },
      { name: "completedDate", type: "date", title: "Completed Date" },
      { name: "status", type: "string", title: "Status",
        options: { list: ["upcoming", "current", "completed"] },
        initialValue: "upcoming" },
      { name: "description", type: "text", title: "Description", rows: 2 },
    ],
    preview: {
      select: { title: "title", subtitle: "status" },
    },
  }],
}),

// Procurement line items
defineField({
  name: "procurement",
  title: "Procurement Items",
  type: "array",
  group: "portal",
  of: [{
    type: "object",
    name: "procurementItem",
    fields: [
      { name: "item", type: "string", title: "Item" },
      { name: "vendor", type: "string", title: "Vendor" },
      { name: "status", type: "string", title: "Status",
        options: { list: [
          { title: "Specifying", value: "specifying" },
          { title: "Ordered", value: "ordered" },
          { title: "In Transit", value: "in-transit" },
          { title: "Delivered", value: "delivered" },
          { title: "Installed", value: "installed" },
        ]}},
      { name: "costPrice", type: "number", title: "Cost Price" },
      { name: "retailPrice", type: "number", title: "Retail Price" },
      { name: "notes", type: "text", title: "Notes", rows: 2 },
    ],
    preview: {
      select: { title: "item", subtitle: "status" },
    },
  }],
}),

// Budget proposals as versioned snapshots
defineField({
  name: "budgetProposals",
  title: "Budget Proposals",
  type: "array",
  group: "portal",
  of: [{
    type: "object",
    name: "budgetProposal",
    fields: [
      { name: "version", type: "string", title: "Version Label",
        description: "e.g., 'Initial Proposal', 'Revised March 2026'" },
      { name: "createdAt", type: "datetime", title: "Date Created" },
      { name: "tiers", type: "array", title: "Tiers", of: [{
        type: "object",
        name: "budgetTier",
        fields: [
          { name: "tierName", type: "string", title: "Tier Name",
            description: "e.g., Best, Better, Good" },
          { name: "totalAmount", type: "number", title: "Total Amount" },
          { name: "description", type: "text", title: "Description", rows: 3 },
          { name: "lineItems", type: "array", title: "Line Items", of: [{
            type: "object",
            fields: [
              { name: "category", type: "string", title: "Category" },
              { name: "amount", type: "number", title: "Amount" },
              { name: "notes", type: "string", title: "Notes" },
            ],
          }]},
          { name: "selected", type: "boolean", title: "Client Selected",
            initialValue: false },
        ],
      }]},
    ],
    preview: {
      select: { title: "version", subtitle: "createdAt" },
    },
  }],
}),

// Update delivery log
defineField({
  name: "updateLog",
  title: "Update Delivery Log",
  type: "array",
  group: "portal",
  readOnly: true,
  of: [{
    type: "object",
    name: "updateEntry",
    fields: [
      { name: "sentAt", type: "datetime", title: "Sent At" },
      { name: "recipientEmail", type: "string", title: "Sent To" },
      { name: "note", type: "text", title: "Note Included" },
      { name: "resendId", type: "string", title: "Resend Message ID" },
    ],
    preview: {
      select: { title: "sentAt", subtitle: "recipientEmail" },
    },
  }],
}),
```

**Rationale for inline arrays instead of separate documents:**

| Data | Decision | Why |
|------|----------|-----|
| Milestones | Inline array on project | Never queried cross-project. 5-15 items per project. Editing milestones in context of their project is the natural workflow. |
| Procurement items | Inline array on project | Same reasoning. 10-50 items per project. Liz manages procurement per project, not globally. |
| Budget proposals | Inline array on project | Versioned snapshots are snapshots *of this project*. 2-5 proposals per project max. Each contains tier sub-objects. |
| Update log | Inline array on project | Append-only audit trail. Written by server action, read-only in Studio. Never needs independent management. |
| Client | **Separate document** | Reused across projects. Contact info is independently managed. Natural "client list" view in Studio. |

**Note on nested arrays:** Budget proposals contain tiers, which contain line items -- that is arrays within arrays within arrays. Sanity does not allow direct array nesting, but this works because the arrays contain **objects** that themselves have array fields. This is the documented workaround and is fully supported.

### pipelineStage Field: Keep or Remove?

**Keep it.** The `pipelineStage` field serves a different purpose than custom milestones. Pipeline stage is a high-level categorical status (Discovery, Procurement, etc.) that drives the status badge. Custom milestones are the granular tasks within and across those stages. The portal can display both: the stage badge at the top, and the detailed milestone timeline below.

However, consider making it **derived from milestones** in the future -- for now, keeping both as independent fields is simpler and avoids complex computed-field logic in Sanity.

## Recommended Project Structure (v2.0 Changes)

```
src/
├── actions/
│   └── index.ts                  # MODIFIED: add sendUpdate action
├── components/
│   ├── portal/
│   │   ├── PortalLayout.astro    # existing (minor updates)
│   │   ├── StatusBadge.astro     # existing (no change)
│   │   ├── MilestoneTimeline.astro  # MODIFIED: custom milestones, not generic stages
│   │   ├── ProcurementTable.astro   # NEW: line items with status/cost/savings
│   │   ├── BudgetProposal.astro     # NEW: tiered budget display
│   │   ├── SendUpdateForm.astro     # NEW: (or .tsx if needs interactivity)
│   │   └── UpdateLog.astro          # NEW: delivery history display
│   ├── contact/
│   │   ├── ContactForm.tsx       # existing (no change)
│   │   └── CalBooking.tsx        # REMOVE (replaced by Fantastical link)
│   └── ...                       # existing components unchanged
├── lib/
│   ├── portalStages.ts           # existing -- keep for backward compat, may deprecate
│   ├── rateLimit.ts              # existing (no change)
│   ├── generateToken.ts          # existing (no change)
│   └── email/                    # NEW: email template builders
│       └── portalUpdate.ts       # HTML template for portal update emails
├── pages/
│   ├── portal/
│   │   └── [token].astro         # MODIFIED: expanded to render all portal sections
│   ├── contact.astro             # MODIFIED: remove Cal.com, Fantastical link already there
│   └── ...                       # existing pages unchanged
├── sanity/
│   ├── schemas/
│   │   ├── project.ts            # MODIFIED: add milestones, procurement, proposals, updateLog, client ref
│   │   ├── client.ts             # NEW: client document type
│   │   ├── index.ts              # MODIFIED: register client schema
│   │   ├── service.ts            # existing (no change)
│   │   └── siteSettings.ts       # existing (no change)
│   ├── queries.ts                # MODIFIED: expand portal query, add client queries
│   ├── mutations.ts              # NEW: server-side write operations (update log append)
│   ├── components/
│   │   └── PortalUrlDisplay.tsx  # existing (no change)
│   └── image.ts                  # existing (no change)
└── styles/
    └── global.css                # existing (may add portal-specific utility classes)
```

### Structure Rationale

- **`sanity/mutations.ts` (new):** Server-side write operations require a Sanity client initialized with a write token (`SANITY_API_TOKEN` with editor/write permissions). This is separate from the read-only `sanity:client` provided by `@sanity/astro`. The mutation module creates a second client with write credentials, used only in server actions. The write token must never be exposed to the client.

- **`lib/email/portalUpdate.ts` (new):** The contact form action already has inline HTML email templates. For portal updates, extract email template building into a dedicated module. Use the same inline HTML approach (not React Email -- avoids adding a dependency for a single template). The template function accepts the portal state snapshot and returns HTML.

- **Portal components split by concern:** Each portal section (milestones, procurement, proposals) gets its own Astro component. The `[token].astro` page composes them. This keeps individual components testable and the page file manageable.

- **No new pages added:** All portal features render on the single `/portal/[token]` page. Adding sub-routes (`/portal/[token]/procurement`) would be premature -- the data volume does not justify navigation, and a single-page portal is simpler for clients.

## Architectural Patterns

### Pattern 1: Sanity Write-Back from Astro Server Actions

**What:** When the "Send Update" action runs, it needs to append an entry to the project's `updateLog` array in Sanity. This requires server-side mutations using the Sanity client with a write token.

**When to use:** Any time Astro needs to write data back to Sanity (logging, status updates, timestamps). Currently the only write path from the Astro app -- all other Sanity writes happen through Studio.

**Trade-offs:** Introduces a second Sanity client (write-capable) alongside the read-only one from `@sanity/astro`. Requires a new environment variable (`SANITY_API_WRITE_TOKEN`). The write token has broad permissions, so it must be used only in server actions, never in client-side code. This is a narrow, well-contained pattern -- one action, one mutation.

**Implementation:**

```typescript
// src/sanity/mutations.ts
import { createClient } from "@sanity/client";

// Write-capable client for server-side mutations only
const writeClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2026-03-15",
  token: import.meta.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

export async function appendUpdateLog(
  projectId: string,
  entry: { sentAt: string; recipientEmail: string; note: string; resendId: string }
) {
  return writeClient
    .patch(projectId)
    .setIfMissing({ updateLog: [] })
    .append("updateLog", [{ _type: "updateEntry", _key: crypto.randomUUID(), ...entry }])
    .commit();
}
```

### Pattern 2: Snapshot Email via Server Action

**What:** The "Send Update" action captures the current portal state, renders it into a branded HTML email, sends it via Resend, and logs the delivery. This is a server action (like the existing `submitContact`), not an API endpoint.

**When to use:** Liz clicks "Send Update" in Sanity Studio or on an admin-facing trigger. The action reads the project, builds the email, sends it, and writes the log entry.

**Trade-offs:** Using Astro server actions keeps this consistent with the existing contact form pattern. The action needs to: (1) fetch the project with full portal data from Sanity, (2) fetch the client email from the referenced client document, (3) render the email HTML, (4) send via Resend, (5) write the log entry via mutation. This is 5 steps in one action, which is acceptable for a low-frequency operation.

**Where the trigger lives:** The cleanest UX is a custom Sanity Studio action (a document action plugin that calls the Astro server action endpoint). This keeps the trigger inside Studio where Liz already manages projects. Alternative: a simple form on the portal page visible only to Liz (authenticated by a secondary secret). The Studio action is better UX but more complex to build. Recommend starting with a **Studio document action** that calls `/_actions/sendUpdate` since the infrastructure (React in Studio, Astro actions exposing endpoints) already exists.

### Pattern 3: Portal as Single-Page Composition

**What:** The portal remains a single SSR page at `/portal/[token]` that renders all sections (milestones, procurement, budget proposals) in a vertical scroll layout. No client-side routing, no tabs, no sub-pages.

**When to use:** When the total data per project is small (a few dozen items across all sections) and the client's mental model is "view my project status" -- a single destination.

**Trade-offs:** Simpler than multi-page portal. All data fetched in one GROQ query. No navigation state to manage. Downside: if the page grows very long, clients may not scroll to see all sections. Mitigate with a sticky section nav (anchor links) if needed. At the current feature scope (milestones + procurement + proposals), a single page is appropriate.

**Implementation sketch:**

```astro
---
// src/pages/portal/[token].astro
export const prerender = false;
const project = await getPortalProject(token);
// project now includes: milestones[], procurement[], budgetProposals[], client->
---
<PortalLayout title={project.title}>
  <PortalHeader project={project} />
  <StatusBadge stage={project.pipelineStage} />
  <MilestoneTimeline milestones={project.milestones} />
  <ProcurementTable items={project.procurement} />
  <BudgetProposal proposals={project.budgetProposals} />
  <ContactCTA client={project.client} />
</PortalLayout>
```

## Data Flow

### Portal Page Load (v2.0)

```
Client clicks PURL (/portal/abc123)
    |
    v
Astro SSR: rate limit check (existing)
    |
    v
GROQ query: fetch project by token (expanded)
    |
    +---> Project metadata (title, pipelineStage, portalEnabled)
    +---> client-> { name, email, phone, preferredContact }
    +---> milestones[] { title, targetDate, completedDate, status, description }
    +---> procurement[] { item, vendor, status, costPrice, retailPrice, notes }
    +---> budgetProposals[] { version, createdAt, tiers[] { tierName, totalAmount, ... } }
    |
    v
Render portal page with all sections
    |
    v
Client views milestones, procurement status, budget proposals
```

### Send Update Flow (NEW)

```
Liz triggers "Send Update" (via Studio action or admin form)
    |
    v
POST /_actions/sendUpdate { projectId, note (optional) }
    |
    v
Astro server action:
    1. Fetch project + client from Sanity (read client)
    2. Build email HTML snapshot (milestones, procurement summary, note)
    3. Send via Resend to client.email
    4. Append to project.updateLog via Sanity mutation (write client)
    |
    v
Return { success: true, resendId }
```

### Expanded GROQ Query

```groq
*[_type == "project" && portalToken == $token && portalEnabled == true][0]{
  _id,
  title,
  clientName,               // legacy field, keep for backward compat
  pipelineStage,
  "client": client-> {
    name,
    email,
    phone,
    preferredContact,
    address
  },
  milestones[] {
    _key,
    title,
    targetDate,
    completedDate,
    status,
    description
  },
  procurement[] {
    _key,
    item,
    vendor,
    status,
    costPrice,
    retailPrice,
    notes
  },
  budgetProposals[] {
    _key,
    version,
    createdAt,
    tiers[] {
      _key,
      tierName,
      totalAmount,
      description,
      lineItems[] {
        category,
        amount,
        notes
      },
      selected
    }
  }
}
```

### Budget Proposal Display Logic

Budget proposals are versioned snapshots. The portal shows the **most recent proposal** by default. Older proposals are accessible but collapsed. Within a proposal, tiers (Best/Better/Good) display side-by-side on desktop, stacked on mobile. The `selected` boolean on each tier indicates what the client chose. Liz sets this manually in Studio after the client communicates their choice (no client-side selection workflow at this stage -- that is a v3 feature per REQUIREMENTS out-of-scope).

### Procurement Savings Calculation

The portal displays a "savings" column computed from `retailPrice - costPrice` for each procurement item. This is calculated at render time in the Astro component, not stored in Sanity. The total savings across all items is displayed as a summary. This makes the value proposition of the designer's trade pricing visible to the client.

## Sanity Studio Configuration Changes

### Field Groups on Project Document

```
Content (default) | Portal | Milestones | Procurement | Proposals
```

Add 3 new field groups to the project schema to keep the editing experience organized. The "Portal" group retains the client reference, portalToken, portalEnabled, and pipelineStage. Milestones, procurement, and proposals each get their own group tab so Liz does not scroll through one enormous form.

### Studio Structure Update

```typescript
// sanity.config.ts structure update
S.list()
  .title("Content")
  .items([
    S.listItem().title("Site Settings").id("siteSettings")
      .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
    S.divider(),
    S.documentTypeListItem("client").title("Clients"),      // NEW
    S.documentTypeListItem("project").title("Portfolio Projects"),
    S.documentTypeListItem("service").title("Services"),
  ])
```

**Clients appear above Projects** in the Studio sidebar because Liz should create a client before creating/linking a project. This ordering reinforces the workflow.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Sanity (read) | `sanity:client` from `@sanity/astro`, GROQ queries in `src/sanity/queries.ts` | Existing pattern. Expand portal query to include new fields. No changes to client config. |
| Sanity (write) | `@sanity/client` with write token in `src/sanity/mutations.ts` | **NEW.** Requires `SANITY_API_WRITE_TOKEN` env var. Used only in `sendUpdate` server action. Create a Sanity API token with "Editor" role in sanity.io/manage. |
| Resend | `resend` SDK in server actions | Existing pattern. Add portal update email template. Same API key, same `from` address. |
| Fantastical Openings | External link (`https://fantastical.app/design-b1eD/...`) | **No embed, no API, no iframe.** Fantastical Openings does not provide an embeddable widget. Integration is a styled button linking to the Fantastical booking page. The existing contact page already has this link -- the Cal.com embed and dependency should simply be removed. |

### Fantastical Openings Integration Detail

Fantastical Openings does not offer an embeddable calendar widget like Cal.com does. The integration is strictly an **external link** to Liz's Fantastical booking page. The current contact page already links to `https://fantastical.app/design-b1eD/meet-with-elizabeth-olivier`. The v2.0 change is:

1. Remove the `CalBooking.tsx` component (currently unused -- the page already uses a link instead)
2. Remove the `@calcom/embed-react` dependency from `package.json`
3. Keep the existing Fantastical link button on the contact page (already implemented)

This is a cleanup task, not a new integration.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Portal page -> Sanity (read) | GROQ query via `sanity:client` | Expanded query, same read pattern. SSR, no caching (clients see fresh data). |
| sendUpdate action -> Sanity (write) | Mutation via `@sanity/client` with write token | New boundary. Write token scoped to server actions only. Append-only pattern (updateLog). |
| sendUpdate action -> Resend | `resend.emails.send()` | Same pattern as contact form. New email template for portal updates. |
| Studio custom action -> Astro action endpoint | HTTP POST to `/_actions/sendUpdate` | Studio document action (React component) calls the Astro action endpoint. Requires the action endpoint to accept the call (may need CORS or a shared secret for auth). |
| Project document -> Client document | Sanity reference (`{ _type: "reference", _ref: clientId }`) | Standard Sanity reference. GROQ dereferences with `client->`. |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 active projects (launch) | Current architecture is fine. All data on single project documents. GROQ queries are fast. Sanity free tier handles it easily. |
| 10-50 active projects | No changes needed. 50 project documents with inline arrays is trivial for Sanity. Consider adding a "Projects Dashboard" view in Studio with custom ordering/filtering. |
| 50+ active projects | Unlikely for a solo interior design studio. If reached: consider extracting procurement items to a separate document type with references for cross-project vendor reporting. But do not build this now. |

### Scaling Priorities

1. **First concern: Studio editing performance.** Large inline arrays (50+ procurement items) can slow down the Studio editing experience. Mitigation: Sanity's array UI handles this fine up to ~100 items. For an interior design project, 50 items is a realistic maximum. If a single project has 100+ procurement items, consider paginating the array display or splitting into categories.

2. **Second concern: Portal page render time.** A single GROQ query fetching all portal data (milestones + procurement + proposals) for one project is fast -- sub-100ms. This will not be a bottleneck. The rate limiter (10 requests/minute/IP) provides adequate protection against abuse.

## Anti-Patterns

### Anti-Pattern 1: Separate Document Types for Everything

**What people do:** Create separate Sanity document types for `milestone`, `procurementItem`, `budgetProposal`, and `updateLogEntry`, then use arrays of references on the project document.

**Why it is wrong for this project:** It fragments the editing experience. Liz would need to create milestone documents in a separate Studio list, then link them to the project. It creates orphan document risk (milestones without projects). It makes GROQ queries more complex (multiple joins). And it provides zero benefit when milestones are never queried independently.

**Do this instead:** Inline arrays of objects on the project document. One screen, one document, all project data together.

### Anti-Pattern 2: Client-Side State for Portal

**What people do:** Add React state management (useState, context, or a state library) to the portal page for tabs, filters, or interactive features, turning it into a client-side React app.

**Why it is wrong for this project:** The portal is a read-only status display. The client does not interact with it beyond viewing. SSR with Astro components (zero JS shipped to the client) is ideal -- fast, simple, no hydration issues. The only interactive element is the "Send Update" form, which can use a standard HTML form submission.

**Do this instead:** Keep the portal as pure Astro SSR components. If you later need interactivity (selection approval, comments), add targeted React islands with `client:load` only for those specific components.

### Anti-Pattern 3: Building Email Templates with React Email

**What people do:** Add `react-email` as a dependency and build email templates as React components, rendered server-side to HTML.

**Why it is wrong for this project:** React Email is a great tool, but adding it for a single email template (portal update) is dependency bloat. The existing contact form already uses inline HTML strings for email templates and they work well. Consistency with the existing pattern is more valuable than architectural elegance.

**Do this instead:** Build the portal update email template as a TypeScript function that returns an HTML string, matching the pattern already used in `src/actions/index.ts`. Extract the branded email chrome (header, footer, colors) into a shared helper if the templates start duplicating.

### Anti-Pattern 4: Using Sanity Webhooks for the "Send Update" Feature

**What people do:** Set up a Sanity webhook that fires when a project document is mutated, then detect if the mutation was a "send update" trigger and auto-send the email.

**Why it is wrong for this project:** Webhooks fire on every document mutation -- any field change, any save. Detecting "Liz clicked Send Update" from a generic mutation event requires fragile heuristics (did the updateLog array grow? was it a manual edit or an action?). It is unreliable and overcomplicated.

**Do this instead:** Use an explicit action trigger. Liz clicks a button (Studio document action) that calls the Astro server action endpoint. The action sends the email and logs it. No ambiguity, no false triggers.

## Build Order (Dependency Chain for v2.0)

### Layer 1: Schema + Data Model (no runtime dependencies)

1. Create `client` schema (`src/sanity/schemas/client.ts`)
2. Add new field groups to `project` schema
3. Add `milestones` array field to project
4. Add `procurement` array field to project
5. Add `budgetProposals` array field to project
6. Add `updateLog` array field to project (readOnly)
7. Add `client` reference field to project
8. Register `client` in schema index
9. Update Studio structure (sanity.config.ts) to show Clients

**Why first:** Schemas must exist before data can be entered or queried. No code changes depend on runtime behavior.

### Layer 2: Portal Display Components (depends on Layer 1)

1. Expand GROQ portal query to fetch new fields
2. Build `MilestoneTimeline` v2 (custom milestones, not generic stages)
3. Build `ProcurementTable` component
4. Build `BudgetProposal` component
5. Update `[token].astro` to compose new components
6. Update `PortalLayout.astro` if needed (section nav, etc.)

**Why second:** Display components can be built and visually reviewed as soon as schemas exist and test data is entered. No external service dependencies.

### Layer 3: Send Update + Write-Back (depends on Layers 1-2)

1. Create `src/sanity/mutations.ts` (write client)
2. Create portal update email template (`src/lib/email/portalUpdate.ts`)
3. Add `sendUpdate` server action to `src/actions/index.ts`
4. Add `SANITY_API_WRITE_TOKEN` to `.env` and Vercel env vars
5. Build Studio document action for "Send Update" trigger (or admin form)
6. Test end-to-end: trigger -> email sent -> log entry written

**Why third:** Requires both the data model (Layer 1) and the portal state to snapshot (Layer 2) to be in place. Also requires Resend and the write token to be configured.

### Layer 4: Cleanup + Polish

1. Remove `@calcom/embed-react` from `package.json`
2. Remove `CalBooking.tsx` component
3. Verify Fantastical link on contact page is sufficient
4. Review portal mobile responsiveness
5. Enter real project data for testing

**Why last:** Cleanup tasks have no downstream dependencies. Can be done in any order.

## Environment Variables (New)

| Variable | Purpose | Where |
|----------|---------|-------|
| `SANITY_API_WRITE_TOKEN` | Server-side Sanity mutations (update log) | `.env` + Vercel env vars |

All other env vars (Sanity project ID, dataset, Resend API key) are already configured.

## Sources

- [Sanity Technical Limits](https://www.sanity.io/docs/content-lake/technical-limits) -- Document size (32MB), attribute limits (1,000 on free/growth)
- [Sanity: Deciding Fields and Relationships](https://www.sanity.io/docs/developer-guides/deciding-fields-and-relationships) -- When to use inline objects vs document types
- [Sanity Array Type](https://www.sanity.io/docs/studio/array-type) -- Array field configuration, nested array restrictions
- [Sanity Reference Type](https://www.sanity.io/docs/studio/reference-type) -- Cross-document references
- [Sanity Mutation API](https://www.sanity.io/docs/http-reference/mutation) -- Server-side write operations
- [Sanity Transactions](https://www.sanity.io/docs/transactions) -- Atomic mutations
- [Astro Actions](https://docs.astro.build/en/guides/actions/) -- Server action definitions and endpoints
- [Resend + Astro Integration](https://resend.com/docs/send-with-astro) -- Email sending from Astro server actions
- [Fantastical Openings Help](https://flexibits.com/fantastical/help/openings) -- Booking page (link-only, no embed widget)
- [Flexibits Account Openings](https://flexibits.com/account/help/openings) -- Fantastical scheduling page management

---
*Architecture research for: La Sprezzatura v2.0 Client Portal Platform*
*Researched: 2026-03-15*

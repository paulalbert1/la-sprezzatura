# Phase 6: Portal Features - Research

**Researched:** 2026-03-16
**Domain:** Sanity Studio schema extensions, Astro SSR portal pages, server-side mutations, PDF generation, client-facing artifact/milestone/procurement UI
**Confidence:** HIGH

## Summary

Phase 6 transforms the authenticated portal from a simple dashboard (Phase 5) into Liz's primary client communication tool. The technical work breaks into four domains: (1) Sanity schema extensions -- adding milestones, procurement, and artifacts as inline arrays on the project document with new Studio field groups and custom document actions; (2) Portal UI -- a new project detail page at `/portal/project/[projectId]` with section-level engagement type gating and client-facing components for milestones, procurement, artifacts, and post-project workflows; (3) Server-side mutations -- Astro Actions using a Sanity write client to handle client notes, artifact approvals, and warranty claims; (4) PDF generation -- a close document generated server-side with PDFKit.

The project already has a solid foundation: authenticated middleware, session management, Sanity GROQ queries, Astro Actions with Zod validation, React interactive components, and a consistent design system. Phase 6 extends these patterns rather than introducing new architectural concepts. The primary complexity lies in the artifact version/approval workflow and the Sanity Studio document actions for "Notify Client" and project completion.

**Primary recommendation:** Build incrementally -- schema first, then portal sections (milestones, procurement, artifacts), then Studio document actions and post-project features. Use a dedicated Sanity write client (separate from the read-only `sanity:client`) for all server-side mutations. Use PDFKit for close document generation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single scroll page at `/portal/project/[id]` -- all sections stacked vertically with clear section headers
- Compact header: project name + StatusBadge (pipeline stage) + engagement type label
- Section order: Milestones -> Procurement -> Artifacts (post-project section appears only when relevant)
- Confidentiality notice: subtle persistent banner below header
- Empty sections show header + friendly message
- All data stored as inline arrays on the project document in Sanity (not separate document types)
- Sanity Studio organized with field groups/tabs: Content | Portal | Milestones | Procurement | Artifacts
- Full Interior Design: all sections visible; Styling & Refreshing and Carpet Curating: milestones + artifacts only
- Full ENGMT-02 Sanity Studio field gating deferred to Phase 7 -- Phase 6 only controls portal display
- Existing 6-stage pipeline shown as compact status bar at top of milestones section
- Custom milestones are free-form: name, date, completion status, optional description -- NOT linked to pipeline stages
- Always sorted by date; overdue milestones get subtle stone/amber treatment (not red)
- Progress summary at section header with slim progress bar
- Client notes per milestone stored via Sanity mutation API (server-side, write token)
- All client notes visible to all clients on shared projects (attributed to author)
- Procurement table: item name, status badge, install date, MSRP/retail price, per-item savings, tracking number
- Client cost NEVER displayed on portal -- only MSRP and savings (retail minus client cost)
- Footer row with total savings
- Fixed procurement status set: Ordered, Warehouse, In Transit, Pending, Delivered, Installed
- All financial values stored as integer cents (PROC-03)
- Tracking number auto-detect carrier and render as clickable link
- Artifact types: fixed set (proposal, floor plan, design board, contract, warranty, close document) PLUS custom types via free-text
- Known types get special behavior; custom types get generic handling
- Version history: current version prominent; previous versions in collapsible section, muted
- Approval flow: "Approve" or "Request Changes" with confirmation dialog
- Approvals are final from client side; Liz CAN revoke from Sanity Studio
- Contract artifacts: special "signed version" field
- File storage: Sanity CDN for Phase 6 (Vercel Blob deferred to Phase 7)
- Downloads: PDFs download, images open in lightbox with download
- No automatic email on upload -- Liz has a "Notify Client" button per artifact in Sanity Studio
- Notify sends branded email with notification logged on artifact
- Completed projects: same layout with "Project Complete" banner, muted styling, actions disabled
- Completed projects visible for 30 days after completion, then hidden from portal
- Liz can reopen any completed project from Sanity Studio
- Close document: auto-generated branded PDF from project data
- Project completion: confirmation dialog in Sanity Studio with checklist
- Warranty/reopen: Liz reopens for any reason; client submits freeform text + optional photo

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

### Deferred Ideas (OUT OF SCOPE)
- Live tracking API integration (UPS, FedEx status auto-lookup) -- new capability, own phase
- Full ENGMT-02 Sanity Studio field gating by engagement type -- Phase 7
- Vercel Blob with signed URLs for private document storage -- Phase 7 (DOCS-01)
- Full Send Update portal snapshot email from Sanity Studio -- Phase 9 (SEND-01/02/03)
- Address autocomplete / geocoding -- deferred from Phase 5
- Client profile photo or avatar -- not needed for operations portal
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLNT-06 | Portal greets client by name and shows all their active and historical projects | Dashboard already built (Phase 5); needs update to use new completion/visibility logic |
| CLNT-07 | Active clients can view completed projects alongside current ones | Dashboard already separates active/completed; add 30-day visibility window filtering |
| MILE-01 | Liz can define custom per-project milestones with name, date, and completion status in Sanity | Inline array on project schema with field group; Sanity defineArrayMember pattern |
| MILE-02 | Client sees milestone timeline with dates and completion indicators on portal | New Astro component on project detail page; date formatting + relative dates |
| MILE-03 | The 6-stage pipeline retained as high-level status alongside detailed milestones | Existing MilestoneTimeline.astro reused as compact status bar |
| PROC-01 | Liz can add procurement line items with name, status, install date, client cost, retail price | Inline array on project schema; integer cents for financial values |
| PROC-02 | Client sees procurement table with statuses and savings (retail minus client cost) | New Astro component; compute savings server-side, never expose client cost |
| ARTF-01 | Liz can upload project artifacts of configurable types | Inline array with Sanity file type + custom type field |
| ARTF-02 | Artifacts support revisions -- new versions created, previous remain viewable | Nested versions array within artifact object; current version tracking |
| ARTF-03 | Client can review and select/approve artifact versions | React interactive component; Astro Action for approval mutation |
| ARTF-04 | All selections, approvals, decisions recorded in decision log with timestamps | Decision log array on artifact; Sanity write client appends entries |
| ARTF-08 | Contract artifacts support upload of a signed version | Additional `signedFile` field on artifact when type is contract |
| ARTF-09 | Client can provide notes/feedback on artifacts at review points | Client notes stored via Sanity mutation API; React form component |
| PORT-05 | Portal displays confidentiality notice about not sharing access link | Static banner below project header |
| PORT-06 | Client can submit notes at appropriate workflow points | Shared notes form pattern for milestones and artifacts |
| PORT-07 | Portal shows all project artifacts with current status, version history, decision log | Artifacts section on project detail page |
| POST-01 | After final milestone, Liz can generate a project close document (PDF) | PDFKit server-side generation; Sanity document action trigger |
| POST-02 | Liz can reopen a completed project for warranty work | Sanity Studio action; toggling project status field |
| POST-03 | Liz can upload warranty items to a reopened project | Artifacts array supports warranty type uploads |
| POST-04 | Client can submit warranty claim through portal on reopened project | React form component; Astro Action for claim submission |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^6.0.4 | SSR framework | Already in use; portal pages are server-rendered |
| sanity | ^5.16.0 | Studio + schema | Already in use; document actions API for Studio customizations |
| @sanity/client | ^7.17.0 | GROQ queries + mutations | Already installed; extend with dedicated write client |
| react | ^19.2.4 | Interactive components | Already in use for LoginForm; extend for approval/notes forms |
| @upstash/redis | ^1.37.0 | Session + rate limiting | Already in use |
| resend | ^6.4.2 | Email delivery | Already in use; extend for artifact notification emails |
| tailwindcss | ^4.2.1 | Styling | Already in use |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pdfkit | 0.18.0 | Close document PDF generation | POST-01: server-side branded PDF creation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdfkit | pdf-lib | pdf-lib is better for modifying existing PDFs; PDFKit excels at creating documents from scratch with fonts, images, tables -- exactly what the close document needs |
| pdfkit | jsPDF | jsPDF is browser-first; PDFKit is Node-native and has built-in table support since v0.17 |
| tracking-number-validation (npm) | Custom regex | Custom regex is simpler for 3 carriers (UPS/FedEx/USPS); the npm package adds 11+ carriers but is overkill -- use inline regex |

**Installation:**
```bash
npm install pdfkit
```

**Version verification:** pdfkit 0.18.0 confirmed via npm registry (2026-03-16). All other packages already installed at current versions.

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/portal/
    project/[projectId].astro     # Main project detail page (new)
  components/portal/
    ProjectHeader.astro           # Header with title, badge, engagement type, confidentiality banner
    MilestoneTimeline.astro       # EXISTING -- reuse as compact pipeline status bar
    MilestoneSection.astro        # Custom milestones list with progress bar
    MilestoneItem.astro           # Individual milestone display
    ProcurementTable.astro        # Procurement table with savings
    ArtifactSection.astro         # Artifact cards/list container
    ArtifactCard.astro            # Individual artifact with version info
    ArtifactApprovalForm.tsx      # React: approve/request changes (client:load)
    ClientNoteForm.tsx            # React: submit notes on milestones/artifacts (client:load)
    WarrantyClaimForm.tsx         # React: warranty claim submission (client:load)
    PostProjectBanner.astro       # "Project Complete" banner + read-only overlay
  sanity/
    schemas/project.ts            # EXTEND with milestones, procurement, artifacts arrays + new field groups
    queries.ts                    # ADD PROJECT_DETAIL_QUERY
    writeClient.ts                # NEW: Sanity client with write token for mutations
  sanity/
    actions/                      # NEW: Custom Sanity Studio document actions
      notifyClient.tsx            # "Notify Client" button per artifact
      completeProject.tsx         # Project completion confirmation dialog
      reopenProject.tsx           # Reopen completed project
  actions/index.ts                # EXTEND with approval, notes, notification, warranty actions
  lib/
    formatCurrency.ts             # NEW: cents -> display string helper
    trackingUrl.ts                # NEW: carrier detection + tracking URL builder
    generateClosePdf.ts           # NEW: PDFKit close document generator
```

### Pattern 1: Dedicated Sanity Write Client
**What:** A separate Sanity client instance configured with a write token, used only in server-side Astro Actions -- never exposed to the client.
**When to use:** Any operation that modifies Sanity data from the portal (notes, approvals, warranty claims).
**Example:**
```typescript
// src/sanity/writeClient.ts
import { createClient } from "@sanity/client";

export const sanityWriteClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: "2025-12-15",
  useCdn: false,
  token: import.meta.env.SANITY_WRITE_TOKEN, // Server-only, never PUBLIC_
});
```
Source: [Sanity JS Client Advanced Patterns](https://www.sanity.io/docs/apis-and-sdks/js-client-advanced)

### Pattern 2: Inline Array Schema with Field Groups
**What:** All milestones, procurement items, and artifacts stored as inline `array` fields on the project document, organized into Sanity Studio field groups.
**When to use:** When data is project-scoped and doesn't need independent querying across projects.
**Example:**
```typescript
// In project.ts schema -- adding field groups
groups: [
  { name: "content", title: "Content", default: true },
  { name: "portal", title: "Client Portal" },
  { name: "milestones", title: "Milestones" },
  { name: "procurement", title: "Procurement" },
  { name: "artifacts", title: "Artifacts" },
],

// Milestones inline array
defineField({
  name: "milestones",
  title: "Milestones",
  type: "array",
  group: "milestones",
  of: [defineArrayMember({
    type: "object",
    name: "milestone",
    fields: [
      defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
      defineField({ name: "date", title: "Date", type: "date" }),
      defineField({ name: "completed", title: "Completed", type: "boolean", initialValue: false }),
      defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
      defineField({
        name: "notes",
        title: "Client Notes",
        type: "array",
        readOnly: true,
        of: [defineArrayMember({
          type: "object",
          name: "clientNote",
          fields: [
            defineField({ name: "text", type: "string" }),
            defineField({ name: "clientId", type: "string" }),
            defineField({ name: "clientName", type: "string" }),
            defineField({ name: "timestamp", type: "datetime" }),
          ],
        })],
      }),
    ],
    preview: {
      select: { title: "name", subtitle: "date", completed: "completed" },
      prepare: ({ title, subtitle, completed }) => ({
        title: title || "Untitled milestone",
        subtitle: `${subtitle || "No date"} ${completed ? "(Complete)" : ""}`,
      }),
    },
  })],
}),
```
Source: [Sanity Array Type Docs](https://www.sanity.io/docs/studio/array-type)

### Pattern 3: Sanity Server-Side Mutations via Astro Actions
**What:** Portal client actions (approve artifact, submit note, warranty claim) are handled by Astro Actions that use the Sanity write client to append data to inline arrays on the project document.
**When to use:** Any client-initiated data write.
**Example:**
```typescript
// In src/actions/index.ts
submitMilestoneNote: defineAction({
  accept: "form",
  input: z.object({
    projectId: z.string(),
    milestoneKey: z.string(),
    text: z.string().min(1).max(500),
  }),
  handler: async (input, context) => {
    const clientId = context.locals.clientId;
    if (!clientId) throw new ActionError({ code: "UNAUTHORIZED", message: "Not authenticated" });

    const client = await getClientById(clientId);
    await sanityWriteClient
      .patch(input.projectId)
      .insert("after", `milestones[_key == "${input.milestoneKey}"].notes[-1]`, [{
        _key: generatePortalToken(8),
        text: input.text,
        clientId,
        clientName: client.name,
        timestamp: new Date().toISOString(),
      }])
      .commit({ autoGenerateArrayKeys: true });

    return { success: true };
  },
}),
```
Source: [Sanity Patch Quick Start](https://www.sanity.io/docs/agent-actions/patch-quickstart), [Sanity HTTP Patches](https://www.sanity.io/docs/content-lake/http-patches)

### Pattern 4: Sanity Studio Document Actions
**What:** Custom buttons in Sanity Studio's document actions menu for operations like "Notify Client" and "Complete Project."
**When to use:** When Liz needs to trigger actions from Studio (sending emails, changing project state).
**Example:**
```typescript
// src/sanity/actions/notifyClient.tsx
import { useState } from "react";
import { useDocumentOperation } from "sanity";

export function NotifyClientAction(props) {
  const { patch } = useDocumentOperation(props.id, props.type);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const doc = props.draft || props.published;

  // Only show for project documents with artifacts
  if (props.type !== "project" || !doc?.artifacts?.length) return null;

  return {
    label: "Notify Client",
    onHandle: () => setDialogOpen(true),
    dialog: isDialogOpen && {
      type: "dialog",
      onClose: () => setDialogOpen(false),
      header: "Send Artifact Notification",
      content: (
        // Artifact picker + confirm button
        // On confirm: call API route to send email, then patch notification log
      ),
    },
  };
}
```
Source: [Sanity Document Actions](https://www.sanity.io/docs/studio/document-actions), [Sanity Document Actions API](https://www.sanity.io/docs/studio/document-actions-api)

### Pattern 5: Engagement Type Portal Gating
**What:** Conditionally render portal sections based on the project's engagement type. This is portal-display only (Phase 6); full Studio field gating is Phase 7.
**When to use:** On the project detail page to show/hide procurement and post-project sections.
**Example:**
```typescript
// In [projectId].astro
const showProcurement = project.engagementType === "full-interior-design";
const showCloseDocument = project.engagementType === "full-interior-design";
// Milestones + Artifacts always visible for all engagement types
```

### Anti-Patterns to Avoid
- **Exposing SANITY_WRITE_TOKEN to the client:** The write token must ONLY be used in server-side Astro Actions or API routes. Never import writeClient in .tsx components or pass it to client-side code.
- **Computing savings client-side:** Never send client cost to the browser. Compute `savings = retailPrice - clientCost` on the server in the GROQ query or Astro page frontmatter, and only send MSRP and savings to the template.
- **Storing financial values as floats:** Always use integer cents (`1999` not `19.99`). Format for display only at render time.
- **Separate document types for milestones/procurement/artifacts:** These are project-scoped data that don't need cross-project querying. Inline arrays on the project document keep data co-located and avoid reference complexity.
- **Nesting arrays inside arrays in Sanity:** Sanity does not support arrays within arrays. The artifact versions and decision log must be structured as arrays of objects (not arrays of arrays).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tracking number carrier detection | Custom complex regex | Simple inline regex for 3 carriers (UPS `^1Z`, FedEx 12-22 digits, USPS 20+ digits) | Only 3 carriers needed; npm package overkill |
| PDF generation | HTML-to-PDF with Puppeteer | PDFKit (v0.18.0) | Native Node.js PDF builder with tables, fonts, images -- no headless browser needed in serverless |
| Array key generation | Manual UUID generation | Sanity `autoGenerateArrayKeys: true` + `generatePortalToken(8)` for explicit keys | Sanity handles `_key` generation; use existing token generator for explicit keys |
| Rate limiting | Custom implementation | Existing `@upstash/ratelimit` with Redis | Already proven in Phase 5 for magic links and contact form |
| Cents to dollar formatting | Inline division everywhere | Shared `formatCurrency(cents)` utility | Prevents inconsistent formatting and floating-point display errors |
| Session validation | Custom middleware | Existing middleware.ts + session.ts | Phase 5 infrastructure handles all auth; just read `context.locals.clientId` |

**Key insight:** Phase 6 extends existing patterns (Astro Actions, Sanity schemas, React interactive components) rather than introducing new architectural concepts. The temptation to over-engineer is high given 20 requirements, but each requirement maps to a well-understood pattern already in the codebase.

## Common Pitfalls

### Pitfall 1: Client Cost Leaking to Portal
**What goes wrong:** Client cost appears in browser devtools, GROQ query response, or HTML source.
**Why it happens:** GROQ projection includes all procurement fields; developer forgets to exclude `clientCost` from the client-facing query.
**How to avoid:** The `PROJECT_DETAIL_QUERY` must explicitly project procurement fields and compute `savings` server-side: `"savings": retailPrice - clientCost` in GROQ, then only pass `savings` and `retailPrice` to the template. Never project `clientCost` in any portal-facing query.
**Warning signs:** Seeing `clientCost` in the network tab response for any portal page.

### Pitfall 2: Sanity Array-in-Array Limitation
**What goes wrong:** Schema validation fails or data doesn't save when nesting arrays (e.g., artifact versions containing a notes array).
**Why it happens:** Sanity's data store does not support arrays directly inside arrays. You must wrap the inner array in an object.
**How to avoid:** Structure as `artifacts[] -> { versions[] -> { _key, file, ... }, decisionLog[] -> { _key, action, ... } }`. Each level is an array of objects, never an array of arrays.
**Warning signs:** Sanity Studio error messages about array nesting; data silently failing to save.

### Pitfall 3: Write Token Exposure
**What goes wrong:** `SANITY_WRITE_TOKEN` appears in client-side JavaScript bundle.
**Why it happens:** Importing `writeClient.ts` in a React component or passing it through Astro props.
**How to avoid:** Only import `sanityWriteClient` in Astro Actions handlers (server-only context) or API route handlers. Never in `.tsx` files that use `client:load`. Use `import.meta.env.SANITY_WRITE_TOKEN` (no `PUBLIC_` prefix) so Vite tree-shakes it from client bundles.
**Warning signs:** Build warnings about importing server-only modules in client code.

### Pitfall 4: Race Conditions on Concurrent Approvals
**What goes wrong:** Two clients approve the same artifact version simultaneously; one approval overwrites the other.
**Why it happens:** Read-then-write pattern without optimistic concurrency.
**How to avoid:** Use Sanity's `insert` patch operation (appends to array) rather than `set` (replaces). For status changes, use `ifRevisionId` option on the patch to detect conflicts.
**Warning signs:** Missing decision log entries; approval status inconsistencies.

### Pitfall 5: Large Project Documents
**What goes wrong:** Projects with many procurement items, artifacts, and versions become slow to load.
**Why it happens:** All data is inline on one document; GROQ query returns everything.
**How to avoid:** Use GROQ projections to limit what's returned per section. For artifact versions, project only the current version by default; load full history on-demand. Expected scale: interior design projects typically have <50 procurement items, <20 artifacts, and <5 versions each -- well within Sanity document limits (16MB).
**Warning signs:** Portal page load time exceeding 2 seconds; Sanity Studio becoming sluggish when editing.

### Pitfall 6: PDF Generation in Serverless
**What goes wrong:** PDFKit fails on Vercel serverless due to file system or memory constraints.
**Why it happens:** PDFKit streams to disk by default; serverless has no persistent filesystem.
**How to avoid:** Use PDFKit with in-memory buffers (`doc.pipe(buffers)` pattern) rather than file output. Keep PDF simple (no heavy images). Vercel serverless functions have a 250MB memory limit (Pro) which is more than sufficient for document-style PDFs.
**Warning signs:** Function timeout or out-of-memory errors on PDF generation.

### Pitfall 7: 30-Day Visibility Window Calculation
**What goes wrong:** Completed projects disappear unexpectedly or remain visible too long.
**Why it happens:** Timezone issues or using different date comparison logic across server and client.
**How to avoid:** Store `completedAt` as ISO datetime on the project. Filter in GROQ: `completedAt == null || dateTime(completedAt) > dateTime(now()) - 60*60*24*30`. All date logic is server-side (Astro page frontmatter or GROQ).
**Warning signs:** Projects disappearing at inconsistent times for different clients.

## Code Examples

### Currency Formatting Utility
```typescript
// src/lib/formatCurrency.ts
/**
 * Format integer cents as a USD display string.
 * formatCurrency(199900) => "$1,999.00"
 * formatCurrency(0) => "$0.00"
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
```

### Tracking URL Builder
```typescript
// src/lib/trackingUrl.ts
interface TrackingInfo {
  carrier: "ups" | "fedex" | "usps" | "unknown";
  url: string | null;
}

export function getTrackingInfo(trackingNumber: string): TrackingInfo {
  const cleaned = trackingNumber.replace(/\s+/g, "");

  if (/^1Z[A-Z0-9]{16}$/i.test(cleaned)) {
    return {
      carrier: "ups",
      url: `https://www.ups.com/track?tracknum=${cleaned}`,
    };
  }
  if (/^\d{12,22}$/.test(cleaned)) {
    return {
      carrier: "fedex",
      url: `https://www.fedex.com/fedextrack/?trknbr=${cleaned}`,
    };
  }
  if (/^\d{20,34}$/.test(cleaned) || /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(cleaned)) {
    return {
      carrier: "usps",
      url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${cleaned}`,
    };
  }

  return { carrier: "unknown", url: null };
}
```
Source: [tracking_number_data patterns](https://github.com/jkeen/tracking_number_data)

### GROQ Project Detail Query
```typescript
// src/sanity/queries.ts -- new query for Phase 6
export const PROJECT_DETAIL_QUERY = `
  *[_type == "project" && _id == $projectId && portalEnabled == true && references($clientId)][0] {
    _id,
    title,
    pipelineStage,
    engagementType,
    completedAt,
    projectStatus,
    "isPrimary": clients[client._ref == $clientId][0].isPrimary,
    milestones[] | order(date asc) {
      _key,
      name,
      date,
      completed,
      description,
      notes[] {
        _key,
        text,
        clientName,
        timestamp
      }
    },
    "procurement": select(
      engagementType == "full-interior-design" => procurementItems[] {
        _key,
        name,
        status,
        installDate,
        retailPrice,
        "savings": retailPrice - clientCost,
        trackingNumber
      },
      null
    ),
    artifacts[] {
      _key,
      artifactType,
      customTypeName,
      currentVersionKey,
      signedFile { asset-> { url, originalFilename } },
      notificationLog[] { _key, sentAt, recipientEmail },
      versions[] {
        _key,
        file { asset-> { url, originalFilename, mimeType, size } },
        uploadedAt,
        note
      },
      decisionLog[] {
        _key,
        action,
        versionKey,
        clientId,
        clientName,
        feedback,
        timestamp
      },
      notes[] {
        _key,
        text,
        clientName,
        timestamp
      }
    }
  }
`;
```

### Sanity Write Client Setup
```typescript
// src/sanity/writeClient.ts
import { createClient } from "@sanity/client";

export const sanityWriteClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-12-15",
  useCdn: false,
  token: import.meta.env.SANITY_WRITE_TOKEN,
});
```
Source: [Sanity JS Client Getting Started](https://www.sanity.io/docs/apis-and-sdks/js-client-getting-started)

### Artifact Approval Action
```typescript
// In src/actions/index.ts (extending existing server object)
approveArtifact: defineAction({
  accept: "form",
  input: z.object({
    projectId: z.string(),
    artifactKey: z.string(),
    versionKey: z.string(),
    confirmed: z.literal("true"), // AUTH-04 confirmation checkbox
  }),
  handler: async (input, context) => {
    const clientId = context.locals.clientId;
    if (!clientId) throw new ActionError({ code: "UNAUTHORIZED", message: "Not authenticated" });

    const client = await getClientById(clientId);

    await sanityWriteClient
      .patch(input.projectId)
      .set({
        [`artifacts[_key == "${input.artifactKey}"].currentVersionKey`]: input.versionKey,
      })
      .insert("after", `artifacts[_key == "${input.artifactKey}"].decisionLog[-1]`, [{
        _key: generatePortalToken(8),
        action: "approved",
        versionKey: input.versionKey,
        clientId,
        clientName: client.name,
        feedback: null,
        timestamp: new Date().toISOString(),
      }])
      .commit({ autoGenerateArrayKeys: true });

    return { success: true };
  },
}),
```

### Close Document PDF Generation Pattern
```typescript
// src/lib/generateClosePdf.ts
import PDFDocument from "pdfkit";

interface CloseDocData {
  projectTitle: string;
  clientNames: string[];
  milestones: Array<{ name: string; date: string; completed: boolean }>;
  totalSavings: number; // cents
  approvedArtifacts: string[];
  personalNote?: string;
}

export async function generateClosePdf(data: CloseDocData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 72 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header with brand
    doc.fontSize(28).font("Helvetica").text("La Sprezzatura", { align: "center" });
    doc.fontSize(12).text("Interior Design", { align: "center" });
    doc.moveDown(2);

    // Project title
    doc.fontSize(20).text(`Project Close: ${data.projectTitle}`);
    doc.moveDown();

    // Milestones summary, procurement totals, artifact list...
    // (implementation details follow PDFKit patterns)

    doc.end();
  });
}
```
Source: [PDFKit documentation](https://pdfkit.org/)

### Sanity Studio Document Action: Complete Project
```typescript
// src/sanity/actions/completeProject.tsx
import { useState } from "react";
import { useDocumentOperation } from "sanity";

export function CompleteProjectAction(props: any) {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const doc = props.draft || props.published;

  if (props.type !== "project" || doc?.projectStatus === "completed") return null;

  return {
    label: "Complete Project",
    tone: "positive",
    onHandle: () => setDialogOpen(true),
    dialog: isDialogOpen && {
      type: "confirm",
      onCancel: () => setDialogOpen(false),
      onConfirm: () => {
        patch.execute([
          {
            set: {
              projectStatus: "completed",
              completedAt: new Date().toISOString(),
            },
          },
        ]);
        publish.execute();
        props.onComplete();
      },
      message: (
        <div>
          <p><strong>This will:</strong></p>
          <ul>
            <li>Mark the project as completed</li>
            <li>Start the 30-day portal visibility countdown</li>
            <li>Disable client actions on the portal</li>
          </ul>
          <p>You can reopen the project later if needed.</p>
        </div>
      ),
    },
  };
}
```
Source: [Sanity Document Actions](https://www.sanity.io/docs/studio/document-actions)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sanity API v1 patches | v2021-03-25+ with JSONMatch paths | 2021 | Array element targeting via `[_key == "..."]` syntax |
| Separate Sanity documents for child data | Inline arrays with defineArrayMember | Sanity v3 (2022) | Simpler schema, co-located data, better Studio UX |
| Custom PDF with html-pdf (PhantomJS) | PDFKit v0.17+ with native tables | April 2025 | No headless browser dependency; table support built in |
| Astro SSR with getStaticPaths | Full SSR with `output: "server"` | Astro 4+ | All portal pages server-rendered, dynamic data per request |
| Astro Actions beta | Astro Actions stable (Astro 5+) | Late 2024 | Type-safe server actions with Zod validation |

**Deprecated/outdated:**
- `html-pdf` / `phantomjs-based` PDF generators: Use PDFKit or pdf-lib instead
- Sanity v2 document actions: v3 uses `defineConfig` document.actions callback
- PURL-based portal access: Replaced by magic link auth in Phase 5

## Open Questions

1. **Font embedding in PDFKit for brand consistency**
   - What we know: PDFKit supports custom font registration; the site uses Cormorant Garamond and DM Sans (Google Fonts)
   - What's unclear: Whether Google Font files can be bundled for serverless PDF generation (licensing allows it, but font files add to bundle size)
   - Recommendation: Use Helvetica/Times (built-in PDFKit fonts) for the close document PDF. Brand feeling comes from layout and structure, not exact font match. Avoids font bundling complexity.

2. **Sanity write token provisioning**
   - What we know: Need a token with write access to the project dataset; created in Sanity management console
   - What's unclear: Whether the existing Sanity project has a suitable token already
   - Recommendation: Wave 0 task to create a `SANITY_WRITE_TOKEN` in Sanity management and add to Vercel environment variables

3. **Artifact notification email delivery**
   - What we know: Resend is configured but domain verification is deferred to Phase 10 (Wix DNS limitation). Sandbox mode only delivers to account owner.
   - What's unclear: Whether artifact notifications can reach real clients before domain verification
   - Recommendation: Build the notification infrastructure; emails will work once domain is verified. In the meantime, notifications can be tested with the Resend account owner email.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | `vitest.config.ts` (exists, aliases `sanity:client` mock) |
| Quick run command | `npm test` (runs `vitest run`) |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLNT-06 | Dashboard greeting and project listing | smoke (manual) | N/A -- SSR page rendering | N/A |
| CLNT-07 | Completed projects visible alongside active | unit | `npx vitest run src/lib/projectVisibility.test.ts -x` | Wave 0 |
| MILE-01 | Milestone schema validates correctly | unit | `npx vitest run src/sanity/schemas/project.test.ts -x` | Wave 0 |
| MILE-02 | Milestones sorted by date with progress calculation | unit | `npx vitest run src/lib/milestoneUtils.test.ts -x` | Wave 0 |
| MILE-03 | Pipeline status bar renders | smoke (manual) | N/A -- Astro component | N/A |
| PROC-01 | Procurement schema with integer cents | unit | `npx vitest run src/sanity/schemas/project.test.ts -x` | Wave 0 |
| PROC-02 | Savings computed correctly, client cost excluded | unit | `npx vitest run src/lib/formatCurrency.test.ts -x` | Wave 0 |
| ARTF-01 | Artifact type enumeration | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | Wave 0 |
| ARTF-02 | Version ordering, current version identification | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | Wave 0 |
| ARTF-03 | Approval action validates input | unit | `npx vitest run src/actions/portalActions.test.ts -x` | Wave 0 |
| ARTF-04 | Decision log entry structure | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | Wave 0 |
| ARTF-08 | Contract signed file detection | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | Wave 0 |
| ARTF-09 | Notes submission validation | unit | `npx vitest run src/actions/portalActions.test.ts -x` | Wave 0 |
| PORT-05 | Confidentiality notice present | smoke (manual) | N/A -- static HTML | N/A |
| PORT-06 | Notes form submits correctly | unit | `npx vitest run src/actions/portalActions.test.ts -x` | Wave 0 |
| PORT-07 | Artifacts section renders with versions | smoke (manual) | N/A -- SSR page | N/A |
| POST-01 | Close document PDF generates | unit | `npx vitest run src/lib/generateClosePdf.test.ts -x` | Wave 0 |
| POST-02 | Reopen project status transition | unit | `npx vitest run src/lib/projectVisibility.test.ts -x` | Wave 0 |
| POST-03 | Warranty artifact upload type | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | Wave 0 |
| POST-04 | Warranty claim action validates | unit | `npx vitest run src/actions/portalActions.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run build`
- **Phase gate:** Full suite green + successful build before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/formatCurrency.test.ts` -- covers PROC-02 (savings computation, cents formatting)
- [ ] `src/lib/trackingUrl.test.ts` -- covers tracking number carrier detection
- [ ] `src/lib/milestoneUtils.test.ts` -- covers MILE-02 (sorting, progress calculation, overdue detection)
- [ ] `src/lib/artifactUtils.test.ts` -- covers ARTF-01/02/04/08, POST-03 (type detection, version ordering, decision log)
- [ ] `src/lib/projectVisibility.test.ts` -- covers CLNT-07, POST-02 (30-day window, reopen logic)
- [ ] `src/lib/generateClosePdf.test.ts` -- covers POST-01 (PDF buffer generation)
- [ ] `src/actions/portalActions.test.ts` -- covers ARTF-03/09, PORT-06, POST-04 (action input validation)

## Sources

### Primary (HIGH confidence)
- Project codebase inspection -- all existing files read directly (project.ts, client.ts, queries.ts, dashboard.astro, actions/index.ts, MilestoneTimeline.astro, etc.)
- [Sanity Array Type Docs](https://www.sanity.io/docs/studio/array-type) -- inline array schema patterns, defineArrayMember
- [Sanity Document Actions](https://www.sanity.io/docs/studio/document-actions) -- custom Studio actions API
- [Sanity Document Actions API Reference](https://www.sanity.io/docs/studio/document-actions-api) -- dialog types, useDocumentOperation
- [Sanity HTTP Patches](https://www.sanity.io/docs/content-lake/http-patches) -- array insert/append operations
- [Sanity JS Client Advanced Patterns](https://www.sanity.io/docs/apis-and-sdks/js-client-advanced) -- write client configuration, autoGenerateArrayKeys
- [Sanity File Type](https://www.sanity.io/docs/studio/file-type) -- file upload, accept option, CDN URL patterns
- [Sanity Assets Docs](https://www.sanity.io/docs/assets) -- CDN URL structure, download parameter (`?dl=`)

### Secondary (MEDIUM confidence)
- [PDFKit npm](https://www.npmjs.com/package/pdfkit) -- v0.18.0 confirmed via npm registry; tables support since v0.17
- [PDFKit Documentation](https://pdfkit.org/) -- server-side PDF generation patterns
- [tracking_number_data (GitHub)](https://github.com/jkeen/tracking_number_data) -- carrier regex patterns
- [tracking-number-validation npm](https://www.npmjs.com/package/tracking-number-validation) -- v2.0.2 alternative (not recommended, overkill)

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use or well-established (PDFKit)
- Architecture: HIGH -- extends existing patterns proven in Phase 5; inline arrays, Astro Actions, React interactive components all have working precedent in the codebase
- Pitfalls: HIGH -- well-known issues (client cost leakage, array nesting, write token exposure) with clear prevention strategies
- PDF generation: MEDIUM -- PDFKit in serverless is well-documented but untested in this specific project; the in-memory buffer pattern is the standard approach

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable ecosystem -- Sanity v3/v5, Astro 6, PDFKit are all mature)

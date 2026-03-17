# Phase 8: Contractor Portal, Building Manager Portal, and Client Contractor Visibility - Research

**Researched:** 2026-03-16
**Domain:** Multi-role portal UI (Astro SSR, Sanity CMS, Vercel Blob, Resend email)
**Confidence:** HIGH

## Summary

Phase 8 builds three portal experiences on top of the established Phase 5-7 infrastructure: (1) a contractor "Work Order" project detail page showing assigned scope, floor plans, estimates, appointments, and notes; (2) a building manager portal for commercial projects with COI documents, legal docs, and client contact info; (3) a client-facing contractor visibility section. All three follow the exact same Astro SSR + middleware + Sanity GROQ + PortalLayout pattern used in Phases 5-6, with the multi-role session model from Phase 7.

The codebase is highly mature for this phase. The session model already supports `building_manager` role in types. The middleware already handles `/portal/*` and `/workorder/*` routes. Sanity schemas already have contractors inline array, floor plans, COIs, legal docs, building manager object, and Vercel Blob file storage. The primary work is: (a) schema additions (appointments array, contractorNotes, contractor submission notes, siteSettings contact fields already exist), (b) new GROQ queries, (c) new Astro pages and components, (d) building manager auth flow (login/verify/dashboard/project pages), (e) SendBuildingAccessAction Studio action, and (f) extending the client project detail page for CVIS-01.

**Primary recommendation:** Follow the existing patterns exactly -- every pattern for this phase already exists in the codebase (magic link auth, document actions, blob serving, inline array mutations, section components). No new libraries, no new architectural patterns needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Contractor Work Order Page: Single scroll page at `/workorder/project/[projectId]`, section order: Header -> Appointments -> Scope of Work -> Floor Plans -> Estimate -> Notes from Liz -> Contractor Notes -> Contact Liz -> Sign Out
- Dashboard at `/workorder/dashboard` already exists -- auto-redirect for single-project contractors
- Pipeline stage NOT shown to contractor
- Contractor sees own assignment only
- Appointments: add `appointments` array to contractor assignment inline object with dateTime, label, notes fields; replaces startDate/endDate as primary scheduling display
- Appointment notes visible to contractor, clients see date/time/label only, past appointments muted
- Estimate: show amount (formatted from cents) AND/OR download button for PDF
- Floor Plans: inline preview for images, named card for PDFs, all via Vercel Blob signed URLs
- Scope of Work: existing rich text (block content) field
- New `contractorNotes` plain-text field on assignment for informal Liz instructions
- Contractor Note Submission: one-way note form, stored as inline array (text, contractorName, timestamp), NOT chat
- Empty states: friendly per-section messages
- Contact Liz: phone/email from Site Settings Sanity singleton
- Building Manager Portal: separate `/building/login`, `/building/verify` pages, `building_manager` session role, magic link via "Send Building Access" button on project document (commercial + has building manager email)
- Building Manager Page Layout: project name/address header, client contact section, COI section with expiration badges (green/amber/red), legal documents section, contractor info (names + trades, "Contact Liz" for more), Contact Liz footer
- Client Contractor Visibility (CVIS-01): new "Contractors" section on client project detail page, after Milestones before Procurement, Full Interior Design only, hidden if no contractors assigned, shows name + trade + appointments (date/time/label only, notes hidden, past muted)
- Information boundaries enforced per the detailed table in CONTEXT.md

### Claude's Discretion
- Exact component structure for work order detail page
- Signed URL expiry TTL for document downloads
- Building manager dashboard layout (rare multi-project case)
- Contractor note form styling and placement
- Site Settings singleton schema fields beyond phone/email
- Whether appointment label field should have predefined options or free text
- Loading states and error handling
- Mobile responsive breakpoints for all three portal views

### Deferred Ideas (OUT OF SCOPE)
- Bulk "Send Work Orders" action
- Contractor status/active tracking
- Building manager approval workflow
- Contractor messaging/chat
- Address autocomplete/geocoding
- Building manager notification when new COI uploaded
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONTR-03 | Contractor portal shows floor plans, scope of work, deadline, notes, and next steps for assigned projects | Work order project detail page at `/workorder/project/[projectId]` with GROQ query expanding contractor assignment, floor plans, appointments, scope of work, estimate, contractor notes |
| CONTR-04 | Contractor sees client name and project address only -- no client email/phone ("contact Liz" shown instead) | GROQ projection includes only primary client name (dereferenced), project address; Contact Liz section sources from siteSettings singleton |
| BLDG-02 | Building manager receives magic link email to access portal | SendBuildingAccessAction on project document type, `/api/send-building-access` route, `/building/login` + `/building/verify` pages following workorder pattern |
| BLDG-03 | Building manager sees client name and contact info | GROQ query for building manager project detail includes dereferenced primary client name, email, phone |
| BLDG-04 | Building manager has COI section with expiration dates | GROQ projection includes cois[] with expiration dates; ExpirationBadge component with green/amber/red logic |
| BLDG-05 | Building manager has legal documents section for building requirements and PDFs | GROQ projection includes legalDocs[]; download via existing `/api/blob-serve` endpoint |
| BLDG-06 | Building manager can request contractor info (name, license -- not direct contact) | GROQ projection includes contractor names and trades from contractors[] array; "Contact Liz for more details" text |
| CVIS-01 | Client sees contractor name and on-site schedule dates on project portal | Extended PROJECT_DETAIL_QUERY with conditional contractor data for full-interior-design; ContractorSection.astro component inserted after MilestoneSection |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^6.0.4 | SSR framework, page routing, middleware | Already in use; all portal pages are Astro SSR |
| sanity | ^5.16.0 | CMS schemas, Studio actions | Already in use; schema extensions and new document action |
| @sanity/client | ^7.17.0 | GROQ queries, write mutations | Already in use; query patterns established |
| react | ^19.2.4 | Interactive components (login forms, note forms) | Already in use; React islands in Astro via client:load |
| @vercel/blob | ^2.3.1 | Private document storage and streaming | Already in use; floor plans, estimates, COIs, legal docs |
| resend | ^6.4.2 | Transactional email for magic links | Already in use; branded email templates established |
| @upstash/redis | ^1.37.0 | Session storage, magic link tokens | Already in use; session model supports building_manager role |
| astro-portabletext | ^0.11.4 | Rendering Sanity block content (scope of work) | Already in use for portfolio project content |
| tailwindcss | ^4.2.1 | Utility-first styling | Already in use; design tokens defined in global.css |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | (via astro:schema) | Action input validation | Contractor note submission schema |
| pdfkit | ^0.18.0 | PDF generation | Already in use; not needed for Phase 8 |

### Alternatives Considered
None. Phase 8 uses exclusively existing libraries.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure (New Files)
```
src/
  pages/
    workorder/
      project/[projectId].astro     # NEW: Contractor work order detail
      dashboard.astro                # MODIFY: Add auto-redirect + project links
    building/
      login.astro                    # NEW: Building manager login
      verify.astro                   # NEW: Building manager magic link verify
      dashboard.astro                # NEW: Building manager dashboard
      project/[projectId].astro      # NEW: Building manager project detail
      logout.astro                   # NEW: Building manager sign out
    api/
      send-building-access.ts        # NEW: API route for building manager magic link
    portal/
      project/[projectId].astro      # MODIFY: Add ContractorSection for CVIS-01
  components/
    portal/
      ContractorSection.astro        # NEW: Client-facing contractor visibility
      ContractorNoteForm.tsx          # NEW: Contractor note submission (React)
      ExpirationBadge.astro           # NEW: COI expiration status badge
      BuildingManagerLoginForm.tsx    # NEW: Building manager login form (React)
  sanity/
    schemas/
      project.ts                     # MODIFY: Add appointments[], contractorNotes, contractorSubmissionNotes
    actions/
      sendBuildingAccess.tsx          # NEW: Studio document action for building manager
    queries.ts                       # MODIFY: Add work order detail, building manager, CVIS-01 queries
  actions/
    index.ts                         # MODIFY: Add requestBuildingManagerMagicLink, submitContractorNote
    portalSchemas.ts                 # MODIFY: Add contractorNoteSchema
  middleware.ts                      # MODIFY: Add /building/* route block
  env.d.ts                           # MODIFY: Add buildingManagerEmail to Locals (if needed)
  sanity.config.ts                   # MODIFY: Add SendBuildingAccessAction on project type
```

### Pattern 1: Astro SSR Portal Page (Established)
**What:** Server-rendered pages with middleware-injected session data
**When to use:** All authenticated portal pages
**Example:**
```typescript
// Source: src/pages/workorder/dashboard.astro (existing pattern)
---
export const prerender = false;

import PortalLayout from "../../components/portal/PortalLayout.astro";

// entityId injected by middleware (guaranteed by auth guard)
const contractorId = Astro.locals.contractorId!;

// Fetch data from Sanity
const data = await getWorkOrderDetail(projectId, contractorId);
if (!data) return Astro.redirect("/workorder/dashboard");
---

<PortalLayout title="Work Order | La Sprezzatura">
  <!-- Render sections -->
</PortalLayout>
```

### Pattern 2: Document Action -> API Route -> Resend Email (Established)
**What:** Sanity Studio button triggers API route which sends branded email
**When to use:** Building manager magic link ("Send Building Access")
**Example:**
```typescript
// Source: src/sanity/actions/sendWorkOrderAccess.tsx (existing pattern)
// Studio action: fetch() to /api/send-building-access with projectId
// API route: look up building manager email on project, generate token, send email
// Key difference from SendWorkOrderAccess: action lives on project type (not contractor type),
// only shown when isCommercial && buildingManager.email exists
```

### Pattern 3: GROQ Conditional Projection with select() (Established)
**What:** Include different fields based on engagement type
**When to use:** CVIS-01 contractor data only for full-interior-design
**Example:**
```groq
// Source: src/sanity/queries.ts PROJECT_DETAIL_QUERY (existing pattern)
select(engagementType == "full-interior-design" => {
  "contractors": contractors[] {
    "name": contractor->name,
    "trades": contractor->trades,
    appointments[] | order(dateTime asc) {
      dateTime,
      label
      // NOTE: no 'notes' field -- client does not see appointment notes
    }
  }
})
```

### Pattern 4: Inline Array Mutation via Sanity Write Client (Established)
**What:** Append items to inline arrays on documents
**When to use:** Contractor note submission
**Example:**
```typescript
// Source: src/actions/index.ts submitMilestoneNote (existing pattern)
await sanityWriteClient
  .patch(projectId)
  .insert("after", `contractors[_key == "${assignmentKey}"].submissionNotes[-1]`, [{
    _key: generatePortalToken(8),
    text: input.text,
    contractorName: contractor.name,
    timestamp: new Date().toISOString(),
  }])
  .commit({ autoGenerateArrayKeys: true });
```

### Pattern 5: Middleware Route Protection (Established)
**What:** Check session role and inject entity ID into context.locals
**When to use:** Adding /building/* routes
**Example:**
```typescript
// Source: src/middleware.ts (extend existing pattern)
if (pathname.startsWith("/building")) {
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();
  const session = await getSession(context.cookies);
  if (!session || session.role !== "building_manager") {
    return context.redirect("/building/login");
  }
  context.locals.buildingManagerEmail = session.entityId; // entityId is the email for building managers
  context.locals.role = session.role;
  return next();
}
```

### Pattern 6: Vercel Blob File Serving (Established)
**What:** Serve private files through authenticated API route
**When to use:** Floor plans, estimate PDFs, COIs, legal documents
**Example:**
```html
<!-- Source: existing pattern from blob-serve.ts -->
<a href={`/api/blob-serve?path=${encodeURIComponent(file)}`}>
  Download
</a>
```

### Anti-Patterns to Avoid
- **Exposing client contact info to contractors:** GROQ projections for contractor view MUST exclude client email and phone. Only include primary client first name / name.
- **Showing appointment notes to clients:** CVIS-01 query MUST omit the `notes` field from appointments projection.
- **Using Sanity CDN for private documents:** All COIs, legal docs, floor plans, estimates MUST use Vercel Blob via `/api/blob-serve`, never public Sanity CDN URLs.
- **Creating new session/auth patterns:** Use the existing multi-role session model. Building manager uses same cookie, same Redis, same TTL.
- **Hand-rolling date comparison for COI expiration:** Use simple JS Date comparison inline, not a library. The logic is: expired = expirationDate < today, expiring = expirationDate < today + 30 days.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Magic link auth flow | Custom token generation/verification | Existing redis.set/getdel pattern with generatePortalToken | Already proven, single-use enforcement, rate limiting |
| File serving with access control | Custom signed URL generation | Existing `/api/blob-serve` endpoint | Handles auth check, content type, streaming |
| Rich text rendering | Custom block-to-HTML converter | `astro-portabletext` PortableText component | Already in use for portfolio pages, handles all block types |
| Currency formatting | Custom number formatting | Existing `formatCurrency()` from lib/formatCurrency.ts | Handles cents-to-dollars conversion with proper locale |
| Email sending | Custom SMTP | Existing Resend pattern with branded HTML templates | Templates established, from address configured |
| Rate limiting | Custom throttle | Existing `magicLinkRatelimit` from lib/rateLimit | Already configured for magic link endpoints |
| Session management | Custom cookies | Existing createSession/getSession/clearSession | Multi-role support built in |

**Key insight:** Phase 8 is exclusively a UI/query/schema layer. Every infrastructure pattern is already built and tested in Phases 5-7. The risk is in data boundary enforcement (who sees what), not in technology choices.

## Common Pitfalls

### Pitfall 1: Information Boundary Violations
**What goes wrong:** Contractor sees client email, client sees appointment notes, building manager sees scope of work
**Why it happens:** GROQ projections that are too broad, copy-pasting queries without trimming fields
**How to avoid:** Write separate GROQ queries per role. Each query's projection is an explicit allowlist of fields. Review each query against the Information Boundaries table in CONTEXT.md.
**Warning signs:** Seeing `...` spread operator in GROQ projections for portal queries (should always be explicit field lists)

### Pitfall 2: Building Manager Entity ID Confusion
**What goes wrong:** Building manager session stores an email (not a Sanity document ID) because building managers are inline objects on projects, not standalone documents
**Why it happens:** Client and contractor sessions store Sanity `_id` as entityId. Building managers are stored as `buildingManager { name, email, phone }` inline on project -- no separate document type.
**How to avoid:** For building manager sessions, store the email as entityId. GROQ queries for building manager use email matching: `*[_type == "project" && buildingManager.email == $email]`. Update env.d.ts Locals type if adding buildingManagerEmail.
**Warning signs:** Trying to look up building manager by _id in Sanity (no such document exists)

### Pitfall 3: Contractor Assignment Key Mismatch
**What goes wrong:** Contractor note submission targets wrong array element, or appointment data doesn't match the contractor's assignment
**Why it happens:** The contractors array on project uses inline objects with _key. The GROQ filter `contractors[contractor._ref == $contractorId]` must be used consistently.
**How to avoid:** Always filter by contractor reference, not by array index. Store the assignment _key from the GROQ response and use it for mutations.
**Warning signs:** Notes appearing on wrong contractor's assignment, or 404-like behavior from Sanity patch

### Pitfall 4: Missing Auto-Redirect for Single-Project Users
**What goes wrong:** Single-project contractors or building managers see a dashboard with one card instead of being redirected to the project detail
**Why it happens:** Forgetting to add the redirect logic (already established pattern for client portal)
**How to avoid:** On dashboard page, check `projects.length === 1` and redirect to `/workorder/project/${projects[0]._id}` or `/building/project/${projects[0]._id}`
**Warning signs:** Users complaining about "extra click" to see their project

### Pitfall 5: SendBuildingAccessAction Visibility
**What goes wrong:** "Send Building Access" button appears on all projects or never appears
**Why it happens:** Action must check both `isCommercial === true` AND `buildingManager.email` exists on the document
**How to avoid:** In the action component, return null early if the document is not commercial or has no building manager email. Action is registered on `project` type (not a separate type like SendWorkOrderAccess which is on `contractor` type).
**Warning signs:** Button showing on residential projects, or not showing even when building manager is configured

### Pitfall 6: Stale Empty States on New Schema Fields
**What goes wrong:** Existing projects in Sanity don't have the new `appointments` or `contractorNotes` fields, causing undefined errors
**Why it happens:** Sanity is schemaless -- existing documents won't have new fields until edited
**How to avoid:** Always use optional chaining and fallback to empty arrays: `assignment?.appointments || []`, `assignment?.contractorNotes || ""`
**Warning signs:** Runtime errors on existing projects after schema update

### Pitfall 7: PUBLIC_PATHS Array Not Updated for Building Manager Routes
**What goes wrong:** Building manager login and verify pages require authentication (infinite redirect loop)
**Why it happens:** The PUBLIC_PATHS array in middleware.ts must include `/building/login` and `/building/verify`
**How to avoid:** Add both paths to PUBLIC_PATHS before adding the `/building` route block
**Warning signs:** Redirect loop when accessing /building/login

## Code Examples

### GROQ: Work Order Project Detail (Contractor View)
```groq
// Contractor work order detail -- explicit field allowlist per information boundaries
*[_type == "project" && _id == $projectId && portalEnabled == true &&
  engagementType == "full-interior-design" &&
  count(contractors[contractor._ref == $contractorId]) > 0
][0] {
  _id,
  title,
  "projectAddress": projectAddress {
    street, city, state, zip
    // NOTE: adminNotes excluded -- never visible to contractor
  },
  "primaryClientName": clients[isPrimary == true][0].client->name,
  "assignment": contractors[contractor._ref == $contractorId][0] {
    _key,
    startDate,
    endDate,
    estimateFile,
    estimateAmount,
    scopeOfWork,
    contractorNotes,
    appointments[] | order(dateTime asc) {
      _key,
      dateTime,
      label,
      notes   // Contractor sees appointment notes
    },
    submissionNotes[] | order(timestamp desc) {
      _key,
      text,
      contractorName,
      timestamp
    }
  },
  floorPlans[] {
    _key,
    planName,
    file,
    description
  }
}
```

### GROQ: Building Manager Project Detail
```groq
*[_type == "project" && buildingManager.email == $email &&
  isCommercial == true && portalEnabled == true
][0] {
  _id,
  title,
  "projectAddress": projectAddress {
    street, city, state, zip
  },
  "primaryClient": clients[isPrimary == true][0].client-> {
    name, email, phone
  },
  cois[] {
    _key,
    issuerName,
    file,
    expirationDate,
    coverageType,
    policyNumber
  },
  legalDocs[] {
    _key,
    documentName,
    file,
    description
  },
  "contractors": contractors[] {
    "name": contractor->name,
    "trades": contractor->trades
    // NOTE: no phone, no email, no license -- "Contact Liz" for more
  }
}
```

### GROQ: Extended Client Project Detail for CVIS-01
```groq
// Add to existing PROJECT_DETAIL_QUERY's select() block:
select(engagementType == "full-interior-design" => {
  "procurementItems": procurementItems[] { ... },
  "contractors": contractors[] {
    "name": contractor->name,
    "trades": contractor->trades,
    "appointments": appointments[] | order(dateTime asc) {
      dateTime,
      label
      // NOTE: 'notes' field excluded -- client does not see appointment notes
    }
  }
})
```

### COI Expiration Badge Logic
```typescript
// Compute badge status from expiration date
function getExpirationStatus(expirationDate: string | null): 'valid' | 'expiring' | 'expired' {
  if (!expirationDate) return 'valid'; // No expiration = assume valid
  const expiry = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiry < today) return 'expired';

  const thirtyDaysOut = new Date(today);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  if (expiry <= thirtyDaysOut) return 'expiring';

  return 'valid';
}

// Badge colors (matching design system)
const BADGE_STYLES = {
  valid: 'bg-emerald-50 text-emerald-700',     // Green
  expiring: 'bg-amber-50 text-amber-700',       // Amber
  expired: 'bg-red-50 text-red-700',             // Red
};
```

### Appointment Past/Future Visual Treatment
```typescript
// Determine if appointment is in the past
function isAppointmentPast(dateTime: string): boolean {
  return new Date(dateTime) < new Date();
}

// In Astro template:
// <div class:list={["...", isAppointmentPast(apt.dateTime) && "opacity-50"]}>
```

### Schema: Appointments Array on Contractor Assignment
```typescript
// Add to contractors[] inline object fields in project.ts
defineField({
  name: "appointments",
  title: "Appointments",
  type: "array",
  of: [
    defineArrayMember({
      type: "object",
      fields: [
        defineField({
          name: "dateTime",
          title: "Date & Time",
          type: "datetime",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "label",
          title: "Label",
          type: "string",
          description: 'e.g., "Measurement", "Install Day 1", "Touch-up"',
          validation: (r) => r.required(),
        }),
        defineField({
          name: "notes",
          title: "Notes for Contractor",
          type: "text",
          rows: 2,
          description: 'e.g., "Bring 2" molding samples". Visible to contractor only.',
        }),
      ],
      preview: {
        select: { title: "label", subtitle: "dateTime" },
        prepare: ({ title, subtitle }) => ({
          title: title || "Untitled appointment",
          subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : "No date",
        }),
      },
    }),
  ],
}),
```

### Contractor Note Submission Action
```typescript
// In portalSchemas.ts:
export const contractorNoteSchema = z.object({
  projectId: z.string().min(1),
  assignmentKey: z.string().min(1),
  text: z.string().min(1, "Please enter a note").max(500, "Note must be 500 characters or less"),
});

// In actions/index.ts handler:
// contractorId from context.locals (middleware-injected)
// Look up contractor name, then patch:
await sanityWriteClient
  .patch(input.projectId)
  .insert("after", `contractors[_key == "${input.assignmentKey}"].submissionNotes[-1]`, [{
    _key: generatePortalToken(8),
    text: input.text,
    contractorName: contractor.name,
    timestamp: new Date().toISOString(),
  }])
  .commit({ autoGenerateArrayKeys: true });
```

### Building Manager Session: Email as Entity ID
```typescript
// In /api/send-building-access.ts:
// Building managers don't have Sanity documents -- store email as entityId
await redis.set(`magic:${token}`, JSON.stringify({
  entityId: buildingManagerEmail.toLowerCase(),
  role: 'building_manager',
}), { ex: 900 });

// In middleware.ts for /building/* routes:
// session.entityId IS the building manager email
context.locals.buildingManagerEmail = session.entityId;
```

### Dual-Role Detection for Building Manager
```typescript
// Building manager email could also be a client or contractor
// Check in send-building-access API route:
const clientMatch = await getClientByEmail(buildingManagerEmail);
const contractorMatch = await getContractorByEmail(buildingManagerEmail);
// If dual/triple role, redirect to role-select with appropriate params
// NOTE: role-select page may need extension to handle 3 roles (client + contractor + building_manager)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Simple startDate/endDate on assignment | appointments[] array with dateTime, label, notes | Phase 8 (new) | More granular scheduling, per-visit instructions |
| No contractor-to-Liz communication | One-way contractor note submission form | Phase 8 (new) | Contractors can leave notes without phone/email |
| Building manager info display-only in Studio | Full building manager portal with magic link auth | Phase 8 (new) | Building managers self-serve document access |
| Client sees no contractor info | CVIS-01 contractor section on client portal | Phase 8 (new) | Transparency about who is working on the project |

**Deprecated/outdated:**
- Nothing deprecated. All existing patterns remain valid.

## Open Questions

1. **Role-Select Page for Triple-Role Users**
   - What we know: The current role-select page handles client + contractor dual-role. Building manager email could also be a client or contractor email.
   - What's unclear: How common is a triple-role scenario? Should role-select support 3 options?
   - Recommendation: Extend role-select to handle up to 3 roles. Pass all matching entity IDs as query params. The form renders a card per matched role. This is rare but the code cost is minimal.

2. **Building Manager Dashboard for Multi-Project Case**
   - What we know: A building manager email could appear on multiple commercial projects. CONTEXT.md says "dashboard if building manager email appears on multiple commercial projects."
   - What's unclear: How to lay out the multi-project dashboard.
   - Recommendation: Use the exact same card layout as the contractor dashboard (simple project cards with title + address). Auto-redirect for single project.

3. **Appointment Label: Free Text vs. Predefined Options**
   - What we know: CONTEXT.md examples include "Measurement", "Install Day 1", "Touch-up". Liz needs flexibility.
   - What's unclear: Whether Liz wants a dropdown or free text.
   - Recommendation: Use free text (plain string field). Predefined options are too restrictive for the variety of appointment types in interior design. The label field should have a helpful description with examples.

4. **env.d.ts Locals Type for Building Manager**
   - What we know: Locals currently has `clientId`, `contractorId`, and `role`. Building manager uses email as entity ID.
   - What's unclear: Best field name for building manager identifier.
   - Recommendation: Add `buildingManagerEmail: string | undefined` to Locals. This makes the type explicit and avoids confusion with document IDs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONTR-03 | Work order detail GROQ query returns correct fields | unit | `npx vitest run src/sanity/queries.test.ts -t "work order detail"` | Extend existing |
| CONTR-04 | Work order query excludes client email/phone | unit | `npx vitest run src/sanity/queries.test.ts -t "client contact excluded"` | Wave 0 |
| BLDG-02 | Building manager magic link action sends email | unit | `npx vitest run src/pages/api/send-building-access.test.ts` | Wave 0 |
| BLDG-03 | Building manager query includes client contact info | unit | `npx vitest run src/sanity/queries.test.ts -t "building manager"` | Wave 0 |
| BLDG-04 | COI expiration badge logic (valid/expiring/expired) | unit | `npx vitest run src/lib/coiUtils.test.ts` | Wave 0 |
| BLDG-05 | Legal docs included in building manager query | unit | `npx vitest run src/sanity/queries.test.ts -t "legal docs"` | Wave 0 |
| BLDG-06 | Building manager sees contractor names/trades only | unit | `npx vitest run src/sanity/queries.test.ts -t "contractor info"` | Wave 0 |
| CVIS-01 | Client project detail includes contractor data for FID | unit | `npx vitest run src/sanity/queries.test.ts -t "contractor visibility"` | Wave 0 |
| CROSS | Middleware routes /building/* with building_manager role | unit | `npx vitest run src/middleware.test.ts -t "building"` | Extend existing |
| CROSS | Contractor note submission schema validation | unit | `npx vitest run src/actions/portalActions.test.ts -t "contractor note"` | Extend existing |
| CROSS | Project schema includes appointments, contractorNotes fields | unit | `npx vitest run src/sanity/schemas/project.test.ts` | Extend existing |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/coiUtils.ts` + `src/lib/coiUtils.test.ts` -- COI expiration badge logic and tests
- [ ] Tests for building manager GROQ queries in `src/sanity/queries.test.ts`
- [ ] Tests for contractor note submission in `src/actions/portalActions.test.ts`
- [ ] Tests for information boundary enforcement in GROQ queries (CONTR-04, CVIS-01 note exclusion)
- [ ] Tests for middleware /building/* route handling in `src/middleware.test.ts`

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All source files listed in CONTEXT.md canonical references were read and analyzed
- `src/sanity/schemas/project.ts` -- Existing schema with contractors[], floorPlans[], buildingManager{}, cois[], legalDocs[]
- `src/middleware.ts` -- Existing route protection pattern for /portal/* and /workorder/*
- `src/lib/session.ts` -- Multi-role session model with building_manager type already defined
- `src/sanity/queries.ts` -- Existing GROQ query patterns with select() conditional projections
- `src/actions/index.ts` -- Existing action patterns for note submission, magic link, Sanity mutations
- `src/pages/api/blob-serve.ts` -- Existing file serving with auth check
- `src/pages/api/send-workorder-access.ts` -- Existing magic link API route pattern
- `src/sanity/actions/sendWorkOrderAccess.tsx` -- Existing Studio document action pattern
- `sanity.config.ts` -- Document actions registration pattern
- `src/components/portal/ClientNoteForm.tsx` -- Pattern for contractor note form
- `src/pages/workorder/login.astro`, `verify.astro`, `dashboard.astro` -- Contractor auth flow pattern
- `src/pages/portal/project/[projectId].astro` -- Client project detail page (extend for CVIS-01)
- `src/env.d.ts` -- Locals type with building_manager role already in union

### Secondary (MEDIUM confidence)
- None needed. All findings come from direct codebase analysis.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture: HIGH -- every pattern has an existing reference implementation in the codebase
- Pitfalls: HIGH -- identified from direct code analysis and established pattern review
- Information boundaries: HIGH -- explicit matrix in CONTEXT.md, verified against existing GROQ patterns

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- no external dependencies or fast-moving libraries)

# Architecture Research

**Domain:** Contractor portal, building manager portal, engagement type system, residential/commercial classification — extending the existing Astro 6 + Sanity + Vercel platform
**Researched:** 2026-03-16
**Confidence:** HIGH

---

## Context: What This Milestone Adds

This is the v2.5 milestone. v2.0 (Phases 5-6) established magic-link auth, the `client` document type, the full portal feature set (milestones, procurement, artifacts), and the authenticated client portal at `/portal/dashboard` and `/portal/project/[id]`. v2.5 adds three new portal personas and one new data classification system on top of that foundation.

**New in v2.5:**
- `contractor` portal — authenticated via magic link, sees floor plans + scope + estimate + minimal client info (name and address only, no contact details)
- `buildingManager` portal — authenticated via magic link, commercial projects only, sees COIs, legal docs, and can request contractor info
- Engagement type toggle — Full Interior Design / Styling & Refreshing / Carpet Curating, controls which portal sections appear
- Residential vs. Commercial classification — project-level toggle, gates building manager portal access

**Design constraint carrying forward:** All portal views (client, contractor, building manager) use the same magic link auth pattern established in Phase 5. The auth plumbing is reused, not rebuilt.

---

## System Overview (v2.5)

```
                    VISITOR / CLIENT / CONTRACTOR / BUILDING MGR BROWSER
                                          |
             +----------+----------+------+-------+-----------+
             |          |          |              |           |
       PUBLIC SITE  CLIENT       CONTRACTOR   BLDG MGR   SANITY STUDIO
       (prerender)  PORTAL       PORTAL       PORTAL      (/admin)
       /            /portal/*    /contractor/* /manager/*
       /portfolio
       /services
       /contact
             |          |          |              |           |
             +----+------+----------+--------------+-----+----+
                  |                                     |
     +---------------------------+                      |
     |  ASTRO 6 + VERCEL SSR     |                      |
     |                           |                      |
     |  src/middleware.ts        |                      |
     |  (session guard for all   |                      |
     |   three portal namespaces)|                      |
     |                           |                  Sanity Cloud
     |  src/pages/               |                  (Write via
     |    portal/*  (client)     |                   Studio UI)
     |    contractor/* (new)     |                      |
     |    manager/*   (new)      |                      |
     |                           |
     |  src/actions/index.ts     |
     |  (requestMagicLink,       |
     |   verifyMagicLink         |
     |   + new portal-type param)|
     +--+----------+-------------+
        |          |
   UPSTASH      SANITY
   REDIS         (Read)
   (tokens,      GROQ queries
    sessions)    per role
        |
      RESEND
   (magic link
    emails)
```

### What Changes from v2.0 to v2.5

| Area | v2.0 (Post Phase 6) | v2.5 (This Milestone) | Change Type |
|------|---------------------|----------------------|-------------|
| Sanity schemas | `project` (with engagement, clients[], milestones, procurement) | `project` extended: add `projectType` (residential/commercial), `engagementType` fields. New `contractor` document type. New `buildingManager` document type. | New types + field additions |
| Portal personas | Client only | Client + Contractor + Building Manager | New route namespaces + session roles |
| Route structure | `/portal/*` | `/portal/*` + `/contractor/*` + `/manager/*` | New namespaces |
| Session model | `clientId` in session payload | `{ userId, role: 'client' | 'contractor' | 'buildingManager' }` in session payload | Extended session data |
| Middleware | Guards `/portal/*`, passes `locals.clientId` | Guards all three namespaces, passes `locals.userId` + `locals.userRole` | Modified middleware |
| Magic link action | Accepts email, looks up client | Accepts email + `portalType` hint OR infers from persona document lookup | Modified action |
| GROQ queries | Client-centric portal queries | New contractor query (redacted client info), new building manager query (commercial docs only) | New queries |
| Portal UX | Single authenticated client view | Three distinct portal views per role, all dead-simple | New pages + components |
| Engagement type | Field exists on project schema (added in Phase 5) | Controls which portal sections render (milestones / procurement / carpet schedule) | Feature activation (existing field) |
| `App.Locals` | `clientId: string` | `userId: string; userRole: 'client' | 'contractor' | 'buildingManager'` | Extended |

---

## Sanity Schema Evolution

### Strategy: Additive-Only, No Migrations Required

All schema changes in v2.5 are additive (new fields with no `validation: r => r.required()` that would break existing documents, or new document types). Existing project documents do not need migration. New fields default to `undefined` and render gracefully when absent.

The only exception: if the codebase added `engagementType` as a required field in Phase 5, remove the `required()` constraint or backfill existing documents before v2.5 deploys. Check the Phase 5 implementation before starting.

### New Document Types

#### `contractor` Document Type

```typescript
// src/sanity/schemas/contractor.ts
defineType({
  name: "contractor",
  title: "Contractor",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Company / Contractor Name", type: "string",
      validation: r => r.required() }),
    defineField({ name: "contactName", title: "Contact Person", type: "string" }),
    defineField({ name: "email", title: "Email Address", type: "string",
      validation: r => r.required().email() }),
    defineField({ name: "phone", title: "Phone", type: "string" }),
    defineField({ name: "trade", title: "Trade / Specialty", type: "string",
      description: "e.g., General Contractor, Electrician, Plumber, Carpenter" }),
    defineField({ name: "licenseNumber", title: "License Number", type: "string" }),
    defineField({ name: "notes", title: "Internal Notes", type: "text",
      description: "Liz's notes about working with this contractor — never shown in portal" }),
  ],
  preview: {
    select: { title: "name", subtitle: "trade" },
  },
})
```

**Why a separate document type:** Contractors work across multiple projects. Contact info belongs to the contractor, not the project. Liz will have a short roster of trusted contractors she uses repeatedly. A `contractor` document type gives her a rolodex in Sanity Studio that she manages once.

#### `buildingManager` Document Type

```typescript
// src/sanity/schemas/buildingManager.ts
defineType({
  name: "buildingManager",
  title: "Building Manager",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Full Name", type: "string",
      validation: r => r.required() }),
    defineField({ name: "email", title: "Email Address", type: "string",
      validation: r => r.required().email() }),
    defineField({ name: "phone", title: "Phone", type: "string" }),
    defineField({ name: "buildingName", title: "Building Name", type: "string",
      description: "e.g., 225 West 39th Street Condo" }),
    defineField({ name: "buildingAddress", title: "Building Address", type: "object",
      fields: [
        defineField({ name: "street", type: "string" }),
        defineField({ name: "city", type: "string" }),
        defineField({ name: "state", type: "string" }),
        defineField({ name: "zip", type: "string" }),
      ],
    }),
    defineField({ name: "notes", title: "Internal Notes", type: "text",
      description: "Liz's notes — never shown in portal" }),
  ],
  preview: {
    select: { title: "name", subtitle: "buildingName" },
  },
})
```

**Why a separate document type:** Same reasoning as contractor. A building manager oversees one building but multiple renovation projects within it. Their contact info is independent of any single project.

### Project Schema Extensions

Add to the existing `project` schema (portal field group):

```typescript
// Residential vs. Commercial classification
defineField({
  name: "projectType",
  title: "Project Type",
  type: "string",
  group: "portal",
  options: {
    list: [
      { title: "Residential", value: "residential" },
      { title: "Commercial", value: "commercial" },
    ],
    layout: "radio",
  },
  initialValue: "residential",
  description: "Commercial projects unlock Building Manager portal access",
}),

// Engagement type (may already exist from Phase 5 — verify before adding)
defineField({
  name: "engagementType",
  title: "Engagement Type",
  type: "string",
  group: "portal",
  options: {
    list: [
      { title: "Full Interior Design", value: "full" },
      { title: "Styling & Refreshing", value: "styling" },
      { title: "Carpet Curating", value: "carpet" },
    ],
    layout: "radio",
  },
  initialValue: "full",
  description: "Controls which portal sections are visible to the client",
}),

// Contractors assigned to this project
defineField({
  name: "contractors",
  title: "Contractors",
  type: "array",
  group: "portal",
  of: [
    defineArrayMember({
      type: "object",
      fields: [
        defineField({ name: "contractor", type: "reference", to: [{ type: "contractor" }],
          validation: r => r.required() }),
        defineField({ name: "role", title: "Role on This Project", type: "string",
          description: "e.g., General Contractor, Tile Installer" }),
        defineField({ name: "scopeNotes", title: "Scope Notes", type: "text",
          rows: 3,
          description: "What this contractor is responsible for on this project" }),
      ],
      preview: {
        select: { title: "contractor.name", subtitle: "role" },
      },
    }),
  ],
}),

// Building manager (commercial projects only)
defineField({
  name: "buildingManager",
  title: "Building Manager",
  type: "reference",
  to: [{ type: "buildingManager" }],
  group: "portal",
  description: "Only set for commercial projects",
  // Conditionally shown in Studio UI only when projectType === 'commercial'
  // Use Sanity's `hidden` rule: hidden: ({ parent }) => parent?.projectType !== 'commercial'
  hidden: ({ parent }) => parent?.projectType !== "commercial",
}),

// Floor plan and scope artifacts visible to contractors
defineField({
  name: "contractorDocuments",
  title: "Contractor Documents",
  type: "array",
  group: "portal",
  description: "Documents visible to assigned contractors — floor plans, scope, estimates",
  of: [
    defineArrayMember({
      type: "object",
      fields: [
        defineField({ name: "title", type: "string", title: "Document Title",
          validation: r => r.required() }),
        defineField({ name: "documentType", type: "string", title: "Type",
          options: { list: [
            { title: "Floor Plan", value: "floor-plan" },
            { title: "Scope of Work", value: "scope" },
            { title: "Estimate", value: "estimate" },
            { title: "Site Survey", value: "site-survey" },
            { title: "Other", value: "other" },
          ]}
        }),
        defineField({ name: "file", type: "file", title: "File",
          description: "PDF or image" }),
        defineField({ name: "notes", type: "text", title: "Notes", rows: 2 }),
      ],
      preview: {
        select: { title: "title", subtitle: "documentType" },
      },
    }),
  ],
}),

// Commercial/building manager documents (COIs, legal docs)
defineField({
  name: "buildingDocuments",
  title: "Building Documents",
  type: "array",
  group: "portal",
  description: "Documents visible to building manager — COIs, permits, legal docs",
  hidden: ({ parent }) => parent?.projectType !== "commercial",
  of: [
    defineArrayMember({
      type: "object",
      fields: [
        defineField({ name: "title", type: "string", title: "Document Title",
          validation: r => r.required() }),
        defineField({ name: "documentType", type: "string", title: "Type",
          options: { list: [
            { title: "Certificate of Insurance (COI)", value: "coi" },
            { title: "Building Permit", value: "permit" },
            { title: "Work Authorization", value: "work-auth" },
            { title: "DOB Filing", value: "dob" },
            { title: "Other", value: "other" },
          ]}
        }),
        defineField({ name: "file", type: "file", title: "File" }),
        defineField({ name: "expirationDate", type: "date", title: "Expiration Date",
          description: "For COIs and permits" }),
        defineField({ name: "notes", type: "text", title: "Notes", rows: 2 }),
      ],
      preview: {
        select: { title: "title", subtitle: "documentType" },
      },
    }),
  ],
}),
```

### Schema Registration

```typescript
// src/sanity/schemas/index.ts
import { project } from "./project";
import { client } from "./client";
import { contractor } from "./contractor";         // NEW
import { buildingManager } from "./buildingManager"; // NEW
import { service } from "./service";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [project, client, contractor, buildingManager, service, siteSettings];
```

---

## Route Structure

### New URL Namespaces

```
/portal/login              existing — shared login page (add portalType detection)
/portal/verify             existing — shared magic link verification
/portal/dashboard          existing — client dashboard
/portal/project/[id]       existing — client project detail

/contractor/login          NEW — same form, same action, portalType='contractor'
/contractor/dashboard      NEW — list of projects this contractor is assigned to
/contractor/project/[id]   NEW — contractor view: floor plans, scope, client name+address only

/manager/login             NEW — same form, portalType='buildingManager'
/manager/dashboard         NEW — list of commercial projects for this building
/manager/project/[id]      NEW — building manager view: COIs, legal docs, contractor info request
```

**Why separate namespaces instead of a single `/portal/[role]/...`:**

- Contractors and building managers have URLs they bookmark. A clear `/contractor/` prefix makes the URL self-describing — they know they're in the contractor portal.
- Middleware can guard entire route namespaces with a simple `pathname.startsWith()` check rather than inspecting role within a shared namespace.
- The portals have completely different landing pages and UX — sharing a namespace adds no benefit and obscures intent.

**Shared `/portal/login` or separate login pages?**

Use separate login pages with separate routes, but they can share the same Astro component (pass `portalType` as a prop from the page). This makes it possible to brand each login page differently if needed ("Contractor Access" vs "Client Portal") while keeping one form component.

### Login Page Variants

```
/portal/login     → <LoginPage portalType="client" />
/contractor/login → <LoginPage portalType="contractor" />
/manager/login    → <LoginPage portalType="buildingManager" />
```

The `portalType` value is included as a hidden form field in the magic link request. The `requestMagicLink` action uses it to look up the right document type (client vs contractor vs buildingManager) and set the session role.

---

## Session Model Evolution

### Current v2.0 Session (from Phase 5)

```
Redis key: session:{token}
Value: clientId (string)

App.Locals:
  clientId: string | undefined
```

### v2.5 Session (Extended)

```
Redis key: session:{token}
Value: JSON.stringify({ userId: string, role: 'client' | 'contractor' | 'buildingManager' })

App.Locals:
  userId: string | undefined
  userRole: 'client' | 'contractor' | 'buildingManager' | undefined
```

**Migration:** The Phase 5 implementation stored `clientId` as a plain string. v2.5 changes the session value to a JSON object. This is a breaking change to session storage. Handle with:

1. During verification, always write the new JSON format.
2. In middleware, attempt to parse as JSON; if it fails (old session format), treat as `{ userId: value, role: 'client' }` for backward compatibility, then rewrite the session in the new format.
3. After v2.5 deploys, old sessions expire within 30 days without any forced logout.

```typescript
// src/lib/session.ts — session read/write helpers
export type SessionRole = 'client' | 'contractor' | 'buildingManager';

export interface SessionPayload {
  userId: string;
  role: SessionRole;
}

export function encodeSession(payload: SessionPayload): string {
  return JSON.stringify(payload);
}

export function decodeSession(raw: string | null): SessionPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.userId && parsed.role) return parsed;
    // Backward compat: plain string from Phase 5 (clientId only)
    return { userId: raw, role: 'client' };
  } catch {
    // Backward compat: non-JSON string was a clientId
    return { userId: raw, role: 'client' };
  }
}
```

### `App.Locals` Extension

```typescript
// src/env.d.ts
declare namespace App {
  interface Locals {
    // v2.0: clientId (may still exist if Phase 5 uses it)
    // v2.5: unified userId + role
    userId: string | undefined;
    userRole: 'client' | 'contractor' | 'buildingManager' | undefined;
    // Keep clientId as an alias pointing to userId when role === 'client'
    // to avoid breaking Phase 5/6 portal pages that read locals.clientId
    clientId: string | undefined;
  }
}
```

---

## Middleware Evolution

### v2.5 Middleware Strategy

The middleware must guard three namespaces and inject the right role into `locals`. It also enforces access rules (building manager can only see commercial projects).

```typescript
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { redis } from "./lib/redis";
import { decodeSession } from "./lib/session";

const PUBLIC_PATHS = [
  "/portal/login",
  "/portal/verify",
  "/contractor/login",
  "/contractor/verify",
  "/manager/login",
  "/manager/verify",
];

const ROLE_NAMESPACES: Record<string, 'client' | 'contractor' | 'buildingManager'> = {
  "/portal": "client",
  "/contractor": "contractor",
  "/manager": "buildingManager",
};

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // Determine which namespace this request is in
  const namespace = Object.keys(ROLE_NAMESPACES).find(ns =>
    pathname.startsWith(ns)
  );

  // Not a portal route — pass through
  if (!namespace) return next();

  // Public portal paths (login, verify) — pass through
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return next();

  // Validate session
  const sessionToken = context.cookies.get("portal_session")?.value;
  if (!sessionToken) {
    const loginPath = namespace === "/portal" ? "/portal/login"
      : namespace === "/contractor" ? "/contractor/login"
      : "/manager/login";
    return context.redirect(loginPath);
  }

  const raw = await redis.get<string>(`session:${sessionToken}`);
  const session = decodeSession(raw);

  if (!session) {
    context.cookies.delete("portal_session", { path: "/" });
    const loginPath = namespace === "/portal" ? "/portal/login"
      : namespace === "/contractor" ? "/contractor/login"
      : "/manager/login";
    return context.redirect(loginPath);
  }

  // Role-namespace mismatch: a client trying to access /contractor/* or vice versa
  const expectedRole = ROLE_NAMESPACES[namespace];
  if (session.role !== expectedRole) {
    // Redirect to their correct namespace, not to a generic error
    const correctLogin = session.role === "client" ? "/portal/login"
      : session.role === "contractor" ? "/contractor/login"
      : "/manager/login";
    return context.redirect(correctLogin);
  }

  // Inject into locals
  context.locals.userId = session.userId;
  context.locals.userRole = session.role;
  // Backward compat alias for client portal pages written in Phase 5/6
  if (session.role === "client") {
    context.locals.clientId = session.userId;
  }

  return next();
});
```

---

## Magic Link Action Evolution

### Updated `requestMagicLink` Action

The action needs to accept which portal type the user is logging into, look up the right document type, and store the role in the session.

```typescript
// src/actions/index.ts — updated requestMagicLink
requestMagicLink: defineAction({
  accept: "form",
  input: z.object({
    email: z.string().email(),
    portalType: z.enum(["client", "contractor", "buildingManager"]).default("client"),
  }),
  handler: async (input) => {
    // Rate limit by email
    const { success } = await magicLinkRatelimit.limit(`magic:${input.email.toLowerCase()}`);
    if (!success) throw new ActionError({ code: "TOO_MANY_REQUESTS", message: "..." });

    // Look up the right persona document type
    const user = await getUserByEmail(input.email, input.portalType);

    if (user) {
      const token = generatePortalToken(32);
      // Store both userId and role in the magic link token
      await redis.set(`magic:${token}`, JSON.stringify({
        userId: user._id,
        role: input.portalType,
      }), { ex: 900 }); // 15 min TTL

      await resend.emails.send({
        from: "La Sprezzatura <noreply@send.lasprezz.com>",
        to: [input.email],
        subject: "Your La Sprezzatura Portal Access",
        html: buildMagicLinkEmail(token, input.portalType),
      });
    }

    return { success: true }; // Always succeed (anti-enumeration)
  },
}),
```

### New GROQ Helper: `getUserByEmail`

```typescript
// src/sanity/queries.ts — addition
export async function getUserByEmail(
  email: string,
  portalType: "client" | "contractor" | "buildingManager"
) {
  const type = portalType === "client" ? "client"
    : portalType === "contractor" ? "contractor"
    : "buildingManager";

  return sanityClient.fetch(
    `*[_type == $type && email == $email][0] { _id, name, email }`,
    { type, email }
  );
}
```

### Verify Page (Unchanged in Logic, Updated to Handle JSON Payload)

The `/portal/verify`, `/contractor/verify`, and `/manager/verify` pages share the same verification logic. Because the magic link token now stores a JSON payload (userId + role), the verify page reads both and redirects to the correct dashboard.

All three verify routes can point to a single implementation — either a shared layout or a single `/verify` route that checks which namespace the token came from.

**Recommended:** Create one shared `/verify` page at `/portal/verify` and redirect all magic links there, passing the `portalType` as a query param in the email link. This keeps verify logic in one place.

```
Magic link URL: /portal/verify?token=XXX&type=contractor
→ Verify, create session with role=contractor
→ Redirect to /contractor/dashboard
```

---

## Data Access Rules (GROQ Projections by Role)

The key security constraint: **contractors see client name and address only — no phone, email, or contact info.** This is enforced in the GROQ query projection, not in the frontend.

### Contractor Portal Query

```groq
// Get projects where contractor is assigned
// Called with { contractorId }
*[_type == "project" && portalEnabled == true
  && contractors[].contractor._ref match $contractorId] {
  _id,
  title,
  // Client: name and address ONLY — no email, phone, preferredContact
  "clients": clients[] {
    "name": client->name,
    "address": client->address,
    "isPrimary": isPrimary
  },
  // Project address for on-site navigation
  projectAddress {
    street, city, state, zip
    // adminNotes intentionally excluded — Liz's internal notes
  },
  pipelineStage,
  // Contractor's own scope on this project
  "myRole": contractors[contractor._ref == $contractorId][0].role,
  "myScope": contractors[contractor._ref == $contractorId][0].scopeNotes,
  // Floor plans, scope docs, estimates
  contractorDocuments[] {
    _key, title, documentType,
    "fileUrl": file.asset->url,
    notes
  }
}
```

**What is explicitly excluded from contractor queries:**
- `clients[].client->email`
- `clients[].client->phone`
- `clients[].client->preferredContact`
- `milestones` (client-facing workflow, not contractor concern)
- `procurement` (client cost data)
- `buildingDocuments`
- `updateLog`
- Any field with "Internal" in its description

### Building Manager Portal Query

```groq
// Get commercial projects for this building manager
// Called with { buildingManagerId }
*[_type == "project" && portalEnabled == true
  && projectType == "commercial"
  && buildingManager._ref == $buildingManagerId] {
  _id,
  title,
  projectAddress { street, city, state, zip },
  pipelineStage,
  // Building docs: COIs, permits, legal
  buildingDocuments[] {
    _key, title, documentType,
    "fileUrl": file.asset->url,
    expirationDate, notes
  },
  // Contractor info available for building manager to request
  // (they can see contractor names and trades, not private contact info)
  "contractors": contractors[] {
    "name": contractor->name,
    "trade": contractor->trade,
    "license": contractor->licenseNumber
    // No phone or email — building manager must request contact info from Liz
  }
}
```

**Building manager cannot see:**
- Client name, email, phone, or address
- Procurement data
- Milestones (client-facing)
- Contractor phone/email (must request from Liz)

---

## Engagement Type: Portal Section Gating

The `engagementType` field on the project schema (Full / Styling / Carpet) controls which sections render in the client portal. This is a display rule, not a data rule — all sections can have data, only some sections render.

### Engagement Type Feature Matrix

| Section | Full Interior Design | Styling & Refreshing | Carpet Curating |
|---------|---------------------|----------------------|-----------------|
| Milestones | YES | YES | YES (simplified) |
| Procurement table | YES | YES (soft goods, no major construction) | YES (carpet items only) |
| Savings summary | YES | YES | YES |
| Contractor documents | YES | NO (no contractors) | NO |
| Building documents | Commercial only | NO | NO |
| Budget proposals | YES | YES | YES |

### Implementation Pattern

The client portal project detail page reads `engagementType` from the GROQ result and conditionally renders sections:

```astro
---
// src/pages/portal/project/[id].astro
const { engagementType, projectType } = project;
const showContractorDocs = engagementType === "full";
const showBuildingDocs = projectType === "commercial" && engagementType === "full";
---

<MilestoneTimeline milestones={project.milestones} {engagementType} />
<ProcurementTable items={project.procurement} />
{showContractorDocs && <ContractorInfo contractors={project.contractors} />}
{showBuildingDocs && <BuildingDocuments docs={project.buildingDocuments} />}
```

**Do not branch on engagement type in Sanity queries** — fetch all fields and conditionally render in the template. This keeps GROQ simple and allows Liz to change engagement type without data loss.

---

## New Portal Components

All new components follow the existing Astro component convention: server-rendered, no client-side JS unless interactive.

```
src/components/
├── portal/
│   ├── PortalLayout.astro          existing
│   ├── StatusBadge.astro            existing
│   ├── MilestoneTimeline.astro      existing (modified for engagementType prop)
│   ├── ProcurementTable.astro       existing (Phase 6)
│   ├── ArtifactList.astro           existing (Phase 6)
│   ├── ContractorInfo.astro         NEW — client portal: shows contractor name + on-site schedule only
│   └── ConfidentialityNotice.astro  existing (Phase 6)
├── contractor/
│   ├── ContractorLayout.astro       NEW — layout shell for contractor portal (reuses PortalLayout pattern)
│   ├── ProjectCard.astro            NEW — card showing project title, address, pipeline stage
│   ├── DocumentList.astro           NEW — renders contractorDocuments (floor plans, scope, estimate)
│   └── ScopeSection.astro           NEW — shows contractor's specific role + scope notes for this project
└── manager/
    ├── ManagerLayout.astro          NEW — layout shell for building manager portal
    ├── ProjectCard.astro            NEW — commercial project card (or reuse contractor/ProjectCard with variant prop)
    ├── BuildingDocumentList.astro   NEW — COIs, permits with expiration date highlighting
    └── ContractorRoster.astro       NEW — contractor names + trades (no contact info, with "request info" CTA)
```

**UX principle for contractor portal:** Contractors are not technical. The portal must be dead simple. One page per project. No tabs, no navigation, no configuration. Show: project name, address, their scope, and the documents. That's it. Design for someone checking it on a phone at a job site.

---

## Recommended File Structure (v2.5 Additions)

```
src/
├── sanity/
│   ├── schemas/
│   │   ├── contractor.ts           NEW
│   │   ├── buildingManager.ts      NEW
│   │   ├── project.ts              MODIFIED: add projectType, engagementType (if not from Phase 5),
│   │   │                           contractors[], buildingManager ref,
│   │   │                           contractorDocuments[], buildingDocuments[]
│   │   └── index.ts                MODIFIED: register contractor, buildingManager
│   └── queries.ts                  MODIFIED: add getContractorProjects(), getBuildingManagerProjects(),
│                                   getUserByEmail() updated to handle all 3 types
├── lib/
│   └── session.ts                  MODIFIED: add SessionPayload type, encodeSession(), decodeSession()
│                                   (or NEW if Phase 5 didn't create this file)
├── middleware.ts                   MODIFIED: multi-namespace guard, role injection
├── actions/
│   └── index.ts                    MODIFIED: requestMagicLink accepts portalType param
├── pages/
│   ├── portal/                     existing (client portal, minor engagement-type additions)
│   │   └── project/
│   │       └── [id].astro          MODIFIED: add engagementType conditional rendering
│   ├── contractor/
│   │   ├── login.astro             NEW: login page for contractors
│   │   ├── verify.astro            NEW: (or redirect to /portal/verify?type=contractor)
│   │   ├── dashboard.astro         NEW: list of assigned projects
│   │   └── project/
│   │       └── [id].astro          NEW: contractor detail view (scope + docs, redacted client info)
│   └── manager/
│       ├── login.astro             NEW: login page for building managers
│       ├── verify.astro            NEW: (or redirect to /portal/verify?type=buildingManager)
│       ├── dashboard.astro         NEW: list of commercial projects for this building
│       └── project/
│           └── [id].astro          NEW: building manager view (building docs + contractor roster)
└── components/
    ├── portal/
    │   └── ContractorInfo.astro    NEW: client-facing view of contractor (name + schedule only)
    ├── contractor/
    │   ├── ContractorLayout.astro  NEW
    │   ├── ProjectCard.astro       NEW
    │   ├── DocumentList.astro      NEW
    │   └── ScopeSection.astro      NEW
    └── manager/
        ├── ManagerLayout.astro     NEW
        ├── ProjectCard.astro       NEW
        ├── BuildingDocumentList.astro NEW
        └── ContractorRoster.astro  NEW
```

---

## Data Flow

### Contractor Magic Link Authentication

```
Liz sends contractor their portal link
    |
    v
Contractor visits /contractor/login
    |
    v
Enters email → POST to requestMagicLink { email, portalType: 'contractor' }
    |
    v
Action: look up *[_type == "contractor" && email == $email]
    |
    +-- if found: generate token, store { userId: contractor._id, role: 'contractor' } in Redis
    |             send magic link email to contractor
    +-- if not:   return success (anti-enumeration — same as client flow)
    |
    v
Contractor clicks link → /portal/verify?token=XXX&type=contractor
    |
    v
Verify page: redis.getdel(`magic:${token}`) → JSON payload
    |
    v
Create session: redis.set(`session:${sessionToken}`, JSON.stringify({ userId, role: 'contractor' }))
    |
    v
Set cookie, redirect to /contractor/dashboard
```

### Contractor Project Detail View

```
GET /contractor/project/[id]
    |
    v
Middleware: validate session, confirm role === 'contractor', inject locals.userId
    |
    v
GROQ query: fetch project where id === $id
            AND contractors[].contractor._ref matches locals.userId
            (security check — contractor can only see projects they're assigned to)
    |
    v
Projection: client name+address ONLY, projectAddress, myScope, contractorDocuments[]
    |
    v
Render: ContractorLayout > ScopeSection + DocumentList
```

### Engagement Type Portal Gating

```
GET /portal/project/[id]
    |
    v
Middleware: validate client session, inject clientId
    |
    v
GROQ query: fetch project with all portal fields (milestones, procurement, contractors, etc.)
    |
    v
Page reads: project.engagementType, project.projectType
    |
    v
Conditional render:
  engagementType === "full"    → show milestones + procurement + contractor info
  engagementType === "styling" → show milestones + procurement (no contractors shown)
  engagementType === "carpet"  → show milestones + procurement (carpet items only label)
  projectType === "commercial" → show building manager notice (not client-facing detail)
```

---

## Build Order (Dependency Chain)

Build order respects the rule: no downstream feature can be built until its upstream data and auth exists.

### Layer 1: Schema (No Runtime Dependencies)

1. Create `src/sanity/schemas/contractor.ts`
2. Create `src/sanity/schemas/buildingManager.ts`
3. Modify `project.ts`: add `projectType`, `engagementType` (confirm Phase 5 status), `contractors[]`, `buildingManager` ref, `contractorDocuments[]`, `buildingDocuments[]`
4. Register new schemas in `index.ts`
5. Update `sanity.config.ts` structure tool: add Contractors + Building Managers to sidebar

**Why first:** All subsequent layers depend on these document types existing. Liz cannot enter test data until schemas are deployed to Sanity Studio.

### Layer 2: Session + Auth Plumbing

1. Update `src/lib/session.ts`: add `SessionPayload` type, `encodeSession()`, `decodeSession()` with backward compat
2. Update `src/env.d.ts`: extend `App.Locals` to include `userId`, `userRole`, backward-compat `clientId`
3. Update `src/middleware.ts`: multi-namespace routing, role enforcement
4. Update `requestMagicLink` action: accept `portalType` param, look up right document type
5. Create/update `getUserByEmail()` in `queries.ts` to support all three types

**Why second:** Route pages need middleware working correctly before any portal page can render. Session model must be finalized before pages read from `locals`.

### Layer 3: Contractor Portal Pages + Components

1. Create `src/pages/contractor/login.astro`
2. Create `src/pages/contractor/verify.astro` (or route to shared verify)
3. Create GROQ query `getContractorProjects()` with redacted client info projection
4. Create `src/components/contractor/` component tree (ContractorLayout, ProjectCard, DocumentList, ScopeSection)
5. Create `src/pages/contractor/dashboard.astro`
6. Create `src/pages/contractor/project/[id].astro`

**Why third:** Auth plumbing must work before portal pages can be built and tested end-to-end.

### Layer 4: Building Manager Portal Pages + Components

1. Create `src/pages/manager/login.astro`, `verify.astro`
2. Create GROQ query `getBuildingManagerProjects()` with commercial-only + no-client-info projection
3. Create `src/components/manager/` component tree (ManagerLayout, ProjectCard, BuildingDocumentList, ContractorRoster)
4. Create `src/pages/manager/dashboard.astro`
5. Create `src/pages/manager/project/[id].astro`

**Why fourth:** Follows contractor portal as a parallel pattern. Can be built alongside Layer 3 if two workstreams are running.

### Layer 5: Engagement Type UI + Client Portal Integration

1. Verify `engagementType` field is on project schema (from Phase 5 or added in Layer 1)
2. Update client portal project detail page to conditionally render sections by engagement type
3. Add `ContractorInfo.astro` to client portal (shows contractor name + schedule — not contact info)
4. Test: Full project → all sections visible; Styling project → no contractor section; Carpet project → simplified milestone + procurement

**Why fifth (last):** This is an additive feature on top of the already-working client portal. All new data (contractor assignments, documents) must exist in Sanity before it can be displayed in the client-facing view.

---

## Integration Points

### Existing Code: What Gets Modified

| File | Change | Risk |
|------|--------|------|
| `src/middleware.ts` | Multi-namespace routing, role injection | MEDIUM — Middleware changes affect all portal routes. Must not break existing client sessions. |
| `src/actions/index.ts` | Add `portalType` param to `requestMagicLink` | LOW — Additive param with default of `'client'`. Existing client flow unchanged if default is correct. |
| `src/sanity/schemas/project.ts` | Add new fields | LOW — Additive. Existing project documents unaffected. |
| `src/sanity/schemas/index.ts` | Register 2 new schemas | LOW — Additive. |
| `src/sanity/queries.ts` | Add `getContractorProjects()`, `getBuildingManagerProjects()`, update `getUserByEmail()` | LOW — New functions. |
| `src/lib/session.ts` | Extend session payload shape | MEDIUM — Breaking change to Redis session values. Handle with backward-compat decode. |
| `src/env.d.ts` | Extend `App.Locals` | LOW — TypeScript only. |
| `src/pages/portal/project/[id].astro` | Conditional rendering by `engagementType` | LOW — Reads a new field, conditionally renders new sections. |

### Existing Code: What Stays Unchanged

| File | Reason |
|------|--------|
| `src/pages/portal/login.astro` | New portal types get their own login pages |
| `src/pages/portal/dashboard.astro` | Client dashboard is unchanged |
| `src/lib/generateToken.ts` | Reused as-is for all magic link tokens |
| `src/lib/redis.ts` | Shared Redis client, no changes needed |
| `src/lib/rateLimit.ts` | Magic link rate limiter works for all portal types |
| `src/components/portal/PortalLayout.astro` | Clients still use this. Contractor/manager get their own layout variants. |
| `src/components/portal/StatusBadge.astro` | Reused in contractor and client portal cards |
| All public site pages | Zero dependency on portal personas |

### External Services

| Service | Change | Notes |
|---------|--------|-------|
| Upstash Redis | Session value format changes from plain string to JSON | Backward-compat decode handles existing client sessions |
| Sanity | Two new document types registered | No Studio config file changes needed beyond schema registration and desk structure update |
| Resend | Same magic link email template, same sender | `portalType` can optionally customize subject line ("Your Contractor Portal Access") |

---

## Security Constraints

These are hard requirements, not suggestions.

**Contractor cannot see client contact info — enforced in GROQ projection, not in frontend.**

The GROQ query for contractor portal must never include `client->email`, `client->phone`, or `client->preferredContact`. The `contractorDocuments` projection also must exclude `adminNotes` on the project address (internal access notes like gate codes). These fields are physically absent from the query result — there is nothing to accidentally render.

**Contractor can only see projects they're assigned to.**

The contractor project query must filter on `contractors[].contractor._ref == $contractorId`. A contractor who guesses a valid project ID (e.g., `/contractor/project/abc123`) must get a 404, not the project data. The GROQ filter `&& contractors[].contractor._ref match $contractorId` enforces this. Never fetch by ID alone in the contractor portal — always require the assignment check.

**Building manager can only see commercial projects.**

The building manager query must filter `projectType == "commercial"`. A building manager URL like `/manager/project/[residential-project-id]` must 404.

**Role-namespace enforcement in middleware.**

A contractor with a valid session must not be able to access `/portal/*` (client routes). The middleware role-namespace check handles this — a contractor session token redirects to `/contractor/login` if they hit `/portal/*`.

**Magic link email links to the correct portal namespace.**

The magic link email sent to a contractor must link to `/portal/verify?token=XXX&type=contractor`, not to `/portal/verify?token=XXX`. The `type` param ensures the verify page redirects to `/contractor/dashboard` after successful authentication, not `/portal/dashboard`.

---

## Anti-Patterns

### Anti-Pattern 1: Single `/portal/[role]/...` Namespace

**What people do:** Route all portals under `/portal/contractor/[id]`, `/portal/manager/[id]`, sharing the namespace and extracting role from the URL.

**Why it is wrong for this project:** Contractors and building managers have bookmarks. A `/contractor/` URL is self-describing. Mixing portals under `/portal/` complicates middleware (must inspect URL segment to determine expected role) and gives contractors a confusing URL that includes "portal" — a word they associate with the client-facing product.

**Do this instead:** Separate route namespaces per persona. `/contractor/*`, `/manager/*`, `/portal/*`. Middleware guards each independently.

### Anti-Pattern 2: Filtering Client Data in the Frontend

**What people do:** Fetch the full project including client email, phone, etc., then conditionally hide those fields in the React/Astro component.

**Why it is wrong:** The full data is still in the HTML source. A technically curious contractor opens DevTools and sees the client's phone number. It is also fragile — a future component change could accidentally expose the field.

**Do this instead:** The GROQ projection for contractor queries never fetches those fields. If it's not in the query result, it can't be shown. Defense in depth: the Sanity API token used for reads has the minimum necessary permissions.

### Anti-Pattern 3: Building the Contractor Portal as a React SPA

**What people do:** Add React state management, client-side routing, and complex interactive features to the contractor portal.

**Why it is wrong:** Contractors check their portal on a phone at a job site. They need to see their scope and download a PDF. Zero JavaScript, instant load, mobile-first. The Astro SSR pattern already used for the client portal is correct.

**Do this instead:** Astro SSR pages with zero client-side JavaScript. For file downloads (floor plans, scope), use `<a href={fileUrl} download>` — no JS needed.

### Anti-Pattern 4: Separate Magic Link Implementations Per Portal Type

**What people do:** Copy the `requestMagicLink` action into `requestContractorMagicLink` and `requestManagerMagicLink`, making three nearly-identical implementations.

**Why it is wrong:** Three action handlers to maintain. Bug fixes must be applied three times. Drift between implementations is inevitable.

**Do this instead:** One `requestMagicLink` action with a `portalType` enum parameter. The lookup function dispatches to the correct Sanity document type. The session payload carries the role. Single implementation, single point of maintenance.

### Anti-Pattern 5: Requiring `projectType == "commercial"` Only in the Building Manager GROQ Query

**What people do:** Rely solely on the GROQ query filter to prevent residential projects from appearing in the building manager portal.

**Why it is wrong:** If a project is incorrectly marked `commercial` in Sanity, it appears in the building manager portal, potentially leaking residential client data. Defense in depth requires the middleware or page to double-check before rendering.

**Do this instead:** Add a server-side guard in the page itself: if a project fetched for the building manager portal is residential (`projectType !== "commercial"`), return 404. The GROQ filter is the first line; the page guard is the second.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-3 contractors (launch) | Current architecture is fine. One Redis instance, one Sanity dataset, no per-contractor isolation needed. |
| 3-20 contractors | No architectural change. Sanity handles 20 contractor documents trivially. Redis sessions are per-user, not per-role. |
| Building manager access (commercial projects only) | One-to-one: one building manager per building. At 3-5 commercial projects, this is a trivial number of building manager users. |
| 20+ contractors | Consider adding contractor specialization filtering in the dashboard if Liz manages many contractors across many projects. Not needed at launch. |

**First bottleneck:** None anticipated. The portal handles 3-10 concurrent users at peak (clients, contractors, managers checking during an installation day). Vercel serverless handles this trivially.

---

## Sources

- Phase 5 RESEARCH.md (`/Users/paulalbert/Dropbox/GitHub/la-sprezzatura/.planning/phases/05-data-foundation-auth-and-infrastructure/05-RESEARCH.md`) — Session model, middleware pattern, magic link auth implementation
- Existing `src/middleware.ts` pattern (Phase 5 implementation) — Middleware guard structure
- Existing `src/actions/index.ts` — Action definition pattern, Zod schema, ActionError
- Existing `src/sanity/schemas/project.ts` — Current schema structure
- Existing `src/sanity/queries.ts` — GROQ query patterns
- [Astro Middleware Docs](https://docs.astro.build/en/guides/middleware/) — `defineMiddleware`, `locals`, `pathname.startsWith()`
- [Sanity Reference Type](https://www.sanity.io/docs/studio/reference-type) — Reference fields, GROQ dereferencing with `->`
- [Sanity Conditional Hidden/ReadOnly](https://www.sanity.io/docs/conditional-fields) — `hidden: ({ parent }) => ...` pattern for commercial-only fields
- [Sanity File Type](https://www.sanity.io/docs/file-type) — File upload fields for contractor/building documents
- [Upstash Redis GETDEL](https://upstash.com/docs/redis/sdks/ts/commands/string/getdel) — Atomic magic link token consumption

---

*Architecture research for: La Sprezzatura v2.5 — Contractor Portal, Building Manager Portal, Engagement Types, Residential/Commercial Classification*
*Researched: 2026-03-16*

# Stack Research

**Domain:** Client operations portal additions to existing luxury interior design website
**Researched:** 2026-03-16
**Confidence:** HIGH
**Scope:** v2.5 NEW stack additions only — contractor portal, building manager portal, COI document management, engagement type system, residential/commercial classification. Existing Astro 6 + Sanity + Tailwind v4 + React 19 + Resend + GSAP + Upstash Redis stack from v1.0/v2.0 is validated and in production. DO NOT re-research or change the existing stack.

---

## Existing Stack (DO NOT change)

Already in production or being built in v2.0 Phase 5:

| Technology | Version | Role |
|------------|---------|------|
| Astro | 6.x | Framework (SSR + static hybrid via Vercel adapter) |
| Sanity | 5.16+ (Studio 3.x) | CMS with embedded Studio at /admin |
| @sanity/client | 7.17.x | GROQ queries, read + write (write token added in Phase 5) |
| @sanity/astro | 3.3.x | Astro integration, Content Layer |
| Tailwind CSS | 4.2.x | Styling via @tailwindcss/vite |
| React | 19.2.x | Interactive islands |
| Resend | 6.4.x | Transactional email |
| GSAP | 3.14.x | Animations |
| @upstash/redis | 1.37.x | Token + session + rate limit storage (Phase 5) |
| @upstash/ratelimit | 2.0.x | Serverless-safe rate limiting (Phase 5) |
| @react-email/components | 1.0.9 | Email UI primitives (Phase 5+) |
| @react-email/render | 2.0.4 | Server-side email rendering (Phase 5+) |
| TypeScript | 5.9.x | Type safety |
| Biome | 2.4.x | Lint + format |
| Vitest | 3.2.x | Unit tests |

---

## New Stack Additions for v2.5

**Summary: Zero new npm packages.** Every v2.5 capability — contractor portal, building manager portal, COI document management, engagement type system, residential/commercial classification — uses existing packages and Sanity's built-in field types. The entire v2.5 milestone is schema + routing + session data changes, not dependency changes.

### 1. Engagement Type System — Sanity `string` with `options.list` (No New Package)

**What:** Add an `engagementType` field to the `project` schema using Sanity's built-in `string` type with a predefined list of allowed values. This is the toggle described in PROJECT.md: Full Interior Design / Styling & Refreshing / Carpet Curating.

**Why this approach:** Sanity's `string` with `options.list` renders as a radio button or select in Studio. No custom input component. No plugin. Conditional field visibility (`hidden` callback) uses the built-in conditional fields API (documented at sanity.io/docs/studio/conditional-fields) to show/hide fields based on the engagement type value. This is the standard pattern for discriminated schemas in Sanity Studio.

**Schema pattern:**
```typescript
// In src/sanity/schemas/project.ts
defineField({
  name: "engagementType",
  title: "Engagement Type",
  type: "string",
  group: "details",
  options: {
    list: [
      { title: "Full Interior Design", value: "full_interior_design" },
      { title: "Styling & Refreshing", value: "styling_refreshing" },
      { title: "Carpet Curating", value: "carpet_curating" },
    ],
    layout: "radio",
  },
  validation: (r) => r.required(),
}),
// Fields shown conditionally based on engagementType:
defineField({
  name: "carpetSpecifications",
  title: "Carpet Specifications",
  type: "object",
  hidden: ({ document }) => document?.engagementType !== "carpet_curating",
  // ... fields
}),
```

**Integration:** No new packages. Uses `@sanity/client` (already installed) for GROQ queries. The portal renders different sections based on `engagementType` — this is a conditional render in Astro, not a schema change.

### 2. Residential / Commercial Classification — Sanity `string` enum (No New Package)

**What:** Add a `projectClassification` field to the `project` schema: `"residential"` or `"commercial"`. This single field gates the building manager portal flow — commercial projects can have building manager access, residential projects cannot.

**Why this approach:** A single string enum is the simplest schema for a binary classification. No boolean (a third classification might be added later — mixed-use, renovation, etc.). The classification field drives: (a) which portal sections appear in the client portal, (b) whether a building manager link can be generated in Sanity Studio, (c) which route namespace the middleware protects.

**Schema pattern:**
```typescript
defineField({
  name: "projectClassification",
  title: "Project Classification",
  type: "string",
  group: "details",
  options: {
    list: [
      { title: "Residential", value: "residential" },
      { title: "Commercial", value: "commercial" },
    ],
    layout: "radio",
  },
  initialValue: "residential",
  validation: (r) => r.required(),
}),
// Building manager fields shown only for commercial:
defineField({
  name: "buildingManagerContacts",
  title: "Building Manager Portal Access",
  type: "array",
  hidden: ({ document }) => document?.projectClassification !== "commercial",
  of: [{ type: "reference", to: [{ type: "buildingManager" }] }],
}),
```

### 3. Contractor Portal — Existing Auth Pattern Extended (No New Package)

**What:** Contractors get magic-link access to a scoped portal view at `/portal/contractor/[projectId]` showing only what they need: floor plans, scope documents, estimate, and minimal client contact info (first name, phone only — not full address). Magic link flow is identical to the client auth flow built in Phase 5.

**Why reuse the v2.0 pattern exactly:** The contractor portal is the same technical problem as the client portal: passwordless access via email magic link, session cookie with 30-day TTL, Upstash Redis for token + session storage, Astro middleware for route protection. No new auth infrastructure. The only differences are: (a) different route prefix (`/portal/contractor/` instead of `/portal/`), (b) different session data shape (`role: "contractor"` + `contractorId` instead of `clientId`), (c) different Sanity document type (`contractor`), (d) different portal UI (fewer sections, scoped data).

**Session data shape for multi-role:**
```typescript
// Upstash Redis session value — store as JSON, not plain string
// key: session:{token}
// value: { role: "contractor", contractorId: "sanity-doc-id", projectId: "sanity-project-id" }
// key: session:{token}  (client)
// value: { role: "client", clientId: "sanity-doc-id" }
// key: session:{token}  (building manager)
// value: { role: "building_manager", buildingManagerId: "sanity-doc-id", projectId: "sanity-project-id" }
```

**Middleware role routing:**
```typescript
// src/env.d.ts - extend App.Locals for type safety
declare namespace App {
  interface Locals {
    portalUser:
      | { role: "client"; clientId: string }
      | { role: "contractor"; contractorId: string; projectId: string }
      | { role: "building_manager"; buildingManagerId: string; projectId: string }
      | null;
  }
}
```

The middleware reads the route prefix, pulls the session from Upstash, and validates that the session role matches the route namespace. A contractor session cannot access `/portal/` (client routes) and vice versa.

**New Sanity document type:** `contractor` — name, email, company, phone, trade/specialty. Same structure as `client` but linked to a project via a `contractors` array on the project schema (parallel to `clients`).

### 4. Building Manager Portal — Existing Auth Pattern, Commercial Only (No New Package)

**What:** Building managers (property managers for commercial projects) get magic-link access to a scoped portal view at `/portal/building-manager/[projectId]` showing COI documents, legal docs, insurance certificates, and contractor schedules. Access is only possible when `projectClassification === "commercial"`.

**Why same auth pattern:** Identical to contractor — magic link email → single-use token → session cookie → middleware guard → scoped Sanity data. No new auth infrastructure.

**New Sanity document type:** `buildingManager` — name, email, company, phone, building address. Linked to a project via `buildingManagerContacts` reference array (hidden unless `projectClassification === "commercial"`).

**Key constraint:** Building manager portal access is only available for commercial projects. The Sanity Studio UI hides building manager fields on residential projects via conditional fields. The Astro middleware validates that the linked project is `projectClassification === "commercial"` before allowing access — defense in depth.

### 5. COI Document Management — Sanity `file` Type (No New Package)

**What:** COIs (Certificates of Insurance), contracts, scope documents, and other legal/compliance files uploaded by Liz in Sanity Studio and surfaced to building managers on their portal. Stored as Sanity file assets.

**Why Sanity's built-in `file` type:** Sanity's `file` field type handles any non-image binary, including PDFs (the standard format for COIs). The file is stored in Sanity's asset CDN with a stable URL. The `accept: "application/pdf"` option restricts uploads to PDFs in Studio. No external storage service (S3, Cloudinary) is needed — Sanity's asset CDN is included in the free and Growth plans and has 20GB storage, far more than enough for a small studio's document collection.

**Schema pattern:**
```typescript
// On project schema — group "building_manager"
defineField({
  name: "coiDocuments",
  title: "COI & Compliance Documents",
  type: "array",
  group: "building_manager",
  hidden: ({ document }) => document?.projectClassification !== "commercial",
  of: [
    defineArrayMember({
      type: "object",
      fields: [
        defineField({ name: "label", title: "Document Label", type: "string",
          description: "e.g., 'General Contractor COI', 'Electrician Insurance Certificate'" }),
        defineField({
          name: "file",
          title: "PDF File",
          type: "file",
          options: { accept: "application/pdf" },
        }),
        defineField({ name: "expirationDate", title: "Expiration Date", type: "date" }),
        defineField({ name: "issuedTo", title: "Issued To (Contractor Name)", type: "string" }),
        defineField({ name: "uploadedAt", title: "Upload Date", type: "datetime",
          readOnly: true }),
      ],
      preview: {
        select: { title: "label", subtitle: "issuedTo" },
      },
    }),
  ],
}),
```

**File URL retrieval for portal display:**
```typescript
// GROQ query — file assets resolve via asset->url
*[_type == "project" && _id == $projectId][0] {
  coiDocuments[] {
    label,
    expirationDate,
    issuedTo,
    "fileUrl": file.asset->url
  }
}
```

**Download link pattern:** Append `?dl=filename.pdf` to the Sanity file asset URL to trigger browser download. No signed URLs needed (see "What NOT to Add" section below).

**Security note:** Sanity file assets on the free/Growth plan are public URLs — anyone with the URL can access the file. This is acceptable for v2.5 because: (a) the URLs are not guessable (Sanity generates opaque asset IDs), (b) the building manager portal itself is auth-gated (magic link session required to reach the page that renders the URLs), (c) COI documents are not sensitive PHI or financial data. If a stricter security posture is required in the future, upgrade to a Sanity Growth plan with private datasets + `@sanity/signed-urls` package.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro middleware (`astro:middleware`) | Built-in, Astro 6.x | Route protection + role injection for contractor, building manager, and client portals | Already used for client portal in Phase 5. Extend with role-aware `locals.portalUser` shape — no new library needed. |
| Sanity `string` with `options.list` | Built-in, Sanity 5.16.x | Engagement type toggle, residential/commercial classification | Zero-plugin conditional UI in Studio. Works with `hidden` callback for field-level conditional visibility. |
| Sanity `file` field type | Built-in, Sanity 5.16.x | COI documents, compliance PDFs, legal documents | Handles any binary (PDF, DOCX). `accept: "application/pdf"` restricts uploads. Stored on Sanity asset CDN. |
| Upstash Redis (`@upstash/redis`) | 1.37.x (already installed) | Session storage for contractor and building manager sessions, same instance as client sessions | Extend existing key namespace: `session:` stores JSON with `role` field. Same Upstash database, different session shapes. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sanity/client` write token | 7.17.x (already installed) | Generate and store contractor/building manager magic link tokens | Same write pattern as client magic links — already set up in Phase 5. No new package. |
| `resend` | 6.4.x (already installed) | Send magic link emails to contractors and building managers | Same `resend.emails.send()` call. Different `to:` address, same `from: noreply@send.lasprezz.com`. |
| `@react-email/components` | 1.0.9 (already installed) | Email templates for contractor and building manager magic links | Reuse or extend the magic link email template built in Phase 5. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit tests for new schema shapes, middleware role routing | Already configured. Add tests for contractor/building-manager session validation paths. |
| Biome | Lint and format | Already configured. No changes needed. |

---

## Installation

```bash
# v2.5 adds ZERO new npm packages.
# All capabilities use existing dependencies.

# If starting fresh (combined v2.0 + v2.5 install):
npm install @upstash/redis @upstash/ratelimit @react-email/components @react-email/render
npm uninstall @calcom/embed-react
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Sanity `file` type for COI documents | External storage (S3, Cloudinary) | Only if file sizes exceed Sanity's 20GB free storage limit, or if access-controlled signed URLs are required on a strict security policy. For a 5-20 person studio with occasional PDF uploads, Sanity asset CDN is sufficient. |
| Sanity `file` type for COI documents | `@sanity/signed-urls` + private datasets | Only if COI documents are genuinely sensitive and must not be accessible without authentication even with a direct URL. Would require upgrading to Sanity Growth plan ($15/seat/month). Not justified for standard COI documents at this scale. |
| Single Upstash Redis instance for all session types | Separate Redis databases per portal type | Unnecessary. Key namespacing (`magic:client:`, `magic:contractor:`, `session:`) provides sufficient isolation in one database. Adding separate databases adds cost and operational complexity for no security benefit. |
| Role field in Redis session JSON | Separate Redis key prefix per role (`client-session:`, `contractor-session:`) | Both work. JSON with `role` field is slightly more flexible (allows adding fields without key pattern changes) and is the documented pattern for multi-role session stores in the Upstash ecosystem. |
| Conditional fields in Sanity for residential/commercial | Separate `residentialProject` and `commercialProject` document types | Two document types would break the single `project` list in Studio and require separate GROQ queries on every portal page. A classification field on a unified document type is simpler to manage and query. |
| Custom auth middleware for each portal type | Separate middleware files per route namespace | Single middleware.ts that reads `context.url.pathname` and branches by route prefix is simpler to maintain. Astro supports only one `src/middleware.ts` — chaining middleware uses `sequence()` but is unnecessary here since the branching is straightforward. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| A separate auth system for contractors/building managers | v2.0 already builds the complete magic link auth infrastructure. Adding Lucia, Better Auth, or any third-party auth library for a second user type would create parallel auth systems with separate session stores and middleware chains — two systems for the same problem. | Extend the Phase 5 magic link pattern: same Upstash Redis, same `Astro.cookies.set()`, same middleware — just a different `role` field in the session JSON. |
| `@sanity/signed-urls` package | Private asset URLs require Sanity Growth plan ($15/seat/month). The free plan only supports public datasets. COI documents for a small interior design studio are low-sensitivity compared to the cost and plan upgrade required. If Liz's business scales and COI security becomes a real concern, the package can be added then. | Public Sanity file URLs (opaque IDs, not guessable) served via auth-gated portal pages. The portal session guard is the access control layer. |
| Prisma / separate database | Contractor and building manager data belongs in Sanity alongside the project it references. Adding a relational database creates two sources of truth for portal data. | New Sanity document types: `contractor`, `buildingManager` — referenced from the `project` schema, same pattern as `client`. |
| A dedicated document management SaaS (DocuSign, PandaDoc, SharePoint) | Overkill for COI certificate storage. These services add cost, require API integrations, and handle contract signing workflows that are not part of the v2.5 scope. COI management for v2.5 is read-only display to building managers — Liz uploads PDFs in Sanity Studio, building manager sees them in the portal. | Sanity `file` field type. If contract signing is needed in the future, evaluate DocuSign integration as a standalone feature. |
| React state management library (Zustand, Redux) | Portal pages are SSR — server renders the full page per request with session data already resolved. No client-side state management is needed. The portal is not a SPA. | Astro SSR pages with Upstash session lookup per request. |
| Separate Vercel project or subdomain for contractor/building manager portals | Same codebase, same Vercel deployment. Route namespacing (`/portal/contractor/`, `/portal/building-manager/`) handles separation. A separate deployment adds DNS, deployment, and auth synchronization complexity. | Route-based separation within the existing Astro project. |

---

## Stack Patterns by Variant

**If engagement type is "Carpet Curating":**
- Show only carpet-specific fields in Sanity Studio (fiber, pile height, pattern repeat)
- Show only carpet-relevant portal sections to client (no milestones tab, no procurement table)
- Conditional display driven by GROQ query returning `engagementType` + Astro conditional render

**If project classification is "Residential":**
- Hide building manager fields in Sanity Studio
- No `/portal/building-manager/[projectId]` route available (middleware returns 404 or redirect)
- Contractor portal still available (contractors work on residential projects too)

**If project classification is "Commercial":**
- Show building manager fields in Sanity Studio
- Enable building manager magic link generation
- COI document upload fields visible in Studio
- Client portal shows "Building access managed by [building manager name]" note

**If contractor portal is accessed:**
- Route: `/portal/contractor/[projectId]`
- Session locals: `{ role: "contractor", contractorId, projectId }`
- Data shown: floor plans, scope docs, estimate, `client.name` (first only) + `client.phone`
- Data NOT shown: client address, procurement costs, artifact decision log, milestones

**If building manager portal is accessed:**
- Route: `/portal/building-manager/[projectId]`
- Session locals: `{ role: "building_manager", buildingManagerId, projectId }`
- Data shown: COI documents, contractor on-site schedule, project address only
- Data NOT shown: client identity, procurement, budget, artifacts

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Sanity 5.16.x `file` type | Sanity asset CDN (free tier) | Public URLs only on free plan. `accept: "application/pdf"` is a MIME type attribute, not a server-side validator — validate file type on upload confirmation in Studio if strict enforcement is needed. |
| `@upstash/redis` 1.37.x | Astro 6 SSR, Vercel serverless | `redis.set(key, JSON.stringify(value))` + `JSON.parse(await redis.get(key))` for typed session objects. Upstash's HTTP client is connectionless — no TCP pool issues in serverless. |
| Sanity conditional fields (`hidden` callback) | Sanity Studio 3.x | `hidden` callbacks receive `{ document, parent, value, currentUser }` — use `document` for top-level field conditions, `parent` for nested object field conditions. Cannot be async. |
| Astro `defineMiddleware` multi-role routing | Astro 6.x, Vercel SSR adapter | Single `src/middleware.ts` handles all portal route prefixes. Use `sequence()` from `astro:middleware` only if middleware grows complex enough to warrant composition — not needed for v2.5. |

---

## File Changes Summary

### New Sanity Schema Files

| File | Purpose |
|------|---------|
| `src/sanity/schemas/contractor.ts` | New `contractor` document type (name, email, company, phone, trade) |
| `src/sanity/schemas/buildingManager.ts` | New `buildingManager` document type (name, email, company, phone, building address) |

### Modified Sanity Schema Files

| File | Change |
|------|--------|
| `src/sanity/schemas/project.ts` | Add `engagementType` field, `projectClassification` field, `contractors[]` reference array, `buildingManagerContacts[]` reference array (commercial only), `coiDocuments[]` file array (commercial only) |
| `src/sanity/schemas/index.ts` | Register `contractor` and `buildingManager` schema types |

### New Portal Pages

| File | Purpose |
|------|---------|
| `src/pages/portal/contractor/[projectId].astro` | Contractor-scoped project view |
| `src/pages/portal/building-manager/[projectId].astro` | Building manager-scoped project view with COI document list |

### New Action Additions

| File | Change |
|------|--------|
| `src/actions/index.ts` | Add `requestContractorMagicLink`, `verifyContractorMagicLink`, `requestBuildingManagerMagicLink`, `verifyBuildingManagerMagicLink` actions (same pattern as client magic link actions from Phase 5) |

### Modified Files

| File | Change |
|------|--------|
| `src/middleware.ts` | Extend to handle `/portal/contractor/` and `/portal/building-manager/` route namespaces with role-aware session validation |
| `src/env.d.ts` | Extend `App.Locals.portalUser` type to discriminated union of client / contractor / building_manager |
| `src/sanity/queries.ts` | Add contractor, building manager, and COI-related GROQ queries |
| `sanity.config.ts` | Add "Contractors" and "Building Managers" to Structure Tool navigation |

### New Email Templates

| File | Purpose |
|------|---------|
| `src/emails/ContractorMagicLinkEmail.tsx` | React Email template for contractor portal access |
| `src/emails/BuildingManagerMagicLinkEmail.tsx` | React Email template for building manager portal access |

---

## Environment Variables

No new environment variables for v2.5. All existing variables from Phase 5 are sufficient:

```bash
# Already configured in Phase 5:
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
SANITY_WRITE_TOKEN=...
RESEND_API_KEY=...
```

---

## Cost Impact

**No additional monthly costs.** All v2.5 additions use existing free-tier services:
- Sanity file assets: Included in free tier (20GB storage)
- Upstash Redis: Same database, same free tier (500K commands/month — a studio with 10 clients + 5 contractors + 3 building managers will use well under this limit)
- Resend: Same API, same 3,000 emails/month free tier
- Vercel: Same deployment, no new functions

Monthly cost remains: Vercel Pro ($20) + Microsoft 365 ($6) + QuickBooks ($30) = ~$56/mo.

---

## Sources

- [Sanity File Type Docs](https://www.sanity.io/docs/studio/file-type) — file field definition, `accept` option, asset reference structure (HIGH confidence)
- [Sanity Assets Docs](https://www.sanity.io/docs/content-lake/assets) — file URL retrieval, `?dl=` download parameter (HIGH confidence)
- [Sanity Asset Visibility Docs](https://www.sanity.io/docs/media-library/asset-visibility) — Private assets require Growth plan or higher; free plan is public-only (HIGH confidence)
- [Sanity Pricing Page](https://www.sanity.io/pricing) — Free plan: public datasets only; Growth plan ($15/seat): private datasets; Media Library is Growth add-on or Enterprise (HIGH confidence)
- [Sanity Conditional Fields Docs](https://www.sanity.io/docs/studio/conditional-fields) — `hidden` callback with `document`/`parent` context, no async support (HIGH confidence)
- [Astro Middleware Docs](https://docs.astro.build/en/guides/middleware/) — `defineMiddleware`, `locals` injection, route-based branching (HIGH confidence)
- [Upstash Redis npm](https://www.npmjs.com/package/@upstash/redis) — v1.37.0 latest (HIGH confidence, verified via npm show)
- [Upstash Ratelimit npm](https://www.npmjs.com/package/@upstash/ratelimit) — v2.0.8 latest (HIGH confidence, verified via npm show)
- [@react-email/components npm](https://www.npmjs.com/package/@react-email/components) — v1.0.9 latest (HIGH confidence, verified via npm show)
- [@react-email/render npm](https://www.npmjs.com/package/@react-email/render) — v2.0.4 latest (HIGH confidence, verified via npm show)
- [Upstash Redis Session Management Pattern](https://upstash.com/blog/session-management-nextjs) — JSON session value with role field, key namespacing (MEDIUM confidence — Next.js blog but pattern is framework-agnostic)
- Existing codebase (`src/lib/rateLimit.ts`, `src/lib/generateToken.ts`, `src/sanity/schemas/project.ts`, `src/pages/portal/[token].astro`) — Direct read; confirmed current patterns, verified reuse points (HIGH confidence)

---
*Stack research for: v2.5 Contractor & Commercial Workflows additions*
*Researched: 2026-03-16*

# Phase 7: Schema Extensions, Multi-Role Auth, and Document Storage - Research

**Researched:** 2026-03-16
**Domain:** Sanity schema extensions, multi-role session architecture, Vercel Blob private storage
**Confidence:** HIGH

## Summary

Phase 7 extends the La Sprezzatura platform in three directions: (1) Sanity schema additions for contractors, building managers, COIs, legal docs, floor plans, and engagement-type-based field gating; (2) multi-role session architecture so contractors (and later building managers) can authenticate via magic link with role-based route protection; and (3) private document storage via Vercel Blob for sensitive files that must not be publicly accessible.

The existing codebase provides strong patterns to follow. The client document type, inline array patterns (milestones, procurement, artifacts), document actions (NotifyClientAction), magic link auth flow, and session management are all well-established. Phase 7 extends these patterns rather than introducing new architectural paradigms. The one genuinely new technology is `@vercel/blob` for private file storage, which requires a custom Sanity Studio input component and a server-side proxy route to serve private files.

**Primary recommendation:** Build incrementally on existing patterns -- clone the client schema for contractors, extend the session value to include role, add field-level hidden callbacks for engagement type gating, and introduce a Sanity custom input component that uploads to Vercel Blob via the client upload SDK pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New `contractor` document type (separate from `client`), registered in schema index and Studio sidebar
- Contractor fields: name, email (unique), phone, company, trades (array of predefined options with custom/Other: Electrician, Plumber, Painter, General Contractor, Custom Millwork, Flooring, HVAC)
- No status field on contractor -- all contractors always visible in Studio
- Project gets a `contractors` inline array of assignment objects (like `clients[]` pattern)
- Each assignment object: contractor reference, estimateFile (Vercel Blob), estimateAmount (integer cents), scope of work (rich text / block content), date range (startDate, endDate), internal notes (plain text, contractor does NOT see)
- Contractor-facing view is called "Work Order" -- contractor-facing only; Studio shows "Contractors" group/tab
- Contractors group/tab hidden in Studio for non-Full Interior Design projects
- Floor plans: project-level array (not per-assignment) -- all contractors on a project see the same floor plans
- Bidirectional navigation: from project see assigned contractors, from contractor document see assigned projects (computed reverse reference view in Studio)
- Session model supports all 3 roles from day one: client, contractor, building_manager
- If an email exists in both client and contractor tables, login flow presents role selection
- Contractor sees a dashboard of all assigned projects after login (like client dashboard), not project-specific links
- Same 30-day session TTL, rate limits, luxury La Sprezzatura aesthetic as clients
- "Send Work Order Access" document action on contractor document in Sanity Studio -- per-contractor action (not bulk)
- Action calls API route (same pattern as notify-artifact: document action -> /api/send-workorder-access -> Resend)
- Magic link email uses same branded template as clients, includes project name(s) the contractor is assigned to
- Subject line variant for contractors (e.g., "Your La Sprezzatura Work Order Access")
- Phase 7 includes a placeholder authenticated page at the contractor route showing "Welcome, [Name]. Your work orders will appear here." -- proves end-to-end auth flow including role-based routing
- Engagement type controls visibility of entire groups/tabs, not individual fields
- Full Interior Design: ALL tabs visible (Content, Portal, Milestones, Procurement, Artifacts, Contractors, + commercial fields if commercial)
- Styling & Refreshing: Content, Portal, Milestones, Artifacts only (Procurement and Contractors tabs hidden)
- Carpet Curating: same as Styling & Refreshing
- Data is preserved when engagement type changes -- fields are just hidden, no confirmation dialog, no data deletion
- Residential/Commercial toggle on project -- building manager fields and COI/legal docs section hidden unless commercial
- Building manager contact info (name, email, phone) as inline object on the project document -- NOT a separate document type
- Hidden unless project is classified as commercial
- Building manager portal auth is Phase 8 (BLDG-02), but the data model and session role support are Phase 7
- COI inline array on commercial projects: issuer/company name, file (Vercel Blob), expiration date, coverage type (General Liability, Workers Comp, Professional Liability, Other), policy number
- Legal documents inline array on commercial projects: document name, file (Vercel Blob), optional description
- Floor plans: project-level inline array: plan name, file (Vercel Blob), optional description; visible for Full Interior Design only
- Contractor trade field is multi-select array -- a contractor can have multiple trades
- Scope of work is rich text (block content) for formatting
- Internal notes on each assignment for Liz only -- never visible to contractor
- COI entries include coverage type and policy number
- All engagement type gating is "hide, don't delete" -- switching types preserves data

### Claude's Discretion
- Session architecture (role field in Redis value vs separate cookies per role)
- Login URL strategy (separate /workorder/login vs single page with auto-detect)
- Which documents go to Vercel Blob vs stay on Sanity CDN (DOCS-01 scope)
- Blob-Sanity integration approach (custom Studio input component vs API-based upload)
- Signed URL expiry TTL (balance security vs usability)
- Residential/Commercial toggle UI (boolean checkbox vs dropdown)
- Tab placement for commercial fields (Portal tab vs separate Building tab)
- Contractor trade dropdown predefined values (base list provided, Claude refines)

### Deferred Ideas (OUT OF SCOPE)
- Contractor portal full UI (scope, floor plans, estimates, deadline, notes display) -- Phase 8
- Building manager portal full UI and magic link auth -- Phase 8
- Client-facing contractor schedule visibility (CVIS-01) -- Phase 8
- Bulk "Send Work Orders" action from project document -- future enhancement
- Contractor status/active tracking -- revisit if needed
- Address autocomplete/geocoding -- carried from Phase 5 deferral
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENGMT-02 | Engagement type controls which Studio fields and portal features are visible per project | Field-level `hidden` callbacks with `document` parameter (groups cannot access document values -- use field-level gating); tab visibility achieved by hiding all fields in a group |
| PRJT-01 | Liz can toggle a project between Residential and Commercial | Boolean `isCommercial` field on project; use `hidden` callback on fields to show/hide commercial sections |
| PRJT-02 | Commercial projects show building manager fields and COI section; residential hides them | `hidden: ({document}) => !document?.isCommercial` on all commercial-only fields |
| CONTR-01 | Liz can create contractor records in Sanity with name, email, phone, company, trade | New `contractor` document type following `client` schema pattern, registered in schema index and Structure tool |
| CONTR-02 | Contractor receives a magic link email -- no password or account creation | Clone magic link flow from Phase 5 with contractor-specific GROQ queries and email template; multi-role session |
| CONTR-05 | Liz uploads final estimate as PDF or inputs dollar amount per contractor per project | Custom Vercel Blob upload input component for estimateFile; integer cents for estimateAmount |
| CONTR-06 | Contractor portal only available for Full Interior Design projects | Session validation checks project engagement type; Contractors tab hidden for non-Full Interior Design in Studio |
| CONTR-07 | Contractor can be assigned to multiple projects; a project can have multiple contractors | `contractors[]` inline array on project with contractor references; reverse reference view via documents-pane plugin |
| BLDG-01 | Liz can add building manager contact info to commercial projects | Inline object `buildingManager` on project, hidden unless `isCommercial` is true |
| DOCS-01 | COI documents, floor plans, and legal documents stored with private access (Vercel Blob with signed URLs) | Vercel Blob private storage with `@vercel/blob` SDK; server-side proxy route for authenticated file delivery |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@vercel/blob` | 2.3.1 | Private document storage (COIs, estimates, floor plans, legal docs) | Vercel's native blob storage; private stores with auth-gated access; integrates with existing Vercel deployment |
| `sanity` | 5.16.0 | CMS schema extensions, Studio customization | Already in use; extends existing schema with new document types and field groups |
| `sanity-plugin-documents-pane` | 3.0.2 | Reverse reference view (contractor -> projects) in Studio | Official Sanity plugin for displaying GROQ query results in document views |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sanity/ui` | (bundled with sanity) | Custom input components for Blob upload widget | Already available; used in existing PortalUrlDisplay component |
| `@upstash/redis` | 1.37.0 | Extended session storage with role field | Already in use; session values extended from string to JSON object |
| `resend` | 6.4.2 | Contractor magic link emails | Already in use; clone branded email template pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel Blob private | Sanity CDN file assets | Sanity CDN files are publicly accessible via URL -- no access control. Vercel Blob private stores require authentication for every read. DOCS-01 requires private access. |
| Vercel Blob private | AWS S3 presigned URLs | S3 has true presigned URLs, but adds AWS dependency, new credentials, and infrastructure outside the Vercel ecosystem. Vercel Blob integrates natively. |
| Custom reverse reference component | `sanity-plugin-documents-pane` | Plugin is maintained by Sanity team, handles GROQ queries in view panes. Custom component would duplicate this functionality. |

**Installation:**
```bash
npm install @vercel/blob sanity-plugin-documents-pane
```

## Architecture Patterns

### Recommended Project Structure (New/Modified Files)
```
src/
├── sanity/
│   ├── schemas/
│   │   ├── contractor.ts          # NEW: Contractor document type
│   │   ├── project.ts             # MODIFIED: contractors[], buildingManager, COIs, legalDocs, floorPlans, isCommercial, field gating
│   │   └── index.ts               # MODIFIED: register contractor type
│   ├── components/
│   │   ├── PortalUrlDisplay.tsx    # EXISTING
│   │   └── BlobFileInput.tsx       # NEW: Custom input component for Vercel Blob uploads
│   └── actions/
│       └── sendWorkOrderAccess.tsx # NEW: Document action for contractor magic link
├── lib/
│   └── session.ts                 # MODIFIED: multi-role session (role in Redis value)
├── middleware.ts                   # MODIFIED: role-based route protection
├── pages/
│   ├── api/
│   │   ├── blob-upload.ts         # NEW: Vercel Blob client upload handler (handleUpload)
│   │   ├── blob-serve.ts          # NEW: Authenticated private blob delivery proxy
│   │   └── send-workorder-access.ts # NEW: Send contractor magic link email
│   └── workorder/
│       ├── login.astro            # NEW: Contractor login page
│       ├── verify.astro           # NEW: Contractor magic link verification
│       └── dashboard.astro        # NEW: Placeholder contractor dashboard
├── actions/
│   └── index.ts                   # MODIFIED: add requestContractorMagicLink action
└── env.d.ts                       # MODIFIED: extend App.Locals with role type
```

### Pattern 1: Multi-Role Session Architecture
**What:** Extend the Redis session value from a plain string (clientId) to a JSON object containing entity ID and role.
**When to use:** When multiple user types share the same auth infrastructure.

**Recommendation (Claude's discretion: session architecture):** Store role in the Redis session value as a JSON object. This is simpler than separate cookies per role because:
- Single cookie (`portal_session`) for all roles -- no cookie proliferation
- Role is authoritative server-side (in Redis), not client-side
- `getSession()` returns `{ entityId, role }` instead of just a string
- Middleware uses role to gate routes

```typescript
// session.ts -- extended session value
interface SessionData {
  entityId: string;  // clientId, contractorId, or buildingManagerId
  role: 'client' | 'contractor' | 'building_manager';
}

export async function createSession(
  cookies: AstroCookies,
  entityId: string,
  role: SessionData['role'],
): Promise<string> {
  const sessionToken = generatePortalToken(32);
  const sessionData: SessionData = { entityId, role };
  await redis.set(`session:${sessionToken}`, JSON.stringify(sessionData), { ex: SESSION_TTL });
  // ... set cookie as before
}

export async function getSession(cookies: AstroCookies): Promise<SessionData | null> {
  const sessionToken = cookies.get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;
  const raw = await redis.get<string>(`session:${sessionToken}`);
  if (!raw) { cookies.delete(COOKIE_NAME, { path: '/' }); return null; }
  // Handle backward compatibility: old sessions store plain clientId string
  try {
    const parsed = typeof raw === 'string' && raw.startsWith('{') ? JSON.parse(raw) : null;
    if (parsed?.entityId && parsed?.role) return parsed;
    // Legacy session: treat as client
    return { entityId: raw, role: 'client' };
  } catch {
    return { entityId: raw as string, role: 'client' };
  }
}
```

### Pattern 2: Role-Based Middleware Routing
**What:** Extend middleware to check session role against route namespace.
**When to use:** When different user types have separate route prefixes.

**Recommendation (Claude's discretion: login URL strategy):** Use separate login paths per role (`/portal/login` for clients, `/workorder/login` for contractors). Reasons:
- URL communicates purpose ("work order" vs "portal")
- Magic link emails can include the correct login URL
- No ambiguity -- each role has a clear namespace
- Role selection only needed when email exists in multiple tables

```typescript
// middleware.ts -- extended
const PUBLIC_PATHS = ['/portal/login', '/portal/verify', '/workorder/login', '/workorder/verify'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Client portal routes
  if (pathname.startsWith('/portal')) {
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return next();
    const session = await getSession(context.cookies);
    if (!session || session.role !== 'client') return context.redirect('/portal/login');
    context.locals.clientId = session.entityId;
    context.locals.role = session.role;
    return next();
  }

  // Contractor work order routes
  if (pathname.startsWith('/workorder')) {
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return next();
    const session = await getSession(context.cookies);
    if (!session || session.role !== 'contractor') return context.redirect('/workorder/login');
    context.locals.contractorId = session.entityId;
    context.locals.role = session.role;
    return next();
  }

  return next();
});
```

### Pattern 3: Vercel Blob Custom Studio Input Component
**What:** A React input component for Sanity Studio that uploads files to Vercel Blob via the client upload SDK, then stores the blob URL/pathname as a string field in Sanity.
**When to use:** For file fields that must use private Vercel Blob storage instead of Sanity CDN.

**Recommendation (Claude's discretion: Blob-Sanity integration):** Custom Sanity Studio input component using Vercel Blob client upload. Reasons:
- Studio runs in the browser -- client upload SDK (`@vercel/blob/client`) handles the token exchange
- Stores blob URL/pathname as a string field in Sanity -- no Sanity CDN involved
- Server-side API route handles token generation (`handleUpload`)
- Liz sees a file picker in Studio; file goes to Vercel Blob; URL is saved to the document

```typescript
// BlobFileInput.tsx -- custom Sanity input for Vercel Blob uploads
import { upload } from '@vercel/blob/client';
import { set, unset, type StringInputProps } from 'sanity';

export function BlobFileInput(props: StringInputProps) {
  const { onChange, value } = props;
  // File input -> upload to Vercel Blob via client SDK -> store URL
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blob = await upload(file.name, file, {
      access: 'private',
      handleUploadUrl: '/api/blob-upload',
    });
    onChange(set(blob.pathname)); // Store pathname, not full URL
  };
  // ... render with @sanity/ui components
}
```

### Pattern 4: Engagement Type Field Gating
**What:** Use field-level `hidden` callbacks with the `document` parameter to conditionally show/hide fields based on `engagementType`.

**CRITICAL FINDING:** Sanity Studio group-level `hidden` callbacks do NOT have access to the `document` parameter -- they only receive `{ currentUser, value, parent }` where `parent` is an array of group definitions, NOT document field values. This means you CANNOT use group `hidden` to conditionally hide entire tabs based on `engagementType`. ([GitHub issue #3305](https://github.com/sanity-io/sanity/issues/3305))

**Workaround:** Apply `hidden` at the field level for every field in the conditionally-visible groups. When ALL fields in a group are hidden, the group tab still appears but shows empty content. To handle this gracefully:
1. Apply `hidden: ({document}) => ...` to every field in the Contractors, Procurement, and commercial groups
2. The tab remains visible but empty when all fields are hidden -- this is acceptable UX for Studio
3. Alternatively, use a wrapper object field per group that is itself hidden, containing all the sub-fields

```typescript
// Field-level hidden for engagement type gating
defineField({
  name: 'contractors',
  title: 'Contractors',
  type: 'array',
  group: 'contractors',
  hidden: ({document}) => document?.engagementType !== 'full-interior-design',
  of: [/* ... */],
}),

// Commercial field gating
defineField({
  name: 'buildingManager',
  title: 'Building Manager',
  type: 'object',
  group: 'portal', // or 'building' -- see recommendation below
  hidden: ({document}) => !document?.isCommercial,
  fields: [/* ... */],
}),
```

**Recommendation (Claude's discretion: tab placement for commercial fields):** Add commercial fields to the Portal tab rather than creating a separate Building tab. Reasons:
- Building manager is a single inline object (not a long list) -- does not warrant its own tab
- COIs and legal docs are project-level concerns that live naturally alongside portal settings
- Fewer tabs = less clutter for Liz
- Fields are hidden for residential projects anyway, so no visual impact on most projects

**Recommendation (Claude's discretion: residential/commercial toggle):** Use a boolean checkbox labeled "Commercial Project" rather than a dropdown. Reasons:
- Binary choice (residential is default, commercial is opt-in)
- Toggle is faster than a dropdown for a yes/no decision
- Consistent with existing boolean patterns (`portalEnabled`, `featured`)

### Pattern 5: Private File Delivery via Proxy Route
**What:** An API route that authenticates the request, fetches the private blob via the SDK, and streams it to the browser.

**CRITICAL FINDING:** Vercel Blob does NOT have true signed URLs like AWS S3. Private blobs require server-side authentication -- you serve files through your own API routes using the `get()` SDK method. The CONTEXT.md references "signed URLs" but the actual implementation is auth-gated proxy routes, which achieves the same security goal (DOCS-01: "direct Blob URLs without a valid signature return an error" -- private blob URLs return 403 without the BLOB_READ_WRITE_TOKEN).

```typescript
// api/blob-serve.ts -- authenticated file proxy
import { get } from '@vercel/blob';
import { getSession } from '../../lib/session';

export const GET: APIRoute = async (context) => {
  const session = await getSession(context.cookies);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const pathname = context.url.searchParams.get('path');
  if (!pathname) return new Response('Missing path', { status: 400 });

  const result = await get(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'Content-Disposition': `inline; filename="${pathname.split('/').pop()}"`,
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
```

**Recommendation (Claude's discretion: signed URL expiry TTL):** Since Vercel Blob uses auth-gated proxy routes (not true signed URLs), the TTL concept does not apply. Files are served through the session-authenticated `/api/blob-serve` endpoint. Access is controlled by session validity (30-day TTL matches existing session lifetime). No separate signed URL TTL needed.

### Anti-Patterns to Avoid
- **Group-level hidden for document value gating:** Sanity group `hidden` callbacks do NOT receive the `document` parameter. Always use field-level `hidden` for conditional visibility based on document field values.
- **Storing private files on Sanity CDN:** Sanity CDN file URLs are publicly accessible. COIs, legal documents, and estimates contain sensitive business information and MUST use Vercel Blob private storage.
- **Hardcoding role in cookie:** Role must be authoritative server-side (in Redis). Never derive role from a client-side cookie value or URL path alone.
- **Sharing session between roles:** If a user has multiple roles (e.g., is both a client and contractor), each role login creates a SEPARATE session. Do not attempt to merge roles into one session -- this complicates authorization.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reverse reference display in Studio | Custom GROQ query component | `sanity-plugin-documents-pane` | Maintained by Sanity team, handles document view panes, GROQ queries, and navigation |
| Client-side blob uploads | Raw fetch to blob API | `@vercel/blob/client` `upload()` + `handleUpload()` | Token exchange, progress tracking, error handling, retry logic all built in |
| Private file serving | Custom auth + direct blob fetch | `@vercel/blob` `get()` with `access: 'private'` | Handles auth headers, streaming, CDN caching, ETag support |
| Rate limiting for contractor magic links | Custom token bucket | `@upstash/ratelimit` with new prefix | Already in use for client magic links and contact form; just add a new rate limiter instance |
| Branded email templates | New email design | Clone existing notify-artifact HTML template | Consistent brand; proven pattern |

**Key insight:** Phase 7 is primarily an extension phase, not a greenfield build. Every major pattern (document types, inline arrays, document actions, magic links, session management, email sending, Studio components) exists in the codebase. The risk is in novel integrations (Vercel Blob + Sanity Studio) and the multi-role session upgrade.

## Common Pitfalls

### Pitfall 1: Group Hidden Does Not Receive Document Values
**What goes wrong:** Developer puts `hidden: ({document}) => ...` on a group definition. The `document` parameter is `undefined` because groups only receive `{ currentUser, value, parent }`.
**Why it happens:** The Sanity API for group-level `hidden` has different callback parameters than field-level `hidden`. This is poorly documented and unintuitive.
**How to avoid:** Apply `hidden` at the field level for every field in conditionally-visible groups. Test that toggling engagement type actually hides/shows the fields in Studio.
**Warning signs:** Fields in a "hidden" group still appear in Studio.

### Pitfall 2: Breaking Existing Client Sessions During Multi-Role Upgrade
**What goes wrong:** Changing the session Redis value format from a plain string (clientId) to a JSON object breaks all existing active sessions.
**Why it happens:** `getSession()` tries to JSON.parse a plain string, gets an error, and returns null -- logging out all existing clients.
**How to avoid:** Implement backward compatibility in `getSession()`. If the Redis value is a plain string (not JSON), treat it as a legacy client session: `{ entityId: value, role: 'client' }`. This allows existing sessions to continue working.
**Warning signs:** Existing logged-in clients suddenly get redirected to login after deployment.

### Pitfall 3: Vercel Blob onUploadCompleted Not Working Locally
**What goes wrong:** The `onUploadCompleted` callback in `handleUpload()` never fires during local development.
**Why it happens:** Vercel Blob calls the callback URL from its servers, but cannot reach localhost. This is documented behavior.
**How to avoid:** For local development, don't rely on `onUploadCompleted`. Instead, use the response from the client `upload()` call to get the blob URL immediately. Only use `onUploadCompleted` for non-critical server-side operations. Alternatively, use ngrok for full local testing.
**Warning signs:** Upload succeeds but blob URL is not saved to Sanity during local testing.

### Pitfall 4: Sanity Studio Input Component Bundling Issues
**What goes wrong:** Importing `@vercel/blob/client` in a Sanity Studio component causes build errors because Studio runs in a different bundler context.
**Why it happens:** Sanity Studio uses its own Vite-based build pipeline. Server-side imports or Node.js-specific modules will fail.
**How to avoid:** The `upload()` function from `@vercel/blob/client` is browser-safe and designed for client-side use. However, import it carefully (dynamic import if needed). Test the Studio build after adding the component.
**Warning signs:** Studio fails to load after adding the BlobFileInput component.

### Pitfall 5: Empty Group Tabs After Field-Level Hidden
**What goes wrong:** When all fields in a group are hidden (e.g., all Procurement fields hidden for Styling & Refreshing projects), the tab still appears but shows empty content.
**Why it happens:** Sanity does not auto-hide groups when all their fields are hidden. This is a known UX limitation.
**How to avoid:** This is acceptable for La Sprezzatura because Liz understands her engagement types. The empty tab serves as a reminder that "these features exist for Full Interior Design." If truly undesirable, implement a group-level hidden using `currentUser` parameter or a static config, but this loses the dynamic per-document behavior. Alternatively, use custom structure builder to conditionally show groups, but this adds significant complexity.
**Warning signs:** Liz sees empty tabs on Styling & Refreshing projects and is confused.

### Pitfall 6: Race Condition on Dual-Role Login
**What goes wrong:** User whose email exists as both client and contractor clicks magic link and gets logged in as the wrong role.
**Why it happens:** The magic link token was created for a specific role, but the verification page doesn't check which role was intended.
**How to avoid:** Store the intended role alongside the entity ID in the magic link Redis entry: `magic:{token}` -> `{ entityId, role }`. The verify page reads the role and creates the session with the correct role.
**Warning signs:** A contractor logs in and sees the client dashboard.

## Code Examples

### Contractor Document Type
```typescript
// src/sanity/schemas/contractor.ts
import { defineType, defineField } from 'sanity';

export const contractor = defineType({
  name: 'contractor',
  title: 'Contractor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
    }),
    defineField({
      name: 'trades',
      title: 'Trades',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Electrician', value: 'electrician' },
          { title: 'Plumber', value: 'plumber' },
          { title: 'Painter', value: 'painter' },
          { title: 'General Contractor', value: 'general-contractor' },
          { title: 'Custom Millwork', value: 'custom-millwork' },
          { title: 'Flooring', value: 'flooring' },
          { title: 'HVAC', value: 'hvac' },
          { title: 'Tile/Stone', value: 'tile-stone' },
          { title: 'Cabinetry', value: 'cabinetry' },
          { title: 'Window Treatments', value: 'window-treatments' },
          { title: 'Other', value: 'other' },
        ],
      },
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'company' },
  },
});
```

### Contractor Assignment on Project
```typescript
// Addition to project.ts contractors array
defineField({
  name: 'contractors',
  title: 'Contractors',
  type: 'array',
  group: 'contractors',
  hidden: ({document}) => document?.engagementType !== 'full-interior-design',
  of: [
    defineArrayMember({
      type: 'object',
      fields: [
        defineField({
          name: 'contractor',
          title: 'Contractor',
          type: 'reference',
          to: [{ type: 'contractor' }],
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'estimateFile',
          title: 'Estimate File',
          type: 'string', // Stores Vercel Blob pathname
          components: { input: BlobFileInput },
        }),
        defineField({
          name: 'estimateAmount',
          title: 'Estimate Amount (cents)',
          type: 'number',
          validation: (r) => r.integer().min(0),
          description: 'Amount in cents (e.g., 150000 = $1,500.00)',
        }),
        defineField({
          name: 'scopeOfWork',
          title: 'Scope of Work',
          type: 'array',
          of: [{ type: 'block' }],
        }),
        defineField({
          name: 'startDate',
          title: 'Start Date',
          type: 'date',
        }),
        defineField({
          name: 'endDate',
          title: 'End Date',
          type: 'date',
        }),
        defineField({
          name: 'internalNotes',
          title: 'Internal Notes',
          type: 'text',
          rows: 3,
          description: 'For Liz only -- never visible to contractor',
        }),
      ],
      preview: {
        select: { title: 'contractor.name', subtitle: 'contractor.company' },
        prepare: ({ title, subtitle }) => ({
          title: title || 'Select contractor',
          subtitle: subtitle || '',
        }),
      },
    }),
  ],
}),
```

### GROQ Queries for Contractors
```typescript
// Contractor by email (magic link lookup)
export const CONTRACTOR_BY_EMAIL_QUERY = `
  *[_type == "contractor" && email == $email][0] {
    _id,
    name,
    email
  }
`;

// Projects assigned to a contractor (for dashboard)
export const PROJECTS_BY_CONTRACTOR_QUERY = `
  *[_type == "project" && portalEnabled == true &&
    engagementType == "full-interior-design" &&
    contractors[].contractor._ref == $contractorId
  ] | order(projectStatus asc) {
    _id,
    title,
    pipelineStage,
    projectStatus,
    "assignment": contractors[contractor._ref == $contractorId][0] {
      startDate,
      endDate
    }
  }
`;
```

### Vercel Blob Upload API Route (Astro)
```typescript
// src/pages/api/blob-upload.ts
import type { APIRoute } from 'astro';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Sanity Studio is authenticated via its own auth -- no additional check needed
        // since only Studio users can reach the upload component
        return {
          allowedContentTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
          ],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // No-op for now; blob URL is stored by the Studio component
        console.log('[BlobUpload] Upload completed:', blob.pathname);
      },
    });

    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

## Discretion Recommendations Summary

| Decision Area | Recommendation | Rationale |
|---------------|---------------|-----------|
| Session architecture | JSON object in Redis value `{ entityId, role }` | Single cookie, server-authoritative role, backward-compatible |
| Login URL strategy | Separate paths: `/portal/login` (client), `/workorder/login` (contractor) | Clear namespace per role; magic link emails point to correct URL |
| Blob vs Sanity CDN | Estimates, COIs, legal docs, floor plans -> Vercel Blob private. Portfolio images, artifacts -> stay on Sanity CDN. | DOCS-01 requires private access for sensitive docs. Portfolio/artifact files are client-viewable and fine on CDN. |
| Blob-Sanity integration | Custom Studio input component using `@vercel/blob/client` `upload()` | Browser-compatible; stores pathname in Sanity string field; proven pattern (PortalUrlDisplay already uses custom input) |
| Signed URL TTL | Not applicable -- Vercel Blob uses auth-gated proxy | Private blobs served via `/api/blob-serve` with session auth |
| Residential/Commercial toggle | Boolean checkbox `isCommercial` | Binary choice; consistent with existing boolean patterns |
| Commercial fields tab placement | In Portal tab, grouped together | Building manager is a small inline object; COIs/legal docs are few fields; separate tab not warranted |
| Contractor trades | Base list + Tile/Stone, Cabinetry, Window Treatments, Other | Covers common interior design trades; "Other" handles edge cases |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sanity CDN for all files | Vercel Blob private storage for sensitive documents | Vercel Blob private storage GA 2025 | COIs, estimates, legal docs are access-controlled |
| Single-role session | Multi-role session with JSON value in Redis | Phase 7 | Same infrastructure supports client + contractor + building_manager |
| Unconditional Studio fields | Engagement-type-gated field visibility | Phase 7 | Liz sees only relevant fields per project type |

**Important version notes:**
- `@vercel/blob` >= 2.3 is required for private storage support
- `sanity-plugin-documents-pane` 3.x is for Sanity Studio v3

## Open Questions

1. **Empty group tabs UX**
   - What we know: When all fields in a group are hidden via field-level `hidden`, the tab still appears but shows empty content. Sanity does not auto-hide groups based on field visibility.
   - What's unclear: Whether this is confusing for Liz or acceptable.
   - Recommendation: Ship with the empty tabs initially. If Liz finds it confusing, investigate custom structure builder to conditionally render tabs. This is a UX polish item, not a blocker.

2. **Vercel Blob storage limits and pricing**
   - What we know: Vercel Blob has storage limits per plan. Hobby: 100MB, Pro: 1GB (expandable).
   - What's unclear: How many files Liz will upload over time (COIs, estimates, floor plans, legal docs).
   - Recommendation: Start with Pro plan (1GB). Monitor usage. COIs and estimates are typically small PDFs (50-500KB each). Even with 100 projects with 5 files each, total storage would be well under 1GB.

3. **Dual-role email overlap frequency**
   - What we know: A person could be both a client and a contractor (e.g., a contractor who also hired Liz for their own home).
   - What's unclear: How often this actually occurs.
   - Recommendation: Build the role selection flow but keep it simple -- a role picker page that shows after email verification when the email exists in both tables. This is a low-frequency edge case.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENGMT-02 | Engagement type controls field visibility (hidden callbacks return correct boolean) | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "engagement"` | Wave 0 |
| PRJT-01 | isCommercial toggle controls commercial field visibility | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "commercial"` | Wave 0 |
| PRJT-02 | Commercial fields hidden when isCommercial is false | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "commercial"` | Wave 0 |
| CONTR-01 | Contractor document type has required fields | unit | `npx vitest run src/sanity/schemas/contractor.test.ts` | Wave 0 |
| CONTR-02 | Contractor magic link flow (email lookup, token generation) | unit | `npx vitest run src/lib/session.test.ts -t "contractor"` | Wave 0 |
| CONTR-05 | EstimateAmount stored as integer cents | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "estimate"` | Wave 0 |
| CONTR-06 | Contractors tab hidden for non-Full Interior Design | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "engagement"` | Wave 0 |
| CONTR-07 | Contractors array accepts multiple contractor references | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "contractors"` | Wave 0 |
| BLDG-01 | Building manager fields present and hidden when not commercial | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "building"` | Wave 0 |
| DOCS-01 | Blob serve route requires auth; returns 401 without session | unit | `npx vitest run src/pages/api/blob-serve.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/sanity/schemas/project.test.ts` -- covers ENGMT-02, PRJT-01, PRJT-02, CONTR-05, CONTR-06, CONTR-07, BLDG-01 (hidden callback tests)
- [ ] `src/sanity/schemas/contractor.test.ts` -- covers CONTR-01 (schema validation)
- [ ] `src/lib/session.test.ts` -- covers CONTR-02 (multi-role session create/get with backward compatibility)
- [ ] `src/pages/api/blob-serve.test.ts` -- covers DOCS-01 (auth-gated file serving)

## Sources

### Primary (HIGH confidence)
- [Vercel Blob Private Storage](https://vercel.com/docs/vercel-blob/private-storage) -- Private blob delivery pattern, `get()` API, caching, auth-gated proxy
- [Vercel Blob SDK (`@vercel/blob`)](https://vercel.com/docs/vercel-blob/using-blob-sdk) -- `put()`, `get()`, `del()` API reference, version 2.3.1
- [Vercel Blob Client Uploads](https://vercel.com/docs/vercel-blob/client-upload) -- `handleUpload()`, token exchange, `onBeforeGenerateToken`, `onUploadCompleted`
- [Sanity Field Groups](https://www.sanity.io/docs/studio/field-groups) -- Group `hidden` callback parameters: `{ currentUser, value, parent }` (NO `document`)
- [Sanity Conditional Fields](https://www.sanity.io/docs/studio/conditional-fields) -- Field `hidden` callback parameters: `{ document, parent, value, currentUser }`
- Existing codebase: `src/lib/session.ts`, `src/middleware.ts`, `src/sanity/schemas/project.ts`, `src/sanity/actions/notifyClient.tsx`, `src/pages/api/notify-artifact.ts`

### Secondary (MEDIUM confidence)
- [sanity-plugin-documents-pane](https://www.npmjs.com/package/sanity-plugin-documents-pane) -- v3.0.2, GROQ-driven document view panes for reverse references
- [GitHub sanity-io/sanity#3305](https://github.com/sanity-io/sanity/issues/3305) -- Confirmed limitation: group hidden does not receive `document` parameter
- [Vercel Blob signed URLs issue](https://github.com/vercel/storage/issues/544) -- Confirmed: no true signed URLs; private blobs use auth-gated proxy pattern

### Tertiary (LOW confidence)
- None -- all critical claims verified against primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- `@vercel/blob` docs verified, Sanity version confirmed, existing codebase patterns well understood
- Architecture: HIGH -- All patterns extend existing codebase; multi-role session is a straightforward extension; Vercel Blob private storage is well-documented
- Pitfalls: HIGH -- Group hidden limitation verified via GitHub issue and official docs; session backward compatibility is a known upgrade pattern; Vercel Blob local dev limitation is documented
- Vercel Blob integration with Sanity Studio: MEDIUM -- No existing examples of this specific combination; approach is sound (browser-safe client SDK + custom input component) but needs implementation validation

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (30 days -- all technologies stable)

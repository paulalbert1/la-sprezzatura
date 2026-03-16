# Pitfalls Research

**Domain:** Adding contractor portal, building manager portal, engagement types, and residential/commercial workflows to an existing Astro 6 + Sanity interior design platform
**Researched:** 2026-03-16
**Confidence:** HIGH (v2.5 pitfalls drawn from codebase inspection, official Sanity/Astro docs, and documented failure patterns for multi-role portals)

---

> **Scope note:** This file covers pitfalls for **v2.5 Contractor & Commercial Workflows**, which adds on top of the v2.0 Client Portal Foundation (Phases 5-6). Read alongside the v2.0 pitfalls preserved at the bottom of this file. The v2.5 pitfalls are ordered by severity — the first three are the most likely to cause data breaches or rewrites.

---

## Critical Pitfalls

### Pitfall 1: Client PII Leaks to Contractors via Insufficiently Scoped GROQ Queries

**What goes wrong:**
The GROQ query for the contractor portal fetches a project document and inadvertently includes client contact data. The `project` document now has a `clients[]` reference array with contact info (name, email, phone, address). A contractor-facing query that projects `clients->` — or fails to explicitly exclude it — exposes the client's full contact record to any contractor who receives a magic link. The contractor's magic link resolves to a project session; if the same `getProjectByPortalToken` query function is reused (or slightly modified) for the contractor portal, the field projection must be explicitly and permanently restricted.

**Why it happens:**
Developers reuse the existing portal query for both client and contractor views because it already fetches the project in the right shape. The instinct is to start from what works and remove fields. But GROQ projections are whitelists — if you specify `clients->` anywhere in the projection tree, all subfields come through unless you explicitly project only safe ones. The contractor query must be built from scratch as a separate, independently audited function, not forked from the client query.

**How to avoid:**
1. Create a dedicated `getProjectByContractorToken()` GROQ query in `src/sanity/queries.ts` — never reuse `getProjectByPortalToken()` for contractors.
2. The contractor query projection must include **only**: project title, project address (street/city — NOT the client's home address), scope of work, floor plans (if stored as file assets), estimate amount, and on-site schedule dates. Nothing else.
3. Never project `clients->` in contractor queries. The client reference on the project should not appear in any contractor-visible data shape.
4. Write a unit test that asserts the contractor GROQ projection does NOT include any of: `email`, `phone`, `preferredContact`, `clients.client`, or any field from the `client` document type. The test verifies the query string itself, not just the runtime output.
5. On the Astro portal route layer, add a second check: after the GROQ query returns, assert `typeof project.clientEmail === 'undefined'` before rendering. Belt and suspenders.

**Warning signs:**
- The contractor portal query contains `clients->` at any nesting level
- The same `queries.ts` function is called from both client and contractor portal pages
- There is no unit test asserting the contractor data shape

**Phase to address:**
v2.5 Phase 1 (Contractor Portal Schema and Auth) — must be the first thing reviewed before any contractor-facing route is built.

---

### Pitfall 2: Sanity File Assets Are Public by Default — COI Documents and Floor Plans Are Exposed

**What goes wrong:**
COI (Certificate of Insurance) documents uploaded for commercial projects, floor plans uploaded for contractor review, and any other files stored as Sanity `file` type assets are publicly accessible via their CDN URL by default. Anyone with the URL can download the file. Sanity file asset URLs follow a predictable pattern (`https://cdn.sanity.io/files/{projectId}/{dataset}/{assetId}.pdf`). Once a URL is known (e.g., a contractor shares the floor plan URL directly), it is permanently accessible with no session requirement. For COI documents containing insurance policy numbers and coverage details, this is a meaningful disclosure risk.

**Why it happens:**
Sanity uploads all assets with public visibility by default. Private asset visibility is available but requires the **Media Library+ add-on** (paid, not included in free or Growth base plans). The free-tier assumption — "Sanity handles this" — is wrong for documents requiring access control. Developers upload files via Sanity Studio, see them load correctly in the portal, and assume the portal's session guard controls access. It does not: the CDN URL bypasses the portal entirely.

**How to avoid:**
1. Do NOT store COI documents or any document that should be contractor/client-restricted as plain Sanity file assets unless you are on a plan with private asset support or are willing to proxy every download.
2. For v2.5 at free-tier scale: use **Vercel Blob** (`@vercel/blob`) for document storage. Vercel Blob supports private uploads with signed download URLs that expire. Liz uploads via a custom upload endpoint in the Astro app (not Sanity Studio). The Sanity document stores only the Blob URL and metadata (filename, size, uploadedAt). The Astro portal generates a fresh signed URL at render time.
3. Alternative: store files in Sanity (for Studio UX simplicity) but proxy all downloads through an Astro server route (`/portal/documents/[id]`) that validates the session before generating the Blob download response. This adds complexity but keeps the upload UX in Sanity Studio.
4. Floor plans shared with contractors: same treatment. Store in Vercel Blob, serve via signed URL generated at request time with a short TTL (1 hour).
5. If Sanity Media Library+ is adopted later (for the signed URL feature), migration is straightforward — update the download URL generation to use `@sanity/signed-urls`. But do not plan on this being available in v2.5 at current pricing.

**Warning signs:**
- Files are viewable by opening the browser console and copying the `src` attribute of any `<a href>` or `<iframe>` on the portal
- A file URL shared out of context (e.g., via Slack by a contractor) remains downloadable indefinitely
- COI documents appear in the Sanity Media Library with public visibility indicator

**Phase to address:**
v2.5 Phase 1 (Document Storage Architecture) — this is an architecture decision that affects every subsequent phase. Choose the storage approach before writing any upload or display code.

---

### Pitfall 3: Role Confusion in Astro Middleware When Contractors and Clients Share `/portal/*` Routes

**What goes wrong:**
The v2.0 portal middleware protects all `/portal/*` routes by checking for a `portal_session` cookie that maps to a `clientId` in Upstash Redis. When contractors are added, a second session type is needed (`contractorId`) with different permissions. If the middleware is extended by simply adding an `OR` check — "if client session OR contractor session, allow access" — then a contractor with a valid session can access client-specific routes (`/portal/dashboard`, `/portal/project/[id]`) and vice versa. The middleware must gate on **role** within the session, not just session existence.

**Why it happens:**
The v2.0 middleware was designed for a single user type. Extending it for multiple types by adding `||` conditions is the path of least resistance. The developer validates that contractors can reach the contractor dashboard and clients can still reach their dashboard, but does not test cross-role access (can a contractor reach `/portal/project/[id]`?). The routes look different but the middleware passes all authenticated sessions through.

**How to avoid:**
1. Store a `role` field alongside the user ID in the Redis session: `{ id: contractorId, role: "contractor" }` and `{ id: clientId, role: "client" }` (and `role: "building-manager"` for the third user type).
2. In `src/middleware.ts`, resolve the session and inject both `context.locals.userId` and `context.locals.userRole`.
3. Each portal page does its own role check at the top of the frontmatter: `if (Astro.locals.userRole !== "contractor") return Astro.redirect("/portal/login")`.
4. Route structure enforces separation: `/portal/client/*` routes check for `role === "client"`, `/portal/contractor/*` routes check for `role === "contractor"`, `/portal/building-manager/*` routes check for `role === "building-manager"`.
5. Write explicit cross-role access tests: verify that a contractor session token cannot access `/portal/client/dashboard`, and a client session cannot access `/portal/contractor/project/[id]`.

**Warning signs:**
- Middleware checks only `sessionToken !== null` without inspecting role
- A single `portal_session` cookie format is used for all three user types without a role discriminator
- There are no tests asserting cross-role access is denied

**Phase to address:**
v2.5 Phase 1 (Multi-Role Auth Extension) — must redesign the session shape before any new portal routes are created.

---

### Pitfall 4: Engagement Type Hidden Fields Still Validate and Store Data in Sanity

**What goes wrong:**
The engagement type toggle (Full Interior Design / Styling & Refreshing / Carpet Curating) controls which fields are visible in Sanity Studio via the `hidden` callback on field definitions. The intent is: if engagement type is "Carpet Curating," then procurement tracking fields are hidden because they are irrelevant. But Sanity's `hidden` property only controls UI visibility — it does NOT prevent data from being written to, stored in, or validated against those fields. Validation rules (`rule.required()`) still fire on hidden fields unless explicitly suppressed with `rule.skip()`. More dangerously: data entered in a "Full Interior Design" project remains in the document even if the project is later switched to "Carpet Curating" — the hidden fields are invisible in Studio but their data is still there and will be returned by GROQ queries.

**Why it happens:**
The Sanity documentation states clearly that `hidden` controls only display, not storage. But developers naturally assume that if a field is hidden, its data is absent. This assumption leads to GROQ queries returning unexpected fields for projects of the wrong engagement type, and validation errors blocking publish when fields are hidden (because `rule.required()` still fires).

**How to avoid:**
1. Never put `rule.required()` on a field that can be hidden by engagement type without also wrapping it in a conditional validation: replicate the `hidden` condition logic in the validation rule and call `rule.skip()` when the field is hidden.
2. Add a note to every conditionally-hidden field's description: "Only relevant for [engagement type] projects. Data is preserved if engagement type changes."
3. In GROQ queries for portal display, add engagement type as a filter condition before projecting engagement-specific fields: only include procurement fields in the projection if `engagementType == "full-interior-design"`.
4. Document explicitly that switching a project's engagement type in Studio does NOT clear existing data in fields that become hidden — Liz must understand this if she ever reclassifies a project.
5. If engagement type switching should truly clear irrelevant data, build a custom Sanity document action that clears fields when the type changes. This is optional complexity — only add if Liz encounters the stale-data confusion in practice.

**Warning signs:**
- Publish fails with "required field" error on a field that is hidden because of engagement type
- Portal displays procurement data for a "Carpet Curating" project
- GROQ query returns populated fields for an engagement type that should not have them

**Phase to address:**
v2.5 Phase 1 (Engagement Type Schema Design) — must be addressed in the schema before any engagement-conditional fields are created.

---

### Pitfall 5: Building Manager Portal Added as an Afterthought, Breaking Commercial-Only Conditional Logic

**What goes wrong:**
The building manager portal is commercial-only — it only exists for projects with `projectType === "commercial"`. If the commercial/residential toggle is added as a simple boolean or string field without considering its downstream effects on the entire portal system, conditional logic becomes scattered and fragile. Common failure modes: the "Building Manager" section shows in Studio for residential projects (confusing Liz), the middleware allows building manager magic links to resolve on residential projects, and the client-facing portal shows a "Building Manager" section for residential clients.

**Why it happens:**
The commercial/residential distinction is treated as a display toggle rather than a first-class data model decision. Developers add `projectType` field, hide/show things conditionally, and assume the UI hiding is sufficient. But magic link generation, portal route access, GROQ queries, and Studio structure must ALL be aware of project type.

**How to avoid:**
1. Treat `projectType` ("residential" or "commercial") as a required field on the project schema with no default — Liz must explicitly classify every project. Make this the FIRST visible field in the Studio form.
2. Building manager magic link generation in Studio should only appear when `projectType === "commercial"` — use a custom Studio action or document action conditionally rendered based on project type.
3. In middleware: when a building manager magic link is verified, check that the associated project is `projectType === "commercial"`. If not, invalidate the session and show an error. Do not assume a valid session means a valid project type.
4. Client portal route: check `projectType` before rendering any commercial-only sections (building manager schedule, COI status). This protects against the scenario where a project's type was changed after a building manager session was created.
5. In Studio, use field groups: a "Commercial" group that only contains commercial-specific fields (COI fields, building manager contact, lease/permit fields). Set this group's visibility to `hidden({ document }) => document.projectType !== 'commercial'`. This keeps the Studio clean for residential projects.

**Warning signs:**
- "Add Building Manager" option appears in Studio for residential projects
- A building manager magic link resolves to a residential project (even if Liz never sends one, the code path must be guarded)
- Commercial-only fields (COI, lease number) appear in the portal or Studio for residential projects

**Phase to address:**
v2.5 Phase 1 (Project Type Data Model) — the `projectType` field must be in the schema and its downstream implications thought through before building manager or commercial-specific features are built.

---

### Pitfall 6: Contractor Data Model Is Separate from Client Model but Shares the Same Magic Link Auth Flow — Token Namespace Collision

**What goes wrong:**
The v2.0 magic link flow stores tokens in Upstash Redis with the key pattern `magic:{token}` and sessions with `session:{sessionToken}`. The contractor magic link system, if implemented as a copy of the client flow, uses the same key patterns. A contractor token and a client token could theoretically collide if `generatePortalToken()` produces the same value (statistically improbable at 32 chars, but architecturally unsound). More practically: if the same session cookie name (`portal_session`) is used for both contractor and client sessions, a contractor who has a valid client session from a different browser tab has unexpected cross-role access.

**Why it happens:**
The contractor auth is implemented by copying the client magic link pattern without adding role discrimination. The developer tests each role in isolation and it works. The session lookup in middleware finds a valid entry and passes the user through without checking whether the session role matches the requested route.

**How to avoid:**
1. Namespace all Redis keys by role: `magic:client:{token}`, `magic:contractor:{token}`, `magic:building-manager:{token}`. This prevents namespace collision and makes Redis keyspace inspection readable.
2. Store role in the session value, not just the user ID: `await redis.set('session:{token}', JSON.stringify({ id: contractorId, role: 'contractor' }), ...)`. The middleware deserializes this and sets both `context.locals.userId` and `context.locals.userRole`.
3. Use a single `portal_session` cookie — one cookie, one session — but ensure the session value carries the role discriminator. Do NOT use separate cookies per role (`client_session`, `contractor_session`) as this adds surface area for confusion.
4. Magic link expiry TTLs can differ: contractor links might use a shorter TTL (5 minutes) since contractors are accessing work-related data, not personal project status.

**Warning signs:**
- Redis keys for magic links do not include role in the key name
- Session deserialization returns only an ID without a role field
- Middleware checks `if (clientId || contractorId)` by attempting separate lookups

**Phase to address:**
v2.5 Phase 1 (Auth Architecture for Multiple Roles) — address in the session design before writing any magic link generation for contractors.

---

### Pitfall 7: Sanity Studio UX Breaks for Liz as Document Complexity Grows with Multiple Roles and Types

**What goes wrong:**
By the end of v2.5, the `project` document in Sanity Studio will have fields for: portfolio content, client portal settings, client references, milestones, procurement items, artifacts, project type (residential/commercial), engagement type, contractor references (name, scope, schedule), building manager contact (commercial only), COI documents (commercial only), and legal document fields. Without disciplined field grouping, Liz opens a project document and is confronted with 40+ fields across scrollable form. She makes errors because relevant fields are not near each other. She cannot find the contractor section. She forgets to set project type. The Studio UX becomes a liability.

**Why it happens:**
Field groups are added incrementally as features are built. Each phase adds a new group or appends to an existing one. No one steps back to look at the full document from Liz's perspective until it is too late and there is real data in production.

**How to avoid:**
1. Before writing a single line of v2.5 schema code, draw the complete field group structure for the finished project document: what tabs will exist, what fields are in each, and what Liz's most common tasks are.
2. Recommended final group structure:
   - "Content" (default): portfolio content, photos, testimonial
   - "Project Details": type (residential/commercial), engagement type, location address, admin notes
   - "Client Portal": client references, portal token, portal enabled, pipeline stage
   - "Milestones": milestone array
   - "Procurement": procurement item array (hidden for Carpet Curating)
   - "Artifacts": upload/document array
   - "Contractors": contractor references, scope, schedule (hidden for... actually all engagement types can have contractors)
   - "Commercial" (conditional, hidden for residential): building manager, COI documents, legal docs
3. Add `description` fields to every field that might be ambiguous: "This controls what sections appear in the client portal" not just "Engagement Type."
4. Schedule a Studio review with Liz after v2.5 Phase 1 schema work, before Phase 2 portal builds. Her feedback on the Studio experience is more valuable than any code review.

**Warning signs:**
- Project document has more than 6 field groups
- Liz asks "where is the contractor section?" when it is on the same page, just below the fold
- Fields added for one feature appear in the "wrong" group because the developer didn't check context

**Phase to address:**
v2.5 Phase 1 (Schema Design Review) — design the full group structure before adding any fields.

---

### Pitfall 8: Contractor "Name + Address Only" Rule Is Not Enforced at the Query Layer

**What goes wrong:**
The specification says contractors see only the client's name and the project address — no client contact info (email, phone, preferred contact method). This restriction is documented as a product requirement. But if it is only enforced at the UI layer (the contractor portal template simply does not render email/phone), the underlying GROQ query still returns this data to the Astro page. A developer debugging a query issue logs `project` to the console or examines the page source and sees client PII. More seriously: if the Astro portal is ever modified, a developer could accidentally render a field that was already being fetched.

**Why it happens:**
Developers enforce data restrictions at the rendering layer ("I just won't show it") rather than the query layer. The query layer restriction is the correct defense because it prevents the data from ever entering the request lifecycle.

**How to avoid:**
1. The contractor GROQ query must project exactly and only: `{ title, projectAddress, "clientFirstName": clients[isPrimary == true][0].client->name, scopeOfWork, scheduleItems[], estimateAmount }`. No `email`, no `phone`, no `address` from the `client` document.
2. To show "client name," project only the first name (or full name — this is a business decision) from the client reference, not the entire client document.
3. TypeScript type the return value of `getProjectByContractorToken()` explicitly so that the type literally does not include email/phone fields. TypeScript will then fail to compile if a template tries to render `project.clientEmail`.
4. Do not rely on UI "hiding" for PII protection. Query-layer restriction + TypeScript typing is the correct approach.

**Warning signs:**
- `getProjectByContractorToken()` and `getProjectByPortalToken()` share any part of their projection structure
- The contractor portal Astro page receives a `project` object that has `typeof project.clientEmail !== 'undefined'`
- There is no TypeScript type for the contractor data shape — it is typed as `any` or as the same type as the client project

**Phase to address:**
v2.5 Phase 1 (Contractor Query Design) — enforced in the GROQ query before contractor routes are built.

---

### Pitfall 9: Commercial-Only Features Silently Break Residential Projects When Project Type Changes After Data Entry

**What goes wrong:**
Liz creates a project, sets it as commercial, adds a building manager, uploads COI documents, and sets lease information. Then the client calls and says it is actually a residential renovation at their commercial property — or vice versa. Liz changes `projectType` from "commercial" to "residential" in Studio. The commercial-only fields are now hidden in Studio, but their data persists. The client portal no longer shows the commercial section (good). But if the portal GROQ query uses `projectType` to decide whether to include building manager data, and the type was changed AFTER a building manager session was created, the building manager still has an active session that resolves to a project now classified as residential.

**Why it happens:**
Project type changes are treated as a Studio-only UI event. There is no cascade logic: changing `projectType` does not invalidate sessions, does not clear commercial-specific data, and does not prevent active magic links from resolving.

**How to avoid:**
1. In the middleware, every building manager session validation must re-check the associated project's `projectType` from Sanity. Cache the result in the Redis session for performance, but re-validate on each request if the session was issued more than 24 hours ago. A stale session on a project that changed type should redirect to the login page.
2. Add a warning to the Studio document: when `projectType` is changed, display a custom validation warning (not an error — let the change proceed, but warn): "Changing project type hides commercial fields. Existing data is preserved but not shown. Active contractor or building manager sessions remain valid until they expire."
3. Liz should understand that changing project type does not invalidate magic links already sent. If she changes type, she should delete and regenerate any outstanding building manager magic links.

**Warning signs:**
- A building manager can access the portal for a project recently reclassified as residential
- Changing `projectType` in Studio has no feedback to Liz about session implications
- Commercial-specific data (COI documents, lease number) is returned in GROQ queries for a project now classified as residential

**Phase to address:**
v2.5 Phase 2 (Commercial Workflow) — address in the session validation logic and Studio UX.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reusing `getProjectByPortalToken()` for contractor queries with minor modifications | Faster to build, less code | Client PII leakage risk, no independent audit trail for contractor data shape | Never. Contractor query must be a separate, independently typed function. |
| Storing all user sessions with a single key pattern (`session:{token}`) without role | Simple Redis structure | Cross-role access possible if middleware logic has a bug; Redis keyspace is unreadable during debugging | Never for multi-role systems. Add role to session value and key prefix. |
| Using Sanity file assets for COI documents without private asset visibility | No additional infrastructure | COI documents publicly accessible via CDN URL forever | Never for documents with insurance policy numbers or sensitive legal info. Use Vercel Blob with signed URLs. |
| Enforcing client-data restrictions at the template layer only | Faster to build, "it just won't show" | PII exists in the Astro request lifecycle; logging/debugging exposes it; template modifications accidentally re-expose it | Never for PII. Always enforce at the query layer. |
| One big `projectType` conditional in the middleware (`if residential || if commercial`) | Simple middleware, easy to read | Breaks when a third project type is needed; all conditional logic is in one place | Acceptable for exactly two project types. Refactor if a third is added. |
| Hiding commercial fields with `hidden` callback instead of separate document types | Simpler schema, one document | Hidden field data persists after type changes; Studio has many conditionally shown/hidden fields that are hard to reason about | Acceptable if Liz rarely changes project type. Revisit if type-switching becomes a workflow pattern. |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sanity file assets for COI/floor plan storage | Uploading via Sanity Studio and assuming portal session guards control access | Sanity file assets are public CDN URLs by default. Use Vercel Blob for documents requiring access control. Store only metadata (filename, blobUrl) in Sanity. |
| Upstash Redis for multi-role sessions | Using same key prefix for all role types (`session:{token}`) | Namespace by role (`session:client:{token}`, `session:contractor:{token}`). Makes Redis keyspace inspectable and prevents naming collisions. |
| Sanity conditional fields for engagement-type-gated content | Relying on `hidden` to prevent data exposure in GROQ queries | `hidden` is UI-only. GROQ queries return all fields regardless of `hidden` state. Add engagement type filter to GROQ projection. |
| Resend magic link emails for contractors | Sending from the same template/action as client magic links without differentiating subject/body | Contractors receive a work-related link, not a client portal link. Use a distinct email template, subject line, and from display name context that makes the purpose clear. |
| Sanity document validation with conditional fields | Adding `rule.required()` to fields that are hidden by engagement type or project type | `rule.required()` fires on hidden fields and blocks publish. Use `rule.custom((value, context) => { if (isHidden(context.document)) return true; return value ? true : 'Required'; })` to conditionally skip. |
| Building manager magic link generation | Generating a building manager token without checking `projectType` | The magic link generation action must assert `project.projectType === 'commercial'` before creating and storing the token. Prevents building manager tokens from being issued for residential projects. |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all contractor and client data in a single GROQ query for middleware session validation | Sub-100ms in dev with test data | Separate the session validation query (minimal: `{ _id, projectType, portalEnabled }`) from the portal render query (full data). Middleware needs only the minimal shape. | Every portal request hitting Sanity for a full document during middleware — adds latency proportional to document size. |
| Generating signed Vercel Blob URLs on every portal page load | Works fine for 1-2 documents | Cache signed URLs in Redis with TTL slightly shorter than the signed URL TTL. Regenerate only when expired. | Projects with 10+ documents (COI, floor plans, permits) cause 10+ Blob API calls on every contractor page load. |
| Re-validating session against Sanity on every request in middleware | Correct behavior, adds ~50ms per request | Cache the `projectType` and `portalEnabled` in the Redis session value (with a 1-hour TTL on the cached metadata). Refresh from Sanity when cache is stale. | Fine at current scale (< 20 concurrent users). Becomes noticeable at 100+ concurrent portal sessions. |
| All engagement type conditional logic in a single massive `hidden` callback | Readable with 3 engagement types | Extract engagement type condition to a shared utility function: `isEngagementType(document, 'full-interior-design')`. Reuse across multiple field `hidden` callbacks. | Becomes unreadable when 4+ engagement types exist or conditions are nested. |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Contractor magic links sent via email without time-limited expiry | A forwarded email gives permanent portal access to non-contractors | Set contractor magic link TTL to 15 minutes (same as client) and contractor sessions to a shorter duration: 7 days vs. client 30 days. Contractors are transactional users, not long-term portal subscribers. |
| COI document URLs stored permanently in Sanity without expiry | An old COI URL (e.g., for a contractor whose engagement ended) remains permanently accessible | Use Vercel Blob signed URLs with 24-hour TTL. Store only the Blob asset ID in Sanity, not the signed URL. Generate fresh URLs at render time. |
| No audit trail of who accessed the contractor portal | Impossible to detect if a contractor shared their magic link | Log every contractor portal page load: `{ contractorId, projectId, ip, timestamp }` — append to an `accessLog` array on the project or write to a separate Sanity document. Low cost, high value for dispute resolution. |
| Building manager can access any commercial project if the token validation only checks role | A building manager token issued for Project A could theoretically access Project B's route | Tie every magic link token to a specific project ID in Redis: `{ userId: bmId, role: 'building-manager', projectId: '...' }`. Middleware verifies the session's `projectId` matches the route's project ID before granting access. |
| Engagement type visible to contractors | A contractor portal showing "Full Interior Design" reveals the project scope and budget tier | Never expose `engagementType` in the contractor data shape. It is Liz's internal classification, not contractor-relevant information. |
| Admin notes on project address visible to contractors | Notes like "Gate code: 1234" or "Key lockbox behind the hydrangea" are security-sensitive | Project address GROQ projection for contractors must include only `{ street, city, state, zip }` — never `adminNotes`. This is a separate sub-field exclusion from the full address object. |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Contractor portal looks identical to client portal with different data | Contractors are confused about what they're looking at; they expect a work-focused view, not a client experience | Distinct visual treatment for contractor portal: more functional, less editorial. Different color emphasis (same brand, different section hierarchy). Heading: "Project Brief" not "Your Project Journey." |
| Sending contractor a magic link to a complex portal with too many sections | Non-technical contractors are overwhelmed; they just need floor plan, scope, schedule | The contractor portal should be deliberately minimal. Maximum 3 sections: Project Overview (address, scope), Documents (floor plans, files), and Schedule (on-site dates). No procurement data, no milestone timeline, no budget. |
| Building manager receives same onboarding email as client | Building managers have a professional context; they need COI verification and legal docs, not a "welcome to your project" tone | Separate magic link email template for building managers: professional tone, explains what documents are available (COI, permits), includes building address prominently. |
| Engagement type toggle in Studio is unlabeled about consequences | Liz changes engagement type mid-project not realizing it hides procurement data she already entered | Add a Studio-level warning when engagement type is changed on a project with existing data in the affected arrays: "Changing to Carpet Curating will hide procurement fields. Existing procurement data is preserved." |
| No way to tell which projects have active contractor sessions in Studio | Liz cannot see at a glance which projects currently have a contractor with portal access | Add a "Contractor Access" section to the Studio sidebar indicator (existing `PortalUrlDisplay` pattern). Show: last magic link generated date, number of active sessions (0 or N), last access timestamp. |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Contractor GROQ query:** Often assumes the query is safe — verify by logging the full return value and asserting `email`, `phone`, and `clients` reference are absent
- [ ] **COI document storage:** Often stored in Sanity file assets and assumed secure — verify by opening the file URL in a browser with no active session; it should return 403, not the file
- [ ] **Building manager session gating:** Often tested only for happy path — verify that a building manager session resolves correctly on commercial projects AND is rejected on residential projects
- [ ] **Engagement type conditional fields:** Often assumed "hidden = not there" — verify by checking the project document JSON in Sanity that non-applicable engagement type fields don't contain stale data from prior classification
- [ ] **Cross-role access denial:** Often tested per-role but not cross-role — verify explicitly that a contractor session cookie cannot access `/portal/client/dashboard` and a client session cannot access `/portal/contractor/[id]`
- [ ] **Admin notes field exclusion:** Often missed — verify the contractor portal GROQ projection does NOT include `projectAddress.adminNotes`
- [ ] **Project type change cascade:** Often not tested — change a project from commercial to residential in Studio, verify the building manager section disappears from the client portal and existing building manager sessions are flagged as stale
- [ ] **Contractor magic link email template:** Often forgotten — verify the email received by a contractor looks professional and work-focused, not like a client welcome email
- [ ] **Commercial fields hidden for residential in Studio:** Often only tested for new documents — verify that an existing residential project document has no visible commercial fields after saving

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Client PII leaked to contractor via query | HIGH (reputational + legal) | Immediately invalidate all contractor sessions for the affected project. Audit Sanity access logs and Vercel function logs to determine what data was fetched and when. Notify Liz. Fix query, deploy, regenerate contractor access. Document the incident. |
| COI documents publicly accessible via CDN | MEDIUM | Cannot revoke a URL already served publicly. Migrate documents to Vercel Blob with signed URLs. Issue new document URLs to building managers. If the exposed document contained policy numbers, notify the insurance carrier. |
| Cross-role access exploit discovered | HIGH | Immediately invalidate all active sessions (flush relevant Upstash Redis keys). Redesign the session role structure. Re-issue magic links to all active users after fix is deployed. Audit logs for any unauthorized cross-role access. |
| Engagement type change destroys visible procurement data | LOW | Data is not deleted — it's hidden. Re-set engagement type to the previous value in Studio to recover visibility. Then address the root cause (add a warning on type change). |
| Project type changed mid-project while building manager session is active | LOW | Manually invalidate the building manager's Redis session key. Inform Liz that she should regenerate the building manager link if the project is reclassified back to commercial. |
| Stale admin notes field exposed to contractor | MEDIUM | No exposure if caught before production. If deployed: immediately update the contractor GROQ query to exclude `adminNotes`, redeploy, and change any gate codes or access notes that were exposed. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Client PII leaks via contractor GROQ query | v2.5 Phase 1 (Contractor Auth + Schema) | Separate `getProjectByContractorToken()` function exists; TypeScript type excludes email/phone; unit test asserts projection shape |
| COI documents publicly accessible | v2.5 Phase 1 (Document Storage Architecture) | All documents served via Vercel Blob signed URLs; direct CDN URL returns 403 without session |
| Role confusion in middleware | v2.5 Phase 1 (Multi-Role Auth Extension) | Redis session stores `{ id, role, projectId }`; cross-role access tests pass |
| Engagement type hidden fields validate/store | v2.5 Phase 1 (Engagement Type Schema) | Conditional validation uses `rule.skip()`; GROQ queries filter by engagement type before projecting conditional fields |
| Building manager as commercial-only afterthought | v2.5 Phase 1 (Project Type Data Model) | `projectType` is required field; building manager magic link generation guarded by project type check |
| Token namespace collision | v2.5 Phase 1 (Auth Architecture) | Redis keys prefixed `magic:client:`, `magic:contractor:`, `magic:building-manager:`; session value includes `role` |
| Studio UX complexity for Liz | v2.5 Phase 1 (Schema Design Review) | Field group structure reviewed with Liz; no more than 7 groups; commercial group is conditionally hidden for residential |
| Contractor data restriction at UI layer only | v2.5 Phase 1 (Contractor Query Design) | TypeScript type for contractor data shape has no PII fields; build fails if template references `project.clientEmail` |
| Commercial features breaking on type change | v2.5 Phase 2 (Commercial Workflow) | Session re-validates project type on each request; Studio shows warning on type change |
| Admin notes exposed to contractors | v2.5 Phase 1 (Contractor Query Design) | GROQ projection test asserts `adminNotes` is absent from contractor data shape |

---

## Sources

- [Sanity: GROQ query security and parameter sanitization](https://www.sanity.io/answers/groq-queries-and-security-in-sanity-io) — GROQ projections as whitelists, parameter injection prevention (HIGH confidence)
- [Sanity: Asset visibility — public by default, private requires Media Library+](https://www.sanity.io/docs/media-library/asset-visibility) — File assets are public CDN URLs unless private visibility is enabled (HIGH confidence, verified via docs + pricing)
- [Sanity: Private assets require Media Library+ add-on](https://www.sanity.io/pricing) — Free and Growth base plans do not include private asset signed URLs (MEDIUM confidence — verified pricing page)
- [Sanity: Conditional fields — `hidden` is UI-only, does not prevent storage](https://www.sanity.io/docs/studio/conditional-fields) — Hidden fields still store and validate data (HIGH confidence)
- [Sanity: Conditional validation must replicate hidden logic to call `rule.skip()`](https://www.sanity.io/answers/how-to-require-a-field-conditionally-with-custom-validation) — `rule.required()` fires on hidden fields (HIGH confidence)
- [Sanity: Roles and permissions — additive model, GROQ content resources cannot resolve references](https://www.sanity.io/docs/roles) — Studio-level access control limitations (HIGH confidence)
- [Astro: Middleware — single global file, no route-specific middleware](https://docs.astro.build/en/guides/middleware/) — Role-based routing must be handled via conditional logic in one middleware file (HIGH confidence)
- [OWASP: Session Management Cheat Sheet — role storage in session token](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — Session must store role for multi-role systems (HIGH confidence)
- [Sanity: Disable validation for hidden/nested fields — Issue #3937](https://github.com/sanity-io/sanity/issues/3937) — Known issue with validation firing on hidden fields (HIGH confidence)
- [Upstash: Redis key namespace patterns](https://github.com/upstash/ratelimit-js) — Key prefixing for multi-purpose Redis databases (HIGH confidence)
- Codebase inspection: `src/pages/portal/[token].astro`, `src/sanity/schemas/project.ts`, `src/lib/rateLimit.ts`, `src/sanity/queries.ts`, `src/actions/index.ts`, `src/lib/generateToken.ts` — Direct read; confirmed current patterns and existing GROQ query structure (HIGH confidence)

---

## Preserved: v2.0 Client Portal Foundation Pitfalls

The pitfalls below were researched for v2.0 (Phases 5-6). They remain valid and are not superseded by v2.5 additions.

### Critical (v2.0)

**Sanity Schema Monolith** (addressed in v2.0 Phase 5): Separate `client` document type; milestones/procurement/artifacts as inline arrays on project.

**Float Financial Data** (addressed in v2.0 Phase 5, PROC-03): All financial values stored as integer cents. `rule.integer().min(0)` on every financial field.

**PII Without Access Controls** (addressed in v2.0 Phase 5): Client document type holds PII; Sanity roles restrict access; data retention review at project closeout.

**In-Memory Rate Limiter on Serverless** (addressed in v2.0 Phase 5, INFRA-07): Replaced with `@upstash/ratelimit` sliding window.

**Budget Proposals as Mutable Documents** (addressed in v2.0 Phase 6): Proposals have `version`, `status`, and `sentAt`. `sent` proposals are read-only via `readOnly` conditional.

**Email Delivery Failures** (addressed in v2.0 Phase 5, INFRA-08): `send.lasprezz.com` subdomain verified in Resend; SPF/DKIM isolated from Microsoft 365 MX on root domain.

**Astro.cookies.set() Lost Through new Response()** (addressed in v2.0 Phase 5 middleware): Use `context.redirect()` not `new Response()` in middleware to preserve cookie operations.

**Session cookie maxAge vs expires** (addressed in v2.0 Phase 5): Always `maxAge: 60 * 60 * 24 * 30`, never `expires: new Date(...)`.

**Sanity `_ref` syntax in GROQ filters** (addressed in v2.0 Phase 5): Use `references($clientId)` built-in, not `clients[client == $clientId]`.

**Resend DNS propagation timing** (addressed in v2.0 Phase 5): Add `send.lasprezz.com` DNS records at the start of Phase 5 execution; allow 24-48h propagation before testing.

---

*Pitfalls research for: La Sprezzatura v2.5 — Contractor Portal, Building Manager Portal, Engagement Types, and Residential/Commercial Workflows*
*Researched: 2026-03-16*

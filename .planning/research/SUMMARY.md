# Project Research Summary

**Project:** La Sprezzatura — v2.5 Contractor & Commercial Workflows
**Domain:** Multi-role portal extension on existing Astro 6 + Sanity + Vercel interior design platform
**Researched:** 2026-03-16
**Confidence:** HIGH

## Executive Summary

La Sprezzatura v2.5 extends the client portal foundation built in v2.0 (Phases 5-6) into three new use cases: a contractor portal for trades on Full Interior Design projects, a building manager portal for commercial property managers, and a residential/commercial project classification that gates which portal surfaces are available. The entire milestone is achievable with zero new npm dependencies — every capability uses existing packages (Astro middleware, Sanity built-in types, Upstash Redis, Resend, React Email). The architecture is an extension of proven patterns already in production, not a new system.

The recommended approach is to treat this milestone as schema + routing + session data changes. The engagement type system already exists on the project schema from Phase 5. The magic link auth infrastructure already exists. The session cookie and Upstash Redis storage already exist. v2.5 adds new document types (`contractor`, `buildingManager`), extends the project schema with a `projectType` field and commercial-specific document arrays, widens the session payload to carry a `role` discriminator, and adds two new route namespaces (`/contractor/*`, `/manager/*`) guarded by the existing middleware extended for multi-role routing.

The three critical risks are: (1) client PII leaking to contractors through insufficiently scoped GROQ queries — requires separate, independently typed query functions that never project client contact fields; (2) Sanity file assets being publicly accessible by default — the PITFALLS research recommends Vercel Blob with signed URLs rather than plain Sanity CDN URLs for COI documents and floor plans; and (3) role confusion in the middleware allowing cross-portal session access — requires storing a `role` field in the Redis session payload and validating that the session role matches the requested route namespace on every request.

## Key Findings

### Recommended Stack

v2.5 adds zero new npm packages. Every capability uses the existing stack. The key reuse points are: Astro's `defineMiddleware` extended with namespace-aware role routing, Sanity's `string` with `options.list` for the engagement type and project type toggles, Sanity's `file` field type for document upload UI in Studio (metadata only — actual files go to Vercel Blob per PITFALLS recommendation), and Upstash Redis for all three session types under a unified `session:{token}` key storing a JSON payload `{ userId, role }`.

**Core technologies:**
- Astro 6 middleware (`src/middleware.ts`): Route protection for all three portal namespaces — same file, extended with `ROLE_NAMESPACES` lookup and role-mismatch rejection
- Sanity `string` with `options.list`: Engagement type toggle and residential/commercial classification — zero plugin, conditional field visibility via `hidden` callback
- Sanity `file` field type: Document upload UI in Studio for COI documents and floor plans — metadata stored in Sanity, actual files in Vercel Blob
- Upstash Redis (`@upstash/redis` 1.37.x, already installed): Session storage extended to JSON `{ userId, role }` — same database, new session shape with role-namespaced Redis keys
- Resend + React Email (already installed): Magic link emails for contractor and building manager portals — new templates, same `resend.emails.send()` call

**Version requirements:** No version changes needed. All existing package versions support v2.5 requirements. No additional monthly costs.

### Expected Features

**Must have (P1 — table stakes for launch):**
- Residential/commercial `projectType` toggle on project schema — the gating mechanism that controls all commercial-only features; build first, required field, no default
- Contractor portal (`/contractor/[id]`) — scope, floor plans, deadline, estimate, notes, "refer to Liz" contact; magic link auth; Full Interior Design engagement type only
- Building manager portal (`/manager/[id]`) — COI document list with expiration badges, legal docs, designer contact; magic link auth; commercial projects only
- COI document management in Sanity Studio — array of PDF uploads with expiration date, label, and contractor name fields; hidden for residential projects
- Legal docs section in Sanity Studio — generic document array for building-specific compliance paperwork; commercial only
- Client portal update: contractor on-site schedule visibility — when contractors are assigned to a project, show contractor name and on-site dates in the client milestones view
- Conditional field display in Sanity Studio — commercial group hidden for residential; contractor section shown only for Full Interior Design engagement type
- COI expiration visual badges — compare expiration date against current date; show "Expired" or "Expiring soon" badge; no automated reminders in v2.5

**Should have (P2 — after v2.5 is stable in production):**
- Engagement type controls portal section depth — Styling & Refreshing shows milestones and artifacts only; Carpet Curating shows milestones only
- COI expiration alerts to Liz — email notification when a COI is within 30 days of expiring

**Defer to v3+:**
- Building manager multi-project view (dashboard for managers overseeing multiple projects in one building)
- COI renewal automated emails to contractors
- Contractor bid submission portal
- Contractor-to-designer messaging in portal
- Photo upload by contractors

**Anti-features — do not build:**
- Client contact information in the contractor portal — all communication routes through Liz
- Approval workflow in the building manager portal — document drop only, not a compliance platform
- Separate auth system for contractors/building managers — extend the existing magic link pattern
- External document SaaS (DocuSign, SharePoint) — Sanity Studio upload plus Vercel Blob is sufficient
- React state management library — the portal is SSR, not a SPA

### Architecture Approach

The v2.5 architecture is additive: three route namespaces guarded by one extended middleware, two new Sanity document types, a widened session payload, and role-scoped GROQ queries. The engagement type toggle and residential/commercial classification both live on the `project` document as `string` fields with `options.list`, making project type a first-class schema attribute. Session data evolves from `clientId: string` (v2.0 Phase 5) to `{ userId, role }` JSON — with backward compatibility logic in `decodeSession()` for existing client sessions that expire naturally within 30 days. Document storage splits between Sanity Studio (upload UX and metadata) and Vercel Blob (actual files with signed URLs generated at render time).

**Major components:**
1. Extended `src/middleware.ts` — reads `pathname.startsWith()` to determine namespace; validates `portal_session` cookie; deserializes `{ userId, role }` from Redis; rejects role-namespace mismatches with redirect; injects `locals.userId` and `locals.userRole`; maintains `locals.clientId` alias for backward compatibility with existing Phase 5/6 portal pages
2. Sanity schema extensions — two new document types (`contractor`, `buildingManager`); `projectType` field and commercial-specific arrays (`buildingDocuments[]`, building manager reference) on `project`; `engagementType` enforcement via conditional `hidden` callbacks; conditional validation using `rule.skip()` for hidden fields to prevent publish errors
3. Role-scoped GROQ queries in `src/sanity/queries.ts` — separate `getProjectByContractorToken()` and `getProjectByBuildingManagerToken()` functions with explicit TypeScript return types that exclude PII fields at the compile-time level
4. Document storage layer — Sanity Studio handles upload UX; files stored in Vercel Blob; Sanity stores Blob URL + metadata; signed URLs generated at portal render time, cached in Redis with TTL slightly shorter than URL expiry
5. Three portal route namespaces — `/portal/*` (client, existing), `/contractor/*` (new), `/manager/*` (new) — each with login, verify, and project detail pages; all share the magic link flow via `portalType` parameter on a shared action in `src/actions/index.ts`

### Critical Pitfalls

1. **Client PII leaks to contractors via GROQ queries** — Create a dedicated `getProjectByContractorToken()` function in `src/sanity/queries.ts`; never reuse the client portal query; TypeScript type the return value so `email`, `phone`, and `clients` reference are absent at the type level (compile fails if template tries to render them); add a unit test asserting the contractor projection shape excludes all PII fields. Enforce at the query layer, not the template layer.

2. **Sanity file assets are publicly accessible by default** — Do not use plain Sanity CDN URLs for COI documents or floor plans. Store files in Vercel Blob with signed URLs; store only the Blob asset ID in Sanity. Generate fresh signed URLs at portal render time. Cache signed URLs in Redis with a TTL slightly shorter than the signed URL expiry to avoid regenerating on every page load for projects with many documents.

3. **Role confusion in middleware allowing cross-portal access** — Store `{ userId, role }` in the Redis session value (not just a user ID); namespace Redis magic link keys by role (`magic:client:`, `magic:contractor:`, `magic:building-manager:`); reject sessions where `session.role !== expectedRoleForNamespace`; write explicit cross-role access tests before launch (contractor session cannot access `/portal/dashboard`; client session cannot access `/contractor/project/[id]`).

4. **`hidden` callback on Sanity fields does not prevent storage or validation** — Fields hidden by `engagementType` or `projectType` still validate and store data. Wrap `rule.required()` with a conditional that calls `rule.skip()` when the field would be hidden. Add engagement type / project type filter to GROQ projections for portal display — do not rely on UI hiding to prevent stale data from rendering.

5. **Building manager portal treated as commercial-only afterthought** — `projectType` must be a required field and the first visible field in the Studio form. Magic link generation for building managers must assert `projectType === 'commercial'` before issuing the token. Middleware must re-validate project type on every building manager session, not just at login, to handle projects reclassified after a session was issued.

## Implications for Roadmap

All of v2.5 fits in two phases with a clear dependency order. Phase 1 must establish the data model, auth extension, and document storage architecture before any portal UI is built — the pitfalls above are architectural decisions that cannot be safely retrofitted after routes exist.

### Phase 1: Schema, Auth Extension, and Document Storage Foundation

**Rationale:** Every v2.5 feature depends on this work. The `projectType` field gates the building manager portal. The extended session model enables multi-role routing. The document storage decision (Vercel Blob vs. Sanity CDN) must be made before any upload UI is built. All nine critical pitfalls from PITFALLS.md are addressed in this phase — they cannot be deferred.

**Delivers:**
- `contractor` and `buildingManager` Sanity document types registered in `src/sanity/schemas/index.ts`
- `projectType` (residential/commercial) field on project schema as a required first-position field
- `engagementType` field verified or added (if not fully present from Phase 5)
- Field group structure for the `project` document reviewed with Liz; commercial group conditionally hidden for residential; no more than 7 total groups
- `contractorDocuments[]` and `buildingDocuments[]` arrays on project schema with commercial-only `hidden` callbacks and `rule.skip()` conditional validation
- Extended session model: `{ userId, role }` JSON in Upstash Redis; backward-compatible `decodeSession()` in `src/lib/session.ts`; extended `App.Locals` with `userId` + `userRole` + backward-compat `clientId` alias; Redis key namespacing by role
- Vercel Blob integration for document storage; signed URL generation utility cached in Redis
- `getProjectByContractorToken()` and `getProjectByBuildingManagerToken()` GROQ queries with explicit TypeScript types excluding PII
- Unit tests: contractor projection shape excludes PII; cross-role session rejection; building manager magic link issuance guarded by project type

**Avoids:** Pitfalls 1 (PII leak), 2 (public file assets), 3 (role confusion), 4 (hidden field validation), 5 (commercial-only afterthought), 6 (token namespace collision), 7 (Studio UX complexity), 8 (data restriction at UI layer only)

### Phase 2: Contractor Portal, Building Manager Portal, and Portal UI

**Rationale:** Builds user-facing surfaces on top of the validated Phase 1 foundation. Contractor and building manager portals are parallel and independent — they share infrastructure but are separate views. The client portal update (contractor on-site schedule) is a small addition that belongs here.

**Delivers:**
- Extended `src/middleware.ts` with namespace-aware role routing for `/contractor/*` and `/manager/*`; role-namespace mismatch rejection
- `/contractor/login`, `/contractor/verify`, `/contractor/project/[id]` pages
- `/manager/login`, `/manager/verify`, `/manager/project/[id]` pages
- Contractor portal UI: project address, scope, floor plans (signed Blob download links), deadline, estimate, notes, "refer to Liz" contact block; branded but minimal
- Building manager portal UI: client name + building address, COI document list with expiration badges, legal docs download list, designer contact
- `requestContractorMagicLink`, `verifyContractorMagicLink`, `requestBuildingManagerMagicLink`, `verifyBuildingManagerMagicLink` actions in `src/actions/index.ts`
- `ContractorMagicLinkEmail.tsx` and `BuildingManagerMagicLinkEmail.tsx` React Email templates — distinct professional tone, not the client welcome template
- Client portal update: contractor on-site schedule section visible in milestones view when contractors are assigned to the project
- Sanity Studio: "Contractors" and "Building Managers" added to Structure Tool navigation

**Avoids:** Pitfall 9 (commercial features breaking on project type change — middleware re-validates project type on every building manager session request)

### Phase Ordering Rationale

- Phase 1 before Phase 2: GROQ query architecture, session model, and document storage decisions directly determine what Phase 2 UI can render. Building portals before establishing typed data shapes is the fastest path to PII leakage.
- `projectType` field is the first schema change in Phase 1: It is the gating condition for every commercial feature. It must exist before building manager fields, COI arrays, or building manager magic link generation.
- Studio group structure reviewed with Liz before Phase 2 portal builds: Pitfall 7 documents how easily the project document becomes unusable. A Studio review after Phase 1 schema work catches this before portal UI creates a false sense of "done."
- Contractor and building manager portals are parallelizable within Phase 2: They share infrastructure but are independent views and can be built in any order.
- Session backward compatibility: Phase 5 stored `clientId` as a plain string. The `decodeSession()` migration path handles this transparently, with old sessions expiring within 30 days without forced logout.

### Research Flags

Phases needing deeper research during planning:

- **Phase 1 (Document storage — Vercel Blob vs. Sanity CDN):** STACK.md and PITFALLS.md take conflicting positions. STACK.md recommends Sanity file assets as sufficient (opaque URLs, portal auth gating). PITFALLS.md recommends Vercel Blob with signed URLs (CDN URL bypasses session gating entirely). This is the most significant unresolved question in the research. Phase 1 planning must resolve this before writing any upload code. Recommendation: follow PITFALLS.md — the security argument is stronger.
- **Phase 1 (Session model migration):** Phase 5 stored `clientId` as a plain string in Redis. The exact Phase 5 implementation must be read before writing `decodeSession()` to confirm the migration path is safe.

Phases with standard patterns (skip research-phase):

- **Phase 2 (Magic link auth for new portal types):** The client magic link pattern from Phase 5 is fully documented. Extending to additional `portalType` values is mechanical — no new research needed.
- **Phase 2 (Contractor/building manager portal UI):** Astro SSR pages with session-gated GROQ data and signed Blob download links are standard patterns in the existing codebase. No novel integration.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new packages confirmed via npm, Sanity docs, and Astro docs. Cost impact verified: no change to monthly total ($56/mo). Existing codebase read to confirm reuse points. |
| Features | HIGH | Feature matrix (engagement type x project type x portal type) clearly defined with explicit anti-features. NYC COI requirements sourced from domain-specific references (BGES Group, NYC building manager guides). |
| Architecture | HIGH | Extends a working, production-deployed system. Session model migration has a clear backward-compatible path. Route namespace strategy is straightforward and testable. |
| Pitfalls | HIGH | Drawn from codebase inspection (Phase 5 patterns confirmed), official Sanity docs on `hidden` behavior and asset visibility, and OWASP session management guidance. Sanity file asset public-by-default risk verified against pricing page. |

**Overall confidence:** HIGH

### Gaps to Address

- **Sanity file assets vs. Vercel Blob:** STACK.md and PITFALLS.md conflict on this. Resolve in Phase 1 planning before writing any upload code. Recommended resolution: use Vercel Blob per PITFALLS.md guidance.
- **Engagement type field from Phase 5:** ARCHITECTURE.md notes that `engagementType` may already exist as a required field on the project schema. If it has `validation: r => r.required()`, existing documents without a value will fail validation after v2.5 deploys new conditional fields that depend on it. Must read the Phase 5 implementation before starting Phase 1 schema work.
- **Contractor portal engagement type gating rule:** FEATURES.md gates the contractor portal on Full Interior Design only. Confirm with Liz whether Styling & Refreshing commercial projects can also use contractor portal access before finalizing the schema `hidden` callback logic.

## Sources

### Primary (HIGH confidence)
- [Sanity Conditional Fields Docs](https://www.sanity.io/docs/studio/conditional-fields) — `hidden` callback is UI-only, does not prevent storage or validation
- [Sanity Asset Visibility Docs](https://www.sanity.io/docs/media-library/asset-visibility) — public by default on free plan; private requires Media Library+ add-on
- [Sanity Pricing Page](https://www.sanity.io/pricing) — Free plan: public datasets; Growth $15/seat: private datasets
- [Astro Middleware Docs](https://docs.astro.build/en/guides/middleware/) — `defineMiddleware`, `locals` injection, single middleware file
- [Sanity File Type Docs](https://www.sanity.io/docs/studio/file-type) — `accept`, `asset->url` GROQ dereference, `?dl=` download param
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — role storage in session for multi-role systems
- Existing codebase (`src/lib/rateLimit.ts`, `src/lib/generateToken.ts`, `src/sanity/schemas/project.ts`, `src/pages/portal/[token].astro`, `src/actions/index.ts`) — Phase 5 patterns confirmed directly

### Secondary (MEDIUM confidence)
- [Upstash Redis Session Management Pattern](https://upstash.com/blog/session-management-nextjs) — JSON session value with role field; pattern is framework-agnostic
- [Buildertrend Subcontractor Portal](https://buildertrend.com/help-article/subcontractor-overview/) — industry norm: client contact hidden from subs; job address, notes, and documents visible
- [NYC COI Requirements - BGES Group](https://bgesgroup.com/certificate-of-insurance-coi-requirements-for-ny-projects-a-contractors-guide) — general liability $1M/$2M, workers' comp, additional insured endorsement, ACORD 25 standard form
- [Magic Links for Contractor Portals - Descope](https://www.descope.com/blog/post/magic-link-uses) — passwordless access appropriate for infrequent partner portal access

### Tertiary (LOW confidence)
- Comparison to Buildertrend ($499-799/mo) and Procore ($375+/mo) feature sets — confirms minimal contractor portal is differentiated by brand integration and zero incremental cost, not feature depth

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*

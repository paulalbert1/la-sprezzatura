---
phase: 08-contractor-portal-building-manager-and-client-visibility
verified: 2026-03-17T08:15:00Z
status: passed
score: 15/15 must-haves verified
re_verification: false
---

# Phase 8: Contractor Portal, Building Manager, and Client Visibility Verification Report

**Phase Goal:** Contractors can view their assigned project scope, floor plans, estimates, and notes through a branded portal; building managers can access COI documents, legal docs, and client contact info for commercial projects; and clients can see which contractors are assigned to their project with on-site schedule dates.
**Verified:** 2026-03-17T08:15:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Work order detail GROQ query returns assignment with appointments, scope, floor plans, estimate, notes — but NOT client email or phone | VERIFIED | `WORK_ORDER_DETAIL_QUERY` at queries.ts:346 returns `primaryClientName` (name only), no `email` or `phone` fields |
| 2 | Building manager GROQ query returns client contact info, COIs with expiration dates, legal docs, contractor names/trades — but NOT scope or estimates | VERIFIED | `BUILDING_MANAGER_PROJECT_QUERY` at queries.ts:393 returns `primaryClient{name,email,phone}`, `cois[]`, `legalDocs[]`, `contractors[]{name,trades}` — no `scopeOfWork`, `estimateFile`, or `estimateAmount` |
| 3 | Client project detail GROQ query conditionally includes contractor names/trades/appointments for full-interior-design — but NOT appointment notes | VERIFIED | `PROJECT_DETAIL_QUERY` select block (queries.ts:217-224) projects `appointments[]{dateTime, label}` — `notes` field explicitly excluded |
| 4 | Building manager routes are protected by middleware with building_manager role check | VERIFIED | middleware.ts:45-55 — `/building/*` guard checks `session.role !== "building_manager"`, sets `context.locals.buildingManagerEmail` |
| 5 | Contractor note submission action validates input and appends to inline array on project | VERIFIED | `submitContractorNote` defined at actions/index.ts:634; `requestBuildingManagerMagicLink` at actions/index.ts:657 |
| 6 | Building manager magic link API route sends branded email with correct portal URL | VERIFIED | `src/pages/api/send-building-access.ts` exists with full implementation (sanityWriteClient fetch, token generation, redis, Resend email) |
| 7 | COI expiration utility correctly classifies valid/expiring/expired dates | VERIFIED | coiUtils.ts: 30-day threshold, today boundary check; 195/195 tests pass |
| 8 | Contractor sees project name, address, primary client name, all 8 content sections, can submit notes — on a single scroll page | VERIFIED | `src/pages/workorder/project/[projectId].astro` (320 lines): all 8 sections present — Appointments, Scope of Work, Floor Plans, Estimate, Notes from Liz, Your Notes, Contact Liz, Sign Out |
| 9 | Contractor does NOT see client email, phone, pipeline stage, or other contractors | VERIFIED | Contractor page uses `primaryClientName` only; Contact Liz uses `siteContact.contactPhone/Email` (site settings, not client data); no StatusBadge or STAGE_META |
| 10 | Single-project contractors auto-redirect from dashboard to project detail | VERIFIED | dashboard.astro:18-20: `if (projects.length === 1) return Astro.redirect(...)` |
| 11 | Building manager can log in via magic link and see project documents on a branded portal | VERIFIED | Full auth flow: login.astro → verify.astro (redis.getdel, createSession) → dashboard.astro → project/[projectId].astro; all four files confirmed substantive |
| 12 | Building manager sees COI certificates with expiration badges (green valid, amber expiring, red expired) and download links | VERIFIED | building/project/[projectId].astro renders `<ExpirationBadge>` per COI; ExpirationBadge.astro uses `bg-emerald-50/bg-amber-50/bg-red-50` color classes |
| 13 | Client sees contractor names, trades, and appointment dates/labels on their Full Interior Design project — but NOT appointment notes | VERIFIED | ContractorSection.astro renders `apt.dateTime` and `apt.label`; no `notes` reference in component; hidden entirely when no contractors |
| 14 | Role selection supports triple-role (client + contractor + building_manager) | VERIFIED | RoleSelectionForm.tsx conditionally renders all 3 role buttons; role-select.astro POST handler supports `building_manager` role and redirects to `/building/dashboard` |
| 15 | Single-project building managers auto-redirect from dashboard to project detail | VERIFIED | building/dashboard.astro:14-16: `if (projects.length === 1) return Astro.redirect(...)` |

**Score:** 15/15 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/sanity/schemas/project.ts` | appointments[], contractorNotes, submissionNotes[] on contractor assignment | VERIFIED | Schema fields confirmed at lines 514, 521, 560 |
| `src/sanity/queries.ts` | 5 new GROQ queries with information boundary enforcement | VERIFIED | WORK_ORDER_DETAIL, BUILDING_MANAGER_PROJECT, PROJECTS_BY_BUILDING_MANAGER, SITE_SETTINGS, extended PROJECT_DETAIL all present |
| `src/middleware.ts` | Building manager route protection (/building/*) | VERIFIED | Middleware block lines 45-56 with role check and email injection |
| `src/actions/index.ts` | submitContractorNote + requestBuildingManagerMagicLink | VERIFIED | Both defineAction calls confirmed at lines 634 and 657 |
| `src/lib/coiUtils.ts` | getExpirationStatus + formatExpirationDate | VERIFIED | Both functions implemented with 30-day expiry threshold |
| `src/pages/api/send-building-access.ts` | Building manager magic link API route | VERIFIED | Full implementation with Sanity fetch, token generation, redis, email send |
| `src/sanity/actions/sendBuildingAccess.tsx` | Studio document action for sending building access | VERIFIED | File exists |
| `src/pages/workorder/project/[projectId].astro` | Contractor work order detail page | VERIFIED | 320 lines, all 8 sections, all imports wired, prerender=false |
| `src/components/portal/ContractorNoteForm.tsx` | One-way note submission React form | VERIFIED | 117 lines, all 5 states, submitContractorNote action call, role="alert", setTimeout 3s |
| `src/pages/workorder/dashboard.astro` | Updated dashboard with auto-redirect and project links | VERIFIED | Auto-redirect present, project cards are `<a>` links with address, no StatusBadge |
| `src/pages/building/login.astro` | Building manager login page | VERIFIED | "Building Portal" heading, BuildingManagerLoginForm client:load |
| `src/pages/building/verify.astro` | Magic link verification with multi-role support | VERIFIED | redis.getdel, building_manager role, buildingManagerEmail param in role-select redirect |
| `src/pages/building/dashboard.astro` | Building manager dashboard with auto-redirect | VERIFIED | getProjectsByBuildingManagerEmail, auto-redirect, "No Projects Found" empty state |
| `src/pages/building/logout.ts` | Session clear and redirect | VERIFIED | clearSession + redirect to /building/login |
| `src/pages/building/project/[projectId].astro` | Building manager project detail with COIs, legal docs, client contact | VERIFIED | 241 lines, all 4 sections present (Client Contact, COIs, Legal Docs, Contractors) |
| `src/components/portal/ExpirationBadge.astro` | COI expiration status badge | VERIFIED | getExpirationStatus import, emerald/amber/red colors, Valid/Expires/Expired text |
| `src/components/portal/ContractorSection.astro` | Client-facing contractor visibility | VERIFIED | contractors prop, opacity-50 for past appointments, no notes field reference |
| `src/components/portal/BuildingManagerLoginForm.tsx` | Magic link login form | VERIFIED | requestBuildingManagerMagicLink action call, "Send Access Link" button text |
| `src/components/portal/RoleSelectionForm.tsx` | Extended for triple-role | VERIFIED | buildingManagerEmail prop, conditional "Building Portal" third button |
| `src/pages/portal/role-select.astro` | Extended role-select page | VERIFIED | building_manager POST handler, buildingManagerEmail GET param, relaxed redirect guard |
| `src/pages/portal/project/[projectId].astro` | Client project detail with ContractorSection | VERIFIED | ContractorSection import and conditional render at line 84-86 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pages/workorder/project/[projectId].astro` | `src/sanity/queries.ts` | getWorkOrderDetail GROQ query | WIRED | Called at line 25: `getWorkOrderDetail(projectId, contractorId)` |
| `src/pages/workorder/project/[projectId].astro` | `src/sanity/queries.ts` | getSiteContactInfo for Contact Liz | WIRED | Called at line 31: `getSiteContactInfo()` |
| `src/components/portal/ContractorNoteForm.tsx` | `src/actions/index.ts` | submitContractorNote Astro Action | WIRED | `actions.submitContractorNote({projectId, assignmentKey, text})` at line 22 |
| `src/pages/building/project/[projectId].astro` | `src/sanity/queries.ts` | getBuildingManagerProject GROQ query | WIRED | Called at line 23: `getBuildingManagerProject(projectId, email)` |
| `src/components/portal/ExpirationBadge.astro` | `src/lib/coiUtils.ts` | getExpirationStatus utility | WIRED | Import at line 2, used at line 9 for status classification |
| `src/pages/portal/project/[projectId].astro` | `src/components/portal/ContractorSection.astro` | Component import and render for CVIS-01 | WIRED | Import at line 9, rendered at lines 84-86 conditionally for full-interior-design |
| `src/pages/building/verify.astro` | `src/lib/session.ts` | createSession with building_manager role | WIRED | createSession import and call at line 39 with `tokenData.role \|\| 'building_manager'` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CONTR-03 | 08-01, 08-02 | Contractor portal shows floor plans, scope of work, deadline, notes, and next steps for assigned projects | SATISFIED | Work order detail page has all sections: floor plans (images with preview + download), scope of work (PortableText), appointments (deadlines), notes from Liz, your notes |
| CONTR-04 | 08-01, 08-02 | Contractor sees client name and project address only — no client email, phone, or contact info ("contact Liz" shown instead) | SATISFIED | GROQ query returns `primaryClientName` (name only); Contact Liz section uses site settings; no client contact fields in contractor page |
| BLDG-02 | 08-01, 08-03 | Building manager receives a magic link email to access their portal view | SATISFIED | send-building-access.ts API route + sendBuildingAccess.tsx Studio action send magic links; BuildingManagerLoginForm calls requestBuildingManagerMagicLink action |
| BLDG-03 | 08-01, 08-03 | Building manager sees client name and contact info for the project | SATISFIED | BUILDING_MANAGER_PROJECT_QUERY returns `primaryClient{name,email,phone}`; Client Contact section renders all three fields |
| BLDG-04 | 08-01, 08-03 | Building manager has a COI section showing certificates of insurance with expiration dates | SATISFIED | Certificates of Insurance section with ExpirationBadge (valid/expiring/expired) per COI |
| BLDG-05 | 08-01, 08-03 | Building manager has a legal documents section for building requirements and PDFs | SATISFIED | Legal Documents section with blob-serve download links per document |
| BLDG-06 | 08-01, 08-03 | Building manager can request contractor info (name, license — not direct contact, "contact Liz" for more) | SATISFIED | Contractors section shows name + trades; "Contact Liz for additional contractor details." footer text |
| CVIS-01 | 08-01, 08-03 | Client sees contractor name and on-site schedule dates on their project portal | SATISFIED | ContractorSection renders contractor name, trades, and appointment dateTime/label; no notes field; section hidden when no contractors |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/pages/workorder/project/[projectId].astro` | 233 | "Estimate details coming soon." | Info | Intentional empty-state UI copy per plan spec — not a stub |
| `src/components/portal/ContractorNoteForm.tsx` | 86 | `placeholder="Write a note for Liz..."` | Info | Textarea placeholder attribute — not a code stub |
| `src/components/portal/BuildingManagerLoginForm.tsx` | 130 | `placeholder="you@example.com"` | Info | Input placeholder attribute — not a code stub |

No blocker or warning anti-patterns found. All three flagged items are legitimate UI copy or input placeholder attributes as intended by the plan.

---

### Human Verification Required

#### 1. Magic Link Email Delivery

**Test:** Trigger SendBuildingAccessAction from Sanity Studio on a commercial project. Check building manager email inbox.
**Expected:** Branded email arrives with a working magic link pointing to `/building/verify?token=...`; link creates session and redirects to dashboard; second click on the same link shows expired error.
**Why human:** Email delivery and token single-use enforcement require an active Resend API key and Redis instance to verify end-to-end.

#### 2. COI Expiration Badge Colors

**Test:** Visit a building manager project detail page with COIs in each state — one expiring in >30 days (valid), one expiring within 30 days (expiring), one past expiration (expired).
**Expected:** Valid shows green badge, expiring shows amber badge, expired shows red badge.
**Why human:** Color rendering and visual treatment require browser verification.

#### 3. Contractor Floor Plan Inline Preview

**Test:** Log in as a contractor and navigate to a project with image floor plans (PNG/JPG/WebP).
**Expected:** Images render inline with max-height constraint; PDF floor plans show a named card without image preview; both offer download links via blob-serve.
**Why human:** Blob-serve URL signing and image rendering require a live environment with Vercel Blob credentials.

#### 4. Client Contractor Section Gating

**Test:** Log in as a client with a Full Interior Design project (has assigned contractors) and a second client with a Styling Refresher project.
**Expected:** Full Interior Design project shows ContractorSection with names, trades, and appointment dates. Styling Refresher project shows no contractor section at all.
**Why human:** Requires Sanity data with both project types and contractor assignments to verify conditional rendering at runtime.

---

### Summary

Phase 8 goal is fully achieved. All 15 must-have truths are verified against actual codebase content. The three-portal architecture is complete and wired end-to-end:

- **Contractor portal**: Work order detail page at `/workorder/project/[projectId]` delivers all 8 content sections per spec. Information boundary is enforced at both the GROQ query level (no client email/phone projected) and the page level (Contact Liz uses site settings). Single-project auto-redirect, note submission form with 5-state interaction pattern, and past appointment muting all verified.

- **Building manager portal**: Complete auth flow at `/building/*` (login → verify → dashboard → project detail) mirrors contractor pattern. ExpirationBadge component classifies COIs with emerald/amber/red semantic colors. All four data sections (Client Contact, COIs with badges, Legal Documents, Contractors with "Contact Liz" footer) verified. Information boundary holds: no scope or estimate data projected.

- **Client contractor visibility (CVIS-01)**: ContractorSection component renders contractor names, trades, and appointment dateTime/label for Full Interior Design projects. The `notes` field is absent from both the GROQ projection (queries.ts:220-223) and the component interface — the information boundary is enforced at both layers.

- **Role selection**: Triple-role support implemented with conditional button rendering and correct session creation for all three roles.

All 195 tests pass. All 7 commit hashes documented in summaries are verified in git history.

---

_Verified: 2026-03-17T08:15:00Z_
_Verifier: Claude (gsd-verifier)_

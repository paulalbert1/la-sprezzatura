---
phase: 07-schema-extensions-multi-role-auth-and-document-storage
verified: 2026-03-16T22:20:00Z
status: passed
score: 17/17 must-haves verified
gaps: []
human_verification:
  - test: "Upload a file via BlobFileInput in Sanity Studio"
    expected: "File picker opens, upload progress shown, pathname stored in Sanity string field"
    why_human: "Requires live Vercel Blob store with BLOB_READ_WRITE_TOKEN; cannot test programmatically"
  - test: "Navigate to /workorder/login and request magic link"
    expected: "Branded form renders, email sent (with RESEND_API_KEY), link arrives with project names"
    why_human: "Requires live email delivery and Resend configuration"
  - test: "Click magic link, land on /workorder/dashboard"
    expected: "Session created with role 'contractor', dashboard shows 'Your work orders will appear here'"
    why_human: "Requires live Redis and a contractor record in Sanity"
  - test: "Navigate to /workorder/dashboard with client session cookie"
    expected: "Redirected to /workorder/login (role mismatch)"
    why_human: "Requires live session infrastructure to test cookie behavior"
  - test: "Liz clicks 'Send Work Order Access' on a contractor document in Studio"
    expected: "Dialog confirms contractor name/email, send triggers branded email"
    why_human: "Requires live Sanity Studio, Resend, and a saved contractor document"
---

# Phase 7: Schema Extensions, Multi-Role Auth, and Document Storage Verification Report

**Phase Goal:** Schema extensions (contractor document type, project field gating), multi-role authentication (contractor magic link flow, role-based middleware), and private document storage (Vercel Blob upload/serve with BlobFileInput component)
**Verified:** 2026-03-16T22:20:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Liz can create a contractor record in Sanity Studio with name, email, phone, company, and trades | VERIFIED | `src/sanity/schemas/contractor.ts` defines all 5 fields with 11-item trades list; registered in `schemaTypes` and Studio sidebar |
| 2 | Liz can assign contractors to a Full Interior Design project with estimate, scope, date range, and internal notes | VERIFIED | `project.ts` `contractors[]` array contains all required fields (contractor ref, estimateFile, estimateAmount, scopeOfWork, startDate, endDate, internalNotes) |
| 3 | Contractors group/tab is hidden in Studio for non-Full Interior Design projects | VERIFIED | `hidden: ({ document }) => document?.engagementType !== "full-interior-design"` on contractors field; 4 tests confirm behavior |
| 4 | Liz can toggle a project between Residential and Commercial | VERIFIED | `isCommercial` boolean field in `project.ts` with `initialValue: false` in "content" group |
| 5 | Commercial projects show building manager, COI, and legal document fields; residential hides them | VERIFIED | `buildingManager`, `cois`, `legalDocs` all use `hidden: ({ document }) => !document?.isCommercial` |
| 6 | Procurement and Contractors tabs are hidden for Styling & Refreshing and Carpet Curating projects | VERIFIED | `procurementItems`, `contractors`, `floorPlans` all gate on `engagementType !== "full-interior-design"` |
| 7 | Contractor document appears in Studio sidebar under Contractors | VERIFIED | `sanity.config.ts` line 35: `S.documentTypeListItem("contractor").title("Contractors")` |
| 8 | Liz can upload a file via BlobFileInput in Sanity Studio and it is stored in Vercel Blob private storage | VERIFIED | `BlobFileInput.tsx` exports component using `upload()` from `@vercel/blob/client` with `access: 'private'` and `handleUploadUrl: '/api/blob-upload'`; wired onto 4 file fields in project schema |
| 9 | Private blob files served through /api/blob-serve require an authenticated session | VERIFIED | `blob-serve.ts` calls `getSession(context.cookies)` and returns 401 when null; 9 tests confirm auth guard |
| 10 | A contractor receives a magic link email, clicks it, and lands on a session-gated placeholder dashboard | VERIFIED | Complete flow: `WorkOrderLoginForm` -> `requestContractorMagicLink` action -> `workorder/verify.astro` (atomic token + `createSession`) -> `workorder/dashboard.astro` (reads `Astro.locals.contractorId`) |
| 11 | The contractor session carries role 'contractor' that prevents access to client portal routes | VERIFIED | Middleware checks `session.role !== "contractor"` for `/workorder/*` routes; `session.role !== "client"` for `/portal/*` routes; 13 middleware tests pass |
| 12 | A client session carries role 'client' that prevents access to work order routes | VERIFIED | Same middleware logic confirmed; backward compat: legacy plain-string Redis values treated as `{ role: 'client' }` |
| 13 | If an email exists in both client and contractor tables, the verify page shows a role selection | VERIFIED | Both `requestMagicLink` and `requestContractorMagicLink` detect dual-role, store `{ clientId, contractorId, dualRole: true }`; verify pages redirect to `/portal/role-select`; `RoleSelectionForm.tsx` presents two options |
| 14 | Liz can trigger 'Send Work Order Access' from the contractor document in Sanity Studio | VERIFIED | `sendWorkOrderAccess.tsx` registered in `sanity.config.ts` for `schemaType === "contractor"`; fetches `/api/send-workorder-access` |
| 15 | The magic link email includes project name(s) the contractor is assigned to | VERIFIED | `requestContractorMagicLink` calls `getProjectsByContractorId`, builds `projectNames` string, includes in email template as "You have work orders for: ..." |
| 16 | Existing client sessions continue to work after the session format upgrade (backward compatibility) | VERIFIED | `getSession` in `session.ts` detects plain strings (old format) and returns `{ entityId: raw, role: 'client' }`; `createSession` defaults role to `'client'`; 13 session tests pass |
| 17 | GROQ queries for contractor lookup and project assignments exist and are exported | VERIFIED | `queries.ts` exports `CONTRACTOR_BY_EMAIL_QUERY`, `CONTRACTOR_BY_ID_QUERY`, `PROJECTS_BY_CONTRACTOR_QUERY` and corresponding async functions; 10 query content tests pass |

**Score:** 17/17 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/sanity/schemas/contractor.ts` | Contractor document type | VERIFIED | 59 lines; exports `contractor`; defineType with 5 fields + 11-item trades list |
| `src/sanity/schemas/project.ts` | Extended project schema with 6 new fields and hidden callbacks | VERIFIED | All 6 fields present: `isCommercial`, `contractors[]`, `floorPlans[]`, `buildingManager`, `cois[]`, `legalDocs[]`; engagement type and commercial gating implemented |
| `src/sanity/schemas/index.ts` | contractor registered in schemaTypes | VERIFIED | `import { contractor } from "./contractor"` and contractor in schemaTypes array |
| `sanity.config.ts` | Contractors sidebar + SendWorkOrderAccessAction registration | VERIFIED | `documentTypeListItem("contractor")` present; `SendWorkOrderAccessAction` imported and registered for contractor type |
| `src/sanity/queries.ts` | Contractor GROQ queries | VERIFIED | 3 query constants + 3 async functions exported |
| `src/sanity/components/BlobFileInput.tsx` | Custom Studio upload component | VERIFIED | 117 lines; exports `BlobFileInput`; idle/uploading/uploaded/error states using `@sanity/ui` |
| `src/pages/api/blob-upload.ts` | Vercel Blob token exchange | VERIFIED | Exports `POST`; uses `handleUpload` from `@vercel/blob/client`; restricts to PDF/JPEG/PNG/WebP |
| `src/pages/api/blob-serve.ts` | Authenticated blob proxy | VERIFIED | Exports `GET`; calls `getSession`; returns 401 when unauthenticated; streams via `@vercel/blob` |
| `src/lib/session.ts` | Multi-role SessionData | VERIFIED | Exports `SessionData` interface with `entityId` and `role`; backward compat for legacy strings |
| `src/middleware.ts` | Role-based route protection | VERIFIED | Gates `/portal/*` to client role, `/workorder/*` to contractor role |
| `src/env.d.ts` | App.Locals with contractorId and role | VERIFIED | `contractorId: string | undefined` and `role: 'client' | 'contractor' | 'building_manager' | undefined` |
| `src/pages/workorder/login.astro` | Contractor login page | VERIFIED | Renders `WorkOrderLoginForm`; contains "Work Order Access" heading |
| `src/pages/workorder/verify.astro` | Magic link verification with dual-role | VERIFIED | Atomic `redis.getdel`; JSON token parsing; dual-role redirect to `/portal/role-select` |
| `src/pages/workorder/dashboard.astro` | Placeholder contractor dashboard | VERIFIED | Reads `Astro.locals.contractorId`; fetches assigned projects; "Your work orders will appear here" and "No Work Orders Yet" states |
| `src/pages/workorder/logout.ts` | Contractor logout | VERIFIED | Calls `clearSession`, redirects to `/workorder/login` |
| `src/pages/portal/role-select.astro` | Role selection for dual-role users | VERIFIED | Handles GET (renders `RoleSelectionForm`) and POST (creates session with selected role) |
| `src/components/portal/WorkOrderLoginForm.tsx` | Contractor login form | VERIFIED | Calls `actions.requestContractorMagicLink`; all UI states present |
| `src/components/portal/RoleSelectionForm.tsx` | Dual-role picker | VERIFIED | Two form POST buttons for client/contractor selection |
| `src/sanity/actions/sendWorkOrderAccess.tsx` | Studio document action | VERIFIED | Exports `SendWorkOrderAccessAction`; only shown for `contractor` type; fetches `/api/send-workorder-access` |
| `src/pages/api/send-workorder-access.ts` | API route for contractor email | VERIFIED | Exports `POST`; fetches contractor, projects from Sanity; generates token; sends branded email |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/sanity/schemas/index.ts` | `src/sanity/schemas/contractor.ts` | import and schemaTypes array | WIRED | Line 2: `import { contractor } from "./contractor"`; line 7: `schemaTypes = [client, contractor, ...]` |
| `sanity.config.ts` | contractor schema | `documentTypeListItem("contractor")` | WIRED | Line 35: `S.documentTypeListItem("contractor").title("Contractors")` |
| `src/sanity/schemas/project.ts` | `contractor` type | reference in contractors[] | WIRED | `type: "reference", to: [{ type: "contractor" }]` |
| `src/sanity/components/BlobFileInput.tsx` | `src/pages/api/blob-upload.ts` | `handleUploadUrl: '/api/blob-upload'` | WIRED | Line 25: `handleUploadUrl: "/api/blob-upload"` |
| `src/pages/api/blob-serve.ts` | `src/lib/session.ts` | `getSession()` auth check | WIRED | Line 8: `const session = await getSession(context.cookies)` |
| `src/sanity/schemas/project.ts` | `src/sanity/components/BlobFileInput.tsx` | `components: { input: BlobFileInput }` | WIRED | BlobFileInput imported at line 3; applied to estimateFile, cois[].file, legalDocs[].file, floorPlans[].file (4 occurrences) |
| `src/components/portal/WorkOrderLoginForm.tsx` | `src/actions/index.ts` | `actions.requestContractorMagicLink` | WIRED | Line 38: `await actions.requestContractorMagicLink(formData)` |
| `src/pages/workorder/verify.astro` | `src/lib/session.ts` | `createSession` with role 'contractor' | WIRED | Line 38: `await createSession(Astro.cookies, tokenData.entityId, role)` where role defaults to 'contractor' |
| `src/middleware.ts` | `src/lib/session.ts` | `session.role` check | WIRED | Lines 19, 33: `session.role !== "client"` and `session.role !== "contractor"` |
| `src/sanity/actions/sendWorkOrderAccess.tsx` | `src/pages/api/send-workorder-access.ts` | `fetch('/api/send-workorder-access')` | WIRED | Line 51: `await fetch("/api/send-workorder-access", ...)` |
| `sanity.config.ts` | `src/sanity/actions/sendWorkOrderAccess.tsx` | document actions for contractor type | WIRED | Line 7 import; lines 54-56: `context.schemaType === "contractor"` guard |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ENGMT-02 | 07-01 | Engagement type controls Studio field visibility | SATISFIED | `contractors`, `floorPlans`, `procurementItems` all gated by `engagementType !== "full-interior-design"`; 4 tests confirm |
| PRJT-01 | 07-01 | Liz can toggle Residential/Commercial | SATISFIED | `isCommercial` boolean field with `initialValue: false` in project schema |
| PRJT-02 | 07-01 | Commercial projects show building manager, COI fields | SATISFIED | `buildingManager`, `cois[]`, `legalDocs[]` hidden with `!document?.isCommercial`; 3 tests confirm |
| CONTR-01 | 07-01 | Liz can create contractor records with name, email, phone, company, trade | SATISFIED | `contractor.ts` has all 5 fields; `trades` is array with 11 predefined values |
| CONTR-02 | 07-03 | Contractor receives magic link email | SATISFIED | `requestContractorMagicLink` action sends branded email via Resend; `send-workorder-access.ts` API route sends same |
| CONTR-05 | 07-01, 07-02 | Liz uploads estimate as PDF or dollar amount per contractor | SATISFIED | `estimateFile` (string/Blob pathname with BlobFileInput) and `estimateAmount` (number in cents) fields on contractor assignment |
| CONTR-06 | 07-01, 07-03 | Contractor portal only available for Full Interior Design projects | SATISFIED | Schema gates contractor fields on engagementType; `PROJECTS_BY_CONTRACTOR_QUERY` filters `engagementType == "full-interior-design"` |
| CONTR-07 | 07-01 | Contractor can be assigned to multiple projects; project can have multiple contractors | SATISFIED | `contractors[]` is an array accepting multiple contractor references per project |
| BLDG-01 | 07-01 | Liz can add building manager contact info to commercial projects | SATISFIED | `buildingManager` inline object with name, email, phone; hidden when `!isCommercial` |
| DOCS-01 | 07-02 | COI documents, floor plans, legal docs stored with private access | SATISFIED | Vercel Blob private storage via `BlobFileInput` + `blob-upload` token exchange + `blob-serve` authenticated proxy |

**All 10 required requirement IDs satisfied.**

---

### Anti-Patterns Scan

Files scanned from phase key-files across all 3 plans:

| File | Finding | Severity |
|------|---------|----------|
| `src/pages/workorder/dashboard.astro` | "Your work orders will appear here" — intentional placeholder for Phase 8 UI | INFO — by design, CONTR-03 deferred to Phase 8 |
| All other Phase 7 files | No TODO/FIXME/placeholder/stub patterns found | — |

The dashboard placeholder is intentional and documented in the plan. CONTR-03 (full contractor portal UI) is explicitly assigned to Phase 8.

---

### Test Suite Results

All 73 Phase 7 tests pass:

| Test File | Tests | Result |
|-----------|-------|--------|
| `src/sanity/schemas/contractor.test.ts` | 6 | PASS |
| `src/sanity/schemas/project.test.ts` | 16 | PASS |
| `src/sanity/queries.test.ts` | 16 | PASS |
| `src/lib/session.test.ts` | 13 | PASS |
| `src/middleware.test.ts` | 13 | PASS |
| `src/pages/api/blob-serve.test.ts` | 9 | PASS |
| **Total** | **73** | **PASS** |

TypeScript: No errors in any Phase 7 files. 5 pre-existing errors in unrelated files (ArtifactApprovalForm.tsx, close-document.ts, notifyClient.tsx, image.ts, queries.ts pre-Phase-7 function) remain unchanged from before Phase 7.

---

### Human Verification Required

**These items require a running environment to confirm:**

#### 1. Vercel Blob file upload in Studio

**Test:** Open Sanity Studio, navigate to a Full Interior Design project, go to the Contractors tab, add a contractor, and click "Choose File" on the Estimate File field.
**Expected:** File picker opens; upload shows "Uploading..." spinner; on completion, filename appears with a "Remove" button; Sanity saves the Blob pathname in the string field.
**Why human:** Requires `BLOB_READ_WRITE_TOKEN` and live Vercel Blob store.

#### 2. Contractor magic link email delivery

**Test:** Visit `/workorder/login`, enter a contractor's email, submit. Check the contractor's inbox.
**Expected:** Branded email arrives with subject "Your La Sprezzatura Work Order Access", CTA button "Access Your Work Orders", project name(s) listed.
**Why human:** Requires live Resend API key and configured contractor record in Sanity.

#### 3. End-to-end magic link auth flow

**Test:** Click the magic link from the email received in test 2.
**Expected:** Lands on `/workorder/dashboard` with greeting "Welcome, [First Name]" and project cards (or "No Work Orders Yet" if none assigned).
**Why human:** Requires live Redis, Sanity, and a 15-minute valid token.

#### 4. Role isolation enforcement

**Test:** With a valid client session cookie, navigate directly to `/workorder/dashboard`.
**Expected:** Redirected to `/workorder/login` (role mismatch enforced by middleware).
**Why human:** Requires live session cookie with `role: 'client'` stored in Redis.

#### 5. SendWorkOrderAccess Studio action

**Test:** Open a contractor document in Sanity Studio, click "Send Work Order Access" in the document actions.
**Expected:** Dialog shows contractor name and email; click "Send Access Link" triggers email delivery.
**Why human:** Requires live Studio, contractor with email, and Resend API key.

---

### Gaps Summary

No gaps. All 17 observable truths verified. All 10 requirement IDs satisfied. All 20 required artifacts exist, are substantive, and are wired. All 11 key links confirmed. 73 tests pass. TypeScript reports zero errors in Phase 7 files.

---

*Verified: 2026-03-16T22:20:00Z*
*Verifier: Claude (gsd-verifier)*

---
phase: 06-portal-features
verified: 2026-03-16T17:42:00Z
status: passed
score: 16/16 must-haves verified
gaps: []
human_verification:
  - test: "Visual review of project detail page layout"
    expected: "Milestone section with progress bar, pipeline status, sorted milestone list; Procurement table with status badges, MSRP, savings, tracking links; Artifact cards in 2-col grid with type badges, download links, approval forms"
    why_human: "Tailwind styling, spacing, responsive layout, and visual hierarchy cannot be verified programmatically"
  - test: "Artifact approval flow end-to-end"
    expected: "Clicking Approve Version shows confirmation checkbox; checking box and clicking Confirm Approval records approval in decision log; clicking Request Changes shows textarea; submitting feedback records in decision log"
    why_human: "Requires live Sanity write token and real client session to test full action flow"
  - test: "Sanity Studio document actions"
    expected: "Notify Client shows artifact picker and sends branded email; Complete Project shows confirmation checklist and sets status; Reopen Project reopens completed projects"
    why_human: "Studio document actions require Sanity Studio running with authenticated user"
  - test: "Close document PDF visual quality"
    expected: "Branded PDF with La Sprezzatura header, milestones checklist, savings total, approved artifacts list"
    why_human: "PDF visual layout and typography cannot be verified by checking buffer bytes alone"
  - test: "Warranty claim photo upload"
    expected: "Selecting an image file and submitting uploads to Sanity CDN and creates warranty artifact with photo reference"
    why_human: "Requires live Sanity write token and CDN connectivity"
---

# Phase 6: Portal Features Verification Report

**Phase Goal:** The authenticated portal is Liz's primary client communication tool -- clients see custom milestones with dates, a procurement table with savings, uploadable artifacts with version history and approval workflow, and post-project warranty access -- all managed by Liz through Sanity Studio
**Verified:** 2026-03-16T17:42:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Client sees custom milestones with dates and completion indicators | VERIFIED | MilestoneSection.astro imports sortMilestones/getMilestoneProgress, renders progress bar + MilestoneTimeline + sorted MilestoneItem list with status dots, dates, overdue indicators, relative dates |
| 2 | Client sees procurement table with savings (retail minus client cost) | VERIFIED | ProcurementTable.astro shows items with status badges, MSRP (formatCurrency), per-item savings, tracking links (getTrackingInfo), total savings footer; clientCost never exposed in components or GROQ projection |
| 3 | Client sees uploadable artifacts with version history and approval workflow | VERIFIED | ArtifactCard.astro renders type badges (getArtifactLabel/getArtifactBadgeStyle), current version download, collapsible previous versions (opacity-50), collapsible decision log; ArtifactApprovalForm.tsx has approve/changes-request flow with AUTH-04 confirmation checkbox |
| 4 | All approvals and decisions are recorded in a timestamped decision log | VERIFIED | approveArtifact and requestArtifactChanges actions in index.ts use sanityWriteClient.patch().insert() to append to decisionLog with clientId, clientName, timestamp, action type |
| 5 | Client can submit notes on milestones and artifacts | VERIFIED | ClientNoteForm.tsx routes to submitMilestoneNote or submitArtifactNote based on targetType prop; 500-char limit with character counter; wired in MilestoneItem.astro and ArtifactCard.astro |
| 6 | Dashboard shows completed projects with 30-day visibility filtering | VERIFIED | dashboard.astro imports isProjectVisible and filters: `const visibleProjects = projects.filter((p: any) => isProjectVisible(p))` then separates active vs completed |
| 7 | Confidentiality notice appears on project detail page | VERIFIED | ConfidentialityBanner.astro contains "This portal is private to you. Please don't share your access link." and is rendered in [projectId].astro after ProjectHeader |
| 8 | Procurement section hidden for non-Full Interior Design engagement types | VERIFIED | [projectId].astro: `const showProcurement = project.engagementType === "full-interior-design"` gates ProcurementTable rendering |
| 9 | Liz can generate a close document PDF from project data | VERIFIED | generateClosePdf.ts uses PDFKit to create branded PDF with milestones, savings, approved artifacts, personal note; close-document.ts API route authenticates, fetches GROQ data, streams PDF |
| 10 | Warranty claim form appears only on reopened projects | VERIFIED | [projectId].astro: `{isReopened && (<WarrantyClaimForm client:load projectId={project._id} />)}` |
| 11 | Client can submit warranty claim with text and optional photo | VERIFIED | WarrantyClaimForm.tsx has textarea (min 10 chars) + file input (accept="image/*"); submitWarrantyClaim action uploads photo to Sanity CDN when provided, creates warranty artifact |
| 12 | Contract artifacts show Signed badge when signed version exists | VERIFIED | ArtifactCard.astro: `const isSigned = artifact.artifactType === "contract" && isContractSigned(artifact)` renders emerald Signed badge |
| 13 | Previous artifact versions are in collapsible section, visually muted | VERIFIED | ArtifactCard.astro uses `<details>` with "Previous versions" summary and `opacity-50` container |
| 14 | Sanity Studio has Notify Client, Complete Project, Reopen Project document actions | VERIFIED | sanity.config.ts imports and registers all three in document.actions for project type; each action file has correct UI (dialog/confirm) and logic |
| 15 | Sanity Studio shows Clients document type in sidebar | VERIFIED | sanity.config.ts: `S.documentTypeListItem("client").title("Clients")` |
| 16 | Financial values stored as integer cents with validation | VERIFIED | project.ts: clientCost and retailPrice both have `validation: (r) => r.integer().min(0)` |

**Score:** 16/16 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/sanity/schemas/project.ts` | Extended schema with 5 field groups + inline arrays | VERIFIED | 5 groups (content, portal, milestones, procurement, artifacts); milestones, procurementItems, artifacts arrays with nested sub-arrays for notes, versions, decisionLog |
| `src/sanity/queries.ts` | PROJECT_DETAIL_QUERY + getProjectDetail | VERIFIED | Query computes savings server-side, never exposes clientCost, uses GROQ select() for engagement type gating, dereferences file assets |
| `src/sanity/writeClient.ts` | Write client with server-only token | VERIFIED | 9 lines, exports sanityWriteClient with SANITY_WRITE_TOKEN (no PUBLIC_ prefix) |
| `src/lib/formatCurrency.ts` | Cents-to-USD formatter | VERIFIED | Uses Intl.NumberFormat, exports formatCurrency |
| `src/lib/trackingUrl.ts` | Carrier detection + tracking URL | VERIFIED | UPS/USPS/FedEx regex patterns, exports getTrackingInfo with TrackingInfo type |
| `src/lib/milestoneUtils.ts` | Milestone sort, progress, status, dates | VERIFIED | Exports sortMilestones, getMilestoneProgress, getMilestoneStatus, formatRelativeDate + types |
| `src/lib/artifactUtils.ts` | Artifact types, labels, versions, signing, badges | VERIFIED | Exports ARTIFACT_TYPES, getArtifactLabel, getCurrentVersion, isContractSigned, getArtifactBadgeStyle + types |
| `src/lib/projectVisibility.ts` | 30-day visibility, completion, reopened checks | VERIFIED | Exports isProjectVisible, isProjectCompleted, isProjectReopened |
| `src/pages/portal/project/[projectId].astro` | Project detail SSR page | VERIFIED | prerender=false, getProjectDetail call, engagement type gating, all sections wired |
| `src/components/portal/ProjectHeader.astro` | Title + StatusBadge + engagement label | VERIFIED | Imports StatusBadge, displays ENGAGEMENT_LABELS |
| `src/components/portal/ConfidentialityBanner.astro` | Confidentiality notice | VERIFIED | Contains "Please don't share your access link" |
| `src/components/portal/MilestoneSection.astro` | Progress bar + timeline + milestone list | VERIFIED | Imports sortMilestones/getMilestoneProgress, renders ProgressBar + MilestoneTimeline + MilestoneItems |
| `src/components/portal/MilestoneItem.astro` | Status dot + date + notes + note form | VERIFIED | getMilestoneStatus, formatRelativeDate, ClientNoteForm with client:load |
| `src/components/portal/ProcurementTable.astro` | Table with MSRP, savings, tracking | VERIFIED | formatCurrency, getTrackingInfo, sr-only caption, no clientCost anywhere |
| `src/components/portal/ArtifactSection.astro` | Card grid container | VERIFIED | "Documents & Artifacts" heading, md:grid-cols-2, empty state |
| `src/components/portal/ArtifactCard.astro` | Individual artifact with full features | VERIFIED | Type badges, download links (?dl=), approval form, previous versions, decision log, notes, note form |
| `src/components/portal/ArtifactApprovalForm.tsx` | Approve/changes form with AUTH-04 | VERIFIED | "I confirm this approval on behalf of all parties" checkbox, actions.approveArtifact, actions.requestArtifactChanges |
| `src/components/portal/ClientNoteForm.tsx` | Reusable note form | VERIFIED | targetType routing to milestone/artifact actions, 500-char limit, character counter |
| `src/components/portal/PostProjectBanner.astro` | Project Complete banner | VERIFIED | "Project Complete" heading with formatted completedAt date |
| `src/components/portal/ProgressBar.astro` | Slim progress bar | VERIFIED | bg-terracotta fill with percent width |
| `src/components/portal/WarrantyClaimForm.tsx` | Warranty form with photo upload | VERIFIED | textarea + file input (accept="image/*"), actions.submitWarrantyClaim, "Photo (optional)" label |
| `src/lib/generateClosePdf.ts` | PDFKit close document generator | VERIFIED | Branded PDF with milestones, savings (formatCurrency), approved artifacts, personal note |
| `src/pages/api/close-document.ts` | PDF streaming API route | VERIFIED | Auth via getSession, engagement type gate, application/pdf content type |
| `src/pages/api/notify-artifact.ts` | Notification email API route | VERIFIED | POST handler, branded HTML email via Resend, notification logging to artifact |
| `src/actions/index.ts` | 5 portal actions + 2 pre-existing | VERIFIED | approveArtifact, requestArtifactChanges, submitMilestoneNote, submitArtifactNote, submitWarrantyClaim -- all with auth checks and sanityWriteClient mutations |
| `src/actions/portalSchemas.ts` | Zod schemas for testability | VERIFIED | 5 schemas: approveArtifactSchema, requestChangesSchema, milestoneNoteSchema, artifactNoteSchema, warrantyClaimSchema |
| `src/sanity/actions/notifyClient.tsx` | Studio Notify Client action | VERIFIED | Dialog with artifact selector, calls /api/notify-artifact, "Send Notification" button |
| `src/sanity/actions/completeProject.tsx` | Studio Complete Project action | VERIFIED | Confirm dialog with checklist, sets projectStatus="completed" + completedAt |
| `src/sanity/actions/reopenProject.tsx` | Studio Reopen Project action | VERIFIED | Confirm dialog, sets projectStatus="reopened", unsets completedAt |
| `sanity.config.ts` | Document actions registered + Clients in structure | VERIFIED | All 3 actions imported and appended for project type; Clients in sidebar |
| `.env.example` | SANITY_WRITE_TOKEN documented | VERIFIED | Contains SANITY_WRITE_TOKEN=your_write_token_here |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| [projectId].astro | queries.ts | getProjectDetail import | WIRED | Line 13: `import { getProjectDetail, getProjectsByClientId } from "../../../sanity/queries"` |
| [projectId].astro | ArtifactSection.astro | Component import + render | WIRED | Line 10: import, Line 88: `<ArtifactSection artifacts={project.artifacts}` |
| [projectId].astro | WarrantyClaimForm.tsx | Component import + conditional render | WIRED | Line 11: import, Line 113: `{isReopened && (<WarrantyClaimForm client:load` |
| ProcurementTable.astro | formatCurrency.ts | formatCurrency import | WIRED | Line 2: `import { formatCurrency } from "../../lib/formatCurrency"` used in template |
| ProcurementTable.astro | trackingUrl.ts | getTrackingInfo import | WIRED | Line 3: `import { getTrackingInfo } from "../../lib/trackingUrl"` used per item |
| MilestoneSection.astro | milestoneUtils.ts | sortMilestones, getMilestoneProgress | WIRED | Line 3: import, Lines 21-22: both functions called in frontmatter |
| MilestoneItem.astro | milestoneUtils.ts | getMilestoneStatus, formatRelativeDate | WIRED | Line 3: import, Lines 18-27: both called |
| MilestoneItem.astro | ClientNoteForm.tsx | client:load + props | WIRED | Line 7: import, Line 127: rendered with projectId, targetKey, targetType |
| dashboard.astro | projectVisibility.ts | isProjectVisible | WIRED | Line 8: import, Line 26: `projects.filter((p: any) => isProjectVisible(p))` |
| ArtifactApprovalForm.tsx | actions/index.ts | actions.approveArtifact + requestArtifactChanges | WIRED | Lines 36, 57: both called with FormData |
| ClientNoteForm.tsx | actions/index.ts | submitMilestoneNote + submitArtifactNote | WIRED | Lines 31, 35: conditionally called based on targetType |
| WarrantyClaimForm.tsx | actions/index.ts | actions.submitWarrantyClaim | WIRED | Line 32: called with FormData including optional photo |
| actions/index.ts | writeClient.ts | sanityWriteClient.patch | WIRED | Line 8: import, used in all 5 portal action handlers |
| close-document.ts | generateClosePdf.ts | generateClosePdf import | WIRED | Line 2: import, Line 57: called with project data |
| sanity.config.ts | notifyClient.tsx + completeProject.tsx + reopenProject.tsx | document.actions | WIRED | Lines 4-6: imports, Lines 42-51: registered in actions callback |
| notifyClient.tsx | /api/notify-artifact | fetch POST | WIRED | Line 64: `fetch("/api/notify-artifact", { method: "POST" })` |
| queries.ts GROQ | project.ts schema | Field name matching | WIRED | milestones, procurementItems, artifacts, projectStatus, completedAt, engagementType all match schema field names |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CLNT-06 | 06-02 | Portal greets client by name, shows active and historical projects | SATISFIED | dashboard.astro: `Welcome back, {firstName}` + active/completed project sections with links to project detail |
| CLNT-07 | 06-01, 06-02 | Active clients can view completed projects alongside current ones | SATISFIED | dashboard.astro uses isProjectVisible for 30-day window; PROJECTS_BY_CLIENT_QUERY includes completedAt/projectStatus |
| MILE-01 | 06-01 | Liz can define custom per-project milestones in Sanity | SATISFIED | project.ts has milestones array with name, date, completed, description, notes |
| MILE-02 | 06-02, 06-04 | Client sees milestone timeline with dates and completion indicators | SATISFIED | MilestoneSection + MilestoneItem render sorted milestones with status dots, dates, progress bar, overdue indicators |
| MILE-03 | 06-02 | 6-stage pipeline retained as high-level status alongside milestones | SATISFIED | MilestoneSection renders MilestoneTimeline (6-stage pipeline) above detailed milestone list |
| PROC-01 | 06-01 | Liz can add procurement items with name, status, dates, costs | SATISFIED | project.ts has procurementItems with all required fields + integer cents validation |
| PROC-02 | 06-01, 06-02 | Client sees procurement table with statuses and savings | SATISFIED | ProcurementTable.astro shows status badges, MSRP, savings, tracking; total savings footer; no clientCost |
| ARTF-01 | 06-01, 06-05 | Liz can upload artifacts of configurable types | SATISFIED | project.ts artifacts array with 7 artifact types including custom; versions array for file uploads |
| ARTF-02 | 06-01, 06-03 | Artifacts support revisions with previous versions viewable but muted | SATISFIED | ArtifactCard.astro: collapsible `<details>` with previousVersions in opacity-50 container |
| ARTF-03 | 06-03 | Client can approve artifact versions; non-selected versions muted | SATISFIED | ArtifactApprovalForm.tsx approve flow sets currentVersionKey; previous versions rendered muted |
| ARTF-04 | 06-01, 06-03 | All selections/approvals recorded in decision log with timestamps | SATISFIED | approveArtifact and requestArtifactChanges actions append to decisionLog with action, clientId, clientName, timestamp |
| ARTF-08 | 06-01, 06-03 | Contract artifacts support signed version upload | SATISFIED | project.ts: signedFile field hidden unless artifactType=contract; ArtifactCard shows Signed badge |
| ARTF-09 | 06-03 | Client can provide notes/feedback on artifacts | SATISFIED | ClientNoteForm in ArtifactCard with targetType="artifact"; submitArtifactNote action |
| PORT-05 | 06-02 | Confidentiality notice about not sharing access link | SATISFIED | ConfidentialityBanner.astro: "Please don't share your access link" |
| PORT-06 | 06-03, 06-04 | Client can submit notes at workflow points | SATISFIED | ClientNoteForm wired in both MilestoneItem (targetType=milestone) and ArtifactCard (targetType=artifact) |
| PORT-07 | 06-03 | Portal shows artifacts with status, version history, decision log | SATISFIED | ArtifactCard: type badge, approved/changes-requested/awaiting-review status, collapsible version history, collapsible activity log |
| POST-01 | 06-05 | Liz can generate close document PDF | SATISFIED | generateClosePdf.ts + /api/close-document route with auth, engagement type gate, branded PDF |
| POST-02 | 06-04 | Liz can reopen a completed project for warranty work | SATISFIED | reopenProject.tsx Studio action sets projectStatus="reopened", unsets completedAt |
| POST-03 | 06-05 | Liz can upload warranty items to reopened project | SATISFIED | submitWarrantyClaim action creates warranty artifact on project via sanityWriteClient |
| POST-04 | 06-05 | Client can submit warranty claim through portal on reopened project | SATISFIED | WarrantyClaimForm.tsx rendered only when isReopened; textarea + optional photo upload |

**Orphaned requirements:** None. All 20 requirement IDs from the phase (CLNT-06, CLNT-07, MILE-01, MILE-02, MILE-03, PROC-01, PROC-02, ARTF-01, ARTF-02, ARTF-03, ARTF-04, ARTF-08, ARTF-09, PORT-05, PORT-06, PORT-07, POST-01, POST-02, POST-03, POST-04) are covered by plan frontmatter and have implementation evidence.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | - | - | No TODO/FIXME/PLACEHOLDER/HACK found in Phase 6 files |

**Security check:** `clientCost` only appears inside `"savings": retailPrice - clientCost` GROQ computation (queries.ts line 214). It is never a standalone projection field, never present in any component, and never sent to the client browser.

**No stubs detected:** All components render substantive content with real data bindings. No `return null`, empty handlers, or console.log-only implementations found.

### Human Verification Required

### 1. Visual Review of Project Detail Page

**Test:** Log in as a test client, navigate to a project with milestones, procurement items, and artifacts. Check layout on desktop and mobile.
**Expected:** Milestones section shows progress bar, 6-stage pipeline, sorted milestone list with status dots. Procurement table shows items with status badges, MSRP, savings, tracking links, total savings. Artifact cards in 2-column grid on desktop.
**Why human:** Tailwind styling, spacing, responsive layout cannot be verified programmatically.

### 2. Artifact Approval End-to-End

**Test:** On a project with a pending artifact, click "Approve Version", check the confirmation checkbox, and click "Confirm Approval". Then test "Request Changes" with feedback text.
**Expected:** Approval records in decision log, page shows "Approved" badge. Changes request records feedback in decision log.
**Why human:** Requires live Sanity write token and authenticated client session.

### 3. Sanity Studio Document Actions

**Test:** Open a project in Sanity Studio. Test "Notify Client" (sends email), "Complete Project" (sets status), and "Reopen Project" (reopens).
**Expected:** Notify Client shows artifact picker and sends branded email. Complete Project shows confirmation checklist and marks project complete. Reopen Project changes status back.
**Why human:** Requires Sanity Studio running with authenticated admin user.

### 4. Close Document PDF

**Test:** Complete a Full Interior Design project, then click "Download PDF" on the project detail page.
**Expected:** Branded PDF downloads with project title, milestones, savings total, approved artifacts list.
**Why human:** PDF visual quality and typography cannot be verified from buffer bytes alone.

### 5. Warranty Claim Photo Upload

**Test:** On a reopened project, submit a warranty claim with description and photo.
**Expected:** Photo uploads to Sanity CDN, warranty artifact created with photo reference.
**Why human:** Requires live Sanity write token and CDN connectivity.

### Gaps Summary

No gaps found. All 16 observable truths verified. All 20 requirement IDs satisfied with implementation evidence. All artifacts exist, are substantive, and are properly wired. All key links confirmed. No anti-patterns detected. 115 tests pass across 16 test files.

The phase goal -- "The authenticated portal is Liz's primary client communication tool -- clients see custom milestones with dates, a procurement table with savings, uploadable artifacts with version history and approval workflow, and post-project warranty access -- all managed by Liz through Sanity Studio" -- is achieved in the codebase.

---

_Verified: 2026-03-16T17:42:00Z_
_Verifier: Claude (gsd-verifier)_

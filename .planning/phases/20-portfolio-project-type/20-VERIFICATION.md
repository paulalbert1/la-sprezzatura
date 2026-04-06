---
phase: 20-portfolio-project-type
verified: 2026-04-05T22:05:00Z
status: human_needed
score: 11/11 automated must-haves verified
re_verification: false
human_verification:
  - test: "Verify spawn dialog appears on completed admin projects in Sanity Studio"
    expected: "'Create Portfolio Version' button appears in document action panel for projectStatus=completed projects, absent on active/reopened projects"
    why_human: "Sanity Studio document action visibility cannot be verified programmatically without a running Studio session"
  - test: "Verify photography dialog flow in Sanity Studio"
    expected: "Clicking button opens 'Has this project been professionally photographed?' dialog with Yes/No buttons; Yes shows image grid with thumbnail, star on hero, pre-checked checkboxes, Select All/None controls"
    why_human: "Multi-step dialog UI, thumbnail rendering, and checkbox interaction require a live Studio session"
  - test: "Verify portfolio document creation and navigation"
    expected: "Clicking 'Create Portfolio Version' in dialog creates a portfolioProject document with correct field values and redirects to the new document at /admin/structure/portfolioProject;<id>"
    why_human: "Requires Sanity dataset write access and live navigation to confirm"
  - test: "Verify duplicate prevention after spawn"
    expected: "After creating a portfolio version, returning to the admin project shows NO 'Create Portfolio Version' button"
    why_human: "Requires live Studio with actual Sanity data to test the GROQ duplicate-check query result"
  - test: "Verify Studio navigation changes are visible"
    expected: "Sidebar shows 'Projects' (not 'Portfolio Projects') and new 'Portfolio' entry below it; Navbar has Portfolio tab with image icon between Projects and Clients"
    why_human: "Visual layout and icon rendering require a running browser session"
---

# Phase 20: Portfolio Project Type — Verification Report

**Phase Goal:** New portfolioProject Sanity document type with spawn action, Studio navigation, and data-model tests
**Verified:** 2026-04-05T22:05:00Z
**Status:** human_needed (all automated checks passed; 5 items require human verification in running Studio)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | portfolioProject schema type exists with all required fields | VERIFIED | `src/sanity/schemas/portfolioProject.ts` — 16 fields, all present including all required types |
| 2 | buildPortfolioPayload correctly copies fields from admin project to portfolio payload | VERIFIED | `src/lib/portfolioSpawn.ts` — pure function, 20 tests passing |
| 3 | sourceAdminProjectId is a plain string, readOnly, set at creation time | VERIFIED | `portfolioProject.ts` line 123: `readOnly: true`; `portfolioSpawn.ts` line 34: `sourceAdminProjectId: adminProject._id` |
| 4 | tags field exists on portfolio but NOT copied from admin (starts empty) | VERIFIED | Schema has tags array; `portfolioSpawn.ts` line 25: `tags: []` hardcoded, no `adminProject.tags` reference |
| 5 | style field is NOT included in portfolioProject schema | VERIFIED | No `style` field in `portfolioProject.ts`; test explicitly asserts absence; `portfolioSpawn.ts` has no `adminProject.style` reference |
| 6 | Portfolio sidebar list item exists in Studio (renamed from Portfolio Projects) | VERIFIED | `sanity.config.ts` line 45: `.title("Projects")`; line 47: `S.documentTypeListItem("portfolioProject").title("Portfolio")`; no "Portfolio Projects" string in file |
| 7 | Portfolio tab in StudioNavbar navigates to /admin/structure/portfolioProject | VERIFIED | `StudioNavbar.tsx` line 29: `{ id: "portfolioProject", title: "Portfolio", icon: ImageIcon, path: "/structure/portfolioProject" }` |
| 8 | portfolioProject documents get form-only view (no Timeline tab) | VERIFIED | `structure.ts` — only `schemaType === "project"` gets Timeline; all others return `S.document().views([S.view.form()])` |
| 9 | SpawnPortfolioAction is registered on admin project documents only | VERIFIED | `sanity.config.ts` lines 64-74: `SpawnPortfolioAction` inside `if (context.schemaType === "project")` block; no `portfolioProject` actions block |
| 10 | Spawn action uses buildPortfolioPayload and client.create | VERIFIED | `spawnPortfolioProject.tsx` line 6: imports `buildPortfolioPayload`; line 89: `await client.create(payload)` |
| 11 | Duplicate check runs via GROQ query | VERIFIED | `spawnPortfolioProject.tsx` lines 24-28: `client.fetch('count(*[_type == "portfolioProject" && sourceAdminProjectId == $id]) > 0', ...).then(setAlreadyExists)` |

**Score:** 11/11 automated truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/sanity/schemas/portfolioProject.ts` | portfolioProject schema with 16 fields | VERIFIED | 131 lines, all 16 fields present, preview config present, no style field |
| `src/sanity/schemas/index.ts` | Schema registry with portfolioProject added | VERIFIED | Line 4: import; line 11: `portfolioProject` in schemaTypes array |
| `src/lib/portfolioSpawn.ts` | buildPortfolioPayload pure function | VERIFIED | 38 lines, exports `buildPortfolioPayload`, sets `_type: "portfolioProject"`, `tags: []`, `sourceAdminProjectId: adminProject._id` |
| `src/sanity/schemas/portfolioProject.test.ts` | Schema field validation tests | VERIFIED | 20 tests, all passing — covers all 16 fields, readOnly, no-style, preview config |
| `src/lib/portfolioSpawn.test.ts` | Field copy helper tests | VERIFIED | 20 tests, all passing — covers all field copies, image selection, _key generation, edge cases |
| `src/sanity/actions/spawnPortfolioProject.tsx` | SpawnPortfolioAction with multi-step dialog | VERIFIED | 279 lines (exceeds min_lines: 100), exports `SpawnPortfolioAction`, 3 step states, complete dialog logic |
| `sanity.config.ts` | SpawnPortfolioAction registered; portfolioProject in structure | VERIFIED | Lines 10, 72: SpawnPortfolioAction imported and registered; line 47: portfolioProject list item |
| `src/sanity/components/StudioNavbar.tsx` | Portfolio tab in DOC_TYPES with ImageIcon | VERIFIED | Line 14: `ImageIcon` imported; line 29: portfolioProject entry in DOC_TYPES |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/sanity/schemas/index.ts` | `src/sanity/schemas/portfolioProject.ts` | import and array inclusion | WIRED | Line 4: `import { portfolioProject } from "./portfolioProject"`; line 11: in schemaTypes |
| `src/lib/portfolioSpawn.ts` | `portfolioProject` schema | `_type: "portfolioProject"` | WIRED | Line 21: `_type: "portfolioProject"` matches schema name |
| `src/sanity/actions/spawnPortfolioProject.tsx` | `src/lib/portfolioSpawn.ts` | import buildPortfolioPayload | WIRED | Line 6: `import { buildPortfolioPayload } from "../../lib/portfolioSpawn"` |
| `src/sanity/actions/spawnPortfolioProject.tsx` | Sanity client | `client.create()` and `client.fetch()` | WIRED | Lines 24-28: fetch for duplicate check; line 89: create for document creation |
| `sanity.config.ts` | `src/sanity/actions/spawnPortfolioProject.tsx` | import and document.actions registration | WIRED | Line 10: import; line 72: `SpawnPortfolioAction` inside project schemaType block |
| `sanity.config.ts` | `src/sanity/structure.ts` | `getDefaultDocumentNode` import | WIRED | Line 12: `import { getDefaultDocumentNode } from "./src/sanity/structure"` |
| `src/sanity/components/StudioNavbar.tsx` | `sanity.config.ts` | DOC_TYPES path matches structure list item | WIRED | Path `/structure/portfolioProject` matches `S.documentTypeListItem("portfolioProject")` |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `spawnPortfolioProject.tsx` | `alreadyExists` | `client.fetch(GROQ query)` — live Sanity query | Yes — queries `*[_type == "portfolioProject" && sourceAdminProjectId == $id]` | FLOWING |
| `spawnPortfolioProject.tsx` | `allImages` | `doc.heroImage` + `doc.images` from props (Sanity document) | Yes — pulled from live document props | FLOWING |
| `spawnPortfolioProject.tsx` | `newDoc` | `client.create(payload)` — live Sanity write | Yes — payload built from buildPortfolioPayload | FLOWING |
| `spawnPortfolioProject.tsx` | `thumbnailUrl(img)` | `imageUrlBuilder(client).image(img)...url()` | Yes — generates Sanity CDN URL from image reference | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| portfolioProject schema exports correctly | `npx vitest run src/sanity/schemas/portfolioProject.test.ts` | 20/20 tests passing | PASS |
| buildPortfolioPayload all field-copy behaviors | `npx vitest run src/lib/portfolioSpawn.test.ts` | 20/20 tests passing | PASS |
| Spawn action file exists and is substantive | `wc -l src/sanity/actions/spawnPortfolioProject.tsx` | 279 lines | PASS |
| "Portfolio Projects" old label is gone | `grep "Portfolio Projects" sanity.config.ts` | No matches (exit 1) | PASS |
| SpawnPortfolioAction scoped to project only | No `if (context.schemaType === "portfolioProject")` block | Confirmed absent | PASS |
| style field absent from spawn payload | `grep "adminProject.style" src/lib/portfolioSpawn.ts` | No matches (exit 1) | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PORT-01 | 20-01, 20-02 | New `portfolioProject` schema type with title, location, description, tags, images | SATISFIED | Schema at `portfolioProject.ts` with 16 fields including all required; registered in schemaTypes; Studio navigation added |
| PORT-02 | 20-03 | "Create Portfolio Version" button on admin projects (visible only after projectStatus=completed) | SATISFIED (automated) | `spawnPortfolioProject.tsx` line 34: `if (doc?.projectStatus !== "completed") return null`; gated on completed status — human verification required for visual confirmation |
| PORT-03 | 20-03 | Spawn modal asks if project has been photographed; if yes, select images; if no, create without images | SATISFIED (automated) | 3-step dialog ("ask" / "select" / "creating") implemented in `spawnPortfolioProject.tsx` lines 115-256; human verification required for UI confirmation |
| PORT-04 | 20-01 | Title, location, and description auto-copied from admin project on spawn | SATISFIED | `portfolioSpawn.ts` explicitly copies title, location, description (and 8 other fields); 20 tests verify each copy |
| PORT-05 | 20-01 | Portfolio project is independent document (no ongoing sync), with `sourceAdminProjectId` for audit | SATISFIED | `portfolioSpawn.ts` returns standalone document payload; `sourceAdminProjectId` is plain string (not a reference); no sync mechanism exists by design |

**Orphaned requirements check:** REQUIREMENTS.md maps PORT-01 through PORT-05 to Phase 20. All 5 are claimed by plans (PORT-01, PORT-04, PORT-05 in 20-01; PORT-01 in 20-02; PORT-02, PORT-03 in 20-03). No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/sanity/actions/spawnPortfolioProject.tsx` | 92 | `console.error("Failed to create portfolio version:", err)` | Info | Expected error logging in catch block; not a stub |

No stubs, placeholders, or unimplemented handlers found. The `console.error` on line 92 is intentional error logging in a try-catch block that also sets error state and recovers the user to the selection step — not a hollow implementation.

---

## Human Verification Required

Task 3 of Plan 03 is a declared `checkpoint:human-verify` gate that was not completed before this verification. All code is committed and ready; the following must be confirmed in a running Sanity Studio.

### 1. Spawn Button Visibility

**Test:** Open a project with `projectStatus: "completed"` in Sanity Studio. Check the document actions panel.
**Expected:** "Create Portfolio Version" button is visible. On an active or reopened project, the button is absent.
**Why human:** Document action visibility depends on live Sanity Studio rendering and document state.

### 2. Photography Dialog Flow

**Test:** Click "Create Portfolio Version" on a completed project.
**Expected:** Dialog opens with "Has this project been professionally photographed?" and Yes/No buttons. Clicking "Yes, select photos" shows a thumbnail grid with all images pre-checked, a gold star badge on the hero image, and Select All/Select None controls.
**Why human:** Multi-step dialog UI, image thumbnail rendering, and interaction states require a live Studio session.

### 3. Document Creation and Navigation

**Test:** Select images and click "Create Portfolio Version" in the dialog.
**Expected:** Spinner appears briefly, then Studio navigates to the new portfolioProject document. The new document has correct title, location, description, and selected images. Tags field is empty. sourceAdminProjectId field is populated with the admin project ID (read-only).
**Why human:** Requires Sanity dataset write access and live navigation to verify field values.

### 4. No-Photos Path

**Test:** Open the spawn dialog and click "No, create without photos."
**Expected:** Portfolio document created with all text fields but no heroImage or gallery images.
**Why human:** Requires live document creation and inspection.

### 5. Duplicate Prevention

**Test:** After creating a portfolio version, navigate back to the source admin project.
**Expected:** "Create Portfolio Version" button is no longer visible (GROQ duplicate check returns true).
**Why human:** Requires live Sanity data with the newly created portfolioProject document.

---

## Gaps Summary

No automated gaps. All code artifacts exist, are substantive (not stubs), are fully wired, and data flows are connected to real Sanity client operations. The 9 pre-existing test failures in the full suite are in unrelated files (formatCurrency, geminiClient, milestoneUtils, blob-serve) and predate Phase 20 — confirmed in 20-03-SUMMARY.md.

The only open item is human verification of the spawn workflow in a running Sanity Studio instance, per the explicit `checkpoint:human-verify` gate defined in 20-03-PLAN.md Task 3.

---

_Verified: 2026-04-05T22:05:00Z_
_Verifier: Claude (gsd-verifier)_

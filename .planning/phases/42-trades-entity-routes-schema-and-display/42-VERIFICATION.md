---
phase: 42-trades-entity-routes-schema-and-display
verified: 2026-04-23T00:42:00Z
status: human_needed
score: 11/11 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 10/11
  gaps_closed:
    - "Truth #11: WorkOrderComposeModal header now renders 'To {name} · {email} · {Contractor|Vendor}' via relationshipLabel(contractor.relationship)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Navigate to /admin/trades/new. Verify the Relationship radio group renders two card-style options (Contractor, Vendor) with descriptive subtext. Submit the form without selecting a relationship."
    expected: "Validation error 'Select a relationship before saving' appears below the radio group; form submission is blocked. Selecting a relationship and saving creates the record."
    why_human: "Form state, required validation UX, and Sanity write round-trip cannot be verified by static code analysis."
  - test: "On any project detail page, hover a contractor chip in the 'Contractor / Vendor' section to open the ContactCardPopover. Verify the popover shows 'Contractor' or 'Vendor' as a small line below the contact name. Verify 'View full profile' links to /admin/trades/{id}."
    expected: "Derived relationship label visible below name; profile link resolves to /admin/trades."
    why_human: "Popover hover interaction and dynamic data from GROQ projection require live browser testing."
  - test: "Navigate to /admin/trades. Verify a 'Type' column appears between Name and Company showing 'Contractor' or 'Vendor' per row. Type 'vendor' in the search box and confirm only vendor rows surface."
    expected: "Per-row derived labels; search filter matches on relationship label."
    why_human: "Dynamic React state and client-side filtering require live browser testing."
  - test: "Navigate to an existing trades record with at least one trade and a city/state address. Verify a meta line appears directly below the H1 reading '{trade} · {Contractor|Vendor} · {City, ST}' in stone-mid color at ~12.5px. Test a record with no trade — verify the meta line reads '{Contractor|Vendor} · {City, ST}' with no empty slot."
    expected: "Correct segments displayed; empty segments omitted; typography matches UI-SPEC (12.5px, 1.4 line-height, var(--color-text-mid))."
    why_human: "Typography values and dynamic segment filtering require visual verification."
  - test: "From a project detail page, click 'Send work order' on a contractor chip. Verify the WorkOrderComposeModal header reads 'To {name} · {email} · {Contractor|Vendor}' where Contractor|Vendor is the derived entity type for that record."
    expected: "Header shows the correct derived label (Contractor or Vendor) based on the record's relationship field."
    why_human: "Modal interaction and runtime GROQ data require live browser testing to confirm the relationship field flows through correctly."
---

# Phase 42: Trades Entity — Routes, Schema, and Display Verification Report

**Phase Goal:** Rename /admin/contractors to /admin/trades, add relationship field (contractor|vendor) to Sanity schema with UI radio group and derived label across all surfaces, render meta line on detail page, add checklist-item arrays to siteSettings as schema foundation.
**Verified:** 2026-04-23T00:42:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure via Plan 42-03 (commit b6df85a)

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Contractor schema has a required `relationship` field with values contractor \| vendor | ✓ VERIFIED | `contractor.ts` line 32: `name: "relationship"`, options.list with contractor/vendor entries, required validation with exact error copy |
| 2  | contractor.ts top-of-file comment declares UI-facing entity name is Trades | ✓ VERIFIED | Line 1: `// UI-facing entity name: "Trades". _type stays "contractor" — see Phase 42 decision D-01.` |
| 3  | siteSettings has contractorChecklistItems[] and vendorChecklistItems[] arrays | ✓ VERIFIED | `siteSettings.ts` lines 56 and 65; correct initial values for both arrays |
| 4  | getAdminContractors, getAdminContractorDetail, and searchEntities GROQ projections include `relationship` | ✓ VERIFIED | `queries.ts` lines 1095, 1104, 1153; projectContractors projection also extended (Rule 2 fix in Plan 02) |
| 5  | POST /api/admin/contractors persists `relationship` on create; PATCH updates `relationship` | ✓ VERIFIED | `contractors.ts` create path with conditional spread; update path with hasOwnProperty gate for null-clear semantics |
| 6  | `src/lib/relationshipLabel.ts` exports a pure function mapping null/undefined/non-vendor to "Contractor" and "vendor" to "Vendor" | ✓ VERIFIED | `return relationship === "vendor" ? "Vendor" : "Contractor"`. All 6 unit tests pass. |
| 7  | `/admin/trades` serves the trades list page; `/admin/trades/{id}` serves the detail page | ✓ VERIFIED | `src/pages/admin/trades/index.astro` and `src/pages/admin/trades/[contractorId]/index.astro` exist; old `src/pages/admin/contractors/` directory confirmed deleted |
| 8  | Every internal href pointing at contractor records resolves to `/admin/trades/...` | ✓ VERIFIED | Zero grep hits for `/admin/contractors` in live code (`.astro`, `.tsx`, `.ts`) excluding the `/api/admin/contractors` endpoint |
| 9  | AdminNav shows `Trades` with href `/admin/trades`; "Contractor / Vendor" collective label retired from nav | ✓ VERIFIED | `AdminNav.tsx` line 22: `{ label: "Trades", href: "/admin/trades", icon: HardHat }` |
| 10 | Trades list has per-row Type column with derived Contractor\|Vendor; detail page has relationship radio group and derived Delete label; meta line below H1; ContactCardPopover shows derived label | ✓ VERIFIED | EntityListPage: Type column, `relationshipLabel` in cell render; EntityDetailForm: radio group, validation copy, derived delete label, conditional redirects; detail page: metaSegments join(" · ") at 12.5px; ContactCardPopover: derived label below name, trades profileHref |
| 11 | Work order contractor-picker header / chip context shows `{Contractor\|Vendor}` derived label | ✓ VERIFIED | `WorkOrderComposeModal.tsx` line 4 imports `relationshipLabel`; line 338 renders `To {contractor.name} · {contractor.email} · {relationshipLabel(contractor.relationship)}`; `relationship?: string \| null` on contractor prop type (line 94); `ContractorChipSendAction.tsx` line 51 has `relationship?` on prop type; project detail page line 319/347 passes `relationship: pc.contractor.relationship ?? null` |

**Score:** 11/11 truths verified

### Re-verification: Gap Closure

| Gap | Plan | Commit | Status |
|-----|------|--------|--------|
| Truth #11: WorkOrderComposeModal header missing Contractor\|Vendor label | 42-03 | b6df85a | CLOSED |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/sanity/schemas/contractor.ts` | Relationship field + UI-facing comment | ✓ VERIFIED | Field at line 32; comment at line 1 |
| `src/sanity/schemas/siteSettings.ts` | contractorChecklistItems[] and vendorChecklistItems[] | ✓ VERIFIED | Lines 56, 65 with correct initial values |
| `src/sanity/queries.ts` | relationship in 3 contractor GROQ projections | ✓ VERIFIED | Lines 1095, 1104, 1153 |
| `src/pages/api/admin/contractors.ts` | API read/write of relationship field | ✓ VERIFIED | Create and update paths both handle relationship |
| `src/lib/relationshipLabel.ts` | Pure label helper | ✓ VERIFIED | Exported function; 6/6 tests pass |
| `src/pages/admin/trades/index.astro` | List page at /admin/trades | ✓ VERIFIED | File exists; uses entityType="contractor" |
| `src/pages/admin/trades/[contractorId]/index.astro` | Detail page with meta line | ✓ VERIFIED | File exists; metaSegments, filter(Boolean), join(" · "), !isNew && metaLine conditional |
| `src/components/admin/AdminNav.tsx` | Trades nav entry | ✓ VERIFIED | `/admin/trades` href at line 22 |
| `src/components/admin/EntityDetailForm.tsx` | Relationship radio group + derived Delete label | ✓ VERIFIED | Radio group, "Select a relationship before saving" validation, derived delete copy, conditional redirects |
| `src/components/admin/EntityListPage.tsx` | Per-row Type column with derived label | ✓ VERIFIED | `{ key: "relationship", label: "Type" }` column; `relationshipLabel` in cell render |
| `src/components/admin/ContactCardPopover.tsx` | Derived relationship label + /admin/trades link | ✓ VERIFIED | `relationshipLabel(data.relationship)` below name; profileHref → `/admin/trades/{_id}` |
| `src/components/admin/WorkOrderComposeModal.tsx` | `{Contractor\|Vendor}` in header | ✓ VERIFIED | `relationshipLabel(contractor.relationship)` at line 338; import at line 4; `relationship?` on prop type |
| `src/components/admin/ContractorChipSendAction.tsx` | relationship field threaded through to modal | ✓ VERIFIED | `relationship?: string \| null` at line 51; field flows through `contractor={contractor}` spread |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `AdminNav.tsx` | `/admin/trades` list page | `href: "/admin/trades"` | ✓ WIRED | Line 22 confirmed |
| `EntityListPage.tsx` | `/admin/trades/{id}` detail | row-click + New button | ✓ WIRED | Contractor-case hrefs to /admin/trades/* |
| `EntityDetailForm.tsx` relationship select | POST /api/admin/contractors | `payload.relationship` | ✓ WIRED | `payload.relationship = relationship \|\| null` in handleSave |
| `ContactCardPopover.tsx` | `/admin/trades/{id}` | `profileHref` derivation | ✓ WIRED | `` `/admin/trades/${data._id}` `` at line 34 |
| `trades/[contractorId]/index.astro` meta line | `relationshipLabel` + `formatTrade` + address | segment join | ✓ WIRED | `metaSegments.join(" · ")` with conditional pushes |
| `project detail page` | `ContractorChipSendAction` | `relationship: pc.contractor.relationship ?? null` | ✓ WIRED | Lines 319 and 347 in index.astro |
| `ContractorChipSendAction` | `WorkOrderComposeModal` | `contractor={contractor}` spread | ✓ WIRED | Field on prop type at line 51; passes through spread at line 167 |
| `WorkOrderComposeModal.tsx` header | `relationshipLabel` | `relationshipLabel(contractor.relationship)` | ✓ WIRED | Line 338; import at line 4 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `EntityListPage.tsx` | `(entity as any).relationship` | `getAdminContractors` GROQ (queries.ts:1095) | Yes — DB query with `relationship` in projection | ✓ FLOWING |
| `trades/[contractorId]/index.astro` | `contractorData.relationship` | `getAdminContractorDetail` (queries.ts:1101) | Yes — DB query includes `relationship` | ✓ FLOWING |
| `ContactCardPopover.tsx` | `data.relationship` | `searchEntities` GROQ (queries.ts:1153) via ContactCardWrapper | Yes — `relationship` in searchEntities contractor branch | ✓ FLOWING |
| `WorkOrderComposeModal.tsx` | `contractor.relationship` | `projectContractors` GROQ (queries.ts:953) → project detail page → ContractorChipSendAction → modal prop | Yes — `relationship` in projectContractors projection; `pc.contractor.relationship ?? null` passed at lines 319/347 | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `relationshipLabel` tests pass | `npx vitest run src/lib/relationshipLabel.test.ts` | 6/6 passing | ✓ PASS |
| Contractor schema tests pass | `npx vitest run src/sanity/schemas/contractor.test.ts` | 11/11 passing (initial verification) | ✓ PASS |
| siteSettings schema tests pass | `npx vitest run src/sanity/schemas/siteSettings.test.ts` | 7/7 passing (initial verification) | ✓ PASS |
| API relationship round-trip tests pass | `npx vitest run src/pages/api/admin/contractors.test.ts` | 14/14 passing (initial verification) | ✓ PASS |
| No stale `/admin/contractors` in live code | `grep -rn '/admin/contractors' src/ \| grep -v '/api/admin/contractors'` | 0 matches | ✓ PASS |
| `/admin/contractors` directory deleted | `test ! -d src/pages/admin/contractors` | Exits 0 | ✓ PASS |
| WorkOrderComposeModal imports and uses `relationshipLabel` | `grep -n "relationshipLabel" WorkOrderComposeModal.tsx` | 2 hits: import (line 4) + header render (line 338) | ✓ PASS |
| `relationship?` on WorkOrderComposeModal contractor prop | `grep -n "relationship.*string.*null" WorkOrderComposeModal.tsx` | Hit at line 94 | ✓ PASS |
| `relationship?` on ContractorChipSendAction contractor prop | `grep -n "relationship" ContractorChipSendAction.tsx` | Hit at line 51 | ✓ PASS |
| Project detail page passes relationship to ContractorChipSendAction | `grep -n "relationship.*pc\.contractor" index.astro` | Hits at lines 319 and 347 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TRAD-01 | 42-02 | `/admin/trades` route replaces `/admin/contractors`; all URLs, nav links, and breadcrumbs updated | ✓ SATISFIED | Routes created, directory deleted, zero stale href references in live code |
| TRAD-02 | 42-01 | Each Trades record has a `relationship` field with contractor or vendor values | ✓ SATISFIED | Schema field, API round-trip, GROQ projections all verified |
| TRAD-03 | 42-02, 42-03 | Entity display name renders as "Contractor" or "Vendor" wherever relationship is known | ✓ SATISFIED | All surfaces verified: list Type column, detail radio group + delete copy, popover, meta line, WorkOrderComposeModal header (closed by Plan 42-03) |
| TRAD-05 | 42-02 | Trades detail page shows meta line: primary trade · relationship type · city, state | ✓ SATISFIED | Meta line fully implemented per UI-SPEC typography spec |
| TRAD-07 | 42-01 | 1099 document slot unified into contractor document checklist schema | ✓ SATISFIED | `contractorChecklistItems[]` initial value includes "1099"; schema-only per D-09 (Phase 43 renders checklist UI) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/admin/EntityDetailForm.tsx` | 729 | `{ action: "delete", _id: entityId }` — key mismatch vs. API's `contractorId` | ⚠️ Warning | Delete records silently returns 400 (pre-existing bug from before Phase 42) |
| `src/components/admin/EntityDetailForm.tsx` | 264-267 | `{ action: "delete-doc", _id: entity?._id }` — key mismatch vs. API's `contractorId` | ⚠️ Warning | Delete document silently returns 400 (pre-existing bug from before Phase 42) |
| `src/pages/admin/dashboard.astro` | 118 | `Contractor / Vendor` as card section heading | ℹ️ Info | Group heading — intentionally static per plan interfaces note and UI-SPEC |
| `src/pages/admin/projects/[projectId]/index.astro` | 300 | `Contractor / Vendor` as section heading | ℹ️ Info | Group heading — same rationale; per-record derivation not required |

### Human Verification Required

#### 1. Relationship Radio Group — Form Behavior

**Test:** Navigate to `/admin/trades/new`. Verify the Relationship radio group renders two card-style options (Contractor, Vendor) with descriptive subtext. Submit the form without selecting a relationship.
**Expected:** Validation error "Select a relationship before saving" appears below the radio group; form submission is blocked. Selecting a relationship and saving creates the record.
**Why human:** Form state, required validation UX, and Sanity write round-trip cannot be verified by static code analysis.

#### 2. ContactCardPopover — Derived Label + Link

**Test:** On any project detail page, hover a contractor chip in the "Contractor / Vendor" section to open the ContactCardPopover. Verify the popover shows "Contractor" or "Vendor" as a small line below the contact name. Verify "View full profile" links to `/admin/trades/{id}`.
**Expected:** Derived relationship label visible below name; profile link resolves to `/admin/trades`.
**Why human:** Popover hover interaction and dynamic data from GROQ projection require live browser testing.

#### 3. Trades List — Type Column and Search Filter

**Test:** Navigate to `/admin/trades`. Verify a "Type" column appears between Name and Company, showing "Contractor" or "Vendor" per row. Type "vendor" in the search box and confirm only vendor rows are surfaced.
**Expected:** Per-row derived labels; search filter matches on relationship label.
**Why human:** Dynamic React state and client-side filtering require live browser testing.

#### 4. Detail Page Meta Line — Typography and Segment Filtering

**Test:** Navigate to an existing trades record that has at least one trade and a city/state address. Verify a meta line appears directly below the page H1 reading `{trade} · {Contractor|Vendor} · {City, ST}` in stone-mid color at ~12.5px. Then test a record with no trade — verify the meta line reads `{Contractor|Vendor} · {City, ST}` (no empty slot).
**Expected:** Correct segments displayed; empty segments omitted; typography matches UI-SPEC (12.5px, 1.4 line-height, `var(--color-text-mid)`).
**Why human:** Typography values and dynamic segment filtering require visual verification.

#### 5. WorkOrderComposeModal Header — Derived Relationship Label

**Test:** From a project detail page, click "Send work order" on a contractor chip. Verify the WorkOrderComposeModal header reads `To {name} · {email} · {Contractor|Vendor}` where Contractor|Vendor is the derived entity type for that specific record.
**Expected:** Header shows the correct derived label (e.g., "Contractor" for a contractor-type record, "Vendor" for a vendor-type record). D-04 fallback: records with no relationship set show "Contractor".
**Why human:** Modal interaction and runtime GROQ data flowing through the ContractorChipSendAction → WorkOrderComposeModal prop chain require live browser testing.

### Gaps Summary

No gaps. All 11 must-have truths are satisfied by static code analysis. Plan 42-03 (commit b6df85a) closed the one gap from the initial verification by threading `relationship` through ContractorChipSendAction and rendering the derived label in the WorkOrderComposeModal header.

Remaining items requiring human testing are standard UI/interaction verifications that cannot be checked statically (form validation UX, popover hover behavior, dynamic React filtering, visual typography, modal interaction). These were present in the initial verification and are unchanged — no new items were added by the gap closure.

---

_Verified: 2026-04-23T00:42:00Z_
_Verifier: Claude (gsd-verifier)_

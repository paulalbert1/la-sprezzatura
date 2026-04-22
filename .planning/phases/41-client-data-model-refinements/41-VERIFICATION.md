---
phase: 41-client-data-model-refinements
verified: 2026-04-22T15:38:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 11/12
  gaps_closed:
    - "An entity with city='Darien' and state='CT' renders 'Darien, CT' in the Address cell — getAdminClients GROQ projection now includes address { street, city, state, zip }"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Address round-trip — CLNT-11"
    expected: "Save a client with street, city, state, zip via /admin/clients/{id} detail form. Reload the page. All four address fields should still be populated."
    why_human: "Requires live Sanity round-trip through the browser; cannot verify without running the app against real data."
  - test: "Address column in list — CLNT-12"
    expected: "Navigate to /admin/clients. Clients with a city and/or state should show 'City, ST' in the Address column. Clients with no address show '—'."
    why_human: "Visual column rendering check with real Sanity data."
  - test: "Address sort — CLNT-12"
    expected: "Click the Address column header on /admin/clients. List should re-order by city ascending. Click again — descending."
    why_human: "UI state interaction; requires browser."
  - test: "City search filter — CLNT-12"
    expected: "Type a city name (e.g. 'Darien') into the search box on /admin/clients. List should filter to matching rows."
    why_human: "Requires real client data with known city values."
  - test: "Phone formatting display — CLNT-10"
    expected: "On /admin/clients and /admin/contractors, phone cells with 10-digit numbers display (NNN) NNN-NNNN. Open a ContactCardPopover — phone link text is formatted; the tel: href uses raw digits."
    why_human: "Visual rendering check with real data."
  - test: "preferredContact fully absent from UI — CLNT-13"
    expected: "Open a client detail form — no 'Preferred Contact' select is visible. Open a ContactCard hover — no 'Prefers:' line appears."
    why_human: "Absence-of-element visual confirmation."
---

# Phase 41: Client Data Model Refinements Verification Report

**Phase Goal:** Refine the client data model — remove preferredContact field, add phone formatting, reshape Clients list columns with address sort/search, and ensure GROQ projections are consistent.
**Verified:** 2026-04-22T15:38:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (Plan 41-03 closed the getAdminClients address projection gap)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `formatPhone('2125550142')` returns `'(212) 555-0142'` | VERIFIED | format.ts uses `/\D/g` + 10-digit template; `npx vitest run src/lib/format.test.ts` — 10/10 passing |
| 2 | `formatPhone('(212) 555-0142')` returns `'(212) 555-0142'` (re-formats parenthetical) | VERIFIED | format.test.ts line 9-11 passes |
| 3 | `formatPhone('555-1234')` returns `'555-1234'` unchanged (safe fallback) | VERIFIED | format.test.ts line 25-27 passes |
| 4 | `formatPhone('')` / `formatPhone(null)` / `formatPhone(undefined)` returns `''` | VERIFIED | format.test.ts lines 29-39 pass |
| 5 | Client schema no longer defines a preferredContact field | VERIFIED | `grep preferredContact src/sanity/schemas/client.ts` — zero matches |
| 6 | Create/update client API does not accept or write preferredContact | VERIFIED | `grep preferredContact src/pages/api/admin/clients.ts` — zero matches; destructuring + payload confirmed clean |
| 7 | getAdminClients, getAdminClientDetail, and ADMIN_DASHBOARD_PROJECTS_QUERY do not project preferredContact | VERIFIED | `grep preferredContact src/sanity/queries.ts` and `grep clientPreferredContact` — zero matches |
| 8 | Saving a client with street/city/state/zip persists the address object round-trip | VERIFIED (code) | `getAdminClientDetail` projects `address` (line 1083); API create and update write address; EntityDetailForm wires all 4 address fields. Full round-trip requires human smoke test. |
| 9 | The Clients list renders columns in this exact order: Name, Address, Email, Phone (four columns, no others) | VERIFIED | CLIENT_COLUMNS at lines 13-18 = `[name, address, email, phone]`, exactly 4 entries; confirmed by grep |
| 10 | Clicking the Address column header sorts the list by city ascending/descending | VERIFIED (code) | `sortColumn === "address"` accessor (lines 79-80) reads `a.address?.city` — correct logic; visual confirmation needs browser |
| 11 | An entity with city='Darien' and state='CT' renders 'Darien, CT' in the Address cell | VERIFIED | **Gap closed by Plan 41-03.** `getAdminClients` GROQ projection at line 1074 now includes `address { street, city, state, zip }`; EntityListPage address cell logic at lines 191-194 correctly renders `[city, state].filter(Boolean).join(', ')` |
| 12 | An entity with blank city and blank state renders '—' in the Address cell | VERIFIED | EntityListPage lines 191-198: `<span className="text-stone-light">—</span>` fallback renders when both blank |
| 13 | Searching for a city name filters the client list to matching rows | VERIFIED (code) | EntityListPage lines 55-56, 67-68 extract `entity.address?.city` and `entity.address?.state` and include in search filter; address data now arrives from getAdminClients |
| 14 | Every phone displayed in EntityListPage renders via formatPhone() | VERIFIED | EntityListPage lines 202 and 213 both use `formatPhone(entity.phone)` for client and contractor rows (3 total formatPhone calls in file) |
| 15 | ContactCardPopover phone link text renders via formatPhone() (href still uses raw tel: value) | VERIFIED | ContactCardPopover: 2 formatPhone references confirmed; Prefers: count = 0; `href={\`tel:${data.phone}\`}` pattern intact |
| 16 | EntityDetailForm no longer has a Preferred Contact select block | VERIFIED | `grep -c preferredContact src/components/admin/EntityDetailForm.tsx` = 0 |
| 17 | EntityDetailForm no longer sets payload.preferredContact on save | VERIFIED | Zero matches for preferredContact in EntityDetailForm.tsx |
| 18 | ContactCardPopover no longer shows a 'Prefers:' line | VERIFIED | `grep -c 'Prefers:' ContactCardPopover.tsx` = 0 |
| 19 | ContactCardWrapper no longer passes preferredContact into the popover data object | VERIFIED | `grep -c preferredContact ContactCardWrapper.tsx` = 0 |
| 20 | ClientChipWithRegenerate no longer references preferredContact | VERIFIED | `grep -c preferredContact ClientChipWithRegenerate.tsx` = 0 |
| 21 | Running `grep -rn preferredContact src/` returns zero matches | VERIFIED | `grep -rn "preferredContact" src/` — zero matches (full tree clean) |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/format.ts` | formatPhone(raw) pure function, exported | VERIFIED | Exports `formatPhone`, uses `/\D/g` regex, 10-digit format, safe fallback |
| `src/lib/format.test.ts` | Unit tests for formatPhone, 10 test cases | VERIFIED | 10 tests, all passing via vitest |
| `src/sanity/schemas/client.ts` | Client schema without preferredContact; address retained | VERIFIED | 6 fields: name, email, phone, address, notes, portalToken; no preferredContact |
| `src/sanity/queries.ts` | GROQ projections with no preferredContact; getAdminClients includes address | VERIFIED | No preferredContact anywhere; getAdminClients at line 1074 projects `address { street, city, state, zip }` |
| `src/pages/api/admin/clients.ts` | Create/update handlers without preferredContact | VERIFIED | Clean of all preferredContact references; address handled correctly |
| `src/components/admin/EntityListPage.tsx` | 4-column layout, address sort, formatPhone, city/state search | VERIFIED | All logic and data path correct; 3 formatPhone calls, sort accessor, city/state search extraction all confirmed |
| `src/components/admin/EntityDetailForm.tsx` | No preferredContact state/validation/payload/select block | VERIFIED | Zero matches for preferredContact or Preferred Contact |
| `src/components/admin/ContactCardPopover.tsx` | formatPhone display, no Prefers: block | VERIFIED | 2 formatPhone references; tel: href intact; Prefers: removed |
| `src/components/admin/ContactCardWrapper.tsx` | No preferredContact key in popover data | VERIFIED | Zero matches |
| `src/components/admin/ClientChipWithRegenerate.tsx` | No preferredContact reference | VERIFIED | Zero matches |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/admin/EntityListPage.tsx` | `src/lib/format.ts` | `import { formatPhone } from "../../lib/format"` | WIRED | Import confirmed; formatPhone called at 3 sites in file |
| `src/components/admin/ContactCardPopover.tsx` | `src/lib/format.ts` | `import { formatPhone } from "../../lib/format"` | WIRED | Import confirmed; formatPhone wraps `data.phone` in link text |
| `src/pages/admin/clients/index.astro` | `src/sanity/queries.ts` | `getAdminClients(client)` | WIRED | Line 7 import, line 14 call confirmed |
| `getAdminClients` (queries.ts) | address object in Sanity | GROQ projection at line 1074 | WIRED | `address { street, city, state, zip }` present in projection |
| `getAdminClientDetail` (queries.ts) | address object in Sanity | GROQ projection at line 1083 | WIRED | `_id, name, email, phone, address, notes` confirmed |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| EntityListPage.tsx (Address cell) | `entity.address?.city`, `entity.address?.state` | `getAdminClients` → Sanity | Yes — `address { street, city, state, zip }` now in projection at line 1074 | FLOWING |
| EntityListPage.tsx (Phone cell) | `entity.phone` | `getAdminClients` → Sanity | Yes — `phone` is projected | FLOWING |
| ContactCardPopover.tsx (Phone text) | `data.phone` | ContactCardWrapper → popover props | Yes — phone passes through wrapper | FLOWING |
| EntityDetailForm.tsx (Address fields) | `entity.address.*` | `getAdminClientDetail` → Sanity | Yes — address projected at line 1083 | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| formatPhone unit tests | `npx vitest run src/lib/format.test.ts` | 10/10 passing | PASS |
| No preferredContact in src/ tree | `grep -rn "preferredContact" src/` | zero matches | PASS |
| Client schema address retained | `grep -c 'name: "address"' src/sanity/schemas/client.ts` | 1 match | PASS |
| CLIENT_COLUMNS count | `grep -A 6 "const CLIENT_COLUMNS" EntityListPage.tsx \| grep -c "key:"` | 4 entries | PASS |
| address in getAdminClients projection | `grep -A 4 "getAdminClients" queries.ts \| grep address` | match at line 1074 | PASS |
| getAdminClientDetail unchanged | `grep -A 6 "getAdminClientDetail" queries.ts \| grep address` | `_id, name, email, phone, address, notes` | PASS |
| TypeScript errors in Phase 41 files | `npx tsc --noEmit 2>&1 \| grep -E "(EntityListPage\|EntityDetailForm\|ContactCardPopover\|ContactCardWrapper\|ClientChipWithRegenerate\|format\.ts\|clients\.ts)"` | zero errors | PASS |
| Pre-existing unrelated TS error | `npx tsc --noEmit 2>&1 \| grep queries.ts` | line 92 TS2769 (pre-existing, unrelated to Phase 41) | INFO |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CLNT-10 | 41-01, 41-02 | Phone numbers render consistently everywhere | SATISFIED | formatPhone exported from format.ts; applied in EntityListPage (client + contractor rows), ContactCardPopover; 10/10 unit tests passing |
| CLNT-11 | 41-01, 41-02 | Client records capture physical address fields | SATISFIED (code) | Schema has address object; API writes it; getAdminClientDetail projects it; EntityDetailForm renders all 4 fields. Full round-trip needs human smoke test. |
| CLNT-12 | 41-02, 41-03 | Clients list columns: name, address, email, phone | SATISFIED | CLIENT_COLUMNS correct; address cell logic correct; getAdminClients now projects address (Plan 41-03 gap closure); sort and search logic wired. Visual confirmation needs browser. |
| CLNT-13 | 41-01, 41-02 | preferredContact removed from schema and UI | SATISFIED | Zero matches across entire src/ tree; schema, queries, API, and all 5 UI components clean |

### Anti-Patterns Found

None. All previously identified anti-patterns have been resolved. The getAdminClients GROQ projection gap (previously a blocker) was closed by Plan 41-03.

### Human Verification Required

#### 1. Address Round-Trip (CLNT-11)

**Test:** Log into /admin. Navigate to a client detail page (/admin/clients/{id}). Edit the street, city, state, and zip fields. Save. Reload the page.
**Expected:** All four address fields retain the saved values.
**Why human:** Requires live Sanity write + read cycle through the browser.

#### 2. Address Column in List (CLNT-12)

**Test:** Navigate to /admin/clients.
**Expected:** Clients with a city and/or state show "City, ST" in the Address column. Clients with no address show "—".
**Why human:** Visual column rendering check with real Sanity data.

#### 3. Address Sort (CLNT-12)

**Test:** On /admin/clients, click the Address column header.
**Expected:** List re-orders by city ascending. Click again — descending.
**Why human:** UI state interaction; requires browser.

#### 4. City Search (CLNT-12)

**Test:** On /admin/clients, type a city name into the search box.
**Expected:** List filters to show only clients whose city or state contains the search term.
**Why human:** Requires real client data with known city values.

#### 5. Phone Format Display (CLNT-10)

**Test:** On /admin/clients and /admin/contractors, inspect phone cells. Open a ContactCardPopover.
**Expected:** 10-digit phones render as (NNN) NNN-NNNN. Popover phone link text is formatted; the tel: href uses raw digits.
**Why human:** Visual rendering check with real data.

#### 6. preferredContact Absent (CLNT-13)

**Test:** Open a client detail form. Open a ContactCard hover.
**Expected:** No "Preferred Contact" select is visible on the form. No "Prefers:" line appears in any hover card.
**Why human:** Absence-of-element visual confirmation.

### Gaps Summary

No gaps. All 12 must-haves are verified at the code level. The previous gap (CLNT-12 address data disconnected) was resolved by Plan 41-03 adding `address { street, city, state, zip }` to the `getAdminClients` GROQ projection.

Six human verification items remain for visual and live-data confirmation of CLNT-10, CLNT-11, CLNT-12, and CLNT-13.

---

_Verified: 2026-04-22T15:38:00Z_
_Verifier: Claude (gsd-verifier)_

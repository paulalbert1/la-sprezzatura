---
phase: 24-portal-integration
verified: 2026-04-06T21:30:00Z
status: human_needed
score: 7/7 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "Send Update email shows procurement as a status-count summary, not per-item detail"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Send a test Send Update email for a full-interior-design project with procurement items"
    expected: "Email body contains a Procurement section listing stage names and item counts (e.g., 'Not Yet Ordered  2 items'). No prices, no savings, no delivery dates visible."
    why_human: "Behavioral confirmation requires sending an actual email against a live Sanity project with Resend configured"
  - test: "View portal procurement table for a project with manufacturer and quantity data"
    expected: "Manufacturer name appears on a smaller gray sub-line below item name. If quantity is present, format reads 'Kravet · Qty 2'. If quantity absent, only manufacturer shows. Status badge reads 'Not Yet Ordered' (not 'Pending'). Sort order follows pipeline."
    why_human: "Visual rendering and Tailwind class application require browser verification"
---

# Phase 24: Portal Integration Verification Report

**Phase Goal:** The client portal procurement table reflects the updated schema fields (manufacturer, quantity) and the Send Update email includes a procurement summary section -- completing the downstream consumer updates for the new procurement data
**Verified:** 2026-04-06T21:30:00Z
**Status:** human_needed (all automated checks pass; 2 items require browser/email verification)
**Re-verification:** Yes -- after gap closure (commit 115c437)

## Gap Resolution Summary

The single gap from initial verification has been closed. Commit 115c437 (`fix(24): add missing GROQ spread operator on inline select() in send-update`) added the `...` spread operator at line 187 of `src/pages/api/send-update.ts`:

```
...select(engagementType == "full-interior-design" => {
  "procurementItems": procurementItems[] { status }
})
```

This matches the pattern used in both `queries.ts` line 500 (SEND_UPDATE_PROJECT_QUERY) and line 221 (PROJECT_DETAIL_QUERY). The inline GROQ query now correctly merges `procurementItems` into the root projection object, making `project.procurementItems` accessible at the level the summary block code reads it.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Client sees manufacturer name below item name in portal procurement table | VERIFIED | `ProcurementTable.astro` lines 110-114: manufacturer sub-line with `block text-xs text-stone mt-0.5` classes |
| 2 | Client sees quantity displayed as 'Qty N' next to manufacturer when both are present | VERIFIED | Line 112: `` item.quantity ? ` · Qty ${item.quantity}` : '' `` |
| 3 | Status badges show 'Not Yet Ordered' instead of 'Pending' | VERIFIED | STATUS_LABELS derived from PROCUREMENT_STAGES; STATUS_STYLES has `not-yet-ordered` key; `pending` key absent |
| 4 | Legacy 'pending' data normalizes to 'not-yet-ordered' display | VERIFIED | ProcurementTable.astro lines 22-26: normalization block before sort; STATUS_PRIORITY has no `pending` entry |
| 5 | Items sort in chronological pipeline order | VERIFIED | STATUS_PRIORITY: `not-yet-ordered:0, ordered:1, in-transit:2, warehouse:3, delivered:4, installed:5` |
| 6 | Send Update email shows procurement as a status-count summary, not per-item detail | VERIFIED | Summary block logic correct (lines 67-103); inline GROQ now uses `...select(` spread (line 187, commit 115c437) -- `project.procurementItems` is accessible |
| 7 | No savings, no prices, no delivery dates appear in the email | VERIFIED | `getStatusColor`, `formatStatusText`, `totalSavings`, `savingsLine` all absent (0 occurrences); no `retailPrice`, `clientCost`, `installDate` in send-update.ts |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/sanity/queries.ts` | GROQ projection with manufacturer and quantity fields (PROJECT_DETAIL_QUERY) | VERIFIED | Lines 230-231: `manufacturer` and `quantity` in procurementItems projection |
| `src/sanity/queries.ts` | SEND_UPDATE_PROJECT_QUERY simplified to `{ status }` only | VERIFIED | Line 501: `"procurementItems": procurementItems[] { status }` with `...select` spread at line 500 |
| `src/components/portal/ProcurementTable.astro` | Portal table with sub-line and updated status maps | VERIFIED | PROCUREMENT_STAGES imported; Props expanded; STATUS_PRIORITY/LABELS/STYLES updated; sub-line markup in place |
| `src/pages/api/send-update.ts` | Email builder with summary block replacing per-item table | VERIFIED | Summary block logic complete; inline GROQ now has `...select` spread (line 187); `project.procurementItems` accessible |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/sanity/queries.ts` | `src/components/portal/ProcurementTable.astro` | PROJECT_DETAIL_QUERY GROQ projection feeds Props interface | VERIFIED | manufacturer and quantity present in both projection (queries.ts:230-231) and Props interface (ProcurementTable.astro:15-16) |
| `src/lib/procurementStages.ts` | `src/components/portal/ProcurementTable.astro` | PROCUREMENT_STAGES import for STATUS_LABELS | VERIFIED | Line 4 import; line 44-46 STATUS_LABELS derived via `PROCUREMENT_STAGES.map()` |
| `src/lib/procurementStages.ts` | `src/pages/api/send-update.ts` | PROCUREMENT_STAGES import for stage ordering and titles | VERIFIED | Line 6 import; lines 78-92: `.filter()` and `.map()` chain on PROCUREMENT_STAGES for summary rows |
| `src/sanity/queries.ts` | `src/pages/api/send-update.ts` | SEND_UPDATE_PROJECT_QUERY and inline GROQ both simplified to `{ status }` | VERIFIED | queries.ts line 501: `procurementItems[] { status }` with `...select` at line 500; send-update.ts line 188: same projection with `...select` at line 187 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ProcurementTable.astro` | `items` (Props) | `PROJECT_DETAIL_QUERY` GROQ (queries.ts:221-231) feeds portal page feeds component props | Yes -- GROQ fetches manufacturer, quantity, status from Sanity schema fields | FLOWING |
| `send-update.ts` buildSendUpdateEmail | `project.procurementItems` | Inline GROQ fetch at line 181-198 with `...select` spread at line 187 | Yes -- `...select` merges procurementItems into root; guard at line 215 (`project.procurementItems?.length > 0`) evaluates correctly for full-interior-design projects | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED for portal rendering (requires browser). Email delivery requires Resend + a live Sanity project; cannot be tested without a running server and real data.

---

### Requirements Coverage

Note: `.planning/REQUIREMENTS.md` does not exist as a standalone file. PORT-01 and PORT-02 are defined by the Success Criteria in ROADMAP.md Phase 24 and further refined by CONTEXT.md decisions.

| Requirement | Source Plan | Description (from ROADMAP Success Criteria) | Status | Evidence |
|-------------|------------|---------------------------------------------|--------|----------|
| PORT-01 | 24-01-PLAN.md | Client viewing project portal sees manufacturer name and quantity alongside existing procurement fields; netPrice never visible | SATISFIED | ProcurementTable.astro: sub-line renders manufacturer+quantity; GROQ projection excludes netPrice/clientCost (only computed savings field exposed, intentional per CONTEXT D-08) |
| PORT-02 | 24-02-PLAN.md | Send Update email includes procurement summary showing item count by status; section only appears for full-interior-design projects with procurement items | SATISFIED | Summary block complete and correct; inline GROQ `...select` spread fixed in commit 115c437; data-flow from Sanity to email summary is now fully connected |

**Note on ROADMAP SC-2 and overdue flagging:** ROADMAP success criterion #2 mentions "any overdue items flagged" in the email. CONTEXT.md decision D-10 explicitly rejected overdue flagging ("No overdue flagging in the email. Liz manages overdue items in Studio."). This decision was codified in both plans and the UI-SPEC. The CONTEXT decision supersedes the initial ROADMAP wording. Overdue flagging is correctly absent and this is not a gap.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/ROADMAP.md` | 490 | Plan 01 checkbox `[ ]` shows incomplete despite execution commits | INFO | Documentation only; no functional impact. ROADMAP checkbox should be `[x]`. (Carried from initial verification; no code impact.) |

No functional anti-patterns remain. The `select()` without spread that was flagged in initial verification is resolved.

---

### Human Verification Required

#### 1. Send Update Email -- Procurement Section Renders

**Test:** Open Studio, select a full-interior-design project that has procurement items. Click Send Update. Inspect the resulting email HTML (or send to a test address).
**Expected:** Email body contains a "Procurement" heading section with rows listing stage name and item count (e.g., "Not Yet Ordered  2 items", "Ordered  1 item"). No prices, dates, or savings visible.
**Why human:** Requires a live Resend API key and a Sanity project with procurement data. The GROQ fix cannot be validated without an actual round-trip through the Sanity GROQ runtime and email delivery.

#### 2. Portal Procurement Table -- Sub-line Visual Rendering

**Test:** Open the client portal for a project with procurement items that have manufacturer and/or quantity set.
**Expected:** Manufacturer appears as a smaller gray sub-line below the item name in the same table cell. If quantity is set, format reads "Kravet · Qty 2". If quantity is absent, only manufacturer name shows. No sub-line if manufacturer is absent. Status badges show "Not Yet Ordered" (not "Pending").
**Why human:** Tailwind class rendering (`text-xs text-stone mt-0.5`), responsive layout, and visual hierarchy require browser verification.

---

### Gaps Summary

No gaps remain. The single gap identified in initial verification (missing `...` spread operator on `select()` in the inline GROQ query in `send-update.ts`) was resolved in commit 115c437. Both GROQ paths that feed procurement data now use the correct `...select(engagementType == "full-interior-design" => { ... })` form, consistent with the centralized `SEND_UPDATE_PROJECT_QUERY` in `queries.ts`.

All automated checks pass. Phase 24 goal is achieved at the code level. Two items remain for human confirmation (email delivery behavior and portal visual rendering) before full sign-off.

---

*Verified: 2026-04-06T21:30:00Z*
*Verifier: Claude (gsd-verifier)*
*Re-verification after commit: 115c437*

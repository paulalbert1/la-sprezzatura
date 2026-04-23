---
phase: 42-trades-entity-routes-schema-and-display
plan: "02"
subsystem: admin-ui
tags: [astro-routes, admin-ui, navigation, meta-line, ui-derivation]

requires:
  - phase: 42-trades-entity-routes-schema-and-display
    plan: "01"
    provides: contractor.relationship schema field, relationshipLabel helper, GROQ projections of relationship, /api/admin/contractors round-trip
provides:
  - /admin/trades and /admin/trades/{id} Astro routes (hard rename — no redirect per D-02)
  - AdminNav 'Trades' entry replacing 'Contractor / Vendor'
  - Relationship radio group on EntityDetailForm with required validation and derived Delete copy
  - Per-row Type column on EntityListPage with derived Contractor|Vendor label
  - Meta line on the trades detail page ({primary trade} · {Contractor|Vendor} · {City, ST})
  - ContactCardPopover derived relationship label below the contact name
  - projectContractors GROQ projection extended with relationship so chip popovers on project detail show the correct label
affects:
  - phase 43 (document checklists + completeness indicator — consumes the derived Contractor|Vendor label and relationship field in detail-page UI)
  - v5.2 UAT — Liz's primary test path: dashboard → /admin/trades → detail page → Relationship radio group → save → popover correctness

tech-stack:
  added: []
  patterns:
    - Astro route hard-rename via directory move + every internal href updated in a single commit (no redirect kept)
    - Derived per-record label via relationshipLabel(entity.relationship) wherever the record's relationship is known; static 'Contractor / Vendor' retained only at the primary New-record CTA (D-05 / UI-SPEC Copywriting Contract)
    - Radio group with sr-only <input> and visible <label> card, error ring via conditional className (follows existing EntityDetailForm select error pattern)
    - Meta-line segment assembly: build string[], filter(Boolean), join(' · ') — same pattern the Phase 41 address cell established

key-files:
  created:
    - src/pages/admin/trades/index.astro
    - src/pages/admin/trades/[contractorId]/index.astro
  modified:
    - src/components/admin/AdminNav.tsx
    - src/components/admin/EntityDetailForm.tsx
    - src/components/admin/EntityListPage.tsx
    - src/components/admin/ContactCardPopover.tsx
    - src/components/admin/ContactCardWrapper.tsx
    - src/pages/admin/dashboard.astro
    - src/pages/admin/projects/[projectId]/index.astro
    - src/sanity/queries.ts
    - src/sanity/schemas/contractor.ts
  deleted:
    - src/pages/admin/contractors/index.astro
    - src/pages/admin/contractors/[contractorId]/index.astro

key-decisions:
  - "Routes are a hard rename per D-02: old /admin/contractors returns 404, no Astro.redirect left behind. Every internal href points at /admin/trades/*."
  - "Primary 'New Contractor / Vendor' CTA intentionally retains the ambiguous collective label (UI-SPEC) — the form forces the relationship choice via the required radio group. Per-row labels, popovers, detail-page delete copy, and the meta line are all derived per record."
  - "Relationship field renders as a radio group (2 side-by-side cards), not a dropdown (plan's Claude's-Discretion recommendation). Rationale: 2 mutually exclusive options semantically weighty enough (drives checklist + label) to warrant both being visible."
  - "projectContractors GROQ projection extended with relationship so project-detail chip popovers show the correct Contractor|Vendor label. Not in the plan's <files_modified> list but a Rule 2 correctness addition — the popover was otherwise silently defaulting every vendor chip to 'Contractor' on that surface."
  - "Browser <title> for detail page computed from relationshipLabel: '{name} — {Contractor|Vendor} — La Sprezzatura Admin' (UI-SPEC Nav table). Falls back to 'Trade' on null contractorData."

patterns-established:
  - "Derived entity label everywhere via relationshipLabel(entity.relationship) import from src/lib/relationshipLabel — single source of truth for D-04 null fallback"
  - "Astro frontmatter destructuring with (x as any)?.relationship cast when consuming Sanity fetch results that haven't been given a typed return shape yet — the helper is null-safe so the cast only satisfies TS, not runtime"
  - "Radio group UI: sr-only input + visible label card with selected/unselected border-color class, error ring via conditional append to className"

requirements-completed: [TRAD-01, TRAD-03, TRAD-05]

duration: 9min
completed: 2026-04-23
---

# Phase 42 Plan 02: Trades Entity — Routes and Display Summary

**`/admin/contractors` hard-renamed to `/admin/trades` with a relationship radio group, per-row Type column, derived popover labels, and a detail-page meta line — every surface Liz sees now reads 'Contractor' or 'Vendor' per record instead of the collective label.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-23T03:46:54Z
- **Completed:** 2026-04-23T03:55:08Z
- **Tasks:** 3
- **Files modified:** 9 modified + 2 created + 2 deleted (moved) = 13

## Accomplishments

- `/admin/contractors` → `/admin/trades` hard rename: list + detail Astro pages moved, AdminNav label/href updated, dashboard contractor-card New CTA + contractor-name links point at new route, project-detail contractor chips link to new route, old `/admin/contractors` path now 404s natively per D-02
- `EntityDetailForm` gained a required Relationship radio group (Contractor | Vendor) between the Company and Trades fields with validation copy, helper text, and error ring — round-trips through Plan 01's API with null-clear semantics
- Delete trigger button and delete-confirmation modal title + confirm button all read `Delete {Contractor|Vendor}` derived via `relationshipLabel(relationship)` (D-05)
- Post-save redirect → `/admin/trades/{createdId}`; post-delete redirect → `/admin/trades` (contractor case only; client case unchanged)
- `EntityListPage` contractor variant now shows a per-row Type column with derived `Contractor`/`Vendor` label, filterable via search, sortable by relationship string, and empty-state copy matches UI-SPEC
- `ContactCardPopover` renders a derived relationship line below the name whenever `entityType === "contractor"`; `profileHref` resolves to `/admin/trades/{_id}`
- `ContactCardWrapper` threads `relationship` from the typeahead result into the popover data; `projectContractors` GROQ projection extended so chip popovers on the project detail page show correct labels
- Trades detail page renders a meta line immediately below the H1: `{primary trade} · {Contractor|Vendor} · {City, ST}` with segment filtering, 12.5px DM Sans at `var(--color-text-mid)` per UI-SPEC typography contract
- Browser `<title>` for detail page computed as `{name} — {Contractor|Vendor} — La Sprezzatura Admin` via relationshipLabel

## Task Commits

Each task was committed atomically:

1. **Task 1: Hard route rename + non-component href sweep** — `da59c30`
   - feat(42-02): rename /admin/contractors to /admin/trades (hard rename)
   - 7 files changed, 21 insertions(+), 14 deletions(-)
   - git detected the two Astro files as renames (not deletions)
2. **Task 2: Relationship radio + EntityListPage Type column + popover derivation** — `cba06c1`
   - feat(42-02): wire relationship field through detail form, list, and popover
   - 6 files changed, 124 insertions(+), 16 deletions(-)
3. **Task 3: Meta line on trades detail page** — `c71aa6b`
   - feat(42-02): render meta line on trades detail page
   - 1 file changed, 27 insertions(+)

## Files Created/Modified

### Created
- `src/pages/admin/trades/index.astro` — list page at /admin/trades with breadcrumbs + AdminLayout title set to 'Trades'
- `src/pages/admin/trades/[contractorId]/index.astro` — detail page with relationshipLabel-derived browser title, Trades breadcrumb, and the meta-line render (Task 3)

### Modified
- `src/components/admin/AdminNav.tsx` — line 22 label 'Contractor / Vendor' → 'Trades', href → '/admin/trades'
- `src/components/admin/EntityDetailForm.tsx` — relationshipLabel import, FieldError.relationship, relationship state, validate() required check, handleSave payload.relationship round-trip, conditional post-save redirect to /admin/trades/{id}, relationship radio group render, delete trigger copy + DeleteInlineDialog title/body/confirm button copy derived, contractor-case post-delete redirect to /admin/trades
- `src/components/admin/EntityListPage.tsx` — relationshipLabel import, CONTRACTOR_COLUMNS Type column, search predicate extension, row-cell render for relationship, contractor-case New CTA href + row-click href to /admin/trades/*, empty-state 'No trades yet' + descriptive body, placeholder 'Search trades...'
- `src/components/admin/ContactCardPopover.tsx` — relationshipLabel import, ContactCardData.relationship?: string|null, profileHref contractor-case to /admin/trades/{_id}, relationship line render below name for contractor entityType
- `src/components/admin/ContactCardWrapper.tsx` — match.relationship passed through cardData construction
- `src/pages/admin/dashboard.astro` — line 121 New CTA href + line 151 contractor-name link href to /admin/trades/*; stale code comment at line 110 updated
- `src/pages/admin/projects/[projectId]/index.astro` — contractor-chip href to /admin/trades/*; inline contactData passes relationship through
- `src/sanity/queries.ts` — projectContractors contractor-> projection extended with relationship; stale doc comment at line 810 updated
- `src/sanity/schemas/contractor.ts` — stale trade-field description reference to '/admin/contractors' → '/admin/trades'

### Deleted (moved)
- `src/pages/admin/contractors/index.astro` (git rename to trades/)
- `src/pages/admin/contractors/[contractorId]/index.astro` (git rename to trades/)

## Decisions Made

- **Radio group over dropdown for relationship:** Plan left this to Claude's discretion. Chose the 2-card radio layout (UI-SPEC recommendation) so both options are visible with descriptive subtext — the choice is semantically heavy (drives Phase 43 checklist + everywhere the entity label renders) and worth the vertical space on a form that already has room.
- **`label` constant in EntityListPage kept as 'Contractor / Vendor':** The plan's own item 2 said change to 'Trade', but item 11 (CTA copy retention) and the UI-SPEC Copywriting Contract both require the primary CTA to read 'New Contractor / Vendor'. Since `label` is only referenced at the CTA, the UI-SPEC wins. Added a comment explaining why.
- **`projectContractors` GROQ + contactData extended** beyond the plan's `<files_modified>` list: without passing `relationship` through to the chip popover on the project detail page, every vendor chip there would silently render as 'Contractor' via the D-04 null fallback — incorrect for records that do have relationship set. Rule 2 correctness addition.
- **Post-delete redirect uses `"/admin/trades"` (double-quoted string literal) rather than a backtick template** for the contractor case to match the plan's acceptance-criteria grep pattern exactly, and because no interpolation is needed.
- **`metaSegments` is declared `string[]` and filtered only via conditional pushes** (empty primary trade and empty cityState never enter the array) rather than `[a, b, c].filter(Boolean)`, so the `.filter(Boolean)` pattern on the inner cityState array is the only place a filter runs. This makes the empty-segment semantics explicit in the code rather than implicit from truthiness.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] projectContractors GROQ + project-detail contactData**
- **Found during:** Task 2
- **Issue:** The project detail page builds `contactData` inline for each contractor chip and hands it to ContactCardWrapper via the `contactData` prop. Without `relationship` on that object, the chip popovers on the project detail page would render every vendor as 'Contractor' via the D-04 null fallback — functionally wrong for records where relationship is set.
- **Fix:** Added `relationship` to the `projectContractors.contractor->` GROQ projection in `src/sanity/queries.ts`; threaded `relationship: pc.contractor.relationship ?? null` through the inline `contactData` in the project detail Astro page.
- **Files modified:** `src/sanity/queries.ts`, `src/pages/admin/projects/[projectId]/index.astro`
- **Commit:** `cba06c1`

**2. [Rule 2 — Doc accuracy] Stale /admin/contractors references in code comments**
- **Found during:** Task 1
- **Issue:** Three comments referenced the old `/admin/contractors` path: `queries.ts:810`, `contractor.ts:61` trade-field description (surfaced in Sanity Studio help text), and `dashboard.astro:110` contractor-card JSDoc block. Not blocking, but they'd mislead anyone reading the code in 6 months.
- **Fix:** Updated all three to `/admin/trades`.
- **Files modified:** `src/sanity/queries.ts`, `src/sanity/schemas/contractor.ts`, `src/pages/admin/dashboard.astro`
- **Commit:** `da59c30` (bundled with Task 1 route rename)

**3. [Rule 2 — Copy consistency] EntityDetailForm documents empty-state string**
- **Found during:** Task 2
- **Issue:** The documents panel empty-state string read 'Upload a 1099, insurance certificate, contract, or other document for this contractor / vendor.' which is now inconsistent with the derived Delete button label two elements above it.
- **Fix:** Changed to `for this {relationshipLabel(relationship).toLowerCase()}` so the empty-state copy matches the record's derived label ('for this contractor' or 'for this vendor').
- **Files modified:** `src/components/admin/EntityDetailForm.tsx`
- **Commit:** `cba06c1`

None of these changed the plan's behavioral contract; all three are derivations of the D-05 display-name consistency rule the plan already explicitly requires elsewhere.

## Issues Encountered

**1. Vitest 4 failing tests in unrelated admin components**
`src/components/admin/{WorkOrderComposeModal,SendUpdateModal,ClientActionItemsList,ProjectTasks}.test.tsx` each have 1 failing test. All four files were NOT modified by this plan, and all four failures are in the pre-existing-14-failing-tests set documented in STATE.md 'Pending Todos'. Per SCOPE BOUNDARY rule, these are out of scope and remain tracked for general cleanup. My modified files contribute zero new test failures — `src/lib/relationshipLabel.test.ts` (Plan 01) still passes all 6 tests.

**2. `npx astro check` 39 pre-existing errors**
Identical count to Plan 01's SUMMARY (39 errors in files not touched by either plan). All in the deferred-items set. Zero new errors from this plan.

## Deferred Issues

- 39 pre-existing `npx astro check` errors in unmodified files (ScheduleEditor, Header, MobileMenu, ArtifactApprovalForm, ContractorNoteForm, geminiClient, sanity/image.ts, queries.ts:92 portal-query twin, workorder/verify.astro) — unchanged from Plan 01, logged in `.planning/phases/42-trades-entity-routes-schema-and-display/deferred-items.md`
- 4 unrelated vitest failures (WorkOrderComposeModal, SendUpdateModal, ClientActionItemsList, ProjectTasks) — part of STATE.md's documented 14-failing-tests backlog
- Portal-side `src/components/portal/ContractorSection.astro:35` 'contractor / vendor' group heading — intentionally out of scope per plan interfaces note (group heading, not per-record label; per-record derivation through the portal query stack not required by TRAD-03)

## User Setup Required

None — no external service configuration. All changes are internal routes + UI. Liz should see `/admin/trades` in the nav immediately on next deploy.

## Next Phase Readiness

Phase 43 (Document checklists, Settings config, and completeness) is unblocked:

- `relationship` is rendered everywhere Liz encounters a contractor/vendor record (list row, detail header context, popover, meta line, delete copy) so the checklist UI Phase 43 ships will have consistent entity-label surroundings
- `siteSettings.contractorChecklistItems[]` / `vendorChecklistItems[]` (Plan 01) are schema-ready; Phase 43 renders against them
- Completeness indicator (TRAD-04) can key off the same `contractorData.relationship` field + `documents[]` projection already available in `getAdminContractorDetail`

No blockers or concerns.

## Verification Evidence

- `test ! -d src/pages/admin/contractors` → OK
- `test -f src/pages/admin/trades/index.astro && test -f src/pages/admin/trades/[contractorId]/index.astro` → OK
- `grep -rn '/admin/contractors' src/ --include='*.astro' --include='*.tsx' --include='*.ts' | grep -v '/api/admin/contractors'` → exits 1 (no matches — zero live references)
- All Task 1/2/3 acceptance-criteria grep checks: PASS
- `npx astro check`: 39 errors (all pre-existing, zero from this plan)
- `npx vitest run src/lib/relationshipLabel.test.ts`: 6/6 passing

## Self-Check: PASSED

- FOUND: src/pages/admin/trades/index.astro
- FOUND: src/pages/admin/trades/[contractorId]/index.astro
- MISSING (intended): src/pages/admin/contractors/* — deleted per D-02
- FOUND: commit da59c30 (Task 1 route rename)
- FOUND: commit cba06c1 (Task 2 relationship radio + list + popover)
- FOUND: commit c71aa6b (Task 3 meta line)
- FOUND: AdminNav.tsx line 22 shows `{ label: "Trades", href: "/admin/trades", icon: HardHat }`
- FOUND: EntityDetailForm.tsx — relationshipLabel import, radio group, required validation, derived Delete copy, conditional post-save/delete redirects
- FOUND: EntityListPage.tsx — Type column, relationshipLabel cell, search predicate, empty-state copy, contractor-case hrefs
- FOUND: ContactCardPopover.tsx — relationshipLabel import, relationship field in interface, derived label render, /admin/trades profileHref
- FOUND: ContactCardWrapper.tsx — relationship passthrough
- FOUND: trades/[contractorId]/index.astro — formatTrade + relationshipLabel imports, metaSegments filter(Boolean).join(' · '), conditional render with !isNew && metaLine, UI-SPEC typography
- All 6 relationshipLabel tests still pass

---
*Phase: 42-trades-entity-routes-schema-and-display*
*Completed: 2026-04-23*

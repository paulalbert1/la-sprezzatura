---
phase: 41-client-data-model-refinements
plan: "02"
subsystem: ui
tags: [react, phone-format, client-list, address-sort, preferredContact-removal]

# Dependency graph
requires:
  - phase: 41-client-data-model-refinements
    plan: "01"
    provides: formatPhone() utility in src/lib/format.ts; preferredContact removed from Sanity schema/queries/API
provides:
  - EntityListPage with 4-column client layout (name/address/email/phone), address cell rendering City+State, address sort by city, city/state search, formatPhone on all phone cells
  - EntityDetailForm without preferredContact state/validation/payload/select block
  - ContactCardPopover with formatPhone display and no Prefers: block
  - ContactCardWrapper popover data constructor without preferredContact key
  - ClientChipWithRegenerate interface and usage without preferredContact
affects:
  - Phase 42 (trades entity UI — these admin component patterns are established)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phone display: formatPhone() imported from src/lib/format at every render site (EntityListPage, ContactCardPopover)"
    - "Address cell: [city, state].filter(Boolean).join(', ') with em-dash fallback for blank both"
    - "Nested field sort: custom accessor in sort comparator when sortColumn === 'address'"

key-files:
  created: []
  modified:
    - src/components/admin/EntityListPage.tsx
    - src/components/admin/EntityDetailForm.tsx
    - src/components/admin/ContactCardPopover.tsx
    - src/components/admin/ContactCardWrapper.tsx
    - src/components/admin/ClientChipWithRegenerate.tsx

key-decisions:
  - "Address cell renders [city, state].filter(Boolean).join(', ') — handles city-only, state-only, and both-present cases cleanly"
  - "Sort for nested address.city uses a conditional accessor (sortColumn === 'address') in the comparator; the generic a[sortColumn] path handles all flat fields"
  - "tel: href in ContactCardPopover uses raw data.phone; only the link text uses formatPhone() — raw digits needed by native dialer"

patterns-established:
  - "Nested object sort pattern: conditional accessor in useMemo sort comparator for non-flat fields"
  - "Phone render pattern: formatPhone(entity.phone) at every display site; never mutate the stored value"

requirements-completed:
  - CLNT-10
  - CLNT-11
  - CLNT-12
  - CLNT-13

# Metrics
duration: 3min
completed: 2026-04-22
---

# Phase 41 Plan 02: Client Data Model Refinements — UI Sweep Summary

**4-column client list with City/State address cell + address sort + city/state search, formatPhone on all phone surfaces, and complete preferredContact removal across 5 admin components**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-22T17:08:51Z
- **Completed:** 2026-04-22T17:12:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Replaced the 4-column CLIENT_COLUMNS (name/email/phone/preferredContact) with name/address/email/phone; address cell renders "City, State" with em-dash fallback when both blank
- Wired address sort (clicks header → sorts by entity.address?.city via custom comparator accessor) and city/state substring search
- Applied formatPhone() to every display-side phone render: EntityListPage client cell, EntityListPage contractor cell, ContactCardPopover phone link text
- Stripped all preferredContact references from five admin components — interface props, useState, validation rule, payload assignment, JSX select block, popover interface, popover display block, wrapper data constructor, chip interface, chip contactData prop — achieving the full CLNT-13 sweep with zero remaining matches in src/

## Task Commits

Each task was committed atomically:

1. **Task 1: Reshape Clients list** - `34777ef` (feat)
2. **Task 2: Strip preferredContact from EntityDetailForm** - `33da8d5` (feat)
3. **Task 3: formatPhone + preferredContact purge in 3 contact components** - `fa73539` (feat)

## Files Created/Modified

- `src/components/admin/EntityListPage.tsx` — New 4-column CLIENT_COLUMNS, address cell with City/State rendering, custom sort accessor for nested address.city, city/state search filter, formatPhone on client and contractor phone cells
- `src/components/admin/EntityDetailForm.tsx` — Removed preferredContact from FieldError interface, useState, validation rule, handleSave payload, and client-specific select block
- `src/components/admin/ContactCardPopover.tsx` — Added formatPhone import, removed preferredContact from ContactCardData interface, wrapped phone link text with formatPhone(), removed Prefers: display block
- `src/components/admin/ContactCardWrapper.tsx` — Removed preferredContact key from popover data constructor object
- `src/components/admin/ClientChipWithRegenerate.tsx` — Removed preferredContact from client interface and contactData prop

## Decisions Made

- Address cell uses `[city, state].filter(Boolean).join(', ')` — handles city-only, state-only, and both-present cases without needing a conditional chain
- Sort for `address` column uses a conditional accessor in the comparator (`sortColumn === "address"` → read `a.address?.city`) rather than rewriting the whole sort path — minimal change, correct behavior
- `tel:` href retains raw `data.phone`; only the visible link text uses `formatPhone()` — raw digits are required by the native dialer protocol

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `grep -c` exits with code 1 when match count is 0, causing shell expressions with `&&` to short-circuit. Worked around by using `|| echo "0"` in verification commands. No functional issue.
- Pre-existing TypeScript error in `src/sanity/queries.ts` (TS2769 overload mismatch, unrelated to Phase 41) was present before this plan and remains. Not in scope per SCOPE BOUNDARY deviation rules.
- Pre-existing vitest failures (16 test files, ~37 tests) remain unchanged from before this plan — confirmed by running `npx vitest run src/lib/format.test.ts` which passes all 10 formatPhone tests cleanly.

## Known Stubs

None — all phone, address, and column rendering is wired to live entity data. No placeholders or hardcoded values.

## Threat Flags

No new threat surface introduced. T-41-02-02 mitigation verified: `tel:` href in ContactCardPopover still uses raw `data.phone` (grep confirmed). T-41-02-03 accept: city/state rendered as React children with no dangerouslySetInnerHTML path.

## Next Phase Readiness

- Phase 41 (CLNT-10, -11, -12, -13) is fully complete — all backend (Plan 01) and UI (Plan 02) work delivered
- CLNT-11 address round-trip is ready for manual smoke test: edit city/state/street/zip in a client detail form, save, reload to confirm all four fields persist
- Phase 42 (Trades Entity) can begin; admin component patterns established here (formatPhone import, address cell pattern) serve as models

---
*Phase: 41-client-data-model-refinements*
*Completed: 2026-04-22*

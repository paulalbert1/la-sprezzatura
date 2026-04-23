# Phase 42: Trades Entity — Routes, Schema, and Display - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 42 delivers the Trades entity: `/admin/trades` routes replacing `/admin/contractors`, a `contractor | vendor` relationship field that drives per-record display names and the detail page meta line, and the 1099 document schema foundation for Phase 43's checklist UI.

Requirements: TRAD-01, TRAD-02, TRAD-03, TRAD-05, TRAD-07

</domain>

<decisions>
## Implementation Decisions

### Sanity _type (TRAD-01, TRAD-02)

- **D-01:** Sanity document type stays `"contractor"`. The rename would touch every GROQ query, API route, and middleware reference for zero functional benefit — `_type` is plumbing, not UI. The `relationship` field carries all the semantic meaning. Add a comment at the top of `src/sanity/schemas/contractor.ts` noting that the UI-facing entity name is "Trades".

### Route Rename (TRAD-01)

- **D-02:** Hard rename only — no redirects. All source files move from `src/pages/admin/contractors/` to `src/pages/admin/trades/`. Every internal reference (`AdminNav`, breadcrumbs, `Astro.redirect`, API routes, `href` strings) is updated to `/admin/trades`. The old `/admin/contractors` path simply 404s — this is an internal admin tool with no known external links.

### Relationship Field (TRAD-02)

- **D-03:** A `relationship` field is added to the contractor schema with two values: `"contractor"` and `"vendor"`. The field is **required** on new records — users must select one before saving.
- **D-04:** Existing records have no `relationship` value (null). The null fallback is **"Contractor"** everywhere: list label, detail header, popovers, meta line. This treats null as contractor until the field is explicitly set. No data migration needed.

### Display Name (TRAD-03)

- **D-05:** The entity label reads "Contractor" or "Vendor" (never "Contractor / Vendor") wherever the record's relationship type is known. Derived from: `relationship === "vendor" ? "Vendor" : "Contractor"` (null collapses to "Contractor" per D-04).
- **D-06:** This label is applied consistently across: Trades list view, detail page heading context, ContactCardPopover, AdminNav section label, breadcrumbs, and work order panels.

### Meta Line (TRAD-05)

- **D-07:** The Trades detail page shows a compact meta line directly below the name: `primary trade · relationship type · city, state`. Each segment is rendered only when the value exists — missing segments are omitted entirely with no placeholder. The `·` separators adjust dynamically so no empty slots appear (e.g., if no trade: just `Contractor · New York, NY`; if no city/state: just `Plumber · Contractor`).
- **D-08:** "Primary trade" = `contractor.trades[0]` formatted via `formatTrade()`. "Relationship type" = the label derived from D-05. "City, state" = same `[city, state].filter(Boolean).join(', ')` pattern established in Phase 41.

### 1099 Schema Unification (TRAD-07)

- **D-09:** Phase 42 is schema-only for TRAD-07. The `docType: "1099"` field already exists on `contractorDocument` from Phase 40. Phase 42 adds a `checklistItems` concept to the contractor schema (or siteSettings) defining which doc types are required per relationship type — this is the data foundation Phase 43's checklist UI will render against. No standalone 1099 UI is added or removed in Phase 42.

### Claude's Discretion

- Exact field name and shape of the checklistItems schema addition (array on siteSettings vs. hardcoded constants vs. embedded in schema) — follow Phase 40's `contractorChecklistItems[]` / `vendorChecklistItems[]` pattern from milestone decisions
- Whether the `relationship` select renders as a radio group or dropdown in EntityDetailForm
- Exact Sanity schema validation message for required `relationship` field

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Trades/Contractor Code
- `src/sanity/schemas/contractor.ts` — Current contractor schema; add `relationship` field and `_type` comment here
- `src/pages/admin/contractors/index.astro` — List page to rename/move to `/admin/trades/`
- `src/pages/admin/contractors/[contractorId]/index.astro` — Detail page to rename/move
- `src/components/admin/AdminNav.tsx` — Nav label and href to update
- `src/components/admin/EntityDetailForm.tsx` — Add relationship select; entityType="contractor" usage throughout
- `src/components/admin/EntityListPage.tsx` — `CONTRACTOR_COLUMNS` and entity label rendering
- `src/components/admin/ContactCardPopover.tsx` — Contractor label in popover context
- `src/sanity/queries.ts` — `getAdminContractors`, `getAdminContractorDetail` — add `relationship` to projections
- `src/pages/api/admin/contractors.ts` — API handler; routes stay at `/api/admin/contractors` (D-01)

### Phase 40 Decisions (Prior Context)
- `.planning/phases/40-contractor-vendor-rename-trades-crud-1099-support/40-CONTEXT.md` — D-12 through D-16; establishes patterns this phase builds on

### Milestone Decisions
- `.planning/phases/41-client-data-model-refinements/41-CONTEXT.md` — Phase 41 address/phone patterns reused in meta line

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `formatTrade()` / `formatTrades()` in `src/lib/trades.ts` — already handles trade display; primary trade for meta line is `contractor.trades[0]` via this utility
- Address pattern from Phase 41 — `[city, state].filter(Boolean).join(', ')` with em-dash fallback; reuse directly in meta line
- `EntityDetailForm` — already handles both client and contractor entityType; relationship select can follow the same controlled-component pattern as the trades catalog dropdown

### Established Patterns
- `relationship === "vendor" ? "Vendor" : "Contractor"` derived from `entityType` checks already in EntityListPage — same conditional pattern
- Nav items as `{ label, href, icon }` objects in AdminNav — update label and href only
- Breadcrumb constants at top of each Astro page — update label and href strings

### Integration Points
- `src/pages/admin/contractors/` → `src/pages/admin/trades/` (file rename)
- `AdminNav.tsx` line 22 — label "Contractor / Vendor" and href "/admin/contractors" → "Trades" and "/admin/trades"
- `getAdminContractors` and `getAdminContractorDetail` in `queries.ts` — add `relationship` to GROQ projections
- EntityDetailForm `entityType="contractor"` prop stays unchanged (D-01)

</code_context>

<specifics>
## Specific Ideas

- Comment at top of `contractor.ts`: `// UI-facing entity name: "Trades". _type stays "contractor" — see Phase 42 decision D-01.`
- Meta line separator: `·` (interpunct U+00B7), consistent with common admin UI patterns
- Null relationship label: `relationship === "vendor" ? "Vendor" : "Contractor"` — the ternary treats null as contractor cleanly without an explicit null check branch

</specifics>

<deferred>
## Deferred Ideas

- Redirect from `/admin/contractors` to `/admin/trades` — not needed (internal tool, no external links). Can add later if needed.
- Completeness indicator (amber dot) — Phase 43 (TRAD-04)
- Document checklist UI — Phase 43 (TRAD-06)
- Checklist item type configuration in Settings — Phase 43 (TRAD-08)

</deferred>

---

*Phase: 42-trades-entity-routes-schema-and-display*
*Context gathered: 2026-04-22*

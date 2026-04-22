---
phase: 40
plan: "03"
subsystem: ui
tags: [react, astro, trades-catalog, settings, entity-form, doctype, 1099, address]
dependency_graph:
  requires: [plan-40-01]
  provides: [trades-catalog-ui, settings-trades-section, contractor-address-ui, doctype-upload-ui, catalog-driven-trade-dropdown]
  affects: []
tech_stack:
  added: []
  patterns: [controlled-component, collapsible-section, formatTrade-display, catalog-driven-dropdown, doc-type-pill]
key_files:
  created:
    - src/components/admin/TradesCatalogSection.tsx
  modified:
    - src/components/admin/settings/SettingsPage.tsx
    - src/pages/admin/settings.astro
    - src/components/admin/EntityDetailForm.tsx
    - src/pages/admin/contractors/[contractorId]/index.astro
    - src/components/admin/settings/SettingsPage.test.tsx
decisions:
  - "TradesCatalogSection is a fully controlled component — onChange called on every mutation, no internal fetch"
  - "handleSave in SettingsPage sends two sequential POSTs (action=update then action=updateTrades) — updateTrades is separate to avoid retrofitting the existing update action"
  - "Address block lifted out of client-only conditional and placed before both conditionals — renders for both entity types using shared state vars"
  - "Trade pill labels use formatTrade() from lib/trades.ts instead of local TRADE_LABELS — catalog values fall through to normalizer for unknown slugs"
  - "docType select is always visible in the documents section (not gated on a file being selected) — matches the UI-SPEC flow"
metrics:
  duration: "5 minutes"
  completed: "2026-04-22"
  tasks_completed: 2
  files_modified: 5
  files_created: 1
---

# Phase 40 Plan 03: Trades Catalog UI, Settings Wire, EntityDetailForm Extensions Summary

**One-liner:** TradesCatalogSection with add/rename/delete CRUD wired into SettingsPage, EntityDetailForm extended with contractor address block, docType dropdown with colored type pills, and catalog-driven trade dropdown.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create TradesCatalogSection and wire into SettingsPage | a5354f3 | TradesCatalogSection.tsx (new), SettingsPage.tsx, settings.astro |
| 2 | Extend EntityDetailForm — address, docType, tradeCatalog | b2cfaff | EntityDetailForm.tsx, [contractorId]/index.astro, SettingsPage.test.tsx |

## What Was Built

### TradesCatalogSection.tsx (new)

Fully controlled component accepting `trades: string[]` and `onChange: (next: string[]) => void`:
- List of trades with inline rename (pencil → text input with Enter/Escape) and delete (trash → confirmation modal)
- Add-trade input at bottom with duplicate detection (case-insensitive), inline error message, Enter key support
- Confirmation modal copy matches UI-SPEC verbatim
- No internal fetch — parent SettingsPage owns save lifecycle

### SettingsPage.tsx

- Added `trades: string[]` to `SiteSettingsPayload` interface
- Added trades to `cloneInitial`, `handleCancel` reset, and `useState`
- Added `handleTradesChange` callback that calls `markDirty()`
- `handleSave` now sends a second sequential POST `action=updateTrades` after the main `action=update` succeeds
- Mounted `<CollapsibleSection title="Trades"><TradesCatalogSection /></CollapsibleSection>` after Rendering Configuration

### settings.astro

- Added `trades?: string[]` to `SiteSettingsRow` type
- Added `trades: row.trades ?? []` to `initialSettings` object

### EntityDetailForm.tsx

- Added `tradeCatalog?: string[]` prop; `availableTrades` uses catalog with fallback to `TRADE_OPTIONS`
- Trade pill labels and dropdown options now use `formatTrade()` from `lib/trades.ts`
- Added `DOC_TYPE_LABELS` and `DOC_TYPE_PILL_CLASSES` constants
- Added `docType` useState; docType select dropdown (4 options) appears above upload button
- `handleUploadDoc` appends `docType` to FormData and resets state after successful upload
- Document rows render colored docType pill before fileType badge when `doc.docType` is set
- Address block moved out of `entityType === "client"` conditional — now renders for both entity types
- Contractor `handleSave` includes `address` in payload

### contractor [contractorId]/index.astro

- Fetches `SITE_SETTINGS_QUERY` to get `trades` from siteSettings
- Passes `tradeCatalog={tradeCatalog}` to `<EntityDetailForm>`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Fixed SettingsPage.test.tsx missing required `trades` field**
- **Found during:** TypeScript compilation check after Task 1
- **Issue:** Adding `trades: string[]` (non-optional) to `SiteSettingsPayload` caused `SettingsPage.test.tsx` fixture to fail type check — `Property 'trades' is missing in type`
- **Fix:** Added `trades: []` to the `defaultSettings()` fixture function
- **Files modified:** `src/components/admin/settings/SettingsPage.test.tsx`
- **Commit:** b2cfaff

## Known Stubs

None — all three features (trades catalog, address, docType) are wired end-to-end. TradesCatalogSection calls `onChange` which triggers `handleTradesChange` in SettingsPage which POSTs to the `updateTrades` API endpoint built in Plan 01. EntityDetailForm docType flows through FormData to the contractor API handler. Address flows through `payload.address` to the contractor update API.

## Threat Surface Scan

No new network endpoints introduced. All existing threat mitigations from the plan's `<threat_model>` are satisfied:
- T-40-05 (XSS — trade name rendering): React JSX escaping in effect; no `dangerouslySetInnerHTML` used
- T-40-06 (Tampering — updateTrades sync): non-ok tradesResponse throws, error banner shown to admin
- T-40-07 (Injection — docType select): fixed `<option value="...">` entries enforce enum values

## Self-Check

```
FOUND: src/components/admin/TradesCatalogSection.tsx
FOUND: src/components/admin/settings/SettingsPage.tsx (TradesCatalogSection mounted)
FOUND: src/pages/admin/settings.astro (trades in SiteSettingsRow and initialSettings)
FOUND: src/components/admin/EntityDetailForm.tsx (tradeCatalog, docType, address, DOC_TYPE_PILL_CLASSES)
FOUND: src/pages/admin/contractors/[contractorId]/index.astro (tradeCatalog prop)
commit a5354f3 — FOUND
commit b2cfaff — FOUND
```

## Self-Check: PASSED

---
phase: 32-procurement-editor
plan: 01
subsystem: procurement
tags: [schema, groq, ship24, tracking, utilities]
dependency_graph:
  requires: []
  provides: [procurementItem-schema-v2, ship24-client, procurement-overdue-detection, net-price-computation, cron-query]
  affects: [admin-project-detail, dashboard-deliveries]
tech_stack:
  added: [ship24-api-client]
  patterns: [status-mapping, carrier-detection-fallback, tdd-red-green]
key_files:
  created:
    - src/lib/ship24.ts
    - src/lib/ship24.test.ts
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/queries.ts
    - src/lib/dashboardUtils.ts
    - src/lib/dashboardUtils.test.ts
decisions:
  - "Ship24 status mapping covers all 8 milestones; exception and pending return null (no auto-change)"
  - "Carrier name formatting uses display name map (UPS, FedEx, USPS, DHL) with uppercase fallback"
  - "getNetPrice clamps negative values to 0 per UI-SPEC contract"
metrics:
  duration: ~5 min
  completed: 2026-04-09T22:27:00Z
  tasks_completed: 3
  tests_added: 39
  files_changed: 6
---

# Phase 32 Plan 01: Data Foundation for Procurement Editor Summary

Extended Sanity schema with 7 new procurementItem fields, built Ship24 API client with full status mapping, and added procurement overdue/net-price utilities with TDD test coverage.

## Task Results

| Task | Name | Commit(s) | Files | Tests |
|------|------|-----------|-------|-------|
| 1 | Extend Sanity schema and GROQ queries | `10c0868` | project.ts, queries.ts | - |
| 2 | Ship24 API client with status mapping | `e926570` (RED), `a317650` (GREEN) | ship24.ts, ship24.test.ts | 24 |
| 3 | isProcurementOverdue and getNetPrice | `376054d` (RED), `34af4a6` (GREEN) | dashboardUtils.ts, dashboardUtils.test.ts | 15 |

## What Was Built

### Schema Extensions (Task 1)

Added 7 new fields to `procurementItem` in `src/sanity/schemas/project.ts`:
- `vendor` (string) -- supplier name
- `notes` (text) -- internal notes, never shown to clients
- `carrierETA` (date) -- estimated delivery from Ship24
- `carrierName` (string) -- carrier from Ship24 (covers 1500+ carriers)
- `trackingUrl` (url) -- direct tracking link
- `lastSyncAt` (datetime) -- timestamp of last Ship24 sync
- `syncSource` (string, options: cron/manual) -- how status was last set

### GROQ Query Updates (Task 1)

- `ADMIN_PROJECT_DETAIL_QUERY`: Added conditional procurement items projection with all 15 fields (gated on `engagementType == "full-interior-design"`)
- `ADMIN_DASHBOARD_DELIVERIES_QUERY`: Added `carrierETA`, `carrierName`, `lastSyncAt` to deliveries projection
- `ADMIN_PROCUREMENT_CRON_QUERY` (new): Selects active projects with trackable items (status in [ordered, warehouse, in-transit] with defined tracking number)
- `getAdminProcurementCronData()`: Exported async function returning `CronProject[]`

### Ship24 API Client (Task 2)

`src/lib/ship24.ts` -- server-side only module:
- `mapShip24Status()`: Maps all 8 Ship24 statusMilestone values to project statuses
- `createAndTrack()`: POST to register tracker and get initial results
- `getTrackingResults()`: GET cached results, falls back to createAndTrack if empty
- `extractTrackingData()`: Extracts carrierETA, carrierName, trackingUrl, lastEvent from Ship24 response
- `isShip24Configured()`: Checks SHIP24_API_KEY env var presence

### Utility Functions (Task 3)

`src/lib/dashboardUtils.ts` additions:
- `isProcurementOverdue()`: Returns true if expectedDeliveryDate is past AND status is not delivered/installed
- `getNetPrice()`: Computes retailPrice - clientCost in cents, returns null if either missing, clamps negative to 0

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `npx vitest run src/lib/ship24.test.ts src/lib/dashboardUtils.test.ts` -- 56 tests pass (24 ship24 + 32 dashboardUtils)
- Schema grep confirms 13 occurrences of new field names across schema and queries
- `getAdminProcurementCronData` export verified in queries.ts

## Threat Mitigations Applied

- **T-32-04 (Information Disclosure)**: SHIP24_API_KEY read from `process.env` only; module is server-side only
- **T-32-05 (Tampering)**: Null-safe access on all nested Ship24 fields; `mapShip24Status` returns null for unknown values; `extractTrackingData` uses optional chaining throughout

## Self-Check: PASSED

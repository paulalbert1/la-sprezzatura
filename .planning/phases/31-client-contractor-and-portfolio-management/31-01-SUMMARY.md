---
phase: 31-client-contractor-and-portfolio-management
plan: 01
subsystem: admin-data-layer
tags: [sanity-schemas, api-routes, groq-queries, crud, portfolio]
dependency_graph:
  requires: [session, tenantClient, generateToken]
  provides: [client-crud-api, contractor-crud-api, portfolio-api, search-api, admin-groq-queries]
  affects: [admin-nav, project-schema, client-schema, contractor-schema]
tech_stack:
  added: []
  patterns: [tenant-scoped-sanity-client, action-dispatch-api, reference-check-before-delete, transaction-batch-reorder]
key_files:
  created:
    - src/pages/api/admin/clients.ts
    - src/pages/api/admin/contractors.ts
    - src/pages/api/admin/portfolio.ts
    - src/pages/api/admin/search.ts
  modified:
    - src/sanity/schemas/client.ts
    - src/sanity/schemas/contractor.ts
    - src/sanity/schemas/project.ts
    - src/sanity/queries.ts
    - src/components/admin/AdminNav.tsx
decisions:
  - "Renamed GROQ param from $query to $searchTerm in searchEntities to avoid Sanity client typed query collision"
  - "Used Sanity assets.upload for contractor document storage instead of Vercel Blob, keeping within existing Sanity ecosystem"
metrics:
  duration: 11min
  completed: "2026-04-09T19:37:18Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 5
---

# Phase 31 Plan 01: Schema, Queries, API Routes, and Navigation Summary

Extended Sanity schemas with client notes, contractor documents, and project portfolio fields; created 4 API routes and 7 GROQ query functions for admin CRUD operations; added Portfolio nav link to AdminNav sidebar.

## What Was Built

### Task 1: Schema Extensions (39f4574)
- **client.ts**: Added `notes` text field (max 2000 chars) for internal observations about clients
- **contractor.ts**: Added `documents[]` array field for file uploads (1099s, insurance certs) with fileName, fileType, url, uploadedAt per item
- **project.ts**: Added `portfolio` group with ImageIcon and 6 fields: `showInPortfolio`, `portfolioTitle`, `portfolioDescription`, `portfolioImage`, `portfolioOrder`, `portfolioRoomTags`

### Task 2: GROQ Queries and API Routes (73533b8)
- **queries.ts**: 7 new query functions following the tenant-scoped `client: SanityClient` pattern:
  - `getAdminClients` / `getAdminClientDetail` -- list and detail with linked projects
  - `getAdminContractors` / `getAdminContractorDetail` -- list and detail with documents and linked projects
  - `getAdminPortfolioProjects` / `getAdminPortfolioDetail` -- completed projects with portfolio fields
  - `searchEntities` -- typeahead search across clients and contractors
- **clients.ts**: create/update/delete actions with email regex validation, name min-length check, notes max-length check, and reference count check before delete (409 on linked projects)
- **contractors.ts**: create/update/delete/upload-doc/delete-doc with file size (10MB) and MIME type (PDF/JPEG/PNG) validation, setIfMissing pattern for documents array
- **portfolio.ts**: toggle/update/reorder/remove/upload-image with transaction-based batch reorder and D-20 compliance (remove preserves portfolio fields)
- **search.ts**: GET endpoint for typeahead with min 1-char query threshold

### Task 3: AdminNav Update (2791837)
- Added `Image` icon import from lucide-react
- Added Portfolio nav item between Contractors and Rendering Tool

## Threat Model Compliance

All 7 threats mitigated as specified:
- T-31-01: Every route checks session + role=admin + tenantId
- T-31-02: All routes use getTenantClient(session.tenantId) for tenant isolation
- T-31-03: Server-side validation on name (min 2), email (regex), trades (min 1), notes (max 2000)
- T-31-04: File uploads enforce 10MB limit and PDF/JPEG/PNG MIME types
- T-31-05: Delete operations check GROQ references() count, return 409 if linked
- T-31-06: Reorder validates items array is non-empty with valid _id and portfolioOrder per item
- T-31-07: Search endpoint has identical session/role/tenant checks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed GROQ parameter in searchEntities**
- **Found during:** Task 2
- **Issue:** Using `$query` as a GROQ parameter name causes a TypeScript overload collision with Sanity client's typed query system
- **Fix:** Renamed parameter from `$query` to `$searchTerm` in both the GROQ string and the params object
- **Files modified:** src/sanity/queries.ts
- **Commit:** 73533b8

## Known Stubs

None -- all API routes are fully wired with real Sanity mutations, no placeholder data.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 39f4574 | feat(31-01): extend Sanity schemas with client notes, contractor documents, and project portfolio fields |
| 2 | 73533b8 | feat(31-01): add GROQ queries and API routes for client/contractor CRUD, portfolio, and search |
| 3 | 2791837 | feat(31-01): add Portfolio link to AdminNav sidebar |

## Self-Check: PASSED

All 5 created/modified files verified on disk. All 3 commit hashes verified in git log.

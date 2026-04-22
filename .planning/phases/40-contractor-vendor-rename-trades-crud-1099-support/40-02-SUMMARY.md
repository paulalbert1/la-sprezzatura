---
phase: 40
plan: "02"
subsystem: admin-ui
tags: [rename, display-strings, contractor, vendor, portal]
dependency_graph:
  requires: []
  provides: [VEND-01]
  affects:
    - src/components/admin/AdminNav.tsx
    - src/components/admin/EntityListPage.tsx
    - src/components/admin/EntityDetailForm.tsx
    - src/pages/admin/contractors/index.astro
    - src/pages/admin/contractors/[contractorId]/index.astro
    - src/pages/admin/dashboard.astro
    - src/pages/admin/projects/[projectId]/index.astro
    - src/components/portal/ContractorSection.astro
tech_stack:
  added: []
  patterns:
    - Display-string rename (no logic changes, no schema dependencies)
key_files:
  created: []
  modified:
    - src/components/admin/AdminNav.tsx
    - src/components/admin/EntityListPage.tsx
    - src/components/admin/EntityDetailForm.tsx
    - src/pages/admin/contractors/index.astro
    - src/pages/admin/contractors/[contractorId]/index.astro
    - src/pages/admin/dashboard.astro
    - src/pages/admin/projects/[projectId]/index.astro
    - src/components/portal/ContractorSection.astro
decisions: []
metrics:
  duration: "~5 minutes"
  completed: "2026-04-22T13:26:50Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 8
---

# Phase 40 Plan 02: Contractor / Vendor Rename Summary

**One-liner:** Pure display-string rename across 8 files — every user-visible "Contractor" / "Contractors" label updated to "Contractor / Vendor" in admin nav, list, detail, delete dialog, dashboard, project detail, and contractor portal.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rename AdminNav, EntityListPage, EntityDetailForm, page titles/breadcrumbs | 90573bf | AdminNav.tsx, EntityListPage.tsx, EntityDetailForm.tsx, contractors/index.astro, contractors/[contractorId]/index.astro |
| 2 | Update dashboard card, project detail section, portal heading | 1ad9f16 | dashboard.astro, projects/[projectId]/index.astro, ContractorSection.astro |

## Changes Made

### Task 1 — Admin nav, list, detail, delete dialog, page titles

- **AdminNav.tsx**: `"Contractors"` → `"Contractor / Vendor"` in navItems array
- **EntityListPage.tsx**: label const, empty-state heading (`"No contractors yet"` → `"No contractors / vendors yet"`), empty-state body updated
- **EntityDetailForm.tsx**: delete dialog title ternary updated for contractor branch
- **contractors/index.astro**: breadcrumb label + `<AdminLayout>` title and pageTitle props updated
- **contractors/[contractorId]/index.astro**: `pageTitle` const updated for both new and existing paths; breadcrumb "Contractor / Vendor" with href; AdminLayout title uses em-dash convention for existing records and simplified form for new

### Task 2 — Dashboard, project detail, portal

- **dashboard.astro**: card h2 (`Contractors` → `Contractor / Vendor`), CTA link (`Add new contractor` → `Add contractor / vendor`), empty-state paragraph (`No contractors yet.` → `No contractors / vendors yet.`)
- **projects/[projectId]/index.astro**: Contractors panel h2 updated; HTML comment left as-is (internal, not user-visible)
- **ContractorSection.astro**: portal section h2 updated

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all changes are string literals wired to rendered output.

## Threat Flags

None — T-40-04 accepted (pure display-string change, no data exposure).

## TypeScript Verification

`npx tsc --noEmit` reports pre-existing errors in unrelated files (ScheduleEditor.tsx, ArtifactApprovalForm.tsx, ContractorNoteForm.tsx, ganttTransforms.test.ts). Zero new errors introduced by this plan's changes.

## Self-Check: PASSED

- [x] AdminNav.tsx contains "Contractor / Vendor" — commit 90573bf
- [x] EntityListPage.tsx contains "Contractor / Vendor" + updated empty states — commit 90573bf
- [x] EntityDetailForm.tsx contains "Contractor / Vendor" in delete dialog — commit 90573bf
- [x] contractors/index.astro title and breadcrumb updated — commit 90573bf
- [x] contractors/[contractorId]/index.astro pageTitle, breadcrumb, and AdminLayout title updated — commit 90573bf
- [x] dashboard.astro h2, CTA, and empty state updated — commit 1ad9f16
- [x] projects/[projectId]/index.astro panel h2 updated — commit 1ad9f16
- [x] ContractorSection.astro portal h2 updated — commit 1ad9f16
- [x] No stale `label: "Contractors"` in AdminNav
- [x] No stale "Contractors - Studio" in contractors/index.astro title

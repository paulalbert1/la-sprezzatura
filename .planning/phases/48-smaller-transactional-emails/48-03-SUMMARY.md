---
phase: 48
plan: "03"
subsystem: email
tags: [email, api, rewire, react-email, EMAIL-04, EMAIL-05, IMPER-03]
dependency_graph:
  requires:
    - phase: 48-01
      provides: "MAGIC_LINK_ACCESS_TTL_SECONDS constant + getTenantBrand (D-15)"
    - phase: 48-02
      provides: "WorkOrderAccess, BuildingAccess, ArtifactReady react-email templates"
  provides:
    - "src/pages/api/send-workorder-access.ts — rewired to WorkOrderAccess template + MAGIC_LINK_ACCESS_TTL_SECONDS + getTenantBrand"
    - "src/pages/api/send-building-access.ts — rewired to BuildingAccess template + MAGIC_LINK_ACCESS_TTL_SECONDS + getTenantBrand"
    - "src/pages/api/notify-artifact.ts — rewired to ArtifactReady template; tenant resolved once before per-client loop (Pitfall 7)"
  affects:
    - "48-04 (drift guard): routes now use MAGIC_LINK_ACCESS_TTL_SECONDS — guard can assert constant governs both mint and render"
tech_stack:
  added: []
  patterns:
    - "Modern react-email call-site pattern: dynamic-import Resend, getTenantBrand at call site, createElement(Template, props), render() twice (html + plainText)"
    - "EMAIL-05 invariant: MAGIC_LINK_ACCESS_TTL_SECONDS imported at API route level only; template receives expiresInSeconds prop — drift structurally impossible"
    - "Pitfall 7 mitigation: getTenantBrand resolved once before the per-client loop in notify-artifact — N sends = 1 Sanity tenant fetch"
key_files:
  created: []
  modified:
    - src/pages/api/send-workorder-access.ts
    - src/pages/api/send-building-access.ts
    - src/pages/api/notify-artifact.ts
decisions:
  - "D-15 applied: getTenantBrand(sanityWriteClient) called explicitly at each route call site; no implicit fallback in templates"
  - "D-06 applied: MAGIC_LINK_ACCESS_TTL_SECONDS used at both redis.set ex: and template expiresInSeconds prop in send-workorder-access and send-building-access"
  - "D-08 respected: no MAGIC_LINK_ACCESS_TTL_SECONDS in notify-artifact (no TTL surface on notification route)"
  - "D-13 respected: all three subject lines preserved verbatim"
  - "D-03 applied: all three routes now emit both html and text bodies"
  - "Pitfall 7 mitigated: tenant resolved once before loop in notify-artifact"
  - "GROQ projection in notify-artifact extended with _id field (Option A from task spec) so project._id available for ArtifactReadyEmailInput"
metrics:
  duration: ~10min
  completed_date: "2026-04-30"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 48 Plan 03: API Route Rewire Summary

**One-liner:** Three legacy inline-HTML email handlers rewired to react-email templates with MAGIC_LINK_ACCESS_TTL_SECONDS + getTenantBrand + html+text dual render, making Plan 01 and Plan 02 work observable in production.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewire send-workorder-access.ts | af5076d | src/pages/api/send-workorder-access.ts |
| 2 | Rewire send-building-access.ts | 017f5f3 | src/pages/api/send-building-access.ts |
| 3 | Rewire notify-artifact.ts | be13eb1 | src/pages/api/notify-artifact.ts |

## What Changed

**send-workorder-access.ts:**
- Deleted 50-line inline `emailHtml` template literal block
- Added `render`, `createElement`, `WorkOrderAccess`, `getTenantBrand`, `MAGIC_LINK_ACCESS_TTL_SECONDS` imports
- Both `redis.set({ ex: 900 })` literals replaced with `{ ex: MAGIC_LINK_ACCESS_TTL_SECONDS }`
- `resend.emails.send` now receives `html` (rendered) + `text` (plain-text render)
- `projectNames` passed as `string[]` array (template handles join); removed redundant joined string variable

**send-building-access.ts:**
- Same pattern as Task 1 with `BuildingAccess` template
- Both `redis.set({ ex: 900 })` literals replaced
- `project.buildingManager` passed directly as template prop (already typed correctly from Sanity fetch)
- `project._id` already present in existing GROQ projection (`_id, title, buildingManager`)

**notify-artifact.ts:**
- Deleted per-client inline `html` template literal inside loop
- Added `render`, `createElement`, `ArtifactReady`, `getTenantBrand` imports (no TTL import per D-08)
- `getTenantBrand` resolved ONCE before the per-client loop (Pitfall 7)
- `_id` added to GROQ projection so `project._id` is available for the `project` prop
- `portalHref` computed once before loop (`${baseUrl}/portal/dashboard`)
- Per-client loop structure preserved byte-identically
- `notificationLog` patch block (lines corresponding to Phase 35 contract) preserved byte-identically

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "ex: 900" send-workorder-access.ts` | 0 (PASS) |
| `grep -c "ex: 900" send-building-access.ts` | 0 (PASS) |
| `grep -c "MAGIC_LINK_ACCESS_TTL_SECONDS" send-workorder-access.ts` | 4 (import + 2 redis.set + prop) |
| `grep -c "MAGIC_LINK_ACCESS_TTL_SECONDS" send-building-access.ts` | 4 (import + 2 redis.set + prop) |
| `grep -c "MAGIC_LINK_ACCESS_TTL_SECONDS" notify-artifact.ts` | 0 (D-08 respected) |
| `grep -c "createElement(WorkOrderAccess"` | 1 |
| `grep -c "createElement(BuildingAccess"` | 1 |
| `grep -c "createElement(ArtifactReady"` | 1 |
| `grep -c "getTenantBrand(sanityWriteClient)" notify-artifact.ts` | 1 (outside loop) |
| `grep -c "for (const clientEntry" notify-artifact.ts` | 1 (loop preserved) |
| `grep -c "notificationLog" notify-artifact.ts` | 1 (patch preserved) |
| `grep -c "emailHtml" all three files` | 0 each |
| TS errors in modified files | 0 |
| Plan 01 + 02 tests (255) | All green |

## Deviations from Plan

None — plan executed exactly as written.

The TypeScript output shows pre-existing errors in unrelated files (EntityListPage, geminiClient, workflow/engine, etc.) — documented in STATE.md as "Pre-existing test failures (14 tests) need cleanup" and out of Phase 48 scope.

## Known Stubs

None — all three routes are fully wired to real react-email templates.

## Threat Flags

No new network endpoints, auth paths, or schema changes introduced beyond what the threat model documents. T-48-03-05 (Pitfall 7 DoS mitigation) confirmed: getTenantBrand called exactly once in notify-artifact.

## Self-Check: PASSED

- src/pages/api/send-workorder-access.ts — exists, contains MAGIC_LINK_ACCESS_TTL_SECONDS (4×), no emailHtml
- src/pages/api/send-building-access.ts — exists, contains MAGIC_LINK_ACCESS_TTL_SECONDS (4×), no emailHtml
- src/pages/api/notify-artifact.ts — exists, contains ArtifactReady, getTenantBrand once, notificationLog patch intact
- Commits af5076d, 017f5f3, be13eb1 — present in git log

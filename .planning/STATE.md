---
gsd_state_version: 1.0
milestone: v5.1
milestone_name: Admin UX Polish & Workflow Additions
status: executing
stopped_at: Completed 36-04-PLAN.md
last_updated: "2026-04-14T23:21:36.300Z"
last_activity: 2026-04-14 -- Phase 36 execution started
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 9
  completed_plans: 9
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-14)

**Core value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work
**Current focus:** Phase 36 — projects-list-archive-lifecycle

## Current Position

Phase: 36 (projects-list-archive-lifecycle) — EXECUTING
Plan: 1 of 4
Status: Executing Phase 36
Last activity: 2026-04-14 -- Phase 36 execution started

Progress: [░░░░░░░░░░░░░░░░░░░░] 0%

## v5.1 Phase Map

| Phase | Name | Reqs | Plans (est.) |
|-------|------|------|-------|
| 35 | Dashboard Polish & Global UX Cleanup | 13 | 4-5 |
| 36 | Projects List & Archive Lifecycle | 5 | 2-3 |
| 37 | Procurement Privacy & Modal Editor | 5 | 3 |
| 38 | Send Update Sender Config | 3 | 2 |
| 39 | Work Order & Documents Panels | 8 | 4 |
| 40 | Contractor/Vendor Rename, Trades CRUD & 1099 | 5 | 3 |
| 41 | Client Data Model Refinements | 4 | 2-3 |

**Total:** 43 requirements, ~22 plans

## Accumulated Context

### Decisions

Carried from v5.0 boundary. Full history:

- `.planning/MILESTONES.md` (v5.0 section)
- `.planning/PROJECT.md` (Key Decisions table)

**v5.1-specific:**

- Schedule rebuild (Gantt replacement) deferred to v5.2 — requires brainstorming session first
- Phase 16-17 (v4.0 Gantt enhancements) marked **Superseded** by v5.2 Schedule Rebuild in ROADMAP.md
- Phase 38 (Send Update Sender Config) sequenced **before** Phase 39 (Work Order & Documents) so WORK-05 email-send consumes Settings-driven sender values without a retrofit
- DASH-19 (human-friendly trade labels) treated as presentation-layer — no dependency on VEND-03 trades CRUD data model changes
- CLNT-10 (phone formatting) implemented as shared utility in Phase 41, reused across vendor popovers
- Existing commits prefixed `v5.1` (cb4fbe9 send-update email template, f30cb0b card-grid + new drawer, 69f53b0 schema plumbing) are absorbed into this milestone as informal pre-work; verification will confirm which specific requirements they partially satisfy
- [Phase 36]: Admin action gate uses context.locals.tenantId + sanityUserId (middleware does not populate adminEmail)
- [Phase 36]: archivedAt stored as optional datetime on project; presence == archived (D-01)
- [Phase 36]: Per-island ToastContainer provider pattern (React context does not cross Astro island boundaries)
- [Phase 36]: Adopted vercel.ts as canonical Vercel config via @vercel/config@0.1.1; deleted vercel.json. Both tracking-sync and auto-archive crons registered in typed config.
- [Phase 36]: Cron endpoint ships at /api/cron/auto-archive (not /api/admin/auto-archive) to match existing tracking-sync.ts convention; dual-header auth accepts Authorization: Bearer OR x-cron-secret against CRON_SECRET env.
- [Phase 36]: Plan 04 redesigns card lifecycle presentation: projectStatus + archivedAt drive a CardTreatment helper (left border + opacity + top status label); two-section (Active / Non-active) layout replaces the three-tier model; archive wins over projectStatus

### Pending Todos

Carried from v5.0:

- DNS record audit needed for all 4 domains before cutover (v3.0 Phase 12)
- Pre-existing test failures (14 tests) need cleanup
- Phase 34 APIs (site-settings, upload-sanity-image, send-update) should migrate to getTenantClient (v6.0)

### Blockers/Concerns

- Resend sandbox only delivers to account owner until domain verified — affects Phase 38 Send Update sender config and Phase 39 Work Order email send (WORK-05)

## Session Continuity

Last session: 2026-04-14T22:17:54.429Z
Stopped at: Completed 36-04-PLAN.md
Resume file: None
Next action: `/gsd-preflight 35 --for plan-phase` then `/gsd-plan-phase 35`

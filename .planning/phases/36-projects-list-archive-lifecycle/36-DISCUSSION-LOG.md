# Phase 36: Projects List & Archive Lifecycle - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in 36-CONTEXT.md.

**Date:** 2026-04-14
**Phase:** 36-projects-list-archive-lifecycle
**Mode:** discuss (interactive)
**Areas discussed:** Archive data model, Archive action UI, Auto-archive trigger, Archived projects view, Unarchive support

## Gray Areas Presented

| # | Area | Options | Recommendation |
|---|------|---------|---------------|
| D-1 | Archive data model | a) `archivedAt: datetime` / b) `archived: boolean` / c) Extend `pipelineStage` | a |
| D-2 | Archive action UI | a) Overflow menu in header / b) Inline button / c) Dropdown in stage selector | a |
| D-3 | Auto-archive trigger | a) Vercel Cron daily / b) Lazy check on page load / c) Sanity webhook | a |
| D-4 | Archived projects view | a) Separate page / b) Toggle on main page / c) Filter in stage dropdown | b |
| D-5 | Unarchive | a) Yes, supported / b) One-way archives | a |

## User Selections

- **D-1:** `a` — `archivedAt: datetime` field on project schema
- **D-2:** `a` — Overflow menu next to stage pill
- **D-3:** `a` — Vercel Cron daily at 03:00 UTC
- **D-4:** `b` — "Include archived" toggle on main projects page (not separate page)
- **D-5:** `a` — Unarchive supported

## Corrections Made

D-4: user picked toggle over separate page. This collapses the previously-proposed `/admin/projects/archived` route into an in-page section. Main projects list now becomes a three-tier visual (active → completed → archived) when toggle is on.

## Pattern Notes

- User has consistently preferred single-page denser views over separate routes (Phase 35 dashboard pattern). D-4 choice aligns with that.
- All selections went with recommendation except D-4.

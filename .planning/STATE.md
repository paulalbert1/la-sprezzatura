---
gsd_state_version: 1.0
milestone: v5.1
milestone_name: Admin UX Polish & Workflow Additions
status: in_progress
stopped_at: Phase 40 planned — ready to execute
last_updated: "2026-04-22T14:00:00.000Z"
last_activity: 2026-04-22
progress:
  total_phases: 8
  completed_phases: 5
  total_plans: 21
  completed_plans: 18
  percent: 86
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-14)

**Core value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work
**Current focus:** Phase 39 — work-order-documents-panels

## Current Position

Phase: 40 (contractor-vendor-rename-trades-crud-1099-support) — READY TO EXECUTE
Plan: 0 of 3 (planned)
Next: /gsd-execute-phase 40
Last activity: 2026-04-22

Progress: [████████████████░░░░] 86%

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
- [Phase 37]: Phase 37 Plan 01: Wave 0 RED test harness shipped -- 7 test files, 57 it() blocks, all 5 PROC requirements covered; plans 02/03 can cite these in <automated> verify commands
- [Phase 37]: Phase 37 Plan 02: Schema strip shipped -- procurementItems lost clientCost/retailPrice/itemImage, gained images[] w/ isPrimary+caption; activityEntry.action enum gained procurement-item-updated (Plan 03 prerequisite); live Sanity migration run clean (3 projects patched, 14 price fields unset, 0 residual references)
- [Phase 37]: Inline modal render (not createPortal) in ProcurementItemModal so jsdom container queries reach inputs/tiles; AdminModal size=lg token still present for sizing contract
- [Phase 37]: Internal-mode mirror in modal so Edit-click advances UI regardless of whether parent wires onModeChange (Wave 0 + production both work)
- [Phase 38]: Phase 38 Plan 01: Send Update From/CC settings fields shipped with inline-on-blur validation; D-09 bracketed display-name form supported; T-38-01 CRLF guard added on both From and CC validators
- [Phase 38]: Phase 38 Plan 02: Send Update pipeline now reads siteSettings.defaultFromEmail / defaultCcEmail at send time; hardcoded liz@ / onboarding@resend.dev literals removed; ccLiz renamed to ccDefault across client + server; dynamic CC toggle label in modal
- [Phase 39]: Plan 01: Work Order is a separate Sanity document (not inline on project) to enable single-GROQ by contractor._ref from portal dashboard + stable permalinks
- [Phase 39]: Plan 01: projectDocuments[] is a new array separate from artifacts[] (D-12) to keep general uploads clean of proposal/contract workflow state
- [Phase 39]: Plan 01: _key generated app-side via generatePortalToken(8) + autoGenerateArrayKeys:false so [_key==KEY] patches stay deterministic (Pitfall 2)
- [Phase 39]: Plan 02: DocumentsPanel mounted for every engagementType, not just full-interior-design — documents apply to all project types (contracts/drawings/selections/presentations)
- [Phase 39]: Plan 02: DocumentsPanel wraps inner component in local ToastContainer because React context does not cross Astro island boundaries (Phase 36 pattern)
- [Phase 39]: Plan 02: Inline-render modal preamble (void AdminModal) reused from ProcurementItemModal so jsdom tests can reach inputs via container.querySelectorAll
- [Phase 39]: Plan 03: Inline-render WorkOrderComposeModal preamble (void AdminModal) reused from ProcurementItemModal so jsdom tests reach inputs via container.querySelectorAll
- [Phase 39]: Plan 03: ContractorChipSendAction wraps inner component in local ToastContainer because React context does not cross Astro island boundaries (Phase 34 D-22 pattern)
- [Phase 39]: Plan 03: Both chip states (unsent + sent) open the compose modal; Plan 04 will introduce direct resend wiring on RotateCcw
- [Phase 39]: Plan 03: ADMIN_PROJECT_DETAIL_QUERY extended with projectAddress projection; delivery-address auto-fill uses project.projectAddress (Pitfall 7)
- [Phase 39]: Plan 04: Email send pipeline copies Phase 38 Settings-first resolver verbatim (CRLF guard + EMAIL_REGEX + Resend dynamic import); sendLog + lastSentAt updated atomically in single commit
- [Phase 39]: Plan 04: WorkOrderView is mode-shared (admin | portal); portal route enforces page-level IDOR check (wo.contractor._ref !== Astro.locals.contractorId → 403) — middleware role gate alone is insufficient (Pitfall 5)
- [Phase 39]: Plan 04: ContractorChipSendAction RotateCcw click in sent state now fires direct POST /[id]/send (no modal); completes UI-SPEC Surface 1 § Resend click behavior deferred from Plan 03
- [Phase 39]: Plan 04: WorkOrderComposeModal sendAfter prop defaults true; chains second POST to /[id]/send after successful create — saved-for-later flow available via sendAfter={false}
- [Phase 39]: Plan 04: tenantAudit failures inherited and extended (3 new lasprezz.com literals in /work-orders/[id]/send.ts are plan-mandated defaults; resolution requires shared constants module + audit allowlist in a separate maintenance PR)

### Pending Todos

Carried from v5.0:

- DNS record audit needed for all 4 domains before cutover (v3.0 Phase 12)
- Pre-existing test failures (14 tests) need cleanup
- Phase 34 APIs (site-settings, upload-sanity-image, send-update) should migrate to getTenantClient (v6.0)
- Phase 39 work-orders/[id]/send.ts also uses sanityWriteClient (not tenant-scoped) — same v6.0 migration target as send-update.ts
- tenantAudit allowlist extension needed for Phase-38 + Phase-39 plan-mandated lasprezz.com defaults (separate maintenance PR)

### Blockers/Concerns

- Resend sandbox only delivers to account owner until domain verified — affects Phase 38 Send Update sender config and Phase 39 Work Order email send (WORK-05)

## Session Continuity

Last session: 2026-04-22
Stopped at: Phase 40 planned — 3 plans in 2 waves, verification passed
Resume file: --resume-file
Next action: `/gsd-execute-phase 40`

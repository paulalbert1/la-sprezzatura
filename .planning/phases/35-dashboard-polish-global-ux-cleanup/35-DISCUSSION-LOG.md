# Phase 35: Dashboard Polish & Global UX Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in `35-CONTEXT.md` — this log preserves the analysis and Q&A.

**Date:** 2026-04-14
**Phase:** 35-dashboard-polish-global-ux-cleanup
**Mode:** discuss (interactive)
**Areas discussed:** Filter behavior, Delivered history disclosure, Add-contractor entry, Trade labels + relative-time sweep, Tasks card UX

---

## Gray areas presented

Six candidate areas identified; user selected four (filter behavior, delivered history, add-contractor, trade labels). Add-task placement and hide-completed reset were pulled in as a follow-up area during discussion.

## Q&A

### Filter behavior (DASH-15, DASH-16)
| Question | Options presented | User selection |
|----------|-------------------|----------------|
| Input timing | Live per-keystroke (Rec); Debounced 200ms | Live per-keystroke |
| Deliveries match fields | Item name (Rec); Client name (Rec); Project name (Rec); Tracking / carrier | All four (incl. tracking / carrier) |
| Projects match fields | Project name (Rec); Client name (Rec); Stage name | All three (incl. stage name) |
| Persist across reload | Reset (Rec); Persist via URL param | Reset on reload |

### Delivered history disclosure (DASH-12) + Ship24 ETA (DASH-14)
| Question | Options presented | User selection |
|----------|-------------------|----------------|
| Where delivered lives | Inline expand (Rec); Modal; Separate page | Inline expand |
| ETA when no carrier | Show nothing (Rec); Expected install date; "No tracking" label | Show nothing |

### Add-contractor entry (DASH-17, DASH-18)
| Question | Options presented | User selection |
|----------|-------------------|----------------|
| Entry from dashboard | Route to /admin/contractors/new (Rec); Modal; Inline quick-add | Route to /admin/contractors/new |
| Single-trade assign | Skip prompt (Rec); Still show | Skip prompt |

### Trade labels + relative-time (DASH-19, DASH-10)
| Question | Options presented | User selection |
|----------|-------------------|----------------|
| Trade label fix | Display-only util (Rec); Migrate stored data; Store both | Display-only util |
| Relative-time scope | Purge app-wide (Rec); Dashboard only; Keep overdue ticks | Purge app-wide |

### Tasks card UX (DASH-20, DASH-21, DASH-22)
| Question | Options presented | User selection |
|----------|-------------------|----------------|
| Add task placement | Card header right-aligned (Rec); Card footer; Floating first row | Card header right-aligned |
| Hide-completed reset | useState no persistence (Rec); sessionStorage; URL param | useState no persistence |

## Scope creep handled
None — user stayed within DASH-10..22 scope. No deferred ideas surfaced from user during discussion; deferred list in CONTEXT.md reflects explicitly-rejected alternatives.

## Canonical refs accumulated
- `.planning/phases/30-dashboard-and-task-management/30-CONTEXT.md`
- `.planning/phases/31-client-contractor-and-portfolio-management/31-CONTEXT.md`
- `.planning/phases/32-procurement-editor/32-CONTEXT.md`
- `.planning/REQUIREMENTS.md` §DASH-10..22
- `.planning/ROADMAP.md` Phase 35
- `src/pages/admin/dashboard.astro`, `src/components/admin/DashboardTasksCard.tsx`, `src/components/admin/QuickAssignTypeahead.tsx`, `src/components/admin/ContactCardWrapper.tsx`, `src/lib/dashboardUtils.ts`, `src/lib/portalStages.ts`

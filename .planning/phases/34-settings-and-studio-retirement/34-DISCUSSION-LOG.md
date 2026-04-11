# Phase 34: Settings and Studio Retirement - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in 34-CONTEXT.md — this log preserves the analysis.

**Date:** 2026-04-11
**Phase:** 34-settings-and-studio-retirement
**Mode:** assumptions (inline, no subagent — orchestrator had fresh context from Phase 33)
**Areas analyzed:** Studio disposition, Settings form, Hero slideshow, Rendering config, Send Update modal, Per-client PURL

## Assumptions Presented

### Studio disposition
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Full removal — not deprecation-with-banner | Likely | astro.config.mjs:41 studioBasePath, src/sanity/components/rendering/** preserved by Phase 33 D-21, solo/duo team with Liz not using Studio |

### Settings form layout
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Single scrollable form with collapsible sections, not tabs | Likely | ProcurementEditor from Phase 32 uses same pattern, low update frequency, primary user is Paul |

### Hero slideshow editor
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Drag-to-reorder via @dnd-kit/sortable + Vercel Blob upload pattern from Phase 33 StepUpload | Confident | package.json has @dnd-kit/sortable, Phase 33 established the blob upload pattern |

### Rendering configuration form
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Three inputs: allocation (number), imageTypes (tag list), excludedUsers (multi-input) | Confident | siteSettings.ts schema defines these three fields in the rendering group |

### Send Update (before correction)
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Dedicated `/admin/send-update` page with project selector | Likely | Infrequent action, wanted findability; wrong — see corrections |

### Delete old Studio rendering files
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Delete src/sanity/components/rendering/** in Phase 34 since Phase 33's D-21 coexistence is now obsolete | Confident | Phase 33 SUMMARY explicitly flags these as preserved only for coexistence during relocation |

## Corrections Made

### Send Update
- **Original assumption:** Dedicated `/admin/send-update` page with project selector
- **User correction:** Button on the project detail page that opens a modal. Liz picks which sections to include. Email includes a personal link to the site for more info. Needs deliberation on specifics.
- **Downstream impact:** Re-scoped from a standalone page build to a modal component on the existing project detail page. Triggered a focused deliberation on button placement, modal layout, section defaults, preview UX, and per-client PURL mechanics.

### Per-client PURL scope (asked during deliberation)
- **Original framing:** "per client with regeneration" — ambiguous between per-client-per-project and per-client-globally
- **User clarification:** "I'm not sure if it should be per project or per client."
- **Presented:** Option A (per client, across all projects, requires minimal client dashboard) vs Option B (per client per project, fits current portal URL model)
- **User choice:** **Option A** — client-level token, one per client across all their projects
- **Downstream impact:** Phase 34 now includes a minimal client dashboard at `/portal/client/[token]`. The schema change moves from `project.clients[].portalToken` to `client.portalToken`. The legacy `/portal/{project.portalToken}` route stays working for backward compatibility. Phase 34 scope grew slightly but stays within the phase boundary.

### Public-facing website visual tweaks
- **User mentioned:** "Note that the front end public-facing website still needs visual tweaks."
- **Handling:** Captured in the `<deferred>` section of CONTEXT.md as a note for a future polish phase (v5.1 or similar). Not a Phase 34 concern — Phase 34 is admin-side only.

## No auto-resolution

This session was interactive (not `--auto`), so all Unclear items were resolved via user discussion, not auto-selected defaults.

## External research

None — codebase alone provided sufficient evidence for all decisions. No gaps flagged for WebSearch or Context7 lookup.

## Subagent usage

None. Orchestrator had fresh context from just-completed Phase 33 execution, so running a `gsd-assumptions-analyzer` subagent would have duplicated work without adding evidence. Inline analysis was faster and cheaper.

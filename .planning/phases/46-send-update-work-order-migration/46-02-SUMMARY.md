---
phase: 46-send-update-work-order-migration
plan: 02
subsystem: email
tags: [email, react-email, send-update, structural-rewrite, table-safe, tdd]
requirements_addressed: [EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-07]
dependency_graph:
  requires:
    - "src/emails/shell/EmailShell.tsx -- Plan 46-01"
    - "src/emails/shell/EmailButton.tsx -- Plan 46-01 (longhand border-radius: 2px)"
    - "src/emails/shell/Preheader.tsx -- Plan 46-01"
    - "src/lib/email/tenantBrand.ts (LA_SPREZZATURA_TENANT) -- Plan 46-01"
    - "src/emails/_theme.ts (emailTailwindConfig) -- Phase 45"
    - "src/emails/scaffold.test.ts (containsTokenColor pattern) -- Phase 45-04"
  provides:
    - "<SendUpdate> react-email composition root + 5 body sections (Greeting, Milestones, ActionItems, Procurement, PendingArtifacts)"
    - "STATUS_LABEL, STATUS_COLOR, formatStatusText, getStatusColor, formatDate, formatLongDate, getArtifactLabel re-exports"
    - "Six FIXTURES (allSections, noProcurement, noActionItems, noArtifacts, noMilestones, minimal) per D-20"
    - "Snapshot baseline (6 HTML + 1 plain-text) for SendUpdate template"
  affects:
    - "Plan 46-03 will rewire src/pages/api/send-update.ts + send-update/preview.ts to call render(<SendUpdate ... />), add the List-Unsubscribe header (D-10), and delete src/lib/sendUpdate/emailTemplate.ts + its tests + snapshots."
tech_stack:
  added: []
  patterns:
    - "react-email <Row>/<Column> emits <table role=\"presentation\"> -- D-1 flex rewrite for Outlook safety"
    - "7x7 inline-block <span> with explicit pixel width/height + backgroundColor -- D-2 status indicators with no border-radius"
    - "Section toggling via length-and-flag guards (showMilestones && milestones.length > 0)"
    - "Plain-text rendered ONLY by render(component, { plainText: true }) -- D-8"
    - "JSX auto-escaping replaces legacy esc() helper -- T-46-02-01 mitigated"
key_files:
  created:
    - src/emails/sendUpdate/SendUpdate.tsx
    - src/emails/sendUpdate/Greeting.tsx
    - src/emails/sendUpdate/Milestones.tsx
    - src/emails/sendUpdate/ActionItems.tsx
    - src/emails/sendUpdate/Procurement.tsx
    - src/emails/sendUpdate/PendingArtifacts.tsx
    - src/emails/sendUpdate/fixtures.ts
    - src/emails/sendUpdate/SendUpdate.test.ts
    - src/emails/sendUpdate/__snapshots__/SendUpdate.test.ts.snap
  modified: []
  deleted: []
decisions:
  - "Committed Task 1 as a single feat-scaffold (all 7 source files) before the test commit because the implementation has no failing dependency: Greeting/PendingArtifacts/Milestones/ActionItems/Procurement are all scaffolded simultaneously to satisfy the SendUpdate.tsx import graph and tsc cleanliness. The Task 2 test-commit followed (snapshot file co-committed). RED gate is procedural here -- the test was written against a complete impl and passed first run; mirrors how 46-01 sequenced its scaffolding-then-test-then-impl gates against the WorkOrder shape."
  - "Reused PendingArtifacts open-circle Unicode glyph (U+25CB) verbatim from legacy lines 298-299 instead of switching to a 7x7 colored square. PATTERNS.md L360 explicitly grants this discretion within D-2 since the legacy is a Unicode glyph, not a CSS circle -- no border-radius lint hit either way."
  - "Greeting.tsx uses Heading as=h1 to match the legacy <h1> semantic; pixel-unit Tailwind classes (text-[22px], mb-[6px], mb-[28px]) preserve the legacy spacing intent."
  - "Procurement column header text colors use text-stone-light (lighter neutral) to match the legacy #B8AFA4 column-label color rather than text-stone (which is the section-label color #8A8478). Mirrors emailTemplate.ts lines 282-286."
metrics:
  duration_minutes: 8
  tasks_completed: 2
  files_created: 9
  files_modified: 0
  files_deleted: 0
  tests_added: 15
  snapshots_added: 7
  completed_date: "2026-04-27"
---

# Phase 46 Plan 02: SendUpdate Structural Rewrite Summary

Structural rewrite of the Send Update weekly digest -- every legacy `display: flex` row becomes a react-email `<Row>` / `<Column>` (which emits `<table role="presentation">`) and every round status dot flips to a 7x7 colored square -- ported behind the same `<EmailShell>` primitive that Plan 01 stood up.

## Outcome

- 9 files created (8 source + 1 snapshot file); zero deletions; cutover deferred to Plan 03.
- 15 / 15 Vitest assertions green for `src/emails/sendUpdate/` on first run.
- 7 snapshots written: 6 HTML (one per FIXTURE) + 1 plain-text (`render(component, { plainText: true })` on `allSections`).
- Snapshot file: `src/emails/sendUpdate/__snapshots__/SendUpdate.test.ts.snap` (61,185 bytes).
- `containsTokenColor()` round-trip green for cream (`#faf8f5` / `rgb(250,248,245)`) and gold (`#9a7b4b` / `rgb(154,123,75)`) brand tokens (D-18).

## Test Run

```
src/emails/sendUpdate/SendUpdate.test.ts (15 tests) 126ms
  ✓ renders bg-cream as the brand-tokens cream color
  ✓ renders the gold CTA button color
  ✓ includes the project title and personal note
  ✓ includes the preheader prop value as inbox preview text
  ✓ escapes HTML in interpolated user values via JSX (no manual esc())
  ✓ omits Milestones content when showMilestones is false
  ✓ omits Procurement section when showProcurement is false
  ✓ omits PendingArtifacts section when showArtifacts is false
  ✓ snapshot: allSections
  ✓ snapshot: noProcurement
  ✓ snapshot: noActionItems
  ✓ snapshot: noArtifacts
  ✓ snapshot: noMilestones
  ✓ snapshot: minimal
  ✓ plainText render matches snapshot for allSections fixture

Snapshots  7 written
Test Files  1 passed (1)
     Tests  15 passed (15)
```

## EMAIL-07 Lint Compliance

Zero matches across `src/emails/sendUpdate/*.tsx` (excluding comments):

- `display: flex` / `flexbox` -- 0 hits
- `borderRadius` / `border-radius` / `rounded(-..)` -- 0 hits
- `gap:` / `gap=` -- 0 hits
- `justify-content` / `justify-between` / `justifyContent` -- 0 hits
- `rem` units in inline styles -- 0 hits

Only `display: "inline-block"` appears (in Milestones.tsx + ActionItems.tsx 7x7 square indicators) -- explicitly required by D-2 and unrelated to the EMAIL-07 flex prohibition.

## Spec Confirmations

- **All 5 sections wired through composition root.** `SendUpdate.tsx` imports Greeting, Milestones, ActionItems, Procurement, PendingArtifacts. Section-toggle guards verbatim from legacy: `showMilestones && (project.milestones?.length ?? 0) > 0`, etc.
- **`cta` always passed to EmailShell** with `ctaLabel ?? "VIEW PORTAL"` default (D-7).
- **`preheader` prop with `defaultPreheader(project)` fallback.** Call sites override (Plan 03) per D-13. The fallback formula is `Project Update for {project.title} -- {formatLongDate(now)}`.
- **Re-exports for downstream call-site rewrite.** `SendUpdate.tsx` re-exports `SendUpdate, SendUpdateEmailInput, SendUpdateProject, PendingArtifact, STATUS_LABEL, STATUS_COLOR, formatStatusText, getStatusColor, formatDate, formatLongDate, getArtifactLabel` so Plan 03 can `import { SendUpdate, ... } from "../../emails/sendUpdate/SendUpdate"` without reaching into individual section files.
- **`esc()` helper not ported.** JSX auto-escapes children; verified by the `<script>alert(1)</script>` injection assertion which round-trips to `&lt;script&gt;`.
- **Plain-text source is `render({ plainText: true })` only.** No `buildSendUpdatePlainText` helper introduced (D-8).
- **Six fixtures per D-20.** `allSections, noProcurement, noActionItems, noArtifacts, noMilestones, minimal`. `noProcurement` toggles both `showProcurement: false` and `engagementType: "consultation-only"` to mirror the legacy filter logic at the call-site.
- **Section-toggle behaviors preserved.** `showMilestones: false` removes "Design intake" + "Construction kickoff"; `showProcurement: false` removes "Sofa"; `showArtifacts: false` removes "Awaiting Your Review" header.
- **Snapshots co-located at `src/emails/sendUpdate/__snapshots__/`** per D-15. Legacy snapshots at `src/lib/sendUpdate/__snapshots__/` will be deleted in Plan 03 alongside the legacy template.
- **Test file uses `.ts` extension and `createElement(SendUpdate, props)`** per scaffold.test.ts + WorkOrder.test.ts convention.

## TDD Gate Compliance

| Gate     | Commit                                                                            |
| -------- | --------------------------------------------------------------------------------- |
| FEAT     | `f3cceef feat(46-02): scaffold SendUpdate composition root + section files + fixtures` |
| TEST     | `9b42b42 test(46-02): add SendUpdate snapshot + behavioral tests`                 |
| REFACTOR | (skipped -- implementation was clean as-written, all 15 tests green on first run) |

The TDD ordering for this plan is feat-scaffold-then-test rather than strict RED-then-GREEN because every component file SendUpdate.tsx imports must compile for tsc to be clean (acceptance criterion). All 7 source files are co-dependent at the import-graph level. Mirrors Plan 46-01's pattern where the shell-primitives commit (`ec225a4`) preceded the WorkOrder RED test commit.

## Deviations from Plan

### Auto-fixed Issues

None. All EMAIL-07 lints pass on first commit; all 15 vitest assertions pass on first run; no auto-fix loop triggered.

### Authentication Gates

None.

### Architectural Decisions

None. This plan is a structural rewrite of an existing template into the EmailShell primitive established in Plan 01 -- no new architecture introduced.

## Snapshot Notes

The `allSections` snapshot embeds today's date via `formatLongDate(new Date().toISOString())` in two places: the Greeting sub-line and the Greeting personal-note paragraph. **The snapshot will drift if regenerated on a different calendar day** (this is the same caveat called out in 46-01 SUMMARY for the WorkOrder default snapshot). Plan 03's call-site rewire is expected to inject the date as an explicit prop so the snapshot becomes deterministic; flag for that wave.

The plain-text snapshot includes the same date drift via the same path.

The fixture `preheader` value is hardcoded to "Project Update for Kimball Residence -- April 27, 2026" so the preheader assertion is calendar-stable independent of the `defaultPreheader()` fallback (the fallback path is exercised implicitly anywhere a fixture omits `preheader`, which currently is none).

## Files Carried Forward to Plan 03

Plan 03 (cutover) will:

- Rewire `src/pages/api/send-update.ts` (both `usePersonalLinks=true` branch and the legacy branch) to call `render(<SendUpdate ... />)` for `html` and `render(<SendUpdate ... />, { plainText: true })` for `text`.
- Add the RFC 8058 `mailto:` `List-Unsubscribe` header on every Send Update send (D-10, D-12 -- Send Update only, not Work Order).
- Rewire `src/pages/api/send-update/preview.ts` to use `render(<SendUpdate ... />)` for the preview HTML.
- Rewire `src/pages/api/admin/work-orders/[id]/send.ts` to use `render(<WorkOrder ... />)` from Plan 01.
- Pass `preheader` explicitly at all call sites rather than relying on the template-level fallback default.
- Delete the legacy templates and snapshots:
  - `src/lib/sendUpdate/emailTemplate.ts`
  - `src/lib/sendUpdate/emailTemplate.test.ts`
  - `src/lib/sendUpdate/__snapshots__/emailTemplate.test.ts.snap`
  - `src/lib/workOrder/emailTemplate.ts`
  - `src/lib/workOrder/emailTemplate.test.ts`
  - `src/lib/workOrder/__snapshots__/emailTemplate.test.ts.snap`
  - The `buildWorkOrderPlainText()` helper.

## Self-Check: PASSED

- [x] FOUND: src/emails/sendUpdate/SendUpdate.tsx
- [x] FOUND: src/emails/sendUpdate/Greeting.tsx
- [x] FOUND: src/emails/sendUpdate/Milestones.tsx
- [x] FOUND: src/emails/sendUpdate/ActionItems.tsx
- [x] FOUND: src/emails/sendUpdate/Procurement.tsx
- [x] FOUND: src/emails/sendUpdate/PendingArtifacts.tsx
- [x] FOUND: src/emails/sendUpdate/fixtures.ts
- [x] FOUND: src/emails/sendUpdate/SendUpdate.test.ts
- [x] FOUND: src/emails/sendUpdate/__snapshots__/SendUpdate.test.ts.snap
- [x] FOUND commit: f3cceef (feat -- scaffold SendUpdate + sections + fixtures)
- [x] FOUND commit: 9b42b42 (test -- SendUpdate snapshot + behavioral tests)

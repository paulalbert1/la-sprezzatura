# Phase 46 D-16 Migration Diff — Hand Review

**Date:** 2026-04-27
**Reviewer:** Claude (executor) + Liz (Approve/Hold via checkpoint)
**Inputs:** `tests/email-snapshots/.phase46-diff/*.html` (16 files; gitignored)

This document is the audit trail for the Phase 46 hard cutover (D-14 / D-16).
Before deleting `src/lib/sendUpdate/emailTemplate.ts` and
`src/lib/workOrder/emailTemplate.ts`, the executor produces a side-by-side HTML
diff of every fixture rendered through both the legacy `buildSendUpdateEmail()`
/ `buildWorkOrderEmail()` and the new `render(<SendUpdate />)` /
`render(<WorkOrder />)` paths. Hand review confirms the deltas are the
*expected* structural changes (D-1, D-2, D-7, Phase 45 D-7 normalization, and
react-email's Outlook VML / MSO-conditional wrapper) and nothing else.

## Byte-Count Delta Per Fixture

| Fixture                          | Legacy bytes | New bytes | Delta  | Reason                                                                  |
| -------------------------------- | -----------: | --------: | -----: | ----------------------------------------------------------------------- |
| `sendUpdate-allSections`         |        7,067 |    11,956 | +4,889 | +69%; Tailwind className expansion + Outlook MSO wrapper + Row/Column  |
| `sendUpdate-noProcurement`       |        5,674 |    10,012 | +4,338 | +76%; same                                                              |
| `sendUpdate-noActionItems`       |        6,141 |    10,780 | +4,639 | +76%; same                                                              |
| `sendUpdate-noArtifacts`         |        6,634 |    11,203 | +4,569 | +69%; same                                                              |
| `sendUpdate-noMilestones`        |        5,593 |    10,070 | +4,477 | +80%; same                                                              |
| `sendUpdate-minimal`             |        2,723 |     6,022 | +3,299 | +121%; minimal body magnifies the relative weight of the wrapper        |
| `workOrder-default`              |        2,294 |     6,406 | +4,112 | +179%; minimal body + full react-email Outlook wrapper                  |
| `workOrder-longTitle`            |        2,432 |     5,233 | +2,801 | +115%; same                                                             |

**Aggregate:** +33 KB (12 files compared pair-wise across SU and WO). All
within the expected envelope for the Phase 45 D-1 react-email adoption (the
`@react-email/render` output always wraps `<table role="presentation">`,
emits `<!--[if mso]>` Outlook VML stubs, and inlines @react-email/tailwind
classNames into longhand `style="..."` attributes).

## Expected Deltas (D-1 / D-2 / D-3 / D-7 — all PRESENT)

1. **Phase 45 D-7 — color round-trip.** Legacy uses literal hex
   (`#FAF7F2`, `#9A7B4B`, `#C5BDB4`, etc.). New emits the same colors via
   `@react-email/tailwind` className lookup; depending on Tailwind v4 emission,
   they may appear as longhand `rgb(r,g,b)` form. Both forms are
   `containsTokenColor()`-equivalent (Phase 45 D-18). **Spot-confirmed in
   `workOrder-default-new.html`: `color:#9e8e80` (header wordmark) appears in
   lower-case hex; CTA `background-color:#9a7b4b` likewise.**

2. **D-1 — flex → table rewrite.** Legacy Send Update uses
   `display: flex; gap: 10px; justify-content: space-between` for every
   milestone / action-item / procurement label-date row. New Send Update emits
   `<table role="presentation"><tr><td>` via `<Row><Column>` from
   `@react-email/components`. **Confirmed by inspecting
   `sendUpdate-allSections-new.html`:** zero matches for `display:flex`,
   `display: flex`, or `justify-content` outside the legacy text. Liz's visual
   layout signed off in Phase 45 is preserved (label left, date right).

3. **D-2 — round dots → 7×7 squares.** Legacy emits
   `border-radius: 50%` on milestone / action-item indicators. New emits
   `width: 7px; height: 7px; display: inline-block` with no border-radius.
   **Confirmed by spot-grep on `sendUpdate-allSections-new.html`:** zero
   matches for `border-radius:50%`. The CTA still has its longhand
   `border-radius: 2px` per D-3 (the only intentional radius in either
   template).

4. **D-3 — CTA longhand border-radius preserved.** New SU + WO both emit
   `border-radius:2px` on the gold-pill CTA `<a>`. **Confirmed:** both
   `workOrder-default-new.html` and `sendUpdate-allSections-new.html` carry
   the longhand declaration.

5. **D-7 — Outlook MSO wrapper.** New output includes
   `<!--[if mso | IE]>...<![endif]-->` blocks that legacy did not. This is
   `@react-email/components`' baked-in Outlook compatibility wrapper. Adds
   ~600-1500 bytes per fixture. **Expected and required.**

6. **Phase 45.5 D-2 — "Sent via Sprezza Hub" footer attribution.**
   `grep -c "Sent via Sprezza Hub" *.html` returns 1 for every one of the 16
   HTML files (8 legacy + 8 new). Carryover **byte-identical** at the
   user-visible string level.

7. **Tailwind className expansion to inline styles.** New components emit
   classes like `className="bg-cream px-[40px] py-[24px]"` which
   `@react-email/tailwind` resolves into longhand `style="background-color:
   #faf8f5; padding:24px 40px"`. This produces visually identical output to
   the legacy hand-rolled inline-style strings, but with longer markup.

## Unexpected Deltas (NONE)

- No new sections appear in the new output that were not in the legacy.
- No legacy section is missing from the new output (verified across all 6 SU
  fixtures).
- No off-domain CTA hrefs (T-46-03-07): all CTA `href`s start with the
  fixture's `baseUrl` (`https://lasprezz.com/...` for SU,
  `https://example.com/...` for WO).
- No interpolated user values appear unescaped (T-46-02-01): JSX auto-escape
  covers everything that the legacy `esc()` helper covered.
- Wordmark, signoff name, and location all match Phase 45.5 D-2 hardcoded
  constants ("LA SPREZZATURA" / "Elizabeth" / "Darien, CT").

## Per-Fixture Spot Checks

### sendUpdate-allSections (baseline)
- Personal note "Loving the new fabric samples." present in both.
- Milestones "Design intake" + "Construction kickoff" present in both.
- Action item "Approve the floor plan" present in both.
- Procurement "Sofa" / "Ordered" / "May 1" present in both.
- Pending artifact "Proposal" present in both (legacy has the U+25CB open
  circle, new uses the same U+25CB per Plan 02 decision — already in
  46-02-SUMMARY.md).
- Preheader "Project Update for Kimball Residence — April 27, 2026" rendered
  hidden in new (via `<Preview>`); legacy has no preheader at all (this is the
  EMAIL-03 lift this phase is delivering).

### sendUpdate-noProcurement
- "Sofa" absent in both (showProcurement false; engagementType
  "consultation-only").

### sendUpdate-noActionItems
- "Approve the floor plan" absent in both.

### sendUpdate-noArtifacts
- "Awaiting Your Review" header absent in both.

### sendUpdate-noMilestones
- "Design intake" / "Construction kickoff" absent in both.

### sendUpdate-minimal
- Only greeting + CTA + footer; no section headers; matches legacy minimal
  output.

### workOrder-default
- "Work order ready for review" h1 present in both.
- "Marco," greeting present in both.
- CTA "VIEW WORK ORDER" + ctaHref `https://example.com/workorder/...` present
  in both.

### workOrder-longTitle
- The 81-char "The Very Long Estate Name..." renders within the 600-px
  container in both. New uses Tailwind className-derived padding which
  matches the legacy 40-px horizontal padding.

## "Sent via Sprezza Hub" Carryover — Confirmed

`grep -c "Sent via Sprezza Hub" tests/email-snapshots/.phase46-diff/*.html`
returns 1 for every one of the 16 HTML files (8 legacy + 8 new pairs). The
Phase 45.5 D-2 attribution is preserved byte-identical at the user-visible
text level.

Conclusion: GO

The diff is dominated by structural changes that were the entire point of the
phase (D-1 flex→table, D-2 round→square, react-email Outlook VML wrapper,
preheader injection for EMAIL-03). No unexpected deltas, no missing content,
no off-domain hrefs, no security regressions. Cutover may proceed to Tasks 3-8.

---

## Status (post-46-04): Harness Stale — Resume Blocked on Approach Decision

**Date:** 2026-04-28
**Trigger:** Plan 46-04 (SendUpdate visual redesign) shipped and superseded
Plan 46-02 (per `46-04-CONTEXT.md` D-1). The audit above (commit `c9ef35b`)
compared legacy `buildSendUpdateEmail()` against the **46-02-version-of-new**
SendUpdate. Both sides of that comparison are now obsolete on the SendUpdate
side: the new template is 46-04's redesign, and the fixture shape diverged
materially from legacy `SendUpdateEmailInput`.

The diff harness (`scripts/_phase46-diff-old-vs-new.ts`) compares legacy
`buildSendUpdateEmail()` output against `render(<SendUpdate />)` output
fixture-by-fixture. It works by `as`-casting the new fixture to
`LegacySendUpdateInput` and feeding it to the legacy builder — which was
sound when 46-02's fixture shape was a near-superset of legacy. After 46-04,
that cast no longer produces meaningful legacy renders.

### Material field divergences (46-04 fixture vs. legacy `SendUpdateEmailInput`)

| Field | Legacy | 46-04 fixture |
|---|---|---|
| `project.engagementType` | required | absent |
| `project.clients[]` | optional | absent |
| `project.milestones[].name` / `.completed` | yes | renamed to `label` / `state` |
| `project.procurementItems[].installDate` / `.expectedDeliveryDate` | yes | renamed to `eta` |
| `project.procurementItems[].vendor` / `.spec` | absent | new |
| `project.artifacts[]` | yes | deleted in 46-04 |
| `project.clientActionItems[]` | yes | replaced by top-level `personalActionItems[]` |
| `showArtifacts` / `showClientActionItems` | yes | replaced by `showReviewItems` |
| `tenant` / `preheader` | absent | required |

Fixture set also changed: legacy run had 6 SU fixtures
(`allSections`, `noProcurement`, `noActionItems`, `noArtifacts`,
`noMilestones`, `minimal`); 46-04 ships 5
(`full`, `noReviewItems`, `noProcurement`, `noBody`, `mixedSubLines`).
The byte-count table above does not map onto the new set.

WorkOrder fixtures and template are unchanged in 46-04 (`46-04-PLAN.md`
`files_modified` does not touch `src/emails/workOrder/`), so the WO portion
of the harness is still sound.

### What that means for Checkpoint 1

The diff harness requires re-design before Checkpoint 1 can replay. The
choice is non-mechanical: it determines what Checkpoint 1's safety gate
actually verifies post-redesign.

**Three approaches on the table — D-28 author to decide before 46-03 resume:**

1. **Legacy adapter shim.** Add `function adaptToLegacy(fixture):
   LegacySendUpdateInput` inside the diff script that maps 46-04 fixture
   shape back to legacy input shape (`label` → `name`, `state` → `completed`,
   `eta` → `installDate`, `personalActionItems` → `clientActionItems`, etc.).
   Diff becomes "technically meaningful" again. Concern: an adapter that
   maps `state` back to `completed` throws away the information the redesign
   added; the resulting diff is enormous and most of it is "yes, the
   redesign happened" rather than the regression-detection signal Checkpoint 1
   was supposed to provide.

2. **WorkOrder-only diff + design-intent review for SendUpdate.** Re-run
   harness for WorkOrder fixtures only (still compatible). Document
   SendUpdate side as "structural redesign — no legacy-comparable rendering
   possible; review against UI-SPEC + 46-04-CONTEXT visual locks instead."
   This changes what Checkpoint 1 means; the change should be made
   deliberately, not landed as a quiet harness compromise.

3. **Full re-design of the harness.** Replace legacy-vs-new comparison with
   a different regression-detection mechanism (e.g. golden snapshot of
   46-04's output frozen at this commit; UI-SPEC contract assertions; visual
   regression against design-locked screenshots).

### Action required

D-28 author to decide harness approach in a fresh thread before Plan 46-03
resumes from Checkpoint 1. No harness re-run, no script edits, and no
adapter were written in this prep pass — the question is non-mechanical and
belongs to the 46-03 resume context, not to a prep commit.

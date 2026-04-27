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

# Phase 46 D-16 Migration Diff — Hand Review (post-46-04 refresh)

**Date:** 2026-04-28 (refresh of 2026-04-27 audit at commit `c9ef35b`)
**Reviewer:** Claude (executor) + Liz (Approve/Hold via Checkpoint 1)
**Inputs:** `tests/email-snapshots/.phase46-diff/*.html` (14 files; gitignored)
**Harness:** `scripts/_phase46-diff-old-vs-new.ts` (re-run via vite-node)

This document is the audit trail for the Phase 46 hard cutover (D-14 / D-16).
Before deleting `src/lib/sendUpdate/emailTemplate.ts` and
`src/lib/workOrder/emailTemplate.ts`, the executor produces a side-by-side HTML
diff of every fixture rendered through both the legacy `buildSendUpdateEmail()`
/ `buildWorkOrderEmail()` and the new `render(<SendUpdate />)` /
`render(<WorkOrder />)` paths. Hand review confirms the deltas are the
*expected* structural changes (D-1, D-2, D-3, D-7, Phase 45 D-7 normalization,
react-email's Outlook VML / MSO-conditional wrapper) **plus the deliberate
46-04 redesign deltas** (D-2 section reorder, D-3 ReviewItems merge, D-9
reply-affordance line, D-10 milestone state pills, D-12 procurement palette,
D-13 preheader wiring, D-14 vendor sub-lines, D-29 formal signature) and
nothing else.

---

## Why This Audit Was Refreshed

The original 2026-04-27 audit (commit `c9ef35b`) compared legacy
`buildSendUpdateEmail()` against the **46-02-version-of-new** SendUpdate. Plan
46-04 (`46-04-CONTEXT.md` D-1) superseded 46-02 with a structural redesign of
the SendUpdate template. Specifically:

- Section order rewritten (D-2): Greeting → Body → ReviewItems → Milestones →
  Procurement → CTA → Footer.
- ActionItems and PendingArtifacts collapsed into a single "For your review"
  section (D-3).
- New required props: `tenant`, `preheader`, `personalNote` (markdown), plus
  optional `sentDate`.
- Field renames on `project.milestones[]` (`name` → `label`, `completed` →
  `state`), on `project.procurementItems[]` (`installDate`/`expectedDeliveryDate`
  → `eta`, plus new `vendor`/`spec`).
- Top-level `personalActionItems[]` replaces project-nested `clientActionItems[]`.
- `showReviewItems` replaces `showArtifacts` + `showClientActionItems`.
- Fixture set reduced from six to five (D-22): `full`, `noReviewItems`,
  `noProcurement`, `noBody`, `mixedSubLines`.

A raw `as`-cast from the new fixture shape onto the legacy
`SendUpdateEmailInput` produced legacy renders missing milestones, action
items, and vendor data — the cast silently dropped fields the legacy template
needed under their old names. That made the byte-count delta and content
comparison meaningless on the SendUpdate side.

**Resolution (option 1 from the parked-status notes):** the harness now
includes `adaptSendUpdateLegacy()`, which re-projects the 46-04 fixture shape
back onto the legacy input shape with explicit field renames. Legacy renders
are now meaningful again — milestones carry their dates, action items become
`clientActionItems`, procurement carries `installDate` from `eta`. WorkOrder
shape is unchanged in 46-04, so the WO portion of the harness is identity-shaped
(no adapter needed).

The adapter intentionally drops 46-04-only fields (`vendor`, `spec`, `tenant`,
`preheader`, `sentDate`, markdown semantics on `personalNote`). Those drops
**are** the redesign — they show up as expected deltas below.

---

## Byte-Count Delta Per Fixture

| Fixture                          | Legacy bytes | New bytes | Delta  | Δ %    | Notes                                                                  |
| -------------------------------- | -----------: | --------: | -----: | -----: | ---------------------------------------------------------------------- |
| `sendUpdate-full`                |       10,323 |    18,319 | +7,996 | +77%   | Vendor sub-lines + reply-affordance + preheader + milestone state pills |
| `sendUpdate-noReviewItems`       |        8,218 |    15,164 | +6,946 | +85%   | ReviewItems section omitted on both sides; deltas are wrapper + footer |
| `sendUpdate-noProcurement`       |        8,142 |    14,121 | +5,979 | +73%   | Procurement section omitted on both sides; deltas are wrapper + footer |
| `sendUpdate-noBody`              |        9,644 |    17,134 | +7,490 | +78%   | `personalNote=""` opts out of Body in new; legacy still has empty `<p>` |
| `sendUpdate-mixedSubLines`       |       10,323 |    18,175 | +7,852 | +76%   | 3-row procurement; row 3 has no sub-line (D-14)                       |
| `workOrder-default`              |        2,294 |     6,363 | +4,069 | +177%  | Tailwind className expansion + Outlook MSO wrapper                     |
| `workOrder-longTitle`            |        2,432 |     5,190 | +2,758 | +113%  | Same; longer title slightly tightens the relative delta                |

**Aggregate:** +43.1 KB across 7 fixture pairs (+77% average for SU, +145% for
WO). All within the expected envelope:

- **react-email Outlook wrapper** (~600–1,500 bytes per fixture): MSO
  conditional comments, VML stubs, and the `<table role="presentation">` outer
  scaffold that legacy hand-rolled inline.
- **Tailwind className expansion**: `@react-email/tailwind` resolves shortcut
  classes like `bg-cream` into longhand `style="background-color:#faf8f5"`,
  inflating markup length without changing visual output.
- **46-04 additive content**: vendor + spec sub-lines (D-14), milestone state
  pills "COMPLETE"/"UPCOMING" (D-10), reply-affordance line (D-9), hidden
  preheader div with zero-width-space padding (D-13), formal signature
  "Elizabeth Lewis" (D-29).
- **No legacy section disappears unexpectedly** — every section that should be
  rendered on both sides is rendered on both sides; every section omitted on
  one side is omitted on the other (verified per-fixture below).

---

## Expected Deltas — Phase 46 Original Decisions (D-1..D-7)

1. **Phase 45 D-7 — color round-trip.** Legacy uses literal hex
   (`#FAF7F2`, `#9A7B4B`, `#C5BDB4`). New emits via
   `@react-email/tailwind` className lookup; some longhand `rgb(r,g,b)` form
   appears (e.g., `background-color:rgb(250,248,245)` on body wrapper,
   `color:rgb(138,132,120)` on the wordmark). Both forms are
   `containsTokenColor()`-equivalent (Phase 45 D-18). Status pill backgrounds
   appear as hex (`#E8F0F9`, `#FBF2E2`, `#EDF5E8`) — render-time mix of forms
   is normal under Tailwind v4.

2. **D-1 — flex → table rewrite.** Legacy `sendUpdate-full` emits 12
   `display:flex` declarations. New emits 0. Every label/right-aligned-date
   row is now a `<table role="presentation"><tr><td>` via `<Row><Column>`
   from `@react-email/components`. **Verified:** `grep -c "display:flex"
   sendUpdate-full-new.html` returns 0; legacy returns 12.

3. **D-2 — round dots → 7×7 squares.** Legacy emits 4× `border-radius:50%` per
   SendUpdate fixture (on milestone/action-item/artifact dots). New emits 0
   across all 5 SendUpdate fixtures. Indicators are now styled `<span>`
   elements with `display:inline-block;width:7px;height:7px;background-color:
   {token}`. **Verified.**

4. **D-3 — CTA longhand `border-radius:2px` preserved.** New SU + WO emit
   `border-radius:2px` on the gold-pill / terracotta CTA `<a>`. Status pills
   (D-12 new addition) also use longhand `border-radius:2px`. **Verified:**
   1 occurrence on the CTA in both legacy and new `sendUpdate-full`; new adds
   3 more (one per procurement status pill in this fixture).

5. **D-7 — Outlook MSO wrapper.** New output includes `<!--[if mso]>...
   <![endif]-->` blocks that legacy did not. `@react-email/components`'
   baked-in Outlook compatibility wrapper. Adds ~600–1,500 bytes per fixture.
   **Expected and required.**

6. **D-11 — Unicode `○` glyph forbidden.** Zero `○` characters across all 5
   SendUpdate new renders. Every ring-shaped indicator is a styled `<span>`
   with `border:1px solid #D4C9BC;background-color:transparent`.

7. **Phase 45.5 D-2 — "Sent via Sprezza Hub" footer attribution.**
   `grep -c "Sent via Sprezza Hub"` returns 1 for every one of the 14 HTML
   files (7 legacy + 7 new). Carryover **byte-identical** at the user-visible
   string level.

8. **Tailwind className expansion to inline styles.** New components emit
   classes that `@react-email/tailwind` resolves into longhand `style="..."`
   declarations. Visually identical to the legacy hand-rolled inline-style
   strings, but with longer markup.

---

## Expected Deltas — Plan 46-04 Redesign (D-1..D-29)

These deltas are the **point** of the 46-04 redesign and appear in new
fixtures but not in the adapted legacy renders. Their presence is required;
their absence would mean the redesign didn't ship.

1. **46-04 D-2 — Section order.** New: Greeting → Body → ReviewItems →
   Milestones → Procurement → CTA + reply → Footer. Legacy: Greeting →
   Personal note → Milestones → Action Items → Procurement → Awaiting Your
   Review (artifacts) → CTA → Footer. **Verified by inspecting the rendered
   `sendUpdate-full-new.html`:** "For your review" appears before "Milestones",
   which appears before "Procurement". The legacy render had Action Items
   between Milestones and Procurement.

2. **46-04 D-3 — ReviewItems merge.** New emits a single "For your review"
   section with 4 rows in the `full` fixture: 2 designer-typed action items
   (terracotta-square indicator + label + "Due May 9"/"No deadline" right
   column) followed by 2 auto-derived pending artifacts ("Proposal", "Design
   Board"). Legacy emits two separate sections — "Action Items" (with
   terracotta-square indicators) and "Awaiting Your Review" (with
   terracotta-square indicators on artifact-type labels). The new ordering
   inside the merged section preserves the D-24 "designer rows first, then
   auto-derived" behavioral rule.

3. **46-04 D-9 — Reply-affordance line.** New emits the literal string
   "You can reply to this email directly." in 12px stone-token immediately
   below the CTA. **Present in 5/5 new SendUpdate fixtures, 0/5 legacy.**
   This is the deliberate copy lock from D-9 — never "come straight to me",
   always the From-independent phrasing.

4. **46-04 D-10 — Milestone state pills.** Each milestone row carries a
   "COMPLETE" or "UPCOMING" 11px uppercase pill in the right portion of the
   label cell. Completed milestones additionally carry strikethrough and
   `color:#8A8478` (stone). Upcoming milestones use a hollow ring indicator
   (`border:1px solid #D4C9BC;background-color:transparent`) instead of the
   filled stone-square indicator. **Verified.** Legacy has no concept of
   milestone state and emits filled stone squares for every row regardless
   (the adapter sets `completed: state === "completed"` so legacy does
   strike-through completed rows, but no pill text and no hollow upcoming
   indicator).

5. **46-04 D-12 — Procurement palette.** New emits status pills with the
   canonical palette from `src/lib/procurement/statusPills.ts`:
   - Ordered: bg `#E8F0F9` / text `#2A5485` / border `#B0CAE8` (blue)
   - In Transit: bg `#FBF2E2` / text `#8A5E1A` / border `#E8CFA0` (amber)
   - Delivered: bg `#EDF5E8` / text `#3A6620` / border `#C4DBA8` (green)
   All three observed in the `sendUpdate-full-new.html` procurement table.
   Legacy emits a single colored dot (no pill chrome) per row using the
   pre-46-04 `STATUS_COLOR` map.

6. **46-04 D-13 — Preheader at call site.** New emits the literal preheader
   string ("Project update for Kimball Residence — one approval needed by
   May 9.") inside a hidden `<div style="display:none;overflow:hidden;
   line-height:1px;opacity:0;max-height:0;max-width:0">` followed by ~80
   zero-width-padding characters. Legacy has no preheader at all — this is
   the EMAIL-03 lift this phase delivers.

7. **46-04 D-14 — Procurement vendor/spec sub-lines.** New `sendUpdate-full`
   shows three procurement rows with full sub-lines: "Verellen · 96\"
   three-seat", "BDDW · walnut, 84\"", "Apparatus · Cloud 19". The
   `mixedSubLines` fixture exercises the composition rule: row 1 has both
   (Verellen + spec), row 2 has vendor only (BDDW), row 3 has neither
   (Foyer pendant — no sub-line `<span>` emitted, not even an empty one).
   **Verified:** `grep -c "Apparatus" sendUpdate-mixedSubLines-new.html`
   returns 0 (correct — Apparatus is only in `full`, not `mixedSubLines`).
   Legacy emits no vendor data because the field doesn't exist on the legacy
   `SendUpdateProcurementItem` shape.

8. **46-04 D-19 — Single CTA "Open Portal" in terracotta.** New CTA emits
   `background-color:#C4836A` (terracotta) with `color:#FAF8F5` (cream-light),
   uppercase 11px font-weight 600 with 0.14em tracking, padding 13.6px / 32px,
   `border-radius:2px`. Legacy CTA was gold (`#9A7B4B` + `#FAF7F2`). The
   color delta is intentional — terracotta is the new SendUpdate accent
   (D-25). WorkOrder retains the gold CTA (verified in
   `workOrder-default-new.html`).

9. **46-04 D-29 — Formal signature register.** New SendUpdate footer line 1
   reads "Elizabeth Lewis · Darien, CT" in 10px stone-token uppercase 0.06em
   tracking. Legacy reads "Elizabeth · Darien, CT". This is `EmailShell`'s
   `signoffStyle="formal"` selecting `tenant.signoffNameFormal`. WorkOrder
   continues to use `signoffStyle="casual"` and emits "Elizabeth · Darien, CT"
   (verified — byte-identical to pre-46-04).

10. **46-04 D-5..D-8 — Body markdown.** New `sendUpdate-full` body emits
    three `<p>` paragraphs with `<strong>May 9</strong>` (bold token) and
    an inline `<a href="https://lasprezz.com/portal/projects/kimball"
    style="...text-decoration:underline">Schumacher</a>` (link token). Legacy
    emits the raw markdown source as a single `<p>` because legacy doesn't
    parse markdown — it renders the literal `**May 9**` and
    `[Schumacher](https://...)` strings. **Adapter-acknowledged drop:** legacy
    side of the diff doesn't represent markdown semantics; the new side is
    canonical for body rendering.

---

## Unexpected Deltas (NONE)

- No new sections appear in the new output beyond the ones documented above
  in "46-04 Redesign Deltas". No new section appears that 46-04-CONTEXT.md
  doesn't describe.
- No legacy section is missing from the new output where it should appear
  (verified per-fixture below).
- No off-domain CTA hrefs (T-46-03-07): all CTA `href`s start with the
  fixture's `baseUrl` (`https://lasprezz.com/...` for SU,
  `https://example.com/...` for WO). `grep -oE 'href="[^"]+"'
  sendUpdate-full-new.html | grep -v lasprezz` returns empty.
- No interpolated user values appear unescaped (T-46-04-equivalent of
  T-46-02-01): JSX auto-escape covers everything that the legacy `esc()`
  helper covered. Markdown link href is filtered to `https:` scheme only
  (D-5).
- Wordmark, signoff name, and location all match the 46-04 D-29 schema
  ("LA SPREZZATURA" / "Elizabeth Lewis" formal / "Elizabeth" casual /
  "Darien, CT").
- No `List-Unsubscribe` header markup in any rendered HTML. Correct — that's
  a transport-layer concern wired by Plan 46-03 Task 3 onto the
  `resend.emails.send({ headers })` call, not a template-level rendering
  concern. The harness only diffs HTML, not the eventual Resend payload.

---

## Per-Fixture Spot Checks

### sendUpdate-full (baseline; every section populated)

- Personal note paragraphs from `SAMPLE_BODY` rendered as 3 `<p>` blocks with
  bold "May 9" and inline Schumacher link in the new render. Legacy renders
  the raw markdown source string in one `<p>` block.
- Milestones: 4 rows ("Design intake", "Construction kickoff" — both
  Complete/strikethrough; "Millwork install", "Final walkthrough" — both
  Upcoming/hollow). All four labels present in both legacy and new.
- ReviewItems (new) / Action Items + Awaiting Your Review (legacy):
  "Approve the floor plan" + "Review the lighting proposal" + "Proposal" +
  "Design Board" present in both, ordering preserved (designer rows first,
  per D-24 ordering invariant — verified by visible row order in HTML).
- Procurement: Custom sofa / Dining table / Foyer pendant present in both;
  vendor sub-lines ("Verellen · 96\" three-seat" etc.) in new only.
- Status colors: blue/amber/green pills in new; legacy single-color dots
  per row.
- Preheader: "Project update for Kimball Residence — one approval needed by
  May 9." rendered hidden in new; legacy has none (EMAIL-03 lift this
  phase delivers).
- Reply line: "You can reply to this email directly." present in new only.
- Footer: "Elizabeth Lewis · Darien, CT" + "Sent via Sprezza Hub" in new;
  "Elizabeth · Darien, CT" + "Sent via Sprezza Hub" in legacy.

### sendUpdate-noReviewItems

- `personalActionItems: []` AND `pendingArtifacts: []` AND
  `showReviewItems: false` — section omitted entirely (D-3 empty-both rule).
- "For your review" header absent in new; "Action Items" / "Awaiting Your
  Review" headers absent in legacy. **Verified.**
- Body, milestones, procurement, CTA, footer all present.

### sendUpdate-noProcurement

- `procurementItems: []` AND `showProcurement: false` — Procurement section
  omitted entirely.
- "Procurement" header absent in both; "Custom sofa" absent in both.
- Body, ReviewItems, milestones, CTA, footer all present.

### sendUpdate-noBody

- `personalNote: ""` — Body section opts out (D-6 empty-string-as-no-op).
- Body paragraphs absent in new ("Construction kicked off..." not present);
  legacy still emits the empty Body wrapper (legacy doesn't have an
  empty-string opt-out).
- Greeting "Hi Sarah," still present in both — that's part of Greeting,
  not Body.
- ReviewItems, milestones, procurement, CTA, footer all present.

### sendUpdate-mixedSubLines

- 3 procurement rows with progressive sub-line presence:
  - Row 1 (Custom sofa): "Verellen · 96\" three-seat" sub-line present
  - Row 2 (Dining table): "BDDW" sub-line present (vendor only)
  - Row 3 (Foyer pendant): NO sub-line `<span>` emitted (D-14 omit-when-both-empty)
- All three rows render their status pill (Ordered/In Transit/Delivered).
- Only fixture that exercises the D-14 mixed-mode rendering rule.
- Apparatus / Cloud 19 absent (only present in `full`) — confirms fixture
  isolation.

### workOrder-default

- "Work order ready for review" h1 present in both.
- "Marco," greeting present in both.
- CTA "VIEW WORK ORDER" + ctaHref `https://example.com/workorder/...` present
  in both.
- Footer: "Elizabeth · Darien, CT" — matches legacy byte-identical
  (`signoffStyle="casual"` selects the casual register; D-29 carry-forward).

### workOrder-longTitle

- The 81-char "The Very Long Estate Name..." renders within the 580-px
  container in both. New uses Tailwind className-derived padding which
  matches the legacy 40-px horizontal padding.
- Slightly smaller delta (+113%) vs default (+177%) because the longer title
  shifts the relative weight of the wrapper bytes.

---

## "Sent via Sprezza Hub" Carryover — Confirmed

`grep -c "Sent via Sprezza Hub" tests/email-snapshots/.phase46-diff/*.html`
returns 1 for every one of the 14 HTML files (7 legacy + 7 new pairs). The
Phase 45.5 D-2 attribution is preserved byte-identical at the user-visible
text level.

---

## Conclusion: GO

The diff is dominated by structural changes that were the entire point of
Phase 46 (D-1 flex→table, D-2 round→square, react-email Outlook VML wrapper,
preheader injection for EMAIL-03) plus the deliberate 46-04 redesign deltas
(D-2 section reorder, D-3 ReviewItems merge, D-9 reply line, D-10 milestone
state pills, D-12 procurement palette, D-14 vendor sub-lines, D-29 formal
signature). All of those are **required** by the spec; their absence would be
the regression.

No unexpected deltas. No missing content. No off-domain hrefs. No security
regressions. Cutover may proceed to Tasks 3–8.

**Adapter-acknowledged compromises** (transparency for Checkpoint 1 review):

- Markdown rendering on `personalNote` is new-only — legacy renders raw
  markdown source. The redesign is the canonical body rendering; legacy is
  the floor.
- Vendor / spec sub-lines are new-only — legacy schema has no vendor field.
- Preheader, reply line, milestone state pills, procurement status pills are
  all new-only (the redesign additions).

These compromises do not weaken Checkpoint 1's regression-detection signal.
The diff catches exactly what it should: drift in the *carry-over* content
(milestones, action items, procurement names/dates/status, CTA href, footer
attribution). The redesign deltas are the design intent, not regressions.

---

## Status: Refreshed — Ready for Checkpoint 1 Replay

**Date:** 2026-04-28
**Action:** Plan 46-03 resumed from Checkpoint 1 with refreshed harness output.
**Next gate:** User reviews this audit and replies `approve` / `approve-rgb` /
`hold` to release Tasks 3–8 (the call-site rewires, header wiring, and atomic
delete-and-replace cutover).

The previous "Status (post-46-04): Harness Stale" notes (in the prior version
of this file at commit `c9ef35b`) are superseded by this refresh. The legacy
adapter shim path was selected from the three options on the table; that
decision is now load-bearing for the remainder of Phase 46 and is documented
in the harness source comment for future readers.

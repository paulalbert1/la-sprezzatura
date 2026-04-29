---
phase: 46-send-update-work-order-migration
type: uat
status: diagnosed
gate: merge-gate
verdict: REJECTED
date: 2026-04-28
reviewer: Liz (Outlook desktop)
cutover_commit: 6fcd666
gap_closure_phase: 46.1
gap_closure_commits:
  - eaea038  # gap-1: defensive greeting strip + admin compose helper
  - 9b5cb08  # gap-2: formatDate/formatLongDate empty-input guard
  - 889477e  # gap-3: PLAN-AUTHORING-PATTERNS strengthening
  - f867da6  # gap-4: Outlook desktop dark-mode lock (data-ogsc/data-ogsb/MSO) -- INSUFFICIENT, see gap-7
  - 14dabb9  # gap-5: left-align Milestones + Procurement table cells -- regression introduced ETA mis-alignment, see gap-6
re_test_round_2: 2026-04-28  # round 2 surfaced gap-4 and gap-5; gap-1 visually confirmed fixed
re_test_round_3: 2026-04-29   # round 3 surfaced gap-6 (procurement layout) and gap-7 (Outlook Mac dark-mode persists); gap-1, gap-2, gap-5-light-mode-alignment visually confirmed fixed
updated: 2026-04-29
---

# Phase 46 — Outlook Desktop Merge-Gate UAT

The cutover commit `6fcd666 feat(46-03): cutover Send Update + Work Order to react-email (D-14)` is correct on the wires (verified by automated checks: 0 hits for legacy build helpers in `src/`, legacy files deleted, List-Unsubscribe header present on Send Update both branches and absent on Work Order per D-12, signed-token mint preserved per T-46-03-06). But the visual merge-gate in Outlook desktop surfaced three issues that block phase closure.

Liz triggered real test sends from staging on 2026-04-28 ~14:42 ET, captured eight viewport screenshots in Outlook desktop (light + dark mode for both templates, plus closer crops of the affected sections), and reviewed against the locked decisions in `46-CONTEXT.md`, `46-04-CONTEXT.md`, and the 46-MIGRATION-DIFF.md audit.

**Verdict: REJECTED at the merge-gate.** Three findings, two of which are real code bugs and one of which is an audit-completeness issue that masquerades as a code bug. All three resolve in gap-closure phase 46.1.

---

## Gaps

### gap-1 — Greeting double-render on SendUpdate

- **status:** resolved (commit `eaea038`, plan 46.1-01)
- **debug_session:** none — root cause read from code in this UAT, not a multi-cycle investigation
- **resolves_in:** 46.1 (single plan, code change + admin UX helper)

**What Liz saw:**

In the test send, the SendUpdate body opened with two consecutive "Hi Victoria," lines — one standalone, one inline as the first line of the personal-note paragraph. Visible in:
- `screenshots/01-outlook-dark-su-double-greeting.png` (dark mode, full upper viewport)
- `screenshots/02-outlook-dark-su-double-greeting-faded.png` (dark mode, partly faded — Outlook scroll-fade overlay)
- `screenshots/07-outlook-dark-su-upper-double-greeting.png` (dark mode, tighter crop on the greeting region)
- `screenshots/08-outlook-light-su-upper-double-greeting.png` (light mode, tighter crop on the greeting region)

**Mechanism:**

`src/emails/sendUpdate/SendUpdate.tsx:168` renders the structural `<Greeting>` component, which emits "Hi Victoria,". Then `<Body personalNote={personalNote} />` renders next at L169. The `personalNote` content Liz typed in the admin compose UI started with "Hi Victoria,\n\nJust an update on your project..." — habit carryover from the legacy template where personalNote was the entire visible body (including greeting) and there was no separate Greeting component.

The 46-04 redesign added a structural Greeting (D-29 register-aware signoff at the footer mirrored at the greeting). personalNote is now meant to be body-only. Nothing in the admin UI tells the user to drop the greeting line, and the email render doesn't defensively strip a leading "Hi {firstName}," from personalNote. Result: double greeting.

**Fix surface (covered by 46.1 plan):**

1. **Defensive strip at render** — in `src/emails/sendUpdate/Body.tsx` (or in `SendUpdate.tsx` before passing personalNote to Body), strip a leading `^Hi\s+\w+[,!]?\s*\n+` pattern. Tightly scoped — only the literal "Hi {Name},?" pattern that the structural Greeting component would have already rendered. Do NOT strip mid-paragraph greetings or other prose.
2. **Helper text in the admin compose UI** — add inline help under the personalNote field: "Don't include 'Hi {firstName}' — it's added automatically." Find the personalNote field in the SendUpdate compose UI (likely `src/components/admin/SendUpdateCompose*.tsx` — verify in 46.1 planning) and add the description.

Both, not either-or. Defensive strip is the safety net for past-and-future mistakes; helper text prevents the habit from re-forming.

**Out of 46.1 scope:** the admin UI placeholder copy is a small surface-area change but if a richer compose-UX redesign is needed (preview pane, character-count, markdown helpers), that's its own thread.

---

### gap-2 — "Invalid Date" rendered on procurement row when ETA is empty

- **status:** resolved (commit `9b5cb08`, plan 46.1-02)
- **debug_session:** none — root cause read from code in this UAT
- **resolves_in:** 46.1 (one-line guard in `formatDate` + parity guard in `formatLongDate`)

**What Liz saw:**

In the SendUpdate procurement section, three rows rendered ETAs:
- Custom Sectional Sofa — Kravet Crypton Fabric → ORDERED → **May 14**
- Handknotted Wool & Silk Rug — 9x12 → IN TRANSIT → **Apr 23**
- Italian Pendant Lights (set of 3) — Flos IC → PENDING ORDER → **`Invalid Date`**

The literal string "Invalid Date" rendered in the ETA cell of the third row. Visible in:
- `screenshots/05-outlook-dark-su-procurement-invalid-date.png` (dark mode)
- `screenshots/06-outlook-light-su-procurement-invalid-date.png` (light mode — clearer)

**Mechanism:**

The route's `adaptProjectForEmail()` at `src/pages/api/send-update.ts:109-113` maps the GROQ projection to the email shape:

```ts
procurementItems: (project.procurementItems ?? []).map((p) => ({
  name: p.name ?? "",
  status: (p.status as ProcurementStatus | undefined) ?? "ordered",
  eta: p.installDate ?? p.expectedDeliveryDate ?? "",
})),
```

When both `installDate` and `expectedDeliveryDate` are null/empty in Sanity (as they were for the Pendant Lights row in this test project), `eta` is `""`.

Then `src/emails/sendUpdate/SendUpdate.tsx:163` calls `formatDate(p.eta)`:

```ts
export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
```

`new Date("")` returns an invalid Date. `.toLocaleDateString(...)` on an invalid Date returns the literal string `"Invalid Date"`. JSX renders that string as-is.

**Fix surface (covered by 46.1 plan):**

```ts
export function formatDate(d: string | Date): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
```

Apply parity guard to `formatLongDate` at `SendUpdate.tsx:109` to prevent the same trap on call sites that use the long form.

**Test coverage:** add a test that calls `formatDate("")`, `formatDate(undefined as unknown as string)`, `formatDate("not-a-date")` and asserts each returns `""`. Same suite for `formatLongDate`.

**Display behavior after fix:** the Pendant Lights row's ETA cell renders empty (an empty `<span>`). That reads as "we don't know the ETA yet" — correct given Sanity has no date for it, and visually quieter than "Invalid Date".

---

### gap-3 — `PENDING ORDER` status pill: NOT a code bug, but two real meta-findings

- **status:** resolved (commit `889477e`, plan 46.1-03 — Finding 3a; Finding 3b explicitly deferred out of 46.1 scope)
- **debug_session:** none
- **resolves_in:** 46.1 (audit pattern strengthening — docs only) + a separate design conversation (re-toning `pending` to neutral) deferred outside 46.1

**What Liz saw:**

The PENDING ORDER pill on the Pendant Lights row rendered with peach/red chrome (`bg #FDEEE6 / text #9B3A2A / border #F2C9B8`). She flagged this as "off-palette" because the migration-diff audit at `46-MIGRATION-DIFF.md` listed only three pill colors — Ordered (blue), In Transit (amber), Delivered (green) — without disclosing closure of the enum. A fourth color reading as off-palette is the natural conclusion when the audit said "the canonical palette is these three."

**Diagnosis:**

`src/lib/procurement/statusPills.ts:17-50` defines **seven** canonical statuses:

```
scheduled  warehouse  in-transit  ordered  pending  delivered  installed
```

`pending` renders with the peach/red chrome by design — `STATUS_PILL_STYLES.pending = { bg: "#FDEEE6", text: "#9B3A2A", border: "#F2C9B8" }`. The render is correct per the canonical palette. There is no code regression here.

**The two real findings:**

**Finding 3a — audit completeness gap (mine, the orchestrator's).** The migration-diff audit at `46-MIGRATION-DIFF.md` listed only 3 of 7 status pill colors and described them as "the canonical palette" without asserting closure of the `ProcurementStatus` enum. That under-described the palette and let the audit ship with an unverified assumption. This is exactly the **load-bearing-assumption-failure pattern** added to `PLAN-AUTHORING-PATTERNS.md` at commit `3b1fc0f` two hours before this UAT. Applied to the audit (asking "ProcurementStatus enum is closed at 3 values? Verify."), it would have caught the under-description before approval. The orchestrator checked `MilestoneState` (2-valued, lossless) but did not apply the same discipline to `ProcurementStatus`. The pattern works; it just wasn't run everywhere it applied.

**Finding 3b — design observation (worth raising; out of 46.1 scope).** The `pending` pill (peach/red, in the warm-red family) sits directly above the terracotta CTA `#C4836A` (also warm-red) in any SendUpdate that contains a `pending` procurement row. Two prominent warm-red elements adjacent visually compete — the eye doesn't immediately know which is the action. Not a regression (the chrome was locked in `statusPills.ts` during 46-04 and consumed unchanged in 46-03). Worth a separate design conversation: should `pending` re-tone to gray/neutral so the CTA owns the warm-red emphasis? Defer to a 46-04 retro / 46-05 polish thread; not a 46-03 cutover fix and not a 46.1 gap-closure fix.

**Fix surface (covered by 46.1 plan):**

Strengthen the "Cheap verifications on load-bearing audit assumptions" pattern in `PLAN-AUTHORING-PATTERNS.md` to call out enum-closure verification more aggressively — explicitly state "apply to EVERY enum the audit references, not just the most prominent one" and add a checklist nudge at the top of structural-rewrite audit acceptance criteria.

---

### gap-4 — Outlook desktop dark-mode contrast inversion (round 2 — supersedes "Items NOT issues #1")

- **status:** resolved (commit `f867da6`, plan 46.1-04)
- **debug_session:** none — root cause read from EmailShell.tsx + known Outlook desktop behavior
- **resolves_in:** 46.1 (plan 46.1-04 — Outlook-specific CSS in EmailShell)
- **supersedes:** "Items NOT issues" #1 — the original 2026-04-28 14:42 ET review classified Outlook dark-mode auto-darken as "acceptable"; the round-2 re-test on 2026-04-28 ~16:53 ET reversed that call after seeing the real-world result.

**What Liz saw (round 2 re-test):**

In Outlook desktop dark mode, the SendUpdate body washed out — "Hi Victoria,\n\nWassup. This is your latest update." rendered as low-contrast cream-on-dark-gray, near-illegible. Outlook auto-darkened the cream `#FAF8F5` body background to dark gray but did NOT correspondingly invert the cream/stone-light text colors (which stayed near-light), collapsing the contrast ratio.

**Mechanism:**

`src/emails/shell/EmailShell.tsx:72-73` already declares `<meta name="color-scheme" content="only light">` and `<meta name="supported-color-schemes" content="light">`. New Outlook (web/M365) and Apple Mail respect those meta tags and skip auto-darken. **Outlook desktop ignores them** — it runs its own auto-darken pass via the `[data-ogsc]` (Outlook-Generated-Style-Color) and `[data-ogsb]` (Outlook-Generated-Style-Background) selector hooks, which only affect colors the email author hasn't explicitly locked through those same selectors. The result is a half-inverted color scheme: dark background + light text colors that were already light.

**Fix surface (covered by 46.1-04):**

Add Outlook-desktop-specific CSS to `EmailShell.tsx` `<Head>` that locks all text and background colors against the auto-darken pass:
1. `<style>` block with `[data-ogsc]` selectors re-pinning text colors to their light-mode values.
2. `[data-ogsb]` selectors re-pinning background colors to cream `#FAF8F5` and section backgrounds.
3. MSO conditional `<!--[if mso]><style>...</style><![endif]-->` block forcing `mso-color-scheme: light` for older Outlook desktop builds where data-ogs hooks don't reach.

Locked colors: cream `#FAF8F5` (body bg), `#2C2926` (dark text), `#4A4540` (mid text), `#8A8478` (stone-light), `#B8AFA4` (header label), `#E8DDD0` (cream-dark divider), terracotta `#C4836A` (SU CTA bg) and gold `#9A7B4B` (WO CTA bg). Plus pill chrome from `statusPills.ts` (7 backgrounds × 7 text × 7 borders).

This is "force light mode in Outlook desktop," not "design a dark variant." No new design tokens; existing palette stays as-is.

**Tests:** HTML inspection assertions that the rendered email contains the `[data-ogsc]` / `[data-ogsb]` selectors and the MSO conditional block. Visual confirmation requires re-test in Outlook desktop (round-3 merge-gate).

---

### gap-5 — Right-aligned date/ETA columns push content to far edge

- **status:** resolved (commit `14dabb9`, plan 46.1-05)
- **debug_session:** none — read directly from Milestones.tsx + Procurement.tsx
- **resolves_in:** 46.1 (plan 46.1-05 — column align changes)

**What Liz saw (round 2 re-test):**

In the Milestones section the dates ("Feb 17", "Mar 12", "Apr 9", "Apr 30") render flush against the right edge of the email card, far from their corresponding milestone names. Visually disconnected — the eye reads "Initial Consultation COMPLETE [long gap] Feb 17" as two separate things instead of one row. Same pattern applies to the Procurement ETA column, and the Status column's centered pill compounds the issue.

**Mechanism:**

- `src/emails/sendUpdate/Milestones.tsx:107` — `<Column align="right">` on the date column
- `src/emails/sendUpdate/Procurement.tsx:106,119` — `<Column align="right">` on ETA header + cells
- `src/emails/sendUpdate/Procurement.tsx:105,116` — `<Column align="center">` on Status header + cells

**Fix surface (covered by 46.1-05):**

Change all `align="right"` and `align="center"` to `align="left"` so all table cell content reads left-to-right with no right-anchored or centered cells. Specifically:
- Milestones date: `right` → `left`
- Procurement ETA header + cell: `right` → `left`
- Procurement Status header + cell: `center` → `left`

Snapshots regenerate. Visual confirmation manual via re-test.

---

### gap-6 — Procurement table layout: ETA cells not horizontally aligned across rows + first column too narrow

- **status:** failed
- **debug_session:** none — diagnosed from round-3 web-preview screenshot 2026-04-29
- **resolves_in:** 46.1 (round-3 plan, TBD slug)
- **surfaced_by:** round-3 re-test (light-mode web-preview render in admin compose UI). The gap-5 left-align swap landed correctly, but exposed a separate underlying layout problem the right-align state had visually masked.

**What Liz saw (round 3, web preview light mode):**

In the Procurement table the three rows have unequal heights because the Item column is too narrow:
- Row 1 "Custom Sectional Sofa — Kravet Crypton Fabric" wraps to 2 lines
- Row 2 "Handknotted Wool & Silk Rug — 9x12" fits on 1 line
- Row 3 "Italian Pendant Lights (set of 3) — Flos IC" wraps to 2 lines

Because each `<Column verticalAlign="middle">` centers its content against its own row, the ETA values "May 14", "Apr 23", and the row-3 cell sit at three different y-positions. The eye expects a clean ETA stripe but reads three offset values. The Status pill column has the same issue (PENDING ORDER pill visually clipped/shifted in row 3). Visual: the ETA column does not form a horizontal stripe across rows.

User additional ask: a bit more vertical margin above the Procurement section (current spacing reads tight against the Milestones section).

**Mechanism (preliminary, planner to verify):**

- `src/emails/sendUpdate/Procurement.tsx` — `<Column>` widths are not explicitly set; react-email distributes width evenly or by content-fit. With three columns and uneven content, Item gets squeezed.
- `<Column verticalAlign="middle">` (current) anchors each cell to its row's vertical center. With 2-line rows interleaved with 1-line rows, ETA cells form a zig-zag, not a stripe.
- Procurement section's outer `<Section style={...}>` has whatever marginTop the existing styles set; user wants more.

**Fix surface (covered by 46.1 round-3 plan):**

Two complementary knobs — both probably needed:

1. **Explicit column widths.** Set Item column wide enough to fit the longest realistic item-name + vendor sub-line on one line in the 600px email card. Status and ETA columns get narrower fixed widths matching their content. Tentative ratios (planner to confirm against fixture data): Item ~60%, Status ~22%, ETA ~18%, with `<Column width="60%">` etc. (react-email supports this via the `width` attribute or inline style.)
2. **`verticalAlign="top"` on row Columns.** Anchor each cell to the top of its row so when Item wraps to 2 lines, Status pill and ETA value sit at the row's top edge. ETA stripe stays horizontally aligned across rows even when rows have different heights.
3. **Increase marginTop above the Procurement `<Section>`.** Current value TBD by planner; bump it to a clearly-readable gap.

The combination: even if a future item name is genuinely too long for a 60% Item column, `verticalAlign="top"` guarantees the ETA stripe stays clean.

**Open questions for planning (Paul to answer in /gsd-plan-phase 46.1 --gaps):**

- (Q1) Hard column ratios (60/22/18) or planner-researched react-email-safe values?
- (Q2) Confirm `verticalAlign="top"` is the desired behavior (ETA value sits adjacent to the FIRST line of a wrapped Item name) — vs `bottom` or staying at `middle`.
- (Q3) Numeric value for the new Procurement marginTop (e.g. 32px, 40px) — or "match the Milestones-to-ReviewItems gap whatever that is".

**Tests:** snapshot regen + new section-scoped HTML inspection asserting `<col>` / `<td width=...>` widths are present on the Procurement columns, and that Item column has the largest declared width. Visual confirmation requires another round-4 re-test from Liz.

---

### gap-7 — Outlook (Mac) desktop dark-mode contrast inversion persists despite [data-ogsc]/[data-ogsb] lock

- **status:** failed
- **debug_session:** TBD — best-guess root cause is New-Outlook-for-Mac (or web-wrapper variant) using a different dark-mode pipeline than classic Windows Outlook desktop. Spike likely needed.
- **resolves_in:** 46.1 (round-3 plan, TBD slug) — possibly with research/spike step
- **supersedes:** none (extends gap-4; the [data-ogsc]/[data-ogsb]/MSO lock from 46.1-04 was insufficient)

**What Liz saw (round 3 re-test, 2026-04-29):**

In Outlook desktop dark mode, the SendUpdate body STILL renders as half-inverted: dark gray background, cream/beige text. The fix from 46.1-04 (commit `f867da6`) added `[data-ogsc]` text-color rules, `[data-ogsb]` background rules, and an MSO conditional, but the visual result is unchanged from round-2. The 19 EmailShell.test.ts assertions confirm the lock markers ARE in the rendered HTML — but Outlook is not honoring them.

Web-app preview (light mode in admin compose UI) renders correctly — confirming the source HTML is correct and only the email-client layer is the problem. Light-mode rendering in real Outlook is presumed correct (Liz's screenshot was dark-mode only); planner should confirm.

**Mechanism (best guess — to verify in spike):**

The `[data-ogsc]` and `[data-ogsb]` selector hooks are a CLASSIC OUTLOOK FOR WINDOWS technique. New Outlook for Mac (and the macOS Outlook web-wrapper, "the new Outlook" UX) appears to use a different dark-mode rendering pipeline that:

- Either doesn't paint the `data-ogsc`/`data-ogsb` attributes onto inline-styled elements (so our `[data-ogsc]` rules never match anything)
- Or applies its dark-mode CSS at a higher specificity than our `!important` rules
- Or uses a completely different selector hook that we haven't matched yet

Liz's screenshot title bar shows "Summarize" in a stylized button — that's a New Outlook for Mac UI signature, not classic Outlook for Windows. So we're fighting a different rendering engine than we targeted in 46.1-04.

**Fix surface (covered by 46.1 round-3 plan, requires research/spike first):**

Likely candidates (planner to research and lock):

1. **Force background paint at the body/wrapper level.** Instead of relying on inline styles being preserved, paint the cream `#FAF8F5` background via a top-level `<table bgcolor="#FAF8F5">` or `<div style="background:#FAF8F5">` wrapper that Outlook Mac cannot easily override. This is the "Outlook Mac dark-mode survival" pattern documented in HTML-email community sources.
2. **Add CSS media query for `prefers-color-scheme: dark`** with explicit overrides matching the locked palette. Some Outlook variants honor `@media (prefers-color-scheme: dark)` even when they ignore `color-scheme: only light`.
3. **Add `class~="email-shell"` selectors with `!important`** as a third selector path that may match where `[data-ogsc]` doesn't.
4. **Investigate New-Outlook-Mac-specific quirks** — e.g. whether it strips `<style>` blocks in `<head>` (in which case all our locks are dead before they execute), and whether body-level `style="background:#X"` survives as an inline attribute when class-level CSS doesn't.

**Open questions for planning (Paul to answer in /gsd-plan-phase 46.1 --gaps):**

- (Q4) Outlook desktop on Mac, Windows, or both? The screenshot shows New Outlook for Mac UI; need to confirm whether the same fix needs to also work on Windows classic Outlook (where 46.1-04's lock probably IS sufficient).
- (Q5) Is investing more in defeating Outlook-Mac dark-mode worth it for round-3, or do we accept that "half-inverted but still legible" is the floor and document it as a known-limitation?
- (Q6) If we DO push back, is a spike (research + prototype) required before the fix plan, or can the planner draft a fix plan straight from a literature review?

**Tests:** depends on fix path. If we add a `<div bgcolor>` wrapper, automated tests assert the wrapper exists in rendered HTML for both SendUpdate and WorkOrder. Visual confirmation requires another round-4 Liz re-test in Outlook for Mac dark mode (and possibly Outlook for Windows for cross-check).

---

## Items NOT issues (confirmed correct after viewing screenshots)

These were checked against the redesign decisions and verified correct in the screenshots — included here so a future reader doesn't re-flag them as bugs:

1. ~~**Outlook dark-mode rendering.** Outlook desktop auto-darkened the cream `#FAF8F5` body background to dark gray in dark mode (visible in screenshots 01, 02, 05, 07; light-mode comparison in 06, 08). This is Outlook's `aw-darkmode` behavior, not a template bug. Both modes render legibly; the cream-on-dark inversion is acceptable.~~ **REVERSED 2026-04-28 round 2 — see gap-4 above.** The round-1 "acceptable" call did not survive contact with the real-world re-test; the half-inversion (dark bg + still-light text colors) is unreadable, not just inverted. Now treated as a real bug, fixed in 46.1-04.
2. **Work Order rendering** (`screenshots/03-outlook-dark-wo-default.png`, `04-outlook-light-wo-default.png`).
   - Greeting "Marco," renders single ✓
   - Body copy "Your work order for Gramercy Park Apartment is ready. Use the link below to view the latest version — it always reflects our most recent edits." renders correctly ✓
   - CTA "VIEW WORK ORDER" with gold `#9A7B4B` background, cream-light text, rounded-2px corners ✓ (D-19 — gold for WO, terracotta for SU)
   - Footer "Elizabeth · Darien, CT" — casual register, byte-identical to legacy ✓ (D-29 carryover)
   - "Sent via Sprezza Hub" attribution present ✓ (Phase 45.5 D-2)
   - No layout collapse, no horizontal scroll ✓
3. **SendUpdate CTA "OPEN PORTAL" terracotta `#C4836A`.** Renders correctly per 46-04 D-19 (visible in screenshots 05, 06).
4. **SendUpdate footer formal register "Elizabeth Lewis · Darien, CT".** Renders correctly per 46-04 D-29 (visible in screenshots 05, 06).
5. **"You can reply to this email directly." reply-affordance line.** Present below the CTA per 46-04 D-9 (visible in screenshots 05, 06).
6. **Milestone state pills "COMPLETE" / "UPCOMING" with strikethrough on completed rows.** Renders correctly per 46-04 D-10 (visible in screenshots 01, 07, 08 — Initial Consultation and Concept Presentation strikethrough COMPLETE; Design Development Review hollow UPCOMING).
7. **Procurement vendor sub-lines.** Custom Sectional Sofa shows "Kravet Crypton Fabric" sub-line; Handknotted Wool & Silk Rug shows "9x12" sub-line — D-14 vendor/spec composition rendering correctly (visible in screenshots 05, 06).

---

## Resolution path

**Phase 46.1 — Merge-gate gap closure.** Three plans, all small:
- `46.1-01` — gap-1 fix (greeting double-render: defensive strip + admin UI helper)
- `46.1-02` — gap-2 fix (formatDate / formatLongDate guard for empty/invalid input)
- `46.1-03` — gap-3 fix (PLAN-AUTHORING-PATTERNS.md strengthening for enum-closure verification)

After 46.1 commits, re-trigger the Outlook desktop merge-gate (this UAT artifact replays — Liz sends new test emails, captures new screenshots, validates the three findings are gone). On a second `approved` reply, plan 46-03 closes properly with SUMMARY.md, EMAIL-01..03/06/07 close in REQUIREMENTS.md, and Phase 46 closes.

**Out of 46.1 / deferred:** the design conversation about re-toning `pending` palette away from the warm-red family. Not blocking phase 46 closure. Open as a future polish or a 46-04 retro item.

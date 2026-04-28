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
updated: 2026-04-28
---

# Phase 46 — Outlook Desktop Merge-Gate UAT

The cutover commit `6fcd666 feat(46-03): cutover Send Update + Work Order to react-email (D-14)` is correct on the wires (verified by automated checks: 0 hits for legacy build helpers in `src/`, legacy files deleted, List-Unsubscribe header present on Send Update both branches and absent on Work Order per D-12, signed-token mint preserved per T-46-03-06). But the visual merge-gate in Outlook desktop surfaced three issues that block phase closure.

Liz triggered real test sends from staging on 2026-04-28 ~14:42 ET, captured eight viewport screenshots in Outlook desktop (light + dark mode for both templates, plus closer crops of the affected sections), and reviewed against the locked decisions in `46-CONTEXT.md`, `46-04-CONTEXT.md`, and the 46-MIGRATION-DIFF.md audit.

**Verdict: REJECTED at the merge-gate.** Three findings, two of which are real code bugs and one of which is an audit-completeness issue that masquerades as a code bug. All three resolve in gap-closure phase 46.1.

---

## Gaps

### gap-1 — Greeting double-render on SendUpdate

- **status:** failed
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

- **status:** failed
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

- **status:** failed (mis-classified as bug; actual fix is documentation + design)
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

## Items NOT issues (confirmed correct after viewing screenshots)

These were checked against the redesign decisions and verified correct in the screenshots — included here so a future reader doesn't re-flag them as bugs:

1. **Outlook dark-mode rendering.** Outlook desktop auto-darkened the cream `#FAF8F5` body background to dark gray in dark mode (visible in screenshots 01, 02, 05, 07; light-mode comparison in 06, 08). This is Outlook's `aw-darkmode` behavior, not a template bug. Both modes render legibly; the cream-on-dark inversion is acceptable.
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

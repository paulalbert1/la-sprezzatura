# 46-04 Redesign Context

This file captures the locked decisions for **Plan 46-04 — SendUpdate Visual Redesign (supersedes 46-02)**, hashed out in conversation 2026-04-27. Decisions here are scoped to the redesign only — phase-level decisions live in `46-CONTEXT.md` (D-1..D-20). When this plan or a future plan needs to reference these, prefix with `46-04 D-N` (or just `D-N` when context is clear).

## Provenance

The design language captured here was iterated across five rounds of agent / user dialogue on 2026-04-27. The user supplied an HTML mockup mid-dialogue; the agent surfaced architecture findings (no anchor-scrollable section IDs in the portal, route shape mismatch, auto-derived `pendingArtifacts` is not designer prose, configurable From address means body copy can drift) that reframed several of the user's initial proposals. The decisions below reflect the converged-on path after those findings.

## Scope boundary

This plan ships **the visual redesign and the data-shape additions** for SendUpdate. It does NOT ship:
- Preference store, HMAC token infrastructure, `POST /api/unsubscribe`, RFC 8058 `List-Unsubscribe` header (Plan 46-03 owns the header; the unsubscribe machinery is a future phase)
- `/portal/preferences` page or stopgap anchor
- Send-time preference gating in `send-update.ts`
- "Action Items as portal entity" — Sanity `actionItem` schema, portal section component, admin compose UX
- Per-action-item portal deep-links (route changes, query-param redirect, anchor scrolling on `[projectId].astro`)
- Token-scoped `recipient_id` concept
- Compose-UI extensions to admin to populate `personalActionItems` over the wire (the field arrives in a separable UI plan; v1 API call sites pass `[]`)

These are deferred to v2 / future phases. v1 leans on **graceful no-op** for everything not yet built: empty action-item arrays render no rows, an empty review section is omitted entirely, and the auto-derived `pendingArtifacts` path (already in production) is preserved unchanged.

---

## Decisions

### Composition

**D-1: Plan 46-04 supersedes Plan 46-02.**
This is a rewrite at the SendUpdate level, not a revision. Code review evaluates the new components on their own terms, not as diffs against 46-02's output. The shell primitives (`EmailShell`, `EmailButton`, `Preheader`), `tenantBrand.ts` constants, `fixtures.shared.ts`, and the fixture/snapshot/plain-text infrastructure carry forward unchanged. The composition root (`SendUpdate.tsx`), all five legacy section components, and all six legacy fixtures are rewritten.

**D-2: Section order — Body → ReviewItems → Milestones → Procurement → CTA → Footer.**
Top to bottom inside `<EmailShell>`'s `children` slot:
1. Greeting (eyebrow already comes from the shell, then H1 + project sub-line + first greeting line — Greeting.tsx)
2. Body (multi-paragraph authored prose, markdown-rendered — Body.tsx)
3. ReviewItems ("For your review" — designer prose first, auto-derived artifacts second — ReviewItems.tsx)
4. Milestones (Milestones.tsx with new `state` field)
5. Procurement (Procurement.tsx with status pills + sub-line)
6. CTA + reply-affordance line (rendered by the shell's `cta` slot + a sibling line below)
7. Footer (rendered by the shell — three lines, no manage-updates link)

The Action Items section moving above Milestones (mockup ordering) is the load-bearing UX choice — Sarah needs the action items above the fold, the milestones are background state.

**D-3: ReviewItems merges designer-typed action items with auto-derived unapproved artifacts.**
Designer prose rows render first (intentional, dated, high-signal). Auto-derived rows render second (informational, undated, "by the way" content). Empty-both → section omitted entirely. No "Nothing to review this week ✨" empty state — that violates the design language.

**D-4: Action-item rows do NOT render `<a>` deep-link wrappers in v1.**
The portal has zero anchor-scrollable section IDs today, no `actionItem` schema, no per-section semantic anchors. Direct deep-links would 302 to login (no PURL session yet). v1 ships informational rows: terracotta square + label + optional due date in right column. Per-section deep-linking is deferred to a future "Action Items as portal entity" phase.

### Body copy

**D-5: Body authored as constrained markdown subset.**
Allowed tokens: `**bold**`, `_italic_`, `[label](url)`, blank-line paragraph breaks. No headings, no lists, no images, no code, no inline HTML. URL scheme allowlist: `https:` only (defense-in-depth even though authoring is internal — protects against operator error or pasted-from-elsewhere malicious URLs).

**D-6: `personalNote` is a REQUIRED prop on SendUpdate input.**
No silent defaults. Pass `""` to opt out — that's a deliberate choice the call site has to make. Required-with-empty-string-as-no-op forces the call site to make a decision; optional-with-default-empty-string lets call sites silently omit and gives no compile-time signal. TypeScript catches forgotten props at build time.

**D-7: Markdown serializer auto-wraps single-paragraph plain-text input.**
Forward-migration of legacy `personalNote: string` plain-text values: if input contains no markdown tokens AND no `\n\n`, wrap as a single paragraph block and emit. No exception path. Existing send call sites continue to work with their plain-text values until they're updated to write markdown.

**D-8: 600-char hard cap enforced at the serializer.**
Over-length input throws `PersonalNoteParseError('OVER_LIMIT', ...)`. Compose UI MUST enforce a matching cap before send (separable UI plan). The compose helper catches and re-throws the error with diagnostic context so the caller surfaces it as a usable error rather than a 500.

### Reply-affordance copy

**D-9: Body reply-affordance copy is the literal string `"You can reply to this email directly."`**
True regardless of which address `From` resolves to at send time. NEVER "come straight to me" or "reach the studio" — those phrasings are From-dependent and create silent credibility breaks when configuration drifts. Sits below the CTA, not above (below reads as a quiet PS; above competes with the CTA for attention).

### Milestones

**D-10: Milestone state field — `'completed' | 'upcoming'`.**
Each milestone row now carries an explicit state. Completed: filled stone-token square indicator + strikethrough title + "COMPLETE" pill. Upcoming: outlined square indicator (1px border `#D4C9BC`, transparent fill) + non-strikethrough title + "UPCOMING" pill.

**D-11: Unicode `○` glyph forbidden everywhere in the SendUpdate tree.**
Every status indicator is a styled `<span>` element. Ring-shaped indicators use a 1px CSS border on a transparent-fill `<span>`, never the `○` character. (Carries Phase 46 D-2 forward — round dots remain forbidden — and extends it: ring shapes also live as styled DOM, not glyphs.)

### Procurement

**D-12: Procurement status pills — canonical palette from `ProcurementEditor.tsx`.**
The full status enum (scheduled, warehouse, ordered, in-transit, pending, delivered, installed) maps to pill chrome:
- ordered:    bg `#E8F0F9` / text `#2A5485` / border `#B0CAE8` (blue)
- in-transit: bg `#FBF2E2` / text `#8A5E1A` / border `#E8CFA0` (amber)
- delivered:  bg `#EDF5E8` / text `#3A6620` / border `#C4DBA8` (green, light border)
- installed:  bg `#EDF5E8` / text `#3A6620` / border `#A8C98C` (green, deeper border)
- scheduled:  bg `#F3EFE9` / text `#6B5E52` / border `#E0D5C5` (warm gray)
- warehouse:  bg `#F3EDE3` / text `#6B5E52` / border `#D4C8B8` (warm gray)
- pending:    bg `#FDEEE6` / text `#9B3A2A` / border `#F2C9B8` (terracotta-ish)

Pill chrome: 11px font-weight-600 uppercase 0.06em tracking, padding 3px 10px, border-radius 2px (longhand only — Phase 46 D-3 carries forward), 0.5px border. Email Procurement.tsx must support all seven states to render arbitrary procurement items.

**D-13: Procurement palette extracted to a shared module — `statusPills.ts` IS the canonical source.**
Create `src/lib/procurement/statusPills.ts` exporting `STATUS_PILL_STYLES`, `STATUS_LABELS`, `PROCUREMENT_STATUSES`, `ProcurementStatus`. Both `src/components/admin/ProcurementEditor.tsx` AND the new `src/emails/sendUpdate/Procurement.tsx` import from it. Single source of truth — palette drift between admin UI and email render is structurally prevented. The admin file's existing inline definitions are removed in the same task (real extraction, not "copy added, original kept").

**Module shape constraints (load-bearing):**
- Exports raw values only — hex strings, no Tailwind classNames, no React-specific types beyond the data + type union. Both consumers (admin UI Tailwind-coupled, email inline-styles-coupled) consume the same raw values via different rendering paths.
- Lives at `src/lib/procurement/statusPills.ts` as **leaf code** — zero imports from `src/components/`, `src/emails/`, or anywhere else in the codebase. Everything imports from it.
- Has its own unit test at `src/lib/procurement/statusPills.test.ts` — see D-30 for the test premise.

**Acceptance criteria for the extraction (real, not nominal):**
```bash
grep -q "from.*lib/procurement/statusPills" src/components/admin/ProcurementEditor.tsx
! grep -E "STATUS_PILL_STYLES\\s*=" src/components/admin/ProcurementEditor.tsx
```
If both pass, the extraction is real. If only the first passes, the original inline definition is still present and drift is reintroduced. The "no behavioral change to admin UI" claim verifies via existing `ProcurementEditor.test.tsx` passing unchanged.

**D-14: Procurement sub-line composition rule.**
Render `vendor + " · " + spec` if both present. Render either alone if only one. Omit the sub-line entirely (no empty `<span>`) if both are null/empty. Mixed-mode rendering across rows must look intentional row-by-row — the section will routinely have rows with sub-lines and rows without, and the visual rhythm holds (rows shorten without misalignment).

### Sanity schema

**D-15: `vendor` and `spec` fields on `procurementItem` (inline type).**
- `vendor: string` (optional, no length validation; vendor names are bounded by reality)
- `spec: string` (optional, `Rule.max(50)` hard cap; over-50 typed in studio surfaces inline validation error — designers see the cap, no soft-cap-with-no-counter footgun)

Both fields carry an explicit `description` identifying them as email-facing. Both belong to a Sanity field group `email` (added to the inline type's `groups` array if not present). No data migration required — both optional; existing items render with sub-line omitted.

### Subject + transport

**D-16: Subject line owned by `composeSendUpdateEmail()` in `src/emails/sendUpdate/compose.ts`.**
Pattern: `Project update — ${project.title || client.name}`. Em dash (U+2014). Sentence-case "update" (per the design system locale rule). Project name only — no date, no week number, no "Weekly" prefix. Falls back to `client.name` only if `project.title` is missing or empty (preserves the legacy fallback shape so projects without titles don't ship `Project update — undefined`).

Subject is a presentation concern; it lives co-located with the template. The API route does NOT inline the subject string — it calls the helper and reads `subject` off the returned object.

**D-17: Reply-To never set explicitly.**
Resend's default behavior leaves `Reply-To` unset, which causes mail clients to default replies to the From header. The compose helper does NOT call `reply_to` on the `resend.emails.send` payload — that's a wiring concern and stays out of the helper's contract.

**D-18: From address resolution unchanged.**
Plan 46-04 does not modify `from` resolution. The current API logic (`siteSettings.defaultFromEmail` → `RESEND_FROM` env → `"office@lasprezz.com"`) carries forward unchanged. The compose helper takes `fromAddress: string` as input — the API resolves it and passes it through. Body reply-affordance copy (D-9) is true regardless of which address is resolved.

### CTA

**D-19: Single CTA, label `Open Portal`.**
Rendered uppercase with tracking-widest per the design language. URL: `${baseUrl}/portal/client/{client.portalToken}` — unchanged from today's PURL pattern. Color: terracotta `#C4836A` background, cream-light `#FAF8F5` foreground. Padding `14px 32px`. Border-radius longhand `2px` (Phase 46 D-3 carries forward). Below the CTA, a 12px stone-token line with the literal D-9 reply-affordance copy.

### Footer

**D-20: Three-line footer, NO "manage updates" link in v1.**
Centered, hairline `<hr>` above (0.5px cream-dark border-top). Three lines:
1. Signature in Cormorant Garamond 14px charcoal-light, 0.02em tracking, 4px bottom margin — the value depends on `signoffStyle` (D-29). For SendUpdate (`formal`): `Elizabeth Lewis`. For WorkOrder (`casual`): `Elizabeth`.
2. `La Sprezzatura · Darien, CT` — DM Sans 10px stone-token uppercase 0.08em tracking
3. `Sent via Sprezza Hub` — DM Sans 10px stone-light 0.06em tracking, 12px top margin (Phase 45.5 D-2 attribution byte-identical — verified by snapshot test)

When the v2 preference store ships, line 3 grows inline to `Sent via Sprezza Hub · manage updates`. v1 does NOT touch line 3.

### Signature register (TenantBrand schema)

**D-29: TenantBrand carries both formal and casual signoff names; EmailShell selects via `signoffStyle` prop.**
SendUpdate is a client communication — formal register (full name, serif signature is doing brand-mark work). WorkOrder is a transactional contractor email with an existing working relationship — casual register (first name, matches the "Marco," greeting cadence in the body). One field can't carry both registers without coupling the two emails' tone to each other.

Schema change to `src/lib/email/tenantBrand.ts`:
```ts
export interface TenantBrand {
  wordmark: string;
  signoffNameFormal: string;   // "Elizabeth Lewis" — used by SendUpdate (signoffStyle="formal")
  signoffNameCasual: string;   // "Elizabeth"        — used by WorkOrder (signoffStyle="casual")
  signoffLocation: string;
}
export const LA_SPREZZATURA_TENANT: TenantBrand = {
  wordmark: "LA SPREZZATURA",
  signoffNameFormal: "Elizabeth Lewis",
  signoffNameCasual: "Elizabeth",
  signoffLocation: "Darien, CT",
};
```

EmailShell gains a closed-enum prop `signoffStyle?: "formal" | "casual"` (default `"casual"` — preserves WorkOrder's existing render byte-identical when SendUpdate explicitly opts into `"formal"`). The shell renders `tenant.signoffNameFormal` if `signoffStyle === "formal"`, else `tenant.signoffNameCasual`.

**Closed-enum policy (load-bearing):** the only valid values are `"formal"` and `"casual"`. Adding a third register requires a TenantBrand schema addition (e.g., `signoffNameWarm`) AND an EmailShell type extension. Don't grow the enum without growing the type. If a future plan needs a third register, that's a separable schema change — flag it, don't paper over with a string cast.

WorkOrder snapshot regenerates as a side effect of the field rename — but the rendered output is byte-identical (same string, just selected via a different field). The snapshot diff should show no semantic change, only a field-name update in any test fixture that asserts the tenant shape directly.

`fixtures.shared.ts`'s `SAMPLE_TENANT` mirrors the new shape:
```ts
export const SAMPLE_TENANT: TenantBrand = {
  wordmark: "LA SPREZZATURA",
  signoffNameFormal: "Elizabeth Lewis",
  signoffNameCasual: "Elizabeth",
  signoffLocation: "Darien, CT",
};
```

### File deletions

**D-21: ActionItems.tsx and PendingArtifacts.tsx deleted in the SAME commit as the new SendUpdate.tsx composition.**
Atomic delete-and-replace, mirror of Plan 46-03 D-14's atomic-rewire-and-delete pattern. No transitional state where both old and new section components coexist. Same task in the plan.

### Test strategy

**D-22: Five representative snapshot fixtures.**
Down from 46-02's six. Locked names:
- `full` — every section populated, 3-paragraph body markdown including one bold token and one inline link, 2 designer action items, 2 auto-derived pending artifacts, 3 procurement rows with full vendor+spec on each, 2 completed + 2 upcoming milestones
- `noReviewItems` — empty `personalActionItems` AND empty `pendingArtifacts`
- `noProcurement` — empty `procurementItems` AND `showProcurement: false`
- `noBody` — `personalNote: ""`
- `mixedSubLines` — 3 procurement rows: row 1 has both vendor+spec, row 2 has vendor only, row 3 has neither

**D-23: Snapshot-the-typical + behavioral-tests-for-variants.**
Snapshot the five fixtures once each. Cardinality variants (per-status pill rendering, per-state milestone rendering, sub-line presence by data shape, markdown edge cases, length cap enforcement, URL scheme rejection) are tested with explicit `it()` blocks asserting DOM presence/absence — NOT by adding more snapshot fixtures. Avoids the 30+-snapshot bloat that "snapshot every combination" would produce.

**Maintenance policy (load-bearing — protects the cap under future change):**

When a bug surfaces a rendering edge case six months from now, the natural instinct is to add a fixture and snapshot it. Don't. The cap of five fixtures is load-bearing for review process, not just repo size — six snapshots are reviewable in one sitting; thirty are not, and reviewers rubber-stamp the diff once cardinality climbs.

- **Bug-driven test cases land as `it()` blocks** with behavioral assertions (`expect(html).toContain(...)`, `expect(html).not.toContain(...)`, `indexOf` comparisons). Same shape as D-24's ordering assertion. The bug-fix commit adds the test alongside the code change.
- **New fixtures only land when an entire CATEGORY of rendering is uncovered** by the existing five. Examples that would justify a sixth fixture: a fundamentally new section component, a different shell layout (e.g., a "minimal" SendUpdate variant for warranty claims), a new email type entirely. Examples that should NOT add fixtures: "this specific data shape repros a bug", "designer asked for a preview of weeks where everything is delivered", "we added a new procurement status".
- **Snapshot review etiquette:** a snapshot diff is the reviewer's job to verify against the intended change. If a PR's snapshot diff is large enough that the reviewer can't visually trace each character to a code change, the PR is too big — split it, or document the diff narrative explicitly in the PR body. Six snapshots fit on one screen; thirty don't.

The cap is a structural lever for review attention, not a performance optimization. Erode it and the snapshot review degrades from "verify the diff" to "approve the diff." Hold the line.

**D-24: Behavioral tests MUST include explicit ordering assertion for ReviewItems.**
Given populated `personalActionItems` AND `pendingArtifacts`, the rendered HTML contains designer-row identifying strings before auto-derived-row identifying strings (string `indexOf` comparison; designer indexOf < artifact indexOf). This is the failure mode that's easiest to get backward and easiest to miss in snapshot review.

**D-25: `containsTokenColor()` round-trip required for cream + terracotta + stone tokens.**
Phase 46 D-18 helper carries forward. Anchor colors for SendUpdate are cream (background), terracotta (accent — replaces 46-02's gold), and stone (text). Gold remains the WorkOrder anchor — unchanged.

**D-26: Plain-text snapshot exists for the `full` fixture only.**
Produced ONLY by `render(component, { plainText: true })` — Phase 46 D-8 carries forward. Never hand-rolled string concatenation.

### Forward-compat housekeeping

**D-27: Portal section IDs added forward-compat.**
Add `id="milestones"` to the root `<section>` of `MilestoneSection.astro`, `id="procurement"` to `ProcurementTable.astro`, `id="artifacts"` to `ArtifactSection.astro`. Pure markup additions. NOT consumed by any v1 email (single-CTA pattern, no deep-links). Removes a prerequisite from the future "Action Items as portal entity" phase. Five-minute change while the file is open is cheaper than coming back later.

### Spec / code reconciliation

**D-30: DESIGN-SYSTEM.md procurement palette reconciles toward production code (path 2).**
DESIGN-SYSTEM.md and `ProcurementEditor.tsx` currently disagree on the Pending row, and DESIGN-SYSTEM.md is missing the `scheduled` status that ships in production:
- Pending in DESIGN-SYSTEM.md: `bg #F3EDE3 / text #9E8E80 / border #E8DDD0` (muted warm-stone)
- Pending in production (ProcurementEditor.tsx): `bg #FDEEE6 / text #9B3A2A / border #F2C9B8` (alarming red on tinted bg — this is a deliberate "needs attention" design choice)
- `scheduled`: shipped in production, undocumented in spec

Reconciliation direction: **code is truth.** Production's alarming-red Pending pill reads as a real design choice (deliberate "needs attention" signal); DESIGN-SYSTEM.md's muted version looks like inertia from the warehouse palette. Reverse-engineering production to satisfy a stale doc is the wrong direction.

Plan 46-04 updates `.planning/DESIGN-SYSTEM.md`:
1. Pending row hex values → match `statusPills.ts`
2. Add `scheduled` row with the production hex values
3. Replace the section's `> **Important:**` callout with a precedence pointer:
   > Source of truth: `src/lib/procurement/statusPills.ts`. The hex values below are mirrored from that module for designer reference. **If this table disagrees with `statusPills.ts`, the module is correct — update this file.**

The precedence comment is prose-level pinning (not infrastructure) but unambiguously establishes which file wins when they drift again. A future plan can promote it to a generated artifact if drift recurs.

**D-31: `statusPills.test.ts` asserts properties, not identity-with-spec.**
The test sits at `src/lib/procurement/statusPills.test.ts` and asserts what actually matters — completeness, accessibility, structural integrity — rather than identity-with-DESIGN-SYSTEM.md (which is now circular: DESIGN-SYSTEM.md mirrors `statusPills.ts`, so asserting they agree just asserts the file matches itself).

Four assertions:
1. **Enum completeness.** Every member of `PROCUREMENT_STATUSES` has a `STATUS_PILL_STYLES` entry AND a `STATUS_LABELS` entry. Catches "added a status to the enum, forgot to give it colors or a label" — the highest-value structural assertion.
2. **WCAG AA contrast (4.5:1 for normal text).** For each status, the `text` color on the `bg` color must meet AA. Tiny inline contrast-ratio helper using relative-luminance math (no dependency). Catches "designer changed a color and broke accessibility silently."
3. **Border darker than background (relative luminance).** For each status, `relativeLuminance(border) < relativeLuminance(bg)` — the pill should have a perceivable edge. Soft assertion but cheap. Catches "border accidentally lighter than bg, pill loses its edge."
4. **Snapshot of the full palette object.** Vitest `toMatchSnapshot()` against `STATUS_PILL_STYLES`. Pinning current values means future hex changes are intentional diffs the reviewer must approve, not silent drifts. This snapshot replaces the discarded "values match DESIGN-SYSTEM.md" assertion — cosmetic drift is now caught here, while the spec table mirrors via D-30's precedence rule.

The "extraction prevents drift" promise is reframed: meaningful drift (accessibility regressions, missing statuses, structural integrity) is caught by D-31 assertions; cosmetic drift is caught by the palette snapshot. DESIGN-SYSTEM.md mirrors via documentation discipline (D-30 precedence pointer) — not via test coupling.

### Dependency on Plan 46-03

**D-28: Plan 46-03 re-sequenced after 46-04 verifies.**
Plan 46-03 (the cutover) is currently parked at Checkpoint 1 with one commit (`c9ef35b`: D-16 diff script + audit). The audit captures the legacy → 46-02-version-of-new diff and is now stale. Once 46-04 ships:
1. Plan 46-03's frontmatter `depends_on` flips from `[46-01, 46-02]` to `[46-01, 46-04]`. `wave` flips from `3` to `4`.
2. Re-run `npx vite-node --config vitest.config.ts scripts/_phase46-diff-old-vs-new.ts` to regenerate paired HTML files.
3. Update `46-MIGRATION-DIFF.md` with the new audit.
4. Replay D-16 Checkpoint 1 hand-review against the new diff.
5. Then proceed with Plan 46-03's cutover unchanged: rewire `send-update.ts` to call `composeSendUpdateEmail()` (NEW seam from 46-04), wire RFC 8058 List-Unsubscribe (still 46-03's scope), delete legacy files, run Outlook merge-gate.

The cutover semantics don't change with the redesign — only the rendered HTML being cut over.

---

## Cross-references

- **Phase 46 decisions** (`46-CONTEXT.md` D-1..D-20): D-1 (table-safe rewrite), D-2 (round dots forbidden), D-3 (longhand border-radius only), D-7 (EmailShell prop shape), D-8 (plainText render only), D-13 (preheader at call site), D-14 (atomic delete-and-replace pattern), D-15 (test colocation), D-17 (vite-node spec script), D-18 (containsTokenColor helper), D-20 (targeted snapshots not loops) — all inherited.
- **Phase 45 decisions** (`.planning/phases/45-email-foundations/45-CONTEXT.md`): D-7 (rgb-vs-hex color normalization is the new baseline) — inherited, accepted.
- **Phase 45.5 decisions** (`.planning/phases/45.5-platform-rename/45.5-CONTEXT.md`): D-2 ("Sent via Sprezza Hub" attribution wording) — inherited, footer line 3 is byte-identical.

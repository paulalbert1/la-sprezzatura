---
phase: 47
slug: portal-layout-hoist
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-30
reviewed_at: 2026-04-30
---

# Phase 47 — UI Design Contract

> Visual and interaction contract for the Portal Layout Hoist. Extracts portal chrome (header, footer, banner slot) into `PortalLayout.astro` + new `PortalHeader.astro` + `PortalFooter.astro`. All values anchor on existing portal tokens — this phase introduces NO new design primitives.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (shadcn not used in this repo) |
| Preset | not applicable |
| Component library | none (Astro components + Tailwind 4 utility classes) |
| Icon library | none used in PortalHeader/PortalFooter (text-only chrome) |
| Font | `--font-heading` Cormorant Garamond (serif, headings only); `--font-body` DM Sans (sans, all chrome text) |

**Source of truth for tokens:** `src/lib/brand-tokens.ts` → generated into `src/styles/_generated-theme.css` (Phase 45 D-5). Tailwind 4 `@theme` directive exposes `--color-*`, `--font-*`, `--spacing-*` as utility classes.

**Portal aesthetic anchor (locked, do not redesign in this phase):** cream background (`bg-cream`), generous whitespace, tiny letter-spaced uppercase wordmark, no admin-style chrome bands, no border-bottoms on header. Existing portal pages already use this language — extraction must preserve it byte-for-byte where possible.

---

## Spacing Scale

Standard 4-multiple scale. PortalHeader + PortalFooter consume only the values listed below. No custom spacing introduced this phase.

| Token | Value | Usage in this phase |
|-------|-------|---------------------|
| xs | 4px | (not used by chrome) |
| sm | 8px | Vertical gap between wordmark and role sub-label (`mt-2` / 8px); footer `mt-2` between displayName line and contactEmail |
| md | 16px | Horizontal padding inside header on mobile (`px-4`); top padding of footer (existing `py-8` body, `mt-2` line gap) |
| lg | 24px | Horizontal padding inside header on tablet+ (`px-6` matches existing portal page `px-6`); footer vertical padding (`py-8` ≈ 32; closest scale slot is xl) |
| xl | 32px | Header top padding (`pt-8` / 32px) and bottom padding (`pb-6` / 24px → asymmetric: looser at top to breathe under the viewport edge); footer total vertical breathing room (`py-8`) |
| 2xl | 48px | Reserved for body content (existing pages use `py-12`/`py-20` for main content) — **chrome does not consume 2xl** |
| 3xl | 64px | Not used in chrome |

**Header layout spacing (locked):**

- Outer header padding: `px-6 pt-8 pb-6` on tablet/desktop (≥768px); `px-4 pt-6 pb-4` on mobile (<768px)
- Wordmark → role sub-label gap: `mt-2` (8px) — sub-label sits directly below wordmark
- Sign-out button → top of header: vertically aligned with wordmark baseline (top-align on flex row)
- Banner slot → header gap: ZERO (banner is sticky to top of body, header sits below it in normal flow)

**Footer layout spacing (locked, unchanged from current inline footer):**

- `mt-auto py-8 text-center` — pushes to bottom via flexbox `min-h-screen flex flex-col`, 32px vertical breathing
- `mt-2` (8px) between `displayName • Interior Design` line and contactEmail line

**Banner slot positioning (locked):**

- Sticky `top-0 z-50` (matches the existing `?preview=1` banner pattern at PortalLayout.astro:45)
- When slot is empty: zero rendered height, no layout shift, no DOM artifacts. Stub component returns `null`/empty fragment.
- When slot is filled (Phase 50): banner stacks ABOVE PortalHeader in document order; header reflows below it.
- Z-index `50` matches existing preview banner; ensures banner sits above any in-page sticky elements.

**Exceptions:** none. All chrome spacing uses the standard scale or tokens already in use elsewhere on the portal.

---

## Typography

All chrome typography uses `--font-body` (DM Sans). No serif (`--font-heading`) usage in PortalHeader/PortalFooter — serif is reserved for in-page headings (existing pattern). This is a deliberate restraint choice and matches the current inlined chrome.

| Role | Size | Weight | Line Height | Letter Spacing | Transform | Color | Notes |
|------|------|--------|-------------|----------------|-----------|-------|-------|
| Wordmark (header + footer) | 12px (`text-xs`) | 400 (regular) | 1.7 (inherits body) | `tracking-[0.2em]` (0.2em / 200) | uppercase | `text-stone` (`#8A8478`) | Anchored on existing pattern at `dashboard.astro:54` and `login.astro:23` |
| Role sub-label (header) | 12px (`text-xs`) | 400 (regular) | 1.7 (inherits body) | normal (no tracking) | normal-case | `text-stone/60` (60% opacity stone) | Anchored on existing pattern at `dashboard.astro:57` |
| Sign-out link | 12px (`text-xs`) | 400 (regular) | 1.7 (inherits body) | `tracking-widest` (0.1em) | uppercase | `text-stone` default → `text-terracotta` on hover | Anchored on existing pattern at `dashboard.astro:196` |
| Footer wordmark line | 12px (`text-xs`) | 400 (regular) | 1.7 (inherits body) | `tracking-widest` (0.1em) | uppercase | `text-stone` | Unchanged from existing footer at `PortalLayout.astro:69` |
| Footer contactEmail | 12px (`text-xs`) | 400 (regular) | 1.7 (inherits body) | normal | normal-case | `text-stone-light` default → `text-terracotta` on hover | Unchanged from existing footer at `PortalLayout.astro:73` |

**Total declared sizes:** 1 (12px). All chrome text is `text-xs`. This matches the existing portal restraint — chrome whispers, page content speaks.
**Total declared weights:** 1 (400 regular). DM Sans regular only.

**Why no second size:** Existing portal already has only `text-xs` chrome + page-level headings (`text-4xl`/`text-5xl`/`text-2xl` per page). Adding a chrome-specific size would break the visual hierarchy.

---

## Color

60/30/10 split, scoped to chrome surfaces only. All values reference existing brand tokens at `src/styles/_generated-theme.css` (generated from `src/lib/brand-tokens.ts`).

| Role | Token | Hex | Usage in chrome |
|------|-------|-----|-----------------|
| Dominant (60%+) | `--color-cream` | `#FAF8F5` | Body background; PortalHeader has NO background fill (transparent over cream); PortalFooter has NO background fill |
| Secondary (30%) | `--color-stone` | `#8A8478` | Wordmark text, sign-out text default, footer wordmark line |
| Secondary alt | `--color-stone/60` | `#8A8478` @ 60% | Role sub-label text (slightly muted under wordmark) |
| Secondary alt | `--color-stone-light` | `#B8B0A4` | Footer contactEmail default text |
| Accent (10%) | `--color-terracotta` | `#C4836A` | Sign-out hover state, footer contactEmail hover state, focus ring |
| Destructive | `--color-destructive` | `#9B3A2A` | **NOT USED** in this phase — chrome has no destructive actions (sign-out is not destructive in voice; D-4 confirms it's safety/control affordance) |

**Accent reserved for:**

1. Hover color on sign-out link (`hover:text-terracotta`)
2. Hover color on footer contactEmail mailto link (`hover:text-terracotta`)
3. Focus ring on sign-out link (`focus-visible:ring-2 focus-visible:ring-terracotta` per existing global.css `*:focus-visible` rule at global.css:55)

**Accent NOT used for:** wordmark, role sub-label, banner slot styling (banner styling deferred to Phase 50), preview banner (`#9A7B4B` gold, unchanged this phase).

**Background contract:**

- PortalHeader: `bg-transparent` — cream body shows through (D-1: "no background band")
- PortalFooter: `bg-transparent` — cream body shows through (D-5: unchanged from current)
- Banner slot wrapper: no background applied by PortalLayout — Phase 50's banner content sets its own background

**Border contract:**

- PortalHeader: NO border, NO border-bottom (D-1 explicit)
- PortalFooter: NO border-top (matches existing inlined footer)
- Banner slot wrapper: NO border applied by PortalLayout

---

## Copywriting Contract

Phase 47 introduces three new copy slots (role sub-label x3) and re-homes one (Sign Out). All other chrome copy is preserved verbatim from existing pages.

| Element | Copy | Source |
|---------|------|--------|
| Role sub-label — client | `Client portal` | NEW (matches CONTEXT D-1) — sentence-case, normal letter-spacing. Anchored on existing dashboard.astro:57 ("Client Portal") but lowercased for restraint; planner may keep title-case if it conflicts with existing strings — see Open Question 1 below. |
| Role sub-label — contractor | `Trade portal` | NEW — uses "Trade" not "Contractor" / "Vendor" per v5.2 trades-milestone unification (CONTEXT D-1) |
| Role sub-label — building_manager | `Building portal` | NEW |
| Sign-out link label | `Sign Out` | UNCHANGED — preserved verbatim from existing 7 pages (Title Case, two words). Do NOT change to `Sign out` or `Log out` in this phase. |
| Sign-out destination | `GET /portal/logout`, `GET /workorder/logout`, `GET /building/logout` | UNCHANGED — existing endpoints. Sign-out is rendered as `<a href="…">` (anchor link), NOT a `<form method="POST">`. CONTEXT D-4 mentions "form posts" but existing implementation is GET-redirect (see `src/pages/portal/logout.ts:7`). Planner: keep current GET pattern unless an explicit security task is added; do not introduce CSRF surface this phase. |
| Footer wordmark line | `{tenant.displayName} • Interior Design` | UNCHANGED — preserved verbatim from `PortalLayout.astro:69` |
| Footer contactEmail | `{tenant.contactEmail}` | UNCHANGED — preserved verbatim |
| Banner slot stub | (renders nothing; no copy) | NEW — see "Banner slot stub" below |
| Preview banner (existing, unchanged) | `Preview — you are viewing this as a client. Sign back in to /admin to continue admin work.` | UNCHANGED this phase; CONTEXT D-3 confirms Phase 50 removes it |

**Empty state heading:** N/A. PortalHeader/PortalFooter have no empty state — they always render (the layout shell is never empty).

**Empty state body:** N/A. The banner slot's empty state IS the absence of any rendered content (zero height, no DOM impact). Phase 50 fills it.

**Error state copy:** N/A. The chrome itself does not surface errors (errors live on the page-level body content — login form errors, etc.).

**Destructive confirmation:** N/A. Sign-out is not destructive — it ends a session, not data. No confirmation modal. Existing affordance (single-click anchor) is preserved.

**Role sub-label resolution (planner reference):**

```ts
// PortalHeader.astro derives sub-label from Astro.locals.role (set by middleware).
// Source of truth — do not duplicate this map outside the component.
const ROLE_SUBLABEL: Record<string, string> = {
  client:           "Client portal",
  contractor:       "Trade portal",
  building_manager: "Building portal",
};
// Fallback when Astro.locals.role is unset (should never happen on authenticated paths,
// but defense-in-depth): omit the sub-label entirely. Do NOT render a generic placeholder.
```

**Bare-mode copy contract:**

- Header in `bare` mode: renders ONLY the wordmark, centered. NO role sub-label. NO sign-out. (D-2)
- Footer in `bare` mode: renders identically to non-bare mode (D-2: "Footer renders identically in both modes").
- Pages that use `bare`: `/portal/login`, `/portal/role-select`, `/workorder/login`, `/building/login` (D-2). Verify pages do not migrate (D-6).

**Banner slot stub (Phase 47 verification harness):**

- Component name: `<ImpersonationBannerStub/>` — placed at `src/components/portal/ImpersonationBannerStub.astro`
- Renders: `<div data-testid="banner-slot-mounted" hidden></div>` — visually invisible, asserts slot wiring works.
- Rationale: the planner can require an integration test that queries `[data-testid="banner-slot-mounted"]` to prove the slot is reachable. Phase 50 replaces this stub with the real `<ImpersonationBanner/>`.
- The stub MUST NOT render any user-visible chrome (no banner, no spacer, no border) — empty banner slot is indistinguishable from "no banner slot at all" to the recipient.

---

## Interaction Contracts

PortalHeader interactions (locked for executor):

| Interaction | Default state | Hover state | Focus state | Active state |
|-------------|---------------|-------------|-------------|--------------|
| Sign-out link | `text-stone`, no underline | `text-terracotta`, no underline | 2px `terracotta` outline, 3px offset (global rule at global.css:55) | (browser default) |
| Footer contactEmail | `text-stone-light`, no underline | `text-terracotta`, `transition-colors` | 2px `terracotta` outline, 3px offset | (browser default) |
| Wordmark | (non-interactive — plain text) | — | — | — |
| Role sub-label | (non-interactive — plain text) | — | — | — |
| Banner slot wrapper | (non-interactive — slot consumer owns interactions) | — | — | — |

**Transition durations:** all hover transitions use `transition-colors` (Tailwind default, ~150ms ease) to match existing portal pattern.

**Focus order (header → page → footer):**

1. Banner slot content (Phase 50; in 47, stub is `hidden` and skipped)
2. Wordmark area (non-focusable; skipped)
3. Role sub-label (non-focusable; skipped)
4. Sign-out link (focusable, top-right of header)
5. Page main content (`<main>` — set `id="main-content"` for skip-link future-proofing; not part of this phase's scope)
6. Footer contactEmail link (focusable, only interactive element in footer)

**Tab order on `bare` pages:** wordmark (skipped) → page main content → footer contactEmail. No sign-out present in bare mode.

---

## Responsive Behavior

Single breakpoint at `md:` (768px), matching Tailwind 4 default. No custom breakpoints introduced.

| Element | <768px (mobile) | ≥768px (desktop) |
|---------|-----------------|------------------|
| Header layout | Wordmark + sub-label LEFT (stacked); sign-out RIGHT (top-aligned, single line) | Same — layout does not change. Two-column flex. |
| Header padding | `px-4 pt-6 pb-4` | `px-6 pt-8 pb-6` |
| Wordmark size | 12px (`text-xs`) | 12px (`text-xs`) |
| Sign-out size | 12px (`text-xs`) | 12px (`text-xs`) |
| Banner slot | Sticky `top-0`, full-width | Sticky `top-0`, full-width |
| Footer | Centered, single column always | Centered, single column always |

**Mobile sign-out placement:** stays in the top-right of the header (does NOT move to a hamburger or to the footer). Reason: 12px text + tracking-widest "SIGN OUT" is ~70px wide — fits alongside a 14-character wordmark on a 375px viewport with 16px gutters. Verify at executor time on iPhone SE (375×667). If the wordmark + sub-label column wraps, the planner should add a regression test, not change layout.

**Wordmark wrap behavior:** wordmark is `whitespace-nowrap`. Long tenant names (>20 chars uppercased) may overflow on 375px viewport. Mitigation: existing `DEFAULT_PORTAL_BRAND.wordmark === "LA SPREZZATURA"` (15 chars) fits comfortably. v6.0 multi-tenant brings longer names; that's deferred per CONTEXT "Deferred Ideas". This phase does not solve unbounded wordmark length.

**Sub-label wrap behavior:** "Building portal" is the longest sub-label at 15 characters; comfortable at 12px on 375px. No wrapping concern.

---

## Accessibility

| Concern | Contract |
|---------|----------|
| Header landmark | Wrap PortalHeader contents in `<header role="banner">` (Astro `<header>` element gets implicit `banner` role). Exactly one banner per page. |
| Footer landmark | Wrap PortalFooter contents in `<footer role="contentinfo">` (Astro `<footer>` element gets implicit `contentinfo` role). Exactly one contentinfo per page. |
| Banner slot landmark | The slot wrapper is `<div role="region" aria-label="Notifications">` — this allows screen readers to identify the impersonation banner area in Phase 50 without coupling to its content. The stub renders nothing inside, so the region is empty (acceptable — empty regions are silently skipped by AT). |
| Tab order | Logical, source-order: banner slot → header sign-out → main → footer contactEmail. No `tabindex` overrides. |
| Focus indicators | Inherit from existing global rule (`*:focus-visible { outline: 2px solid terracotta; outline-offset: 3px; }` at global.css:55). PortalHeader/PortalFooter MUST NOT override or remove this. |
| Color contrast | All text/background pairs from brand tokens. Spot checks: stone (#8A8478) on cream (#FAF8F5) = 4.59:1 (passes WCAG AA for ≥4.5:1 normal text); stone-light (#B8B0A4) on cream = 2.69:1 (FAILS AA for body text — but used only for the contactEmail link in footer, which has hover→terracotta to surface the affordance). **Flag for executor:** if contactEmail at `stone-light` on cream tests as accessibility blocker in Phase 52 audit, we adjust there, not here. Note for record-keeping. |
| Sign-out semantics | `<a>` tag (current pattern). Screen reader announces as "link, Sign Out". Acceptable. If converted to POST form in a future phase, must use `<button type="submit">` with the same visible label. |
| Reduced motion | Transitions are color-only (`transition-colors`, ~150ms). No transform/translate animations introduced. `prefers-reduced-motion` not explicitly handled but not violated. |
| Skip-link | NOT in scope this phase. Phase 52 (PORTAL-04 WCAG audit) will surface if needed. |

---

## Component Inventory (planner reference)

Components created/modified by this phase. Exact file paths for the planner.

| Component | Status | Path | Notes |
|-----------|--------|------|-------|
| `PortalLayout.astro` | MODIFIED | `src/components/portal/PortalLayout.astro` | Add `bare?: boolean` prop; replace inlined `<footer>` with `<PortalFooter>`; add `<PortalHeader>` above page slot; add `<slot name="banner"/>` wrapper above header; keep `?preview=1` cosmetic banner as-is |
| `PortalHeader.astro` | NEW | `src/components/portal/PortalHeader.astro` | Wordmark + role sub-label + sign-out (default); wordmark-only centered (bare) |
| `PortalFooter.astro` | NEW | `src/components/portal/PortalFooter.astro` | Lift-and-shift of existing inlined footer; no visual change |
| `ImpersonationBannerStub.astro` | NEW | `src/components/portal/ImpersonationBannerStub.astro` | Renders `<div data-testid="banner-slot-mounted" hidden></div>`; replaced in Phase 50 |
| Sign-out anchors (in 7 pages) | DELETED | various dashboards/projects | Removed because PortalHeader now renders sign-out for all authenticated sessions (D-4) |

**Pages NOT touched this phase (per CONTEXT D-6):**

- `src/pages/portal/verify.astro`, `src/pages/workorder/verify.astro`, `src/pages/building/verify.astro` — server-side redirect handlers, no UI
- `src/pages/portal/enter-impersonation.astro` — server-side redirect handler

**Pages adopting `bare` prop:**

- `src/pages/portal/login.astro` (already wraps in PortalLayout — add `bare`)
- `src/pages/portal/role-select.astro` (already wraps — add `bare`)
- `src/pages/workorder/login.astro` (researcher to confirm wraps in PortalLayout — add `bare` if so)
- `src/pages/building/login.astro` (same)

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable (shadcn not used in this repo) |
| Third-party | none | not applicable |

This phase introduces zero third-party UI components. All chrome is hand-built Astro + Tailwind utility classes consuming existing brand tokens.

---

## Open Questions Forwarded to Planner

These questions are not blockers for the contract but the planner should resolve them before writing tasks:

1. **Role sub-label case (sentence vs title).** Existing `dashboard.astro:57` uses Title Case ("Client Portal"). This UI-SPEC locks sentence-case ("Client portal") per CONTEXT D-1's tone of restraint. Planner: confirm with user before writing the role-sublabel constant; if user prefers Title Case, update the `ROLE_SUBLABEL` map literal and re-run checker.
2. **Bare-mode applicability to `/workorder/login` and `/building/login`.** CONTEXT D-2 lists them but researcher should confirm both pages currently use `<PortalLayout>` and not a different shell. If they don't, an additional refactor is needed beyond just adding the `bare` prop.
3. **Sign-out method (GET anchor vs POST form).** CONTEXT D-4 says "form posts to existing endpoints" but `src/pages/portal/logout.ts:7` exports a GET handler. UI-SPEC keeps the GET anchor pattern to avoid coupling this phase to a CSRF refactor. Planner: if security review wants POST, scope a separate task — does not change this UI contract beyond swapping `<a>` for `<button type="submit">` with the same visible label.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---
version: 1.1
created: 2026-04-10
updated: 2026-04-10
status: canonical
authoritative_for:
  - /admin/* (luxury admin theme — primary scope)
  - public site + portal procurement (documented, lower priority)
supersedes:
  - token tables in individual phase UI-SPECs (phases now inherit from this file)
---

# la-sprezzatura Design System

> Single source of truth for design tokens, component patterns, copywriting rules, and accessibility non-negotiables. Phase UI-SPECs inherit from this file instead of re-deriving tokens from `global.css` + prior phase specs.

---

## How to use this file

### For phase UI-SPECs (researchers)

- Cite this file as the canonical token source. Do **not** copy hex values into phase specs — reference the token name (`--color-gold`, `--space-lg`) or the token role ("Accent — gold").
- Phase UI-SPECs only need to spec what this file does **not** cover: component-specific layouts, copywriting tables, interaction contracts, and any new tokens the phase genuinely requires.
- If a phase needs a new token, **amend this file first** (see Amendment Process at the bottom) then reference it from the phase spec. Never introduce tokens in a phase spec without updating this file.

### For implementers (executors)

- `src/styles/global.css` is the machine-readable source. This file is the human-readable specification. If they disagree, the CSS wins — but file a correction here immediately so the next phase doesn't drift again.
- When implementing a new admin surface, this file is your first stop. When implementing a portal/public surface, treat the Phase 32 portal tokens as frozen legacy unless you are explicitly migrating.

### For the UI checker

- Dimension 3 (Color) PASS = every hex value in the phase spec matches a token listed here, or is documented under Known Drift with a phase plan to fix it.
- Dimension 4 (Typography) PASS = every font size in the phase spec is one of the 4 Admin Canonical sizes (11.5, 13, 14, 22) or is documented under Known Drift.
- Dimension 5 (Spacing) PASS = every spacing value is a multiple of 4, or is one of the documented codebase exceptions (12px, 20px).

---

## Theme surfaces

la-sprezzatura has two visual themes. They share the same typefaces and spacing scale but use different color palettes and different primary accents. **Every new surface must declare which theme it belongs to.**

| Theme | Where it lives | Primary accent | Dominant background | Status |
|-------|----------------|----------------|---------------------|--------|
| **Luxury Admin** | `/admin/*` routes, `AdminLayout.astro`, all admin React islands | Antique gold `#9A7B4B` | Ivory `#FAF7F2` | **Canonical — active development** |
| **Portal / Public** | Marketing pages, client-facing portal, procurement table on public project detail page | Terracotta `#C4836A` | Cream `#FAF8F5` | Frozen legacy — only touch when fixing public site |

**Rule:** New admin surfaces use Luxury Admin. New public surfaces use Portal. Never mix palettes within one view.

---

## Luxury Admin theme (canonical for `/admin/*`)

### Colors

All tokens exist as CSS custom properties in `src/styles/global.css` lines 16–27. Use the token name in code via `var(--color-...)` or a Tailwind class that resolves to it. Do **not** hardcode hex values unless the token is not yet defined (and then amend this file).

| Role | Token | Value | 60/30/10 | Usage |
|------|-------|-------|----------|-------|
| Dominant | `--color-ivory` | `#FAF7F2` | 60% | Page background (set on `<body>` in `AdminLayout.astro`) |
| Secondary | `--color-surface` | `#FFFEFB` | 30% | Sidebar, top bar, card containers, row background, drawer background, input background (near-white) |
| Tertiary surface | `--color-parchment` | `#F3EDE3` | — | Row hover tint, empty-state backgrounds, assistant chat bubbles, drawer inner bands, section heading row bands |
| Accent | `--color-gold` | `#9A7B4B` | 10% | See **Accent reserved-for** list below |
| Accent light | `--color-gold-light` | `#F5EDD8` | — | Active sidebar item fill, active filter chip, hover affordance on accent-reserved controls |
| Accent mid | `--color-gold-mid` | `#E8D5A8` | — | Section-heading row bottom border, amber-family accents, gold-family borders |
| Warm border | `--color-border-warm` | `#E8DDD0` | — | Card borders (0.5px), row separators, sidebar right edge, top bar bottom edge |
| Mid border | `--color-border-mid` | `#D4C8B8` | — | Input borders, disabled states, separator lines inside cards |
| Text — primary | `--color-text-dark` | `#2C2520` | — | Body text, row titles, section headings |
| Text — secondary | `--color-text-mid` | `#6B5E52` | — | Meta lines, field labels, inactive sidebar items, breadcrumb links |
| Text — muted | `--color-text-muted` | `#9E8E80` | — | Timestamps, placeholder text, scaffolding labels, ownership stamps |
| Destructive | `--color-destructive` | `#9B3A2A` | — | Error banner text, overdue labels, destructive button backgrounds. **Not `red-600` / `#DC2626`** — we use warm destructive to stay in the luxury palette. |
| Destructive surface | `--color-destructive-surface` | `#FBEEE8` | — | Error banner background, destructive confirmation modal body tint |

#### Accent reserved-for (the 10% rule)

Gold `#9A7B4B` is the only accent color in the luxury admin theme. It must be used **only** on the following surfaces. If you find yourself reaching for gold on anything else, stop and reconsider.

1. Active sidebar nav item — text color, 1.5px left border, `--color-gold-light` background fill
2. Primary CTA button backgrounds (New session, Generate, Publish to gallery, Save Changes, etc.)
3. Outline/ghost CTA text + border (secondary "Promote" style)
4. Focus rings on inputs, buttons, and interactive chips (1.5px)
5. Tracking / link underlines (carrying ProcurementEditor precedent)
6. Active filter chip text + border + `--color-gold-light` background
7. Active wizard step circle fill and completed-step check icon
8. Breadcrumb current-page color (handled in `AdminLayout.astro`)
9. Loader2 spinners inside admin surfaces
10. Usage badge "healthy" text at the below-80% threshold

> **What gold is NOT for:** body text, row titles, section headings, meta lines, borders (use `--color-border-warm`), hover states on non-accent controls (use `--color-parchment`), icon tints on default buttons (use `--color-text-muted`).

#### Status colors (procurement pipeline)

The 6 procurement statuses are the **only place the admin theme uses color-coded pills**. These colors extend the luxury palette with warm, desaturated analogs of the standard pipeline colors — no generic `emerald-50` / `blue-50` / `red-600`. Source of truth: `ProcurementEditor.tsx` lines 42–49.

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Pending | `#F3EDE3` | `#9E8E80` | `#E8DDD0` |
| Ordered | `#E8F0F9` | `#2A5485` | `#B0CAE8` |
| Warehouse | `#F3EDE3` | `#6B5E52` | `#D4C8B8` |
| In Transit | `#FBF2E2` | `#8A5E1A` | `#E8CFA0` |
| Delivered | `#EDF5E8` | `#3A6620` | `#C4DBA8` |
| Installed | `#EDF5E8` | `#3A6620` | `#A8C98C` |

> **Important:** These do not match what `32-UI-SPEC.md` documents. `32-UI-SPEC.md` was written against an earlier draft of ProcurementEditor that used Tailwind default pills; the code was subsequently reskinned to the luxury warm palette without updating the spec. The values above are the actual current state.

#### Usage badge thresholds

Rendering usage quota badge — defined in `33-UI-SPEC.md` and codified here so future surfaces reusing a quota indicator inherit the same thresholds. Never use generic green/amber/red pills.

| Threshold | Percentage | Background | Text | Border |
|-----------|------------|------------|------|--------|
| Healthy | 0% – 79% | `#F5EDD8` (gold-light) | `#9A7B4B` (gold) | `#E8D5A8` (gold-mid) |
| Approaching | 80% – 94% | `#FBF2E2` (amber-parchment) | `#8A5E1A` (deep amber) | `#E8CFA0` (amber border) |
| Over | 95%+ | `#FBEEE8` (destructive surface) | `#9B3A2A` (destructive) | `#E8CFA0` |

---

### Typography

**Target: exactly 4 sizes, exactly 2 weights.** New admin surfaces must fit inside this budget. Legacy exceptions are documented below.

#### Font families

| Token | Font stack | Where |
|-------|------------|-------|
| `--font-heading` / `--font-serif` | `"Cormorant Garamond", "Georgia", serif` | Public/portal H1–H6 only. **Not used inside admin content.** Admin uses sans throughout, including page titles. |
| `--font-body` / `--font-sans` | `"DM Sans", "system-ui", sans-serif` | All admin UI. Also public site body text. |

> **Rule:** Inside `/admin/*`, every text element uses DM Sans. Cormorant Garamond is reserved for the public-facing site and the sidebar brand mark (which already uses DM Sans, not serif — confirmed in `AdminNav.tsx` line 46). If you're tempted to use the serif heading font inside admin, stop.

#### Admin canonical type scale (4 sizes, 2 weights)

| Role | Size | Default weight | Line height | Tailwind class | Used for |
|------|------|----------------|-------------|----------------|----------|
| Page heading | 22px | 600 | 1.2 | `text-[22px] font-semibold` | Page titles in `AdminLayout.astro` `pageTitle` slot; wizard page-level heads |
| Body / default | 14px | 400 | 1.5 | `text-sm` | Body copy, buttons, message bubbles, textareas, inputs (default) |
| Section heading / row title | 13px | 600 | 1.4 | `text-[13px] font-semibold` | Row titles, section headings, drawer headings, modal headings, filter chip labels |
| Label / meta / timestamp | 11.5px | 400 (600 when uppercase) | 1.4 | `text-[11.5px]` | Uppercase field labels (600 weight), meta lines, timestamps, badges, ownership stamps, tracking links |

**Weights:** only `400` (regular) and `600` (semibold). No `font-medium` (500), no `font-bold` (700). Any of the 4 sizes may carry either weight.

**Uppercase labels:** 11.5px + 600 weight + `letterSpacing: 0.04em` + `--color-text-mid` — this is the canonical "FIELD LABEL" look (e.g., "CAPTION", "VARIANT", "PROJECT").

**Focus rule:** if you catch yourself reaching for 12px, 12.5px, 15px, 16px, 18px, 20px, 24px, or anything else not in this table, you are drifting. Either fit into the 4-size scale or amend this file.

#### Known typography drift (legacy code that predates this scale)

These are real font sizes in shipped admin code that do not fit the 4-size scale. They are **not** approved for new work — new components must use the canonical scale. Legacy code will be consolidated as it's touched.

| Location | Size | Why it's there | Consolidation target |
|----------|------|----------------|----------------------|
| `AdminNav.tsx` brand label ("Linha Interiors") | 12px | Hotel stationery brand treatment — predates the 4-size scale | Stays at 12px **only** for the sidebar brand block. Do not use 12px anywhere else. |
| `AdminNav.tsx` brand sub-label ("Linha Studio") | 10px | Same brand block | Stays at 10px **only** for the sub-label. Do not use 10px anywhere else. |
| `AdminNav.tsx` nav item labels | 12.5px | Predates the 4-size scale consolidation | Planned consolidation to 13px in a future polish pass. Do not copy 12.5px into new surfaces. |
| `ProcurementEditor.tsx` "Net price" helper text | 12.5px, 11px | Legacy inline styles | Planned consolidation to 11.5px when ProcurementEditor is next touched. |
| `ProcurementEditor.tsx` "Synced X ago" indicator | 11px | Matches ProjectTasks.tsx legacy pattern | Consolidate to 11.5px during next touch. |

New surfaces reference the canonical 4-size scale **and nothing else**. The checker flags any new 11px, 12px, 12.5px, 15px, 16px, or 18px usage as drift.

---

### Spacing

4px base grid. All spacing values are multiples of 4 unless explicitly documented as a codebase exception.

| Token | Value | Tailwind class | Usage |
|-------|-------|----------------|-------|
| `space-xs` | 4px | `gap-1`, `p-1`, `px-1` | Icon gaps inside buttons, inline badge padding |
| `space-sm` | 8px | `gap-2`, `p-2`, `py-2` | Compact element spacing, form field inner gaps |
| `space-md` | **12px** ⚠ | `gap-3`, `p-3`, `py-3` | **Codebase exception** — row padding, input padding. Carried from ProjectTasks.tsx + ProcurementTable.astro. Not a multiple of 8, but retained for visual consistency. |
| `space-lg` | 16px | `gap-4`, `p-4`, `py-4` | Card content padding, field vertical gaps |
| `space-xl` | **20px** ⚠ | `gap-5`, `p-5`, `px-5` | **Codebase exception** — row horizontal padding. Carried from ProcurementEditor row rhythm. Not a multiple of 8, but retained for visual consistency. |
| `space-2xl` | 24px | `gap-6`, `p-6`, `py-6` | Section spacing, wizard step card padding |
| `space-3xl` | 32px | `gap-8`, `p-8`, `mb-8` | Page-level padding, wizard section outer margin |
| `space-4xl` | 48px | `gap-12`, `p-12`, `py-12` | Empty state vertical padding |

**Why 12 and 20 are exceptions:** the pre-existing admin tables (procurement, clients, contractors, project tasks) all shipped with `px-5 py-3` row rhythms before this spacing scale was formalized. Migrating every row to `px-4 py-2` (closest 4-grid values) would be a breaking visual change. The exceptions are load-bearing — retain them for row-level admin components.

**Rule for new components:** prefer the pure 4-grid values (`space-sm`, `space-lg`, `space-2xl`, `space-3xl`). Only use the 12px/20px exceptions if the new component sits inside an existing row system that already uses them.

---

### Admin shell dimensions

Fixed layout dimensions set by `AdminLayout.astro` and `AdminNav.tsx`. These are **not** tokens — they are the shell. New admin pages inherit them automatically by using `AdminLayout.astro` as the layout.

| Dimension | Value | Source | Notes |
|-----------|-------|--------|-------|
| Sidebar width | 210px | `AdminLayout.astro` `w-[210px]` | Established in commit `d075460` (Phase 32.03). Sidebar collapses to 0 via a client-side toggle. |
| Sidebar background | `#FFFEFB` | inline style | Matches `--color-surface` |
| Sidebar right edge | 0.5px `#E8DDD0` | inline style | Matches `--color-border-warm` |
| Top bar vertical padding | 13px | `py-[13px]` | ⚠ Not a multiple of 4. Load-bearing — changing it re-aligns the breadcrumb baseline. |
| Top bar horizontal padding | 28px | `px-7` | |
| Top bar bottom edge | 0.5px `#E8DDD0` | inline style | |
| Main content top padding | 32px | `pt-8` | |
| Main content bottom padding | 24px | `pb-6` | |
| Main content left padding | 36px | `pl-9` | |
| Main content right padding | 28px | `pr-7` | |
| Page title size | 22px | `text-[22px] font-semibold` | Cites the page-heading scale token |
| Breadcrumb size | 11.5px | inline `font-size: 11.5px` | Cites the label/meta scale token |
| Sidebar nav item vertical padding | 8px (`py-2`) | `AdminNav.tsx` | |
| Sidebar nav item left padding | 26px | `pl-[26px]` | Provides space for the 1.5px active left border without content shift |
| Sidebar nav item right padding | 18px | `pr-[18px]` | |

#### Responsive breakpoints (admin)

| Breakpoint | Value | Trigger |
|------------|-------|---------|
| Mobile sidebar collapse | — | Sidebar is collapsible at any viewport via top-bar toggle button; no auto-collapse breakpoint |
| Chat side-by-side → stacked | 900px | Rendering tool ChatView flip — defined in `33-UI-SPEC.md` D-12 |
| Wizard grid columns | 600px, 900px | Upload step image grid: 2 / 3 / 4 columns |
| Promote drawer full-width | 768px | Below 768px the 480px drawer goes full-width |

New admin surfaces should use **900px** as the primary "desktop vs narrow" breakpoint unless they have a specific reason to choose otherwise.

---

## Component patterns

Canonical component patterns with a reference implementation. New admin surfaces should compose these patterns rather than invent new ones.

### Inline row editor + parchment drawer (canonical admin CRUD pattern)

**Reference implementation:** `src/components/admin/ProcurementEditor.tsx`
**First documented in:** `.planning/phases/32-procurement-editor/32-UI-SPEC.md` (but see Known Drift — the shipped colors are the luxury admin palette above, not the cream/terracotta palette the 32 UI-SPEC documents)

**Pattern:**
1. Table of rows with compact info density (13px titles, 11.5px meta).
2. Row hover → `#F3EDE3` parchment tint, no border change.
3. Row-level action icons (Edit, Delete, +extra) at `w-3.5 h-3.5` in the last column.
4. Click Edit → row becomes inline editable (text inputs, date pickers) OR opens a right-side slide drawer (480px) for heavier edits. Choose inline for ≤4 fields, drawer for >4 fields or contextual editing.
5. Drawer: 480px wide (full-width below 768px), slide 200ms ease-out, parchment inner band for previews, solid gold primary CTA ("Save changes", "Publish", etc.), X close icon top-right with `aria-label`, closes on Escape/overlay click.
6. Destructive action (Delete): red banner inline OR warm destructive confirmation modal. Never a plain browser `confirm()`.

Reuse this for: any list-editing interface — procurement, tasks, contractors, projects, rendering sessions.

### Primary CTA (solid)

**Pattern:**
```
bg-[#9A7B4B] text-white
text-sm font-semibold font-body
px-4 py-2 rounded-lg
hover:bg-[#8A6D40] transition-colors
```

Leading icon: `w-4 h-4 mr-1.5`. Disabled state: `opacity-60 cursor-not-allowed`. Loading state: `<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />` + verb in progressive form ("Publishing…", "Generating…", "Saving…").

**Use for:** primary page action, wizard forward CTA, drawer save, destructive confirmation modal primary ("Delete"). Only one solid primary per surface — secondary actions use ghost or outline.

### Outline / ghost CTA (secondary)

**Outline pattern:**
```
border border-[#9A7B4B] text-[#9A7B4B]
text-sm font-semibold
px-4 py-2 rounded-lg
hover:bg-[#F5EDD8] transition-colors
```

**Ghost pattern (tertiary):**
```
text-sm text-[#6B5E52]
px-4 py-2 rounded-lg
hover:text-[#2C2520] transition-colors
```

### Luxury input (text, date, number, select)

**Utility class:** `.luxury-input` — defined in `global.css` lines 100–116. Do not redefine.

```css
background-color: #FDFBF8;
border: 0.5px solid #D4C8B8;
border-radius: 6px;
padding: 6px 9px;
font-size: 13px;
color: #2C2520;
font-family: var(--font-sans);
```

Focus: border color → `#9A7B4B`. Placeholder: `#9E8E80`. ⚠ Note the font-size is 13px, which matches the section-heading scale, not the body scale — this is load-bearing for input visual weight and should not be changed to 14px.

**Use for:** every text/number/date/select/textarea input in the admin app.

### Icon-only buttons

**A11y non-negotiable:** every icon-only interactive element MUST carry an `aria-label`. No exceptions.

| Icon | Canonical label pattern |
|------|-------------------------|
| Edit (Pencil) | `aria-label="Edit {entity}"` |
| Delete (Trash2) | `aria-label="Delete {entity}"` |
| Close (X) | `aria-label="Close {context}"` (e.g., "Close drawer", "Close dialog") |
| Back (ArrowLeft) | `aria-label="Back to {destination}"` |
| Refresh (RefreshCw) | `aria-label="Refresh {entity}"` |
| Remove item (X on thumbnail) | `aria-label="Remove {item type}"` |
| Step indicator (wizard circle) | `aria-label="Go to step {n}: {step label}"` |

**Disabled state:** `aria-disabled="true"`, `cursor: not-allowed`, opacity unchanged (the visual "disabled" cue is the desaturation of color, not opacity).

### Empty state

**Pattern:** Centered card inside the parent container. `py-12` vertical padding. Heading (13px, 600, `--color-text-dark`) + body (14px, 400, `--color-text-mid`) + solid primary CTA. Optional decorative icon at 32px, `--color-text-muted`, above the heading.

**Always include an action.** An empty state without a next-step CTA is a dead end.

### Loading skeleton

**Pattern:** Replace the target shape with a parchment-tinted block (`bg-[#F3EDE3]`), `animate-pulse`, same dimensions as the final content. Do not shimmer images.

### Error banner

**Pattern:** Inline, above the affected content.
```
bg-[#FBEEE8] text-[#9B3A2A]
text-sm px-5 py-3 rounded-lg
```
Auto-dismiss after 3000ms for transient errors (optimistic-update reverts). Persistent for structural errors (fetch failures) — include a retry link.

### Toast (success confirmation)

**Pattern:** Bottom-right, auto-dismiss 3000ms.
```
bg-[#F5EDD8] text-[#9A7B4B]
text-[11.5px] font-semibold uppercase tracking-[0.04em]
px-4 py-2 rounded-lg
```

---

## Copywriting rules

### Banned labels

The following generic labels are **never** acceptable on primary CTAs:

- ❌ `Submit` → use the verb + noun ("Save changes", "Create session", "Publish to gallery")
- ❌ `OK` → use the outcome ("Got it", "Keep editing", "Close")
- ❌ `Cancel` on a primary CTA → use the outcome ("Discard", "Keep editing", "Back")
- ❌ `Click here` → the surrounding text is the link
- ❌ `Success!` / `Error!` → describe what actually happened

**Exception:** `Cancel` **is** acceptable on **secondary** buttons in a destructive confirmation ("Keep editing" is preferred, but "Cancel" is tolerable). Never use "Cancel" as a primary CTA.

### Required form: verb + noun (primary CTAs)

Every primary CTA must be a verb + noun pair. Exceptions for recognized domain verbs ("Generate" for AI, "Deploy" for publish, "Sync" for force-refresh) when the noun is obvious from context. If the noun isn't obvious, add it.

| Good | Bad |
|------|-----|
| Save changes | Save |
| Publish to gallery | Publish |
| Create project | Create |
| Send refinement | Send |
| Generate rendering | Generate (tolerated if in a rendering context) |

### Stepper navigation

Wizard forward buttons hint at the destination: `Next: Upload`, `Next: Classify`, `Next: Describe`. The final step is the domain verb: `Generate`, `Publish`, `Submit`. Back buttons stay as `Back`.

### Empty states

Empty state copy follows this structure:
1. **Heading** (13px, 600): negation of the empty state (`No sessions yet`, `No procurement items yet`)
2. **Body** (14px, 400): one sentence explaining what the user can do next
3. **CTA** (solid primary): the verb + noun to take that action

### Destructive confirmations

Destructive confirmation modals follow this copy structure:
1. **Heading** (13px, 600): question form ending in `?` (`Delete item?`, `Discard session?`)
2. **Body** (14px, 400): consequences in one sentence (`This cannot be undone.`, `Your uploads and settings will be lost.`)
3. **Primary button** (solid destructive): the destructive verb (`Delete`, `Discard`)
4. **Secondary button** (ghost): the preserving verb (`Keep editing`, `Keep item`)

### Ownership / authorship stamps

Never display raw Sanity user IDs, email addresses, or database keys to humans. Use `displayName` with a fallback to `"Unknown designer"`. When the current user owns something, display `"by You"` (italic), not their own name.

### Locale / tone

- Luxury, quiet, specific. Not breezy, not corporate.
- Second-person singular ("you") is fine. Never "the user" or "users".
- Sentence case for everything except uppercase field labels.

---

## Accessibility non-negotiables

These rules apply to every admin surface without exception.

1. **Every icon-only interactive element has `aria-label`** — see Component Patterns → Icon-only buttons.
2. **Modals and drawers trap focus** and close on `Escape`. Clicking the overlay closes drawers (not destructive modals).
3. **Color is never the only signal** — overdue items have red text AND a destructive icon or label, not just red text.
4. **Form fields have visible labels** — uppercase 11.5px labels above the field. No placeholder-only fields.
5. **Disabled buttons explain why** — either via `aria-describedby` pointing to helper text or via a tooltip/title. Never silently disabled.
6. **Status indicators announce changes** — use `role="status"` with `aria-live="polite"` for toast confirmations and `role="alert"` for error banners.
7. **Keyboard: Tab order matches visual order. Enter submits forms. Escape cancels edits and closes overlays.**
8. **Minimum touch target: 44px** on mobile. Desktop admin targets can be smaller (the table row hit area is typically 48px which covers it).

---

## Known drift and amendment backlog

The design system is an aspiration; the code is the reality. Known mismatches the next phase touching this code should fix:

### High priority

- **`32-UI-SPEC.md` colors are stale.** Documents terracotta + amber/blue/emerald pills + red-600 overdue. Real code (ProcurementEditor.tsx) uses gold + the warm palette above + `#9B3A2A`. The UI-SPEC should be updated to reference this file; the code is already correct.
- **`AdminNav.tsx` sidebar item icon for "Rendering Tool".** Currently `Palette`; 33-CONTEXT D-02 requires `Sparkles`. Label should also change from "Rendering Tool" → "Rendering". Phase 33 execution will fix.

### Medium priority

- **`AdminNav.tsx` nav item font size** is `12.5px`; canonical scale is `13px`. Consolidation deferred to a future polish pass — do not copy 12.5px into new surfaces.
- **`ProcurementEditor.tsx` "Synced X ago"** is `11px`; canonical scale is `11.5px`. Consolidation deferred to next ProcurementEditor touch.
- ~~`--color-destructive` / `--color-destructive-surface` not yet CSS custom properties~~ — **resolved in v1.1** (2026-04-10).

### Low priority / intentional

- **`AdminNav.tsx` brand mark** uses `12px` + `10px`. Stays as-is — these are the "hotel stationery" typographic flourishes for the brand block only, and are contained to one scope.
- **Top bar vertical padding `py-[13px]`** is not a multiple of 4. Load-bearing for breadcrumb baseline alignment — leave it alone.
- **Spacing exceptions `12px` / `20px`** for row padding/horizontal. Load-bearing for existing row systems. Do not migrate retroactively.

---

## Portal / Public theme (frozen legacy)

Narrow-scope tokens for the public-facing site and portal procurement view. Only touch when fixing public site issues. New admin work does **not** use these tokens.

### Colors

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Dominant | `--color-cream` | `#FAF8F5` | Public site body background |
| Secondary | `--color-cream-dark` | `#F5F0EB` | Public cards, section alternates |
| Accent | `--color-terracotta` | `#C4836A` | Public site CTAs, focus rings (`*:focus-visible` outline in `global.css` line 89), public portal link underlines |
| Accent light | `--color-terracotta-light` | `#D4A08A` | Hover on accent elements |
| Stone | `--color-stone` | `#8A8478` | Public meta text |
| Stone light | `--color-stone-light` | `#B8B0A4` | Public placeholder, disabled |
| Stone dark | `--color-stone-dark` | `#6B6358` | Public secondary text |
| Charcoal | `--color-charcoal` | `#2C2926` | Public body text |
| Charcoal light | `--color-charcoal-light` | `#4A4540` | Public secondary headings |
| White | `--color-white` | `#FFFFFF` | Public card backgrounds |

### Typography

Public site uses Cormorant Garamond for H1–H6 (`--font-heading`), DM Sans for body (`--font-body`). Line-height on body is 1.7 (generous for reading).

### Known drift

- ~~Global `*:focus-visible` outline uses terracotta on admin surfaces~~ — **resolved in v1.1** (2026-04-10) by scoping a gold override via `[data-theme="admin"] *:focus-visible` in `global.css` and adding `data-theme="admin"` to the `AdminLayout.astro` body.

---

## Amendment process

When a phase needs a new token or pattern:

1. **Open this file first.** Do not add the token to a phase spec only.
2. **Add the token** to the appropriate section (Colors, Typography, Spacing, Patterns) with:
   - The canonical name
   - The value
   - Which phase introduced it
   - The intended usage and any reserved-for rules
3. **Add a changelog entry** at the bottom of this file.
4. **Bump the `version` frontmatter** — patch (1.0.1) for additions, minor (1.1.0) for revisions that change existing tokens, major (2.0.0) for breaking changes.
5. **If the token belongs in `global.css`** (a color or font variable), add it to `global.css` in the same commit.
6. **Then reference it from the phase UI-SPEC** — never before.

The checker enforces this: any phase spec introducing a hex value or font size not listed here (or listed here but marked as drift without a fix plan) is a BLOCK on Dimension 3 (Color) or Dimension 4 (Typography).

---

## Changelog

### v1.1 — 2026-04-10

- **Added `--color-destructive` and `--color-destructive-surface`** as first-class CSS custom properties in `global.css` (values unchanged: `#9B3A2A` and `#FBEEE8`). Phase specs now reference the tokens by name instead of inline hex. Resolves v1.0 drift backlog item.
- **Scoped admin focus rings to gold.** Added `[data-theme="admin"] *:focus-visible { outline-color: var(--color-gold); }` override in `global.css` and `data-theme="admin"` attribute on the `AdminLayout.astro` body. Public site keeps terracotta focus rings. Resolves v1.0 drift backlog item.

### v1.0 — 2026-04-10

- Initial extraction. Codifies the luxury admin theme from `global.css` + `33-UI-SPEC.md` + `AdminLayout.astro` + `AdminNav.tsx` + `ProcurementEditor.tsx`.
- Documents the public/portal theme as frozen legacy.
- Establishes the 4-size type scale (11.5, 13, 14, 22) and 2-weight rule (400, 600).
- Establishes the 10-surface reserved-for list for the gold accent.
- Documents known drift: `32-UI-SPEC.md` color staleness, `AdminNav.tsx` icon/label mismatch, `12.5px`/`11px` legacy sizes.
- Codifies component patterns: row editor + drawer, primary/outline/ghost CTAs, luxury input, icon-only a11y, empty state, loading skeleton, error banner, toast.
- Codifies copywriting rules: banned labels, verb+noun requirement, stepper navigation phrasing, destructive confirmation structure.
- Codifies a11y non-negotiables.

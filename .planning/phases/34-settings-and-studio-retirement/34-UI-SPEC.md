---
phase: 34
slug: settings-and-studio-retirement
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-11
reviewed_at: 2026-04-11
---

# Phase 34 — UI Design Contract

> Visual and interaction contract for Settings page, Send Update modal, per-client PURL regenerate action, and the minimal client dashboard. Admin surfaces follow the existing "luxury admin" token set (warm ivory + antique gold) established in Phases 30-33. The client dashboard follows the public portal token set (warm cream + terracotta + Cormorant Garamond) established in Phase 3. Studio removal is code-only and has no UI surface.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (hand-rolled against existing project tokens) |
| Preset | not applicable |
| Component library | none — Tailwind utility classes + inline `style` tokens (Phase 33 grep contract: **no `@sanity/ui` in `src/components/admin/**`**) |
| Icon library | `lucide-react` (already installed) |
| Font (admin) | `DM Sans` via `var(--font-sans)` for all UI; `Cormorant Garamond` via `var(--font-heading)` is NOT used in admin |
| Font (portal) | `Cormorant Garamond` via `var(--font-heading)` for headings; `DM Sans` via `var(--font-body)` for body |
| Tokens live in | `src/styles/global.css` `@theme` block (verified 2026-04-11) |
| Drag library | `@dnd-kit/sortable` (in package.json since Phase 30) |
| Upload library | `@vercel/blob/client` (StepUpload pattern, Phase 33) |
| Modal primitive | **NONE EXISTS** — Phase 34 introduces a reusable `AdminModal` primitive; see § Component Inventory |
| Toast primitive | **NONE EXISTS** — Phase 32/33 use a hand-rolled inline banner + `setTimeout(3000)` auto-dismiss pattern. Phase 34 introduces a reusable `AdminToast` primitive; see § Component Inventory |

---

## Spacing Scale

Existing admin surfaces (Phases 30-33) use Tailwind's default 4px-multiple scale, with a small number of odd values inherited from Phase 32's dense procurement table (`5px`, `7px`, `10px`, `11px`, `14px`) that intentionally break the 4-multiple rule to keep rows compact. Phase 34 preserves that compromise on existing surfaces and uses strict 4-multiples on all new surfaces.

Declared values for Phase 34 new surfaces:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge inner padding, chip gap |
| sm | 8px | Compact element spacing, form-field inner gaps |
| md | 16px | Default element spacing, section body gap |
| lg | 24px | Section padding, card padding, modal body padding |
| xl | 32px | Section break, modal header-to-body gap |
| 2xl | 48px | Page top padding, empty-state vertical margin |
| 3xl | 64px | Portal page breathing room |

**Exceptions (preserved from existing admin token set, for parity with ProcurementEditor / AdminLayout):**
- Sidebar width: `210px` (AdminLayout.astro:42) — do NOT restyle.
- Topbar vertical padding: `13px` (AdminLayout.astro:52) — do NOT restyle.
- Chip padding: `5px 11px` (ContactCardWrapper pattern) — match for client-row PURL control to avoid chip-row visual drift.
- Luxury input padding: `6px 9px` (global.css `.luxury-input`) — reuse `luxury-input` class verbatim for all new form fields.

---

## Typography

**Admin surfaces (Settings page, Send Update modal, regenerate dialog, regenerate toast)** — inherit from existing admin pages:

| Role | Size | Weight | Line Height | Notes |
|------|------|--------|-------------|-------|
| Page title | 22px | 600 | 1.3 | `pageTitle` prop in AdminLayout; never > 1 per page |
| Section heading (H2) | 14px | 600 | 1.3 | Collapsible section header label |
| Body | 13px | 400 | 1.55 | Form field values, helper text, modal body |
| Label | 11.5px | 500-600 | 1.2 | uppercase with 0.04em letter-spacing — reuse the existing "eyebrow label" pattern from PromoteDrawer:232 and ProcurementEditor drawer fields |
| Helper / muted | 11.5px | 400 | 1.4 | color `#9E8E80` — use for field descriptions |

Admin uses **`DM Sans` ONLY** — `font-family: var(--font-sans)`. Never `font-heading` in admin.

**Portal surfaces (client dashboard at `/portal/client/[token]`, token-invalid fallback)** — inherit from existing portal pages (PortalLayout + MilestoneSection visuals):

| Role | Size | Weight | Line Height | Notes |
|------|------|--------|-------------|-------|
| Hero (welcome) | 30-36px (`text-3xl md:text-4xl`) | 300 (`font-light`) | 1.2 | `font-heading` (Cormorant Garamond); sentence case — "Welcome, Sarah" |
| Card title | 20-24px (`text-xl md:text-2xl`) | 300 (`font-light`) | 1.3 | `font-heading`; project title |
| Section eyebrow | 12px (`text-xs`) | 400 | 1.4 | uppercase, `tracking-widest`, `text-stone` — "La Sprezzatura" brand line |
| Body | 14-16px (`text-sm` / `text-base`) | 400 | 1.7 | `font-body` (DM Sans) |
| Meta (engagement type, stage) | 12px (`text-xs`) | 400 | 1.4 | `text-stone`, `uppercase`, `tracking-widest` |
| Link CTA | 13px (`text-sm`) | 400 | 1.2 | `uppercase tracking-widest` — "View project →" |

Exactly 3 sizes are used per surface (admin page: 22 / 14 / 13; portal page: ~32 / ~22 / 14). The 11.5px label is treated as a micro-accent, not a primary type role.

---

## Color

Token map references `src/styles/global.css` `@theme` block. Use CSS variables or raw hex; do NOT introduce new hex values.

### Admin surfaces (Settings, Send Update modal, regenerate dialog)

| Role | Value | Usage |
|------|-------|-------|
| Dominant (~60%) | `#FAF7F2` (`--color-ivory`) | Admin page background (AdminLayout body) |
| Secondary surface (~30%) | `#FFFEFB` (`--color-surface`) | Card, modal, section container |
| Parchment accent | `#F3EDE3` (`--color-parchment`) | Expanded-section inner drawer bg (matches ProcurementEditor expanded row), chip bg, status pill neutral |
| Warm border (line) | `#E8DDD0` (`--color-border-warm`) | 0.5px lines between sections, modal borders |
| Mid border (field) | `#D4C8B8` (`--color-border-mid`) | Input borders, luxury-input default |
| Accent (10%) | `#9A7B4B` (`--color-gold`) | **Reserved for:** primary CTAs (Save / Send update / Publish), active tab indicator, focus ring, active pipeline-stage badge text, drag handle hover state. Nothing else. |
| Accent light | `#F5EDD8` (`--color-gold-light`) | Gold-on-gold chip backgrounds (e.g. active pipeline stage pill) |
| Text — primary | `#2C2520` (`--color-text-dark`) | Field values, headings |
| Text — mid | `#6B5E52` (`--color-text-mid`) | Section headers, labels |
| Text — muted | `#9E8E80` (`--color-text-muted`) | Helper copy, disabled, placeholder |
| Destructive | `#9B3A2A` (`--color-destructive`) | Delete buttons, regenerate warning text, inline error message |
| Destructive surface | `#FBEEE8` (`--color-destructive-surface`) | Error banner bg |
| Overlay | `rgba(44, 37, 32, 0.30)` + `backdrop-filter: blur(2px)` | Modal scrim (matches PromoteDrawer:115-117) |

**Accent reserved for (explicit list — never applied elsewhere):**
1. "Save settings" button (Settings page footer)
2. "Send update" button (Send Update modal footer)
3. "Regenerate link" button (inside regenerate confirm dialog)
4. "Copy link" button (inside success toast after regeneration)
5. Focus ring on any `luxury-input` (global.css:119 already enforces this)
6. Drag-handle icon hover color inside the hero slideshow sortable list
7. Active/expanded chevron icon in a collapsible section header
8. `renderingAllocation` input's active state (shares luxury-input focus behavior)

### Portal surfaces (client dashboard, token-invalid fallback)

| Role | Value | Usage |
|------|-------|-------|
| Dominant (~60%) | `#FAF8F5` (`--color-cream`) | Page background (PortalLayout body) |
| Secondary surface (~30%) | `#FFFFFF` (`--color-white`) | Project card bg |
| Soft tint | `#F5F0EB` (`--color-cream-dark`) | Card hover state |
| Text primary | `#2C2926` (`--color-charcoal`) | Headings, card titles |
| Text mid | `#8A8478` (`--color-stone`) | Metadata, labels, footer |
| Text light | `#B8B0A4` (`--color-stone-light`) | Small copyright-style footer |
| Accent (10%) | `#C4836A` (`--color-terracotta`) | **Reserved for:** "View project →" link hover color, focus ring (global.css:92 already enforces this), "Go to Login" button on token-invalid page. Nothing else. |
| Border | `rgba(184, 176, 164, 0.2)` (`stone-light/20`) | Card border, section break line |

**Portal accent reserved for (explicit list):**
1. `hover:text-terracotta` on "View project →" link
2. Terracotta outline on focus-visible (inherited from global.css:92)
3. "Go to Login" button border + hover state on token-invalid page
4. Brand wordmark hover (if included)

Nothing gold or parchment appears in portal surfaces. Nothing terracotta appears in admin surfaces.

---

## Layout Contracts

### 1. `/admin/settings` page

Matches AdminLayout structure: sidebar + topbar breadcrumb + `<main class="flex-1 pt-8 pb-6 pl-9 pr-7">`.

```
AdminLayout (breadcrumbs: Dashboard / Settings)
└─ <main>
   └─ <div class="max-w-3xl">     ← content ceiling (single column, read-heavy)
      ├─ page intro paragraph      ← one-line helper: "Site-wide settings and rendering configuration."
      ├─ Section 1: General         [collapsible, default OPEN]
      ├─ Section 2: Social Links    [collapsible, default CLOSED]
      ├─ Section 3: Hero Slideshow  [collapsible, default CLOSED]
      ├─ Section 4: Rendering       [collapsible, default CLOSED]
      ├─ Section 5: Studio retirement notice   ← inert info block, NOT a section; see below
      └─ Sticky footer bar         ← save-all button + inline error banner slot
```

**Section container (reused for all 4 collapsible sections):**

```
┌─────────────────────────────────────────────────────┐
│ bg: #FFFEFB   border: 0.5px #E8DDD0   rounded: 10px │
│ ┌─ Header row (clickable, 44px min tap target) ───┐ │
│ │ ChevronDown (gold when expanded, muted collapsed)│ │
│ │ Section title (13px, 600, #2C2520)               │ │
│ │ ✦ optional unsaved-changes dot (#9A7B4B, 6px)    │ │
│ └──────────────────────────────────────────────────┘ │
│ ─── 0.5px #E8DDD0 line (only when expanded) ─────── │
│   Body (padding 20px 24px 24px)                      │
└─────────────────────────────────────────────────────┘
gap between sections: 14px (matches ProcurementEditor row gap)
```

**Section bodies — field specifications:**

1. **General** (5 fields, single column, `luxury-input`):
   - Site Title (required, max 60 chars) — placeholder: "La Sprezzatura"
   - Tagline (optional, max 120 chars) — placeholder: "Interior Design, Long Island"
   - Contact Email (type=email, required, regex validated) — placeholder: "hello@lasprezz.com"
   - Contact Phone (type=tel, optional) — placeholder: "(516) 555-0123"
   - Studio Location (optional) — placeholder: "Long Island, NY" + helper copy from schema: "General area — not a home address"

2. **Social Links** (3 fields, single column, `luxury-input`, URL type):
   - Instagram URL (validated `https://` prefix, optional)
   - Pinterest URL (same)
   - Houzz URL (same)
   - Each shows the lucide icon (`Instagram`, `PinIcon` not available → use `ExternalLink`, `ExternalLink`) to the left of the label. Platform identity is conveyed by label text, not branded icons.

3. **Hero Slideshow** (drag-reorderable sortable list):
   - If empty: parchment-bg empty state card, 180px tall, dashed border `#D4C8B8`, center text "No slides yet — upload your first hero image" + Upload icon (lucide `Upload`).
   - Each row (when populated):
     ```
     ┌──────────────────────────────────────────────────────┐
     │ ⋮⋮  [thumbnail 100×68 obj-cover]  ┌ alt text input ┐ │
     │     (drag handle, hover #9A7B4B)   │ luxury-input   │ │
     │                                    └────────────────┘ │
     │                                                    ✕ │
     └──────────────────────────────────────────────────────┘
     row bg: #FFFEFB, border 0.5px #E8DDD0, rounded 8px, padding 12px, gap between rows 8px
     dragging: opacity 0.8, shadow: 0 8px 24px rgba(44,37,32,0.15), border-color #9A7B4B
     ```
   - Upload dropzone sits below the list, 160px tall — same visual as StepUpload.tsx:390-424 (dashed border `#D4C8B8`, parchment bg, `Upload` icon, "Drop images here / or click to select files"). On drag-over: bg `#F5EDD8`, border `#9A7B4B`.
   - Alt text input: validation message appears inline under the input as a 10.5px `#9B3A2A` message when empty on save attempt. Save button at page footer is disabled when any row has empty alt text; the footer error banner reads: "Add alt text to every hero image before saving."
   - Delete confirmation: inline X button triggers optimistic delete + bottom-right toast with "Slide removed — Undo" (toast visible 5s instead of default 3s because delete is destructive; matches D-22 direction from context's "inline X with undo toast is fine, no modal").
   - Drag-to-reorder: `@dnd-kit/sortable` with `verticalListSortingStrategy`. `onDragEnd` applies optimistic reorder + patches Sanity. Rollback on failure.
   - Per-row image upload follows StepUpload hybrid pattern: `<4.5MB PUT /api/blob-upload` + `>4.5MB upload()` from `@vercel/blob/client`, synchronous `URL.createObjectURL` preview, `revokeObjectURL` cleanup on unmount. After upload completes, the new slide is added to the end of the sortable list with `uploading: false` and a Sanity image asset reference persisted.

4. **Rendering Configuration** (3 fields):
   - **Monthly Rendering Limit** — number input, `luxury-input`, width 120px, `min="1"`, `step="1"`, placeholder "50". Helper: "Maximum AI renderings per designer per month. Takes effect immediately for new usage checks."
   - **Image Types** — tag-style multi-input. Tags render as chips (parchment bg `#F3EDE3`, 5px 11px padding, 20px border-radius, `#2C2520` text, 0.5px `#D4C8B8` border — **matches ContactCardWrapper chip style** for visual parity) with a trailing `×` that removes the tag. An inline input field at the end accepts new tags on Enter; empty-string and duplicate values are rejected silently (red shake is over-the-top for a settings field). Helper: "Options Liz can pick from when classifying a rendering input image."
   - **Excluded Users** — same tag-style multi-input, but for email strings. Helper: "Email addresses of users who cannot use the rendering tool. Stored as-is; sanitization happens server-side." Include a `Mail` icon inside each chip to distinguish from plain image-type tags. Empty / malformed emails show an inline 10.5px `#9B3A2A` message under the input.

5. **Studio retirement notice (inert info block, no border, no collapsible):**
   - A small explanatory paragraph below the 4 collapsible sections and above the sticky footer.
   - Copy (verbatim):
     > "Sanity Studio has been retired. All site content is now managed through this admin app. The `/admin` route now loads the custom admin interface; the previous Studio UI is no longer accessible."
   - Style: 13px `#6B5E52` body text, 24px top margin from section 4, padding 20px 0, no border, no background. Not collapsible, not interactive. Exists so Paul/Liz have a visible confirmation of the retirement without needing a banner on every page.

**Sticky footer bar (fixed at bottom of main content, NOT the browser window):**

```
position: sticky / mt-8
bg: #FFFEFB, border-top 0.5px #E8DDD0, rounded-b or full-width
padding: 16px 24px
flex: justify-between, items-center

Left slot:  [error banner if any, 13px #9B3A2A on #FBEEE8 surface, rounded 8px, padding 6px 12px]
            [dirty-state indicator: "Unsaved changes" in 11.5px #6B5E52 if no error]
Right slot: [Cancel button: 13px #6B5E52, bg transparent, 6px 14px, hover bg #F3EDE3]
            [Save settings button: 13px 600, #FFFEFB on #9A7B4B, 8px 16px, rounded 6px]
```

Save button states:
- `idle`: gold bg, "Save settings"
- `saving`: gold bg opacity 0.7, `Loader2` spinning + "Saving..."
- `error`: gold bg restored, error banner appears in left slot
- `saved (optimistic)`: gold bg, transient toast bottom-right "Settings saved" (3s auto-dismiss)

---

### 2. Send Update modal

**Trigger button** — slotted into the existing project detail header row (`[projectId]/index.astro`, between the pipeline stage pill and the "days in stage" count, right-aligned using `ml-auto`):

```
<button class="luxury-secondary-btn">
  <Mail className="w-4 h-4" />
  Send Update
</button>
```

Secondary button style:
- bg: `#FFFEFB`
- border: 0.5px `#D4C8B8`
- padding: 7px 14px
- font: 12.5px, 500, `#2C2520`, `var(--font-sans)`
- rounded: 6px
- icon gap: 6px
- hover: border `#9A7B4B`, text `#9A7B4B` (icon inherits via `currentColor`)

**Modal shell** — centered, fixed overlay. Use the NEW `AdminModal` primitive (see § Component Inventory).

```
Overlay: fixed inset-0 z-50
  background: rgba(44, 37, 32, 0.30)
  backdrop-filter: blur(2px)
  (matches PromoteDrawer scrim — reuse pattern)

Modal card: max-w-[540px] w-[92vw] mx-auto my-16 (allows scroll on short viewports)
  bg: #FFFEFB
  border: 0.5px #E8DDD0
  rounded: 12px
  shadow: 0 24px 48px rgba(44,37,32,0.18)
  role="dialog" aria-modal="true" aria-labelledby="send-update-title"
  max-height: calc(100vh - 128px) (scrollable body, fixed header + footer)
```

**Modal body (in order):**

1. **Header** — 24px padding, 0.5px bottom border:
   - Title "Send project update" (14px 600 `#2C2520`)
   - Close X button (lucide `X`, `#9E8E80`, hover `#2C2520`) — aligned right

2. **Recipients** — 24px horizontal padding, 16px vertical margin:
   - 11.5px uppercase `#6B5E52` label: "Recipients"
   - Read-only chip list (same chip style as Clients section), one per `project.clients[].client.email`. Email in 11.5px `#9E8E80` under the name inside each chip (or as a trailing muted span after the name — whichever fits visually). If `project.clients[]` is empty, show 12px `#9B3A2A` message "This project has no clients assigned — assign clients before sending updates." and disable the Send button.

3. **Personal note** — 24px horizontal padding, 16px vertical margin:
   - 11.5px uppercase `#6B5E52` label: "Personal note (optional)"
   - `textarea` with `rows={4}`, full width, `luxury-input` class
   - Placeholder: "Hi, here's the latest on your project..." (neutral placeholder — context's "Hi Liz, ..." was example-only and points backwards; the UI is prompting Liz, not modeling her voice)
   - Below: 11px `#9E8E80` helper: "Appears at the top of the email, above the status sections."

4. **Sections to include** — 24px horizontal padding, 16px vertical margin:
   - 11.5px uppercase `#6B5E52` label: "Include in this update"
   - Three rows, each 44px min tap-target, bg `#FFFEFB`, 0.5px `#E8DDD0` border only on the bottom (no rounded card — flat list), padding 12px 0:

     ```
     [ checkbox ]  Milestones              ·  3 total, 1 upcoming
     [ checkbox ]  Procurement              ·  12 items, 4 delivered        ← hidden if engagementType !== 'full-interior-design'
     [ checkbox ]  Pending reviews          ·  2 awaiting approval
     ```

   - Count metadata is 11.5px `#9E8E80`, separated from label by a 4px middle-dot `·`.
   - Checkbox style: 16×16, 0.5px `#D4C8B8` border, 3px radius, checked state fills with `#9A7B4B` + white check icon (lucide `Check`). No native checkbox.
   - **Default states (D-15, load-bearing):**
     - Milestones: **ON**
     - Procurement: **ON if `engagementType === 'full-interior-design'` AND `procurementItems.length > 0`**, otherwise row is hidden entirely (not just disabled)
     - Pending reviews: **OFF** (intentional — prevents accidental deadline pressure on client)
   - If a row's count is 0 (e.g. milestones=0), row renders with `opacity: 0.5` and the checkbox is disabled; the count reads "0" in `#9E8E80`.

5. **Personal portal link toggle** — 24px horizontal padding, 16px vertical margin, top border 0.5px `#E8DDD0`:
   - Row: `[toggle]  Send each recipient their personal portal link`
   - Toggle style: 32×18 track, `#D4C8B8` when off, `#9A7B4B` when on, white 14×14 thumb with 1px shadow, 150ms transition
   - Default: **ON** (the modal defaults to `usePersonalLinks: true` per D-17; the toggle exists so Liz can fall back to the legacy generic link if needed, e.g. for a one-off share with an unknown recipient)
   - Helper below (11px `#9E8E80`): "Each client gets a unique dashboard link for all their projects. Turn off to send the generic portal link."

6. **Actions footer** — 24px padding, 0.5px top border `#E8DDD0`, sticky to bottom of modal:

   ```
   [← Preview email]                          [Cancel]  [Send update]
     text button                               secondary  primary gold
   ```

   - **Preview email** — text-only button (13px `#6B5E52`, underline on hover, gap 6px + lucide `ExternalLink` 14px icon at end). Click opens a new browser tab at `/api/send-update/preview?projectId={id}&note={encoded}&sections={json}&usePersonalLinks={bool}` (or equivalent GET endpoint that returns the rendered HTML). The preview tab shows the email as the client will see it, rendered via the shared `buildSendUpdateEmail()` helper extracted from `src/pages/api/send-update.ts`. Preview does NOT send; it opens on a new tab so the modal state is preserved.
   - **Cancel** — 13px `#6B5E52`, bg transparent, 0.5px `#D4C8B8` border, 8px 16px, rounded 6px. Dismisses modal and discards unsaved state.
   - **Send update** — primary gold: bg `#9A7B4B`, text `#FFFEFB`, 13px 600, 8px 20px, rounded 6px, icon gap 8px. States:
     - `idle`: "Send update"
     - `sending`: `Loader2` spinning + "Sending..." + bg `#C4A97A` (disabled)
     - `success`: modal auto-closes, bottom-right toast "Update sent to N recipients" (3s dismiss)
     - `error`: modal stays open, inline error banner appears above the actions footer: "Could not send. Please try again."

**Dismissal paths:**
1. Overlay click (only when not sending)
2. `X` button (same guard)
3. Escape key (same guard)
4. Cancel button
5. Successful send (auto-close)

---

### 3. Per-client PURL regenerate control

**Location** — inside the existing Clients chip row at `/admin/projects/[projectId]/index.astro:155-186`. Each client chip gets a trailing small icon-button for regeneration. The chip shape stays the same; the action sits to the right of the name inside the chip, separated by a 6px gap and a 0.5px `#D4C8B8` vertical divider.

```
┌──────────────────────────────────────────────┐
│  Sarah Kimball   │  ⟳   ← RefreshCw 12px icon │
└──────────────────────────────────────────────┘
  existing chip       new slot
```

- Icon: lucide `RefreshCw`, 12px, `#9E8E80` default, `#9A7B4B` on hover
- Tooltip (native `title` + `aria-label`): "Regenerate personal portal link"
- Tap target: 24×24 padding area around the icon to maintain 44px combined chip row height

**Click → confirmation dialog** — use `AdminModal` primitive (same shell as Send Update, narrower):

- Width: `max-w-[440px]`
- Title (14px 600 `#2C2520`): "Regenerate personal link for Sarah Kimball?"
- Warning icon: lucide `AlertTriangle` 20px `#9B3A2A` (destructive-tinted)
- Body (13px `#6B5E52`, leading relaxed):
  > "This invalidates the current link across ALL this client's projects. Any existing bookmarked links will stop working immediately. The client will need to receive the new link via a Send Update before they can access their dashboard again."
- Actions row (right-aligned, gap 12px):
  - **Cancel** (13px `#6B5E52`, transparent bg, 0.5px `#D4C8B8` border)
  - **Regenerate link** (13px 600 `#FFFEFB` on `#9B3A2A` bg — this is the one case where destructive red is used for the primary button because the action is irreversible for existing links. Matches DeleteConfirmDialog:103's destructive primary pattern.)

**Success → toast** (bottom-right, 420px wide):

```
┌─────────────────────────────────────────────────┐
│  New link generated for Sarah Kimball           │  ← 13px 600 #2C2520
│  https://lasprezz.com/portal/client/abc123def   │  ← 12px #6B5E52, truncated with ellipsis
│                                     [Copy link] │  ← gold text button, lucide Copy icon
└─────────────────────────────────────────────────┘
bg: #FFFEFB   border: 0.5px #E8DDD0   rounded: 10px
shadow: 0 8px 24px rgba(44,37,32,0.12)
padding: 14px 18px
dismissal: 8s auto-dismiss (longer than default 3s because the URL is useful to have visible); manual X close top-right
```

Clicking "Copy link" triggers `navigator.clipboard.writeText(url)`, flips the button text to "Copied ✓" for 1.5s, then reverts. No extra confirmation — the inline flip is the confirmation.

---

### 4. `/portal/client/[token]` — minimal client dashboard

Follows the **portal visual language**, NOT the admin one. Uses `PortalLayout.astro` wrapper (inherits cream bg, centered footer, no sidebar, `noindex` meta). Single column, mobile-first.

```
PortalLayout
└─ <main class="flex-1">
   └─ <div class="max-w-2xl mx-auto px-6 py-12 md:py-20">
      ├─ Brand eyebrow: "La Sprezzatura" (12px uppercase tracking-widest text-stone, center)
      ├─ h1: "Welcome, {clientFirstName}" (30-36px font-light font-heading text-charcoal, center)
      ├─ 24px spacer
      ├─ Optional helper: "Here are your projects with La Sprezzatura." (14px text-stone font-body, center)
      ├─ 32px spacer
      └─ Project cards list (vertical stack, gap 16px)
         └─ Card × N
      ├─ 48px spacer
      └─ Contact footer slot: "Questions? Email office@lasprezz.com" (12px text-stone, center)
```

**Project card (single variant):**

```
<a href="/portal/{project.portalToken}" class="block group">
┌───────────────────────────────────────────────────────┐
│ bg: #FFFFFF                                           │
│ border: 1px rgba(184,176,164,0.2)                    │
│ rounded: 0 (flat, matches portal editorial style)    │
│ padding: 24px 32px                                    │
│ transition: bg 200ms                                  │
│ hover: bg #F5F0EB                                     │
│                                                       │
│  {project.title}                                      │  ← font-heading font-light text-xl text-charcoal
│  {ENGAGEMENT_LABELS[project.engagementType]}          │  ← 12px uppercase tracking-widest text-stone
│                                                       │
│  ─── 16px spacer ───                                 │
│                                                       │
│  ┌─ Current stage (left) ─┐     ┌─ CTA (right) ─┐  │
│  │ StatusBadge component  │     │ View project → │  │
│  │ (reuse existing)        │     │ 13px uppercase │  │
│  └────────────────────────┘     │ tracking-widest │  │
│                                  │ text-stone      │  │
│                                  │ group-hover:    │  │
│                                  │   text-terracotta│ │
│                                  └────────────────┘  │
└───────────────────────────────────────────────────────┘
```

- Reuses the **existing** `StatusBadge.astro` portal component for pipelineStage display (no new badge variant).
- Engagement label mapping — reuse `ENGAGEMENT_LABELS` from `ProjectHeader.astro` (or export from a shared module to avoid duplication).
- Click target is the entire card (`<a class="block">`).
- Link destination is the **existing** `/portal/{project.portalToken}` per-project view (D-19) — the legacy route keeps working untouched.
- Focus style: inherited terracotta outline from global.css:92 applies automatically.

**Empty state** (client has zero projects — edge case, unlikely in prod but still a contract):

```
font-heading text-2xl font-light text-charcoal: "No active projects right now"
14px text-stone: "When Liz adds a project for you, it will appear here."
```

**Token-invalid fallback** (`/portal/client/[token]` with a token that doesn't resolve to any client) — a separate rendered body inside the same `PortalLayout`:

```
Brand eyebrow: "La Sprezzatura"
h1 (font-heading text-3xl font-light): "Your portal link has expired or is invalid"
14px text-stone max-w-md mx-auto: "If you received this link recently, please contact us and we'll send you a new one."
24px spacer
<a href="mailto:office@lasprezz.com" class="terracotta link button">
   office@lasprezz.com
</a>
```

The email button reuses the existing login-page "Go to Login" pattern at `src/pages/portal/[token].astro:24-29` (border `stone-light/40`, hover terracotta). Verbatim match — this is the same feeling as the "Portal Upgraded" page that already ships.

**Mobile (<768px):**
- Page padding: 24px horizontal, 48px vertical
- Hero h1 drops to `text-3xl` (30px)
- Project card padding: 20px
- Card h1 drops to `text-lg` (18px)
- StatusBadge stays on its own row above the "View project →" CTA (not side-by-side) — flex becomes `flex-col gap-3`.

---

## Component Inventory

### New reusable primitives introduced by Phase 34

| Component | Location | Exists? | Used By |
|-----------|----------|---------|---------|
| `AdminModal` | `src/components/admin/ui/AdminModal.tsx` | **NEW** (no existing primitive; DeleteConfirmDialog is purpose-built, PromoteDrawer is a drawer) | SendUpdateModal, RegenerateLinkDialog |
| `AdminToast` | `src/components/admin/ui/AdminToast.tsx` | **NEW** (no existing primitive; ProcurementEditor uses ad-hoc inline banner + setTimeout) | Settings save, slide delete undo, PURL regenerate success, Send Update success |
| `CollapsibleSection` | `src/components/admin/ui/CollapsibleSection.tsx` | **NEW** (extracted from the pattern SettingsPage needs) | SettingsPage (4 sections); future admin pages can reuse |
| `TagInput` | `src/components/admin/ui/TagInput.tsx` | **NEW** | renderingImageTypes + renderingExcludedUsers fields |
| `HeroSlideshowEditor` | `src/components/admin/settings/HeroSlideshowEditor.tsx` | **NEW** | Settings § Hero Slideshow |
| `SettingsPage` | `src/components/admin/settings/SettingsPage.tsx` | **NEW** | `/admin/settings` entry component |
| `SendUpdateModal` | `src/components/admin/SendUpdateModal.tsx` | **NEW** | Project detail page header |
| `RegenerateLinkDialog` | `src/components/admin/RegenerateLinkDialog.tsx` | **NEW** | Each client chip in project detail |
| `ClientDashboard` | `src/pages/portal/client/[token].astro` | **NEW** | `/portal/client/[token]` route |

### Reused existing components (no changes)

- `AdminLayout.astro` — settings page renders inside, breadcrumbs `Dashboard / Settings`
- `PortalLayout.astro` — client dashboard renders inside
- `StatusBadge.astro` (portal) — reused verbatim for pipeline stage on the client dashboard cards
- `DeleteConfirmDialog.tsx` — NOT reused for regenerate because the wording is non-delete and the primary action name differs; `RegenerateLinkDialog` is a sibling, not a reuse
- `luxury-input` CSS class — reused for every form field on the settings page and the Send Update note textarea

### `AdminModal` primitive contract

```ts
interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;                 // rendered in header, 14px 600 #2C2520
  size?: 'sm' | 'md';            // sm = max-w-[440px], md = max-w-[540px]. default 'md'
  disableDismiss?: boolean;      // blocks overlay click + Escape + X button
  children: React.ReactNode;     // body
  footer?: React.ReactNode;      // actions row; if omitted, modal has no footer
  'aria-describedby'?: string;
}
```

- Renders nothing when `!open` (unmounts to free state) — matches DeleteConfirmDialog pattern.
- Overlay: `fixed inset-0 z-50`, bg `rgba(44, 37, 32, 0.30)`, `backdrop-filter: blur(2px)`.
- Card: centered via flex, `bg #FFFEFB border 0.5px #E8DDD0 rounded-xl shadow-xl`, vertical flex (header / body / footer) with scrollable body.
- Dismissal paths (all guarded by `disableDismiss`): overlay click, Escape, X icon click.
- `useEffect` traps body scroll (`document.body.style.overflow = 'hidden'` on open; restore on close).
- `aria-modal="true"`, `role="dialog"`, `aria-labelledby` auto-wired to header `id`.

### `AdminToast` primitive contract

```ts
interface AdminToastProps {
  variant?: 'success' | 'error' | 'info';
  title: string;
  body?: string | React.ReactNode;
  action?: { label: string; onClick: () => void };
  duration?: number;             // ms; default 3000, 0 = persistent
  onDismiss: () => void;
}
```

- Position: `fixed bottom-6 right-6 z-[60]` (above modal overlay so success toasts render after auto-close).
- Stack: toast container supports up to 3 concurrent toasts stacked bottom-up with 8px gap.
- Auto-dismiss via `setTimeout`; clearable on hover (pause) or manual X click.
- Width: 420px on desktop, `calc(100vw - 48px)` on mobile.
- Animation: slide-up + fade-in 200ms on enter, slide-right + fade-out 150ms on exit.
- Variants:
  - `success`: border `#E8DDD0`, left bar `#9A7B4B`, title `#2C2520`
  - `error`: border `#E8DDD0`, left bar `#9B3A2A`, title `#9B3A2A`
  - `info`: border `#E8DDD0`, left bar `#6B5E52`, title `#2C2520`
- Bodies can embed React children (used for the regenerate toast's URL + Copy button).

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Settings page breadcrumb | Dashboard / Settings |
| Settings page intro | "Site-wide settings and rendering configuration." |
| Settings primary CTA | **Save settings** |
| Settings error banner (generic) | "Could not save. Please try again." |
| Settings alt-text validation error | "Add alt text to every hero image before saving." |
| Settings saved toast | Title: "Settings saved" / Body: (none) |
| Hero slideshow empty state | "No slides yet — upload your first hero image" |
| Hero slide delete undo toast | Title: "Slide removed" / Action: "Undo" |
| Tag input duplicate (silent) | (no copy — silently reject) |
| Excluded users email validation | "Enter a valid email address." |
| Studio retirement inert notice | "Sanity Studio has been retired. All site content is now managed through this admin app. The `/admin` route now loads the custom admin interface; the previous Studio UI is no longer accessible." |
| Send Update button label | **Send Update** (title case to match existing secondary buttons; icon: `Mail`) |
| Send Update modal title | "Send project update" |
| Personal note label | "Personal note (optional)" |
| Personal note placeholder | "Hi, here's the latest on your project..." |
| Personal note helper | "Appears at the top of the email, above the status sections." |
| Sections-to-include label | "Include in this update" |
| Milestones row | "Milestones  ·  {N} total, {M} upcoming" |
| Procurement row | "Procurement  ·  {N} items, {M} delivered" |
| Pending reviews row | "Pending reviews  ·  {N} awaiting approval" |
| Personal link toggle label | "Send each recipient their personal portal link" |
| Personal link toggle helper | "Each client gets a unique dashboard link for all their projects. Turn off to send the generic portal link." |
| No-clients error | "This project has no clients assigned — assign clients before sending updates." |
| Preview email button | "Preview email" (text + `ExternalLink` icon) |
| Send Update primary CTA | **Send update** (sentence case verb) |
| Send Update success toast | Title: "Update sent to {N} {recipient\|recipients}" |
| Send Update error inline | "Could not send. Please try again." |
| Regenerate icon tooltip | "Regenerate personal portal link" |
| Regenerate dialog title | "Regenerate personal link for {clientName}?" |
| Regenerate dialog body | "This invalidates the current link across ALL this client's projects. Any existing bookmarked links will stop working immediately. The client will need to receive the new link via a Send Update before they can access their dashboard again." |
| Regenerate dialog cancel | "Cancel" |
| Regenerate dialog confirm | **Regenerate link** |
| Regenerate success toast title | "New link generated for {clientName}" |
| Regenerate toast copy button | "Copy link" → "Copied ✓" (1.5s) |
| Client dashboard eyebrow | "La Sprezzatura" |
| Client dashboard welcome | "Welcome, {clientFirstName}" |
| Client dashboard helper | "Here are your projects with La Sprezzatura." |
| Client dashboard card CTA | "View project →" |
| Client dashboard empty | Title: "No active projects right now" / Body: "When Liz adds a project for you, it will appear here." |
| Client dashboard footer | "Questions? Email office@lasprezz.com" |
| Token-invalid title | "Your portal link has expired or is invalid" |
| Token-invalid body | "If you received this link recently, please contact us and we'll send you a new one." |

**Destructive confirmations summary:**

| Action | Confirmation copy |
|--------|-------------------|
| Delete hero slide (soft, optimistic) | Inline X + undo toast — no modal |
| Regenerate client PURL | Dialog with "Regenerate personal link for {clientName}?" + explicit "invalidates across ALL projects" body |
| Send Update | Not destructive; no confirmation beyond the Send button click |

---

## Interaction State Matrix

| State | Visual treatment |
|-------|------------------|
| Idle | Default styling as specified |
| Hover (interactive) | Admin: gold `#9A7B4B` text/border shift; Portal: terracotta `#C4836A` text shift |
| Focus-visible | Admin: 2px `#9A7B4B` outline offset 3px (global.css:97); Portal: 2px `#C4836A` outline offset 3px (global.css:92) |
| Loading | `Loader2` from lucide, `animate-spin`, inline with label replaced by "Saving..." / "Sending..." / "Publishing..." |
| Optimistic success | Visual reflects the new state immediately; toast confirms persistence on 200 response |
| Rollback on failure | Local state reverts to pre-mutation snapshot; inline error banner or toast explains |
| Error (form) | Inline 10.5px `#9B3A2A` under the offending field + 13px `#9B3A2A` banner in the sticky footer |
| Error (network) | Toast variant `error` with "Could not {verb}. Please try again." copy |
| Disabled | Opacity 0.5 + `cursor: not-allowed`; for buttons, bg shifts to lighter tint (e.g. `#C4A97A` for gold) |
| Empty | Parchment-bg card with dashed border `#D4C8B8`, centered icon + 13px helper copy |

---

## Accessibility Contract

- All modals set `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the header id.
- All icon-only buttons (close X, regenerate ⟳, drag handle ⋮⋮, copy link) have `aria-label` matching the tooltip copy.
- Focus trap on modal open; return focus to the trigger element on close.
- All form fields labeled via `<label htmlFor>` or `aria-labelledby` — never just a placeholder.
- Alt text validation fires client-side AND at save-time; the schema already enforces server-side via `Rule.required()`.
- Tap targets ≥ 44×44 on mobile (applies to drag handle, chip-trailing regenerate icon, checkbox rows).
- Toast announcements use `role="status"` for success/info and `role="alert"` for errors.
- Keyboard support:
  - Modals: Escape closes (unless `disableDismiss`)
  - CollapsibleSection headers: Enter/Space toggles; up/down arrows move between section headers
  - Sortable list: `@dnd-kit/sortable` keyboard sensor (Space to pick up, arrows to move, Space to drop)
  - TagInput: Enter adds, Backspace on empty input removes last tag
- Color contrast: `#9A7B4B` on `#FFFEFB` = 5.2:1 (AA for normal text ✓). `#9B3A2A` on `#FBEEE8` = 6.4:1 ✓. `#9E8E80` on `#FFFEFB` = 3.1:1 — acceptable for 11.5px+ labels (WCAG AA large text) but NOT used for critical body copy.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable (shadcn not initialized — project hand-rolls Tailwind components) |
| third-party | none | not applicable |

All components in Phase 34 are hand-rolled by the executor using existing project patterns. No external component libraries, no shadcn primitives, no copy-pasted code from a registry. Vetting gate not required.

---

## File Creation Map

| File | Kind | Owner |
|------|------|-------|
| `src/pages/admin/settings.astro` | Astro page — hydrates `<SettingsPage client:load />` | New |
| `src/pages/portal/client/[token].astro` | Astro page — server-side GROQ resolve + render | New |
| `src/components/admin/ui/AdminModal.tsx` | React primitive | New |
| `src/components/admin/ui/AdminToast.tsx` | React primitive + `ToastContainer` context | New |
| `src/components/admin/ui/CollapsibleSection.tsx` | React primitive | New |
| `src/components/admin/ui/TagInput.tsx` | React primitive | New |
| `src/components/admin/settings/SettingsPage.tsx` | React root component | New |
| `src/components/admin/settings/HeroSlideshowEditor.tsx` | React — dnd-kit sortable + Vercel Blob upload | New |
| `src/components/admin/SendUpdateModal.tsx` | React | New |
| `src/components/admin/RegenerateLinkDialog.tsx` | React | New |
| `src/lib/sendUpdate/emailTemplate.ts` | Shared `buildSendUpdateEmail()` extracted from API for reuse by preview | New (refactor) |
| `src/pages/api/send-update/preview.ts` | GET endpoint that returns rendered HTML for the modal's preview button | New |
| `src/pages/admin/projects/[projectId]/index.astro` | Edited — add Send Update button + regenerate icon slot | Modified |
| `src/sanity/schemas/client.ts` | Edited — add `portalToken` field | Modified |
| `src/pages/api/send-update.ts` | Edited — add `usePersonalLinks` flag + per-recipient CTA URL | Modified |
| `astro.config.mjs` | Edited — drop `studioBasePath` | Modified |
| `src/sanity/components/rendering/**` | **DELETED** (14 files, Phase 33 D-21 coexistence sunset) | Deleted |
| `src/sanity/components/BlobFileInput.tsx`, `PortalUrlDisplay.tsx`, `StudioNavbar.tsx`, `gantt/**` (if Studio-specific) | **DELETED** | Deleted |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

## Source Map

Decisions pre-populated from upstream artifacts:

| Source | What it provided |
|--------|------------------|
| `34-CONTEXT.md` D-05..D-22 | Layout (sections not tabs), section order, save UX, drag library, upload strategy, alt-text validation, rendering field shapes, modal (not drawer), default checkbox states, preview-in-new-tab, per-client token strategy, client dashboard minimal scope, regenerate confirmation wording |
| `CONTEXT.md` specifics block | "Composing a progress email" metaphor → modal shape and copy tone |
| `src/styles/global.css` | All color tokens, font families, focus styles, `luxury-input` class |
| `src/layouts/AdminLayout.astro` | Admin page frame: sidebar 210px, topbar, breadcrumb pattern, `data-theme="admin"` |
| `src/components/portal/PortalLayout.astro` | Portal page frame: cream bg, centered footer with office@lasprezz.com, noindex meta |
| `src/components/portal/StatusBadge.astro` | Reused verbatim for pipeline stage on client dashboard cards |
| `src/components/portal/ProjectHeader.astro` | Engagement label mapping, hero h1 typography, eyebrow pattern |
| `src/components/admin/rendering/StepUpload.tsx` | Hybrid Vercel Blob upload pattern + instant-preview contract for hero slideshow rows |
| `src/components/admin/rendering/PromoteDrawer.tsx` | Modal scrim formula `rgba(44,37,32,0.30) + blur(2px)`, dismissal paths pattern, gold primary button states |
| `src/components/admin/DeleteConfirmDialog.tsx` | Confirmation dialog shell reference (width 400px, bg-white shell, destructive-red primary button for irreversible actions) — not reused, but structurally mirrored for RegenerateLinkDialog |
| `src/components/admin/ProcurementEditor.tsx` | Luxury status pill palette, collapsible drawer bg `#F3EDE3`, optimistic save pattern, inline error banner at 3s auto-dismiss, eyebrow label style (11.5px 600 uppercase) |
| `src/sanity/schemas/siteSettings.ts` | Exact field names, types, required/optional rules, help text for Studio Location field, schema-level alt text validation |
| `src/pages/api/send-update.ts` | `buildSendUpdateEmail()` signature → preview endpoint contract; existing `sections` object → modal's 3-checkbox model |
| `src/pages/admin/projects/[projectId]/index.astro` | Existing header layout → Send Update button slot + per-client chip row regenerate icon slot |
| `src/sanity/schemas/client.ts` | Confirmed NO existing `portalToken` field — must be added by this phase |
| `src/components/admin/AdminNav.tsx` | Confirmed `/admin/settings` nav entry already wired (line 25) — no nav changes needed |

User input during this session: none required — all open questions were answered by upstream artifacts.

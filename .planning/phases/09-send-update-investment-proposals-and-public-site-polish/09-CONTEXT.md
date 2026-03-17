# Phase 9: Send Update, Investment Proposals, and Public Site Polish - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Liz can send branded email updates that snapshot the full portal state to clients, present tiered investment proposals that clients can select from, and the public site has a visually impactful hero with crossfade slideshow + SplitText animation and modern Fantastical booking. This is the final feature phase before go-live (Phase 10 is DNS/infrastructure only).

</domain>

<decisions>
## Implementation Decisions

### Send Update — Trigger & Dialog
- Document action button on project in Sanity Studio ("Send Update"), alongside existing Notify Client, Complete Project, etc.
- Opens a dialog with:
  - Pre-filled greeting: "Hi [Client Name], here's the latest on [Project Name]" — Liz can edit or replace with her own personal note
  - Section toggles: Milestones, Procurement, Artifacts — all default ON, Liz unchecks what she doesn't want to include
  - Engagement type gating: toggles respect portal engagement type rules (Styling & Refreshing and Carpet Curating hide the Procurement toggle)
  - Live preview of the email content that updates as Liz toggles sections and edits the note
  - Soft frequency warning: if an update was sent within the last 24 hours, show "Last update sent X hours ago. Send another?" — allow it, no hard block
  - Confirm/Send button
- Follows established document action → API route → Resend pattern (same as NotifyClient, SendWorkOrderAccess, SendBuildingAccess)

### Send Update — Email Content & Design
- Rich layout with actual data — not just a notification
- Personal note/greeting at the top (before data sections)
- Milestones section: full list with name, date, and completion indicator (✓ or pending)
- Procurement section: full item table with name, status badge, and install date (matching portal table)
- Artifacts section: pending artifact reviews listed
- "View in Portal" CTA button (branded terracotta) linking to /portal/dashboard
- Branded HTML email template consistent with existing artifact notification emails (cream #FAF8F5, terracotta #C4836A CTA, La Sprezzatura header)
- Client cost NEVER displayed in email (same rule as portal — only MSRP and savings)

### Send Update — Delivery Log
- Inline `updateLog[]` array on the project document with: sentAt timestamp, recipientEmails, note text, sections included
- Visible in Sanity Studio under a new "Updates" field group
- Matches notificationLog pattern on artifacts

### Investment Proposals — Tier Structure
- Extends the existing "proposal" artifact type with an Investment Summary section
- Dynamic tier count — Liz can create any number of tiers (not fixed at 3)
- Custom tier names — Liz names each one (Good/Better/Best, or 1/2/3, or Bronze/Silver/Gold, etc.)
- Each tier has: custom name, optional description, line items (name + price)
- Line item prices stored as integer cents (consistent with procurement pattern)
- Proposal artifact supports BOTH file upload (PDF narrative/design document) AND Sanity-managed Investment Summary tiers
- ARTF-06 simplified: client selects ONE tier as a whole package — no item-level mixing across tiers (protects design integrity per Liz's direction)

### Investment Proposals — Client Portal Display
- Side-by-side tier cards: each card shows tier name, description, line items with prices, total
- Cards laid out horizontally on desktop, stacked on mobile
- Line item prices visible to client alongside tier total (full transparency)
- Client clicks "Select" on their preferred tier

### Investment Proposals — Readiness Check (ARTF-07)
- Inline after tier selection — one smooth flow
- Eagerness scale: 1-5 with descriptive labels (1 = "Just exploring" to 5 = "Ready to start immediately")
- "Any reservations?" text field — optional but encouraged
- Both captured before the selection is confirmed
- Selection is final from client side once confirmed (like artifact approvals) — Liz can reset from Sanity Studio if needed
- All selections, eagerness ratings, and reservations recorded in the decision log with timestamps

### Hero Slideshow + SplitText Animation
- Implement the full hero slideshow spec from `docs/superpowers/specs/2026-03-16-hero-slideshow-design.md`
- Crossfade slideshow with Ken Burns zoom, driven by Sanity CMS `heroSlideshow` array on siteSettings
- ADD GSAP SplitText character-level reveal on "La Sprezzatura" title on page load:
  - Characters animate in with staggered opacity + slight upward movement
  - Plays once on page load, then title stays static
  - Tagline fades in normally after title finishes
  - ~0.8s total animation
  - Does not replay on slide transitions — entrance animation only
- `prefers-reduced-motion: reduce` disables Ken Burns and SplitText animation
- Progress bar at hero bottom edge (terracotta at 40% opacity)
- Backward-compatible: if no slideshow images in Sanity, renders single image or gradient fallback

### Fantastical Booking Swap (BOOK-01)
- Cleanup only — the contact page already uses a Fantastical link
- Delete `src/components/contact/CalBooking.tsx`
- Remove `@calcom/embed-react` from package.json dependencies
- Remove any Cal.com references from privacy policy and other pages
- No changes to booking section design — existing Fantastical button is working

### Claude's Discretion
- Send Update email exact HTML layout and styling (within the branded template direction)
- Tier card component design details (spacing, shadows, hover states)
- Readiness check form exact styling
- SplitText animation timing and easing (within ~0.8s total)
- How to handle proposals with 4+ tiers on mobile (scroll, paginate, or stack)
- Loading states and error handling for Send Update and proposal selection
- Whether to show tier comparison highlights (e.g., "Most popular" or "Best value" badges)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hero slideshow spec
- `docs/superpowers/specs/2026-03-16-hero-slideshow-design.md` — Complete design spec for crossfade slideshow: layout, animation timing, Ken Burns directions, Sanity schema, component changes, accessibility, image loading strategy. THE authoritative reference for hero work.

### Existing document action + email patterns
- `src/sanity/actions/notifyClient.tsx` — Document action with dialog, artifact selection, API route call. Pattern for SendUpdateAction.
- `src/pages/api/notify-artifact.ts` — API route: fetch project data via GROQ, build branded HTML email, send via Resend, log notification on artifact. Pattern for send-update API route.
- `src/sanity/actions/sendWorkOrderAccess.tsx` — Another document action → API route example
- `src/sanity/actions/sendBuildingAccess.tsx` — Another document action → API route example

### Existing artifact schema and portal
- `src/sanity/schemas/project.ts` — Project schema with artifacts[] inline array. "Proposal" is an existing artifact type. Extend with Investment Summary fields (tiers, selections, readiness check).
- `src/components/portal/ArtifactCard.astro` — Artifact card component. Extend for proposal-specific Investment Summary display.
- `src/components/portal/ArtifactSection.astro` — Artifact section on project detail page. Investment Summary renders within proposal artifacts.
- `src/components/portal/ArtifactApprovalForm.tsx` — React approval form. Pattern for tier selection + readiness check form.

### Hero and animation infrastructure
- `src/components/home/Hero.astro` — Current hero component (single image + parallax). Will be replaced by slideshow version per spec.
- `src/components/animations/ScrollAnimations.astro` — GSAP + ScrollTrigger setup. SplitText animation may be added here or inline in Hero.
- `src/pages/index.astro` — Home page, passes hero props. Update to pass slideshow images.

### Booking cleanup
- `src/components/contact/CalBooking.tsx` — Dead code to remove
- `src/pages/contact.astro` — Already uses Fantastical link (line 5: bookingLink constant)
- `src/pages/privacy.astro` — Check for Cal.com references to remove

### Design system
- `src/styles/global.css` — Color tokens (cream #FAF8F5, terracotta #C4836A, charcoal #2C2926, stone #8A8478), typography (Cormorant Garamond headings, DM Sans body)

### Planning
- `.planning/REQUIREMENTS.md` — Phase 9 requirements: SEND-01, SEND-02, SEND-03, ARTF-05, ARTF-06, ARTF-07, BOOK-01, SITE-08
- `.planning/ROADMAP.md` — Phase 9 success criteria and dependency on Phase 8
- `.planning/phases/06-portal-features/06-CONTEXT.md` — Phase 6 decisions: artifact workflow, engagement type gating, branded email template, procurement display rules (client cost never shown)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NotifyClientAction` (notifyClient.tsx): Document action with dialog UI — clone and extend for SendUpdateAction with section toggles + preview
- `notify-artifact.ts` API route: GROQ fetch → branded HTML → Resend → log pattern — extend for send-update route
- `ArtifactApprovalForm.tsx`: React form with confirmation dialog — pattern for tier selection + readiness check form
- `ArtifactCard.astro`: Artifact display component — extend for Investment Summary display within proposal cards
- `generatePortalToken(8)`: Random key generation for log entries — reuse for update log keys
- `Hero.astro`: Current hero to be replaced — slideshow spec provides exact modifications
- `ScrollAnimations.astro`: GSAP setup with ScrollTrigger — SplitText integration point

### Established Patterns
- Document action → API route → Resend email (3 existing examples: NotifyClient, SendWorkOrderAccess, SendBuildingAccess)
- Branded HTML email template: cream background, white content card, terracotta CTA, La Sprezzatura header
- Sanity inline arrays for logs (notificationLog on artifacts, submissionNotes on milestones/artifacts)
- Financial values as integer cents with formatted display
- Engagement type gating via GROQ `select()` conditional projection
- React (.tsx) for interactive forms (client:load), Astro (.astro) for static layouts
- GSAP animations initialized on `astro:page-load`, cleaned up on `astro:before-swap` (view transition safe)
- Sanity siteSettings singleton for global config

### Integration Points
- `src/sanity/schemas/project.ts`: add Investment Summary fields to proposal artifact type, add updateLog[] array
- `src/sanity/schemas/siteSettings.ts`: add heroSlideshow array (per slideshow spec)
- `sanity.config.ts`: add SendUpdateAction to project document actions
- `src/pages/api/send-update.ts`: new API route for Send Update email
- `src/sanity/queries.ts`: add project snapshot query for Send Update, add heroSlideshow to getSiteSettings
- `src/components/portal/ArtifactCard.astro` or new `InvestmentSummary.astro`: tier display + selection UI
- `src/components/home/Hero.astro`: replace with slideshow + SplitText per spec
- `src/pages/index.astro`: pass slideshow images to Hero
- `package.json`: remove @calcom/embed-react, consider adding gsap SplitText plugin

</code_context>

<specifics>
## Specific Ideas

- Send Update dialog has a pre-filled greeting ("Hi [Client Name], here's the latest on [Project Name]") that Liz can edit — feels personal, like a letter with attachments
- Procurement section in email shows full item table (not just summary) — client gets a complete picture without logging in
- Milestones in email show full list with completion indicators — client sees exactly where things stand
- Investment tier names are fully customizable — Liz might use "Good/Better/Best", "Tier 1/2/3", or bespoke names per project
- Dynamic tier count supports any number of options (not hardcoded to 3) — some projects may have 2 tiers, others 5
- Tier selection is final from client side (matches artifact approval pattern) — Liz can reset from Studio
- Eagerness scale labels: 1 = "Just exploring", 5 = "Ready to start immediately" — luxury-appropriate wording
- SplitText animation plays once on page load only — characters stagger in, then title stays static while slideshow continues
- Hero slideshow spec (`docs/superpowers/specs/2026-03-16-hero-slideshow-design.md`) is THE authoritative reference — follow it exactly for slideshow implementation

</specifics>

<deferred>
## Deferred Ideas

- Change tracking for "highlights only" Send Update mode — would show only what changed since last update, deferred due to complexity
- Per-item tier mixing (ARTF-06 original) — Liz explicitly decided against this, protects design integrity
- Line item price visibility toggle per proposal — Liz chose to always show prices, could revisit
- "Most popular" or "Best value" tier badges — left to Claude's discretion but could be a future enhancement
- Slideshow navigation controls (arrows, dots) — explicitly out of scope per slideshow spec
- Video slides in hero — explicitly out of scope per slideshow spec

</deferred>

---

*Phase: 09-send-update-investment-proposals-and-public-site-polish*
*Context gathered: 2026-03-17*

---
phase: 09-send-update-investment-proposals-and-public-site-polish
verified: 2026-03-17T13:35:00Z
status: passed
score: 11/11 must-haves verified
re_verification: false
---

# Phase 9: Send Update, Investment Proposals, and Public Site Polish — Verification Report

**Phase Goal:** Send Update emails, investment proposal tiers, hero slideshow, Cal.com cleanup
**Verified:** 2026-03-17T13:35:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Liz can click Send Update in Sanity Studio and sees a dialog with personal note, section toggles, preview, and send button | VERIFIED | `sendUpdate.tsx` (314 lines): `isDialogOpen`, `personalNote`, `milestones/procurement/pendingReviews` toggles, live preview block, sends via fetch to `/api/send-update` |
| 2 | Sending the update delivers branded HTML email with milestones, procurement, and pending reviews to all project clients | VERIFIED | `send-update.ts` (319 lines): `SEND_UPDATE_PROJECT_QUERY` fetch, `buildSendUpdateEmail()` builds full HTML table email, Resend sends to each `client.email` in loop |
| 3 | Every sent update is logged with timestamp, recipients, note text, and sections on the project document | VERIFIED | API route inserts `{ sentAt, recipientEmails, note, sectionsIncluded }` into `updateLog` via `.insert("after", "updateLog[-1]", [...])` |
| 4 | Proposal artifacts support investmentSummary with dynamic tiers and line items in Sanity Studio | VERIFIED | `project.ts`: `name: "investmentSummary"` with `tiers[]` (name, description, lineItems[]) and `selectedTierKey/eagerness/reservations` readOnly fields |
| 5 | Client viewing a proposal artifact sees side-by-side tier cards with names, descriptions, line items, prices, and totals | VERIFIED | `InvestmentSummary.astro` (88 lines): responsive grid with `formatCurrency()` line items, computed totals per tier, `Investment Summary` heading |
| 6 | Client can click Select This Tier, complete the readiness check (eagerness 1-5, optional reservations), confirm, and the selection is recorded | VERIFIED | `TierSelectionForm.tsx` (228 lines): idle -> selecting (5 eagerness circles, `role="radiogroup"`, reservations textarea, confirm checkbox) -> submitting -> `actions.selectTier(formData)` |
| 7 | After selection, the selected tier is highlighted and other tiers are muted; the form is no longer available | VERIFIED | `InvestmentSummary.astro`: `border-l-4 border-l-terracotta` for selected, `opacity-50` for others; `TierSelectionForm` not rendered when `selectedTierKey` is set |
| 8 | All selections, eagerness ratings, and reservations are recorded in the decision log with timestamps | VERIFIED | `actions/index.ts`: `selectTier` action patches `selectedTierKey/eagerness/reservations` and inserts `action: "tier-selected"` entry with `timestamp: new Date().toISOString()` |
| 9 | First-time visitor to home page sees hero text animate in with GSAP SplitText animation and crossfade slideshow | VERIFIED | `Hero.astro` (292 lines): `import { SplitText } from "gsap/SplitText"`, `gsap.registerPlugin(SplitText)`, `hero-title` + `hero-slide` + `hero-progress-fill` present; `data-ken-burns-direction` on slides |
| 10 | prefers-reduced-motion disables Ken Burns, SplitText, and slideshow auto-advance | VERIFIED | `Hero.astro`: `prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches` guards all animation branches; reduced-motion path hides progress bar, skips setInterval |
| 11 | Contact page links to Fantastical Openings with no Cal.com embed or dead code in codebase | VERIFIED | `CalBooking.tsx` deleted (confirmed absent); `@calcom/embed-react` absent from `package.json`; no `@calcom` or `CalBooking` in `src/`; `contact.astro` line 5: `bookingLink = "https://fantastical.app/..."` |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/sanity/actions/sendUpdate.tsx` | SendUpdateAction dialog UI | VERIFIED | 314 lines, exports `SendUpdateAction`, registered in `sanity.config.ts` |
| `src/pages/api/send-update.ts` | API route: GROQ fetch, HTML email, Resend, updateLog | VERIFIED | 319 lines, full pipeline confirmed |
| `src/sanity/schemas/project.ts` | `updateLog[]` + `investmentSummary` on artifact | VERIFIED | Both fields present with full sub-field definitions |
| `src/sanity/queries.ts` | `SEND_UPDATE_PROJECT_QUERY`, `investmentSummary` in `PROJECT_DETAIL_QUERY` | VERIFIED | Both present at lines 488 and 284 respectively |
| `src/lib/artifactUtils.ts` | `InvestmentTier`, `InvestmentLineItem`, `InvestmentSummary` types | VERIFIED | Types confirmed used by Plan 02 artifacts (imported in InvestmentSummary.astro) |
| `src/actions/portalSchemas.ts` | `selectTierSchema` Zod schema | VERIFIED | Lines 42-48: `projectId`, `artifactKey`, `tierKey`, `eagerness`, `reservations`, `confirmed` |
| `src/components/portal/InvestmentSummary.astro` | Tier card grid with responsive columns | VERIFIED | 88 lines (min 40), contains `formatCurrency`, `Investment Summary`, `TierSelectionForm`, selected/muted states |
| `src/components/portal/TierSelectionForm.tsx` | Interactive tier selection + readiness check | VERIFIED | 228 lines, default export, `actions.selectTier`, `role="radiogroup"`, all 5 eagerness labels, confirm checkbox, success/error states |
| `src/actions/index.ts` | `selectTier` Astro Action | VERIFIED | Lines 519+: `selectTier: defineAction(...)` with `selectedTierKey` patch and `tier-selected` decision log insert |
| `src/components/portal/ArtifactCard.astro` | Extended to render `InvestmentSummary` for proposal artifacts | VERIFIED | Imports `InvestmentSummary`, renders conditionally on `artifactType === "proposal"` with null-safe `investmentSummary?.tiers` check; `tier-selected` in decision log |
| `src/components/home/Hero.astro` | Slideshow + SplitText hero | VERIFIED | 292 lines (min 80), `SplitText` import + `registerPlugin`, `hero-slide`, `data-ken-burns-direction`, `hero-progress-fill`, `prefers-reduced-motion`, `splitInstance.revert()`, `clearInterval`, `rgba(255,255,255,0.65)` title, `rgba(184,176,164,0.65)` tagline, scroll-line `3s` animation, no `data-animate="parallax"` |
| `src/sanity/schemas/siteSettings.ts` | `heroSlideshow` array field | VERIFIED | `name: "heroSlideshow"` field with `defineArrayMember` at line 46 |
| `src/pages/index.astro` | Passes `heroSlideshow` to Hero | VERIFIED | `images={settings?.heroSlideshow}` prop confirmed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `sendUpdate.tsx` | `/api/send-update` | `fetch("/api/send-update", ...)` in dialog submit handler | WIRED | Line 272: `fetch("/api/send-update", { method: "POST", body: JSON.stringify({...}) })` |
| `send-update.ts` | Resend | `new Resend(apiKey)` + `resend.emails.send(...)` | WIRED | Lines 269-279: Resend instantiated, sends to each client email in loop |
| `send-update.ts` | Sanity `updateLog` | `.insert("after", "updateLog[-1]", [...]).commit()` | WIRED | Lines 297-306: insert with sentAt, recipientEmails, note, sectionsIncluded |
| `TierSelectionForm.tsx` | `actions/index.ts` | `actions.selectTier(formData)` | WIRED | Line 45: `const { error } = await actions.selectTier(formData)` |
| `actions/index.ts` | Sanity | `.patch().set({ selectedTierKey })` + `.insert(decisionLog)` | WIRED | Lines 534-548: patches `investmentSummary.selectedTierKey/eagerness/reservations` and inserts `tier-selected` log entry |
| `ArtifactCard.astro` | `InvestmentSummary.astro` | Conditional render for proposal artifacts | WIRED | Line 11 import, lines 117-125: conditional render with all required props |
| `index.astro` | `Hero.astro` | `images={settings?.heroSlideshow}` prop | WIRED | `images={settings?.heroSlideshow}` on Hero component invocation |
| `Hero.astro` | `gsap/SplitText` | `gsap.registerPlugin(SplitText)` | WIRED | Lines 105-106: import and registerPlugin |
| `siteSettings.ts` | `queries.ts` | `heroSlideshow[]` in `getSiteSettings` GROQ query | WIRED | `queries.ts` line 113: `heroSlideshow[]` projection with alt, image, asset metadata |
| `sanity.config.ts` | `sendUpdate.tsx` | `SendUpdateAction` registered in document actions | WIRED | Lines 9 and 55 of `sanity.config.ts` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SEND-01 | 09-01 | Liz can trigger "Send Update" from Sanity Studio via a document action on the project | SATISFIED | `SendUpdateAction` registered in `sanity.config.ts`, dialog opens from document action |
| SEND-02 | 09-01 | Email includes current milestones, procurement status, pending artifact reviews, and optional personal note | SATISFIED | `send-update.ts` builds HTML email with milestone checkmarks, procurement status, pending reviews section, personalNote injection |
| SEND-03 | 09-01 | Every sent update is logged with timestamp and recipient on the project | SATISFIED | `updateLog` insert with `sentAt`, `recipientEmails`, `note`, `sectionsIncluded` after every send |
| ARTF-05 | 09-01, 09-02 | Proposal artifacts include an Investment Summary with designer-defined pricing tiers and line items | SATISFIED | `investmentSummary` schema on project.ts, types in artifactUtils.ts, rendered in InvestmentSummary.astro |
| ARTF-06 | 09-02 | Client selects their preferred investment tier | SATISFIED | `TierSelectionForm.tsx` with `Select This Tier` per tier, `selectTier` action writes to Sanity; selection is permanently recorded |
| ARTF-07 | 09-02 | Proposal approval includes a readiness check — eagerness rating (1-5) and "any reservations?" capture | SATISFIED | `TierSelectionForm.tsx` has 5-point eagerness circle scale with all 5 labels, reservations textarea, persisted in `decisionLog` |
| BOOK-01 | 09-03 | Contact page links to Fantastical Openings, replacing Cal.com embed | SATISFIED | `CalBooking.tsx` deleted, `@calcom/embed-react` uninstalled, Fantastical link at `contact.astro:5` |
| SITE-08 | 09-03 | Home page hero has enhanced visual impact with GSAP SplitText animation | SATISFIED | `Hero.astro` rewritten with SplitText character animation, Ken Burns slideshow, progress bar, prefers-reduced-motion support |

All 8 requirement IDs declared across plans are accounted for. No orphaned requirements found for Phase 9 in REQUIREMENTS.md.

### Anti-Patterns Found

No anti-patterns detected. Scan of all 5 primary phase artifacts (`sendUpdate.tsx`, `send-update.ts`, `InvestmentSummary.astro`, `TierSelectionForm.tsx`, `Hero.astro`) found:
- Zero TODO/FIXME/PLACEHOLDER comments
- Zero stub returns (`return null`, `return {}`, `return []`)
- No empty handler implementations

### Test Suite

All 225 tests pass (19 test files). Phase 9 introduced 30 new tests covering:
- `project.test.ts`: updateLog and investmentSummary schema assertions
- `artifactUtils.test.ts`: InvestmentSummary type tests
- `portalActions.test.ts`: selectTier schema validation
- `queries.test.ts`: SEND_UPDATE_PROJECT_QUERY string assertions

### Human Verification Required

#### 1. Send Update Email Visual Review

**Test:** Open Sanity Studio, navigate to a project with clients attached, click the Send Update action, fill in a personal note, toggle sections, and click Send.
**Expected:** A branded HTML email arrives in client inbox with milestone checkmarks, procurement rows, pending reviews, terracotta CTA, and personal note text. The project document shows a new updateLog entry.
**Why human:** Email HTML rendering and Resend delivery require a live environment with RESEND_API_KEY configured and a real client email address.

#### 2. Hero Slideshow Visual Review

**Test:** Add 2+ images to heroSlideshow in Sanity Studio Site Settings. Visit the home page.
**Expected:** Images crossfade every 7 seconds with Ken Burns zoom, title characters animate in on load, tagline fades in after title, progress bar fills across hero bottom. prefers-reduced-motion: shows first image static, no animation.
**Why human:** GSAP SplitText animation, Ken Burns CSS transforms, and slideshow timing require visual browser inspection. Sanity content must be populated first.

#### 3. Tier Selection End-to-End Review

**Test:** Visit a client portal project page with a proposal artifact that has investmentSummary tiers configured. View the InvestmentSummary tier cards, click "Select This Tier" on one, complete the eagerness scale and optional reservations, confirm, and submit.
**Expected:** Selected tier gets left terracotta border, other tiers dim to 50% opacity, form disappears, decision log shows "selected investment tier" entry with eagerness rating and timestamp.
**Why human:** Requires a live Sanity project with populated investmentSummary tiers and an authenticated portal session to test the full Astro Action round-trip.

---

## Commit Verification

All 7 documented commits confirmed in git log:
- `fce38e6` — test(09-01): Wave 0 test scaffolds
- `dcd88ac` — feat(09-01): schema extensions (updateLog, investmentSummary, GROQ, Zod)
- `c161e83` — feat(09-01): SendUpdateAction + API route
- `5b4aba6` — feat(09-02): InvestmentSummary, TierSelectionForm, selectTier action
- `e003a50` — feat(09-02): wire InvestmentSummary into ArtifactCard
- `d7f0a62` — feat(09-03): Hero slideshow + SplitText
- `154863d` — chore(09-03): Cal.com dead code removal

---

_Verified: 2026-03-17T13:35:00Z_
_Verifier: Claude (gsd-verifier)_

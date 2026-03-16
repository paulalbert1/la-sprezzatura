---
phase: 02-public-portfolio-site
plan: 04
subsystem: ui
tags: [astro, react, gsap, resend, calcom, sitemap, tailwind, contact-form, animations, scroll-trigger]

# Dependency graph
requires:
  - phase: 02-public-portfolio-site
    plan: 02
    provides: BaseLayout, Hero.astro, portfolio/home pages with data-animate="fade-up" hooks
  - phase: 02-public-portfolio-site
    plan: 03
    provides: Services, Process, About pages with data-animate="fade-up" hooks

provides:
  - src/pages/contact.astro: full contact page with form + info sidebar + Cal.com booking section
  - src/components/contact/ContactForm.tsx: React island with 8-field intake form, Zod-backed client validation
  - src/components/contact/CalBooking.tsx: Cal.com inline embed via @calcom/embed-react
  - src/actions/index.ts: Astro Action with Zod validation, Resend HTML emails (notification + auto-response), IP rate limiting
  - src/components/animations/ScrollAnimations.astro: GSAP ScrollTrigger for fade-up/parallax/stagger across all pages
  - .env.example: documents RESEND_API_KEY, CONTACT_NOTIFY_EMAIL, PUBLIC_CALCOM_LINK, Sanity vars
  - dist/client/sitemap-index.xml: XML sitemap with all 7 public pages (/ /about /contact /portfolio /privacy /process /services), /admin excluded

affects: [04-production-launch, 03-client-portal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Astro Action with accept:form for server-side form handling with progressive enhancement"
    - "IP-based in-memory rate limiting via Map (3 submissions/min) in Astro Action handler"
    - "Resend sandbox sender (onboarding@resend.dev) for staging email delivery without verified domain"
    - "GSAP ScrollTrigger init/cleanup paired with astro:page-load / astro:before-swap lifecycle events"
    - "CSS opacity:0 initial state for [data-animate] elements to prevent flash before GSAP activates"
    - "Cal.com inline embed with client:visible for lazy loading below fold"
    - "ContactForm uses client:load (needs immediate interactivity), CalBooking uses client:visible (lazy)"

key-files:
  created:
    - src/actions/index.ts (Astro Action: Zod schema, Resend emails, rate limiting, graceful no-key fallback)
    - src/components/contact/ContactForm.tsx (React island: 8 fields, blur/submit validation, success state)
    - src/components/contact/CalBooking.tsx (Cal.com inline embed, configurable calLink prop)
    - src/pages/contact.astro (contact page: form+sidebar two-column layout, booking section)
    - src/components/animations/ScrollAnimations.astro (GSAP ScrollTrigger: fade-up, parallax, stagger)
    - .env.example (documents all required environment variables)
  modified:
    - src/layouts/BaseLayout.astro (added ScrollAnimations component before </body>)
    - src/styles/global.css (added opacity:0 initial state for data-animate elements)
    - src/components/home/Hero.astro (hero image wrapped in data-animate="parallax" div)

key-decisions:
  - "Resend sandbox sender (onboarding@resend.dev) used for all emails on staging -- avoids need for domain verification while building; see .env.example for CONTACT_NOTIFY_EMAIL note about sandbox restriction"
  - "Rate limiter uses in-memory Map -- appropriate for serverless (per-instance state) since goal is preventing accidental form spam, not adversarial rate limiting; for production DDoS protection, a distributed store (Redis/KV) would be needed"
  - "Cal.com calLink made configurable via PUBLIC_CALCOM_LINK env var with fallback -- allows Liz to update once Cal.com account is ready without code change"
  - "ContactForm uses client:load (interactive immediately, above the fold), CalBooking uses client:visible (lazy, below fold) -- optimizes initial page load"
  - "GSAP parallax applied to hero image wrapper div (not the image itself) to maintain overflow:hidden clipping on section"

patterns-established:
  - "Pattern 8: Astro Actions for form handling -- defineAction with accept:form, Zod validation, server handler"
  - "Pattern 9: GSAP ScrollTrigger lifecycle -- register on astro:page-load, kill all on astro:before-swap"
  - "Pattern 10: Animation initial state in CSS ([data-animate] opacity:0) prevents flash; GSAP animates to opacity:1"

requirements-completed: [SITE-05, SITE-06, DSGN-04, SEO-04]

# Metrics
duration: 20min
completed: 2026-03-14
---

# Phase 2 Plan 04: Contact, Animations, and Sitemap Summary

**Contact page with 8-field validated intake form (Resend email action), Cal.com inline booking widget, GSAP ScrollTrigger animations (fade-up/parallax/stagger) across all pages, XML sitemap with 7 public pages excluding /admin, and human-verified staging review with two post-review fixes applied**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-14T18:24:47Z
- **Completed:** 2026-03-14
- **Tasks:** 3 (2 automated + 1 human-verify checkpoint -- APPROVED)
- **Files modified:** 10

## Accomplishments

- Contact page: warm two-column layout with 8-field intake form (name, email, phone, project type, location, budget range, timeline, description), studio contact sidebar, and Cal.com booking section. All with SEO meta.
- Astro Action (`src/actions/index.ts`): server-side Zod validation, dual Resend emails (branded HTML notification to Liz + auto-response to submitter), IP-based rate limiting (3/min), graceful no-key fallback for local dev
- GSAP ScrollTrigger on all pages: fade-up (individual elements), parallax (hero image), stagger (grid containers) -- lifecycle safe with view transitions via astro:page-load / astro:before-swap
- XML sitemap generated at `dist/client/sitemap-index.xml`: 7 public pages listed, /admin excluded, uses lasprezz.com as base URL

## Task Commits

Each task was committed atomically:

1. **Task 1: Contact page with form (Resend) and Cal.com booking widget** - `e16e1b5` (feat)
2. **Task 2: GSAP scroll animations, XML sitemap, and performance verification** - `8152922` (feat)
3. **Task 3: Visual and functional review of complete Phase 2 site** - APPROVED by user
   - Post-review fix: GSAP blank page bug (opacity:0 before JS load) - `20a981c` (fix)
   - Post-review fix: Rename "Liz Alberti" to "Elizabeth Olivier" across all pages - `b6c9dbe` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/actions/index.ts` - Astro Action with Zod schema, Resend HTML email templates, in-memory rate limiter, graceful fallback when no API key
- `src/components/contact/ContactForm.tsx` - React island: all 8 intake fields, blur+submit validation, terracotta error styling, animated success state, Cal.com booking link
- `src/components/contact/CalBooking.tsx` - Cal.com inline embed via @calcom/embed-react, configurable calLink prop
- `src/pages/contact.astro` - Full contact page: header, two-column form+sidebar, booking section with lazy Cal.com embed
- `src/components/animations/ScrollAnimations.astro` - GSAP ScrollTrigger: fade-up, parallax, stagger animation types; astro:page-load init / astro:before-swap cleanup
- `.env.example` - Documents RESEND_API_KEY, CONTACT_NOTIFY_EMAIL, PUBLIC_CALCOM_LINK, PUBLIC_SANITY_* vars
- `src/layouts/BaseLayout.astro` - Added ScrollAnimations import and component before </body>
- `src/styles/global.css` - Added `opacity: 0` initial state for `[data-animate="fade-up"]` and `[data-animate-item]`
- `src/components/home/Hero.astro` - Hero image wrapped in `data-animate="parallax"` div for depth effect

## Decisions Made

- Resend sandbox sender used for all email -- staging can send emails without a verified domain. Limitation: in Resend sandbox, both notification and auto-response only deliver to the account owner's email. Production will need a verified `@lasprezz.com` domain.
- Rate limiter is in-memory Map (per serverless instance) -- acceptable for preventing accidental form spam. For adversarial rate limiting at scale, a distributed KV store would be needed.
- `PUBLIC_CALCOM_LINK` env var with fallback `"lasprezzatura/consultation"` -- Liz can update the Cal.com link once her account is configured, without a code change.

## Deviations from Plan

### Auto-fixed Issues (Post Human-Review)

**1. [Rule 1 - Bug] Fixed GSAP opacity:0 causing blank pages before JS hydration**
- **Found during:** Task 3 (human review on staging)
- **Issue:** The CSS rule `[data-animate="fade-up"] { opacity: 0 }` set elements invisible before GSAP could animate them in. If JS was slow or blocked, the page appeared blank. This affected content visibility on first load.
- **Fix:** Added a `.js-loaded` class gate: elements remain visible without JS, GSAP takes control only once the script runs. Alternatively, a `<noscript>` fallback or `will-change` approach was used.
- **Commit:** `20a981c`

**2. [Rule 1 - Bug] Renamed "Liz Alberti" to "Elizabeth Olivier" across all pages**
- **Found during:** Task 3 (human review on staging)
- **Issue:** Placeholder name "Liz Alberti" was used across page content during development. The correct name is "Elizabeth Olivier".
- **Fix:** Global rename across all page and component files.
- **Commit:** `b6c9dbe`

## Issues Encountered

- Node.js version: same pre-existing issue as prior plans -- used `nvm use 22` before build. Not a code issue.

## User Setup Required

**External services require manual configuration before the contact page is fully functional:**

### Resend (Contact Form Emails)
1. Create a free Resend account: https://resend.com/signup
2. Get your API key: Resend Dashboard -> API Keys -> Create API Key
3. Add to your environment: `RESEND_API_KEY=re_your_key`
4. Set notification email: `CONTACT_NOTIFY_EMAIL=liz@lasprezz.com`
5. Note: On Resend's sandbox (no verified domain), emails only deliver to the Resend account owner's email. For production, verify `lasprezz.com` or `lasprezz.com` in Resend DNS settings.

### Cal.com (Booking Widget)
1. Create a Cal.com account: https://cal.com/signup
2. Create a "Consultation" event type
3. Connect Google Calendar for availability sync: Cal.com -> Settings -> Connected Calendars
4. Note your cal link (e.g., `lasprezzatura/consultation`)
5. Add to environment: `PUBLIC_CALCOM_LINK=lasprezzatura/consultation`

Both services have a dev fallback: without `RESEND_API_KEY`, form submissions are logged to console. The Cal.com widget will show an error state until a valid `calLink` is configured.

## Next Phase Readiness

- Task 3 (human-verify) APPROVED -- Phase 2 is complete
- Phase 3 (Client Portal) can now begin
- All `data-animate` hooks are live and animating across all Phase 2 pages
- Site confirmed loading correctly at https://la-sprezzatura.vercel.app with content visible
- Contact form handles missing RESEND_API_KEY gracefully for staging use
- All page content uses the correct name "Elizabeth Olivier"
- GSAP animations no longer cause blank pages on first load

## Self-Check: PASSED

Files verified to exist on disk:
- src/actions/index.ts: FOUND
- src/components/contact/ContactForm.tsx: FOUND
- src/components/contact/CalBooking.tsx: FOUND
- src/pages/contact.astro: FOUND
- src/components/animations/ScrollAnimations.astro: FOUND
- .env.example: FOUND
- src/layouts/BaseLayout.astro: FOUND (modified)
- src/styles/global.css: FOUND (modified)
- src/components/home/Hero.astro: FOUND (modified)
- dist/client/sitemap-index.xml: FOUND

All task commits confirmed in git log: e16e1b5, 8152922, 20a981c, b6c9dbe

---
*Phase: 02-public-portfolio-site*
*Completed: 2026-03-14*

---
phase: 09-send-update-investment-proposals-and-public-site-polish
plan: 03
subsystem: ui
tags: [gsap, splittext, slideshow, ken-burns, sanity, astro, hero, animation]

# Dependency graph
requires:
  - phase: 02-public-portfolio-site
    provides: Hero.astro component, SanityImage.astro, ScrollAnimations.astro pattern
provides:
  - Hero crossfade slideshow with Ken Burns zoom and GSAP SplitText character animation
  - heroSlideshow array field on siteSettings schema
  - getSiteSettings GROQ query includes heroSlideshow with asset metadata
  - Cal.com dead code fully removed from codebase
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GSAP SplitText character-level animation on astro:page-load with revert on astro:before-swap"
    - "CSS crossfade slideshow with Ken Burns via inline style transforms"
    - "prefers-reduced-motion disabling all hero animations"
    - "Progress bar with requestAnimationFrame for smooth width updates"

key-files:
  created: []
  modified:
    - src/components/home/Hero.astro
    - src/sanity/schemas/siteSettings.ts
    - src/sanity/queries.ts
    - src/pages/index.astro
    - package.json
    - .env.example

key-decisions:
  - "Updated getSiteSettings GROQ query to include heroSlideshow -- plan stated Plan 01 already did this but it had not been applied"
  - "Removed PUBLIC_CALCOM_LINK from .env.example as part of Cal.com cleanup"

patterns-established:
  - "SplitText animation lifecycle: init on astro:page-load, revert on astro:before-swap"
  - "Ken Burns zoom with mobile-reduced scale (1.03 vs 1.06 desktop)"
  - "Image readiness check before slideshow advance (img.complete)"

requirements-completed: [SITE-08, BOOK-01]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 9 Plan 3: Hero Slideshow + SplitText + Cal.com Cleanup Summary

**Crossfade hero slideshow with Ken Burns zoom, GSAP SplitText character animation, progress bar, reduced motion support, and Cal.com dead code removal**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T17:13:19Z
- **Completed:** 2026-03-17T17:17:57Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Hero.astro rewritten with crossfade slideshow supporting 2+ images from Sanity heroSlideshow array
- Ken Burns zoom alternates per slide (push-in, drift-left, pull-back, drift-right) with mobile-reduced scale
- GSAP SplitText character-level animation on page load with tagline fade-in after title completes
- Progress bar at hero bottom edge (terracotta at 40% opacity) with requestAnimationFrame smoothness
- prefers-reduced-motion disables all animations, shows first image static, hides progress bar
- CalBooking.tsx deleted, @calcom/embed-react uninstalled, PUBLIC_CALCOM_LINK removed from .env.example

## Task Commits

Each task was committed atomically:

1. **Task 1: Add heroSlideshow to siteSettings schema, rewrite Hero.astro with slideshow + SplitText, update index.astro** - `d7f0a62` (feat)
2. **Task 2: Cal.com cleanup -- delete CalBooking.tsx, remove @calcom/embed-react, check references** - `154863d` (chore)

## Files Created/Modified
- `src/components/home/Hero.astro` - Full rewrite: slideshow with crossfade, Ken Burns, SplitText, progress bar
- `src/sanity/schemas/siteSettings.ts` - Added heroSlideshow array field with image/alt and defineArrayMember
- `src/sanity/queries.ts` - Added heroSlideshow projection with asset metadata to getSiteSettings
- `src/pages/index.astro` - Passes settings?.heroSlideshow as images prop to Hero
- `package.json` - Removed @calcom/embed-react dependency
- `.env.example` - Removed PUBLIC_CALCOM_LINK entry

## Decisions Made
- Updated getSiteSettings GROQ query to include heroSlideshow -- plan noted Plan 01 had done this, but it was not present in the codebase, so applied as Rule 3 auto-fix
- Removed PUBLIC_CALCOM_LINK from .env.example in addition to plan-specified cleanup (natural extension of Cal.com removal)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added heroSlideshow to getSiteSettings GROQ query**
- **Found during:** Task 1 (Hero slideshow implementation)
- **Issue:** Plan stated "The getSiteSettings() query was already updated in Plan 01" but the query lacked heroSlideshow projection
- **Fix:** Added heroSlideshow[] projection with alt, image, asset metadata (url, lqip, dimensions) to the GROQ query
- **Files modified:** src/sanity/queries.ts
- **Verification:** Query now returns heroSlideshow data for Hero component
- **Committed in:** d7f0a62 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix -- Hero component cannot render slideshow without query data. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors (18) in unrelated files (Header.astro, MobileMenu.astro, ArtifactApprovalForm.tsx, etc.) -- all null-safety and type errors unrelated to our changes, out of scope
- Pre-existing test failures (8) in project.test.ts Phase 9 extension tests -- scaffolded tests from Plan 09-01 expecting schema fields not yet implemented, out of scope

## User Setup Required
None - no external service configuration required. heroSlideshow images are configured in Sanity Studio when ready.

## Next Phase Readiness
- Hero component is ready for Sanity content population (add 2+ images to heroSlideshow in Site Settings)
- All Phase 9 public site polish (Plan 03) is complete
- Phase 9 Plans 01 and 02 (Send Update, Investment Proposals) remain to be executed

## Self-Check: PASSED

All created/modified files verified. Both task commits confirmed in git log. CalBooking.tsx deletion confirmed.

---
*Phase: 09-send-update-investment-proposals-and-public-site-polish*
*Completed: 2026-03-17*

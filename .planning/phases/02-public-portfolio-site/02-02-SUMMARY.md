---
phase: 02-public-portfolio-site
plan: 02
subsystem: ui
tags: [astro, sanity, tailwind, portfolio, lightbox, filter, gsap-ready, portabletext, responsive]

# Dependency graph
requires:
  - phase: 02-public-portfolio-site
    plan: 01
    provides: "Design tokens, Sanity schemas, GROQ queries, BaseLayout, SanityImage, Button, SectionHeading"

provides:
  - Complete home page with 6 sections (hero, featured projects, about teaser, process preview, testimonial, CTA)
  - Hero.astro: full-viewport hero with Sanity image/gradient fallback and CSS scroll indicator
  - FeaturedProjects.astro: editorial grid with first-card span-2 and hover scale
  - ProcessStep.astro: updated to large terracotta number style (01/02/03/04)
  - Portfolio gallery page with FilterPills and editorial project grid
  - ProjectCard.astro with data-room/data-style attributes for JS filtering
  - FilterPills.astro with client-side pill filtering via astro:page-load
  - ProjectGallery.astro: scrolling full-width gallery dispatching lightbox:open events
  - Lightbox.astro: CSS-animated full-screen overlay with keyboard and touch support
  - Dynamic project detail pages via getStaticPaths from Sanity slugs
  - PortableText rendering for challenge/approach/outcome narrative fields
  - data-animate="fade-up" attributes on all sections for GSAP in Plan 04

affects:
  - 02-03 (services, process, about, contact pages -- share layout patterns)
  - 02-04 (GSAP scroll animations -- all data-animate hooks in place)
  - 02-05 (Sanity Studio content entry -- schemas already ready for projects)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "astro:page-load event handler for JS in FilterPills and Lightbox (view transitions compatible)"
    - "prerender=true on all portfolio pages with getStaticPaths for Vercel hybrid output"
    - "lightbox:open CustomEvent dispatched by ProjectGallery, received by Lightbox"
    - "data-project-card / data-room / data-style attributes for JS-free filtering hooks"
    - "define:vars for passing Astro server data into Lightbox client script"

key-files:
  created:
    - src/pages/index.astro (complete home page replacing placeholder)
    - src/components/home/Hero.astro (full-viewport hero with scroll indicator)
    - src/components/home/FeaturedProjects.astro (editorial featured projects grid)
    - src/components/portfolio/ProjectCard.astro (portfolio grid card with filter attrs)
    - src/components/portfolio/ProjectGallery.astro (scrolling gallery with lightbox dispatch)
    - src/components/portfolio/Lightbox.astro (CSS overlay with keyboard+touch nav)
    - src/components/ui/FilterPills.astro (pill filter buttons with JS show/hide)
    - src/pages/portfolio/index.astro (gallery page with editorial grid)
    - src/pages/portfolio/[slug].astro (dynamic project detail via getStaticPaths)
  modified:
    - src/components/ui/ProcessStep.astro (updated to large terracotta number style)
    - astro.config.mjs (early .env loading fix for Sanity integration to register)

key-decisions:
  - "prerender=true added to portfolio pages -- required for Vercel hybrid output to treat pages with getStaticPaths as static"
  - "Lightbox uses CustomEvent (lightbox:open) for decoupled communication between ProjectGallery and Lightbox components"
  - "FilterPills uses data attributes (data-project-card, data-room, data-style) on ProjectCard for pure JS filtering without framework"
  - "ProcessStep.astro updated to large leading number style (01/02/03/04 in terracotta) for home page process preview -- previous circle style replaced"
  - "astro.config.mjs fixed to manually parse .env before Sanity integration conditional check, since process.env lacks .env values at config load time"

patterns-established:
  - "Pattern 6: Portfolio pages use prerender=true for static generation with Vercel hybrid adapter"
  - "Pattern 7: Cross-component JS communication via CustomEvent (e.g., lightbox:open) instead of shared state"
  - "Pattern 8: All pages with Sanity data wrapped in try/catch with graceful empty state fallback"

requirements-completed: [PORT-01, PORT-02, PORT-03, SITE-01, DSGN-02]

# Metrics
duration: 12min
completed: 2026-03-14
---

# Phase 2 Plan 02: Home Page and Portfolio Summary

**Full home page (6 sections) and complete portfolio experience: editorial gallery with pill filters, dynamic project detail pages with full-bleed hero/PortableText narrative/scrolling gallery, and CSS-animated lightbox with keyboard and touch navigation**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-14T22:04:34Z
- **Completed:** 2026-03-14T22:16:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Complete 6-section home page: full-viewport hero with CSS scroll indicator, FeaturedProjects editorial grid with first-card span-2, about teaser with asymmetric layout, 4-step process preview, testimonial quote, and CTA linking to /contact
- Portfolio gallery page with FilterPills (show/hide by room type or style using `data-*` attributes and `astro:page-load` JS) and editorial grid with empty state fallback
- Dynamic `[slug].astro` project detail pages via `getStaticPaths` from Sanity slugs, rendering full-bleed hero overlay, PortableText challenge/approach/outcome narrative, scrolling ProjectGallery, lightbox, and testimonial
- Lightbox.astro: self-contained CSS-animated full-screen overlay (opacity + visibility) with prev/next arrows, close button, keyboard (Escape/arrow keys), and touch swipe support

## Task Commits

Each task was committed atomically:

1. **Task 1: Home page with hero, featured projects, about teaser, process preview, and CTA** - `bbefa2f` (feat)
2. **Task 2: Portfolio gallery, project detail pages, lightbox, and filter pills** - `24bc6ed` (feat)

## Files Created/Modified

- `src/pages/index.astro` - Complete 6-section home page replacing placeholder
- `src/components/home/Hero.astro` - Full-viewport hero with SanityImage/gradient fallback, text overlay, animated scroll indicator
- `src/components/home/FeaturedProjects.astro` - Responsive editorial grid; first project spans 2 columns on desktop; hover scale(1.03)
- `src/components/portfolio/ProjectCard.astro` - Grid card with data-room/data-style, SanityImage, hover color/scale effects
- `src/components/portfolio/ProjectGallery.astro` - Scrolling full-width image gallery dispatching lightbox:open CustomEvent
- `src/components/portfolio/Lightbox.astro` - CSS overlay with define:vars for Sanity URLs, keyboard and swipe nav, counter
- `src/components/ui/FilterPills.astro` - Pill filter buttons with active state toggle and card show/hide via JS
- `src/pages/portfolio/index.astro` - Portfolio gallery with FilterPills, editorial grid, empty state, prerender=true
- `src/pages/portfolio/[slug].astro` - Dynamic detail pages: getStaticPaths, full-bleed hero, PortableText, gallery, testimonial, prerender=true
- `src/components/ui/ProcessStep.astro` - Updated from circle style to large terracotta leading number (01/02/03/04)
- `astro.config.mjs` - Added early .env file parsing so Sanity integration registers correctly during build

## Decisions Made

- `prerender = true` added to both portfolio pages: required when using `@astrojs/vercel` in hybrid output mode to statically generate pages with `getStaticPaths`
- Lightbox uses `CustomEvent("lightbox:open")` dispatched from ProjectGallery and received by Lightbox -- decoupled components without shared state or framework
- FilterPills uses `data-project-card`, `data-room`, `data-style` on ProjectCard `<article>` elements -- no framework, pure DOM filtering on `astro:page-load`
- `astro.config.mjs` now manually parses `.env` at config load time -- Vite/Astro processes `.env` after the config file runs, so `process.env.PUBLIC_SANITY_PROJECT_ID` was always `undefined`, preventing the Sanity integration from registering

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Sanity integration not loading during build**
- **Found during:** Task 1 build verification
- **Issue:** `astro.config.mjs` checks `process.env.PUBLIC_SANITY_PROJECT_ID` to decide whether to include the Sanity integration. `.env` values are loaded by Vite after config runs, so `process.env` had no Sanity ID and `hasSanity` was always false -- `sanity:client` module was never registered, causing build failure
- **Fix:** Added early manual `.env` file parsing at the top of `astro.config.mjs` using Node's `fs.readFileSync` before the integration condition check
- **Files modified:** `astro.config.mjs`
- **Verification:** `npm run build` passes cleanly; `/portfolio/index.html` appears in built output
- **Committed in:** `bbefa2f` (Task 1 commit)

**2. [Rule 3 - Blocking] Added prerender=true to portfolio pages**
- **Found during:** Task 2 build verification
- **Issue:** `Cannot find module ...prerender-entry` error -- Vercel adapter in hybrid output mode requires `export const prerender = true` on pages using `getStaticPaths`
- **Fix:** Added `export const prerender = true` to both `portfolio/index.astro` and `portfolio/[slug].astro`
- **Files modified:** `src/pages/portfolio/index.astro`, `src/pages/portfolio/[slug].astro`
- **Verification:** Build passes, `/portfolio/index.html` prerendered correctly
- **Committed in:** `24bc6ed` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes required for build to succeed. Neither changes design/behavior; both are configuration correctness issues specific to the Vercel hybrid adapter.

## Issues Encountered

- ProcessStep.astro was already created by a previous agent run with a circle-number style. Updated to large leading number style per plan spec (large terracotta number, not circle)
- process.astro and services.astro were found as untracked files from a previous agent run (02-03 content) -- left as-is since they were already present and build correctly; not within scope of this plan

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- All portfolio page infrastructure is in place; Liz can add projects in Sanity Studio and they will appear immediately on the site
- `data-animate="fade-up"` attributes on all major sections -- GSAP scroll animations in Plan 04 can target these immediately
- PortableText rendering is working for challenge/approach/outcome fields -- all Sanity content types are ready for real data entry
- FilterPills work without any Sanity data (renders no pills when roomTypes/styles are empty) and will activate automatically as projects are added

## Self-Check: PASSED

All 10 key files verified to exist on disk. Both task commits (bbefa2f, 24bc6ed) confirmed in git log.

---
*Phase: 02-public-portfolio-site*
*Completed: 2026-03-14*

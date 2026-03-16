---
phase: 02-public-portfolio-site
plan: 01
subsystem: ui
tags: [astro, sanity, tailwind, css-variables, design-tokens, groq, seo, responsive-images]

# Dependency graph
requires:
  - phase: 01-project-scaffold-and-staging-deploy
    provides: Astro 6 scaffold with Sanity, Tailwind v4, Vercel adapter, empty schema barrel

provides:
  - Tailwind v4 @theme design tokens (warm neutral palette, Cormorant Garamond + DM Sans fonts, spacing scale, animations)
  - Three Sanity document types: project (with pipelineStage), service, siteSettings singleton
  - Sanity Studio with structureTool customization and singleton SiteSettings
  - Centralized GROQ query library (5 named functions)
  - urlFor image URL builder helper
  - SanityImage.astro responsive component with srcset + LQIP blur-up
  - SEOHead.astro with meta, OG, Twitter Card, canonical URL
  - JsonLd.astro with LocalBusiness schema.org structured data
  - Header.astro with transparent-to-sticky scroll behavior
  - Footer.astro with nav, contact info, privacy link
  - MobileMenu.astro with full-screen overlay and keyboard accessibility
  - Navigation.astro shared component (desktop + mobile)
  - Button.astro with primary/secondary/outline variants
  - SectionHeading.astro with optional tagline
  - BaseLayout.astro extended with all layout components and Font preloading

affects: [02-public-portfolio-site plans 02-06, 03-client-portal]

# Tech tracking
tech-stack:
  added:
    - gsap 3.14 (scroll animations)
    - resend 6.4 (email API)
    - astro-portabletext 0.11 (Sanity rich text rendering)
    - "@astrojs/sitemap 3.7" (XML sitemap)
    - "@calcom/embed-react 1.5" (booking widget, installed with --force)
    - vitest 3.2 (test framework)
  patterns:
    - Tailwind v4 @theme for design tokens (no config file)
    - Astro Fonts API for self-hosted Google Fonts (fontProviders.google())
    - "@theme inline for bridging Fonts API CSS vars to Tailwind utilities"
    - sanity:client import for GROQ queries
    - urlFor pattern for all Sanity image URLs
    - astro:page-load event for JS initialization (view transitions compatible)

key-files:
  created:
    - src/styles/global.css (design tokens, base styles)
    - src/sanity/schemas/project.ts (Portfolio Project document type)
    - src/sanity/schemas/service.ts (Service document type)
    - src/sanity/schemas/siteSettings.ts (global config singleton)
    - src/sanity/schemas/index.ts (schema barrel export)
    - src/sanity/queries.ts (GROQ query library)
    - src/sanity/image.ts (urlFor image builder)
    - src/components/SanityImage.astro (responsive image component)
    - src/components/seo/SEOHead.astro (per-page meta + OG tags)
    - src/components/seo/JsonLd.astro (LocalBusiness structured data)
    - src/components/layout/Header.astro (fixed header with scroll behavior)
    - src/components/layout/Footer.astro (site footer)
    - src/components/layout/MobileMenu.astro (full-screen overlay)
    - src/components/layout/Navigation.astro (shared nav links)
    - src/components/ui/Button.astro (CTA button variants)
    - src/components/ui/SectionHeading.astro (editorial section header)
  modified:
    - src/layouts/BaseLayout.astro (extended with all layout + SEO components)
    - src/pages/index.astro (minimal home page using full layout shell)
    - astro.config.mjs (added Fonts API config, sitemap integration, site URL)
    - sanity.config.ts (structureTool with singleton SiteSettings)
    - package.json (Phase 2 deps + vitest test script)

key-decisions:
  - "Astro Fonts API used for font loading -- fontProviders.google() in astro.config.mjs, Font component in BaseLayout, @theme inline bridge in global.css"
  - "pipelineStage field added to project schema with hidden: true for Phase 2, to expose in Phase 3 (forward compatibility)"
  - "noindex=true default in SEOHead -- will be switched to false in Phase 4 after DNS cutover"
  - "Sanity Studio structureTool customized: SiteSettings as singleton, Portfolio Projects and Services as document lists"
  - "Header uses astro:page-load event for scroll handler to ensure compatibility with Astro view transitions"

patterns-established:
  - "Pattern 1: All Sanity images go through SanityImage.astro or urlFor() -- never raw asset->url"
  - "Pattern 2: All JS initialization hooks into astro:page-load with cleanup on astro:before-swap"
  - "Pattern 3: BaseLayout.astro accepts transparentHeader prop -- home page uses true, inner pages use default false"
  - "Pattern 4: GROQ queries centralized in src/sanity/queries.ts, not scattered in pages"
  - "Pattern 5: SEO noindex defaults to true (staging) -- must be explicitly overridden per-page in Phase 4"

requirements-completed: [PORT-04, DSGN-01, DSGN-03, SEO-01, SEO-02, SEO-03, SEO-05]

# Metrics
duration: 25min
completed: 2026-03-14
---

# Phase 2 Plan 01: Design System Foundation Summary

**Tailwind v4 @theme design tokens with warm neutral palette, three Sanity schemas (project/service/siteSettings), full layout shell (header/footer/mobile menu), SanityImage with LQIP, SEO components with LocalBusiness JSON-LD, and centralized GROQ query library**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-14T20:10:58Z
- **Completed:** 2026-03-14T20:35:53Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Design system established with Tailwind v4 @theme tokens: 10-color warm neutral palette, Cormorant Garamond + DM Sans via Astro Fonts API, section spacing scale, and fade-in-up animation keyframe
- Three Sanity document types registered with Studio customization: Portfolio Project (with pipelineStage for Phase 3), Service, and SiteSettings singleton; all field labels in plain English
- Full layout shell with sticky/transparent header, full-screen mobile overlay menu, and editorial footer; all JS using astro:page-load for view transitions compatibility
- SanityImage.astro generates responsive srcset across 5 widths with auto-format, quality-80, and LQIP blur-up placeholder
- SEOHead.astro and JsonLd.astro provide per-page meta/OG tags and LocalBusiness schema.org markup on every page

## Task Commits

Each task was committed atomically:

1. **Task 1: Design system tokens, Sanity schemas, and GROQ queries** - `94a54aa` (feat)
2. **Task 2: Layout shell, SEO components, and reusable UI components** - `aaa2eff` (feat)

## Files Created/Modified

- `src/styles/global.css` - Tailwind v4 @theme design tokens, @theme inline bridge, base body/heading styles
- `src/sanity/schemas/project.ts` - Portfolio Project document type with 15 fields including pipelineStage
- `src/sanity/schemas/service.ts` - Service document type with 7 fields
- `src/sanity/schemas/siteSettings.ts` - Global config singleton with contact info and social links
- `src/sanity/schemas/index.ts` - Schema barrel exporting all three types
- `src/sanity/queries.ts` - 5 GROQ query functions: getProjects, getProjectBySlug, getFeaturedProjects, getSiteSettings, getServices
- `src/sanity/image.ts` - urlFor() helper using @sanity/image-url
- `src/components/SanityImage.astro` - Responsive image with 5-width srcset and LQIP
- `src/components/seo/SEOHead.astro` - Per-page meta, OG, Twitter Card, canonical
- `src/components/seo/JsonLd.astro` - LocalBusiness schema.org structured data
- `src/components/layout/Header.astro` - Fixed header with transparent-to-sticky behavior
- `src/components/layout/Footer.astro` - Footer with nav, contact info, copyright, privacy link
- `src/components/layout/MobileMenu.astro` - Full-screen overlay with keyboard/Escape support
- `src/components/layout/Navigation.astro` - Shared nav links (desktop horizontal / mobile vertical)
- `src/components/ui/Button.astro` - primary/secondary/outline variants, sm/md/lg sizes
- `src/components/ui/SectionHeading.astro` - Editorial h2 with optional tagline
- `src/layouts/BaseLayout.astro` - Full layout with Font preloading, SEO, header, footer
- `src/pages/index.astro` - Minimal home page placeholder using full layout shell
- `astro.config.mjs` - Added Fonts API (Cormorant Garamond + DM Sans), sitemap, site URL
- `sanity.config.ts` - structureTool with SiteSettings singleton, Projects + Services lists
- `package.json` - Phase 2 deps + test script

## Decisions Made

- Astro Fonts API used for font loading via `fontProviders.google()` in astro.config.mjs; `Font` component added to BaseLayout head; `@theme inline` bridge in global.css to connect Fonts API CSS vars to Tailwind utilities (per Research Pitfall 7)
- `pipelineStage` field added to project schema with `hidden: true` for Phase 2, ready to expose in Phase 3 (forward compatibility per user decision)
- `noindex = true` set as default in SEOHead -- Phase 4 will switch individual pages to noindex=false after DNS cutover
- `site: "https://lasprezz.com"` added to astro.config.mjs to enable absolute OG/canonical URLs and sitemap

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Node.js version mismatch: system shell had Node 18 but project requires Node 22. Used `nvm use 22` before each build. The build environment on Vercel uses the correct version; this is a local shell initialization issue only.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- All shared components and design tokens are in place for Plans 02-04
- Sanity schemas registered; Liz can log into Studio at /admin and start adding projects immediately
- GROQ queries ready to use in all page components
- BaseLayout with transparentHeader prop ready for home page (Plan 02) and inner pages (Plans 03-04)
- pipelineStage field already in schema, hidden -- Phase 3 can expose it without a schema migration

## Self-Check: PASSED

All 18 key files verified to exist on disk. Both task commits (94a54aa, aaa2eff) confirmed in git log.

---
*Phase: 02-public-portfolio-site*
*Completed: 2026-03-14*

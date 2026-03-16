---
phase: 03-client-operations-portal
plan: 02
subsystem: ui, api
tags: [astro, sanity, ssr, portal, tailwind, rate-limiting]

# Dependency graph
requires:
  - phase: 03-client-operations-portal
    plan: 01
    provides: "Token generation, stage metadata, rate limiter, Sanity schema extension, getProjectByPortalToken query"
  - phase: 02-public-portfolio-site
    provides: "Design system (global.css tokens, fonts), BaseLayout pattern reference, astro.config.mjs with sitemap"
provides:
  - "PortalLayout.astro -- minimal branded layout with noindex, no nav, branded footer"
  - "StatusBadge.astro -- pill-shaped stage indicator with terracotta/green color coding"
  - "MilestoneTimeline.astro -- responsive stepper (horizontal desktop, vertical mobile) with stage descriptions"
  - "SSR portal page at /portal/[token] with Sanity token lookup, rate limiting, and 404 handling"
  - "Sitemap exclusion for /portal/ routes"
  - "output: server in astro.config.mjs for full SSR support"
affects: [04-01-PLAN, production-deploy, sanity-studio]

# Tech tracking
tech-stack:
  added: []
  patterns: [SSR portal page with prerender=false, rate-limited token lookup, information-leakage-safe 404, responsive timeline component]

key-files:
  created:
    - src/components/portal/PortalLayout.astro
    - src/components/portal/StatusBadge.astro
    - src/components/portal/MilestoneTimeline.astro
    - src/pages/portal/[token].astro
  modified:
    - astro.config.mjs

key-decisions:
  - "Added output: server to astro.config.mjs to enable SSR for portal page alongside existing static pages"
  - "Generic 404 for all invalid/disabled/missing tokens -- no information leakage differentiating token states"
  - "Rate limiting at 10 requests/min/IP using x-forwarded-for header extraction"

patterns-established:
  - "Portal pages use PortalLayout (not BaseLayout) -- no nav, noindex, minimal branding"
  - "SSR pages use export const prerender = false with Astro hybrid rendering"
  - "IP extraction chain: x-forwarded-for -> x-real-ip -> 'unknown' for rate limiting"

requirements-completed: [CLNT-01, CLNT-02]

# Metrics
duration: ~15min
completed: 2026-03-15
---

# Phase 03 Plan 02: Portal SSR Page Summary

**SSR client portal page at /portal/[token] with branded PortalLayout (noindex, no nav), terracotta StatusBadge, responsive MilestoneTimeline (horizontal desktop, vertical mobile), Sanity token lookup, IP-based rate limiting, and generic 404 for invalid tokens**

## Performance

- **Duration:** ~15 min (across executor sessions including checkpoint approval)
- **Started:** 2026-03-15T01:57:00Z
- **Completed:** 2026-03-15T20:34:48Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 5

## Accomplishments
- Complete client portal page renders at /portal/[token] with project name, welcome greeting, status badge, milestone timeline, and stage description
- Responsive timeline component: horizontal stepper on desktop with dots and connectors, vertical on mobile
- Security: generic 404 for all invalid/disabled tokens (no information leakage), IP-based rate limiting at 10 req/min
- Luxury aesthetic maintained: Cormorant Garamond headings, DM Sans body, warm neutrals, branded footer
- Portal routes excluded from XML sitemap
- Human-verified end-to-end: Sanity Studio fields, token lookup, portal rendering, responsive behavior, 404 handling, portalEnabled toggle

## Task Commits

Each task was committed atomically:

1. **Task 1: Create portal visual components** - `fbb8a5f` (feat)
2. **Task 2: Create SSR portal page with token lookup** - `067f0d3` (feat)
3. **Deviation fix: Add output: server to astro config** - `aa74dc4` (fix)
4. **Task 3: Human-verify checkpoint** - approved by user (no commit)

## Files Created/Modified
- `src/components/portal/PortalLayout.astro` - Minimal HTML layout with noindex, font preloads, branded footer, no navigation
- `src/components/portal/StatusBadge.astro` - Pill-shaped badge with terracotta (active) or emerald (complete) color coding
- `src/components/portal/MilestoneTimeline.astro` - Responsive 6-stage stepper with checkmarks, current ring, connectors, and stage description
- `src/pages/portal/[token].astro` - SSR page with Sanity token lookup, rate limiting, 404 handling, and full portal UI
- `astro.config.mjs` - Added output: server for SSR support, added /portal exclusion to sitemap filter

## Decisions Made
- **output: server mode:** Added `output: "server"` to astro.config.mjs because the portal page requires SSR (prerender=false) and Astro 6 with the Vercel adapter needs server output mode to support both static and dynamic routes
- **Generic 404:** All invalid, disabled, and non-existent tokens show the identical "Project Not Found" page -- no differentiation between token states to prevent enumeration attacks
- **Rate limiting IP chain:** Extract client IP from x-forwarded-for first (for Vercel/proxy), then x-real-ip, then fallback to "unknown" -- covers production deployment behind CDN

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added output: server to astro.config.mjs**
- **Found during:** Task 2 (SSR portal page)
- **Issue:** Portal page with `prerender = false` requires Astro to be in server or hybrid output mode. The existing config had no output setting (defaulting to static), causing the SSR page to fail.
- **Fix:** Added `output: "server"` to astro.config.mjs alongside existing static pages that use `prerender = true`
- **Files modified:** astro.config.mjs
- **Verification:** Dev server starts successfully, portal page renders with SSR
- **Committed in:** aa74dc4

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary infrastructure change for SSR support. No scope creep. All existing static pages continue to work with explicit `prerender = true`.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 3 is complete -- both plans (data foundation + portal page) are done
- Client portal is fully functional on the Vercel staging URL
- Phase 4 (DNS Cutover and Go-Live) can proceed: all site features are built and verified on staging
- Production considerations for Phase 4: rate limiter is in-memory (per serverless instance) -- acceptable for current scale, may need Redis/KV if traffic warrants

## Self-Check: PASSED

All 5 files verified present. All 3 commits verified in git log. SUMMARY.md created.

---
*Phase: 03-client-operations-portal*
*Completed: 2026-03-15*

---
phase: 25-admin-shell-auth
plan: 01
subsystem: auth
tags: [magic-link, admin-role, middleware, session, astro, redis]

# Dependency graph
requires:
  - phase: 05-data-foundation-auth
    provides: magic-link auth infrastructure (session.ts, middleware.ts, LoginForm.tsx, verify.astro)
provides:
  - Admin role in session system ('admin' added to SessionData role union)
  - Middleware protection for /admin/* routes
  - Admin email detection in requestMagicLink action
  - Admin login page at /admin/login
  - Admin logout route at /admin/logout
  - Role-based verify redirect (dashboardMap pattern)
  - Sanity Studio moved to /studio (reclaimed /admin route prefix)
  - lucide-react package installed for admin UI icons
affects: [25-admin-shell-auth plan 02, 26-admin-projects, 27-admin-procurement, 28-admin-clients, 29-admin-contractors, 30-admin-rendering, 31-admin-settings]

# Tech tracking
tech-stack:
  added: [lucide-react]
  patterns: [admin-role-detection-via-env-var, dashboardMap-redirect-pattern]

key-files:
  created:
    - src/pages/admin/login.astro
    - src/pages/admin/logout.ts
    - src/pages/portal/verify.test.ts
  modified:
    - astro.config.mjs
    - src/lib/session.ts
    - src/env.d.ts
    - src/middleware.ts
    - src/actions/index.ts
    - src/pages/portal/verify.astro
    - .env.example
    - src/middleware.test.ts
    - src/lib/session.test.ts
    - src/actions/magicLink.test.ts
    - package.json

key-decisions:
  - "Admin identity via ADMIN_EMAIL env var -- no Sanity lookup needed, simple single-admin model"
  - "Reuse portal_session cookie and Redis session store for admin -- no separate auth infrastructure"
  - "dashboardMap pattern replaces if/else chain for role-based redirects in verify.astro"
  - "Sanity Studio moved to /studio to reclaim /admin route prefix"

patterns-established:
  - "dashboardMap: Record<string, string> pattern for role-based redirect routing in verify.astro"
  - "Admin detection runs before client lookup in requestMagicLink -- early return prevents fallthrough"
  - "ADMIN_EMAIL env var check with case-insensitive comparison"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-04-06
---

# Phase 25 Plan 01: Admin Auth Infrastructure Summary

**Admin magic-link auth wired into existing session system -- ADMIN_EMAIL env var detection, /admin middleware protection, role-based verify redirect, branded admin email template, login page, and 17 new test assertions**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-06T22:58:05Z
- **Completed:** 2026-04-06T23:03:00Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Reclaimed /admin route prefix by moving Sanity Studio to /studio
- Extended session, middleware, action, and verify with admin role support
- Created admin login page reusing existing PortalLayout and LoginForm components
- Created admin logout route with session clear
- Added 17 new test assertions across 4 test files (all 59 auth tests pass)
- Installed lucide-react for admin sidebar icons (needed by Plan 02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Reclaim /admin route and extend auth infrastructure** - `245912c` (feat)
2. **Task 2: Create admin login page, logout route, and extend tests** - `af4dc76` (feat)

## Files Created/Modified
- `astro.config.mjs` - Changed studioBasePath from /admin to /studio, added /studio to sitemap filter
- `src/lib/session.ts` - Added 'admin' to SessionData role union
- `src/env.d.ts` - Added adminEmail field, extended role union with 'admin'
- `src/middleware.ts` - Added /admin/login to PUBLIC_PATHS, added /admin route protection block
- `src/actions/index.ts` - Added admin email detection before client lookup in requestMagicLink
- `src/pages/portal/verify.astro` - Replaced if/else with dashboardMap for role-based redirects
- `src/pages/admin/login.astro` - Admin login page with "Welcome back" heading
- `src/pages/admin/logout.ts` - Admin logout API route redirecting to /admin/login
- `.env.example` - Added ADMIN_EMAIL and ADMIN_NAME placeholder entries
- `src/middleware.test.ts` - Added 5 admin middleware assertions
- `src/lib/session.test.ts` - Added admin role type assertion
- `src/actions/magicLink.test.ts` - Added 4 admin email detection assertions
- `src/pages/portal/verify.test.ts` - New file with 7 verify redirect assertions
- `package.json` - Added lucide-react dependency
- `package-lock.json` - Updated lockfile

## Decisions Made
- Admin identity determined by ADMIN_EMAIL env var comparison (no Sanity document needed)
- Reused portal_session cookie and Redis session -- same 30-day TTL, no separate admin cookie
- dashboardMap record pattern replaces cascading ternary for verify.astro redirects
- LoginForm.tsx reused as-is -- heading/subtitle text lives in Astro page, not React component
- PortalLayout.astro reused for admin login (standalone full-page, no admin sidebar)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- 3 pre-existing test failures (formatCurrency, geminiClient, blob-serve) unrelated to this plan's changes -- all 59 auth-specific tests pass green

## User Setup Required

Add these environment variables to `.env` (and Vercel dashboard for production):
- `ADMIN_EMAIL=liz@lasprezz.com` -- email address that triggers admin role
- `ADMIN_NAME=Liz` -- display name for admin greeting (used in Plan 02)

## Known Stubs

None -- all functionality in this plan is fully wired. Dashboard page and admin layout shell are in Plan 02.

## Next Phase Readiness
- Auth foundation complete for Plan 02 (admin layout shell, sidebar, dashboard page)
- /admin/dashboard will 404 until Plan 02 creates the page
- lucide-react installed and ready for sidebar icon usage
- ADMIN_EMAIL must be set in production env before admin login will work

## Self-Check: PASSED

- All created files exist on disk
- Both task commits found in git history (245912c, af4dc76)
- 59/59 auth tests passing
- lucide-react installed in node_modules

---
*Phase: 25-admin-shell-auth*
*Completed: 2026-04-06*

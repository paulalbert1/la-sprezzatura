---
phase: 05-data-foundation-auth-and-infrastructure
plan: 03
subsystem: auth, ui
tags: [magic-link, resend, email, redis, session, astro-actions, react, portal]

# Dependency graph
requires:
  - phase: 05-01
    provides: getClientByEmail query, getProjectsByClientId query, client schema
  - phase: 05-02
    provides: redis client, magicLinkRatelimit, session helpers, middleware
provides:
  - "requestMagicLink Astro Action with rate limiting and branded email"
  - "Magic link verify page with atomic token consumption and session creation"
  - "Branded login page with React LoginForm (idle/submitting/success/error states)"
  - "Client dashboard with project cards, auto-redirect, and completed projects section"
  - "PURL redirect page with upgrade message for old bookmarked links"
  - "Logout endpoint clearing session and redirecting to login"
  - "getClientById query for dashboard greeting"
  - "Branded HTML magic link email template (cream bg, white card, terracotta CTA)"
affects: [05-04, 06, 07]

# Tech tracking
tech-stack:
  added: []
  patterns: [magic-link-auth-flow, user-enumeration-prevention, atomic-token-consumption, branded-email-template]

key-files:
  created:
    - src/actions/magicLink.test.ts
    - src/pages/portal/verify.astro
    - src/pages/portal/login.astro
    - src/pages/portal/dashboard.astro
    - src/pages/portal/logout.ts
    - src/components/portal/LoginForm.tsx
  modified:
    - src/actions/index.ts
    - src/sanity/queries.ts
    - src/pages/portal/[token].astro

key-decisions:
  - "User enumeration prevention: always return success regardless of whether email exists in Sanity"
  - "Atomic token consumption via redis.getdel() ensures single-use magic links"
  - "LoginForm follows ContactForm.tsx pattern with Astro Actions integration"
  - "PURL redirect shows upgrade message instead of 404 to avoid confusing existing clients"
  - "Dashboard auto-redirects single-project clients to skip unnecessary card grid"

patterns-established:
  - "Magic link flow: email -> token in Redis (900s TTL) -> verify page consumes atomically -> session created -> dashboard"
  - "Portal form pattern: React component with client:load, FormState type, Astro Actions integration"
  - "Branded email template: cream background, white content card, terracotta CTA button, Georgia heading fallback"
  - "User enumeration prevention: same response path for valid and invalid emails"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-05]

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 5 Plan 03: Magic Link Auth Flow & Portal Pages Summary

**Complete magic link auth flow (request, email, verify, session) with branded login page, client dashboard with project cards and auto-redirect, PURL upgrade redirect, and logout endpoint**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T15:36:54Z
- **Completed:** 2026-03-16T15:41:57Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Complete magic link auth flow: email entry -> branded email with 15-min token -> verify page consumes token atomically -> session created -> dashboard
- Branded login page with React form handling idle/submitting/success/error states, following ContactForm.tsx pattern
- Client dashboard showing project cards with pipeline stage badges and engagement types, auto-redirect for single-project clients
- PURL redirect gracefully handles old bookmarked `/portal/[token]` links with upgrade message
- User enumeration prevention: same response for valid and invalid email addresses
- 10 TDD tests for magic link action behavior, all 55 project tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Magic link request action with email template** - `01d54c4` (feat, TDD)
2. **Task 2: Verify page, login page, and login form component** - `7114805` (feat)
3. **Task 3: Dashboard page, PURL redirect, and logout endpoint** - `18781cc` (feat)

_Task 1 used TDD: RED tests written first, then GREEN implementation._

## Files Created/Modified
- `src/actions/index.ts` - Added requestMagicLink action with rate limiting, email template, user enumeration prevention
- `src/actions/magicLink.test.ts` - 10 TDD tests for action behavior verification
- `src/pages/portal/verify.astro` - Magic link landing page: atomic token consumption via redis.getdel(), session creation, redirects
- `src/pages/portal/login.astro` - Branded login page with PortalLayout, expired link error handling
- `src/components/portal/LoginForm.tsx` - React form with idle/submitting/success/error states, validation, Astro Actions
- `src/pages/portal/dashboard.astro` - Project card grid with greeting, active/completed separation, auto-redirect, empty state
- `src/pages/portal/[token].astro` - Replaced PURL page with upgrade message and login CTA
- `src/pages/portal/logout.ts` - API route clearing session cookie and redirecting to login
- `src/sanity/queries.ts` - Added getClientById query for dashboard greeting

## Decisions Made
- **User enumeration prevention:** The requestMagicLink action always returns `{ success: true }` regardless of whether the email exists in Sanity. The email sending and token storage only happen inside an `if (client)` block, but the response is always the same. This prevents attackers from discovering valid client emails.
- **Atomic token consumption:** Used `redis.getdel()` which atomically reads and deletes the magic link token. This ensures single-use enforcement even under concurrent requests.
- **PURL upgrade message:** Instead of showing a 404 or silently redirecting, old PURL links display an upgrade message explaining the new email verification system and linking to the login page. This avoids confusing existing clients who may have bookmarked their old portal link.
- **Dashboard auto-redirect:** Single-project clients are redirected server-side to their project detail view, skipping the dashboard card grid entirely. This avoids the anti-pattern of showing a grid with a single card.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None -- no new external service configuration required beyond what Plan 02 established (Upstash Redis, Resend API key).

## Next Phase Readiness
- Magic link auth flow is complete and ready for end-to-end testing
- Dashboard references `/portal/project/{id}` which will be built in Plan 04
- All portal pages are protected by middleware from Plan 02
- Branded email template establishes the pattern for Phase 7 "Send Update" emails

## Self-Check: PASSED

All 9 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 05-data-foundation-auth-and-infrastructure*
*Completed: 2026-03-16*

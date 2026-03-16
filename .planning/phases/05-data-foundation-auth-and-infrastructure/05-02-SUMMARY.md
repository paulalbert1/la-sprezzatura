---
phase: 05-data-foundation-auth-and-infrastructure
plan: 02
subsystem: infra, auth
tags: [upstash, redis, ratelimit, session, middleware, astro]

# Dependency graph
requires:
  - phase: none
    provides: "standalone infrastructure layer"
provides:
  - "Shared Upstash Redis client singleton (src/lib/redis.ts)"
  - "Persistent rate limiters: magicLinkRatelimit (3/10min) and contactRatelimit (3/1min)"
  - "Session helpers: createSession, getSession, clearSession with 30-day httpOnly cookie"
  - "Astro middleware protecting /portal/* routes with redirect to /portal/login"
  - "App.Locals typed with clientId for identity attribution"
affects: [05-03, 05-04, 06, 07]

# Tech tracking
tech-stack:
  added: ["@upstash/redis", "@upstash/ratelimit"]
  patterns: ["Redis-backed session via httpOnly cookie", "Upstash sliding window rate limiting", "Astro middleware route protection"]

key-files:
  created:
    - "src/lib/redis.ts"
    - "src/lib/session.ts"
    - "src/middleware.ts"
    - "src/lib/rateLimit.test.ts"
    - "src/lib/session.test.ts"
    - "src/middleware.test.ts"
  modified:
    - "src/lib/rateLimit.ts"
    - "src/actions/index.ts"
    - "src/pages/portal/[token].astro"
    - "src/env.d.ts"
    - "package.json"

key-decisions:
  - "Single Redis database with key prefix namespacing (session:, ratelimit:magic, ratelimit:contact)"
  - "Direct cookie + Upstash Redis for session storage rather than Astro Sessions API"
  - "clearSession uses fire-and-forget Redis delete to avoid blocking redirects"

patterns-established:
  - "Redis client singleton: import { redis } from './redis' for all Upstash operations"
  - "Rate limiter pattern: export named Ratelimit instances, callers use .limit(identifier)"
  - "Session pattern: createSession/getSession/clearSession with AstroCookies parameter"
  - "Middleware pattern: defineMiddleware with public path allowlist and locals injection"

requirements-completed: [AUTH-02, AUTH-04, AUTH-05, INFRA-07]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 5 Plan 2: Infrastructure Layer Summary

**Upstash Redis client, persistent rate limiters (sliding window), session helpers with 30-day httpOnly cookie, and Astro middleware for portal route protection with clientId injection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T15:28:58Z
- **Completed:** 2026-03-16T15:32:52Z
- **Tasks:** 2 (TDD with RED + GREEN phases each)
- **Files modified:** 11

## Accomplishments
- Replaced in-memory Map rate limiter with Upstash Redis-backed @upstash/ratelimit (survives serverless cold starts)
- Created session management layer (create/get/clear) with 30-day httpOnly cookie backed by Redis
- Astro middleware protects all /portal/* routes except /portal/login and /portal/verify, redirecting unauthenticated visitors
- App.Locals typed with clientId enabling identity attribution across portal pages

## Task Commits

Each task was committed atomically (TDD RED + GREEN per task):

1. **Task 1: Upstash Redis client, persistent rate limiter, and contact form migration**
   - `bbd7aa5` - test: add failing tests for Upstash rate limiter (RED)
   - `0b864fa` - feat: replace in-memory rate limiter with Upstash Redis (GREEN)

2. **Task 2: Session helpers, middleware, and App.Locals typing**
   - `d0fd2f3` - test: add failing tests for session helpers and middleware (RED)
   - `e9ad2a5` - feat: add session helpers, middleware, and App.Locals typing (GREEN)

## Files Created/Modified
- `src/lib/redis.ts` - Shared Upstash Redis client singleton
- `src/lib/rateLimit.ts` - Replaced: now exports magicLinkRatelimit and contactRatelimit (Upstash sliding window)
- `src/lib/session.ts` - Session helpers: createSession, getSession, clearSession with Redis + httpOnly cookie
- `src/middleware.ts` - Astro middleware: route protection for /portal/*, clientId injection into locals
- `src/env.d.ts` - Extended App.Locals with clientId typing
- `src/actions/index.ts` - Updated: contact form uses persistent contactRatelimit
- `src/pages/portal/[token].astro` - Updated: uses persistent contactRatelimit instead of in-memory checkRateLimit
- `src/lib/rateLimit.test.ts` - Tests for Upstash rate limiter structure
- `src/lib/session.test.ts` - Tests for session module exports and cookie config
- `src/middleware.test.ts` - Tests for middleware structure, public paths, and clientId injection
- `package.json` - Added @upstash/redis and @upstash/ratelimit dependencies

## Decisions Made
- Single Redis database with key prefix namespacing (session:, ratelimit:magic, ratelimit:contact) -- simpler than separate databases, well within free tier limits
- Direct cookie + Upstash Redis for session storage rather than Astro Sessions API -- more explicit, avoids astro.config.mjs session driver config
- clearSession uses fire-and-forget Redis delete to avoid blocking redirect responses

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

**Upstash Redis environment variables are required for production.** The following env vars must be set in Vercel (auto-populated via Vercel Marketplace integration):
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST auth token

For local development, add these to `.env` after creating an Upstash database.

## Next Phase Readiness
- Redis client, rate limiter, and session helpers are ready for the magic link auth flow (Plan 03)
- Middleware is in place -- new portal pages automatically get session protection
- App.Locals typing enables clientId access in any portal page

## Self-Check: PASSED

All 9 files verified present. All 4 commit hashes verified in git log.

---
*Phase: 05-data-foundation-auth-and-infrastructure*
*Completed: 2026-03-16*

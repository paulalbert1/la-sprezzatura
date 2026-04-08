---
phase: 29-tenant-aware-platform-foundation
plan: 01
subsystem: auth
tags: [bcryptjs, sanity-client, redis, rate-limiting, multi-tenant, session]

# Dependency graph
requires:
  - phase: 07-schema-extensions
    provides: session model with multi-role support (client, contractor, building_manager)
provides:
  - Tenant configuration system (tenants.json, TenantConfig/TenantAdmin types, lookup functions)
  - Per-tenant Sanity client factory with caching
  - Admin authentication via bcrypt password verification
  - Admin login API endpoint with IP-based rate limiting
  - Extended session model with admin role and tenantId
affects: [29-02-PLAN, 29-03-PLAN, admin-dashboard, admin-middleware]

# Tech tracking
tech-stack:
  added: [bcryptjs]
  patterns: [tenant-config-json, tenant-scoped-sanity-client, admin-session-with-tenantId]

key-files:
  created:
    - src/config/tenants.json
    - src/lib/tenants.ts
    - src/lib/tenantClient.ts
    - src/lib/adminAuth.ts
    - src/pages/api/admin/login.ts
    - src/lib/tenants.test.ts
    - src/lib/tenantClient.test.ts
    - src/lib/adminAuth.test.ts
  modified:
    - src/lib/session.ts
    - src/lib/session.test.ts
    - src/lib/rateLimit.ts
    - src/lib/rateLimit.test.ts
    - package.json

key-decisions:
  - "Tenant sanity.projectId stored as static value in JSON (resolved by tenantClient at runtime from config)"
  - "Admin password hashes stored as bcrypt in tenants.json with placeholder values for initial setup"
  - "createSession extended with optional 4th parameter tenantId for backward compatibility"

patterns-established:
  - "Tenant config pattern: static JSON with typed loader functions for lookups by ID or admin email"
  - "Tenant Sanity client pattern: factory with Map-based caching keyed by tenantId"
  - "Admin auth pattern: bcrypt compare against tenant config hashes, generic error for security"

requirements-completed: [PLAT-01, PLAT-02, PLAT-03, PLAT-04]

# Metrics
duration: 6min
completed: 2026-04-08
---

# Phase 29 Plan 01: Tenant Config, Admin Auth, and Login API Summary

**Multi-tenant config system with bcryptjs admin auth, per-tenant Sanity client factory, and rate-limited login API endpoint**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-08T17:37:01Z
- **Completed:** 2026-04-08T17:42:50Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Tenant configuration system with typed JSON schema covering designer name, domain, Sanity config, feature flags, rendering limits, and admin credentials
- Per-tenant Sanity client factory with Map-based caching and runtime env var resolution
- Admin authentication module using bcrypt password verification against tenant config
- Login API endpoint with IP-based rate limiting (5 req/15min) and generic error responses to prevent user enumeration
- Session model extended with admin role and tenantId while maintaining full backward compatibility with existing portal sessions

## Task Commits

Each task was committed atomically (TDD: test then feat):

1. **Task 1: Tenant config, types, and Sanity client factory**
   - `a29fa02` (test: failing tests for tenant config and client factory)
   - `15c9c35` (feat: tenant config, types, and Sanity client factory)
2. **Task 2: Session extension, admin auth module, and login API endpoint**
   - `e8142b6` (test: failing tests for session extension, admin auth, and rate limiting)
   - `bc8e9cb` (feat: session extension, admin auth, and login API endpoint)

## Files Created/Modified
- `src/config/tenants.json` - Tenant configuration data with La Sprezzatura tenant
- `src/lib/tenants.ts` - TenantConfig/TenantAdmin types, getTenantById, getTenantByAdminEmail
- `src/lib/tenantClient.ts` - Per-tenant Sanity client factory with caching
- `src/lib/adminAuth.ts` - verifyAdminPassword using bcrypt against tenant config
- `src/pages/api/admin/login.ts` - Admin login API with rate limiting and credential verification
- `src/lib/session.ts` - Extended with 'admin' role, optional tenantId, 4th createSession parameter
- `src/lib/rateLimit.ts` - Added adminLoginRatelimit (5 req/15min per IP)
- `src/lib/tenants.test.ts` - 16 tests for tenant config and lookups
- `src/lib/tenantClient.test.ts` - 9 tests for client factory, caching, error handling
- `src/lib/adminAuth.test.ts` - 6 tests for password verification
- `src/lib/session.test.ts` - Extended with 4 admin session tests
- `src/lib/rateLimit.test.ts` - Extended with 2 admin rate limiter tests
- `package.json` - Added bcryptjs dependency

## Decisions Made
- Stored tenant `sanity.projectId` as a static value in JSON rather than an env var reference since the client factory resolves tokens from env at runtime via writeTokenEnv
- Used placeholder bcrypt hashes in tenants.json with instructions in tenants.ts comment for generating real hashes -- admins must replace before first login
- Extended createSession with optional 4th parameter (tenantId) rather than a config object to minimize disruption to existing 3-argument call sites

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Admin password hashes in `src/config/tenants.json` are placeholders. Before first admin login, generate real hashes:
```bash
node -e "const b=require('bcryptjs');console.log(b.hashSync('yourpassword',10))"
```
Replace `$2a$10$PLACEHOLDER_REPLACE_WITH_REAL_HASH` entries in tenants.json with the generated hashes.

## Threat Surface Scan

No new threat surfaces beyond those documented in the plan's threat model. All five threats (T-29-01 through T-29-05) have their mitigations implemented:
- T-29-01: Rate limiting via adminLoginRatelimit (5/15min)
- T-29-03: httpOnly + secure + sameSite=lax cookies (existing pattern)
- T-29-04: tenantId set server-side from config match
- T-29-05: Generic "Invalid credentials" error for both unknown email and wrong password

## Next Phase Readiness
- Tenant config, client factory, and auth modules are ready for Plan 02 (admin pages and middleware)
- Plan 03 (tenant-aware admin routes) can consume getTenantClient and session tenantId
- Password hashes need to be replaced with real values before admin login is functional

## Self-Check: PASSED

All 8 created files verified on disk. All 4 task commits verified in git log.

---
*Phase: 29-tenant-aware-platform-foundation*
*Completed: 2026-04-08*

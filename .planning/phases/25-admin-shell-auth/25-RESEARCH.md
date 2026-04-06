# Phase 25: Admin Shell + Auth - Research

**Researched:** 2026-04-06
**Domain:** Astro SSR authentication, layout, middleware, route protection
**Confidence:** HIGH

## Summary

Phase 25 builds an authenticated admin shell at `/admin/*` for a single admin user (Liz). The existing codebase already has a complete magic-link auth system (Redis sessions, role-based middleware, Resend emails) used by the portal, workorder, and building manager routes. The admin shell extends this pattern with minimal new code: add `'admin'` to the session role union, add one middleware block, extend the existing verify page, and create a new action branch for admin email detection.

The critical prerequisite is reclaiming the `/admin` route from Sanity Studio. Currently `@sanity/astro` injects a catch-all route at `/admin/[...params]` via the `studioBasePath: "/admin"` config. This must change to `studioBasePath: "/studio"` (or remove the Sanity integration entirely) before any custom `/admin/*` pages can exist. The v5 strategic plan already anticipates this -- Studio moves to `/studio` as a temporary fallback before full retirement in Phase 31.

**Primary recommendation:** Change `studioBasePath` from `"/admin"` to `"/studio"` in `astro.config.mjs` as the first task, then extend the existing auth infrastructure (session, middleware, verify, actions) with the admin role, and finally build the layout shell and pages.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Add `'admin'` to the existing role union in `src/lib/session.ts` (`SessionData.role`). Same `portal_session` cookie, same Redis-backed session, same 30-day TTL. No separate admin cookie.
- **D-02:** Admin identity check via `ADMIN_EMAIL` environment variable. When the email requesting a magic link matches `ADMIN_EMAIL`, the stored token gets `role: 'admin'`.
- **D-03:** Reuse the existing `/portal/verify` endpoint. The magic link token already stores role in Redis. After verification, route by role: `admin` -> `/admin/dashboard`, `client` -> `/portal/dashboard`, etc. No separate `/admin/verify` page.
- **D-04:** Extend `src/middleware.ts` with a new `/admin` block: check session, verify `role === 'admin'`, redirect to `/admin/login` if unauthenticated or wrong role. Pattern identical to existing `/portal`, `/workorder`, `/building` blocks.
- **D-05:** Dashboard shows summary cards with placeholder values ("--") and quick-link buttons. Cards: Active Projects, Pending Orders, Overdue Items. Quick links: Projects, Rendering, Settings. Real GROQ counts get wired in Phases 26-29 as each section is built.
- **D-06:** Personalized greeting: "Welcome back, Liz" -- hardcode the display name alongside `ADMIN_EMAIL` (e.g., `ADMIN_NAME` env var) or derive from the admin email's associated client record.
- **D-07:** Fixed-width sidebar (~240px), always visible. Not collapsible -- desktop-first admin, collapsible mode deferred to later if needed.
- **D-08:** Nav items have Lucide icons alongside text labels. Sections: Projects, Clients, Contractors, Rendering, Settings. Logout button at the sidebar bottom.
- **D-09:** Active nav item highlighted (accent background or left border indicator) based on current URL path prefix.
- **D-10:** Top bar shows current page title (e.g., "Dashboard", "Projects") and a logout button on the right. Breadcrumbs deferred to Phase 26+ when nested routes exist.
- **D-11:** Admin login page reuses the same warm-neutral branded style as `/portal/login`: centered form, Cormorant Garamond heading, cream background, "La Sprezzatura" brand mark.
- **D-12:** Heading: "Welcome back" with subtitle "Sign in to your studio dashboard". Email input + submit button, same pattern as `LoginForm.tsx`.
- **D-13:** After requesting magic link: same confirmation message pattern as portal ("Check your email for a sign-in link").

### Claude's Discretion
- Exact Tailwind classes for sidebar, top bar, and dashboard card layout
- Whether to create a new `AdminLoginForm.tsx` or reuse `LoginForm.tsx` with a prop for heading/subtitle text
- Lucide icon choices for each nav section
- How to pass `ADMIN_NAME` (env var, or just hardcode "Liz" in the dashboard)
- Exact spacing, shadows, and hover states for sidebar items and dashboard cards
- How to handle the edge case where `ADMIN_EMAIL` is not set (disable admin routes? 500 error?)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 6.0.4 | SSR framework | Project framework -- all pages, middleware, actions |
| @astrojs/react | 5.0.0 | React islands | Interactive form components (`client:load`) |
| react | 19.2.4 | UI library | Already used for portal LoginForm and other islands |
| @upstash/redis | 1.37.0 | Session storage | Redis-backed sessions with TTL |
| @upstash/ratelimit | 2.0.8 | Rate limiting | Magic link rate limiting |
| resend | 6.4.2 | Email delivery | Magic link emails |
| tailwindcss | 4.2.1 (via @tailwindcss/vite 4.2.2) | Styling | Project uses Tailwind v4 with CSS-first config |
| @sanity/astro | 3.3.1 | Sanity integration | Must reconfigure `studioBasePath` from `/admin` to `/studio` |

### New dependency required
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.7.0 | Icon library | D-08 requires Lucide icons for sidebar nav items |

**Note:** `lucide-react` is NOT currently installed. D-08 specifies Lucide icons. Must be added with `npm install lucide-react`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| lucide-react | Inline SVGs | Lucide is explicitly specified in D-08; inline SVGs would be more work for no benefit |
| Separate AdminLoginForm.tsx | Reuse LoginForm.tsx with props | Recommend reuse -- the form logic is identical, only heading/subtitle/action-name differ |

**Installation:**
```bash
npm install lucide-react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/
    admin/
      login.astro            # Admin login page (prerender: false)
      index.astro             # Redirect to /admin/dashboard
      dashboard.astro         # Placeholder dashboard with summary cards
      logout.ts               # API route -- clearSession + redirect to /admin/login
  layouts/
    AdminLayout.astro         # Sidebar + top bar shell (prerender: false)
  components/
    admin/
      AdminNav.astro          # Sidebar navigation component
  lib/
    session.ts                # MODIFY: add 'admin' to role union
  middleware.ts               # MODIFY: add /admin protection block
  pages/portal/
    verify.astro              # MODIFY: add admin role redirect case
  actions/
    index.ts                  # MODIFY: extend requestMagicLink to detect ADMIN_EMAIL
  env.d.ts                    # MODIFY: add adminEmail to App.Locals
```

### Pattern 1: Sanity Studio Route Reclamation
**What:** The `@sanity/astro` integration currently injects a catch-all route at `/admin/[...params]` via `studioBasePath: "/admin"` in `astro.config.mjs`. This conflicts with the new custom admin pages.
**When to use:** Must be done FIRST, before any `/admin/*` page files are created.
**How:** Change `studioBasePath: "/admin"` to `studioBasePath: "/studio"` in `astro.config.mjs`. The Sanity integration uses Astro's `injectRoute` API to register its catch-all, so changing the config value is sufficient -- no file deletions needed.
**Impact:** Sanity Studio will be accessible at `/studio` instead of `/admin`. This aligns with the v5 strategic plan (Phase 31: Studio retirement).

```typescript
// astro.config.mjs -- BEFORE
sanity({
  projectId: sanityProjectId,
  dataset: "production",
  useCdn: false,
  apiVersion: "2025-12-15",
  studioBasePath: "/admin",  // <-- conflicts with custom admin
})

// astro.config.mjs -- AFTER
sanity({
  projectId: sanityProjectId,
  dataset: "production",
  useCdn: false,
  apiVersion: "2025-12-15",
  studioBasePath: "/studio",  // <-- Studio moves to /studio
})
```

### Pattern 2: Role Extension (existing pattern)
**What:** Adding a new role to the existing multi-role session system.
**How it works in the codebase:**
1. `SessionData.role` is a union type -- add `'admin'` to it
2. `middleware.ts` has one `if` block per route prefix -- add `/admin` block
3. `verify.astro` has a role-based redirect table -- add admin case
4. `requestMagicLink` action generates tokens with role metadata -- add admin branch
5. `env.d.ts` declares `App.Locals` -- add `adminEmail` field

This pattern was used for `contractor` (Phase 7) and `building_manager` (Phase 8) -- well-established.

### Pattern 3: LoginForm Reuse via Props
**What:** The existing `LoginForm.tsx` (React island) handles email input, Astro Action call, loading state, success message, and error display. The admin login needs identical behavior with different heading text.
**Recommendation:** Add optional props `heading`, `subtitle`, and `actionName` to `LoginForm.tsx` rather than duplicating the component. The action itself (`requestMagicLink`) already handles all roles -- admin detection happens server-side based on `ADMIN_EMAIL` match.

```typescript
// LoginForm.tsx -- extended props
interface LoginFormProps {
  initialError?: string;
  heading?: string;        // default: "Check Your Email"
  subtitle?: string;       // default: existing text
}
```

The login page just passes different heading/subtitle props:
```astro
<!-- admin/login.astro -->
<LoginForm client:load
  heading="Check Your Email"
  subtitle="We've sent a secure access link..."
/>
```

Actually, looking at the code more carefully, `heading` and `subtitle` only appear in the success state. The main heading ("Welcome to Your Portal") and subtitle ("Enter your email...") are in the Astro page file, not in `LoginForm.tsx`. So no prop changes are needed for the form component itself -- just different Astro page markup.

### Pattern 4: Admin Layout Shell
**What:** `AdminLayout.astro` provides the sidebar + top bar wrapper for all admin pages. Similar to `PortalLayout.astro` but with a sidebar instead of centered content.
**Structure:**
```
+----------------------------------+
| Top Bar: [Page Title]   [Logout] |
+--------+-------------------------+
| Sidebar|                         |
| 240px  |   Main Content          |
| fixed  |   (slot)                |
|        |                         |
| Nav    |                         |
| items  |                         |
|        |                         |
| Logout |                         |
+--------+-------------------------+
```

### Pattern 5: Admin Middleware and Locals
**What:** The middleware pattern for admin routes, following the exact same structure as portal/workorder/building.

```typescript
// In middleware.ts -- add this block
if (pathname.startsWith("/admin")) {
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();

  const session = await getSession(context.cookies);
  if (!session || session.role !== "admin") {
    return context.redirect("/admin/login");
  }

  context.locals.adminEmail = session.entityId;
  context.locals.role = session.role;
  return next();
}
```

And in `env.d.ts`:
```typescript
declare namespace App {
  interface Locals {
    clientId: string | undefined;
    contractorId: string | undefined;
    buildingManagerEmail: string | undefined;
    adminEmail: string | undefined;  // <-- new
    role: 'client' | 'contractor' | 'building_manager' | 'admin' | undefined;  // <-- extended
  }
}
```

### Anti-Patterns to Avoid
- **Separate admin cookie or session store:** D-01 explicitly says same `portal_session` cookie and Redis store. Do not create a second cookie.
- **Separate /admin/verify page:** D-03 explicitly says reuse `/portal/verify`. Do not create a new verify endpoint.
- **Creating /admin pages before reclaiming the route:** The Sanity integration will intercept all `/admin/*` requests if `studioBasePath` is still `"/admin"`. Change this first.
- **Hardcoding admin email in code:** Use `ADMIN_EMAIL` env var (D-02). Never hardcode the email string.
- **Using @sanity/icons for admin nav:** The admin is being built outside Sanity's ecosystem. Use `lucide-react` (D-08), not `@sanity/icons`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT/cookie logic | Existing `session.ts` (createSession, getSession, clearSession) | Already handles Redis, TTL, cookie security, role metadata |
| Rate limiting | Custom rate limit | Existing `magicLinkRatelimit` from `rateLimit.ts` | Already configured for 3/10min sliding window |
| Token generation | Custom random strings | Existing `generatePortalToken()` from `generateToken.ts` | Already handles crypto fallbacks |
| Email sending | Custom SMTP | Existing Resend pattern in `requestMagicLink` action | Already handles branded HTML, from address, error handling |
| Form component | New admin login form | Existing `LoginForm.tsx` (same Astro Action) | Same form, same action, same behavior |
| Magic link flow | New action endpoint | Extend existing `requestMagicLink` action | Add admin email detection branch, not a new endpoint |

**Key insight:** This phase is almost entirely about EXTENDING existing infrastructure, not building new auth. The only genuinely new code is the layout shell (AdminLayout, AdminNav) and the dashboard page.

## Common Pitfalls

### Pitfall 1: Sanity Studio Route Conflict
**What goes wrong:** Creating `/admin/login.astro` while `studioBasePath: "/admin"` is still set. The `@sanity/astro` integration injects a catch-all `[...params].astro` route that will intercept all `/admin/*` requests.
**Why it happens:** The Sanity integration uses Astro's `injectRoute` API at build time. Astro's route priority may cause the injected catch-all to shadow your explicit page files.
**How to avoid:** Change `studioBasePath` to `"/studio"` BEFORE creating any admin page files. Verify by running `npm run dev` and confirming `/admin` returns a 404 (or redirect) rather than loading Studio.
**Warning signs:** Admin login page renders the Sanity Studio UI instead of the custom login form.

### Pitfall 2: Magic Link Action Not Detecting Admin
**What goes wrong:** Admin email submits the login form, gets "success" message, but the magic link token stores `role: 'client'` (or no role), and verify.astro redirects to `/portal/dashboard` instead of `/admin/dashboard`.
**Why it happens:** The `requestMagicLink` action currently only checks for client and contractor records in Sanity. It doesn't check `ADMIN_EMAIL`.
**How to avoid:** Add the `ADMIN_EMAIL` check BEFORE the client/contractor lookup. If `input.email === import.meta.env.ADMIN_EMAIL`, generate a token with `role: 'admin'` and `entityId: input.email`, then send the magic link email and return early.
**Warning signs:** After clicking the magic link, landing on `/portal/dashboard` instead of `/admin/dashboard`.

### Pitfall 3: Verify Page Missing Admin Route
**What goes wrong:** The magic link contains a valid token with `role: 'admin'`, but `verify.astro` doesn't have a case for it, so it falls through to the default `/portal/dashboard` redirect.
**Why it happens:** Current verify page: `const dashboard = role === 'contractor' ? '/workorder/dashboard' : '/portal/dashboard';` -- no admin case.
**How to avoid:** Extend the redirect logic: admin -> `/admin/dashboard`, contractor -> `/workorder/dashboard`, default -> `/portal/dashboard`.
**Warning signs:** Same as Pitfall 2 -- wrong redirect destination.

### Pitfall 4: Missing `prerender = false` on Admin Pages
**What goes wrong:** Admin pages are pre-rendered at build time, which fails because they depend on cookies/session (runtime data).
**Why it happens:** Astro 6 with `output: "server"` defaults to server rendering, but explicit `export const prerender = false` is the project convention for dynamic pages.
**How to avoid:** Add `export const prerender = false` to all admin pages and the layout.
**Warning signs:** Build errors or pages that don't check auth.

### Pitfall 5: PUBLIC_PATHS Array Not Updated
**What goes wrong:** `/admin/login` requires authentication, causing an infinite redirect loop (middleware redirects to login, which requires auth, which redirects to login...).
**Why it happens:** The `PUBLIC_PATHS` array in `middleware.ts` doesn't include `/admin/login`.
**How to avoid:** Add `/admin/login` to `PUBLIC_PATHS`.
**Warning signs:** Browser shows "too many redirects" error when visiting `/admin/login`.

### Pitfall 6: ADMIN_EMAIL Env Var Not Set
**What goes wrong:** No email can trigger admin auth. The `requestMagicLink` action silently fails to detect admin emails.
**Why it happens:** New env var not added to `.env` local file or Vercel project settings.
**How to avoid:** Add `ADMIN_EMAIL` (and optionally `ADMIN_NAME`) to `.env` file. Document required env vars. Handle the missing-env-var case gracefully (skip admin detection, don't crash).
**Warning signs:** Admin login form works (shows success) but magic link always redirects to portal.

## Code Examples

### Existing: requestMagicLink Action (lines 234-341 of src/actions/index.ts)
The action currently:
1. Rate-limits by email
2. Looks up client by email in Sanity
3. Checks for dual-role (contractor match)
4. Generates token, stores in Redis as `magic:{token}` with `{ entityId, role }` JSON
5. Sends branded email via Resend
6. Always returns `{ success: true }` (never reveals if email exists)

**Extension point:** Insert admin check BEFORE client lookup:
```typescript
// Admin detection -- before client/contractor lookup
const adminEmail = import.meta.env.ADMIN_EMAIL;
if (adminEmail && input.email.toLowerCase() === adminEmail.toLowerCase()) {
  const token = generatePortalToken(32);
  await redis.set(`magic:${token}`, JSON.stringify({
    entityId: input.email.toLowerCase(),
    role: 'admin',
  }), { ex: 900 });

  // Send magic link email (same Resend pattern)
  const baseUrl = import.meta.env.SITE || "https://lasprezz.com";
  const magicLink = `${baseUrl}/portal/verify?token=${token}`;
  // ... send email ...
  return { success: true };
}
```

### Existing: verify.astro Redirect Logic (line 47)
```typescript
// Current:
const dashboard = role === 'contractor' ? '/workorder/dashboard' : '/portal/dashboard';

// Extended:
const dashboardMap: Record<string, string> = {
  admin: '/admin/dashboard',
  contractor: '/workorder/dashboard',
  building_manager: '/building/dashboard',
};
const dashboard = dashboardMap[role] || '/portal/dashboard';
```

### Existing: Middleware Pattern (one block per role)
```typescript
// Current blocks: /portal, /workorder, /building
// New block follows identical pattern:
if (pathname.startsWith("/admin")) {
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();
  const session = await getSession(context.cookies);
  if (!session || session.role !== "admin") {
    return context.redirect("/admin/login");
  }
  context.locals.adminEmail = session.entityId;
  context.locals.role = session.role;
  return next();
}
```

### Existing: Logout API Route Pattern (src/pages/portal/logout.ts)
```typescript
import type { APIRoute } from "astro";
import { clearSession } from "../../lib/session";
export const prerender = false;
export const GET: APIRoute = async (context) => {
  clearSession(context.cookies);
  return context.redirect("/admin/login");  // <-- only change is redirect target
};
```

### Design Tokens (from src/styles/global.css)
```css
/* Warm neutral palette */
--color-cream: #FAF8F5;
--color-cream-dark: #F5F0EB;
--color-stone: #8A8478;
--color-stone-light: #B8B0A4;
--color-stone-dark: #6B6358;
--color-charcoal: #2C2926;
--color-charcoal-light: #4A4540;
--color-terracotta: #C4836A;
--color-terracotta-light: #D4A08A;

/* Typography */
--font-heading: "Cormorant Garamond", "Georgia", serif;
--font-body: "DM Sans", "system-ui", sans-serif;
```

Tailwind utility classes: `bg-cream`, `text-charcoal`, `text-stone`, `bg-terracotta`, `font-heading`, `font-body`, etc.

### Lucide Icon Recommendations for Sidebar (D-08)
```tsx
import {
  LayoutDashboard,  // Dashboard
  FolderKanban,     // Projects
  Users,            // Clients
  HardHat,          // Contractors
  Palette,          // Rendering
  Settings,         // Settings
  LogOut,           // Logout
} from "lucide-react";
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sanity Studio at `/admin` | Custom admin at `/admin`, Studio at `/studio` | v5.0 pivot (2026-04-06) | Must change `studioBasePath` in astro.config.mjs |
| Tailwind v3 (tailwind.config.js) | Tailwind v4 CSS-first (@theme in global.css) | Project setup | No tailwind.config.js file -- all tokens in `src/styles/global.css` |
| Astro 5 middleware | Astro 6 middleware (same API) | Project uses Astro 6.0.4 | `defineMiddleware` API unchanged |

**Deprecated/outdated:**
- Sanity Studio at `/admin`: Being replaced by custom admin in this phase
- `@sanity/icons`: Only used in Studio components -- admin uses `lucide-react` instead

## Open Questions

1. **sitemap filter for /studio**
   - What we know: `astro.config.mjs` has `filter: (page) => !page.includes("/admin")` in the sitemap config. After changing Studio to `/studio`, Studio pages would not be filtered.
   - What's unclear: Does this matter? Studio is not indexed anyway (noindex is set elsewhere).
   - Recommendation: Update the sitemap filter to also exclude `/studio` for completeness: `!page.includes("/admin") && !page.includes("/portal") && !page.includes("/studio")`.

2. **Magic link email branding for admin**
   - What we know: The current magic link email says "Your Portal Access Link" and "Access Your Portal". For admin, this copy is misleading.
   - What's unclear: Whether to customize the email copy or keep it generic.
   - Recommendation: Customize the email subject and heading for admin role: "Your Studio Dashboard Access" / "Access Your Dashboard". This is a small conditional in the action handler.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v22.22.1 | -- |
| npm | Package management | Yes | 10.9.4 | -- |
| Astro | SSR framework | Yes | 6.0.4 | -- |
| Vercel CLI | Deployment | Yes | 50.34.2 | -- |
| Redis (Upstash) | Session storage | Yes (via env vars) | -- | -- |
| Resend | Email delivery | Yes (via env vars) | -- | Console log fallback (dev mode) |
| lucide-react | Sidebar icons | No (not installed) | -- | Must install: `npm install lucide-react` |
| ADMIN_EMAIL env var | Admin detection | No (not set) | -- | Must add to .env and Vercel |
| ADMIN_NAME env var | Dashboard greeting | No (not set) | -- | Hardcode "Liz" as fallback |

**Missing dependencies with no fallback:**
- `lucide-react` -- must be installed (D-08 requires it)
- `ADMIN_EMAIL` env var -- must be set for admin auth to function

**Missing dependencies with fallback:**
- `ADMIN_NAME` env var -- can hardcode "Liz" or derive from admin email

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map

The project uses source-text assertion tests (read the `.ts` file as a string and assert it contains expected patterns). This is the established pattern for session.test.ts and middleware.test.ts.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-01 | Magic link for admin email creates token with role:'admin' | unit (source assertion) | `npx vitest run src/actions/magicLink.test.ts -x` | Exists (extend) |
| SC-02 | verify.astro redirects admin role to /admin/dashboard | unit (source assertion) | `npx vitest run src/pages/portal/verify.test.ts -x` | Wave 0 |
| SC-03 | middleware protects /admin/* and allows /admin/login | unit (source assertion) | `npx vitest run src/middleware.test.ts -x` | Exists (extend) |
| SC-04 | session.ts role union includes 'admin' | unit (source assertion) | `npx vitest run src/lib/session.test.ts -x` | Exists (extend) |
| SC-05 | env.d.ts declares adminEmail in Locals | unit (source assertion) | `npx vitest run src/lib/session.test.ts -x` | Exists (extend) |
| SC-06 | Admin layout renders sidebar and top bar | manual | Browser verification | N/A |
| SC-07 | Unauthenticated /admin/dashboard redirects to /admin/login | manual (e2e) | Browser verification | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Extend `src/middleware.test.ts` -- add admin route protection assertions
- [ ] Extend `src/lib/session.test.ts` -- add 'admin' role assertion
- [ ] Extend `src/actions/magicLink.test.ts` -- add ADMIN_EMAIL detection assertion
- [ ] Create `src/pages/portal/verify.test.ts` -- verify admin redirect case (new file, source assertion pattern)

## Project Constraints (from CLAUDE.md)

- **No hardcoded credentials:** ADMIN_EMAIL must come from env var, never in code
- **No new ports needed:** Admin runs on same Astro server (port 3000 not relevant -- Astro default)
- **No Co-Authored-By lines in commits** (per project CLAUDE.md)
- **biome for linting:** `npm run check` (biome check .)
- **Test runner:** `npm run test` (vitest run)
- **Vercel deployment:** `@astrojs/vercel` adapter, `output: "server"` mode
- **No REQUIREMENTS.md:** File does not exist at `.planning/REQUIREMENTS.md` -- no formal requirement IDs to map

## Sources

### Primary (HIGH confidence)
- `src/lib/session.ts` -- complete file read, confirmed role union type and session API
- `src/middleware.ts` -- complete file read, confirmed route protection pattern for all 3 existing roles
- `src/pages/portal/verify.astro` -- complete file read, confirmed role-based redirect logic
- `src/actions/index.ts` -- lines 234-341, confirmed requestMagicLink flow
- `src/components/portal/LoginForm.tsx` -- complete file read, confirmed form component structure
- `src/components/portal/PortalLayout.astro` -- complete file read, confirmed layout pattern
- `src/styles/global.css` -- complete file read, confirmed Tailwind v4 design tokens
- `astro.config.mjs` -- complete file read, confirmed studioBasePath: "/admin" conflict
- `node_modules/@sanity/astro/dist/sanity-astro.mjs` -- lines 1325-1386, confirmed injectRoute behavior
- `sanity.config.ts` -- complete file read, confirmed current Studio config
- `src/env.d.ts` -- complete file read, confirmed App.Locals declaration
- `src/middleware.test.ts` -- complete file read, confirmed source-assertion test pattern
- `src/lib/session.test.ts` -- complete file read, confirmed test pattern
- `.planning/references/v5-custom-admin-plan.md` -- complete file read, confirmed phase map and Studio retirement plan

### Secondary (MEDIUM confidence)
- npm registry: `lucide-react` version 1.7.0 (verified via `npm view`)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use except lucide-react (trivial addition)
- Architecture: HIGH -- extending an established pattern used by 3 existing roles
- Pitfalls: HIGH -- identified through direct code reading (studioBasePath conflict is the critical one)

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable -- no fast-moving dependencies)

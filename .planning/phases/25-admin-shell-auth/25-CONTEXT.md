# Phase 25: Admin Shell + Auth - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Liz can navigate to `/admin/login`, receive a magic-link email, and land in an authenticated admin dashboard with sidebar navigation — no content yet, just a working shell. Any unauthenticated request to `/admin/*` (except `/admin/login`) redirects to `/admin/login`. Styled with the portal's warm neutral palette, not Sanity's chrome.

</domain>

<decisions>
## Implementation Decisions

### Session Strategy
- **D-01:** Add `'admin'` to the existing role union in `src/lib/session.ts` (`SessionData.role`). Same `portal_session` cookie, same Redis-backed session, same 30-day TTL. No separate admin cookie.
- **D-02:** Admin identity check via `ADMIN_EMAIL` environment variable. When the email requesting a magic link matches `ADMIN_EMAIL`, the stored token gets `role: 'admin'`.
- **D-03:** Reuse the existing `/portal/verify` endpoint. The magic link token already stores role in Redis. After verification, route by role: `admin` → `/admin/dashboard`, `client` → `/portal/dashboard`, etc. No separate `/admin/verify` page.
- **D-04:** Extend `src/middleware.ts` with a new `/admin` block: check session, verify `role === 'admin'`, redirect to `/admin/login` if unauthenticated or wrong role. Pattern identical to existing `/portal`, `/workorder`, `/building` blocks.

### Dashboard Landing
- **D-05:** Dashboard shows summary cards with placeholder values ("--") and quick-link buttons. Cards: Active Projects, Pending Orders, Overdue Items. Quick links: Projects, Rendering, Settings. Real GROQ counts get wired in Phases 26-29 as each section is built.
- **D-06:** Personalized greeting: "Welcome back, Liz" — hardcode the display name alongside `ADMIN_EMAIL` (e.g., `ADMIN_NAME` env var) or derive from the admin email's associated client record. Keep it simple.

### Sidebar Navigation
- **D-07:** Fixed-width sidebar (~240px), always visible. Not collapsible — desktop-first admin, collapsible mode deferred to later if needed.
- **D-08:** Nav items have Lucide icons alongside text labels. Sections: Projects, Clients, Contractors, Rendering, Settings. Logout button at the sidebar bottom.
- **D-09:** Active nav item highlighted (accent background or left border indicator) based on current URL path prefix.

### Top Bar
- **D-10:** Top bar shows current page title (e.g., "Dashboard", "Projects") and a logout button on the right. Breadcrumbs deferred to Phase 26+ when nested routes exist (project detail, procurement sub-pages).

### Login Page
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth infrastructure (extend, don't duplicate)
- `src/lib/session.ts` — `SessionData` interface (add `'admin'` to role union), `createSession()`, `getSession()`, `clearSession()` — all reused as-is
- `src/middleware.ts` — Add `/admin` route protection block following existing pattern (portal, workorder, building)
- `src/pages/portal/verify.astro` — Shared magic-link verification; add admin role routing (lines 37-48 handle role-based redirect)
- `src/lib/redis.ts` — Redis client used for session storage
- `src/lib/generateToken.ts` — Token generation for magic links

### Login pattern (follow portal pattern)
- `src/pages/portal/login.astro` — Login page structure to replicate for admin
- `src/components/portal/LoginForm.tsx` — React form component (potential reuse with props)
- `src/actions/index.ts` — Magic link Astro Action (extend to check `ADMIN_EMAIL` and set admin role on token)

### Layout pattern
- `src/components/portal/PortalLayout.astro` — Reference for layout structure; AdminLayout will follow similar shell pattern
- `src/layouts/BaseLayout.astro` — Public site layout (design tokens, font loading)

### Strategic plan
- `.planning/references/v5-custom-admin-plan.md` — Phase map, design constraints, file structure plan for all admin phases

### Design tokens
- `tailwind.config.*` — Warm neutral palette tokens (stone, terracotta, parchment, charcoal, cream)
- Font variables: `--font-heading` (Cormorant Garamond), `--font-body` (DM Sans)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `session.ts`: Multi-role session system (Redis-backed, cookie-based) — add `'admin'` role, no structural changes needed
- `middleware.ts`: Route protection with role checks — add one more `if` block for `/admin` prefix
- `portal/verify.astro`: Magic link verification with role-based redirect — extend routing table
- `LoginForm.tsx`: React email form with loading state, error display, Astro Action integration — potentially reusable with prop-driven heading
- `PortalLayout.astro`: Layout shell with noindex, font preloading, footer — reference for AdminLayout structure
- `generateToken.ts` + Redis magic link pattern: Token stored as `magic:{token}` with JSON `{ entityId, role }` — extend to include `role: 'admin'`

### Established Patterns
- Astro 6 hybrid SSR with `export const prerender = false` on dynamic pages
- React islands (`client:load`) for interactive forms within Astro pages
- Tailwind CSS with custom design tokens (warm neutrals, Cormorant Garamond/DM Sans)
- Astro Actions for form submissions (Zod validation, rate limiting)
- `x-forwarded-for` IP extraction for rate limiting

### Integration Points
- `src/pages/admin/login.astro` — new page, replicates portal login pattern
- `src/pages/admin/dashboard.astro` — new page, AdminLayout + placeholder cards
- `src/pages/admin/index.astro` — redirect to dashboard
- `src/layouts/AdminLayout.astro` — new layout with sidebar + top bar
- `src/components/admin/AdminNav.astro` — sidebar nav component
- `src/lib/session.ts` — extend `SessionData.role` union type
- `src/middleware.ts` — add `/admin` protection block
- `src/pages/portal/verify.astro` — add admin redirect case
- `src/actions/index.ts` — extend magic link action to detect admin email

</code_context>

<specifics>
## Specific Ideas

- "Welcome back" heading with subtitle "Sign in to your studio dashboard" — personal, friendly tone since only Liz uses admin
- Summary cards on dashboard are placeholders now — they become live when each section (Projects in Phase 26, Procurement in Phase 27, etc.) is built
- Sidebar should feel like a natural extension of the portal's warm neutral aesthetic, not a generic admin template

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 25-admin-shell-auth*
*Context gathered: 2026-04-06*

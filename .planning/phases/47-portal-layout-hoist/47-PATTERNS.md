# Phase 47: Portal Layout Hoist — Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 13 (3 new components, 1 modified layout, 9 modified pages)
**Analogs found:** 13 / 13

> Every new file in this phase has a strong, in-repo analog. The phase is mechanical lift-and-shift of existing chrome — no new design primitives, no new framework patterns. The planner can quote line numbers verbatim from the analogs below.

---

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `src/components/portal/PortalLayout.astro` | layout | request-response | (self — extend in place) | self |
| `src/components/portal/PortalHeader.astro` | component | request-response (reads `Astro.locals.role` + `Astro.props.tenant`) | `src/components/portal/PortalLayout.astro` (existing inlined wordmark + footer) + per-page sign-out blocks (e.g. `src/pages/portal/dashboard.astro:53-57`, `192-200`) | composite-exact |
| `src/components/portal/PortalFooter.astro` | component | request-response (reads `Astro.props.tenant`) | `src/components/portal/PortalLayout.astro:68-80` (lift-and-shift) | exact |
| `src/components/portal/ImpersonationBannerStub.astro` | component | static-render | `src/components/portal/ConfidentialityBanner.astro` (smallest pure-render Astro component) | role-match |
| `src/pages/portal/dashboard.astro` | page | modified | (pattern stays — strip inlined wordmark + sign-out only) | self |
| `src/pages/portal/project/[projectId].astro` | page | modified | self | self |
| `src/pages/portal/[token].astro` | page | modified (PURL landing — strip wordmark, keep page body) | self | self |
| `src/pages/portal/login.astro` | page | modified (add `bare` prop) | self | self |
| `src/pages/portal/role-select.astro` | page | modified (add `bare` prop) | self | self |
| `src/pages/workorder/dashboard.astro` | page | modified | `src/pages/portal/dashboard.astro` | exact |
| `src/pages/workorder/project/[projectId].astro` | page | modified | `src/pages/portal/project/[projectId].astro` | exact |
| `src/pages/workorder/login.astro` | page | modified (add `bare` prop) | `src/pages/portal/login.astro` | exact |
| `src/pages/building/dashboard.astro` | page | modified | `src/pages/portal/dashboard.astro` | exact |
| `src/pages/building/project/[projectId].astro` | page | modified | `src/pages/portal/project/[projectId].astro` | exact |
| `src/pages/building/login.astro` | page | modified (add `bare` prop) | `src/pages/portal/login.astro` | exact |
| Test: `src/components/portal/PortalHeader.test.ts` | test | static-string-assertion | `src/components/portal/ProcurementTable.test.ts` | exact |

**Pages NOT touched (per CONTEXT D-6):** `src/pages/portal/verify.astro`, `src/pages/workorder/verify.astro`, `src/pages/building/verify.astro`, `src/pages/portal/enter-impersonation.astro` — server-side redirect handlers, no UI.

---

## Pattern Assignments

### `src/components/portal/PortalLayout.astro` (modified — extend in place)

**Analog:** self. Current file at `src/components/portal/PortalLayout.astro` (82 lines).

**Current frontmatter pattern** (lines 1-29) — keep verbatim, ADD `bare?: boolean` to `Props`:

```astro
---
import { Font } from "astro:assets";
import "../../styles/global.css";
import {
  DEFAULT_PORTAL_BRAND,
  type PortalBrand,
} from "../../lib/portal/portalBrand";

interface Props {
  title: string;
  /**
   * Optional brand strings sourced from siteSettings via getPortalBrand().
   * Pages that fetch brand data themselves should pass it through; pages
   * that don't fall back to DEFAULT_PORTAL_BRAND so the layout always has
   * something to render.
   */
  tenant?: PortalBrand;
}

const { title, tenant = DEFAULT_PORTAL_BRAND } = Astro.props;
const previewMode = Astro.url.searchParams.get("preview") === "1";
---
```

**Body composition pattern** (lines 41-81) — current body wraps `<slot/>` between body open and inlined `<footer>`. The new structure inserts header + banner-slot wrapper above `<slot/>`, swaps inlined footer for `<PortalFooter/>`:

```astro
<body class="bg-cream text-charcoal font-body min-h-screen flex flex-col">
  {/* Banner slot — sticky top, above header. Phase 50 fills it with real
      ImpersonationBanner; Phase 47 ships a stub to verify slot wiring. */}
  <div role="region" aria-label="Notifications">
    <slot name="banner">
      <ImpersonationBannerStub />
    </slot>
  </div>

  {/* Existing ?preview=1 cosmetic banner (CONTEXT D-3 — Phase 50 removes) */}
  {previewMode && (...)}

  <PortalHeader tenant={tenant} bare={bare} />

  <slot />

  <PortalFooter tenant={tenant} />
</body>
```

**Sticky banner z-index** — copy verbatim from existing preview banner (line 45): `sticky top-0 z-50`. The slot wrapper itself is NOT sticky (only the rendered banner inside is). Stub renders `hidden`, so the wrapper has zero rendered height when empty.

**Preserve as-is:** font preload (lines 37-38), `<meta robots="noindex">` (line 36), `<title>` (line 39), body class (line 41), `previewMode` block (lines 42-66 — Phase 50 removes, NOT this phase).

---

### `src/components/portal/PortalHeader.astro` (NEW)

**Analog (composite):**
- Wordmark markup: `src/components/portal/PortalLayout.astro:69` (footer wordmark) + per-page wordmark blocks like `src/pages/portal/dashboard.astro:53-57`
- Role sub-label markup: `src/pages/portal/dashboard.astro:57`, `src/pages/workorder/dashboard.astro:49`, `src/pages/building/dashboard.astro:30`
- Sign-out markup: `src/pages/portal/dashboard.astro:192-200` (most evolved — has `border` + `rounded`), `src/pages/portal/project/[projectId].astro:112-119` (no border, used on detail pages), and per-route variants

**Frontmatter pattern (matches `ConfidentialityBanner.astro` shape):**

```astro
---
import {
  DEFAULT_PORTAL_BRAND,
  type PortalBrand,
} from "../../lib/portal/portalBrand";

interface Props {
  tenant?: PortalBrand;
  bare?: boolean;
}

const { tenant = DEFAULT_PORTAL_BRAND, bare = false } = Astro.props;

// Role sub-label: derived from Astro.locals.role (set by middleware).
// See env.d.ts:10 — role: 'client' | 'contractor' | 'building_manager' | 'admin' | undefined
// Source of truth — do NOT duplicate this map outside the component.
const ROLE_SUBLABEL: Record<string, string> = {
  client: "Client portal",
  contractor: "Trade portal",
  building_manager: "Building portal",
};
const role = Astro.locals.role;
const subLabel = role ? ROLE_SUBLABEL[role] : undefined;

// Sign-out endpoint: per-route, derived from role.
// Existing endpoints (verified): /portal/logout (logout.ts:7),
// /workorder/logout, /building/logout — all GET handlers.
const LOGOUT_HREF: Record<string, string> = {
  client: "/portal/logout",
  contractor: "/workorder/logout",
  building_manager: "/building/logout",
};
const logoutHref = role ? LOGOUT_HREF[role] : undefined;

// Sign-out renders only when a role is present (i.e. authenticated session,
// per CONTEXT D-4). No role on bare-mode pages because middleware leaves
// /portal/login etc. as PUBLIC_PATHS — locals.role is undefined there.
const showSignOut = !bare && Boolean(role) && Boolean(logoutHref);
---
```

**Wordmark + sub-label pattern** — exact lift from `src/pages/portal/dashboard.astro:53-57`:

```astro
{/* From dashboard.astro:53-57 — verbatim classes */}
<p class="text-xs text-stone tracking-[0.2em] uppercase font-body">
  {tenant.wordmark}
</p>
{subLabel && (
  <p class="text-xs text-stone/60 font-body mt-2">{subLabel}</p>
)}
```

> **Note on `mt-2`:** existing dashboard uses `mb-4 -mt-6` for the sub-label because the wordmark above already has `mb-8`. PortalHeader uses `mt-2` (UI-SPEC spacing scale) because PortalHeader controls its own vertical rhythm — the page no longer renders the wordmark. UI-SPEC line 51 locks `mt-2` (8px).

**Sign-out pattern** — exact lift from `src/pages/portal/project/[projectId].astro:113-118` (the no-border variant; UI-SPEC §Visuals "no background band" implies no rounded-pill border on the header sign-out either):

```astro
{showSignOut && (
  <a
    href={logoutHref}
    class="text-xs text-stone hover:text-terracotta transition-colors uppercase tracking-widest font-body"
  >
    Sign Out
  </a>
)}
```

> **Reconciliation note:** `dashboard.astro:194-199` uses the *bordered* variant (`py-2 px-4 border border-stone-light/30 rounded`). UI-SPEC line 78 specifies the *plain* variant for the hoisted header. The dashboard's bordered pill was a per-page affordance that doesn't carry to a top-aligned chrome element; planner must NOT propagate the bordered version into PortalHeader.

**Default-mode wrapper (full header):**

```astro
<header role="banner" class="px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-6 flex items-start justify-between">
  <div>
    {/* wordmark + sub-label */}
  </div>
  {showSignOut && (
    {/* sign-out anchor */}
  )}
</header>
```

**Bare-mode wrapper (wordmark-only, centered):**

```astro
<header role="banner" class="px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-6 text-center">
  <p class="text-xs text-stone tracking-[0.2em] uppercase font-body">
    {tenant.wordmark}
  </p>
</header>
```

**Conditional rendering pattern:** Astro template `{condition && (...)}` — matches `PortalLayout.astro:42` (`{previewMode && (...)}`) and `dashboard.astro:91` (`{activeProjects.length > 0 && (...)}`).

---

### `src/components/portal/PortalFooter.astro` (NEW)

**Analog:** `src/components/portal/PortalLayout.astro:68-80` — exact lift-and-shift, no visual change (CONTEXT D-5).

**Full file content (copy verbatim, wrap in component frontmatter):**

```astro
---
import {
  DEFAULT_PORTAL_BRAND,
  type PortalBrand,
} from "../../lib/portal/portalBrand";

interface Props {
  tenant?: PortalBrand;
}

const { tenant = DEFAULT_PORTAL_BRAND } = Astro.props;
---

<footer class="mt-auto py-8 text-center">
  <p class="text-xs text-stone tracking-widest uppercase font-body">
    {tenant.displayName} &bull; Interior Design
  </p>
  <p class="text-xs text-stone-light mt-2 font-body">
    <a
      href={`mailto:${tenant.contactEmail}`}
      class="hover:text-terracotta transition-colors"
    >
      {tenant.contactEmail}
    </a>
  </p>
</footer>
```

> Note: Astro `<footer>` element has implicit `role="contentinfo"` per UI-SPEC §Accessibility — do NOT add an explicit `role` attribute (would duplicate).

---

### `src/components/portal/ImpersonationBannerStub.astro` (NEW)

**Analog:** `src/components/portal/ConfidentialityBanner.astro` — smallest pure-render component shape in `components/portal/`.

**Full file content** (planner reference):

```astro
---
// Phase 47 stub — verifies <slot name="banner"> wiring in PortalLayout
// without shipping the real impersonation banner UI. Phase 50 replaces
// this file with the real ImpersonationBanner driven by
// Astro.locals.impersonating (see env.d.ts:20).
//
// MUST NOT render any user-visible chrome. The banner slot's empty state
// IS the absence of any rendered content (UI-SPEC §Copywriting Contract).
---

<div data-testid="banner-slot-mounted" hidden></div>
```

**Why `hidden` not `aria-hidden`:** `hidden` removes the element from layout entirely (zero rendered height per UI-SPEC §Spacing line 62: "When slot is empty: zero rendered height, no layout shift"). `aria-hidden` would still consume layout space.

---

### `src/pages/portal/dashboard.astro` (modified — strip inlined chrome)

**Analog:** self.

**Lines to DELETE:**
- Lines 53-57 — inlined wordmark + sub-label `<p>` blocks (PortalHeader now renders these)
- Lines 192-200 — inlined sign-out `<div>` block (PortalHeader renders sign-out for any authenticated session per CONTEXT D-4)

**Lines to KEEP unchanged:**
- Line 4 — `import PortalLayout from "../../components/portal/PortalLayout.astro";`
- Line 13 — `const tenant = await getPortalBrand(sanityClient);`
- Line 50 — `<PortalLayout title={...} tenant={tenant}>` invocation
- Body content (lines 60+) — `<h1>Welcome back, {firstName}</h1>` and below stays as-is

**No new imports needed.** PortalHeader and PortalFooter are mounted inside PortalLayout, not by the page.

---

### `src/pages/portal/project/[projectId].astro` (modified — strip inlined chrome)

**Analog:** self.

**Lines to DELETE:**
- Lines 65-69 — inlined wordmark `<p>` block
- Lines 112-119 — inlined sign-out `<div>` block

**Lines to KEEP unchanged:**
- Line 61-63 — "Back to Dashboard" link (page-level affordance, NOT chrome)
- Line 71+ — `<ProjectHeader project={project} />` and below

---

### `src/pages/portal/[token].astro` (PURL upgrade landing)

**Analog:** self.

**Lines to DELETE:**
- Lines 16-19 — inlined wordmark `<p>` block

**Lines to KEEP unchanged:** the heading, body, and "Go to Login" CTA. PortalHeader handles the wordmark; this page is reachable WITHOUT a session (CONTEXT D-4: header sign-out renders only when authenticated, which a `[token]` landing-message page is not), so PortalHeader will show wordmark-only without sub-label or sign-out — but only if rendered in `bare` mode. **Decision needed by planner:** the [token] page is a public landing — should it use `bare` like login? UI-SPEC §Component Inventory does NOT list [token] under "Pages adopting bare prop." Recommend planner clarifies with user; default behavior (no `bare`) means a wordmark-only header (since `Astro.locals.role` is undefined on this public path → `showSignOut === false` → no role sub-label rendered) — which visually matches `bare` anyway.

---

### `src/pages/portal/login.astro` (add `bare`)

**Analog:** self (lines 19, 22-25).

**Single-line change at line 19:**

```diff
- <PortalLayout title={`Login | ${tenant.displayName}`} tenant={tenant}>
+ <PortalLayout title={`Login | ${tenant.displayName}`} tenant={tenant} bare>
```

**Lines to DELETE (now redundant):**
- Lines 22-25 — inlined wordmark `<p>` block (PortalHeader bare-mode renders it)

**Caveat:** the existing inlined wordmark uses `mb-8`. PortalHeader's bare-mode wordmark uses `pb-4` / `pb-6` from header padding. Page-level body content (`<h1>Welcome to Your Portal</h1>` at line 28) loses its `mb-8` breathing room above. Visual delta is minor (8px → ~24px) but planner should flag for visual regression check.

---

### `src/pages/portal/role-select.astro` (add `bare`)

**Analog:** self (lines 43, 46-49). Same pattern as `login.astro` — add `bare` to PortalLayout invocation, delete lines 46-49 (inlined wordmark).

---

### `src/pages/workorder/dashboard.astro` + `src/pages/building/dashboard.astro` (modified)

**Analog:** `src/pages/portal/dashboard.astro` (post-strip).

**Lines to DELETE in `workorder/dashboard.astro`:**
- Lines 45-49 — inlined wordmark + "Contractor Portal" sub-label
- Lines 122-130 — inlined sign-out

**Lines to DELETE in `building/dashboard.astro`:**
- Lines 26-30 — inlined wordmark + "Building Manager Portal" sub-label
- Lines 67-75 — inlined sign-out

**Sub-label string mismatch:** existing pages render "Contractor Portal" / "Building Manager Portal" / "Client Portal" (Title Case, longer strings). PortalHeader's `ROLE_SUBLABEL` map locks "Trade portal" / "Building portal" / "Client portal" (sentence case, shorter — UI-SPEC line 130-132). After PortalHeader hoist, these pages will display the *new* sub-label strings, not the legacy ones. This is the intended deliverable but planner should call out the visible copy change in plan tasks for executor awareness.

**Hardcoded "La Sprezzatura" wordmark:** `workorder/dashboard.astro:47` and `building/dashboard.astro:28` use a literal `La Sprezzatura` string — NOT `tenant.wordmark` like `portal/dashboard.astro:54`. After hoist, both routes will display `tenant.wordmark` ("LA SPREZZATURA" — uppercased per `portalBrand.ts:54`) sourced from the layout. **Action item for planner:** these pages do NOT currently fetch `tenant` via `getPortalBrand()`. Planner must add the fetch + pass `tenant={tenant}` to PortalLayout in `workorder/dashboard.astro` and `building/dashboard.astro` (and the corresponding project pages and login pages) so the wordmark resolves correctly. Reference pattern from `portal/dashboard.astro:11-13`:

```astro
import { sanityClient } from "sanity:client";
import { getPortalBrand } from "../../lib/portal/portalBrand";

const tenant = await getPortalBrand(sanityClient);
```

Then: `<PortalLayout title={...} tenant={tenant}>`

---

### `src/pages/workorder/project/[projectId].astro` + `src/pages/building/project/[projectId].astro`

**Analog:** `src/pages/portal/project/[projectId].astro`.

**Lines to DELETE in `workorder/project/[projectId].astro`:** lines 324-332 (inlined sign-out). Wordmark inspection — planner: confirm whether this file has its own inlined wordmark to strip; partial read above showed only the sign-out tail.

**Lines to DELETE in `building/project/[projectId].astro`:** lines 238-246 (inlined sign-out).

**Apply the same `tenant` pass-through fix as the dashboards if missing.**

---

### `src/pages/workorder/login.astro` + `src/pages/building/login.astro` (add `bare`)

**Analog:** `src/pages/portal/login.astro`.

**workorder/login.astro:**
- Line 15: add `bare` prop AND add `tenant={tenant}` (currently missing — passes raw `title="Work Order Access | La Sprezzatura"` literal). Planner: add `getPortalBrand` fetch (3 lines in frontmatter, mirroring `portal/login.astro:6-9`).
- Lines 18-21: DELETE inlined wordmark.

**building/login.astro:** same pattern (line 15 `bare` + `tenant`; lines 18-21 DELETE).

---

### `src/components/portal/PortalHeader.test.ts` (NEW)

**Analog:** `src/components/portal/ProcurementTable.test.ts:1-37` (verified). The repo's established Astro-component test pattern is **string-grep** against the `.astro` file, not DOM rendering. Vitest + `node:fs.readFileSync`.

**Pattern:**

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const HEADER_PATH = resolve(
  REPO_ROOT,
  "src/components/portal/PortalHeader.astro",
);
const STUB_PATH = resolve(
  REPO_ROOT,
  "src/components/portal/ImpersonationBannerStub.astro",
);
const LAYOUT_PATH = resolve(
  REPO_ROOT,
  "src/components/portal/PortalLayout.astro",
);

function load(p: string): string {
  return readFileSync(p, "utf8");
}

describe("PortalHeader.astro -- chrome contract", () => {
  it("declares bare prop in interface", () => {
    expect(load(HEADER_PATH)).toMatch(/bare\?:\s*boolean/);
  });
  it("maps all three roles to sub-labels", () => {
    const src = load(HEADER_PATH);
    expect(src).toContain('"Client portal"');
    expect(src).toContain('"Trade portal"');
    expect(src).toContain('"Building portal"');
  });
  it("derives role from Astro.locals.role (not URL)", () => {
    expect(load(HEADER_PATH)).toContain("Astro.locals.role");
  });
  it("renders Sign Out anchor", () => {
    expect(load(HEADER_PATH)).toMatch(/Sign Out/);
  });
});

describe("ImpersonationBannerStub.astro -- empty banner contract", () => {
  it("renders only the test-id div, no visible chrome", () => {
    const src = load(STUB_PATH);
    expect(src).toContain('data-testid="banner-slot-mounted"');
    expect(src).toContain("hidden");
  });
});

describe("PortalLayout.astro -- banner slot wiring", () => {
  it("exposes a named slot for banner", () => {
    expect(load(LAYOUT_PATH)).toMatch(/<slot\s+name=["']banner["']/);
  });
  it("mounts PortalHeader and PortalFooter components", () => {
    const src = load(LAYOUT_PATH);
    expect(src).toContain("PortalHeader");
    expect(src).toContain("PortalFooter");
  });
});
```

**Why this works in this repo:** Astro components don't have a runtime test harness configured (no Astro container/SSR test setup in `vitest.config.ts`). The repo's convention — used by 3+ portal components already — is to verify chrome via source-text assertions. This is fast, deterministic, and matches the project's GSD verification patterns.

---

## Shared Patterns

### Tenant brand pass-through

**Source:** `src/lib/portal/portalBrand.ts:14-21` (type) + `src/pages/portal/dashboard.astro:11-13` (call site).

**Apply to:** every page passing into PortalLayout (especially the workorder/building pages currently missing the fetch — see "Action item for planner" callouts above).

```astro
---
import { sanityClient } from "sanity:client";
import { getPortalBrand } from "../../lib/portal/portalBrand";

const tenant = await getPortalBrand(sanityClient);
---

<PortalLayout title={...} tenant={tenant}>
```

### Role-aware behavior via `Astro.locals.role`

**Source of truth:** `src/env.d.ts:10` — `role: 'client' | 'contractor' | 'building_manager' | 'admin' | undefined`.

**Set by:** `src/middleware.ts:119` (portal), `:146` (workorder), `:173` (building). All three branches set `context.locals.role` to the *viewer* role (impersonation-aware per Phase 49 D-04).

**Apply to:** PortalHeader sub-label resolution AND sign-out endpoint resolution (CONTEXT Open Q1 + Q4 confirmation).

**Defensive fallback:** when `Astro.locals.role` is undefined (public paths in `PUBLIC_PATHS` — middleware.ts:10-27), PortalHeader must render gracefully (no sub-label, no sign-out). The bare-mode prop covers login/role-select; the `showSignOut` guard covers PURL landing and any future public path.

### Sign-out endpoint convention

**Source:** `src/pages/portal/logout.ts:1-9`. Simple GET handler:

```typescript
import type { APIRoute } from "astro";
import { clearSession } from "../../lib/session";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  clearSession(context.cookies);
  return context.redirect("/portal/login");
};
```

**Sibling files (verified to exist):** `src/pages/workorder/logout.ts`, `src/pages/building/logout.ts`. Same shape, different redirect targets. **CONTEXT D-4 mentions "form posts"; UI-SPEC line 134 corrects this — current pattern is GET anchor, NOT POST form.** Phase 47 keeps GET — does not introduce CSRF surface. Sign-out renders as `<a href="/portal/logout">Sign Out</a>`, NOT `<form method="POST">`.

### Conditional rendering

**Source:** `src/components/portal/PortalLayout.astro:42` and many pages — Astro template's `{condition && (<jsx>)}`. NOT React-style ternary fallback. Use this consistently across PortalHeader bare-mode branching.

### Spacing tokens (header / footer)

**Source:** existing portal pages. UI-SPEC §Spacing locks the values; analogs verify they're already in use:
- `px-4 ... md:px-6` — `dashboard.astro:52` body wrapper
- `text-xs tracking-[0.2em] uppercase` — `dashboard.astro:54` and `PortalLayout.astro:69`
- `text-stone/60` — `dashboard.astro:57`
- `tracking-widest` for sign-out — `dashboard.astro:196`, `project/[projectId].astro:115`

### Color tokens

**Source:** existing pages. All PortalHeader/PortalFooter colors map to existing utility classes already in repo:
- `text-stone` (default), `hover:text-terracotta` — verified in 6+ files
- `text-stone-light` (footer email default) — `PortalLayout.astro:72`
- `bg-cream` (body background, no chrome bg) — `PortalLayout.astro:41`

### Accessibility landmarks

**Source:** Astro implicit roles. Per UI-SPEC §Accessibility:
- `<header>` → implicit `role="banner"` (do NOT add explicit role)
- `<footer>` → implicit `role="contentinfo"` (do NOT add explicit role)
- Banner slot wrapper: explicit `<div role="region" aria-label="Notifications">` because `<div>` has no implicit role.

Existing global focus-visible rule lives at `src/styles/global.css:55` (per UI-SPEC) — PortalHeader/PortalFooter inherit it without override.

---

## No Analog Found

None. Every new file in this phase has a strong same-repo analog. The phase's deliverables are mechanical extractions of patterns already present in the codebase — no new design or framework primitives are introduced.

---

## Metadata

**Analog search scope:**
- `src/components/portal/` (29 files scanned)
- `src/pages/portal/`, `src/pages/workorder/`, `src/pages/building/` (all `.astro` pages)
- `src/layouts/` (2 layouts)
- `src/middleware.ts` (role hydration)
- `src/env.d.ts` (locals shape)
- `src/lib/portal/portalBrand.ts` (brand types)
- `src/components/portal/*.test.ts` (test convention)

**Files scanned:** ~40
**Pattern extraction date:** 2026-04-30

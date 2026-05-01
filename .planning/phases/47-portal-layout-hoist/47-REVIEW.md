---
phase: 47-portal-layout-hoist
reviewed: 2026-05-01T02:05:27Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/components/portal/ImpersonationBannerStub.astro
  - src/components/portal/PortalFooter.astro
  - src/components/portal/PortalHeader.astro
  - src/components/portal/PortalHeader.test.ts
  - src/components/portal/PortalLayout.astro
  - src/pages/building/dashboard.astro
  - src/pages/building/login.astro
  - src/pages/building/project/[projectId].astro
  - src/pages/portal/[token].astro
  - src/pages/portal/dashboard.astro
  - src/pages/portal/login.astro
  - src/pages/portal/project/[projectId].astro
  - src/pages/portal/role-select.astro
  - src/pages/workorder/dashboard.astro
  - src/pages/workorder/login.astro
  - src/pages/workorder/project/[projectId].astro
findings:
  blocker: 0
  warning: 6
  total: 6
status: issues_found
---

# Phase 47: Code Review Report

**Reviewed:** 2026-05-01T02:05:27Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

The Phase 47 chrome-hoist landed cleanly: 11 page templates lost their inlined wordmarks and sign-outs, and the new `PortalHeader`/`PortalFooter`/`ImpersonationBannerStub` components encapsulate the contract that Phase 50 will extend. Per-page diffs are surgical and the test fixture (`PortalHeader.test.ts`) is well-scoped.

That said, the new code introduces several correctness and accessibility defects that should be addressed before Phase 50 builds on top of the slot:

- The `<slot name="banner">` is wrapped in an always-rendered ARIA `region` landmark whose default content is a `hidden` div — i.e. an empty named landmark on every portal page (a screen-reader anti-pattern).
- `PortalHeader` silently breaks on the `admin` role branch declared in `App.Locals.role`: no sub-label, no sign-out, no fallback. Only the three portal roles map.
- `bare`-mode `PortalHeader` renders a centered wordmark from `tenant.wordmark`, but `PortalFooter` continues to render `tenant.displayName • Interior Design` even on login pages — verify this matches the locked D-5 footer-unchanged decision (it does, but pages that previously had no footer now do — verify visually).
- The `PortalHeader` test file uses `__dirname` and `node:fs`, which fails under ESM/Vitest configs that don't shim CommonJS globals. Confirm `vitest.config.ts` polyfills `__dirname` or migrate to `import.meta.url`.
- The `ImpersonationBannerStub` test asserts `\bhidden(>|><\/)` — overly tight regex that will silently break the moment Phase 50 (or anyone) adds another attribute on the same line.
- Portal page templates aggressively `as any` Sanity payloads without guards on optional fields (pre-existing pattern, but Phase 47 commits more of it via touched files).

No blocker-grade defects. All findings are quality / correctness / accessibility issues.

## Warnings

### WR-01: Empty `<region>` landmark renders on every portal page

**File:** `src/components/portal/PortalLayout.astro:58-62`
**Issue:** The banner slot is wrapped in an always-rendered `<div role="region" aria-label="Notifications">`. When no banner is supplied (the common case in Phase 47 — the default fallback is `ImpersonationBannerStub`, which renders only `<div data-testid="banner-slot-mounted" hidden></div>`), the region landmark exists in the accessibility tree with **no perceivable content**. Screen-reader users navigating by landmarks (e.g. NVDA "D" key, VoiceOver rotor) will land on a "Notifications region" that contains nothing. WAI-ARIA explicitly warns against empty landmark regions: a region with no perceivable content is a navigation dead-end and inflates the landmark count.

This will become correct in Phase 50 when the slot is filled with the real `ImpersonationBanner` driven by `Astro.locals.impersonating`. Until then (which is now), every portal page has a phantom landmark.

**Fix:** Conditionally render the wrapper only when a banner is actually present, or move the `role="region"` onto the banner element itself in Phase 50 and drop the wrapper entirely. For Phase 47, the simplest fix is to drop the wrapper and let `ImpersonationBannerStub` (and Phase 50's banner) own the landmark:

```astro
{/* Banner slot — Phase 50 fills with the real ImpersonationBanner. */}
<slot name="banner">
  <ImpersonationBannerStub />
</slot>
```

The stub already renders `hidden`, so no landmark is exposed; Phase 50's banner can set its own `role="region"` / `role="status"`.

---

### WR-02: `PortalHeader` silently breaks for `admin` role

**File:** `src/components/portal/PortalHeader.astro:18-34`
**Issue:** `App.Locals.role` (declared in `src/env.d.ts:10`) is typed `'client' | 'contractor' | 'building_manager' | 'admin' | undefined`. The two role-keyed maps in `PortalHeader` (`ROLE_SUBLABEL`, `LOGOUT_HREF`) only cover the three portal roles. If `Astro.locals.role === "admin"` reaches a portal-layout consumer (today this is gated by middleware to redirect admins out, but the type contract still permits it, and impersonation-exit edge cases are non-trivial), then:

- `subLabel` is `undefined` → no role sub-label renders (silent — header collapses to wordmark only)
- `logoutHref` is `undefined` → `showSignOut` is `false`, so no sign-out anchor renders
- The user is authenticated but has no visible way to sign out from chrome

The `Record<string, string>` typing also defeats TypeScript's exhaustiveness check — adding a new role to the union won't surface a compile error here.

**Fix:** Type the maps against the role union to force exhaustive coverage, and decide explicitly what `admin` should see:

```ts
type PortalRole = "client" | "contractor" | "building_manager";
const ROLE_SUBLABEL: Record<PortalRole, string> = {
  client: "Client portal",
  contractor: "Trade portal",
  building_manager: "Building portal",
};
const LOGOUT_HREF: Record<PortalRole, string> = {
  client: "/portal/logout",
  contractor: "/workorder/logout",
  building_manager: "/building/logout",
};
const role = Astro.locals.role;
const portalRole: PortalRole | undefined =
  role === "client" || role === "contractor" || role === "building_manager"
    ? role
    : undefined;
const subLabel = portalRole ? ROLE_SUBLABEL[portalRole] : undefined;
const logoutHref = portalRole ? LOGOUT_HREF[portalRole] : undefined;
```

This makes the admin/undefined branch explicit and adding a new role to `App.Locals.role` will fail the build.

---

### WR-03: `PortalHeader.test.ts` relies on `__dirname`

**File:** `src/components/portal/PortalHeader.test.ts:13-16`
**Issue:** The test resolves the repo root via `resolve(__dirname, "..", "..", "..")` and synchronously reads files with `node:fs`. `__dirname` is a CommonJS global; Vitest in ESM mode (which this project uses — see `astro@5`, `"type": "module"` semantics) does NOT define it unless the user's Vite config shims it. If `vitest.config.ts` doesn't polyfill, the entire test file ReferenceErrors at import time and all 10 contract assertions silently never run.

**Fix:** Use `import.meta.url` and `fileURLToPath`:

```ts
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..", "..");
```

Verify by running the test in isolation: `npx vitest run src/components/portal/PortalHeader.test.ts`. (Repo convention from `ProcurementTable.test.ts` may have already solved this — confirm before changing.)

---

### WR-04: Brittle regex in stub-contract test

**File:** `src/components/portal/PortalHeader.test.ts:62`
**Issue:** The assertion `expect(src).toMatch(/\bhidden(>|><\/)/)` requires `hidden` to be the LAST attribute on the element OR immediately followed by `></...`. Adding any attribute after `hidden` (e.g. a className for Phase 50, an `aria-hidden` correction, a data attribute) breaks this regex even though the element is still valid empty/hidden chrome.

The intent of the test ("the stub renders nothing visible") is better expressed by asserting the element has `hidden` *somewhere* in its tag, not that `hidden` is positionally last:

**Fix:**

```ts
expect(src).toMatch(/<div[^>]*\bhidden\b[^>]*>/);
```

Or assert structurally: parse the source, check the div has `hidden` attribute, and check no other elements render visible chrome.

---

### WR-05: `PortalFooter` now renders on bare-mode login pages where it previously didn't

**File:** `src/components/portal/PortalLayout.astro:94`
**Issue:** Before Phase 47, the four `bare`-mode pages (`portal/login`, `portal/role-select`, `workorder/login`, `building/login`) had only an inlined wordmark `<p>` and a centered form — no footer at all. After this phase they unconditionally inherit `<PortalFooter tenant={tenant} />` because the layout always mounts it.

This may be intentional (CONTEXT D-5 says "footer renders identically in both modes") but the diff visually changes those pages — they now display `{displayName} • Interior Design` and a contact-email mailto. Phase 47 plans don't enumerate this as an in-scope visual change to the four login pages.

Confirm visually that:
1. Login pages are vertically centered and the footer doesn't push the form upward / collide with `flex-1` `justify-center` math
2. The added footer email is intended copy for unauthenticated visitors (it's harmless to expose, but a UX choice)

If unintended, the layout would need a way to opt out of the footer in `bare` mode, or the contract needs to be documented in CONTEXT D-5 explicitly.

**Fix:** No code change required if intentional. If not, gate the footer:

```astro
{!bare && <PortalFooter tenant={tenant} />}
```

---

### WR-06: Pervasive `(project: any)` and `(addr: any)` in touched page templates

**File:** `src/pages/building/dashboard.astro:20,41`, `src/pages/portal/dashboard.astro:36,90,142`, `src/pages/workorder/dashboard.astro:58`, `src/pages/portal/project/[projectId].astro:54`, `src/pages/building/project/[projectId].astro:101,145,180,186`
**Issue:** Every Sanity payload in touched files is typed `any` (or interpolated from an `any[]` cast like `const designOptions: any[] = ...`). Property access on `project.projectAddress?.street`, `project.engagementType`, `project.cois`, `coi.expirationDate`, etc. is unchecked at compile time — any rename in the GROQ query or schema silently fails to runtime `undefined` instead of a TS error.

This is pre-existing (Phase 47 didn't introduce it) but the phase commits more of it: the chrome hoist required no changes to these templates' data layer, yet the touched files are now phase-47 commits. The migration was a clean opportunity to extract a `PortalProject` type from the GROQ projection — passed up.

**Fix (deferred-quality, recommended for v5.3 cleanup):** Generate `PortalProject` from the GROQ `getProjectsByClientId` projection (e.g. via `groqd`, `sanity-typed-queries`, or a hand-rolled interface) and replace `(project: any) => …` with `(project: PortalProject) => …` in every dashboard/project template. Until then, the chrome-hoist work is structurally fine.

---

_Reviewed: 2026-05-01T02:05:27Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

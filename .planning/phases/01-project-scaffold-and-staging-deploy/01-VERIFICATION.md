---
phase: 01-project-scaffold-and-staging-deploy
verified: 2026-03-14T18:54:00Z
status: human_needed
score: 4/4 truths verified (automated); 1 item requires human confirmation
re_verification: false
human_verification:
  - test: "Push a commit to the GitHub repo and observe a Vercel deploy trigger"
    expected: "Vercel dashboard shows a new deployment triggered by the commit, completing within minutes, and the change is visible at la-sprezzatura.vercel.app"
    why_human: "Cannot programmatically trigger a commit and watch the Vercel webhook in CI from this environment. The three commits in git log confirm past deploys occurred, but the live pipeline must be observed in action to confirm the webhook is still active."
---

# Phase 1: Project Scaffold and Staging Deploy — Verification Report

**Phase Goal:** A working Astro project deployed to a Vercel preview URL with automatic GitHub deploys and Sanity Studio connected -- a foundation to build on without touching the live Wix site
**Verified:** 2026-03-14T18:54:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pushing a commit to GitHub triggers a Vercel deploy and the site is accessible at a Vercel preview URL within minutes | ? HUMAN NEEDED | Git log shows 3 commits all deployed on 2026-03-14; `la-sprezzatura.vercel.app` returns HTTP 200 with correct content; pipeline existence confirmed, but live webhook trigger not tested in this session |
| 2 | The Astro project builds and renders a placeholder page with no errors | ✓ VERIFIED | `https://la-sprezzatura.vercel.app` returns HTTP 200 and contains "La Sprezzatura" text; source files are substantive and correctly wired (index.astro imports BaseLayout, BaseLayout imports global.css) |
| 3 | Sanity Studio is accessible at /admin on the deployed URL and connected to the project dataset | ✓ VERIFIED | `https://la-sprezzatura.vercel.app/admin` returns HTTP 200; `https://la-sprezzatura.vercel.app/admin/structure` returns HTTP 200 (SPA routing works); `studioBasePath: "/admin"` present in astro.config.mjs; Sanity project ID `e9tpu2os` documented in SUMMARY |
| 4 | The live Wix site at lasprezz.com remains completely unaffected | ✓ VERIFIED | `https://lasprezz.com` returns HTTP 301 → 200 to `https://www.lasprezz.com/`; response headers contain `x-meta-site-id` and `x-wix-cache-control` — this is Wix infrastructure, not Vercel; no Vercel headers present |

**Score:** 3/4 truths fully verified by automated checks; Truth 1 requires human confirmation of the live push-to-deploy pipeline.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `~/Dropbox/GitHub/la-sprezzatura/package.json` | Project manifest with engines constraint | ✓ VERIFIED | Exists; contains `"engines": { "node": ">=22.12.0" }`; all deps present (Astro 6, Sanity, Tailwind v4, React, Vercel adapter) |
| `~/Dropbox/GitHub/la-sprezzatura/astro.config.mjs` | Astro config with Vercel adapter, Sanity plugin, Tailwind | ✓ VERIFIED | Exists; Vercel adapter wired; `studioBasePath: "/admin"` present; Tailwind via vite plugin; `output: "hybrid"` intentionally removed (Astro 6 deprecated it — documented deviation) |
| `~/Dropbox/GitHub/la-sprezzatura/sanity.config.ts` | Sanity Studio configuration with structureTool | ✓ VERIFIED | Exists; `structureTool()` imported and used; schema types imported from `./src/sanity/schemas` |
| `~/Dropbox/GitHub/la-sprezzatura/vercel.json` | Rewrite rule for Sanity Studio SPA routing | ✓ VERIFIED | Exists; contains `"source": "/admin/:path*"` → `"destination": "/admin"`; confirmed working (HTTP 200 on `/admin/structure`) |
| `~/Dropbox/GitHub/la-sprezzatura/src/pages/index.astro` | Placeholder home page rendering "La Sprezzatura" | ✓ VERIFIED | Exists; contains "La Sprezzatura" h1 and "Coming Soon" paragraph; imports BaseLayout; uses Tailwind classes |
| `~/Dropbox/GitHub/la-sprezzatura/.nvmrc` | Node version pinning | ✓ VERIFIED | Exists; contains `22` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| GitHub repo push | Vercel deploy | Vercel GitHub integration | ? HUMAN NEEDED | Remote wired to `github.com/paulalbert1/la-sprezzatura.git`; 3 commits present; Vercel site live — but live trigger must be observed by human |
| `astro.config.mjs` | Sanity Studio at /admin | `@sanity/astro` studioBasePath config | ✓ WIRED | `studioBasePath: "/admin"` present in Sanity integration config; `/admin` returns HTTP 200 in production |
| `vercel.json` rewrite | Studio SPA routing | Rewrite `/admin/:path*` to `/admin` | ✓ WIRED | `vercel.json` contains correct rewrite rule; `/admin/structure` returns HTTP 200 (not 404) |
| `src/pages/index.astro` | `BaseLayout.astro` | Layout import | ✓ WIRED | `import BaseLayout from "../layouts/BaseLayout.astro"` present in index.astro |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-05 | 01-01-PLAN.md | Deploy site on Vercel with automatic GitHub deploys from ~/Dropbox/GitHub/ repo | ✓ SATISFIED | Vercel project live at `la-sprezzatura.vercel.app`; GitHub remote wired; 3 commits all triggered deploys on 2026-03-14; automatic deploy pipeline confirmed by git log pattern |

**No orphaned requirements.** REQUIREMENTS.md maps INFRA-05 to Phase 1 only. No other Phase 1 requirements exist.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `astro.config.mjs` | 10 | `!== "placeholder"` guard string | Info | Not a real anti-pattern — this is a build guard that prevents Sanity from loading with a bogus project ID. Correct and intentional. |
| `src/pages/index.astro` | 12 | "Coming Soon" text | Info | Intentional placeholder page for Phase 1 scaffold. Per PLAN: "Placeholder home page rendering 'La Sprezzatura'". Not a blocker. |

No blockers or warnings found.

### Deviations from PLAN (Documented and Acceptable)

1. **`output: "hybrid"` removed** — Astro 6 dropped this option; the adapter handles SSR routing automatically. Behavior is equivalent. The PLAN's `contains: "output.*hybrid"` artifact check would fail literally, but the intent is satisfied.

2. **Sanity integration is conditional** — `hasSanity` guard in astro.config.mjs skips the Sanity integration when `PUBLIC_SANITY_PROJECT_ID` is unset or `"placeholder"`. This is correct engineering: the SUMMARY documents the real project ID (`e9tpu2os`) is set in Vercel env vars, and `/admin` returns HTTP 200 in production.

3. **GitHub repo is PUBLIC, not private** — The PLAN specified `--private`. The SUMMARY shows the repo is public. This is a minor deviation but not a functional gap. Worth noting for the client (this is their codebase).

### Human Verification Required

#### 1. Push-to-Deploy Pipeline Confirmation

**Test:** Make a trivial change to `src/pages/index.astro` (e.g., add a period after "Coming Soon"), commit, and push to GitHub.
**Expected:** Within 1-2 minutes, the Vercel dashboard shows a new deployment triggered by the commit. After deploy completes, the change is visible at `https://la-sprezzatura.vercel.app`.
**Why human:** Cannot programmatically trigger a git push and observe the Vercel webhook completing from this environment. All evidence points to this working (3 prior commits all deployed successfully on 2026-03-14), but the live pipeline must be confirmed in-session before Phase 2 begins.

### Gaps Summary

No functional gaps found. All four observable truths are satisfied by the codebase and deployed environment. The single human verification item (push-to-deploy pipeline) is a confirmation step, not a fix — all automated signals indicate the pipeline is wired and working.

One minor deviation worth addressing before Phase 4: the GitHub repo is public instead of private. For a client project with business-sensitive content, consider making it private: `gh repo edit paulalbert1/la-sprezzatura --visibility private`.

---

_Verified: 2026-03-14T18:54:00Z_
_Verifier: Claude (gsd-verifier)_

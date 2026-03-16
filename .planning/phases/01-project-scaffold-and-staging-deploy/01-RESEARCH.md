# Phase 1: Project Scaffold and Staging Deploy - Research

**Researched:** 2026-03-14
**Domain:** Astro 6 project scaffolding, Sanity v3 CMS integration, Vercel deployment pipeline
**Confidence:** HIGH

## Summary

Phase 1 creates the foundation: an Astro 6 project with Sanity v3 embedded Studio and Tailwind CSS v4, deployed to Vercel via GitHub with automatic deploys. The scope is narrow -- scaffold, configure, deploy, verify. No design work, no content, no pages beyond a placeholder.

The critical technical discovery is a **Node.js version requirement**: Astro 6 requires Node 22.12.0+, the local machine's active shell runs Node 18 (though Node 22.22.1 is installed via nvm), and the project must pin Node 22 via `.nvmrc` and `package.json` engines. Vercel supports Node 22.x natively (it defaults to Node 24.x as of March 2026), so no issues on the deployment side.

Embedding Sanity Studio inside the Astro project requires `output: 'hybrid'` mode and the `@astrojs/vercel` adapter. A known pitfall: the Studio is a client-side SPA, so direct URL access or page refresh on `/admin/structure` returns 404 unless a `vercel.json` rewrite routes `/admin/*` back to `/admin`. This is well-documented and the fix is a 4-line JSON file.

**Primary recommendation:** Create the Astro project from scratch using `npm create astro@latest` with the minimal template, add integrations one by one (`@sanity/astro`, `@astrojs/react`, `@astrojs/vercel`, `@tailwindcss/vite`), configure Sanity with an embedded Studio at `/admin`, push to GitHub, and import into Vercel. The live Wix site at lasprezz.com is completely unaffected -- this deploys to a Vercel preview URL only.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-05 | Deploy site on Vercel with automatic GitHub deploys from ~/Dropbox/GitHub/ repo | Full coverage: Astro 6 scaffolding, @astrojs/vercel adapter, GitHub repo creation via `gh` CLI, Vercel auto-deploy on push. Sanity Studio embedded at `/admin` with hybrid output mode. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.x | Site framework | Zero-JS static pages by default. Ships with View Transitions, Server Islands. Requires Node 22.12.0+. |
| @astrojs/vercel | latest | Vercel deployment adapter | Official adapter. Enables hybrid output mode for SSR routes (needed for embedded Sanity Studio). |
| @sanity/astro | latest | Sanity integration for Astro | Official plugin. Handles embedded Studio, Sanity client configuration, Content Layer API. |
| sanity | 3.99.x | Sanity Studio core | Required peer dependency for embedded Studio. Includes structureTool, schema system. |
| @sanity/client | latest | Sanity API client | GROQ queries, data fetching. Bundled with @sanity/astro but used directly for typed queries. |
| Tailwind CSS | 4.x | Styling | CSS-first configuration (no config file). Uses @tailwindcss/vite plugin. |
| @tailwindcss/vite | latest | Tailwind v4 Vite plugin | The canonical way to use Tailwind v4 with Astro. Replaces deprecated @astrojs/tailwind. |
| @astrojs/react | latest | React island support | Required for Sanity Studio embedding (Studio is a React app). |
| React | 19.x | UI library (islands only) | Peer dependency for @astrojs/react and Sanity Studio. |
| TypeScript | 5.x | Type safety | Astro 6 has first-class TS support. Sanity schemas are fully typed. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sanity/image-url | latest | Image URL builder | Phase 1 install, used in Phase 2 for responsive images via Sanity CDN |
| @biomejs/biome | latest | Linting + formatting | Day 1. Single tool replaces ESLint + Prettier. |
| sharp | latest | Build-time image optimization | Astro uses sharp internally for local image optimization |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Embedded Sanity Studio at /admin | Separate Sanity Studio deployment | Adds deployment complexity. Embedded is simpler for a single-developer project. |
| @tailwindcss/vite | @astrojs/tailwind | @astrojs/tailwind is deprecated for Tailwind v4. Do NOT use it. |
| Biome | ESLint + Prettier | Biome is faster, single tool, sufficient for this project's needs. |
| Vercel dashboard import | Vercel CLI (`vercel link`) | CLI is not installed. Dashboard import is simpler for initial setup. |

**Installation:**
```bash
# Ensure Node 22 is active
nvm use 22

# Initialize Astro project (in ~/Dropbox/GitHub/)
npm create astro@latest la-sprezzatura -- --template minimal --typescript strict

# Core framework + deployment
npm install @astrojs/react @astrojs/vercel react react-dom

# CMS (Sanity)
npm install @sanity/astro @sanity/client @sanity/image-url sanity

# Styling
npm install tailwindcss @tailwindcss/vite

# Dev tools
npm install -D typescript @types/react @types/react-dom @biomejs/biome
```

## Architecture Patterns

### Recommended Project Structure

```
la-sprezzatura/                    # ~/Dropbox/GitHub/la-sprezzatura/
├── .nvmrc                         # "22" -- pins Node version
├── astro.config.mjs               # Astro config with integrations
├── sanity.config.ts               # Sanity Studio config (MUST be in project root)
├── sanity.cli.ts                  # Sanity CLI config
├── vercel.json                    # Rewrite rules for Studio SPA routing
├── biome.json                     # Biome linter/formatter config
├── package.json                   # engines.node: ">=22.12.0"
├── tsconfig.json                  # Astro TypeScript config
├── public/                        # Static assets (favicon, robots.txt)
├── src/
│   ├── env.d.ts                   # Type references for Astro + Sanity
│   ├── pages/
│   │   └── index.astro            # Placeholder home page
│   ├── layouts/
│   │   └── BaseLayout.astro       # HTML shell (head, body, global CSS import)
│   ├── styles/
│   │   └── global.css             # @import "tailwindcss"
│   ├── components/                # UI components (empty in Phase 1)
│   └── sanity/
│       ├── client.ts              # Sanity client helper
│       └── schemas/
│           └── index.ts           # Schema barrel export (placeholder)
└── .github/
    └── (no workflows needed -- Vercel auto-deploys from GitHub)
```

### Pattern 1: Astro Config with Hybrid Output and Embedded Studio

**What:** Configure Astro for hybrid rendering with Vercel adapter and embedded Sanity Studio.
**When to use:** Always -- this is the project's core configuration.
**Example:**

```typescript
// astro.config.mjs
// Source: https://docs.astro.build/en/guides/integrations-guide/vercel/
//         https://www.sanity.io/plugins/sanity-astro
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "hybrid",
  adapter: vercel(),
  integrations: [
    sanity({
      projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
      dataset: import.meta.env.PUBLIC_SANITY_DATASET,
      useCdn: false,
      studioBasePath: "/admin",
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Pattern 2: Sanity Studio Configuration

**What:** Root-level sanity.config.ts that defines the project, dataset, plugins, and schema types for the embedded Studio.
**When to use:** Required for embedded Studio to function.
**Example:**

```typescript
// sanity.config.ts (project root -- NOT in src/)
// Source: https://www.sanity.io/docs/studio/configuration
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemas";

export default defineConfig({
  name: "la-sprezzatura",
  title: "La Sprezzatura",
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
```

### Pattern 3: Vercel Rewrite for Studio SPA

**What:** Rewrite all `/admin/*` paths to `/admin` so the Studio's client-side router handles sub-routes.
**When to use:** Always -- without this, refreshing or deep-linking into Studio returns 404.
**Example:**

```json
// vercel.json (project root)
// Source: https://www.sanity.io/answers/resolving-issues-with-sanity-and-astro-js-integration-and-deployment--
{
  "rewrites": [
    {
      "source": "/admin/:path*",
      "destination": "/admin"
    }
  ]
}
```

### Pattern 4: Environment Variables

**What:** Sanity project ID and dataset are not secrets but are environment-specific.
**When to use:** All environments.
**Example:**

```bash
# .env (local development -- DO NOT commit)
PUBLIC_SANITY_PROJECT_ID=your_project_id
PUBLIC_SANITY_DATASET=production
```

These same variables must be set in Vercel project settings for deployment.

### Pattern 5: TypeScript env.d.ts

**What:** Type declarations for Astro and Sanity module types.
**When to use:** Required for TypeScript support.
**Example:**

```typescript
// src/env.d.ts
// Source: https://github.com/sanity-io/sanity-astro
/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />
```

### Anti-Patterns to Avoid

- **Do NOT use `@astrojs/tailwind`:** This is the deprecated Tailwind v3 integration. Use `@tailwindcss/vite` in the `vite.plugins` array instead.
- **Do NOT use `astro-sanity`:** This is an unofficial community package that lacks Studio embedding. Use `@sanity/astro` (official).
- **Do NOT put `sanity.config.ts` inside `src/`:** It must be at the project root alongside `astro.config.mjs`.
- **Do NOT use `output: 'static'` with embedded Studio:** The Studio requires server-side routing to handle SPA paths. Use `output: 'hybrid'`.
- **Do NOT import Sanity env vars with `import.meta.env` in `sanity.config.ts` at build time:** Use `process.env` or hardcode for the Sanity config since it runs in a different context than Astro pages. (Verify this during implementation -- the @sanity/astro plugin may handle this.)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sanity Studio hosting | Custom admin panel or separate Studio deploy | Embedded Studio via @sanity/astro studioBasePath | One deployment, one repo, Studio auto-updates |
| Image URL construction | Manual Sanity CDN URL building | @sanity/image-url | Handles responsive sizes, crops, format conversion, LQIP |
| Vercel deployment pipeline | GitHub Actions + Vercel CLI | Vercel GitHub integration (auto-detect) | Zero config. Push to GitHub = deploy. Preview URLs per branch. |
| Linting + formatting | ESLint + Prettier config | Biome | Single config file, faster, covers both |
| Node version pinning | Documentation only | .nvmrc + package.json engines | Enforced, not aspirational |

**Key insight:** Phase 1 is infrastructure-only. Every component should be an off-the-shelf integration, not custom code. The only "code" is configuration files and a placeholder page.

## Common Pitfalls

### Pitfall 1: Node.js Version Mismatch
**What goes wrong:** Astro 6 fails to install or build with cryptic errors because Node 18 is active.
**Why it happens:** The local machine defaults to Node 18.20.8 even though Node 22.22.1 is installed via nvm. The nvm default is set to 22 but the current shell may not have sourced it.
**How to avoid:**
1. Add `.nvmrc` with content `22` in the project root
2. Add `"engines": { "node": ">=22.12.0" }` in package.json
3. Run `nvm use 22` before any npm commands
4. Vercel defaults to Node 24.x; explicitly set to `22.x` in package.json engines or Vercel project settings
**Warning signs:** `npm warn EBADENGINE` during install, unexpected syntax errors, module resolution failures.

### Pitfall 2: Sanity Studio 404 on Page Refresh
**What goes wrong:** Navigating directly to `/admin/structure` or refreshing the browser while in the Studio returns a 404.
**Why it happens:** Sanity Studio is a client-side SPA. Astro's server looks for a file at `/admin/structure` and finds nothing.
**How to avoid:** Add `vercel.json` with a rewrite rule: `{ "source": "/admin/:path*", "destination": "/admin" }`.
**Warning signs:** Studio works on initial load but breaks on refresh or direct URL access.

### Pitfall 3: Wrong Tailwind Integration
**What goes wrong:** Installing `@astrojs/tailwind` produces errors or uses Tailwind v3 instead of v4.
**Why it happens:** The `@astrojs/tailwind` integration is deprecated and only works with Tailwind v3. Tailwind v4 uses the Vite plugin directly.
**How to avoid:** Install `tailwindcss` and `@tailwindcss/vite`, add to `vite.plugins` in astro.config.mjs, create `src/styles/global.css` with `@import "tailwindcss"`.
**Warning signs:** `tailwind.config.mjs` being required, old `@apply` directives not working, version warnings.

### Pitfall 4: Sanity CORS Not Configured
**What goes wrong:** Sanity data fetches fail silently or with CORS errors in the browser console.
**Why it happens:** Sanity requires explicit CORS origin allowlists. Localhost and the Vercel preview URL must be added.
**How to avoid:**
1. Add `http://localhost:4321` (Astro dev server) to Sanity CORS origins with credentials
2. Add the Vercel preview URL (e.g., `https://la-sprezzatura.vercel.app`) to CORS origins
3. For Vercel preview deployments, consider adding a wildcard pattern or using server-side data fetching (which bypasses CORS)
**Warning signs:** Network errors in browser console, blank pages, Studio login failing.

### Pitfall 5: Vercel Hobby Plan for Commercial Site
**What goes wrong:** Site works but violates Vercel Terms of Service.
**Why it happens:** Vercel Hobby plan explicitly prohibits commercial use. La Sprezzatura is a business.
**How to avoid:** Use Vercel Pro ($20/month/seat) from the start. Set this up in the Vercel dashboard before importing the project.
**Warning signs:** Vercel account dashboard showing "Hobby" plan.

### Pitfall 6: Forgetting to Create Sanity Project First
**What goes wrong:** Astro config references a projectId that does not exist, Studio shows connection errors.
**Why it happens:** The Sanity project and dataset must be created on sanity.io before configuring the Astro integration.
**How to avoid:** Run `npx sanity init` (with Node 22 active) or create the project via the Sanity dashboard at sanity.io/manage before writing the astro.config.mjs.
**Warning signs:** "Project not found" errors, authentication failures in Studio.

## Code Examples

Verified patterns from official sources:

### Placeholder Home Page

```astro
---
// src/pages/index.astro
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="La Sprezzatura | Interior Design">
  <main class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-light tracking-wide text-neutral-800">
        La Sprezzatura
      </h1>
      <p class="mt-4 text-lg text-neutral-500">
        Coming Soon
      </p>
    </div>
  </main>
</BaseLayout>
```

### Base Layout

```astro
---
// src/layouts/BaseLayout.astro
import "../styles/global.css";

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

Note: `noindex, nofollow` is deliberate -- this is a staging site that should not be indexed by search engines.

### Global CSS

```css
/* src/styles/global.css */
/* Source: https://tailwindcss.com/docs/installation/framework-guides/astro */
@import "tailwindcss";
```

### Sanity Schema Barrel Export (Placeholder)

```typescript
// src/sanity/schemas/index.ts
// Phase 1: Empty schema array. Schemas added in Phase 2.
export const schemaTypes: never[] = [];
```

### Biome Configuration

```json
// biome.json
// Source: https://biomejs.dev/reference/configuration/
{
  "$schema": "https://biomejs.dev/schemas/2.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "files": {
    "ignore": ["dist/", "node_modules/", ".astro/"]
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<ViewTransitions />` | `<ClientRouter />` | Astro 5 (renamed), Astro 6 (old removed) | Must use `ClientRouter` for view transitions |
| `@astrojs/tailwind` | `@tailwindcss/vite` in vite.plugins | Tailwind v4 (Jan 2025) | Old integration will not work with Tailwind v4 |
| `Astro.glob()` | `import.meta.glob()` | Astro 6 | Old API removed entirely |
| Legacy content collections | Content Layer API | Astro 5 (introduced), Astro 6 (legacy removed) | Must use new Content Layer API for collections |
| `output: 'server'` only for SSR | `output: 'hybrid'` (static by default, SSR opt-in per page) | Astro 2+ | Hybrid is optimal for this project -- static marketing pages, SSR for Studio |
| Node 18/20 support | Node 22.12.0+ minimum | Astro 6 (March 2026) | Must upgrade Node version |
| Zod 3.x | Zod 4.x | Astro 6 | Schema validation changes if using content collections |
| Vite 5/6 | Vite 7 | Astro 6 | New Environment API for dev server |

**Deprecated/outdated:**
- `@astrojs/tailwind`: Deprecated for Tailwind v4. Will not work.
- `astro-sanity`: Unofficial, lacks Studio embedding. Use `@sanity/astro`.
- `Astro.glob()`: Removed in Astro 6. Use `import.meta.glob()`.
- `<ViewTransitions />`: Removed in Astro 6. Use `<ClientRouter />`.
- Vercel Hobby plan for commercial sites: Violates ToS. Use Pro.

## Open Questions

1. **Sanity environment variables in sanity.config.ts**
   - What we know: Astro pages use `import.meta.env.PUBLIC_*` for env vars. Sanity config runs in a different context.
   - What's unclear: Whether @sanity/astro handles the env var bridging automatically or if sanity.config.ts needs `process.env` or hardcoded values.
   - Recommendation: During implementation, test with `import.meta.env.PUBLIC_SANITY_PROJECT_ID` in sanity.config.ts first. If it fails, try `process.env.PUBLIC_SANITY_PROJECT_ID` or hardcode for Phase 1 and revisit.

2. **Vercel Pro team vs personal account**
   - What we know: Vercel Pro is $20/month/seat. Commercial use requires Pro.
   - What's unclear: Whether the user already has a Vercel account and at what plan level.
   - Recommendation: Plan should include a step to verify or create the Vercel account on the Pro plan before importing the project.

3. **Sanity project creation method**
   - What we know: Can create via `npx sanity init`, `npm create sanity@latest`, or the sanity.io dashboard.
   - What's unclear: Whether the user already has a Sanity account or project.
   - Recommendation: Plan should include Sanity project creation as an explicit step, with the project ID captured and stored in `.env`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No test framework needed for Phase 1 (infrastructure/scaffold only) |
| Config file | None -- Phase 1 has no testable application logic |
| Quick run command | `npm run build` (verifies clean build) |
| Full suite command | `npm run build && curl -s -o /dev/null -w "%{http_code}" https://la-sprezzatura.vercel.app` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-05a | Push triggers Vercel deploy | smoke | Push commit, check Vercel dashboard or `curl` preview URL | N/A -- manual verification |
| INFRA-05b | Astro builds with no errors | build | `npm run build` | Wave 0 |
| INFRA-05c | Placeholder page renders | smoke | `curl -s https://la-sprezzatura.vercel.app \| grep "La Sprezzatura"` | N/A -- manual verification |
| INFRA-05d | Sanity Studio accessible | smoke | `curl -s -o /dev/null -w "%{http_code}" https://la-sprezzatura.vercel.app/admin` (expect 200) | N/A -- manual verification |
| INFRA-05e | Wix site unaffected | smoke | `curl -s -o /dev/null -w "%{http_code}" https://lasprezz.com` (expect 200, verify Wix) | N/A -- manual verification |

### Sampling Rate

- **Per task commit:** `npm run build` (must pass before pushing)
- **Per wave merge:** Build + visual check of Vercel preview URL
- **Phase gate:** All 5 smoke tests above must pass

### Wave 0 Gaps

- No test framework needed for Phase 1. All validations are build checks and smoke tests (curl commands against deployed URL).
- A proper test framework (Vitest) should be added in Phase 2 when there is application logic to test.

## Sources

### Primary (HIGH confidence)
- [Astro Install & Setup Docs](https://docs.astro.build/en/install-and-setup/) - Node 22.12.0+ requirement, project creation
- [Astro Upgrade to v6 Guide](https://docs.astro.build/en/guides/upgrade-to/v6/) - Breaking changes, ClientRouter, Vite 7, Zod 4
- [Astro Vercel Deployment Guide](https://docs.astro.build/en/guides/deploy/vercel/) - Zero-config static, adapter for SSR
- [@astrojs/vercel Integration Docs](https://docs.astro.build/en/guides/integrations-guide/vercel/) - Adapter configuration, hybrid mode, server islands
- [Sanity Astro Plugin (Official)](https://www.sanity.io/plugins/sanity-astro) - @sanity/astro installation, embedded Studio configuration
- [sanity-io/sanity-astro GitHub](https://github.com/sanity-io/sanity-astro) - Package details, required dependencies
- [Tailwind CSS Astro Installation](https://tailwindcss.com/docs/installation/framework-guides/astro) - @tailwindcss/vite setup
- [Vercel Supported Node.js Versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) - Node 20, 22, 24 supported; default is 24
- [Sanity CORS Documentation](https://www.sanity.io/docs/cors) - CORS origin configuration
- [Sanity CLI init Reference](https://www.sanity.io/docs/cli-reference/init) - Project creation via CLI

### Secondary (MEDIUM confidence)
- [Sanity Studio 404 Fix](https://www.sanity.io/answers/resolving-issues-with-sanity-and-astro-js-integration-and-deployment--) - vercel.json rewrite solution verified by community
- [Sanity Studio Embedding 404](https://www.sanity.io/answers/issue-with-embedding-sanity-studio-into-an-astro-site--resolved-with-help-from-the-community-) - Must use @sanity/astro (not astro-sanity)
- [Biome Astro Setup](https://astro-tips.dev/tips/biome/) - Biome configuration for Astro projects
- [Vercel Astro Framework Guide](https://vercel.com/docs/frameworks/astro) - Auto-detection, build settings

### Tertiary (LOW confidence)
- Sanity env var handling in sanity.config.ts when embedded in Astro -- needs implementation-time validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified against official docs; versions confirmed current
- Architecture: HIGH - Patterns sourced from official plugins and documented community solutions
- Pitfalls: HIGH - Known issues documented in GitHub issues and Sanity community answers with verified solutions
- Validation: MEDIUM - Smoke tests are manual; no automated test framework needed for Phase 1

**Local environment findings:**
- Node.js 18.20.8 active in shell; Node 22.22.1 available via nvm (default set to 22)
- GitHub CLI authenticated as paulalbert1
- Vercel CLI not installed (use dashboard import or install globally)
- Sanity CLI not installed globally (use npx with Node 22)
- No existing repo at ~/Dropbox/GitHub/ matching "sprezzatura" or "lasprezz"

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (Astro 6 stable, stack is mature)

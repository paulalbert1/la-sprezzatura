# Phase 3: Client Operations Portal - Research

**Researched:** 2026-03-14
**Domain:** Astro SSR dynamic routing, Sanity schema extensions, PURL token security, responsive timeline UI
**Confidence:** HIGH

## Summary

Phase 3 adds a PURL-based client project portal to the existing Astro 6 + Sanity site. The technical surface is small: one new SSR page (`src/pages/portal/[token].astro`), three new fields on the existing Sanity `project` schema, one custom Sanity input component (for the portal URL display), and one new Astro component (milestone timeline). All infrastructure (Vercel adapter, Sanity integration, Tailwind v4, design tokens) is already in place from Phases 1 and 2.

The key technical decisions are straightforward. Astro's `export const prerender = false` on a `[token].astro` dynamic route gives us SSR per-request rendering on Vercel serverless functions. The Sanity `initialValue` property supports async functions, so we can auto-generate a cryptographic token on document creation. The `readOnly` schema property prevents Liz from accidentally editing the token. A custom input component using `useFormValue` can display the full portal URL for copy-pasting.

**Primary recommendation:** Build the portal as a single SSR Astro page with a self-contained milestone timeline component. Extend the existing `project.ts` schema with three fields (`portalToken`, `clientName`, `portalEnabled`) and one custom input component (`PortalUrlDisplay`). Use `crypto.randomBytes` from Node.js stdlib for token generation -- no new dependencies needed. Reuse the existing rate limiter pattern from `src/actions/index.ts`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **PURL Token Design:** 8-char alphanumeric token (`xK9mP2qR`), stored in Sanity, portal URL format `/portal/[token]`, auto-generated on project creation, rate limiting on portal route reusing contact form pattern
- **Portal Page Layout:** Match luxury aesthetic (warm neutrals, Cormorant Garamond headings, DM Sans body), NOT a dashboard -- branded client experience. Top-to-bottom: project name heading with branding, status badge, visual milestone timeline, stage description. Single-page experience, mobile-first.
- **Milestone Timeline Visualization:** Horizontal stepper on desktop, vertical on mobile. 6 stages (Discovery, Concept, Design Development, Procurement, Installation, Closeout). Current stage highlighted with terracotta accent. Completed = checkmark/filled, future = muted/outlined. No dates. Current stage gets 1-2 sentence description.
- **Status Badge:** Pill-shaped, shows current stage name, color-coded (terracotta for active, muted green for Closeout/complete). Pipeline stage IS the status -- no separate status field.
- **Sanity Studio UX:** Unhide existing `pipelineStage` field, add `portalToken` (read-only, auto-generated), `clientName` (string), `portalEnabled` (boolean, default false). Portal URL displayed as read-only field for copy-paste. Stage update = pick from dropdown, save, client sees immediately (SSR).
- **Rendering Approach:** SSR via `src/pages/portal/[token].astro` with `export const prerender = false`. Query Sanity per request: find project where `portalToken == token` AND `portalEnabled == true`. If no match: generic "Project not found" page (no information leakage). No caching.

### Claude's Discretion
- Exact token generation implementation (crypto.randomBytes or nanoid)
- Stepper/timeline component implementation details
- Exact responsive breakpoints for timeline flip
- Stage description copy (generic per stage or Liz-editable)
- Whether portalToken auto-generates on document creation or via a Sanity action button
- 404/invalid-token page design details
- Whether to add "Powered by La Sprezzatura" subtle footer branding

### Deferred Ideas (OUT OF SCOPE)
- Milestone email notifications (CLNT-04)
- File sharing in portal (CLNT-06)
- Selections display (CLNT-07) and approval workflow (CLNT-08)
- Post-project review automation (CLNT-09)
- Magic link authentication (GROW-03)
- Rich milestone data (dates, descriptions, deliverables per stage)
- QuickBooks integration (CLNT-05)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLNT-01 | Client project portal accessible via PURL (unique URL per project, no login required) | SSR dynamic route `[token].astro` with `prerender = false` on Vercel; token stored as `portalToken` field on project schema; rate limiting reuses existing pattern from `src/actions/index.ts` |
| CLNT-02 | Portal displays project name, status badge, current pipeline stage, and milestone timeline | Single SSR page layout; timeline component (horizontal desktop / vertical mobile); status badge pill component; stage descriptions as static map or Sanity-editable |
| CLNT-03 | Project pipeline schema in Sanity with stages: Discovery, Concept, Design Development, Procurement, Installation, Closeout | **Already exists** -- `pipelineStage` field in `src/sanity/schemas/project.ts` with all 6 stages defined, currently `hidden: true`. Unhide and extend with portal fields. |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^6.0.4 | SSR page rendering with `prerender = false` | Already in project, hybrid output mode supports SSR per-page |
| @astrojs/vercel | ^10.0.0 | Vercel serverless adapter for SSR routes | Already configured, handles SSR function deployment |
| @sanity/astro | ^3.3.1 | Sanity client integration (`sanity:client` virtual module) | Already in project, used by all portfolio queries |
| sanity | ^5.16.0 | Studio schema definitions, custom input components | Already in project, Studio at `/admin` |
| tailwindcss | ^4.2.1 | Styling with existing design tokens | Already in project with warm neutral palette |
| Node.js crypto | built-in | Token generation via `crypto.randomBytes` | Node.js stdlib, no dependency needed, works in Vercel serverless |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sanity/client | ^7.17.0 | Direct Sanity API queries from SSR page | Portal page Sanity query |
| react | ^19.2.4 | Custom Sanity Studio input components | Portal URL display component |
| @sanity/ui | (bundled with sanity) | Studio UI primitives (Stack, Text, TextInput, Card) | Custom input component styling |

### No New Dependencies Needed
| Instead of | Why Not | Use Instead |
|------------|---------|-------------|
| nanoid | Extra dependency; only need one function | `crypto.randomBytes` + base62 encoding (6 lines of code) |
| UUID | Too long for URLs (36 chars vs 8 chars) | Custom 8-char alphanumeric token |
| React stepper library | Over-engineering for 6 static steps | Pure CSS/HTML stepper with Tailwind classes |
| Authentication library | PURL = no login by design | Token lookup via Sanity query |

## Architecture Patterns

### New Files to Create
```
src/
  pages/
    portal/
      [token].astro          # SSR portal page (prerender = false)
  components/
    portal/
      MilestoneTimeline.astro # Responsive stepper (horizontal/vertical)
      StatusBadge.astro       # Pill-shaped stage badge
      PortalLayout.astro      # Stripped-down layout (no nav, minimal footer)
  sanity/
    components/
      PortalUrlDisplay.tsx    # Custom Sanity Studio input (React)
  lib/
    generateToken.ts          # Token generation utility
    portalStages.ts           # Stage metadata (labels, descriptions, order)
```

### Files to Modify
```
src/
  sanity/
    schemas/
      project.ts              # Add portalToken, clientName, portalEnabled fields; unhide pipelineStage
    queries.ts                 # Add getProjectByPortalToken() query
  astro.config.mjs             # Add /portal/* to sitemap filter exclusion
```

### Pattern 1: SSR Dynamic Route with Token Lookup
**What:** Astro SSR page that queries Sanity per-request using the URL token parameter
**When to use:** Portal page -- must always show current data, no static generation
**Example:**
```typescript
// src/pages/portal/[token].astro
---
export const prerender = false;

import { sanityClient } from "sanity:client";
import PortalLayout from "../../components/portal/PortalLayout.astro";
import MilestoneTimeline from "../../components/portal/MilestoneTimeline.astro";
import StatusBadge from "../../components/portal/StatusBadge.astro";
import { STAGE_META } from "../../lib/portalStages";

const { token } = Astro.params;

const project = await sanityClient.fetch(
  `*[_type == "project" && portalToken == $token && portalEnabled == true][0]{
    title, clientName, pipelineStage
  }`,
  { token }
);

if (!project) {
  Astro.response.status = 404;
  Astro.response.statusText = "Not found";
}

const currentStage = project?.pipelineStage ?? "discovery";
const stageMeta = STAGE_META[currentStage];
---
```
**Source:** [Astro On-Demand Rendering docs](https://docs.astro.build/en/guides/on-demand-rendering/)

### Pattern 2: Sanity Schema Extension with Auto-Generated Token
**What:** Extend existing project schema with portal fields, auto-generate token via `initialValue`
**When to use:** When adding new fields to an existing Sanity document type
**Example:**
```typescript
// Added to src/sanity/schemas/project.ts
import { generatePortalToken } from "../../lib/generateToken";

defineField({
  name: "portalToken",
  title: "Portal Token",
  type: "string",
  readOnly: true,
  initialValue: () => generatePortalToken(),
  components: {
    input: PortalUrlDisplay,  // Custom component showing full URL
  },
  group: "portal",
}),
defineField({
  name: "clientName",
  title: "Client Name",
  type: "string",
  description: "Client's name shown on their portal page",
  group: "portal",
}),
defineField({
  name: "portalEnabled",
  title: "Portal Enabled",
  type: "boolean",
  initialValue: false,
  description: "Toggle to activate this project's client portal link",
  group: "portal",
}),
```
**Source:** [Sanity Initial Value Templates docs](https://www.sanity.io/docs/studio/initial-value-templates), [Sanity readOnly field docs](https://www.sanity.io/docs/studio/conditional-fields)

### Pattern 3: Custom Sanity Input Component for Portal URL
**What:** React component that reads `portalToken` and displays the full portal URL with copy button
**When to use:** Displaying a derived/computed value in Sanity Studio that editors can copy
**Example:**
```tsx
// src/sanity/components/PortalUrlDisplay.tsx
import { useCallback } from "react";
import { Stack, Text, TextInput, Button, Flex } from "@sanity/ui";
import { useFormValue, type StringInputProps } from "sanity";

export function PortalUrlDisplay(props: StringInputProps) {
  const { value = "" } = props;
  const portalEnabled = useFormValue(["portalEnabled"]) as boolean | undefined;
  const siteUrl = "https://lasprezz.com"; // or read from env
  const fullUrl = value ? `${siteUrl}/portal/${value}` : "";

  const handleCopy = useCallback(() => {
    if (fullUrl) navigator.clipboard.writeText(fullUrl);
  }, [fullUrl]);

  if (!value) return <Text size={1} muted>Token will be generated when you create this project.</Text>;

  return (
    <Stack space={2}>
      <Flex gap={2} align="center">
        <TextInput value={fullUrl} readOnly style={{ flex: 1 }} />
        <Button text="Copy" tone="primary" onClick={handleCopy} />
      </Flex>
      {!portalEnabled && (
        <Text size={1} muted>Enable "Portal Enabled" toggle to activate this link.</Text>
      )}
    </Stack>
  );
}
```
**Source:** [Sanity Custom Input Components guide](https://www.sanity.io/guides/your-first-input-component-for-sanity-studio-v3), [useFormValue hook docs](https://www.sanity.io/docs/studio/studio-react-hooks)

### Pattern 4: Responsive Timeline Component
**What:** Pure CSS stepper that flips from horizontal (desktop) to vertical (mobile) using a Tailwind breakpoint
**When to use:** Milestone timeline display with fixed, known stages
**Example:**
```astro
<!-- src/components/portal/MilestoneTimeline.astro -->
---
import { STAGES, type StageKey } from "../../lib/portalStages";

interface Props {
  currentStage: StageKey;
}

const { currentStage } = Astro.props;
const currentIndex = STAGES.findIndex((s) => s.value === currentStage);
---

<div class="flex flex-col md:flex-row md:items-start gap-0 md:gap-4">
  {STAGES.map((stage, i) => {
    const status = i < currentIndex ? "completed" : i === currentIndex ? "current" : "future";
    return (
      <div class="flex md:flex-col items-center gap-3 md:gap-2 relative flex-1">
        {/* Connector line */}
        {i > 0 && (
          <div class={`
            absolute
            left-3 md:left-1/2 top-0 md:top-auto
            w-0.5 md:w-full h-full md:h-0.5
            -translate-y-full md:translate-y-0 md:-translate-x-full
            ${status === "future" ? "bg-stone-light/30" : "bg-terracotta/40"}
          `} />
        )}
        {/* Stage dot */}
        <div class={`
          w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0
          ${status === "completed" ? "bg-terracotta text-white" : ""}
          ${status === "current" ? "bg-terracotta text-white ring-4 ring-terracotta/20" : ""}
          ${status === "future" ? "bg-cream-dark border-2 border-stone-light/40" : ""}
        `}>
          {status === "completed" && <CheckIcon />}
        </div>
        {/* Stage label */}
        <span class={`
          text-xs md:text-center font-body tracking-wide
          ${status === "current" ? "text-charcoal font-medium" : "text-stone"}
        `}>
          {stage.title}
        </span>
      </div>
    );
  })}
</div>
```

### Pattern 5: Token Generation Without Dependencies
**What:** Generate cryptographically secure 8-char alphanumeric tokens using Node.js built-in `crypto`
**When to use:** PURL token generation for Sanity initialValue
**Example:**
```typescript
// src/lib/generateToken.ts
import { randomBytes } from "crypto";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generatePortalToken(length = 8): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((byte) => CHARSET[byte % CHARSET.length])
    .join("");
}
```
**Note:** `byte % 62` introduces a tiny bias (62 does not evenly divide 256), but for 8-char tokens used as PURLs (not cryptographic keys), this is entirely acceptable. The search space is still ~218 trillion combinations.
**Source:** [Node.js crypto.randomBytes docs](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback), [GitHub gist on base62 random strings](https://gist.github.com/aseemk/3095925)

### Pattern 6: Rate Limiting on Portal Route
**What:** Reuse the existing in-memory rate limiter pattern from `src/actions/index.ts` adapted for GET requests
**When to use:** Brute-force protection on the `/portal/[token]` route
**Implementation note:** The existing rate limiter is in-memory per serverless instance. For the portal, apply a higher threshold (e.g., 10 requests/minute/IP vs 3 for contact form) since legitimate clients may refresh. The rate limiter can be extracted into a shared utility in `src/lib/rateLimit.ts`.

### Anti-Patterns to Avoid
- **Don't use `getStaticPaths` for portal routes:** SSR routes with `prerender = false` must NOT use `getStaticPaths`. That pattern is for static pages only (like the existing `portfolio/[slug].astro`).
- **Don't cache portal responses:** Liz expects stage updates to appear immediately. No CDN caching, no ISR, no stale-while-revalidate.
- **Don't leak information on invalid tokens:** A "Project not found" page must be identical whether the token is close to valid, was once valid, or is random garbage. No "this project has been deactivated" messages.
- **Don't use the full BaseLayout for portal pages:** BaseLayout includes the site nav, mobile menu, footer, and scroll animations -- none of which belong on the portal. Create a minimal PortalLayout.
- **Don't make stage descriptions Liz-editable in v1:** Adding a rich text field per stage in Sanity increases schema complexity for marginal v1 value. Use a static TypeScript map of stage descriptions. V2 can make these editable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token generation | Custom PRNG or Math.random | `crypto.randomBytes` + charset mapping | Must be cryptographically secure; Math.random is predictable |
| URL-safe random strings | Manual base64 encoding + replacements | Direct charset mapping from random bytes | Base64 includes `/` and `+` which are URL-unsafe |
| Rate limiting | New rate limiter from scratch | Extract and reuse pattern from `src/actions/index.ts` | Existing pattern is tested in production, same serverless constraints |
| Copy-to-clipboard | Custom clipboard API wrapper | `navigator.clipboard.writeText()` | Modern browser API, no polyfill needed for target audience |
| Responsive stepper flip | JavaScript resize observer toggle | Tailwind responsive classes (`flex-col md:flex-row`) | CSS-only, no JS, works with SSR |

**Key insight:** This phase has zero new dependencies. Everything needed is either already installed or available in Node.js stdlib and browser APIs.

## Common Pitfalls

### Pitfall 1: Using getStaticPaths on SSR Route
**What goes wrong:** Build fails or generates wrong output because Astro tries to statically generate portal pages
**Why it happens:** Copying the pattern from `portfolio/[slug].astro` which uses `prerender = true` + `getStaticPaths`
**How to avoid:** Portal route MUST have `export const prerender = false` and MUST NOT export `getStaticPaths`. The `[token]` parameter is resolved at request time.
**Warning signs:** Build errors about missing static paths; all portal URLs returning the same content

### Pitfall 2: Token Collision with Project Slug
**What goes wrong:** A PURL token like `abc123` could theoretically match a project slug
**Why it happens:** Both `/portfolio/[slug]` and `/portal/[token]` use dynamic segments
**How to avoid:** Portal lives under `/portal/` path prefix, completely separate from `/portfolio/`. Different Sanity field (`portalToken` vs `slug`). No collision possible because routes are in different directories.
**Warning signs:** None -- this is a non-issue as designed, but document it to prevent future confusion.

### Pitfall 3: Sanity initialValue Not Firing for Existing Documents
**What goes wrong:** Existing portfolio projects (created in Phase 2) don't get `portalToken` values
**Why it happens:** `initialValue` only runs when creating NEW documents in Sanity Studio. Existing documents are not backfilled.
**How to avoid:** This is acceptable behavior. Liz creates portal tokens only for active client projects (not portfolio showcase projects). If needed, she can manually trigger token generation for existing projects via a Sanity document action. Alternatively, a one-time migration script can backfill tokens.
**Warning signs:** Existing projects showing empty `portalToken` field -- this is expected, not a bug.

### Pitfall 4: Astro 404 Status on Vercel
**What goes wrong:** Setting `Astro.response.status = 404` on an SSR page used to cause Vercel to return its default 404 page instead of rendering the custom content.
**Why it happens:** This was a core Astro bug (issue #14877), fixed in PR #14884.
**How to avoid:** Ensure Astro is updated to a version containing the fix (post-v5.16.0). The project uses `^6.0.4` which includes the fix. For extra safety, render the "not found" content in the page template conditionally rather than relying solely on status codes.
**Warning signs:** Portal showing Vercel's default 404 page instead of the branded "Project not found" page.

### Pitfall 5: Sanity Studio Custom Component Import Path
**What goes wrong:** Custom input component fails to load in Sanity Studio
**Why it happens:** Sanity Studio runs in the browser via React. Import paths for custom components must be relative and the component must be a valid React component (`.tsx` file, proper exports).
**How to avoid:** Place the custom component in `src/sanity/components/PortalUrlDisplay.tsx`. Import it in `project.ts` schema. Use named export. Test by visiting `/admin` locally.
**Warning signs:** Console errors in browser when opening project documents in Studio.

### Pitfall 6: Rate Limiter Scope in Serverless
**What goes wrong:** Rate limiting is per-instance, so different serverless invocations have separate rate limit maps
**Why it happens:** Vercel serverless functions are stateless between cold starts
**How to avoid:** This is a known limitation documented in STATE.md. For staging, in-memory is fine. The contact form already uses this pattern in production-equivalent. For Phase 3 v1, this is acceptable -- a determined attacker would need to guess an 8-char token from 218 trillion combinations.
**Warning signs:** None at staging scale. Monitor if moving to production at scale.

## Code Examples

Verified patterns from the existing codebase and official sources:

### Sanity GROQ Query for Portal Token Lookup
```groq
// Query: find project by portal token (only if portal is enabled)
*[_type == "project" && portalToken == $token && portalEnabled == true][0]{
  title,
  clientName,
  pipelineStage
}
```
This follows the same pattern as `getProjectBySlug` in `src/sanity/queries.ts` but filters on `portalToken` instead of `slug.current`.

### Stage Metadata Map
```typescript
// src/lib/portalStages.ts
export type StageKey = "discovery" | "concept" | "design-development" | "procurement" | "installation" | "closeout";

export interface StageMeta {
  value: StageKey;
  title: string;
  description: string;
}

export const STAGES: StageMeta[] = [
  {
    value: "discovery",
    title: "Discovery",
    description: "We're learning about your space, lifestyle, and vision. This is where the conversation begins.",
  },
  {
    value: "concept",
    title: "Concept",
    description: "We're developing the design direction -- mood boards, color palettes, and initial concepts for your review.",
  },
  {
    value: "design-development",
    title: "Design Development",
    description: "The design is taking shape. Floor plans, elevations, and detailed specifications are being refined.",
  },
  {
    value: "procurement",
    title: "Procurement",
    description: "Materials, furniture, and fixtures are being sourced and ordered. Lead times are being coordinated.",
  },
  {
    value: "installation",
    title: "Installation",
    description: "Your space is being transformed. Contractors, artisans, and our team are bringing the design to life.",
  },
  {
    value: "closeout",
    title: "Closeout",
    description: "The project is complete. Final styling, photography, and your walkthrough are being scheduled.",
  },
];

export const STAGE_META: Record<StageKey, StageMeta> = Object.fromEntries(
  STAGES.map((s) => [s.value, s])
) as Record<StageKey, StageMeta>;
```

### Sitemap Filter Update
```javascript
// In astro.config.mjs -- update the existing sitemap filter
sitemap({
  filter: (page) => !page.includes("/admin") && !page.includes("/portal"),
}),
```

### Portal Layout (Minimal, No Nav)
```astro
<!-- src/components/portal/PortalLayout.astro -->
---
import { Font } from "astro:assets";
import "../../styles/global.css";

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
    <meta name="robots" content="noindex, nofollow" />
    <Font cssVariable="--font-heading" preload />
    <Font cssVariable="--font-body" preload />
    <title>{title}</title>
  </head>
  <body class="bg-cream text-charcoal font-body min-h-screen flex flex-col">
    <slot />
    <footer class="mt-auto py-8 text-center">
      <p class="text-xs text-stone tracking-widest uppercase font-body">
        La Sprezzatura &bull; Interior Design
      </p>
      <p class="text-xs text-stone-light mt-2 font-body">
        <a href="mailto:liz@lasprezz.com" class="hover:text-terracotta transition-colors">liz@lasprezz.com</a>
      </p>
    </footer>
  </body>
</html>
```

### Sanity Field Group for Portal
```typescript
// Added to project schema defineType groups option
groups: [
  { name: "content", title: "Content", default: true },
  { name: "portal", title: "Client Portal" },
],
```
This separates portal fields from portfolio content in Sanity Studio, keeping Liz's editing experience clean.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro `output: "server"` for all SSR | `output: "hybrid"` (default) with per-page `prerender` | Astro 4+ (2024) | Portal page opts into SSR while portfolio stays static |
| Sanity v2 `withDocument` HOC | Sanity v3 `useFormValue` hook | Sanity v3 (2023) | Modern React hooks for custom input components |
| nanoid as default random ID | `crypto.randomBytes` in Node.js + custom charset | Always available | Zero-dependency approach, stdlib only |
| Astro 404 bug on Vercel SSR | Fixed in PR #14884 | Late 2025 | `Astro.response.status = 404` now works correctly on Vercel |

**Deprecated/outdated:**
- `sanity/desk` structure builder: replaced by `sanity/structure` in v3. Not needed for this phase (no custom desk structure changes).
- `Astro.response.status` 404 bug: Fixed. The project's Astro `^6.0.4` includes the fix.

## Open Questions

1. **Token generation timing: initialValue vs document action**
   - What we know: `initialValue` runs on document creation in Studio. It supports async functions. It does NOT run for existing documents.
   - What's unclear: Whether `initialValue` with `crypto.randomBytes` works correctly in the browser context (Sanity Studio runs client-side).
   - Recommendation: Use `initialValue` with a browser-compatible approach: `crypto.getRandomValues(new Uint8Array(8))` via Web Crypto API for browser, or provide a fallback. Alternatively, use `Math.random` for the Studio-generated token (acceptably random for a non-security-critical initial value that can be regenerated). The token is NOT a secret key -- it is an unguessable URL. **Recommended approach:** Use Web Crypto API (`globalThis.crypto.getRandomValues`) which works in both Node.js 20+ and browsers.

2. **Stage descriptions: static map vs Sanity-editable**
   - What we know: CONTEXT.md says "Claude's call on complexity"
   - What's unclear: Whether Liz will want to customize stage descriptions per project
   - Recommendation: Use a static TypeScript map for v1 (as shown in the code example above). All projects share the same 6-stage pipeline, and descriptions are generic. If Liz wants per-project customization, v2 can add an optional override field.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^3.2.4 (installed as devDependency) |
| Config file | none -- needs creation (Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLNT-01 | Token generation produces 8-char alphanumeric strings | unit | `npx vitest run src/lib/generateToken.test.ts -t "generates valid token"` | No -- Wave 0 |
| CLNT-01 | Token uniqueness (no collisions in 1000 generations) | unit | `npx vitest run src/lib/generateToken.test.ts -t "unique"` | No -- Wave 0 |
| CLNT-01 | Invalid token returns 404 page (no info leakage) | manual-only | Visit `/portal/INVALID` on staging | N/A |
| CLNT-02 | Stage metadata map has all 6 stages with descriptions | unit | `npx vitest run src/lib/portalStages.test.ts` | No -- Wave 0 |
| CLNT-02 | Status badge renders correct stage name | manual-only | Visit portal page on staging | N/A |
| CLNT-02 | Timeline highlights correct current stage | manual-only | Visit portal page on staging | N/A |
| CLNT-03 | Sanity schema has portalToken, clientName, portalEnabled fields | manual-only | Open project document in Sanity Studio `/admin` | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- minimal vitest configuration file (no special setup needed for pure utility tests)
- [ ] `src/lib/generateToken.test.ts` -- covers CLNT-01 (token generation, length, charset, uniqueness)
- [ ] `src/lib/portalStages.test.ts` -- covers CLNT-02 (stage metadata completeness, stage order matches schema)

## Sources

### Primary (HIGH confidence)
- [Astro On-Demand Rendering docs](https://docs.astro.build/en/guides/on-demand-rendering/) - SSR setup, prerender = false, 404 handling
- [Astro @astrojs/sitemap docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/) - sitemap filter for excluding portal routes
- [Sanity Initial Value Templates docs](https://www.sanity.io/docs/studio/initial-value-templates) - initialValue syntax, async support
- [Sanity Custom Input Components guide](https://www.sanity.io/guides/your-first-input-component-for-sanity-studio-v3) - custom input component pattern for v3
- [Sanity useFormValue hook docs](https://www.sanity.io/docs/studio/studio-react-hooks) - reading sibling field values in custom components
- [Sanity readOnly and conditional fields docs](https://www.sanity.io/docs/studio/conditional-fields) - readOnly property on fields
- Existing codebase: `src/sanity/schemas/project.ts` -- pipelineStage field with 6 stages already defined
- Existing codebase: `src/actions/index.ts` -- rate limiter pattern (in-memory Map, per-IP)
- Existing codebase: `src/pages/portfolio/[slug].astro` -- dynamic route pattern (static, for reference)

### Secondary (MEDIUM confidence)
- [Astro 404 SSR fix PR #14884](https://github.com/withastro/astro/issues/14877) - confirms 404 status code bug is fixed in current Astro
- [Vercel Edge compatibility with nanoid](https://github.com/ai/nanoid/discussions/443) - confirms crypto.randomBytes is the safer choice over nanoid for serverless
- [Node.js crypto.randomBytes docs](https://nodejs.org/api/crypto.html) - stdlib token generation
- [GitHub gist on base62 random strings](https://gist.github.com/aseemk/3095925) - charset mapping pattern

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and proven in Phases 1-2
- Architecture: HIGH -- SSR dynamic routes, Sanity schema extensions, and custom components are well-documented patterns with existing codebase precedent
- Pitfalls: HIGH -- 404 bug confirmed fixed; rate limiter limitations documented in STATE.md; initialValue behavior verified in official docs
- Token security: HIGH -- 8-char alphanumeric from crypto.randomBytes gives ~47 bits of entropy, more than sufficient for unguessable URLs

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable -- no fast-moving dependencies; all using existing stack)

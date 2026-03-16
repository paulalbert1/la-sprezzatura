# Stack Research: v2.0 Client Portal Platform

**Domain:** Client operations portal additions to existing luxury interior design website
**Researched:** 2026-03-15
**Confidence:** HIGH
**Scope:** NEW stack additions only -- existing Astro 6 + Sanity + Tailwind v4 + React 19 + Resend + GSAP stack validated in v1.0 research and production-deployed

## Existing Stack (DO NOT change)

Already in production, validated, working:

| Technology | Current Version | Role |
|------------|----------------|------|
| Astro | 6.x | Framework (SSR + static hybrid via Vercel adapter) |
| Sanity | 5.16+ (Studio 3.x) | CMS with embedded Studio at /admin |
| @sanity/client | 7.17.x | GROQ queries, currently read-only |
| @sanity/astro | 3.3.x | Astro integration, Content Layer |
| Tailwind CSS | 4.2.x | Styling via @tailwindcss/vite |
| React | 19.2.x | Interactive islands (Sanity Studio components, ContactForm) |
| Resend | 6.4.x | Transactional email (contact form notifications) |
| GSAP | 3.14.x | ScrollTrigger animations (fade-up, parallax, stagger) |
| TypeScript | 5.9.x | Type safety throughout |
| Biome | 2.4.x | Lint + format |
| Vitest | 3.2.x | Unit tests |

## New Stack Additions for v2.0

### 1. @react-email/components + @react-email/render -- Templated Email

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| @react-email/components | ^1.0.8 | Email UI primitives (Html, Head, Body, Container, Section, Text, Button, Hr, Img) | Build branded "Send Update" emails as React components instead of raw HTML template literals. The existing `actions/index.ts` has 160+ lines of inline HTML for two emails. v2.0 adds a third email type (client update) that will be even more complex (milestone table, procurement summary, budget snapshot). React components are composable and testable. |
| @react-email/render | ^2.0.4 | Convert React Email components to HTML strings server-side | The `render()` function produces the HTML string that Resend's `emails.send()` needs. Already async in v2.0 (`const html = await render(<UpdateEmail {...data} />)`). Works in Astro server actions without any additional configuration. |

**How it integrates:** Resend is already in the stack at v6.4.x. The `resend.emails.send({ html })` call stays the same -- the only change is how `html` is produced. Instead of template literals, you render a React component to a string. React is already in the project for Sanity Studio components, so no new framework dependency.

**Pattern:**
```typescript
// src/emails/ClientUpdateEmail.tsx -- React Email component
// src/actions/index.ts -- import, render(), pass to resend.emails.send()
```

### 2. @sanity/client Write Token -- Server-Side Mutations

| Change | Details | Why |
|--------|---------|-----|
| Add `SANITY_WRITE_TOKEN` env var | A Sanity API token with Editor or higher permissions, stored in `.env` (no `PUBLIC_` prefix) | Two v2.0 features require writing back to Sanity from Astro server actions: (1) "Send Update" needs to log email deliveries with timestamp/recipient, (2) Budget proposals may need version tracking. The existing `@sanity/client` (v7.17.x) already supports mutations -- no new package needed, just a write-capable token. |
| Create a separate write client instance | `createClient({ ...config, token: env.SANITY_WRITE_TOKEN, useCdn: false })` | The existing Sanity client from `sanity:client` is read-only (no token) and uses CDN. Write operations need a separate client instance with `useCdn: false` and the write token. This is the documented pattern from Sanity's official docs. Never expose the write token to the browser. |

**How it integrates:** No new npm package. The `@sanity/client` already in `package.json` supports `.create()`, `.createOrReplace()`, `.patch().set().commit()`, and `.mutate()`. The write client is used exclusively in Astro server actions (`src/actions/`) and never imported in client-side components.

**Security:** The write token goes in `.env` as `SANITY_WRITE_TOKEN` (no `PUBLIC_` prefix). Astro strips non-public env vars from client bundles automatically. The write client module should be in `src/lib/sanityWriteClient.ts` and imported only from server-side code paths.

### 3. Fantastical Openings -- Link-Only (No New Package)

| What | Details | Why |
|------|---------|-----|
| Remove `@calcom/embed-react` | Dead dependency -- Cal.com is no longer used | The contact page already links to Fantastical at `https://fantastical.app/design-b1eD/meet-with-elizabeth-olivier`. The `CalBooking.tsx` component is dead code. Removing `@calcom/embed-react` (and its transitive deps `@calcom/embed-core`, `@calcom/embed-snippet`) shrinks the bundle and removes an unused dependency. |
| Fantastical integration is link-only | External link to `fantastical.app/[username]/[template]`, optionally with query params | Fantastical Openings has NO embed widget, NO iframe, NO JavaScript SDK. It is a link to a hosted scheduling page on fantastical.app. URL parameters (`?name=...&email=...&phone=...&message=...`) can pre-fill the form. The contact page already does this correctly with an external link + CTA button. |

**What this means for v2.0:** The "Swap Cal.com for Fantastical Openings" task is already done in production. The v2.0 work is cleanup only: delete `CalBooking.tsx`, remove `@calcom/embed-react` from `package.json`. No new technology needed.

### 4. GSAP SplitText -- Hero Animation Enhancement (No New Package)

| What | Details | Why |
|------|---------|-----|
| GSAP SplitText plugin | Included free in GSAP 3.13+ (already installed at 3.14.x) | SplitText was rewritten in GSAP 3.13 with 14 new features and made free after Webflow's acquisition of GSAP. It splits text into characters/words/lines for individual animation. Perfect for a luxury hero text reveal (staggered character fade-in, word-by-word entrance). |
| GSAP ScrollSmoother | Included free in GSAP 3.13+ | Optional for the hero -- creates inertia-based smooth scrolling that pairs with ScrollTrigger parallax. Already free, already part of the GSAP package. Evaluate during implementation whether it adds enough value for the hero section without conflicting with Astro View Transitions. |

**How it integrates:** Import from the existing GSAP package: `import { SplitText } from "gsap/SplitText"` then `gsap.registerPlugin(SplitText)`. Add to the existing `ScrollAnimations.astro` component or create a dedicated `HeroAnimation.astro` component. No npm install needed.

**Pattern for hero text reveal:**
```typescript
import { SplitText } from "gsap/SplitText";
gsap.registerPlugin(SplitText);

const split = new SplitText(".hero-heading", { type: "chars,words" });
gsap.from(split.chars, {
  opacity: 0,
  y: 20,
  stagger: 0.03,
  duration: 0.6,
  ease: "power2.out",
});
```

## Sanity Schema Additions (No New Packages)

The v2.0 features require significant Sanity schema changes, but these use only existing Sanity field types. No new plugins or packages are needed.

### New Document Type: `client`

| Field | Type | Purpose |
|-------|------|---------|
| name | string | Client display name |
| email | string | Primary contact email |
| phone | string | Phone number |
| preferredContact | string (options) | Email / Phone / Text |
| address | object (street, city, state, zip) | Client address |
| notes | text | Internal notes (not shown on portal) |

**Key design decision:** Create `client` as a separate document type referenced from `project`, NOT as inline fields on the project document. The existing `clientName` field on the project schema is a plain string -- it needs to become a reference to a `client` document. This enables one client to have multiple projects and keeps contact data in one place.

### Extended `project` Schema Fields

| Field | Type | Purpose |
|-------|------|---------|
| client | reference (to `client`) | Replaces plain `clientName` string |
| milestones | array of objects | Custom milestones with `title`, `description`, `targetDate`, `completedDate`, `status` |
| procurementItems | array of objects | Line items: `item`, `vendor`, `status`, `designerCost`, `retailCost`, `notes` |
| budgetProposals | array of objects | Versioned proposals: `version`, `date`, `tiers` (array with `name`, `lineItems`) |
| updateLog | array of objects | Email log: `sentAt`, `recipientEmail`, `note`, `snapshotSummary` |

All of these use Sanity's built-in field types: `string`, `number`, `date`, `datetime`, `text`, `array`, `object`, `reference`. No custom input components beyond the existing `PortalUrlDisplay.tsx` are needed for v2.0.

### Sanity Structure Tool Updates

The Structure Tool configuration in `sanity.config.ts` needs a new "Clients" list item. This uses the existing `structureTool` plugin -- no new plugin needed.

## What NOT to Add

| Technology | Why Not | What to Do Instead |
|------------|---------|-------------------|
| Prisma / database | Sanity IS the database for this project. Adding a separate database for email logs, procurement, or budgets creates two sources of truth and doubles the infrastructure. Sanity handles structured data well and its free tier has 20GB storage -- more than enough for a small studio's operational data. | Store all structured data in Sanity document fields. |
| NextAuth / Auth.js / better-auth | v2.0 keeps PURL-based access (no login). Authentication is a v3+ concern only if client data becomes sensitive enough to warrant it. The current token-based approach is appropriate for interior design project status -- this is not financial or health data. | Continue with PURL tokens. Evaluate auth needs post-launch. |
| Nodemailer | Resend already handles email sending. Nodemailer would be redundant. | Use Resend SDK (already installed). |
| PDF generation libraries (puppeteer, jsPDF, pdfmake) | Budget proposals are displayed as interactive web pages on the portal, not downloaded as PDFs. PDF export is a "nice to have" that can be added later if clients request it. Adding Puppeteer to a serverless function is a heavy dependency (300MB+ Chrome binary). | Render proposals as styled HTML pages. Use browser print-to-PDF as fallback. |
| Zod (standalone) | Astro 6 includes Zod via `astro:schema` for action input validation. The existing `actions/index.ts` already uses this. No standalone Zod package needed. | Import from `astro:schema` as already done. |
| Chart libraries (Chart.js, Recharts) | Budget/procurement data is tabular, not graphical. A simple HTML table with styled cells showing savings calculations is more appropriate than interactive charts for 5-20 line items. | Use Tailwind-styled HTML tables. |
| QuickBooks integration | Deferred from v2.0. The v1.0 research recommended this for Phase 2, but PROJECT.md does not list it as a v2.0 target feature. Add only when invoicing integration is explicitly needed. | Manual invoicing workflow. Add in a future milestone if needed. |
| Lenis smooth scroll | The v1.0 research recommended this but it was never installed. The existing GSAP ScrollTrigger animations work well without it. ScrollSmoother (free in GSAP 3.13+) is the better option if smooth scrolling is desired, since it integrates natively with ScrollTrigger. Avoid adding a competing smooth scroll library. | Use GSAP ScrollSmoother if needed, or skip entirely. |

## Installation

```bash
# New packages for v2.0
npm install @react-email/components @react-email/render

# Remove dead dependency
npm uninstall @calcom/embed-react
```

That is it. Two new packages added, one removed. All other v2.0 capabilities use existing packages and Sanity's built-in features.

## Environment Variables to Add

```bash
# .env (server-side only, never PUBLIC_)
SANITY_WRITE_TOKEN=sk...  # Create in Sanity project settings > API > Tokens > Add token (Editor role)
```

No other new env vars needed. `RESEND_API_KEY` and `CONTACT_NOTIFY_EMAIL` are already configured from v1.0.

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| @react-email/components for email templates | MJML (email markup language) | MJML requires a separate compiler step and has its own syntax. React Email uses the same React already in the project and renders server-side via `render()`. Single mental model. |
| @react-email/components for email templates | Keep raw HTML template literals | The existing contact form emails are 160+ lines of inline HTML each. The v2.0 "Send Update" email includes dynamic tables (milestones, procurement items) that would be unmaintainable as template literals. React components are composable and testable. |
| Sanity write-back via @sanity/client mutations | Separate API/webhook service | Over-engineered. The write operations are simple (append to array, create document) and happen in Astro server actions that already run server-side on Vercel. No need for a separate service. |
| Sanity for email log storage | Separate logging service (LogDNA, Datadog) | The email log is 5-10 entries per project over months. This is not high-volume logging. A simple array of objects on the Sanity project document is sufficient, queryable via GROQ, and visible in Studio. |
| Link to Fantastical Openings | Build custom booking UI | Fantastical manages availability from Liz's actual calendar. Building a custom booking UI would require duplicating availability logic. The link-based approach is zero maintenance. |
| GSAP SplitText for hero text | CSS `@starting-style` + `transition` | CSS-only text animations cannot split by character/word and animate individually. SplitText provides character-level control essential for a luxury staggered reveal effect. |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @react-email/components 1.0.x | React 19.2.x, Tailwind 4.x | React Email 5.0 explicitly added React 19.2 and Tailwind 4 support |
| @react-email/render 2.0.x | React 19.2.x | Render function is async (`await render(<Component />)`). Replaced old `renderAsync` in v2.0. |
| @sanity/client 7.17.x | Sanity API v2025-02-19+ | Write mutations use same client, just needs token + `useCdn: false` |
| GSAP 3.14.x (SplitText) | Astro View Transitions | GSAP works with View Transitions when cleanup is done on `astro:before-swap` (already implemented in ScrollAnimations.astro) |

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/emails/ClientUpdateEmail.tsx` | React Email template for "Send Update" feature |
| `src/emails/components/EmailLayout.tsx` | Shared email layout (header, footer, brand colors) |
| `src/lib/sanityWriteClient.ts` | Sanity client instance with write token for server-side mutations |
| `src/sanity/schemas/client.ts` | New `client` document type schema |

### Modified Files

| File | Change |
|------|--------|
| `src/sanity/schemas/project.ts` | Add `client` reference, `milestones`, `procurementItems`, `budgetProposals`, `updateLog` fields |
| `src/sanity/schemas/index.ts` | Register `client` schema type |
| `src/sanity/queries.ts` | Add queries for client data, portal with milestones/procurement/budget |
| `sanity.config.ts` | Add "Clients" to Structure Tool navigation |
| `src/actions/index.ts` | Add `sendUpdate` action; refactor `submitContact` to use React Email templates |
| `src/components/animations/ScrollAnimations.astro` | Add SplitText hero animation (or create separate `HeroAnimation.astro`) |
| `package.json` | Add @react-email/components, @react-email/render; remove @calcom/embed-react |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/contact/CalBooking.tsx` | Dead code -- Cal.com no longer used |

## Cost Impact

**No additional monthly costs.** All v2.0 additions use free tools:
- @react-email/components: open source, free
- @react-email/render: open source, free
- Sanity write token: included in free tier
- GSAP SplitText: free after Webflow acquisition
- Resend: already on free tier (3,000 emails/month -- more than enough for occasional client updates)

The monthly cost stays at the v1.0 level (Vercel Pro $20 + Microsoft 365 $6 + QuickBooks $30 = ~$56/mo). Cal.com ($12/mo) is no longer needed since Fantastical Openings is free.

## Sources

- [React Email 5.0 Release](https://resend.com/blog/react-email-5) -- Tailwind 4, React 19.2 support, new components (HIGH confidence)
- [@react-email/render npm](https://www.npmjs.com/package/@react-email/render) -- v2.0.4, async render function (HIGH confidence)
- [@react-email/components npm](https://www.npmjs.com/package/@react-email/components) -- v1.0.8 (HIGH confidence)
- [Sanity Mutation API](https://www.sanity.io/docs/http-reference/mutation) -- create, createOrReplace, patch, delete operations (HIGH confidence)
- [Sanity @sanity/client Getting Started](https://www.sanity.io/docs/apis-and-sdks/js-client-getting-started) -- client configuration with write token (HIGH confidence)
- [Sanity Advanced Client Patterns](https://www.sanity.io/docs/apis-and-sdks/js-client-advanced) -- patch operations, array mutations (HIGH confidence)
- [Fantastical Openings Help](https://flexibits.com/fantastical/help/openings) -- link-only integration, URL parameters (name, email, phone, message) (HIGH confidence)
- [Fantastical Account Openings Help](https://flexibits.com/account/help/openings) -- custom link names, visibility settings (HIGH confidence)
- [GSAP 3.13 Release / SplitText Rewrite](https://gsap.com/blog/3-13/) -- SplitText now free, 14 new features (HIGH confidence)
- [GSAP Free After Webflow Acquisition](https://webflow.com/blog/gsap-becomes-free) -- all plugins including SplitText, ScrollSmoother, MorphSVG free for commercial use (HIGH confidence)
- [Resend + React Email Integration](https://react.email/docs/integrations/resend) -- native integration pattern (HIGH confidence)
- [Sanity Schema Types](https://www.sanity.io/docs/studio/schema-types) -- document, object, reference, array field types (HIGH confidence)
- [Sanity Reference Type](https://www.sanity.io/docs/studio/reference-type) -- inter-document references (HIGH confidence)

---
*Stack research for: v2.0 Client Portal Platform additions*
*Researched: 2026-03-15*

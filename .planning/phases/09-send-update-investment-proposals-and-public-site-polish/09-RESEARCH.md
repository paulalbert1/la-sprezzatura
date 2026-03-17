# Phase 9: Send Update, Investment Proposals, and Public Site Polish - Research

**Researched:** 2026-03-17
**Domain:** Sanity document actions, branded HTML email, GSAP SplitText animation, Astro portal forms
**Confidence:** HIGH

## Summary

Phase 9 covers four distinct feature areas: (1) a "Send Update" document action in Sanity Studio that emails a rich project snapshot to clients, (2) investment proposal tiers on proposal artifacts with client-side tier selection and readiness check, (3) hero slideshow with GSAP SplitText character-level animation, and (4) Cal.com cleanup. All four areas have strong existing patterns in the codebase to follow.

The Send Update feature follows the established document action -> API route -> Resend pattern used by NotifyClient, SendWorkOrderAccess, and SendBuildingAccess. The investment proposal extends the existing artifact schema and portal display. GSAP SplitText is already bundled in the installed gsap@3.14.2 package -- no additional dependency needed. The Cal.com cleanup is a simple file deletion and package.json update.

**Primary recommendation:** Implement in three waves -- (1) Schema + Send Update email pipeline, (2) Investment proposals (schema extension + portal display + tier selection form), (3) Hero slideshow + SplitText animation + Cal.com cleanup.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Document action button on project in Sanity Studio ("Send Update"), alongside existing Notify Client, Complete Project, etc.
- Opens a dialog with: pre-filled greeting ("Hi [Client Name], here's the latest on [Project Name]"), section toggles (Milestones, Procurement, Artifacts -- all default ON), engagement type gating on toggles, live preview, soft frequency warning (24h), confirm/send button
- Rich email layout with actual data -- personal note, milestones (full list with name/date/completion), procurement (full item table with name/status/install date), artifacts (pending reviews), "View in Portal" CTA button
- Branded HTML email template consistent with existing artifact notification emails (cream #FAF8F5, terracotta #C4836A CTA, La Sprezzatura header)
- Client cost NEVER displayed in email (same rule as portal -- only MSRP and savings)
- Inline `updateLog[]` array on project document with sentAt, recipientEmails, note, sections included -- visible under new "Updates" field group
- Extends existing "proposal" artifact type with Investment Summary section
- Dynamic tier count -- Liz can create any number of tiers (not fixed at 3)
- Custom tier names -- Liz names each one
- Each tier has: custom name, optional description, line items (name + price in integer cents)
- Proposal artifact supports BOTH file upload AND Sanity-managed Investment Summary tiers
- ARTF-06 simplified: client selects ONE tier as whole package -- no item-level mixing
- Side-by-side tier cards: horizontal on desktop, stacked on mobile, with name/description/items/total
- Readiness check inline after tier selection: eagerness scale 1-5 with descriptive labels, "Any reservations?" text field
- Selection final from client side once confirmed; Liz can reset from Studio
- All selections, eagerness, reservations recorded in decision log with timestamps
- Full hero slideshow spec from `docs/superpowers/specs/2026-03-16-hero-slideshow-design.md` -- crossfade slideshow with Ken Burns zoom, Sanity CMS `heroSlideshow` array on siteSettings
- SplitText character-level reveal on "La Sprezzatura" title: staggered opacity + slight upward movement, plays once on page load, ~0.8s total, does not replay on slide transitions
- `prefers-reduced-motion: reduce` disables Ken Burns and SplitText
- Fantastical booking cleanup: delete CalBooking.tsx, remove @calcom/embed-react, remove Cal.com references from privacy/other pages

### Claude's Discretion
- Send Update email exact HTML layout and styling (within branded template direction)
- Tier card component design details (spacing, shadows, hover states)
- Readiness check form exact styling
- SplitText animation timing and easing (within ~0.8s total)
- How to handle proposals with 4+ tiers on mobile (scroll, paginate, or stack)
- Loading states and error handling for Send Update and proposal selection
- Whether to show tier comparison highlights (e.g., "Most popular" or "Best value" badges)

### Deferred Ideas (OUT OF SCOPE)
- Change tracking for "highlights only" Send Update mode
- Per-item tier mixing (ARTF-06 original) -- Liz explicitly decided against this
- Line item price visibility toggle per proposal
- "Most popular" or "Best value" tier badges
- Slideshow navigation controls (arrows, dots)
- Video slides in hero
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEND-01 | Liz can trigger "Send Update" from Sanity Studio via document action on project | Document action pattern verified: NotifyClientAction, SendWorkOrderAccessAction, SendBuildingAccessAction all follow same pattern. Register in sanity.config.ts document.actions for "project" schema type. |
| SEND-02 | Email includes current milestones, procurement status, pending artifact reviews, and optional personal note | Branded HTML email pattern verified in notify-artifact.ts. GROQ query pattern in PROJECT_DETAIL_QUERY provides all needed data. Engagement type gating via GROQ select() for procurement. |
| SEND-03 | Every sent update logged with timestamp and recipient on project | Inline array logging pattern verified: notificationLog on artifacts, submissionNotes on contractors. Add updateLog[] to project schema with "Updates" field group. |
| ARTF-05 | Proposal artifacts include Investment Summary with designer-defined pricing tiers and line items | Extend existing artifact array member in project.ts: add investmentSummary object with tiers[] array. Each tier: name, description, lineItems[] (name + price in cents). |
| ARTF-06 | Client selects preferred investment tier (simplified: whole tier, no mixing) | New React form component (TierSelectionForm.tsx) following ArtifactApprovalForm pattern. Astro Action for selectTier. Decision log entry records tier selection. |
| ARTF-07 | Proposal approval includes readiness check -- eagerness rating (1-5) and reservations capture | Extend tier selection form to include eagerness slider and reservations textarea before confirmation. Both values stored in decision log entry. |
| BOOK-01 | Contact page links to Fantastical Openings for booking, replacing Cal.com | Contact page already uses Fantastical link. Cleanup only: delete CalBooking.tsx, remove @calcom/embed-react from package.json. No Cal.com references found in privacy.astro or elsewhere. |
| SITE-08 | Home page hero has enhanced visual impact with GSAP SplitText animation | GSAP SplitText 3.14.2 already bundled in installed gsap package. Full spec in hero slideshow design doc. Hero.astro replacement with slideshow + SplitText inline script. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gsap | 3.14.2 | SplitText animation + slideshow Ken Burns | Already installed, SplitText bundled as premium plugin (gsap/SplitText) |
| resend | 6.4.2 (installed) / 6.9.4 (latest) | Email delivery for Send Update | Already used for all email sends in the project |
| sanity | 5.16.0 | Document actions, schema, Studio UI | Already installed, document action pattern well-established |
| @sanity/client | 7.17.0 | GROQ queries, write operations | Already used for all Sanity data operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | (via astro:schema) | Form validation for tier selection + readiness check | Used for all portal form schemas in portalSchemas.ts |
| react | 19.2.4 | Interactive tier selection form, Send Update dialog | Already used for all interactive portal forms |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline HTML email strings | React Email / MJML | Overkill -- project has established inline HTML pattern with 5+ templates; consistency wins |
| SplitText | Manual character splitting | Fragile -- SplitText handles word boundaries, whitespace, RTL, accessibility automatically |

**Installation:**
```bash
# No new dependencies needed -- all packages already installed
# Only removal needed:
npm uninstall @calcom/embed-react
```

**Version verification:** gsap 3.14.2 is current on npm (verified 2026-03-17). resend 6.4.2 installed vs 6.9.4 latest -- minor version bump not required for this phase.

## Architecture Patterns

### Recommended Project Structure (Changes Only)
```
src/
├── sanity/
│   ├── actions/
│   │   └── sendUpdate.tsx          # NEW: Send Update document action
│   └── schemas/
│       ├── project.ts              # MODIFY: add updateLog[], investment summary fields
│       └── siteSettings.ts         # MODIFY: add heroSlideshow[] array
├── pages/
│   └── api/
│       └── send-update.ts          # NEW: API route for Send Update email
├── actions/
│   ├── index.ts                    # MODIFY: add selectTier action
│   └── portalSchemas.ts            # MODIFY: add selectTierSchema
├── components/
│   ├── portal/
│   │   ├── TierSelectionForm.tsx    # NEW: Tier selection + readiness check form
│   │   ├── InvestmentSummary.astro  # NEW: Tier card display layout
│   │   └── ArtifactCard.astro      # MODIFY: render investment summary for proposals
│   ├── home/
│   │   └── Hero.astro              # REWRITE: slideshow + SplitText per spec
│   └── contact/
│       └── CalBooking.tsx           # DELETE
├── lib/
│   └── artifactUtils.ts            # MODIFY: extend Artifact type for investment fields
└── sanity/
    └── queries.ts                  # MODIFY: add heroSlideshow to getSiteSettings, project snapshot query
```

### Pattern 1: Document Action -> API Route -> Email -> Log
**What:** Sanity Studio document action opens dialog, user configures and confirms, dialog calls an API route via fetch(), API route fetches project data via GROQ, builds branded HTML email, sends via Resend, logs the send on the project document.
**When to use:** Any Studio-triggered email notification.
**Example:**
```typescript
// Source: src/sanity/actions/notifyClient.tsx (existing pattern)
// SendUpdateAction follows this exact same structure:
export function SendUpdateAction(props: DocumentActionProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const doc = props.draft || props.published;

  if (props.type !== "project") return null;

  return {
    label: "Send Update",
    tone: "primary" as const,
    onHandle: () => setDialogOpen(true),
    dialog: isDialogOpen ? {
      type: "dialog" as const,
      onClose: () => setDialogOpen(false),
      header: "Send Project Update",
      content: (
        // Dialog with: note textarea, section toggles, preview, send button
        // On send: fetch("/api/send-update", { method: "POST", body: ... })
      ),
    } : undefined,
  };
}
```

### Pattern 2: Inline Array Log on Document
**What:** Array field on a Sanity document stores timestamped log entries, inserted via sanityWriteClient.patch().insert().
**When to use:** Audit trails, notification logs, decision logs.
**Example:**
```typescript
// Source: src/pages/api/notify-artifact.ts (existing pattern)
await sanityWriteClient
  .patch(projectId)
  .insert("after", "updateLog[-1]", [{
    _key: generatePortalToken(8),
    sentAt: new Date().toISOString(),
    recipientEmails: recipientEmails,
    note: personalNote,
    sectionsIncluded: ["milestones", "procurement", "artifacts"],
  }])
  .commit({ autoGenerateArrayKeys: true });
```

### Pattern 3: Astro Action for Portal Form Submission
**What:** React form component uses `actions.actionName(formData)` from astro:actions. Zod schema validates input. Handler authenticates via context.locals, writes to Sanity.
**When to use:** All authenticated portal form submissions.
**Example:**
```typescript
// Source: src/actions/portalSchemas.ts + src/actions/index.ts
export const selectTierSchema = z.object({
  projectId: z.string().min(1),
  artifactKey: z.string().min(1),
  tierKey: z.string().min(1),
  eagerness: z.coerce.number().int().min(1).max(5),
  reservations: z.string().optional(),
});
```

### Pattern 4: GSAP Animation with Astro View Transition Lifecycle
**What:** Initialize animations on `astro:page-load`, clean up on `astro:before-swap`. Prevents memory leaks and stale animations during view transitions.
**When to use:** Any GSAP animation in the project.
**Example:**
```typescript
// Source: src/components/animations/ScrollAnimations.astro
document.addEventListener("astro:page-load", () => {
  initAnimations();
});
document.addEventListener("astro:before-swap", () => {
  cleanupAnimations();
});
```

### Anti-Patterns to Avoid
- **Exposing clientCost in email or portal:** Client cost is NEVER sent to frontend. Only MSRP (retailPrice) and savings (computed server-side in GROQ as `retailPrice - clientCost`). The Send Update email must follow this same rule.
- **Hardcoding tier count to 3:** Tiers must be dynamic -- schema uses an array, not three fixed fields.
- **Using Astro Actions from Sanity Studio:** Sanity Studio runs in browser context and cannot call Astro Actions (virtual module). Use API routes (fetch to /api/) instead, matching the notifyClient pattern.
- **Creating SplitText animation that replays on slide transitions:** The SplitText animation fires once on page load. Subsequent slide transitions do not re-trigger it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Character-level text splitting | Manual DOM manipulation to split characters | `gsap/SplitText` (already bundled) | Handles word boundaries, whitespace preservation, emoji safety, accessibility (aria-label) automatically |
| Email HTML responsive layouts | Custom responsive email CSS | Table-based inline-style HTML (existing pattern) | Email clients (Outlook, Gmail, Apple Mail) have wildly inconsistent CSS support; table layout with inline styles is the only reliable approach |
| Currency formatting | String concatenation with $ | `formatCurrency()` from `src/lib/formatCurrency.ts` | Already handles integer cents -> "$X,XXX.XX" with Intl.NumberFormat |
| Cryptographic token generation | Math.random() keys | `generatePortalToken()` from `src/lib/generateToken.ts` | Uses Web Crypto API, works in browser (Sanity Studio) and Node (server) |

**Key insight:** Every feature in Phase 9 has a direct analog or pattern already in the codebase. The risk is not unknown technology -- it is inconsistency with established patterns.

## Common Pitfalls

### Pitfall 1: Send Update Dialog State Management Complexity
**What goes wrong:** The Send Update dialog has more state than existing document action dialogs (note text, 3 toggle states, loading state, preview content, frequency warning). State can get tangled.
**Why it happens:** Existing document actions (NotifyClient, SendWorkOrderAccess) have minimal UI -- one dropdown or one confirmation. Send Update has toggles, a textarea, and a live preview.
**How to avoid:** Keep all dialog state in a single `useState` object or `useReducer`. The preview can be derived from state rather than stored separately.
**Warning signs:** Props drilling through multiple sub-components within the dialog, or the preview getting out of sync with toggle states.

### Pitfall 2: Email HTML Rendering Differences
**What goes wrong:** Email looks correct in browser preview but breaks in Outlook, Gmail web, or Apple Mail. Missing images, broken tables, wrong fonts.
**Why it happens:** Email clients strip `<style>` blocks, ignore many CSS properties, and have unique rendering engines. Outlook uses Word's HTML engine.
**How to avoid:** Follow the existing email template pattern exactly: table-based layout, all styles inline, system-ui font stack (not custom fonts), no CSS classes, no flexbox/grid, no `<div>` for layout. Test with Resend's preview feature if available.
**Warning signs:** Using `className`, `<div>` layout, CSS custom properties, or external stylesheets in email HTML.

### Pitfall 3: GROQ Query for Send Update Must Respect Engagement Type Gating
**What goes wrong:** Send Update email includes procurement data for Styling & Refreshing or Carpet Curating projects, which should not have procurement.
**Why it happens:** The API route query fetches all project data without the conditional projection used in the portal query.
**How to avoid:** Use the same `select(engagementType == "full-interior-design" => { ... })` pattern from PROJECT_DETAIL_QUERY. Also, the dialog should hide the Procurement toggle for non-full-interior-design projects.
**Warning signs:** Procurement section appearing in emails for styling/refreshing projects.

### Pitfall 4: Nested Array Schema Depth for Investment Summary
**What goes wrong:** Sanity Studio UX becomes confusing with project > artifacts[] > investmentSummary > tiers[] > lineItems[] (3 levels of nesting).
**Why it happens:** The data model is inherently nested. Sanity's default array editing UI can be cumbersome at depth 3.
**How to avoid:** Use meaningful preview configurations at each level so the collapsed view is useful. Add descriptions to fields. Consider custom input components if the default UX is too awkward -- but start with defaults and evaluate.
**Warning signs:** Liz struggling to add/edit tiers in Studio during testing.

### Pitfall 5: SplitText Must Be Registered with GSAP Before Use
**What goes wrong:** SplitText throws "SplitText is not registered" error, or characters don't animate.
**Why it happens:** SplitText is a GSAP plugin and must be registered via `gsap.registerPlugin(SplitText)` before use, just like ScrollTrigger.
**How to avoid:** Register SplitText in the Hero's inline script, similar to how ScrollTrigger is registered in ScrollAnimations.astro. Import from `gsap/SplitText`.
**Warning signs:** Console errors about unregistered plugin, or text appearing but not animating.

### Pitfall 6: SplitText Animation and View Transitions
**What goes wrong:** SplitText wraps each character in a `<div>`, but when view transitions fire, the original HTML is restored, leaving split markup in a broken state.
**Why it happens:** Astro view transitions swap page content. If the animation is mid-flight during a swap, the cleanup may not run properly.
**How to avoid:** Always call `splitInstance.revert()` in the `astro:before-swap` cleanup handler to restore the original DOM before the swap occurs. Initialize fresh on each `astro:page-load`.
**Warning signs:** Garbled text after navigating away and back to the home page.

### Pitfall 7: Tier Selection Must Be Final (Like Artifact Approvals)
**What goes wrong:** Client can change their tier selection multiple times, creating confusion about which tier is actually selected.
**Why it happens:** Not implementing the "selection is final" pattern from CONTEXT.md.
**How to avoid:** Follow the artifact approval pattern: once confirmed, the form disappears and shows "Tier X selected" status. Store the selected tier key on the artifact (like `currentVersionKey`). Liz can reset from Sanity Studio by clearing the field.
**Warning signs:** No confirmation step before tier selection, or the form remaining editable after selection.

## Code Examples

### Send Update API Route -- GROQ Snapshot Query
```typescript
// Pattern from: src/pages/api/notify-artifact.ts + src/sanity/queries.ts
// The Send Update API route needs a rich snapshot of the project
const SEND_UPDATE_PROJECT_QUERY = `
  *[_type == "project" && _id == $projectId][0] {
    title,
    engagementType,
    clients[] { client-> { _id, name, email } },
    milestones[] | order(date asc) {
      name, date, completed
    },
    select(engagementType == "full-interior-design" => {
      "procurementItems": procurementItems[] {
        name, status, installDate, retailPrice,
        "savings": retailPrice - clientCost
      }
    }),
    artifacts[] {
      _key, artifactType, customTypeName,
      currentVersionKey,
      "hasApproval": count(decisionLog[action == "approved"]) > 0
    }
  }
`;
```

### Investment Summary Schema Extension (on artifact)
```typescript
// Pattern from: src/sanity/schemas/project.ts artifacts[] array member
// Add these fields to the artifact object type, conditional on artifactType === "proposal"
defineField({
  name: "investmentSummary",
  title: "Investment Summary",
  type: "object",
  hidden: ({ parent }) => parent?.artifactType !== "proposal",
  fields: [
    defineField({
      name: "tiers",
      title: "Tiers",
      type: "array",
      of: [defineArrayMember({
        type: "object",
        fields: [
          defineField({ name: "name", title: "Tier Name", type: "string", validation: (r) => r.required() }),
          defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
          defineField({
            name: "lineItems",
            title: "Line Items",
            type: "array",
            of: [defineArrayMember({
              type: "object",
              fields: [
                defineField({ name: "name", title: "Item", type: "string", validation: (r) => r.required() }),
                defineField({ name: "price", title: "Price (cents)", type: "number", validation: (r) => r.integer().min(0) }),
              ],
              preview: {
                select: { title: "name", subtitle: "price" },
                prepare: ({ title, subtitle }) => ({
                  title: title || "Untitled item",
                  subtitle: subtitle ? `$${(subtitle / 100).toFixed(2)}` : "$0.00",
                }),
              },
            })],
          }),
        ],
        preview: {
          select: { title: "name", items: "lineItems" },
          prepare: ({ title, items }) => ({
            title: title || "Untitled tier",
            subtitle: `${items?.length || 0} items`,
          }),
        },
      })],
    }),
    defineField({
      name: "selectedTierKey",
      title: "Selected Tier",
      type: "string",
      readOnly: true,
      description: "Set when client selects a tier. Clear to allow re-selection.",
    }),
    defineField({
      name: "eagerness",
      title: "Eagerness Rating",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "reservations",
      title: "Reservations",
      type: "text",
      readOnly: true,
    }),
  ],
}),
```

### SplitText Animation in Hero
```typescript
// Source: gsap/SplitText documentation + project astro:page-load pattern
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
gsap.registerPlugin(SplitText);

let splitInstance: SplitText | null = null;

document.addEventListener("astro:page-load", () => {
  const titleEl = document.querySelector(".hero-title");
  if (!titleEl) return;

  // Respect reduced motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  splitInstance = new SplitText(titleEl, { type: "chars" });
  gsap.fromTo(splitInstance.chars, {
    opacity: 0,
    y: 12,
  }, {
    opacity: 1,
    y: 0,
    duration: 0.06,
    stagger: 0.03,
    ease: "power2.out",
    // Total: ~0.06 + (chars.length * 0.03) ~= 0.8s for "La Sprezzatura" (14 chars)
  });
});

document.addEventListener("astro:before-swap", () => {
  if (splitInstance) {
    splitInstance.revert();
    splitInstance = null;
  }
});
```

### Branded Email HTML Template (Send Update)
```html
<!-- Pattern from: src/pages/api/notify-artifact.ts -->
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="padding:32px 32px 24px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#8A8478;text-transform:uppercase;letter-spacing:0.2em;">La Sprezzatura</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#FFFFFF;padding:40px 32px;">
        <!-- Personal note from Liz -->
        <p style="margin:0 0 24px;font-size:16px;color:#2C2926;line-height:1.7;">
          ${personalNote}
        </p>

        <!-- Milestones section (if toggled on) -->
        <h2 style="margin:24px 0 12px;font-size:14px;color:#8A8478;text-transform:uppercase;letter-spacing:0.1em;">
          Milestones
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          <!-- milestone rows with checkmark/pending indicators -->
        </table>

        <!-- Procurement section (if toggled on AND full-interior-design) -->
        <!-- Item table with name, status badge, install date -->

        <!-- Artifacts section (if toggled on) -->
        <!-- Pending artifact reviews listed -->

        <!-- CTA Button -->
        <div style="text-align:center;margin:32px 0;">
          <a href="${baseUrl}/portal/dashboard"
             style="display:inline-block;background-color:#C4836A;color:#FFFFFF;text-decoration:none;padding:16px 32px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">
            View in Your Portal
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#B8B0A4;line-height:1.6;">
          This is a project update from La Sprezzatura.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cal.com embed for booking | Fantastical Openings link | Already done -- contact page uses Fantastical | Phase 9 just removes dead code |
| Single hero image | Crossfade slideshow with Ken Burns | Phase 9 | New hero component replaces static one |
| GSAP ScrollTrigger only | GSAP ScrollTrigger + SplitText | Phase 9 | SplitText already bundled in gsap@3.14.2 |
| Proposal artifact = file only | Proposal = file + Investment Summary tiers | Phase 9 | Extends existing artifact schema |

**Deprecated/outdated:**
- `@calcom/embed-react@1.5.3`: Dead dependency -- CalBooking.tsx is never imported. Remove in this phase.
- `data-animate="parallax"` on hero: Removed per slideshow spec -- slideshow handles visual interest, parallax is unnecessary.

## Open Questions

1. **Send Update email preview in dialog -- how rich?**
   - What we know: CONTEXT.md says "live preview of the email content that updates as Liz toggles sections and edits the note"
   - What's unclear: Whether to render full HTML email preview (complex, heavy) or a simplified representation of sections
   - Recommendation: Render a simplified preview showing section headings and data summaries (not full HTML email rendering). Full HTML preview in a Sanity dialog adds significant complexity for marginal benefit. The actual email will use the branded template -- the preview just needs to show which sections are included and what data they contain.

2. **Investment Summary field placement in Studio**
   - What we know: Extends the existing artifact inline array member with investmentSummary object
   - What's unclear: Whether 3 levels of nesting (artifact > tiers > lineItems) will be comfortable for Liz in Studio
   - Recommendation: Start with standard Sanity array UI. Add preview configurations at each level for readability. If Liz finds it awkward during Phase 10 testing, consider a custom input component as a post-launch enhancement.

3. **Tier selection via Astro Action vs API route**
   - What we know: Artifact approvals use Astro Actions (work because form is on portal pages). Send Update uses API route (runs from Sanity Studio browser context).
   - What's unclear: Nothing -- tier selection is on the portal, so Astro Actions are correct.
   - Recommendation: Use Astro Action (same as approveArtifact). API route pattern is only needed for Studio-originated operations.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEND-01 | Send Update document action triggers API route | unit (schema validation) | `npx vitest run src/sanity/schemas/project.test.ts -t "updateLog"` | Extend existing |
| SEND-02 | Email includes milestones, procurement, artifacts, note | unit (query string, HTML generation) | `npx vitest run src/sanity/queries.test.ts -t "send-update"` | Extend existing |
| SEND-03 | Update logged with timestamp and recipient | unit (log entry structure) | `npx vitest run src/sanity/schemas/project.test.ts -t "updateLog"` | Extend existing |
| ARTF-05 | Investment Summary with tiers and line items | unit (schema validation, type safety) | `npx vitest run src/lib/artifactUtils.test.ts -t "investment"` | Extend existing |
| ARTF-06 | Client selects preferred tier | unit (schema, action handler) | `npx vitest run src/actions/portalActions.test.ts -t "selectTier"` | Extend existing |
| ARTF-07 | Readiness check with eagerness + reservations | unit (schema validation) | `npx vitest run src/actions/portalActions.test.ts -t "eagerness"` | Extend existing |
| BOOK-01 | Cal.com removed, Fantastical link present | unit (file deletion verification) | `npx vitest run` (build passes without CalBooking) | N/A -- deletion |
| SITE-08 | Hero SplitText animation | manual-only | Manual: visit home page, observe character animation | N/A -- visual/animation |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Extend `src/sanity/schemas/project.test.ts` -- cover updateLog[] field and investmentSummary nested schema
- [ ] Extend `src/lib/artifactUtils.test.ts` -- cover investment summary type extensions
- [ ] Extend `src/actions/portalActions.test.ts` -- cover selectTier action validation
- [ ] Extend `src/sanity/queries.test.ts` -- cover send-update snapshot query string
- [ ] Add `src/actions/portalSchemas.ts` selectTierSchema -- validation tests

*(Existing test infrastructure covers all framework needs -- no new config or fixtures required)*

## Sources

### Primary (HIGH confidence)
- `src/sanity/actions/notifyClient.tsx` -- Document action pattern with dialog, API route call
- `src/pages/api/notify-artifact.ts` -- Full email build and send pattern: GROQ fetch, branded HTML, Resend, notification log
- `src/sanity/schemas/project.ts` -- Complete project schema with all current fields, groups, inline arrays
- `src/components/portal/ArtifactApprovalForm.tsx` -- React form pattern for portal interactive forms
- `src/actions/index.ts` + `src/actions/portalSchemas.ts` -- Astro Action and Zod schema patterns
- `docs/superpowers/specs/2026-03-16-hero-slideshow-design.md` -- Authoritative slideshow specification
- `node_modules/gsap/SplitText.js` -- SplitText 3.14.2 confirmed bundled in installed GSAP
- `sanity.config.ts` -- Document action registration pattern

### Secondary (MEDIUM confidence)
- npm registry -- gsap@3.14.2 is current, resend@6.9.4 is latest (6.4.2 installed)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already installed, no new dependencies except removing @calcom/embed-react
- Architecture: HIGH -- every feature follows an existing pattern with 1-3 direct analogs in the codebase
- Pitfalls: HIGH -- identified from direct code inspection and established project conventions
- SplitText integration: HIGH -- verified SplitText.js exists in node_modules/gsap/ and exports correctly

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- no fast-moving dependencies)

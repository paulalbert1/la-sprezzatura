# Phase 34: Settings and Studio Retirement - Context

**Gathered:** 2026-04-11 (assumptions mode with 1 correction on Send Update)
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the settings management UI at `/admin/settings` (siteSettings fields, hero slideshow editor, rendering config), build the Send Update modal on the project detail page, and fully retire Sanity Studio from the app — removing `studioBasePath`, deleting Studio-specific component files, and dropping the deprecation banner in favor of outright removal.

**In scope:**
- `/admin/settings` page with all siteSettings field groups (general, social, hero slideshow, rendering config)
- Send Update modal triggered from project detail page header
- Per-client PURL token (one token per client across ALL their projects), with regeneration on demand
- Schema change: add `portalToken` field to the `client` document schema (lazy-generated on first Send Update or first manual generation)
- New minimal client dashboard at `/portal/client/{token}` — lists all projects this client is on, links to the existing per-project portal views (the legacy `/portal/{project.portalToken}` route stays working for backward compatibility)
- Studio removal: drop `studioBasePath: "/admin"` from `astro.config.mjs`, delete `src/sanity/components/**/*.tsx` Studio UI files, keep `@sanity/astro` integration for schema distribution only
- Delete leftover Studio rendering tool files that Phase 33's D-21 coexistence preserved

**Out of scope:**
- Public-facing website visual tweaks (deferred to a separate polish phase)
- New siteSettings fields beyond what the schema already defines
- Multi-recipient email preview (single rendered preview opens in new tab per send)
- Token revocation UI beyond per-client regeneration
- Migration / removal of existing `project.portalToken` field (deferred — legacy route keeps working)
- Client dashboard polish beyond a minimal functional version (projects list + click-through to existing project portal)

</domain>

<decisions>
## Implementation Decisions

### Studio disposition (D-01)
- **D-01:** Full Sanity Studio removal. Drop `studioBasePath: "/admin"` from `astro.config.mjs`. Keep the `@sanity/astro` integration for schema distribution (schemas still feed Content Lake) but the Studio UI no longer mounts at any route. No deprecation banner — the roadmap line item for "deprecation banner" was drafted when coexistence was the plan, and Phase 33's D-21 made it obsolete.
- **D-02:** Delete `src/sanity/components/rendering/**` (all 14 Studio Rendering Tool files preserved by Phase 33 D-21 for coexistence) EXCEPT the re-export shim `src/sanity/components/rendering/types.ts` if anything outside `src/sanity/` still imports from it — grep first, keep shim only if there are consumers, otherwise delete and point any stragglers at `src/lib/rendering/types.ts` directly.
- **D-03:** Delete other Studio-specific components: `src/sanity/components/BlobFileInput.tsx`, `src/sanity/components/gantt/**` (if it's the Studio gantt, not the custom admin one — verify first), `src/sanity/components/PortalUrlDisplay.tsx`, `src/sanity/components/StudioNavbar.tsx`. Each deletion needs a grep to confirm no `src/pages/admin/**` or `src/components/admin/**` file imports it.
- **D-04:** Remove the `hasSanity` conditional branch in `astro.config.mjs` if the Sanity integration no longer mounts Studio — simplify to an unconditional schema-only integration.

### Settings form layout (D-05, D-06, D-07)
- **D-05:** `/admin/settings` is a single scrollable page with collapsible sections, not tabs. Matches the procurement editor pattern from Phase 32 and reduces clicks for Paul (the primary user) who touches settings rarely but wants to see everything when he does.
- **D-06:** Section order: General (siteTitle, tagline, contactEmail, contactPhone, studioLocation), Social Links (instagram, pinterest, houzz), Hero Slideshow, Rendering Configuration. Save-all button at the bottom; no per-section save.
- **D-07:** Optimistic save with toast ("Settings saved") on success, inline error banner on failure with retry. No confirmation modal — settings are recoverable via GROQ history.

### Hero slideshow editor (D-08, D-09, D-10)
- **D-08:** Drag-to-reorder using `@dnd-kit/sortable` (already in package.json, used by Phase 30 dashboard/tasks). Thumbnail, drag handle, alt text input, delete button per slide. Upload dropzone at the bottom of the list.
- **D-09:** Image upload via Vercel Blob using the same `<4.5MB PUT` / `>4.5MB @vercel/blob/client` pattern from Phase 33's StepUpload. Store Sanity image asset reference in the heroSlideshow array after upload so the public site's existing image URL generation keeps working.
- **D-10:** Alt text is required per slide (matches Sanity schema validation). Disable save if any slide has empty alt text; show inline error on the offending row.

### Rendering configuration form (D-11, D-12)
- **D-11:** Rendering section shows three fields: `renderingAllocation` (number input, min 1, default 50), `renderingImageTypes` (tag-style multi-input with add/remove), `renderingExcludedUsers` (multi-input for sanityUserId strings, with the sanitized display format — remember that Phase 33's `buildUsageDocId` sanitizes `@` to `-`).
- **D-12:** Changes to `renderingAllocation` take effect immediately for all new usage checks (no grace period). Changes to `renderingExcludedUsers` block on next API call from that user.

### Send Update modal (D-13 through D-18)
- **D-13:** Button placement is the header of `/admin/projects/[projectId]` detail page as a secondary action next to existing primary actions. Label: "Send Update". Icon: `Mail` from lucide-react.
- **D-14:** Clicking opens a modal (not a parchment drawer). Modal contains, in order:
  1. Recipients line (read-only list of `project.clients[].client->email`)
  2. Personal note textarea (4 rows, placeholder "Hi Liz, ...", optional)
  3. Three section checkboxes with live counts: Milestones (N), Procurement (N items, M delivered), Pending reviews (N items awaiting approval)
  4. Personal portal link toggle ("Send each recipient their personal portal link")
  5. Actions row: Preview email (opens rendered HTML in new tab), Cancel, Send update
- **D-15:** Default checkbox state: Milestones ON, Procurement ON (only if engagementType is full-interior-design), **Pending reviews OFF** (Liz must opt in to avoid accidental pressure on clients about pending approvals).
- **D-16:** Preview email uses the existing `buildSendUpdateEmail` function from `src/pages/api/send-update.ts` — extract the HTML builder into a shared module if it isn't already, so the preview and the actual send render from the same source.
- **D-17:** Send calls `/api/send-update` with `{ projectId, note, sections, usePersonalLinks: true }`. API change: add `usePersonalLinks` flag; when true, the API resolves each recipient's client-level `portalToken` (see D-18), lazy-generates one if the client doesn't yet have a token, and injects `${baseUrl}/portal/client/{token}` as the CTA href per recipient so each client gets their own dashboard link. When the flag is false (backward compat), the email uses the generic `/portal/dashboard` link as it does today.
- **D-18:** **Schema change:** Add a `portalToken` field (string, optional, readOnly) to the `client` document schema in `src/sanity/schemas/client.ts`. The token identifies the client across ALL their projects — one client, one token, regardless of how many projects they're on. **Migration approach: lazy.** On first Send Update (or first manual regeneration action), if `client.portalToken` is empty, call `generatePortalToken()` and patch the client document. Existing projects keep their `project.portalToken` field untouched — the legacy `/portal/{project.portalToken}` route stays working for bookmarked links. Over time, clients migrate as they get their first Send Update with personal links enabled.

### Client dashboard (D-19, D-20)
- **D-19:** **New portal route:** `/portal/client/[token].astro` — minimal client dashboard. Resolves `client` document by `portalToken`, fetches all `project` docs where `clients[].client._ref == client._id`, renders a simple list of project cards (project title, engagement type, current pipelineStage, link to `/portal/{project.portalToken}` — the EXISTING per-project portal view). No auth beyond the token match. If token doesn't resolve, show a generic "portal link expired or invalid" page with a contact email.
- **D-20:** Minimal client dashboard UI (this phase only — polish is deferred):
  - Header: client name ("Welcome, Sarah"), small La Sprezzatura logo, no nav
  - Body: list of project cards, each showing title + engagement type + current stage + "View project →" link
  - Footer: contact email ("Questions? Email hello@lasprezz.com")
  - Styling: reuse existing portal visual tokens from `/portal/*` pages (warm neutrals, serif headings, editorial spacing)
  - Mobile-first, single-column on small screens
  - No client-level "account settings" or notifications — deferred
- **D-21:** Legacy `/portal/{project.portalToken}` route KEEPS WORKING unchanged. Existing client bookmarks continue to resolve. No migration is required in this phase; project-level token cleanup is a future concern.

### Per-client PURL regeneration (D-22)
- **D-22:** Regenerate action lives on each client row in the project detail page's Clients section (NOT on the client list page, because Liz's regeneration decisions are typically in the context of a specific project conversation). Confirms with a dialog ("This invalidates the current link across ALL this client's projects"), generates a new token via `generatePortalToken()`, patches `client.portalToken`, shows the new client dashboard URL in a toast with a copy button. No email is sent on regeneration — Liz handles that manually via the next Send Update.

### Folded decisions from Phase 33

- Studio coexistence (D-21 from Phase 33) is **REVERSED** in Phase 34 — it was a temporary gate to allow Phase 33 to port the rendering tool without breaking Studio. Phase 34 now completes the pivot.
- `sanityUserId` email sanitization via `buildUsageDocId()` from Phase 33 `fix(33-01)` commit `7db8dd5` is load-bearing for rendering config. The excluded users field in settings stores raw email strings; `renderingAuth.ts` applies sanitization on the storage side, so the settings UI stores `paul@lasprezz.com` and the doc ID becomes `usage-paul-lasprezz-com-2026-04`.

### Claude's Discretion

- Exact settings form field labels and help text (follow existing Phase 30/32 form patterns)
- Toast positioning and timing (use whatever Phase 32 procurement editor uses)
- Hero slideshow delete confirmation UX (inline X button with undo toast is fine, no modal)
- Rendering config input types (number input vs slider for allocation — number is clearer)
- Exact grep commands for Studio file deletion verification (planner picks)

</decisions>

<specifics>
## Specific Ideas

- **Send Update feels like "composing a progress email"** — the modal metaphor matters, not a drawer. Liz is briefly authoring + configuring an outgoing message, closing the thread when done. A drawer implies "ongoing editing surface" which doesn't fit.
- **Default-off pending reviews** is intentional UX: Liz should consciously choose to include "items awaiting your review" because it creates implicit deadline pressure on the client. Milestones and procurement status are informational; review items are asks.
- **Per-client PURL (Option A — token lives on the client document, one per client across all projects)** is the security-correct default for multi-client projects — if Liz sends an update to both a homeowner and their spouse, and one of them forwards the email, only that recipient's token is exposed. Regeneration kills one link without invalidating the other's. The tradeoff is that regenerating a client's token affects their access to ALL their projects at once (not just one), which matches the client-account mental model and is simpler for Liz to reason about than per-project-per-client tokens.
- **Preview opens in new tab**, not inline — the email template is a full HTML document and rendering it inside the admin page is visually distracting. Open-in-tab matches email client expectations.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Send Update
- `src/pages/api/send-update.ts` — existing Send Update API, the `buildSendUpdateEmail` function (extract to shared module for preview reuse), section toggle contract, Resend integration, project.updateLog[] write pattern. Add `usePersonalLinks` flag handling and per-recipient CTA URL substitution.
- `src/sanity/schemas/project.ts` §portalToken (line ~224) — existing project-level portalToken definition with `generatePortalToken()` initialValue and `PortalUrlDisplay` Studio input component. The Studio input component can be deleted in Studio cleanup; the project-level token stays untouched for backward compatibility.
- `src/sanity/schemas/client.ts` — the client document schema. Phase 34 adds a new `portalToken` field here.
- `src/lib/generateToken.ts` — `generatePortalToken()` is the token generator; 8+ char length, verify length in planner. Used for both the existing project-level token and the new client-level token.
- `src/pages/portal/**` — existing portal routes (planner must read these to understand the current URL structure and how to add the new `/portal/client/[token]` route alongside the legacy `/portal/{project.portalToken}` route without breaking existing bookmarks)
- `src/middleware.ts` — existing middleware that handles `/portal/*` routing. Planner must understand how the legacy project-token resolution works before adding client-token resolution.

### Settings
- `src/sanity/schemas/siteSettings.ts` — full schema: siteTitle, tagline, contactEmail, contactPhone, studioLocation, socialLinks, heroSlideshow, renderingAllocation, renderingImageTypes, renderingExcludedUsers. Hero slideshow items have `image` (Sanity image type, hotspot enabled) and required `alt` fields. Rendering group has a `group: "rendering"` marker on relevant fields
- `astro.config.mjs` §integrations — Sanity integration block to modify (drop studioBasePath, simplify hasSanity conditional)
- `src/components/admin/procurement/ProcurementEditor.tsx` (Phase 32) — form pattern to follow for the settings editor: collapsible sections, optimistic save, error banner
- `src/components/admin/rendering/StepUpload.tsx` (Phase 33) — image upload pattern for hero slideshow: `<4.5MB PUT` + `>4.5MB @vercel/blob/client`, `URL.createObjectURL` preview, revoke on unmount

### Studio removal
- `src/sanity/components/` — directory of all Studio-specific components. Subtree to delete: `rendering/*` (14 files), `BlobFileInput.tsx`, `PortalUrlDisplay.tsx`, `StudioNavbar.tsx`, possibly `gantt/*` (verify it's not shared with the custom admin gantt at Phase 28). **Before deleting each:** `grep -rn "from \"../sanity/components/{file}\"\|from \"@/sanity/components/{file}\"" src/ --include="*.tsx" --include="*.ts" --include="*.astro"` to confirm no admin consumer. The re-export shim at `src/sanity/components/rendering/types.ts` stays until all Studio imports are gone, then delete.
- `.planning/phases/33-rendering-tool-relocation/33-01-SUMMARY.md` — documents which files became re-export shims in Phase 33 (know what NOT to delete)

### Project-level context
- `.planning/PROJECT.md` — current state; this is v5.0's last phase
- `.planning/ROADMAP.md` line 386+ — Phase 34 description and the v5.0 milestone boundary
- `.planning/phases/29-tenant-aware-platform-foundation/29-SUMMARY.md` (if present) — tenant scoping patterns still apply to Phase 34 work

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`buildSendUpdateEmail()` (src/pages/api/send-update.ts:50)** — the full HTML email builder. Extract to a shared module (e.g. `src/lib/sendUpdate/emailTemplate.ts`) so both the API and the preview action in the modal render from the same source.
- **`generatePortalToken()` (src/lib/generateToken.ts)** — existing PURL token generator. Use as-is for both project-level legacy compatibility and new per-client tokens.
- **`@dnd-kit/sortable`** — already in package.json from Phase 30 dashboard/tasks. Use for hero slideshow reordering.
- **Vercel Blob upload pattern** from `src/components/admin/rendering/StepUpload.tsx` (Phase 33) — PUT for small files, `@vercel/blob/client` for large files, instant `URL.createObjectURL` previews with `revokeObjectURL` cleanup. Copy the pattern for hero slideshow uploads.
- **Procurement editor form pattern** from Phase 32 — collapsible sections, optimistic save, inline error banner. Copy the layout structure for the settings form.
- **Admin modal pattern** — check if Phase 30/32 has an existing admin modal component. If yes, reuse. If no, the planner builds a new one using the luxury design tokens from Phase 32.
- **`Mail` icon from `lucide-react`** — already imported elsewhere in admin, use for the Send Update button.

### Established Patterns
- **Tailwind + lucide-react only** in `src/components/admin/**` — no `@sanity/ui` (enforced by Phase 33 grep acceptance criteria)
- **Server-side `STUDIO_API_SECRET` read** — secrets stay in `.astro` frontmatter, NEVER accessed from React components via `import.meta.env` (T-33-01 holds for all new admin code)
- **Optimistic update + rollback** pattern from Phase 33 ChatView refine flow — applicable to settings save if we want it to feel instant
- **Collapsible section pattern** from Phase 32 ProcurementEditor — use for settings sections
- **Sanity write operations via `sanityWriteClient`** — server-side only in Astro API routes, token-authenticated, never from browser

### Integration Points
- **`astro.config.mjs`** — the Sanity integration simplification lives here. Phase 34 must verify the `@sanity/astro` package still works with `studioBasePath` omitted (the integration should accept an empty/undefined value and simply not mount Studio)
- **Existing portal middleware** at `src/middleware.ts` — Phase 34 adds a new code path that resolves `client.portalToken` → client dashboard. The existing code path that resolves `project.portalToken` → project view stays untouched for backward compatibility. Token lookup is a GROQ query against the appropriate document type.
- **Client schema** at `src/sanity/schemas/client.ts` — new `portalToken` field (string, optional, readOnly, initialValue undefined so it's lazy-generated on first use)
- **New portal route file** at `src/pages/portal/client/[token].astro` — the minimal client dashboard. Reads token from params, fetches client + their projects via GROQ, renders the list.
- **`/api/send-update` contract** — new optional `usePersonalLinks: boolean` on request body. Default false (backward compat) but the new modal always sends true. When true, per-recipient CTA href becomes `${baseUrl}/portal/client/${client.portalToken}` (generating the token if missing).

### Code to delete (not just modify)
- `src/sanity/components/rendering/**` (14 files from Phase 33 coexistence) — verify no consumers first
- `src/sanity/components/BlobFileInput.tsx`, `PortalUrlDisplay.tsx`, `StudioNavbar.tsx` — Studio-only
- Possibly `src/sanity/components/gantt/**` — verify it's Studio-specific, not the custom admin gantt

</code_context>

<deferred>
## Deferred Ideas

### Public-facing website visual tweaks
**User flagged:** "The front end public-facing website still needs visual tweaks."

Not a Phase 34 concern — Phase 34 is admin-side only. Create a dedicated polish phase (v5.1 or Phase 35+) after v5.0 milestone completes. Likely scope for that future phase:
- Home page hero slideshow display tweaks (how the uploaded hero images actually render on the live site)
- Portfolio gallery spacing, typography, animation polish
- Contact form visual refresh
- Any SEO meta tweaks that emerged since Phase 3
- Mobile responsive edge cases

Capture this as the first item on a v5.1 polish roadmap. Don't let it drift.

### Project-level `portalToken` cleanup
Phase 34 adds client-level `client.portalToken` but LEAVES the project-level `project.portalToken` field in place for backward compatibility. Existing bookmarked `/portal/{project.portalToken}` URLs continue to resolve to the per-project portal view. A future phase should:
- Audit all consumers of `project.portalToken` (middleware, emails, any hardcoded references)
- Confirm all clients have been migrated to client-level tokens (lazy migration via Send Update completes organically over a few months)
- Delete the `project.portalToken` field from the schema
- Run a one-time migration to remove the field from all existing project documents
- Remove the legacy `/portal/{project.portalToken}` route handler from middleware

### Client dashboard polish
Phase 34 ships a minimal client dashboard: list of project cards, click through to existing per-project portal view. Future polish phases could add:
- Client-level recent activity feed (cross-project updates)
- Client-level notifications / unread badges
- Client contact info editing (currently only Liz can edit client info from `/admin/clients`)
- Client-branded experience (custom logo, cover image per client)
- Multi-factor auth or email verification beyond token-based access
- Analytics on client dashboard engagement (which clients open it, which projects they view most)

### Token revocation / expiry
Per-client PURL regeneration is in scope. Automatic token expiry (e.g., 90 days) and global "kill all active tokens" UX are NOT in scope — Liz regenerates on demand when compromised. If this becomes a real security concern, add it to a later security-hardening phase.

### Multi-recipient preview
Preview email in the modal opens ONE rendered HTML for the current project. It doesn't show "here's what each recipient will see with their personal link" — that would be 2-3 separate previews. Out of scope; the template is identical except for the CTA URL, so a single preview covers the UX check.

### Settings change audit log
The existing `project.updateLog[]` logs Send Update sends. There's no equivalent audit log for siteSettings or rendering config changes. A future phase could add this if compliance or multi-user concerns emerge.

</deferred>

---

*Phase: 34-settings-and-studio-retirement*
*Context gathered: 2026-04-11 (assumptions mode)*

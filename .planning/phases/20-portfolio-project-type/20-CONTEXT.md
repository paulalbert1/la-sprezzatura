# Phase 20: Portfolio Project Type - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a new `portfolioProject` Sanity schema type as a curated, public-facing version of an admin project. Add a "Create Portfolio Version" document action on completed admin projects that spawns a portfolio project with optional image selection. Portfolio project is an independent document with `sourceAdminProjectId` reference back to the admin project.

Requirements in scope: PORT-01, PORT-02, PORT-03, PORT-04, PORT-05.

</domain>

<decisions>
## Implementation Decisions

### Spawn Trigger (PORT-02)
- **D-01:** "Create Portfolio Version" button appears as a document action on admin projects when `projectStatus === 'completed'`. Uses the same pattern as `CompleteProjectAction` — function component returning `{ label, tone, onHandle, dialog }`.
- **D-02:** Button is hidden if a `portfolioProject` document already exists with a matching `sourceAdminProjectId`. One portfolio version per admin project — prevents duplicates.

### Schema Fields (PORT-01)
- **D-03:** The `portfolioProject` schema includes these fields, all auto-copied from the admin project on spawn:
  - `title` (string, required)
  - `slug` (slug, source: title, auto-generated)
  - `location` (string)
  - `description` (text)
  - `tags` (array of strings — new field, not on admin project)
  - `heroImage` (image with hotspot + lqip/palette metadata)
  - `images` (array of images with alt/caption, same structure as admin project gallery)
  - `roomType` (string, same options as admin project)
  - `challenge` (array of blocks — rich text)
  - `approach` (array of blocks — rich text)
  - `outcome` (array of blocks — rich text)
  - `testimonial` (object: quote + author)
  - `completionDate` (date)
  - `featured` (boolean, default false)
  - `order` (number)
  - `sourceAdminProjectId` (string, readOnly — the admin project's `_id`)
- **D-04:** The `style` field is NOT carried over — the `tags` field provides more flexible categorization.

### Image Selection UX (PORT-03)
- **D-05:** Spawn modal presents a thumbnail grid with checkboxes showing the admin project's heroImage and all gallery images. Hero image is pre-checked and starred (always copied as the portfolio hero). Select All / Select None buttons at top.
- **D-06:** When user answers "no, project has not been photographed," the portfolio project is created with all text fields copied but empty gallery and no heroImage. Liz can upload photos later directly to the portfolio version.

### Auto-Copy Behavior (PORT-04)
- **D-07:** On spawn, title, location, description, roomType, challenge, approach, outcome, testimonial, completionDate, featured, and order are auto-copied from the admin project. Slug is auto-generated from title. Tags start empty (new field). `sourceAdminProjectId` is set to the admin project's `_id`.

### Independence (PORT-05)
- **D-08:** Portfolio project is a fully independent document — no ongoing sync with the admin project. Changes to the admin project after spawn do not propagate. The `sourceAdminProjectId` is a plain string reference for audit trail only.

### Studio Navigation
- **D-09:** Rename the current sidebar "Portfolio Projects" entry to "Projects" (admin/operational projects). Add a new "Portfolio" list item for `portfolioProject` documents below it.
- **D-10:** Add a "Portfolio" tab to the StudioNavbar alongside Projects, Clients, Contractors, etc. Portfolio gets first-class navigation.

### Claude's Discretion
- Dialog layout and styling for the spawn modal (within the warm stone palette)
- Exact thumbnail size and grid layout in the image selection step
- Whether to show a success toast/redirect after portfolio creation
- Preview configuration for portfolioProject documents in the sidebar list
- Whether the spawn action copies the heroImage's hotspot/crop settings

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema (primary targets)
- `src/sanity/schemas/project.ts` — Admin project schema with all field definitions; portfolioProject reuses many of these field shapes
- `src/sanity/schemas/index.ts` — Schema registry; portfolioProject must be added here
- `src/sanity/schemas/designOption.ts` — Example of a document type with `sourceSession` reference pattern (reference to parent document)

### Document Actions (spawn action pattern)
- `src/sanity/actions/completeProject.tsx` — Existing action with dialog pattern; spawn action follows the same structure
- `sanity.config.ts` — `document.actions` registration; new action must be added to the project type's action list

### Studio Navigation
- `sanity.config.ts` — Structure builder with sidebar list items; needs rename + new list item
- `src/sanity/components/StudioNavbar.tsx` — Custom navbar with doc type tabs; needs new Portfolio tab
- `src/sanity/structure.ts` — `getDefaultDocumentNode` resolver; portfolioProject uses default form view only (no Timeline)

### Theme
- `src/sanity/studioTheme.ts` — Warm stone palette for modal styling
- `src/sanity/studio.css` — CSS overrides for consistent styling

### Requirements
- `.planning/REQUIREMENTS.md` — PORT-01 through PORT-05 definitions with success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CompleteProjectAction` pattern — dialog-based document action with confirmation. Spawn action follows same structure but with a multi-step dialog (photography question, then optional image grid).
- Image field definitions in `project.ts` (heroImage, images array with alt/caption) — portfolioProject reuses exact same field shapes via `defineField`.
- `generatePortalToken` utility — example of `initialValue` functions; similar pattern for `sourceAdminProjectId` on spawn.

### Established Patterns
- Document actions are function components with `DocumentActionProps`, returning `{ label, tone, onHandle, dialog }`.
- Schema types use `defineType`/`defineField`/`defineArrayMember` from Sanity.
- Schema registry is a flat array in `src/sanity/schemas/index.ts`.
- Structure builder in `sanity.config.ts` uses `S.documentTypeListItem()` for standard doc lists.
- StudioNavbar renders tabs based on schema types with `tone="primary"` for active tab.
- Image handling uses Sanity's native image type with `hotspot: true` and `metadata: ["lqip", "palette"]`.

### Integration Points
- `sanity.config.ts` — schema registration, structure builder, document actions, navbar
- `src/sanity/schemas/index.ts` — schema array export
- `src/sanity/components/StudioNavbar.tsx` — tab list generation
- `src/sanity/structure.ts` — default document node views (portfolioProject gets form view only)

</code_context>

<specifics>
## Specific Ideas

- The thumbnail grid in the spawn modal should feel natural within Sanity Studio — not a bolted-on external UI. Use Sanity UI primitives (Card, Grid, Checkbox) where possible.
- Hero image in the grid should have a visual star/badge distinguishing it from gallery images.
- "Projects" (admin) vs "Portfolio" (public) naming makes the distinction clear for Liz without requiring technical understanding.

</specifics>

<deferred>
## Deferred Ideas

- Public site rendering from portfolioProject instead of project — future phase (requires Astro page/query changes)
- Syncing changes from admin project to portfolio version — explicitly out of scope per PORT-05

</deferred>

---

*Phase: 20-portfolio-project-type*
*Context gathered: 2026-04-05*

# Phase 11: Rendering Studio Tool and Design Options Gallery - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Liz can create rendering sessions, upload inputs through a guided wizard, generate and refine renderings, and promote favorites as Design Options visible to clients — the complete AI rendering workflow from designer creation to client consumption. All backend API routes and schemas are built (Phase 10). This phase is purely UI: a Sanity Studio custom tool for designers and a portal gallery for clients.

Phase 11 delivers: (1) Sanity Studio rendering tool with wizard, refinement chat, session management, and Design Options tab; (2) Client portal Design Options gallery section with favorites and comments.

</domain>

<decisions>
## Implementation Decisions

### Studio Tool Entry Point
- Dedicated sidebar tool icon in Sanity Studio — first-class tool alongside Structure and Vision
- One click opens the rendering workspace with session list and New Session wizard
- No document action shortcut needed — sidebar is the single entry point

### 4-Step Wizard Flow
- **Step 1: Setup** — Session title (required), project dropdown (optional, scratchpad if empty), aspect ratio toggle (16:9/1:1/4:3, defaults to 16:9), style preset freeform field (optional)
- **Step 2: Upload** — Large drop zone for drag-and-drop with 'Browse files' button inside. Multi-select supported. Uploaded images appear as thumbnail cards below with remove button. Uses existing BlobFileInput pattern. Drop zone stays active after uploads with progress bars on thumbnails
- **Step 3: Classify** — Vertical card list: each image shows thumbnail on left, classification fields on right (type dropdown, placement text, copy exact toggle, notes). Scroll through all images vertically
- **Step 4: Describe + Generate** — Freeform text area for design vision (required), Generate button
- Numbered stepper bar at top: (1) Setup → (2) Upload → (3) Classify → (4) Describe. Active step highlighted, completed steps show checkmark. Can click back to completed steps
- Linear navigation with back: must go through steps in order (Next button), can go Back to any previous step. Can't skip ahead. Back preserves all entered data
- Each new session starts fresh — no persistence of last-used settings

### Wizard Input Requirements
- Only session title and description are required
- Images, project link, style preset are all optional
- Soft warning if no floor plan: "Results may be less spatially accurate without a floor plan" — generation proceeds
- Aspect ratio defaults to 16:9

### Smart Image Classification Defaults
- First image defaults to 'Floor Plan' with copyExact: true
- Subsequent images default to 'Existing Space Photo' with copyExact: false
- All defaults editable by Liz
- No reorder needed — upload order is display order. Semantic role handled by imageType/location/notes fields. Prompt builder uses type metadata, not array position

### Accepted Image Formats
- JPG/JPEG, PNG, WebP, HEIC (iPhone photos), PDF (floor plans)
- 20MB per file limit, no hard limit on file count
- No format conversion — Vercel Blob stores as-is, Gemini handles these natively
- Soft hint at 7+ images: "Lots of references! The AI works best with 3-6 focused images."

### Wizard Abandon Behavior
- If any data entered: confirmation dialog "Discard this session? Your uploads and settings will be lost."
- If nothing entered: close silently

### Post-Generation Transition
- Wizard closes and transitions to refinement chat view showing the generated image, AI response text, and refinement input
- After initial generation, wizard is done — no re-opening. Session title and project link editable inline from chat header

### Generation Wait State
- Wizard Step 4: Generate button becomes spinner with rotating status text ('Composing vision...', 'Generating rendering...', 'Almost there...'). Inputs disabled. Cancel button available. Polls /api/rendering/status
- Chat view (refinements): Skeleton card with pulse animation where next rendering will appear. Status text "Generating...". Input disabled. Scrolls to keep skeleton in view

### Refinement Chat Layout
- Vertical chat thread: user messages on right, AI responses with rendered images on left
- Each generation is a large image card with action buttons
- Text input at bottom with attach (📎) and Refine (✨) buttons
- Horizontal scroll thumbnail strip at top for quick navigation between renderings

### Rendering Card Actions (Chat View)
- **Promote** — Inline button. Click shows optional caption field + Confirm. Promoted renderings show star badge, "Edit caption" and "Unpromote" options. Scratchpad sessions get project picker first
- **Full size** — Opens overlay lightbox (dark backdrop, keyboard ←→ navigation, Esc close, touch swipe). Same visual pattern as portfolio Lightbox
- **Download** — Downloads full-resolution image from Blob
- **View prompt** — Expandable/collapsible link showing the full composed prompt sent to Gemini. Hidden by default
- **Metadata footer** — Subtle muted text: "12.4s · $0.07 · NB2" (latency, cost, model)

### Thumbnail Strip
- Horizontal strip of all renderings as small thumbnails
- Click scrolls chat to that rendering
- Promoted: star badge. Failed: error badge. Active: highlighted
- Horizontal scroll if more than 5

### Error Handling in Chat
- Failed renderings: error card in chat thread with icon, helpful message, and Retry button
- Content policy: "The AI flagged a potential issue. Try rephrasing or different reference images."
- API failures: "Generation failed. Tap to retry."
- Failed attempts stay visible in chat history with error badge

### Mid-Session Image Uploads
- Paperclip/attach icon next to text input in chat view
- Opens file picker or drag-drop zone
- Uploaded image gets quick-classify card (type dropdown, placement text) before sending refinement
- Same metadata as wizard images — appended to session's images array

### Usage Counter
- Persistent "X/Y used this month" badge — visible on session list header (next to New Session button) AND in session header when inside a session
- Color-coded: green <80%, amber 80-95%, red 95%+
- At limit: generate/refine buttons disabled with clear "Generation limit reached" message
- Session stays open for browsing and promoting when limit hit

### Prompt Visibility
- Composed prompt hidden in normal chat flow
- "View prompt" expandable link per rendering for debugging
- Only visible in Studio (never on portal)

### Session List (Rendering Tool Main View)
- Vertical list of session cards showing: title, project name (or 'Scratchpad'), rendering count, promoted count, last activity date
- Project filter dropdown at top to filter by project
- "New Session" button at top-left, usage badge at top-right
- Click session replaces list with session chat view. Back button returns to list (stack navigation)

### Scratchpad Visual Distinction
- 'Scratchpad' label where project name would be
- Dashed border or muted background to visually distinguish from project-linked sessions

### Design Options Tab in Studio
- Rendering tool has two tabs: [Sessions] and [Design Options]
- Design Options tab shows all promoted options per project in a grid
- Each card shows: rendering thumbnail, caption, favorite count, comment count
- Liz can edit captions and unpromote from this tab — sees client reactions without visiting portal

### Portal Design Options Gallery
- New section on existing project detail page, between milestones and artifacts (or wherever fits the flow)
- Only appears when there are promoted design options — hidden when 0
- Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop
- Gallery cards: rendering image cropped/fit to consistent 16:9 aspect ratio, caption, favorite heart icon, comment count badge
- Sorted by promotedAt (chronological promote order) — no client-side sort/filter controls

### Portal Lightbox
- New portal lightbox component (not reusing portfolio Lightbox)
- Same visual style: dark overlay, keyboard ←→ navigation, Esc close, touch swipe
- Additional interactive elements: heart toggle, caption display, comment thread with text input + submit
- Full uncropped image at natural proportions (gallery cards are 16:9 cropped)
- Previous/next navigation with counter (2/5)

### Favorite Interaction (Client Portal)
- Heart toggle on gallery card AND in lightbox
- Click toggles favorite (filled/outlined heart)
- Optimistic UI update — API call (/api/rendering/react) in background
- Subtle heart fill animation
- Favorites persist per client

### Comment Interaction (Client Portal)
- Comments in lightbox view only (not on gallery card)
- Comment thread below image: shows client name + timestamp per comment
- Text input field + Submit button
- Comment count visible on gallery card as badge
- Calls /api/rendering/react with type: "comment"

### Multi-Client Visibility
- Gallery shows total favorite count per option (e.g., "♥ 2")
- Lightbox shows if current client favorited it
- Don't expose which other clients favorited — avoids social pressure
- Comments DO show client names (needed for conversation)

### Confidentiality Notice
- Reuse ConfidentialityBanner.astro with rendering-specific copy
- Residential: "These design concepts are confidential. Please do not share."
- Commercial: adapted for building context
- Shows once per section, above the gallery grid — not per image

### Claude's Discretion
- Exact Sanity Studio plugin registration pattern for the sidebar tool
- React component architecture for wizard steps and chat view (shared state management approach)
- Lightbox animation/transition details
- Image loading strategy (lazy loading, placeholder blur)
- Session deletion capability (if needed beyond just unpromoting)
- Gallery card hover states and micro-interactions
- Comment character limit (if any)
- Keyboard shortcuts within Studio tool

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### AI rendering design spec (PRIMARY)
- `docs/superpowers/specs/2026-03-17-ai-rendering-design.md` — Complete design spec: data model, API routes, auth approach, Gemini integration. CONTEXT.md decisions override spec where they differ.

### Phase 10 context (backend decisions)
- `.planning/phases/10-ai-rendering-engine/10-CONTEXT.md` — All backend decisions: schema design, API routes, prompt builder, usage tracking, promote workflow, Blob storage, auth. Phase 11 builds UI on top of these APIs.

### Sanity Studio configuration
- `sanity.config.ts` — Current Studio config: structureTool, document actions, schema types. Phase 11 adds a new custom tool plugin to the plugins array.

### Rendering schemas (Phase 10 output)
- `src/sanity/schemas/renderingSession.ts` — Session schema with field groups (setup/inputs/renderings/metadata), images array, conversation array, renderings array
- `src/sanity/schemas/designOption.ts` — Design option schema with project ref, blobPathname, caption, reactions array (favorites + comments)
- `src/sanity/schemas/renderingUsage.ts` — Usage tracking schema

### Rendering API routes (Phase 10 output)
- `src/pages/api/rendering/generate.ts` — Core generation endpoint
- `src/pages/api/rendering/refine.ts` — Conversational refinement endpoint
- `src/pages/api/rendering/status.ts` — Polling endpoint for generation status
- `src/pages/api/rendering/usage.ts` — Usage counter endpoint
- `src/pages/api/rendering/promote.ts` — Promote/unpromote to Design Option
- `src/pages/api/rendering/react.ts` — Client favorites and comments (portal auth)

### Existing Sanity Studio components
- `src/sanity/components/BlobFileInput.tsx` — File upload to Vercel Blob. Reuse pattern for wizard upload step.

### Existing portal components
- `src/components/ConfidentialityBanner.astro` — Reuse with rendering-specific copy for Design Options section
- `src/components/portfolio/Lightbox.astro` — Visual reference for lightbox pattern (keyboard nav, touch swipe, dark overlay). Portal lightbox is NEW component with interactive elements

### Portal project page
- `src/pages/portal/project/[projectId].astro` — Existing project detail page where Design Options section will be added

### GROQ queries
- `src/sanity/queries.ts` — Contains DESIGN_OPTIONS_BY_PROJECT_QUERY and rendering session queries. Add new queries for session list, usage counter.

### Design system
- `src/styles/global.css` — Color tokens (cream #FAF8F5, terracotta #C4836A, charcoal #2C2926, stone #8A8478), typography

### Planning
- `.planning/REQUIREMENTS.md` — Phase 11 requirements: RNDR-04, RNDR-05
- `.planning/ROADMAP.md` — Phase 11 success criteria, dependency on Phase 10

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BlobFileInput.tsx`: Sanity Studio file upload to Vercel Blob — pattern for wizard upload step. May need extension for multi-file drag-and-drop
- `ConfidentialityBanner.astro`: Portal confidentiality notice — reuse with rendering-specific text
- `Lightbox.astro`: Portfolio lightbox with keyboard/touch nav — visual reference for portal lightbox (new component needed for interactive elements)
- `blob-upload.ts` / `blob-serve.ts`: Blob upload and authenticated serve routes — reuse for wizard image uploads and gallery image serving
- `session.ts`: Session helpers — portal gallery uses existing portal auth for favorites/comments

### Established Patterns
- Sanity Studio custom tools registered via plugins array in `sanity.config.ts` — Phase 11 adds a new tool plugin
- API route pattern: validate auth → fetch via GROQ → business logic → write to Sanity → return response
- Portal sections: Astro components with conditional rendering (`{items.length > 0 && <Section />}`) — same pattern for Design Options section
- React islands in Astro: interactive components (forms, toggles) as React islands with `client:load` — needed for favorites/comments
- Portal lightbox: Astro component with `<script>` block for vanilla JS interactions — portal gallery lightbox needs React for stateful heart/comment interactions

### Integration Points
- `sanity.config.ts`: Add rendering tool plugin to plugins array
- `src/pages/portal/project/[projectId].astro`: Add Design Options section (conditionally rendered)
- `src/sanity/queries.ts`: Add session list query, usage query for Studio tool
- New Sanity Studio React components under `src/sanity/components/rendering/`: wizard steps, chat view, session list, Design Options tab
- New portal components: `DesignOptionsSection.astro`, `DesignOptionCard.astro`, `DesignOptionLightbox.tsx` (React island)

</code_context>

<specifics>
## Specific Ideas

- The Studio rendering tool should feel like a first-class creative tool, not a bolted-on feature — sidebar icon puts it on equal footing with Structure
- Wizard should be quick and lightweight — most sessions will have 2-4 images and a paragraph of description. Don't over-formalize the flow
- Chat view should feel like messaging (think iMessage) — user text on right, AI images on left, natural scroll
- Gallery on the portal should feel like browsing a curated lookbook — clean grid, minimal chrome, images as the focus
- Thumbnail strip in chat view inspired by Figma's layer panel — compact, scannable, clickable
- Heart animation should be subtle and refined — not a cartoon bounce. Matches the luxury aesthetic
- The "View prompt" expandable is a power-user feature for Paul to debug prompt quality — not something Liz will typically use

</specifics>

<deferred>
## Deferred Ideas

- **Side-by-side rendering comparison**: Phase 10 context mentioned this as a potential Phase 11 enhancement. Thumbnail strip + lightbox nav covers the comparison need for V1.
- **Drag-to-reorder Design Options**: Liz controls order via promote/unpromote sequence. Explicit drag reorder is a future enhancement.
- **Batch promote**: Select multiple renderings and promote at once. Future enhancement if workflow needs it.
- **Template sessions**: Clone a session's settings for a new session. Future enhancement if Liz does repetitive session setups.
- **Auto-save draft sessions**: Save partial wizard state to Sanity as draft. V1 uses confirm-discard instead.

</deferred>

---

*Phase: 11-rendering-studio-tool-and-design-options-gallery*
*Context gathered: 2026-03-17*

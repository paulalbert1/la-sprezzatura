# Phase 10: AI Rendering Engine - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

The server-side rendering pipeline is fully operational — Sanity schemas for sessions, outputs, design options, and usage tracking are deployed, all API routes handle generation, conversational refinement, promotion, client reactions, and polling with Gemini integration, usage is enforced per-designer per-month with hard cap, and generated images are stored in Vercel Blob. All backend infrastructure and API routes ready before building the Studio UI or portal gallery (Phase 11).

Phase 10 delivers: all 3 schemas (renderingSession, designOption, renderingUsage) + all 6 API routes (generate, refine, status, usage, promote, react). Phase 11 is purely Studio tool UI + portal gallery UI.

</domain>

<decisions>
## Implementation Decisions

### Gemini API Prompt Engineering

- **Structured prompt builder**: API route auto-assembles the luxury interior rendering template from image metadata + Liz's freeform description. Liz writes naturally; the system structures it for Gemini.
- **Image type classification**: Each input image gets a type from a configurable dropdown (stored in siteSettings.renderingImageTypes). Default types: Floor Plan, Existing Space Photo, Inspiration, Material/Finish Sample, Furniture Reference, Fixture Reference, Custom. New types can be added via siteSettings without code changes.
- **Per-image metadata**: Each image stores: blobPathname, imageType (dropdown), location (relative placement text — Claude's discretion on freeform vs. predefined+freeform), optional notes, copyExact (bool — Claude's discretion on whether to infer from type or expose as toggle)
- **Labeled by type in prompt**: Each image preceded by explicit role binding in the prompt — "FLOOR PLAN:", "EXISTING SPACE:", "FURNITURE REFERENCE: [location text]" etc. NB2 is example-driven; explicit role binding is critical.
- **Copy vs. interpret**: Determined per image — Furniture/Fixture/Material references default to "replicate exactly"; Inspiration defaults to "apply style, not exact copy". Implementation approach (infer from type vs. per-image toggle) is Claude's discretion.
- **Luxury interior design persona**: System prompt prepends a persistent persona instruction anchoring Gemini as a luxury interior design visualization assistant with restraint, material realism, and editorial composition.
- **Per-session aspect ratio**: Liz chooses aspect ratio per session (16:9 / 1:1 / 4:3) — stored on renderingSession, not per-rendering.
- **Per-session style preset**: Dropdown or freeform field for design style (e.g., "quiet luxury", "modern European", "transitional") injected into the luxury template's Design Intent section.
- **No floor plan allowed**: Soft warning ("Results may be less spatially accurate without a floor plan") but generation proceeds. Some sessions are styling-focused, not layout-focused.
- **Prompt template hardcoded vs. configurable**: Claude's discretion.

### Luxury Prompt Template

The prompt builder uses a structured luxury rendering template with these sections:
1. **Preserve** — Lock architecture, layout, camera angle, lighting
2. **Design Intent** — Style preset injected here (quiet luxury, modern European, etc.)
3. **Primary Change** — Derived from Liz's description
4. **Reference Binding** — Per-image role assignment with copy/interpret instruction
5. **Placement & Composition** — Per-image location metadata injected here
6. **Scale & Proportion** — Always included to prevent sizing issues
7. **Material & Detail Fidelity** — Explicit material realism (avoids plastic/glossy look)
8. **Lighting & Atmosphere** — Soft, natural, diffused lighting with realistic shadow falloff
9. **Styling Restraint** — Anti-clutter instruction (critical for high-end feel)
10. **Color & Cohesion** — Harmonious palette, seamless integration
11. **Constraints** — "Do not modify [locked elements]", "Do not introduce clutter"
12. **Final Quality** — "Editorial-quality, cohesive, realistic, quietly luxurious"

Key NB2 prompting principles (from Paul's expert guidance):
- Name the role of each image explicitly ("base room" vs "reference item" vs "style reference")
- Tell it whether to copy or interpret per image
- Control scale + placement every time
- Lock what should not change
- Force integration realism (shadows, perspective, lighting)
- "Restraint" language prevents overdesign
- Material realism callouts avoid cheap/plastic look
- Editorial framing pushes composition quality

### Conversation & Refinement Flow

- **Previous output sent back**: Each refinement includes the last generated image + conversation text history. Gemini sees what it made and can edit from there.
- **Natural language refinements**: Liz types freeform (e.g., "make the sofa darker", "move the rug left"). System wraps her text with integration instructions ("maintain lighting, perspective, and all unchanged elements").
- **Composed prompt hidden**: Liz sees only her own text in the chat. Full composed prompt is internal — clean UX.
- **Unlimited refinement rounds**: No per-session limit. Every generation (initial + refinements) counts as 1 against the monthly allocation. Natural cost control via quota.
- **Mid-session image swaps**: Liz can upload new reference images during refinement. They get the same type/location metadata as wizard images. Powerful for iterative design.
- **AI text responses stored and displayed**: Gemini's text response (if any) saved in conversation history and shown as a message after the image. Adds context about what the AI did.
- **Thumbnail strip**: Session shows horizontal strip of all renderings. Click to view full-size. Phase 11 may add side-by-side compare.

### Error Handling & Retry Behavior

- **Content policy rejections**: Hint at the issue — "The AI flagged a potential issue with [content/imagery]. Try rephrasing or using different reference images." Gives Liz direction without exposing raw API errors.
- **API timeout/5xx**: Surface immediately with retry button. No silent auto-retries. "Generation failed. Tap to retry." Liz is always in control.
- **Partial failures**: Save what we have. If Gemini returned an image but Blob upload failed, store base64 temporarily and retry upload. Preserves expensive generation results.
- **Failed attempts visible**: Failed renderings show in the session's rendering list with an error badge. Liz can see what she tried and retry. Maintains history.
- **Pre-call validation**: Validate image inputs before calling Gemini — check that all referenced Blob pathnames exist and are valid image types. Fail fast with a clear message.
- **Error details storage**: Claude's discretion on permanent error log vs. transient status.
- **Output quality check**: Claude's discretion on basic sanity check (min dimensions/file size) vs. store as-is.

### Usage Tracking & Limits

- **Calendar month reset**: Usage resets on the 1st of each month. Matches renderingUsage document's "month" field (e.g., "2026-03").
- **Hard cap at monthly limit**: Session stays open when limit hit — Liz can browse existing renderings and promote Design Options, but generate/refine buttons disabled with clear message. Paul can bump renderingAllocation in siteSettings to unblock mid-month.
- **Same quota for scratchpad**: All generations count equally regardless of project link. One pool of credits.
- **Storage tracking from day one**: Record bytes stored per upload on renderingUsage or a separate document. Ready for platform billing even in V1.
- **Generation metadata stored per rendering**: modelId, latencyMs, inputTokens, outputTokens, cost estimate on each renderingOutput. Valuable for optimization and billing.
- **Graceful degradation if no API key**: Rendering tool visible in Studio but shows setup message: "AI Rendering not configured. Contact Paul." Liz knows the feature exists.

### Schema Design

- **Single typed image array**: inputs.images[] where each entry has { blobPathname, imageType (dropdown from siteSettings), location (text), notes (text), copyExact (bool) }. Replaces spec's separate floorPlan/spacePhotos/inspirationImages fields.
- **Single description field**: One freeform text area for Liz's vision. Prompt builder decomposes it + image metadata into the structured luxury template. Simplest UX.
- **Conversation entries include images**: Each conversation entry has an optional "image" field (Blob pathname). Model responses that include generated images link to them. Full history.
- **Per-session aspect ratio and style preset**: Both stored on renderingSession.
- **Image type dropdown configurable**: siteSettings.renderingImageTypes array. New types can be added without code deploys.
- **All 3 schemas in Phase 10**: renderingSession + designOption + renderingUsage all deployed together. Schema is stable before Phase 11 UI work.
- **Schema unit tests**: Follow existing project.test.ts / contractor.test.ts patterns.

### Designer Auth

- **STUDIO_API_SECRET shared secret**: x-studio-token header validated by API routes. sanityUserId passed in request body from useCurrentUser() hook. Claude's discretion on whether to also validate against Sanity Management API.
- **Exclude list for access control**: siteSettings.renderingExcludedUsers[] array — anyone NOT in the list can use the tool. Default: all Studio users have access.
- **Secret rotation**: Claude's discretion on single secret vs. dual-secret rotation.

### Promote-to-Design-Option Workflow

- **All API routes in Phase 10**: /api/rendering/promote and /api/rendering/react built alongside generate/refine/status/usage. Phase 11 is purely UI.
- **Caption optional**: Liz can promote quickly and add captions later.
- **Unpromote allowed**: Liz can remove a Design Option (deletes designOption document, clears isPromoted). Client loses access.
- **Full provenance stored**: designOption stores sourceSession (ref) + sourceRenderingIndex. Any Design Option traceable back to its generation context.
- **Auto chronological sort**: sortOrder assigned automatically based on promote time.
- **Scratchpad requires project on promote**: If session is scratchpad, promoting asks Liz to select a project. Design Option always has a project link.
- **Scratchpad sessions can be linked later**: A scratchpad session can be retroactively assigned to a project at any time.

### Blob Storage

- **Reuse existing blob-upload**: Same BlobFileInput component and /api/blob-upload route for wizard image uploads. No new upload infrastructure.
- **Blob path convention**: Claude's discretion on prefix structure (session-scoped, project+session-scoped, or flat with prefix).
- **Blob serve endpoint**: Claude's discretion on reusing /api/blob-serve vs. dedicated /api/rendering/image.
- **Promote image handling**: Claude's discretion on same reference (no copy) vs. copy-on-promote to separate path.
- **Keep everything**: No auto-deletion or retention policy. Storage is cheap. Liz may revisit old sessions months later.

### Testing Strategy

- **Dual mock strategy**: Unit tests use mocked Gemini client with fixture images. Preview deploys use RENDERING_TEST_MODE=true env flag that returns fixtures instead of calling Gemini. Real Gemini only in production or explicit e2e runs.
- **Schema tests**: Follow existing project.test.ts pattern — test validation rules, required fields, enum values, image type dropdown values, usage counter constraints.
- **Dedicated prompt builder tests**: Test that different image type combinations produce correctly structured prompts. Verify Preserve/Reference Binding/Placement sections are composed correctly from metadata.
- **Fixture image style**: Claude's discretion on realistic vs. clearly-marked placeholder.
- **E2E test script**: Claude's discretion on whether to include a scripts/test-rendering.ts.

### Vercel Plan

- **Upgrade to Vercel Pro**: Hobby plan's 10s timeout insufficient for waitUntil pattern (Gemini generation takes 10-30s). Pro plan ($20/mo, 60s timeout) approved.

### Claude's Discretion

- Blob path prefix convention
- Blob serve endpoint (reuse vs. dedicated)
- Promote image handling (reference vs. copy)
- Copy/interpret toggle (infer from type vs. per-image)
- Prompt template storage (hardcoded vs. configurable)
- Image location input UX (freeform vs. predefined+freeform)
- Error detail persistence (permanent log vs. transient status)
- Output quality sanity check (min dimensions vs. store as-is)
- Secret rotation approach (single vs. dual)
- sanityUserId validation depth (trust Studio vs. verify against Sanity API)
- Gemini model fallback strategy (fail with message vs. fallback chain)
- Fixture image style for test mode (realistic vs. watermarked placeholder)
- Whether to include E2E test script

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### AI rendering design spec (PRIMARY)
- `docs/superpowers/specs/2026-03-17-ai-rendering-design.md` — Complete design spec: data model, API routes, auth approach, Gemini integration, timeout/polling pattern, usage tracking, extractability. THE authoritative reference for Phase 10. CONTEXT.md decisions override spec where they differ (expanded image types, per-session aspect ratio, luxury prompt template).

### Existing Vercel Blob infrastructure
- `src/pages/api/blob-upload.ts` — Blob upload route with handleUpload pattern. Reuse for rendering wizard image uploads.
- `src/pages/api/blob-serve.ts` — Session-authenticated Blob serve proxy. Pattern for serving generated images.
- `src/sanity/components/BlobFileInput.tsx` — Sanity Studio file upload component using Vercel Blob. Reuse in Phase 11 wizard.

### Sanity write client
- `src/sanity/writeClient.ts` — Server-side Sanity client with write token. Used by API routes to create/update documents.

### Existing API route patterns
- `src/pages/api/notify-artifact.ts` — GROQ fetch → business logic → Resend email → Sanity document update pattern. Reference for rendering API route structure.
- `src/pages/api/send-update.ts` — Another API route with GROQ + Resend + document logging pattern.

### Session and auth infrastructure
- `src/lib/session.ts` — createSession/getSession/clearSession with Redis. Client-facing routes use this for portal auth.
- `src/middleware.ts` — Route protection, role-based routing, context.locals injection.

### Sanity schema patterns
- `src/sanity/schemas/project.ts` — Project schema with inline arrays, field groups, engagement type gating, hidden callbacks. Pattern for renderingSession schema.
- `src/sanity/schemas/contractor.ts` — Document type pattern (separate from project). Pattern for designOption document type.
- `src/sanity/schemas/siteSettings.ts` — Singleton pattern. Extend with renderingAllocation, renderingImageTypes[], renderingExcludedUsers[].
- `src/sanity/schemas/index.ts` — Schema registry. Add renderingSession, designOption, renderingUsage.

### Schema test patterns
- `src/sanity/schemas/project.test.ts` — Schema validation unit tests. Follow for rendering schema tests.
- `src/sanity/schemas/contractor.test.ts` — Another schema test reference.

### GROQ query patterns
- `src/sanity/queries.ts` — Existing queries with parameterized constants + async wrapper functions. Add rendering queries.

### Studio configuration
- `sanity.config.ts` — Document actions registration, structureTool configuration, plugins array for custom tools. Phase 10 registers schemas; Phase 11 adds custom tool plugin.

### Design system
- `src/styles/global.css` — Color tokens (cream #FAF8F5, terracotta #C4836A, charcoal #2C2926, stone #8A8478), typography. Consistent across all UI.

### Planning
- `.planning/REQUIREMENTS.md` — Phase 10 requirements: RNDR-01, RNDR-02, RNDR-03, RNDR-06, RNDR-07
- `.planning/ROADMAP.md` — Phase 10 success criteria, dependency on Phase 9
- `.planning/phases/07-schema-extensions-multi-role-auth-and-document-storage/07-CONTEXT.md` — Phase 7 decisions: Vercel Blob setup, BlobFileInput, blob-serve proxy, multi-role session architecture
- `.planning/phases/09-send-update-investment-proposals-and-public-site-polish/09-CONTEXT.md` — Phase 9 decisions: document action patterns, branded email, Sanity inline array patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BlobFileInput.tsx`: Sanity Studio file upload to Vercel Blob — reuse for rendering wizard image uploads in Phase 11
- `blob-upload.ts` / `blob-serve.ts`: Blob upload and authenticated serve routes — reuse for rendering images
- `sanityWriteClient.ts`: Server-side Sanity client with write token — used by all rendering API routes to create/update documents
- `session.ts`: Session helpers — client-facing /api/rendering/react uses existing portal auth
- `generateToken.ts`: Crypto token generation — reuse for any unique IDs needed

### Established Patterns
- API route structure: validate auth → fetch data via GROQ → business logic → write back to Sanity → return response
- Document actions: Sanity Studio component → API route → external service → log on document (3 existing examples)
- Sanity inline arrays on documents: milestones[], procurement[], artifacts[], updateLog[] — same pattern for renderings[], conversation[], inputs.images[]
- Schema hidden callbacks: `hidden: ({ parent }) => condition` — for engagement type gating and commercial toggle
- siteSettings singleton: global configuration (heroSlideshow, renderingAllocation, renderingImageTypes, etc.)
- Test patterns: Vitest with schema validation tests, mock-based unit tests for API routes
- Financial values as integer cents: consistent with procurement pattern (for cost estimates on renderingOutput)

### Integration Points
- `src/sanity/schemas/renderingSession.ts`: NEW document type
- `src/sanity/schemas/designOption.ts`: NEW document type
- `src/sanity/schemas/renderingUsage.ts`: NEW document type
- `src/sanity/schemas/siteSettings.ts`: extend with renderingAllocation, renderingImageTypes[], renderingExcludedUsers[]
- `src/sanity/schemas/index.ts`: register 3 new types, hide from default document list
- `src/sanity/queries.ts`: add rendering session, design option, and usage queries
- `src/pages/api/rendering/generate.ts`: NEW — core generation endpoint
- `src/pages/api/rendering/refine.ts`: NEW — conversational refinement endpoint
- `src/pages/api/rendering/status.ts`: NEW — polling endpoint
- `src/pages/api/rendering/usage.ts`: NEW — usage counter endpoint
- `src/pages/api/rendering/promote.ts`: NEW — promote to Design Option
- `src/pages/api/rendering/react.ts`: NEW — client favorites/comments
- `src/lib/promptBuilder.ts`: NEW — structured luxury prompt template assembler
- `src/lib/geminiClient.ts`: NEW — Gemini API wrapper (model call, response parsing, image extraction)

</code_context>

<specifics>
## Specific Ideas

- NB2 is example-driven, not instruction-driven when reference images are present — explicit role binding per image is critical
- The luxury prompt template's "restraint" language, material realism callouts, and editorial framing are what push output from generic AI to Architectural Digest / Restoration Hardware quality
- "Styling Restraint" and "do not introduce clutter" instructions are critical for high-end feel — without them NB2 over-decorates
- Paul offered to craft a bespoke prompt from an actual Liz project during implementation — tune the luxury template against real La Sprezzatura projects for best results
- Image types should distinguish "existing space" (what's there now) vs. "new/future" (what we want it to become) — the type dropdown handles this (Existing Space Photo vs. Inspiration/Furniture Reference/etc.)
- Relative location per image (e.g., "left wall near window") maps directly to the Placement & Composition section of the luxury template
- Scratchpad sessions support explore-first-organize-later workflow — Liz can assign to a project retroactively

</specifics>

<deferred>
## Deferred Ideas

- **Credit purchasing / overage billing**: When monthly limit is hit, allow buying extra credit blocks. Requires Stripe integration — deferred to Linha platform extraction.
- **Aspect ratio selector in wizard UI**: Per-session aspect ratio is in the schema (Phase 10), selector UI is Phase 11.
- **Side-by-side rendering comparison**: Thumbnail strip for V1; side-by-side compare view is a Phase 11 enhancement.
- **Slideshow navigation controls on hero**: Explicitly out of scope per hero slideshow spec.
- **Per-designer billing dashboard**: Usage tracking data is captured from day one, but billing UI/Stripe integration deferred to Linha.
- **Prompt template tuning UI**: If prompt template is hardcoded, a future enhancement could expose it in siteSettings.
- **Batch generation**: Generate multiple renderings from one prompt (e.g., "show me 3 variations"). Future enhancement.

</deferred>

---

*Phase: 10-ai-rendering-engine*
*Context gathered: 2026-03-17*

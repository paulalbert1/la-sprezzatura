# AI Rendering Feature — Design Spec

**Date:** 2026-03-17
**Status:** Approved
**Approach:** B — Studio Tool + API Service Layer

## Overview

A guided AI rendering tool for interior designers, integrated as a Sanity Studio custom tool. Designers upload floor plans, space photos, and inspiration images, then generate photorealistic room renderings using Nano Banana 2 (Google Gemini 3.1 Flash Image API). A step-by-step wizard handles initial input collection, followed by a conversational refinement interface for iteration. Selected renderings are promoted as "Design Options" and surfaced to clients in a dedicated portal gallery where they can favorite and comment.

Built in la-sprezzatura for Liz as the first user, designed to be extractable to a multi-tenant designer platform later.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Sanity Studio custom tool (not standalone page) | Keeps designer in their existing workspace; improves app prestige |
| API service layer for generation logic | Matches existing patterns (notifyClient, blob upload); keeps API key server-side; extractable to platform |
| 1K resolution only | Sufficient for screen viewing; keeps cost (~$0.07/image) and storage manageable |
| Vercel Blob for image storage | Already set up from Phase 7; signed URLs for access control |
| Nano Banana 2 (Gemini image generation model) | Pro-level quality at Flash speed; strong spatial/architectural understanding; up to 14 reference images. Model ID may change — configured via `GEMINI_IMAGE_MODEL` env var, currently `gemini-3.1-flash-image-preview` |
| Designer-only tool | Clients never see the generation process — only promoted Design Options |
| Project-linked by default, scratchpad available | Most renderings are project-scoped; scratchpad for exploratory work |
| Confidentiality notice adapts to isCommercial | Residential: "household" / Commercial: "organization" |

## Data Model

### renderingSession (Sanity document type)

Container for a single generation workflow.

| Field | Type | Description |
|-------|------|-------------|
| `project` | reference (project) | Linked project (null for scratchpad sessions) |
| `sanityUserId` | string | Sanity user ID of the designer who created the session (from Studio auth context) |
| `title` | string | User-given name, e.g. "Living Room Exploration" |
| `status` | string enum | `draft` \| `generating` \| `complete` \| `error` |
| `inputs` | object | See Inputs object below |
| `conversation` | array of objects | `{ role, message, timestamp }` — refinement chat history |
| `renderings` | array of renderingOutput | Embedded output objects |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### Inputs object (embedded in renderingSession)

| Field | Type | Description |
|-------|------|-------------|
| `floorPlan` | string (Blob pathname) | Floor plan file via BlobFileInput |
| `spacePhotos` | array of strings | Existing space photos (Blob pathnames) |
| `inspirationImages` | array of strings | Furniture/material/fixture images (Blob pathnames), max 10 |
| `description` | text | Designer's text prompt describing the vision |

### renderingOutput (object type, embedded in renderingSession)

| Field | Type | Description |
|-------|------|-------------|
| `image` | string (Blob pathname) | Generated 1K image |
| `prompt` | text | Exact prompt that produced this image (for reproducibility) |
| `isPromoted` | boolean | Designer flagged as client-facing option |
| `generatedAt` | datetime | |

### designOption (Sanity document type)

Client-facing document created when a rendering is promoted.

| Field | Type | Description |
|-------|------|-------------|
| `project` | reference (project) | |
| `image` | string (Blob pathname) | Copied reference from renderingOutput (no image duplication) |
| `caption` | text | Designer-written description for the client |
| `favoritedBy` | array of strings | Client IDs who favorited this option |
| `comments` | array of objects | `{ clientId, text, timestamp }` |
| `sortOrder` | number | Gallery ordering |

### renderingUsage (Sanity document type)

Per-designer per-month usage tracking.

| Field | Type | Description |
|-------|------|-------------|
| `sanityUserId` | string | Sanity user ID of the designer |
| `month` | string | e.g. "2026-03" |
| `count` | number | Total generations this month |
| `limit` | number | Monthly allocation (copied from siteSettings at month creation) |

The `siteSettings` singleton gets a new field:
- `renderingAllocation` (number, default: 50) — monthly image generation limit for this instance

## API Routes

All routes use existing auth middleware. Studio-facing routes validate designer session; the react route validates client session.

### POST /api/rendering/generate

Core generation endpoint.

- **Input:** session ID, prompt text, selected input image IDs
- **Process:** validate usage quota → fetch input images from Blob → base64 encode → call Gemini API (`responseModalities: ["TEXT", "IMAGE"]`, 1K resolution) → save output image to Vercel Blob → update renderingSession document → increment renderingUsage
- **Output:** generated image URL + updated session
- **Error handling:** failed generations do not increment usage counter
- **Auth:** designer session required

### POST /api/rendering/refine

Conversational iteration endpoint.

- **Input:** session ID, refinement text, optional image swaps
- **Process:** same as generate but sends multi-turn context (previous prompt + conversation history + refinement instruction) to Gemini
- **Output:** new rendering + updated conversation
- **Auth:** designer session required

### POST /api/rendering/promote

Promote a rendering to Design Options.

- **Input:** session ID, rendering index, caption text
- **Process:** create `designOption` document → copy Blob reference (no image duplication) → set `isPromoted` on renderingOutput
- **Output:** new designOption document ID
- **Auth:** designer session required

### POST /api/rendering/react

Client favorites/comments on a design option.

- **Input:** designOption ID, action (`favorite` toggle or comment text)
- **Process:** validate client session → verify client's `entityId` is linked to the designOption's project → toggle favoritedBy[] or append to comments[]
- **Output:** updated designOption
- **Auth:** client session required (existing portal auth) + project ownership check

### GET /api/rendering/usage

Usage counter data for Studio UI.

- **Input:** designer ID (from session)
- **Output:** `{ count, limit, remaining, month }`
- **Auth:** designer session required

## Sanity Studio Custom Tool

### Navigation

Appears in the Studio sidebar after Contractors (following existing placement pattern).

### Sessions List View

- All rendering sessions for the current designer
- Filterable by project
- Usage counter badge in header: "12 / 50 remaining"
- Counter color: green (>50% remaining), amber (10-50%), red (<10%)
- "New Session" button

### Wizard Mode (new sessions)

Four steps with a progress indicator:

**Step 1 — Project & Floor Plan**
- Project selector dropdown (or "Scratchpad" option)
- Floor plan upload via BlobFileInput (reuses Phase 7 component)
- Inline tip: "For best results, use a clean digital floor plan. Hand sketches work but may produce less accurate spatial layouts."
- Example thumbnails showing good vs. marginal floor plan quality

**Step 2 — Existing Space**
- Upload photos of the current space (optional)
- Inline tip: "Include multiple angles. The AI uses these to match lighting and room proportions."

**Step 3 — Inspiration**
- Upload furniture, material, fixture images
- Drag-and-drop, up to 10 images (Gemini's object reference limit)
- Inline tip: "Upload specific items you're considering. The AI will try to place them in the space."

**Step 4 — Describe Your Vision**
- Text area with prompt guidance
- Sample prompts as clickable chips:
  - "Modern minimalist living room with warm oak floors and natural light"
  - "Luxurious master bedroom, velvet textures, brass accents, moody lighting"
- Inline tip: "Mention style, mood, materials, and lighting. Be specific about what matters most."

Generate button at bottom with estimated cost badge.

### Refinement Mode (after first generation)

- Generated image displayed prominently
- Chat-style interface below for refinement instructions
- Thumbnail strip of all renderings in this session
- Each rendering has a "Promote to Design Options" button with caption field
- Star icon on promoted renderings

### Inline Help

All tips and examples are contextual — shown next to the relevant input within the wizard steps. No separate documentation page. Sample prompts are clickable to populate the text area.

## Client Portal — Design Options Gallery

### Placement

New section on the project detail page. Only visible when the project has promoted design options. Confidentiality notice adapts based on `project.isCommercial`:
- Residential: "These design options are prepared exclusively for your project. Please do not share outside your household."
- Commercial: "These design options are prepared exclusively for your project. Please do not share outside your organization."

### Gallery Layout

- Grid of rendering thumbnails: 2-up on mobile, 3-up on desktop
- Click to expand into lightbox view (reuses existing portfolio lightbox pattern from Phase 2)
- Designer's caption shown below each image

### Client Interactions

- Heart/favorite toggle on each option — filled heart when favorited
- Favorites count visible on the thumbnail grid
- Comment input below each expanded image — text field + submit
- Comments show client name + timestamp, most recent first

### Privacy

- Only promoted renderings are visible — clients never see the rendering session, wizard, iteration history, or unpromoted outputs
- Session-authenticated Blob proxy for images (same `blob-serve` pattern as Phase 7 documents)

## Usage Tracking & Cost Control

### Monthly Allocation

- Each designer has a `renderingAllocation` field (default: 50 images/month)
- `renderingUsage` document tracks per-designer per-month counts

### Counter UX

- Persistent badge in rendering tool header: "12 / 50 remaining"
- Color: green (>50%), amber (10-50%), red (<10%)
- At 0 remaining: hard stop, generation blocked. Message: "You've reached your monthly rendering limit. Contact Paul to increase your allocation."

### Server-Side Enforcement

- `/api/rendering/generate` and `/api/rendering/refine` check usage before calling Gemini
- Usage incremented atomically after successful generation (failed generations don't count)
- No client-side bypass possible

### Billing

- V1: hard cap at monthly limit. Liz's allocation is set in `siteSettings`. No overage billing — just a hard stop.
- Future (platform extraction): add overage tracking, Stripe integration, per-designer billing against the same `renderingUsage` documents.

## Technical Notes

### Designer Authentication

Sanity Studio custom tools run in the browser with the designer already authenticated via Sanity's built-in auth. The rendering API routes need to verify these requests come from a legitimate Studio user.

**Approach:** Shared secret between Studio and API routes (same pattern as the existing `blob-upload` and `send-work-order-access` routes, which trust Studio requests).

- Studio tool sends requests to `/api/rendering/*` with a `x-studio-token` header containing a secret shared via environment variable (`STUDIO_API_SECRET`)
- API routes validate the token before processing
- The Sanity user ID is passed in the request body (Studio tool reads it from `useCurrentUser()` hook) and stored on documents as `sanityUserId`
- Client-facing routes (`/api/rendering/react`) use the existing portal session auth — no change needed

This is adequate for V1 (single-tenant, Liz is the only Studio user). For multi-tenant extraction, replace with per-designer API tokens or Sanity's auth token forwarding.

### Schema Registration

Three new document types (`renderingSession`, `designOption`, `renderingUsage`) must be:
- Added to `src/sanity/schemas/index.ts` in the `schemaTypes` export
- Hidden from the default document list in `structureTool` configuration (managed exclusively through the custom tool, not browsable in the sidebar)

The custom tool is registered in `sanity.config.ts` via the `plugins` array on `defineConfig`, after `structureTool`. It appears in the Studio top nav bar.

### Gemini API Integration

- Model: configurable via `GEMINI_IMAGE_MODEL` env var, default `gemini-3.1-flash-image-preview` (Nano Banana 2). If model ID changes or a fallback is needed, only the env var needs updating.
- Auth: `GEMINI_API_KEY` environment variable, server-side only
- Request: `generateContent` with `responseModalities: ["TEXT", "IMAGE"]`, `imageConfig: { imageSize: "1K" }`
- Aspect ratio: 16:9 default for V1 (deliberate simplification — interior room views are predominantly landscape). Future enhancement: add aspect ratio selector to wizard.
- Input images: base64-encoded inline data (PNG/JPEG/WebP)
- Output: response may include both text and image parts. Parser extracts the image part (base64 `inline_data`), decodes it, uploads to Vercel Blob. Text part (if any) is stored in the conversation history for context.
- Multi-turn: conversation history sent as alternating user/model content parts

### Timeout & Error Handling

Image generation can take 10-30 seconds. Vercel serverless functions have a default 10s timeout (Hobby) or 60s (Pro).

**Approach:** Polling pattern.

1. Client (Studio tool) calls `POST /api/rendering/generate`
2. API route validates inputs and usage, sets `renderingSession.status` to `generating`, enqueues the Gemini call, and returns immediately with `{ status: "generating", sessionId }`
3. The Gemini call runs in a background-compatible way (Vercel `waitUntil` from `@vercel/functions` to extend execution after response)
4. Studio tool polls `GET /api/rendering/status?sessionId=X` every 2 seconds until status flips to `complete` or `error`
5. On success: status becomes `complete`, new rendering is appended to session
6. On error: status becomes `error` with message. Usage counter is not incremented.

**Error cases:**
- Gemini content policy rejection → store error message, surface in Studio UI: "The AI couldn't generate this image. Try adjusting your prompt."
- Gemini API timeout/5xx → store error, allow retry without counting against usage
- Rate limit (429) → surface "Generation service is busy. Please try again in a moment."

### Extractability

Designed for future extraction to a multi-tenant designer platform:
- All generation logic lives in API routes (not Studio components)
- Usage tracking is per-designer with document-level isolation
- Blob storage uses designer-scoped path prefixes
- No La Sprezzatura-specific branding in the rendering tool or API layer
- Sanity multi-dataset architecture (one dataset per designer) is the planned multi-tenant model

### Floor Plan Quality

The wizard accepts any format (hand sketches, CAD exports, photos of printed plans, digital floor plans). Inline tips guide the designer toward better inputs but do not block generation for low-quality inputs. Quality validation is deferred to empirical testing — if certain input types consistently produce poor results, warnings can be added to specific upload steps.

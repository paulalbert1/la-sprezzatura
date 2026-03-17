# Phase 10: AI Rendering Engine - Research

**Researched:** 2026-03-17
**Domain:** Gemini image generation API, Vercel serverless background processing, Sanity schema design, Vercel Blob storage
**Confidence:** HIGH

## Summary

Phase 10 builds the complete server-side AI rendering pipeline: 3 new Sanity schemas (renderingSession, designOption, renderingUsage), 6 API routes (generate, refine, status, usage, promote, react), a structured luxury prompt builder, Gemini API integration via the `@google/genai` SDK, and Vercel Blob storage for generated images. The architecture follows established project patterns (Astro API routes with GROQ fetch, Sanity write client, BlobFileInput, session auth) while adding new capabilities: waitUntil-based background processing for long-running Gemini calls and a multi-turn conversation model for iterative refinement.

The primary technical challenges are: (1) integrating the `@google/genai` SDK for image generation with `responseModalities: ["TEXT", "IMAGE"]`, (2) using Vercel `waitUntil` to handle 10-30s Gemini generation without function timeout, (3) designing the structured luxury prompt template that assembles per-image metadata into effective NB2 prompts, and (4) implementing atomic usage tracking that only increments on successful generation. All API routes are testable via HTTP before the Studio UI exists (Phase 11).

**Primary recommendation:** Use `@google/genai` (v1.45.0) with `ai.models.generateContent()` for initial generation and `ai.chats.create()` for multi-turn refinement. Configure Vercel adapter with `maxDuration: 60` and use `waitUntil` from `@vercel/functions` (already installed as transitive dep v3.4.3) for background Gemini processing. Follow existing schema test patterns (Vitest) for all 3 new schemas and add dedicated prompt builder unit tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Structured prompt builder**: API route auto-assembles luxury interior rendering template from image metadata + freeform description. 12-section luxury template with Preserve, Design Intent, Primary Change, Reference Binding, Placement & Composition, Scale & Proportion, Material & Detail Fidelity, Lighting & Atmosphere, Styling Restraint, Color & Cohesion, Constraints, Final Quality.
- **Single typed image array**: inputs.images[] with { blobPathname, imageType (dropdown from siteSettings), location (text), notes (text), copyExact (bool) }
- **Single description field**: One freeform text area; prompt builder decomposes it + image metadata into structured template
- **Per-session aspect ratio**: Liz chooses aspect ratio per session (16:9 / 1:1 / 4:3)
- **Per-session style preset**: Dropdown or freeform for design style injected into luxury template
- **Image type dropdown configurable**: siteSettings.renderingImageTypes array (Floor Plan, Existing Space Photo, Inspiration, Material/Finish Sample, Furniture Reference, Fixture Reference, Custom)
- **Previous output sent back for refinement**: Each refinement includes last generated image + conversation text history
- **Natural language refinements**: System wraps Liz's text with integration instructions
- **AI text responses stored and displayed**: Gemini text response saved in conversation history
- **Unlimited refinement rounds**: Every generation counts 1 against monthly allocation
- **Mid-session image swaps**: New reference images during refinement with same metadata
- **Content policy rejections**: Hint at issue, give direction without raw API errors
- **API timeout/5xx**: Surface immediately with retry button, no silent auto-retries
- **Partial failures**: Save what we have (base64 temp if Blob upload fails)
- **Failed attempts visible**: Show with error badge in session rendering list
- **Pre-call validation**: Check Blob pathnames exist before calling Gemini
- **Calendar month reset**: Usage resets on 1st, matches "2026-03" format
- **Hard cap at monthly limit**: Session stays open for browsing but generate/refine disabled
- **Same quota for scratchpad**: All generations count equally
- **Storage tracking from day one**: Record bytes stored per upload
- **Generation metadata stored**: modelId, latencyMs, inputTokens, outputTokens, cost estimate per rendering
- **Graceful degradation if no API key**: Show setup message
- **STUDIO_API_SECRET shared secret**: x-studio-token header, sanityUserId in request body
- **Exclude list for access control**: siteSettings.renderingExcludedUsers[]
- **All 6 API routes in Phase 10**: generate, refine, status, usage, promote, react
- **Caption optional on promote**: Liz can add later
- **Unpromote allowed**: Deletes designOption document, clears isPromoted
- **Full provenance**: designOption stores sourceSession + sourceRenderingIndex
- **Auto chronological sort**: sortOrder assigned on promote time
- **Scratchpad requires project on promote**: Must select project
- **Reuse existing blob-upload**: Same BlobFileInput and /api/blob-upload for wizard uploads
- **Keep everything**: No auto-deletion or retention policy
- **Dual mock strategy**: Unit tests use mocked Gemini client; RENDERING_TEST_MODE=true returns fixtures
- **Schema tests**: Follow existing project.test.ts / contractor.test.ts patterns
- **Dedicated prompt builder tests**: Test image type combinations produce correct prompts
- **Upgrade to Vercel Pro**: Approved ($20/mo, 60s timeout)
- **All 3 schemas in Phase 10**: renderingSession + designOption + renderingUsage deployed together
- **Luxury persona system prompt**: Persistent instruction anchoring Gemini as luxury interior design visualization assistant
- **NB2 prompting principles**: Name image roles explicitly, tell copy vs interpret, control scale + placement, lock unchanged elements, force integration realism, restraint language, material realism callouts, editorial framing

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

### Deferred Ideas (OUT OF SCOPE)
- Credit purchasing / overage billing (Stripe integration deferred to Linha)
- Aspect ratio selector in wizard UI (Phase 11)
- Side-by-side rendering comparison (Phase 11)
- Per-designer billing dashboard (deferred to Linha)
- Prompt template tuning UI
- Batch generation (multiple renderings from one prompt)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RNDR-01 | Liz can create a rendering session in Sanity Studio linked to a project (or as scratchpad), uploading floor plan, space photos, and inspiration images through a guided 4-step wizard | renderingSession schema with project ref (nullable for scratchpad), single typed images[] array with imageType dropdown from siteSettings, BlobFileInput reuse for uploads. Schema deployed in Phase 10; wizard UI is Phase 11. |
| RNDR-02 | Liz generates a photorealistic 1K room rendering by describing her design vision -- the AI uses uploaded inputs to produce the image | @google/genai SDK with ai.models.generateContent(), responseModalities: ["TEXT", "IMAGE"], imageConfig: { imageSize: "1K" }, structured luxury prompt builder assembling 12-section template from image metadata + description, Vercel Blob put() for output storage |
| RNDR-03 | Liz refines a rendering through a conversational chat interface -- each refinement produces a new version while preserving the full session history | @google/genai ai.chats.create() for multi-turn context, conversation[] array on renderingSession, previous output image sent back as inline_data, natural language wrapping with integration instructions |
| RNDR-06 | Studio shows a persistent usage counter and blocks generation at the monthly limit | renderingUsage document per designer per month, GET /api/rendering/usage returns count/limit/remaining, POST generate/refine returns 403 when limit reached, siteSettings.renderingAllocation field |
| RNDR-07 | Per-designer monthly generation counts are tracked for billing and cost control | renderingUsage document with sanityUserId + month ("2026-03") + count + limit, atomic increment only on successful generation, storage bytes tracked, generation metadata (modelId, latencyMs, tokens, cost) stored per rendering |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/genai` | 1.45.0 | Gemini API client for image generation | Official Google Gen AI SDK (replaces legacy @google/generative-ai). Unified access to Gemini models including image generation via generateContent with responseModalities. |
| `@vercel/functions` | 3.4.3 | waitUntil for background processing | Already installed as transitive dep. Extends function lifetime for Gemini calls after returning immediate response. |
| `@vercel/blob` | 2.3.1 | Image storage (put/get) | Already installed. Server-side put() for storing Gemini output images; get() via existing blob-serve pattern for retrieval. |
| `sanity` | 5.16.0 | Schema definitions and Studio framework | Already installed. defineType/defineField for 3 new document types. |
| `@sanity/client` | 7.17.0 | Server-side document CRUD | Already installed. sanityWriteClient for create/patch/fetch in API routes. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 3.2.4 | Unit tests for schemas, prompt builder, API routes | Already installed. Follow existing test patterns. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@google/genai` | `@google/generative-ai` (legacy) | Legacy package, no longer maintained. @google/genai is the unified SDK. |
| `@google/genai` | Vercel AI SDK `@ai-sdk/google` | Adds abstraction layer; we need direct control over responseModalities and imageConfig for image generation. |
| `waitUntil` | Vercel queues / QStash | Over-engineered for this use case; waitUntil is sufficient with Pro plan 60s timeout. |

**Installation:**
```bash
npm install @google/genai @vercel/functions
```

Note: `@vercel/functions` is already available as a transitive dependency (v3.4.3) but should be added as a direct dependency for reliability. `@vercel/blob` and `sanity` are already direct dependencies.

**Version verification:**
- `@google/genai`: 1.45.0 (verified via npm view 2026-03-17)
- `@vercel/functions`: 3.4.3 (verified via npm view 2026-03-17)
- `@vercel/blob`: 2.3.1 (already in package.json)

## Architecture Patterns

### Recommended Project Structure
```
src/
  sanity/
    schemas/
      renderingSession.ts       # NEW: rendering session document type
      renderingSession.test.ts   # NEW: schema validation tests
      designOption.ts            # NEW: promoted design option document type
      designOption.test.ts       # NEW: schema validation tests
      renderingUsage.ts          # NEW: per-designer per-month usage tracking
      renderingUsage.test.ts     # NEW: schema validation tests
      siteSettings.ts            # EXTEND: +renderingAllocation, +renderingImageTypes[], +renderingExcludedUsers[]
      index.ts                   # EXTEND: register 3 new types
    queries.ts                   # EXTEND: add rendering GROQ queries
  lib/
    promptBuilder.ts             # NEW: structured luxury prompt template assembler
    promptBuilder.test.ts        # NEW: prompt composition tests
    geminiClient.ts              # NEW: Gemini API wrapper (generate, parse, extract image)
    geminiClient.test.ts         # NEW: mocked Gemini client tests
    renderingAuth.ts             # NEW: STUDIO_API_SECRET validation + exclude list check
    renderingAuth.test.ts        # NEW: auth helper tests
  pages/
    api/
      rendering/
        generate.ts              # NEW: core generation endpoint
        refine.ts                # NEW: conversational refinement endpoint
        status.ts                # NEW: polling endpoint
        usage.ts                 # NEW: usage counter endpoint
        promote.ts               # NEW: promote to Design Option
        react.ts                 # NEW: client favorites/comments
```

### Pattern 1: API Route Structure (Established Pattern)
**What:** Validate auth -> fetch data via GROQ -> business logic -> write back to Sanity -> return response
**When to use:** All 6 rendering API routes
**Example:**
```typescript
// Source: existing send-update.ts / notify-artifact.ts patterns
export const prerender = false;
import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../../sanity/writeClient";

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const token = request.headers.get("x-studio-token");

    // 2. Auth check
    if (token !== import.meta.env.STUDIO_API_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 3. GROQ fetch
    const session = await sanityWriteClient.fetch(
      `*[_type == "renderingSession" && _id == $sessionId][0]{ ... }`,
      { sessionId: body.sessionId }
    );

    // 4. Business logic
    // ... generate, refine, promote, etc.

    // 5. Write back to Sanity
    await sanityWriteClient.patch(session._id).set({ ... }).commit();

    // 6. Return response
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("[Rendering] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};
```

### Pattern 2: waitUntil for Background Gemini Processing
**What:** Return immediate response with "generating" status, process Gemini call in background, poll for completion
**When to use:** generate and refine endpoints where Gemini calls take 10-30s
**Example:**
```typescript
// Source: https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package
import { waitUntil } from "@vercel/functions";

export const POST: APIRoute = async ({ request }) => {
  // 1. Validate inputs, check usage quota
  // 2. Create/update session with status: "generating"
  await sanityWriteClient.patch(sessionId).set({ status: "generating" }).commit();

  // 3. Enqueue background Gemini call via waitUntil
  waitUntil(
    processGeneration(sessionId, prompt, images)
      .catch((error) => {
        // Update session status to "error" on failure
        sanityWriteClient.patch(sessionId)
          .set({ status: "error", lastError: error.message })
          .commit();
      })
  );

  // 4. Return immediately
  return new Response(JSON.stringify({ status: "generating", sessionId }), {
    status: 202, headers: { "Content-Type": "application/json" }
  });
};
```

### Pattern 3: Gemini Image Generation with @google/genai
**What:** Call Gemini to generate images with multi-image input and structured prompt
**When to use:** Core of generate and refine endpoints
**Example:**
```typescript
// Source: https://ai.google.dev/gemini-api/docs/image-generation
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initial generation with reference images
const response = await ai.models.generateContent({
  model: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview",
  contents: [{
    role: "user",
    parts: [
      // System-level luxury persona (prepended)
      { text: LUXURY_PERSONA_PROMPT },
      // Reference images with role bindings
      { inlineData: { mimeType: "image/jpeg", data: floorPlanBase64 } },
      { text: "FLOOR PLAN: Use this as the spatial layout reference." },
      { inlineData: { mimeType: "image/jpeg", data: furnitureBase64 } },
      { text: "FURNITURE REFERENCE [left wall near window]: Replicate this piece exactly." },
      // Assembled luxury template prompt
      { text: assembledPrompt }
    ]
  }],
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      imageSize: "1K",
      aspectRatio: session.aspectRatio || "16:9"
    }
  }
});

// Extract image from response
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const buffer = Buffer.from(part.inlineData.data, "base64");
    // Upload to Vercel Blob
    const blob = await put(`rendering/${sessionId}/${Date.now()}.png`, buffer, {
      access: "private",
      contentType: "image/png",
    });
    return blob.pathname;
  }
}
```

### Pattern 4: Multi-Turn Refinement with Chat API
**What:** Use Gemini chat sessions for iterative refinement with full context
**When to use:** Refine endpoint
**Example:**
```typescript
// Source: https://ai.google.dev/gemini-api/docs/image-generation (multi-turn)
// Note: For refinement, we reconstruct the conversation history manually
// by sending the full contents array rather than using ai.chats.create(),
// because we need to persist state across separate HTTP requests.

const contents = [];

// 1. Original user message (from session.conversation)
contents.push({
  role: "user",
  parts: [
    ...originalImageParts,  // All reference images
    { text: originalAssembledPrompt }
  ]
});

// 2. Model response (previous generation)
contents.push({
  role: "model",
  parts: [
    { inlineData: { mimeType: "image/png", data: previousOutputBase64 } },
    ...(previousTextResponse ? [{ text: previousTextResponse }] : [])
  ]
});

// 3. New refinement request
contents.push({
  role: "user",
  parts: [
    // Include any new reference images from mid-session swaps
    ...newImageParts,
    { text: `Refine the rendering: ${refinementText}. Maintain all unchanged elements, lighting consistency, and perspective accuracy.` }
  ]
});

const response = await ai.models.generateContent({
  model: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview",
  contents,
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { imageSize: "1K", aspectRatio: session.aspectRatio || "16:9" }
  }
});
```

### Pattern 5: Sanity Schema with Inline Arrays (Established Pattern)
**What:** Document types with embedded object arrays, field groups, hidden callbacks
**When to use:** renderingSession (renderings[], conversation[], inputs.images[])
**Example:**
```typescript
// Source: existing project.ts schema pattern
import { defineType, defineField, defineArrayMember } from "sanity";

export const renderingSession = defineType({
  name: "renderingSession",
  title: "Rendering Session",
  type: "document",
  fields: [
    defineField({
      name: "project",
      title: "Project",
      type: "reference",
      to: [{ type: "project" }],
      // null for scratchpad sessions
    }),
    defineField({
      name: "renderings",
      title: "Renderings",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "renderingOutput",
          fields: [
            defineField({ name: "image", title: "Image", type: "string" }),
            defineField({ name: "prompt", title: "Prompt", type: "text" }),
            defineField({ name: "isPromoted", title: "Promoted", type: "boolean", initialValue: false }),
            defineField({ name: "generatedAt", title: "Generated At", type: "datetime" }),
            defineField({ name: "modelId", title: "Model ID", type: "string" }),
            defineField({ name: "latencyMs", title: "Latency (ms)", type: "number" }),
            defineField({ name: "inputTokens", title: "Input Tokens", type: "number" }),
            defineField({ name: "outputTokens", title: "Output Tokens", type: "number" }),
            defineField({ name: "costEstimate", title: "Cost Estimate (cents)", type: "number", validation: (r) => r.integer().min(0) }),
            defineField({ name: "status", title: "Status", type: "string", options: { list: [...] } }),
            defineField({ name: "errorMessage", title: "Error Message", type: "string" }),
          ],
        }),
      ],
    }),
    // ... more fields
  ],
});
```

### Pattern 6: Server-Side Blob Upload
**What:** Upload generated image buffer directly to Vercel Blob from API route
**When to use:** After Gemini returns a generated image
**Example:**
```typescript
// Source: https://vercel.com/docs/vercel-blob/using-blob-sdk
import { put } from "@vercel/blob";

const imageBuffer = Buffer.from(base64ImageData, "base64");
const blob = await put(
  `rendering/${sessionId}/${renderingIndex}-${Date.now()}.png`,
  imageBuffer,
  {
    access: "private",
    contentType: "image/png",
    addRandomSuffix: false,  // We control the pathname
  }
);
// blob.pathname is stored on the renderingOutput document
// blob.url is the full URL (for private, needs token to access)
```

### Anti-Patterns to Avoid
- **Incrementing usage before Gemini completes:** Always increment AFTER successful generation + Blob upload. Failed generations must not count.
- **Storing Gemini API key client-side:** All Gemini calls happen server-side in API routes. The API key is never exposed.
- **Using ai.chats.create() across HTTP requests:** Chat sessions are in-memory objects. For multi-turn refinement across separate requests, manually reconstruct the contents array from stored conversation history.
- **Blocking the response for Gemini processing:** Use waitUntil to process in background; return 202 immediately with "generating" status.
- **Skipping Blob pathname validation before Gemini calls:** Always verify input image Blob pathnames exist before spending Gemini credits.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image generation API | Custom HTTP calls to Gemini REST API | `@google/genai` SDK | Handles auth, retries, response parsing, type safety. SDK manages token counting and error types. |
| Background processing | setTimeout/setInterval polling from server | `waitUntil` from `@vercel/functions` | Vercel-native solution that extends function lifetime. Works with Astro on Vercel. |
| Blob storage | S3 integration or custom file storage | `@vercel/blob` put()/get() | Already set up from Phase 7; consistent with existing infrastructure. |
| UUID generation for array keys | Custom random string generator | Existing `generatePortalToken` | Already used throughout project for _key generation. |
| Prompt template | String concatenation | Dedicated `promptBuilder.ts` with testable sections | Complex 12-section template needs structured composition and unit tests. |
| Month string formatting | Manual date formatting | `new Date().toISOString().slice(0, 7)` | Simple, reliable, timezone-aware enough for monthly buckets. |

**Key insight:** The most critical "don't hand-roll" item is the prompt builder. The 12-section luxury template with per-image role binding, copy/interpret instructions, and placement metadata is complex enough to warrant its own module with dedicated tests. Inline string assembly in the API route would be unmaintainable and untestable.

## Common Pitfalls

### Pitfall 1: waitUntil Timeout Inheritance
**What goes wrong:** waitUntil promises inherit the same timeout as the function. If Gemini takes 25s and the function timeout is 10s (Hobby plan), the background task is cancelled.
**Why it happens:** Vercel Hobby plan has 10s default timeout. waitUntil does not extend beyond the function's maxDuration.
**How to avoid:** Upgrade to Vercel Pro (approved in CONTEXT.md). Set `maxDuration: 60` in astro.config.mjs: `adapter: vercel({ maxDuration: 60 })`. This gives 60s for the background Gemini call.
**Warning signs:** 504 FUNCTION_INVOCATION_TIMEOUT errors in production.

### Pitfall 2: Base64 Image Size in Gemini Requests
**What goes wrong:** Sending large high-res reference images as base64 inline_data balloons the request size and slows down Gemini calls.
**Why it happens:** Each base64-encoded image is ~33% larger than the binary. 10 reference images at 2MB each = ~27MB of inline data.
**How to avoid:** Fetch images from Vercel Blob, resize/compress to reasonable dimensions (e.g., 1024px max dimension) before base64 encoding. Consider using sharp or canvas for server-side resize if needed.
**Warning signs:** Gemini calls taking >30s or failing with request size errors.

### Pitfall 3: Atomic Usage Increment Race Condition
**What goes wrong:** Two concurrent generations for the same designer both pass the quota check, then both increment, resulting in over-limit usage.
**Why it happens:** Check-then-increment is not atomic in Sanity.
**How to avoid:** Use Sanity's `patch().inc()` with `ifRevisionId` for optimistic concurrency, OR accept the minor race window (acceptable for single-designer V1). The simpler approach: check quota, call Gemini, then increment. If two calls race, the second one's increment goes over by 1 -- acceptable for V1 with a single designer.
**Warning signs:** Usage count exceeding monthly limit by 1-2.

### Pitfall 4: Gemini Content Policy Rejections
**What goes wrong:** Gemini refuses to generate certain content (even legitimate interior design images), returning an error instead of an image.
**Why it happens:** Gemini's safety filters can be overly cautious. Certain combinations of images or prompts may trigger content policy.
**How to avoid:** Catch the specific error type from the SDK, surface a user-friendly message ("The AI flagged a potential issue with your content. Try rephrasing or using different reference images."), and do NOT increment usage. Store the error on the rendering for visibility.
**Warning signs:** Frequent generation failures with no clear pattern.

### Pitfall 5: Stale Session Status During Polling
**What goes wrong:** The polling endpoint reads a cached/stale session status, client keeps polling even after generation is complete.
**Why it happens:** Sanity CDN caching or read-after-write consistency delays.
**How to avoid:** Use `sanityWriteClient` (not the CDN client) for status polling to get fresh reads. The write client bypasses CDN.
**Warning signs:** Client polls indefinitely despite generation completing.

### Pitfall 6: Missing Response Image Parts
**What goes wrong:** Gemini returns only text (no image) in the response, but code assumes an image part is always present.
**Why it happens:** Content policy, rate limiting, or model behavior can result in text-only responses.
**How to avoid:** Always check for the presence of `inlineData` in response parts. If no image part is found, mark the rendering as error with a clear message. Do not increment usage.
**Warning signs:** Null reference errors when extracting image data.

### Pitfall 7: Vercel Blob Server Upload 4.5MB Limit
**What goes wrong:** Server-side `put()` fails for generated images larger than 4.5MB.
**Why it happens:** Vercel Functions have a 4.5MB request body size limit for server uploads.
**How to avoid:** Generated 1K images from Gemini should be well under 4.5MB (typically 200KB-1MB for PNG). If a larger image is returned, compress with quality settings. This is unlikely to be an issue at 1K resolution.
**Warning signs:** Blob upload failures with size-related errors.

## Code Examples

Verified patterns from official sources:

### Gemini Image Generation (Full Flow)
```typescript
// Source: https://ai.google.dev/gemini-api/docs/image-generation
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function generateRendering(
  prompt: string,
  referenceImages: { base64: string; mimeType: string; roleLabel: string }[],
  aspectRatio: string = "16:9"
): Promise<{ imagePath: string; textResponse?: string; modelId: string }> {
  const modelId = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";

  // Build parts array: images with role labels + prompt text
  const parts: any[] = [];
  for (const img of referenceImages) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
    parts.push({ text: img.roleLabel });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        imageSize: "1K",
        aspectRatio,
      },
    },
  });

  // Extract image and text from response
  let imageBase64: string | null = null;
  let textResponse: string | undefined;

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageBase64 = part.inlineData.data;
    } else if (part.text && !part.thought) {
      textResponse = part.text;
    }
  }

  if (!imageBase64) {
    throw new Error("Gemini did not return an image. The AI may have flagged the content.");
  }

  // Upload to Vercel Blob
  const buffer = Buffer.from(imageBase64, "base64");
  const blob = await put(
    `rendering/${Date.now()}.png`,
    buffer,
    { access: "private", contentType: "image/png" }
  );

  return { imagePath: blob.pathname, textResponse, modelId };
}
```

### Prompt Builder Structure
```typescript
// Source: CONTEXT.md luxury prompt template decisions
interface ImageInput {
  blobPathname: string;
  imageType: string;
  location?: string;
  notes?: string;
  copyExact: boolean;
}

function buildLuxuryPrompt(
  description: string,
  images: ImageInput[],
  stylePreset?: string,
): string {
  const sections: string[] = [];

  // 1. Preserve
  sections.push("## Preserve\nLock the architecture, layout, camera angle, and lighting direction from the base room image.");

  // 2. Design Intent
  const style = stylePreset || "quietly luxurious";
  sections.push(`## Design Intent\nStyle: ${style}. Create an interior that embodies this aesthetic.`);

  // 3. Primary Change
  sections.push(`## Primary Change\n${description}`);

  // 4. Reference Binding
  const referenceBindings = images.map((img) => {
    const action = img.copyExact ? "Replicate exactly" : "Apply style/concept, not exact copy";
    return `- ${img.imageType.toUpperCase()}: ${action}${img.notes ? `. ${img.notes}` : ""}`;
  });
  sections.push(`## Reference Binding\n${referenceBindings.join("\n")}`);

  // 5. Placement & Composition
  const placements = images
    .filter((img) => img.location)
    .map((img) => `- ${img.imageType}: ${img.location}`);
  if (placements.length > 0) {
    sections.push(`## Placement & Composition\n${placements.join("\n")}`);
  }

  // 6-12: Fixed sections
  sections.push("## Scale & Proportion\nMaintain realistic scale relationships. Furniture proportional to room dimensions.");
  sections.push("## Material & Detail Fidelity\nRender materials with photographic realism. No plastic or glossy appearance. Show grain, texture, patina.");
  sections.push("## Lighting & Atmosphere\nSoft, natural, diffused lighting. Realistic shadow falloff. Warm ambient tones.");
  sections.push("## Styling Restraint\nDo NOT over-decorate. Leave breathing room. Negative space is intentional.");
  sections.push("## Color & Cohesion\nHarmonious palette. New elements integrate seamlessly with existing space.");
  sections.push("## Constraints\nDo not modify locked architectural elements. Do not introduce clutter or excessive accessories.");
  sections.push("## Final Quality\nEditorial-quality, cohesive, realistic, quietly luxurious. Suitable for Architectural Digest.");

  return sections.join("\n\n");
}
```

### Usage Tracking Pattern
```typescript
// Source: CONTEXT.md usage decisions
async function checkAndIncrementUsage(
  sanityUserId: string
): Promise<{ allowed: boolean; count: number; limit: number; remaining: number }> {
  const month = new Date().toISOString().slice(0, 7); // "2026-03"
  const docId = `usage-${sanityUserId}-${month}`;

  // Fetch or create usage document
  let usage = await sanityWriteClient.fetch(
    `*[_type == "renderingUsage" && _id == $docId][0]`,
    { docId }
  );

  if (!usage) {
    // Fetch limit from siteSettings
    const settings = await sanityWriteClient.fetch(
      `*[_type == "siteSettings"][0].renderingAllocation`
    );
    const limit = settings || 50;

    usage = await sanityWriteClient.create({
      _id: docId,
      _type: "renderingUsage",
      sanityUserId,
      month,
      count: 0,
      limit,
      bytesStored: 0,
    });
  }

  const remaining = usage.limit - usage.count;
  if (remaining <= 0) {
    return { allowed: false, count: usage.count, limit: usage.limit, remaining: 0 };
  }

  return { allowed: true, count: usage.count, limit: usage.limit, remaining };
}

// Called ONLY after successful generation + blob upload
async function incrementUsage(sanityUserId: string, bytesStored: number): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);
  const docId = `usage-${sanityUserId}-${month}`;

  await sanityWriteClient
    .patch(docId)
    .inc({ count: 1, bytesStored })
    .commit();
}
```

### Rendering Auth Helper
```typescript
// Source: CONTEXT.md designer auth decisions
interface AuthResult {
  authorized: boolean;
  sanityUserId?: string;
  error?: string;
}

async function validateRenderingAuth(request: Request): Promise<AuthResult> {
  const token = request.headers.get("x-studio-token");
  if (!token || token !== import.meta.env.STUDIO_API_SECRET) {
    return { authorized: false, error: "Invalid studio token" };
  }

  const body = await request.clone().json();
  const { sanityUserId } = body;
  if (!sanityUserId) {
    return { authorized: false, error: "Missing sanityUserId" };
  }

  // Check exclude list
  const settings = await sanityWriteClient.fetch(
    `*[_type == "siteSettings"][0].renderingExcludedUsers`
  );
  if (settings?.includes(sanityUserId)) {
    return { authorized: false, error: "User excluded from rendering" };
  }

  // Check for API key
  if (!import.meta.env.GEMINI_API_KEY) {
    return { authorized: false, error: "AI Rendering not configured. Contact Paul." };
  }

  return { authorized: true, sanityUserId };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` (legacy SDK) | `@google/genai` (unified SDK) | 2025-Q4 | New API surface: `ai.models.generateContent()` instead of `model.generateContent()`. Chat via `ai.chats.create()`. |
| Gemini 2.x for images | Gemini 3.1 Flash Image Preview (NB2) | 2026-Q1 | Native image generation in `generateContent`. Previous versions required separate Imagen API. |
| Vercel Hobby 10s timeout | Vercel Pro 60s+ with maxDuration config | 2024 | Pro plan supports configurable maxDuration up to 300s. Combined with waitUntil for background processing. |
| responseModalities TEXT only | responseModalities ["TEXT", "IMAGE"] | 2025-Q3 | Image generation integrated into core generateContent API. No separate image endpoint needed. |

**Deprecated/outdated:**
- `@google/generative-ai` package: Replaced by `@google/genai`. The old package had `GoogleGenerativeAI` class with `getGenerativeModel()`. New package uses `GoogleGenAI` with `ai.models.generateContent()`.
- `model.generateContent()` pattern: Old SDK method. New SDK uses `ai.models.generateContent({ model: "...", contents: ... })`.
- Separate Imagen API for image generation: Now integrated into Gemini's `generateContent` with `responseModalities`.

## Discretion Recommendations

Based on research findings, here are recommendations for areas left to Claude's discretion:

| Area | Recommendation | Rationale |
|------|---------------|-----------|
| Blob path prefix | `rendering/{sessionId}/{index}-{timestamp}.png` | Session-scoped for easy cleanup; index preserves ordering |
| Blob serve endpoint | Reuse existing `/api/blob-serve.ts` | Already handles private blob serving with session auth. No reason to duplicate. |
| Promote image handling | Same reference (no copy) | Blob storage is cheap; copying wastes space. designOption stores `image` as same blob pathname. |
| Copy/interpret toggle | Infer from image type with per-image override | Default: Furniture/Fixture/Material = copyExact:true, Inspiration = copyExact:false. Allow toggle in schema for override. |
| Prompt template storage | Hardcode in promptBuilder.ts | V1 with single designer. Template tuning UI is deferred. Hardcoded is simpler and testable. |
| Image location input | Freeform text field | Predefined options are too rigid for the variety of placement descriptions needed. |
| Error detail persistence | Permanent log on rendering output | Errors are valuable for debugging and optimization. Store errorMessage + errorCode on renderingOutput. |
| Output quality check | Store as-is | Gemini 1K output should be consistent. Over-engineering validation adds complexity for little gain. |
| Secret rotation | Single secret (STUDIO_API_SECRET) | V1 single-tenant. Dual-secret rotation adds unnecessary complexity. |
| sanityUserId validation | Trust Studio (no Sanity API verify) | Studio has already authenticated the user. Double-checking adds latency for no security gain in V1. |
| Gemini model fallback | Fail with clear message (no fallback chain) | V1 simplicity. Different models may produce inconsistent results. Better to fail clearly. |
| Fixture image style | Clearly-marked placeholder with "TEST MODE" watermark | Prevents confusion between test and real output. Use a simple colored rectangle with text overlay. |
| E2E test script | Include `scripts/test-rendering.ts` | Valuable for manual testing of the full pipeline before Studio UI exists. |

## Open Questions

1. **Gemini API Rate Limits for Image Generation**
   - What we know: Standard Gemini API has per-minute and per-day rate limits. Image generation may have stricter limits.
   - What's unclear: Exact rate limits for `gemini-3.1-flash-image-preview` with image generation. Whether there are separate quotas for image vs. text generation.
   - Recommendation: Handle 429 errors gracefully. Surface "Generation service is busy" message. The monthly allocation (50/month) naturally limits usage well below likely API rate limits.

2. **Gemini Response Token Counting for Image Generation**
   - What we know: The response includes `usageMetadata` with token counts for text. Image generation may report differently.
   - What's unclear: Whether `inputTokens` and `outputTokens` in usageMetadata accurately reflect image costs, or if image generation uses a separate billing metric.
   - Recommendation: Store whatever token counts are available from `response.usageMetadata`. Add a `costEstimate` field calculated from the known pricing (~$0.07/image at 1K).

3. **Vercel Blob `get()` Stream Pattern for Serving to Gemini**
   - What we know: The existing `blob-serve.ts` uses `get()` which returns a stream. For Gemini, we need base64.
   - What's unclear: Whether `get()` returns a stream that can be easily converted to a Buffer for base64 encoding.
   - Recommendation: Use `get()` with `.arrayBuffer()` on the response body to get bytes, then `Buffer.from()` for base64 encoding. Alternatively, use the blob URL with a fetch if the pathname-based get is cumbersome.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` (existing, with sanity:client alias) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RNDR-01 | renderingSession schema has correct fields, types, references | unit | `npx vitest run src/sanity/schemas/renderingSession.test.ts -x` | Wave 0 |
| RNDR-01 | designOption schema has correct fields (project ref, image, caption, favoritedBy, comments, sortOrder, sourceSession, sourceRenderingIndex) | unit | `npx vitest run src/sanity/schemas/designOption.test.ts -x` | Wave 0 |
| RNDR-01 | renderingUsage schema has sanityUserId, month, count, limit, bytesStored | unit | `npx vitest run src/sanity/schemas/renderingUsage.test.ts -x` | Wave 0 |
| RNDR-01 | siteSettings extended with renderingAllocation, renderingImageTypes[], renderingExcludedUsers[] | unit | `npx vitest run src/sanity/schemas/project.test.ts -x` (extend existing) | Wave 0 |
| RNDR-02 | Prompt builder assembles 12-section luxury template from image metadata + description | unit | `npx vitest run src/lib/promptBuilder.test.ts -x` | Wave 0 |
| RNDR-02 | Gemini client generates image, extracts base64, handles errors | unit | `npx vitest run src/lib/geminiClient.test.ts -x` | Wave 0 |
| RNDR-02 | generate API route validates auth, checks usage, returns 202 with sessionId | unit | `npx vitest run src/pages/api/rendering/generate.test.ts -x` | Wave 0 |
| RNDR-03 | Refinement reconstructs conversation history with previous output image | unit | `npx vitest run src/lib/geminiClient.test.ts -x` | Wave 0 |
| RNDR-06 | Usage endpoint returns count/limit/remaining | unit | `npx vitest run src/pages/api/rendering/usage.test.ts -x` | Wave 0 |
| RNDR-06 | Generate returns 403 when monthly limit reached | unit | `npx vitest run src/pages/api/rendering/generate.test.ts -x` | Wave 0 |
| RNDR-07 | Usage counter increments only after successful generation | unit | `npx vitest run src/lib/geminiClient.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/sanity/schemas/renderingSession.test.ts` -- covers RNDR-01 (session schema)
- [ ] `src/sanity/schemas/designOption.test.ts` -- covers RNDR-01 (design option schema)
- [ ] `src/sanity/schemas/renderingUsage.test.ts` -- covers RNDR-01 (usage schema)
- [ ] `src/lib/promptBuilder.test.ts` -- covers RNDR-02 (prompt assembly)
- [ ] `src/lib/geminiClient.test.ts` -- covers RNDR-02, RNDR-03, RNDR-07 (Gemini integration)
- [ ] `src/lib/renderingAuth.test.ts` -- covers auth validation
- [ ] Framework install: `npm install @google/genai @vercel/functions` -- new dependencies

## Sources

### Primary (HIGH confidence)
- [Google Gemini Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation) -- Full API reference for generateContent with responseModalities IMAGE, imageConfig, multi-turn chat, model names, resolution options
- [@google/genai GitHub](https://github.com/googleapis/js-genai) -- SDK class structure (GoogleGenAI, ai.models, ai.chats), TypeScript examples, installation
- [@vercel/functions API Reference](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package) -- waitUntil signature, Node.js/Edge support, timeout inheritance
- [@vercel/blob SDK Reference](https://vercel.com/docs/vercel-blob/using-blob-sdk) -- put() API with pathname/body/options, return type, private access, 4.5MB server upload limit
- [Vercel maxDuration Configuration](https://vercel.com/docs/functions/configuring-functions/duration) -- Pro plan supports up to 300s, configured via adapter
- [Astro Vercel Integration](https://docs.astro.build/en/guides/integrations-guide/vercel/) -- maxDuration config in adapter options

### Secondary (MEDIUM confidence)
- [Vercel waitUntil Changelog](https://vercel.com/changelog/waituntil-is-now-available-for-vercel-functions) -- waitUntil availability and runtime support
- [Vercel Server Uploads](https://vercel.com/docs/vercel-blob/server-upload) -- Server-side upload pattern, 4.5MB limit confirmation
- [@google/genai npm](https://www.npmjs.com/package/@google/genai) -- Version 1.45.0 confirmed

### Tertiary (LOW confidence)
- Gemini API rate limits for image generation -- not explicitly documented; inferred from general Gemini rate limit documentation
- Token counting for image generation -- usageMetadata structure for image responses not fully documented

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified via npm, official docs consulted, versions confirmed
- Architecture: HIGH - Patterns directly follow established project patterns (API routes, Sanity schemas, Blob storage) plus well-documented Vercel/Gemini APIs
- Pitfalls: HIGH - Based on official documentation limitations (timeout, size limits, content policy) and established patterns in the codebase
- Prompt builder: MEDIUM - Template structure is from CONTEXT.md decisions; NB2 prompting effectiveness depends on empirical testing with real images

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (30 days -- Gemini API and @google/genai are stable)

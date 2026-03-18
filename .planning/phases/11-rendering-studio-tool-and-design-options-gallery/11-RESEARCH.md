# Phase 11: Rendering Studio Tool and Design Options Gallery - Research

**Researched:** 2026-03-17
**Domain:** Sanity Studio custom tool development + Astro portal React islands
**Confidence:** HIGH

## Summary

Phase 11 is a purely UI phase -- all backend API routes (generate, refine, status, usage, promote, react) and schemas (renderingSession, designOption, renderingUsage) were delivered in Phase 10. This phase builds two distinct UIs: (1) a Sanity Studio custom tool with wizard, chat view, session list, and Design Options tab; (2) a client portal Design Options gallery section with favorites and comments.

The Sanity Studio tool uses the `tools` array pattern in `sanity.config.ts` -- a factory function returning `{ name, title, icon, component }` where the component is a full React app rendered inside Studio's work area. The tool has access to `@sanity/ui` (v3.1.13) primitives and Studio hooks (`useCurrentUser`, `useClient`) for auth and data fetching. The portal gallery follows existing Astro + React island patterns -- an Astro section component for the grid with a React island for the interactive lightbox (favorites, comments).

**Primary recommendation:** Build the Studio tool as a single React component tree with internal state management (React context + useReducer), not as a Sanity plugin package. Keep all components under `src/sanity/components/rendering/`. The portal lightbox is a React island (`client:load`) for stateful heart/comment interactions, while gallery cards are Astro components with server-rendered favorite counts.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dedicated sidebar tool icon in Sanity Studio -- first-class tool alongside Structure and Vision
- 4-step wizard flow: Setup -> Upload -> Classify -> Describe + Generate
- Only session title and description are required; images, project link, style preset are optional
- Smart image classification defaults: first image = Floor Plan (copyExact: true), subsequent = Existing Space Photo (copyExact: false)
- Accepted formats: JPG/JPEG, PNG, WebP, HEIC, PDF; 20MB per file; soft hint at 7+ images
- Post-generation: wizard closes, transitions to refinement chat view
- Refinement chat layout: vertical thread, user on right, AI on left, text input at bottom
- Rendering card actions: Promote (with caption), Full size (lightbox), Download, View prompt, Metadata footer
- Horizontal thumbnail strip at top of chat view
- Usage counter: persistent badge with color-coded thresholds (green <80%, amber 80-95%, red 95%+)
- Session list: vertical cards with project filter dropdown, stack navigation
- Design Options tab in Studio: grid view of all promoted options per project
- Portal gallery: responsive grid (1 col mobile, 2 tablet, 3 desktop), 16:9 cropped cards
- Portal lightbox: NEW component (not reusing portfolio Lightbox), dark overlay, heart toggle, comment thread
- Favorite interaction: heart toggle with optimistic UI, subtle animation
- Comment interaction: lightbox only (not on gallery card), text input + submit
- Multi-client: total favorite count visible, current client heart state, client names on comments
- Confidentiality notice: reuse ConfidentialityBanner with rendering-specific copy
- Scratchpad sessions: dashed border or muted background visual distinction

### Claude's Discretion
- Exact Sanity Studio plugin registration pattern for the sidebar tool
- React component architecture for wizard steps and chat view (shared state management approach)
- Lightbox animation/transition details
- Image loading strategy (lazy loading, placeholder blur)
- Session deletion capability (if needed beyond just unpromoting)
- Gallery card hover states and micro-interactions
- Comment character limit (if any)
- Keyboard shortcuts within Studio tool

### Deferred Ideas (OUT OF SCOPE)
- Side-by-side rendering comparison
- Drag-to-reorder Design Options
- Batch promote
- Template sessions (clone settings)
- Auto-save draft sessions
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RNDR-04 | Liz promotes a rendering to a "Design Option" with a caption, making it visible to clients on the portal | Studio tool chat view with Promote action calling `/api/rendering/promote`; Studio Design Options tab showing promoted options per project |
| RNDR-05 | Client sees promoted design options in a gallery on their project portal, can favorite options and leave comments | Portal DesignOptionsSection with gallery cards, React island lightbox with heart toggle and comment thread calling `/api/rendering/react` |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sanity | ^5.16.0 | Studio framework + hooks (useCurrentUser, useClient) | Project's CMS -- tool lives inside Studio |
| @sanity/ui | 3.1.13 | UI primitives (Card, Button, Stack, Dialog, Spinner, etc.) | Studio's design system -- consistent look |
| @sanity/icons | (bundled) | Icon library (SparklesIcon, ImageIcon, StarFilledIcon, HeartIcon, etc.) | 236 icons available, no extra install |
| react | ^19.2.4 | Component framework | Already in project |
| @vercel/blob | ^2.3.1 | Client-side file upload via `upload()` from `@vercel/blob/client` | Existing pattern in BlobFileInput.tsx |
| astro | ^6.0.4 | Portal page framework | Project framework |
| tailwindcss | ^4.2.1 | Portal styling | Project styling system |

### No New Dependencies Needed
All required libraries are already installed. The Studio tool uses `@sanity/ui` for layout and `@sanity/icons` for icons. The portal uses existing Tailwind + Astro patterns. No new npm packages required.

**Installation:**
```bash
# No new packages needed -- all dependencies are already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/sanity/components/rendering/
  RenderingTool.tsx          # Main tool component (router: list vs session vs design-options)
  RenderingToolPlugin.ts     # Tool factory function for sanity.config.ts
  SessionList.tsx            # Session list view with project filter
  SessionCard.tsx            # Individual session card in list
  Wizard/
    WizardContainer.tsx      # 4-step wizard with stepper bar
    StepSetup.tsx            # Step 1: title, project, aspect ratio, style
    StepUpload.tsx           # Step 2: drag-and-drop multi-file upload
    StepClassify.tsx         # Step 3: classify images (type, placement, copyExact)
    StepDescribe.tsx         # Step 4: description + generate button
  ChatView.tsx               # Refinement chat interface
  ChatMessage.tsx            # Individual message (user text or AI response with image)
  RenderingCard.tsx          # Rendering image card with action buttons
  ThumbnailStrip.tsx         # Horizontal scroll strip of rendering thumbnails
  PromoteDialog.tsx          # Promote flow: caption input + project picker for scratchpad
  DesignOptionsTab.tsx       # Design Options grid view per project
  UsageBadge.tsx             # Color-coded usage counter badge
  GeneratingOverlay.tsx      # Spinner with rotating status text
  types.ts                   # Shared TypeScript interfaces

src/components/portal/
  DesignOptionsSection.astro  # Gallery grid section for project page
  DesignOptionCard.astro      # Individual gallery card (server-rendered)
  DesignOptionLightbox.tsx    # React island: lightbox with heart + comments
```

### Pattern 1: Sanity Studio Custom Tool Registration
**What:** Register a custom tool via factory function in `sanity.config.ts`
**When to use:** Adding a first-class sidebar tool to Sanity Studio
**Example:**
```typescript
// src/sanity/components/rendering/RenderingToolPlugin.ts
import { SparklesIcon } from "@sanity/icons";
import { RenderingTool } from "./RenderingTool";

export const renderingTool = () => ({
  name: "rendering",
  title: "Rendering",
  icon: SparklesIcon,
  component: RenderingTool,
});

// sanity.config.ts
import { renderingTool } from "./src/sanity/components/rendering/RenderingToolPlugin";

export default defineConfig({
  // ...existing config...
  plugins: [structureTool({ ... })],
  tools: [renderingTool()],
});
```
**Source:** [Sanity Tool API Reference](https://www.sanity.io/docs/tool-api-reference)

### Pattern 2: Studio Hooks for Auth and Data
**What:** Use Sanity hooks inside tool components for user identity and API calls
**When to use:** Any Studio tool component that needs current user or client access
**Example:**
```typescript
// Inside any component rendered within the tool
import { useCurrentUser, useClient } from "sanity";

function MyToolComponent() {
  const currentUser = useCurrentUser();  // { id, name, email, roles }
  const client = useClient({ apiVersion: "2025-12-15" });

  // currentUser.id is the sanityUserId for API calls
  const sanityUserId = currentUser?.id;

  // Use client for GROQ queries
  const sessions = await client.fetch(RENDERING_SESSIONS_BY_CREATOR_QUERY, {
    sanityUserId,
  });
}
```
**Source:** [Sanity Studio React Hooks](https://www.sanity.io/docs/studio-react-hooks)

### Pattern 3: Internal API Calls from Studio Tool
**What:** Call rendering API routes with STUDIO_API_SECRET header from Studio components
**When to use:** generate, refine, status, usage, promote calls from the Studio tool
**Example:**
```typescript
async function callRenderingAPI(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/rendering/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-studio-token": import.meta.env.SANITY_STUDIO_API_SECRET,
      // Note: Studio env vars must be prefixed with SANITY_STUDIO_ to be available client-side
    },
    body: JSON.stringify(body),
  });
  return response.json();
}
```
**CRITICAL:** Environment variables in Sanity Studio (client-side React) must be prefixed with `SANITY_STUDIO_` to be bundled. The existing `STUDIO_API_SECRET` env var needs a `SANITY_STUDIO_API_SECRET` alias or the tool needs to read it differently.

### Pattern 4: React Island for Portal Interactivity
**What:** Use React components with `client:load` directive for interactive portal features
**When to use:** Stateful UI like favorites toggle, comment form, lightbox navigation
**Example:**
```typescript
// In Astro page
<DesignOptionLightbox
  client:load
  options={designOptions}
  clientId={clientId}
  projectId={projectId}
/>
```
**Source:** Existing pattern in WarrantyClaimForm.tsx, TierSelectionForm.tsx

### Pattern 5: Blob Image Serving for Private Renders
**What:** Serve private Blob images through authenticated endpoint
**When to use:** Displaying rendering images in both Studio tool and portal
**Example:**
```typescript
// Studio tool: direct Blob URL (Studio has its own auth)
// Use SANITY_STUDIO_BLOB_READ_WRITE_TOKEN or proxy through a serve endpoint

// Portal: use blob-serve endpoint (requires portal session)
const imageUrl = `/api/blob-serve?path=${encodeURIComponent(blobPathname)}`;

// Gallery card (Astro):
<img src={`/api/blob-serve?path=${option.blobPathname}`} alt={option.caption} />
```

### Pattern 6: Polling for Generation Status
**What:** Poll `/api/rendering/status` while generation is in progress
**When to use:** After calling generate or refine, before result is ready
**Example:**
```typescript
function useGenerationPolling(sessionId: string | null) {
  const [status, setStatus] = useState<"idle" | "generating" | "complete" | "error">("idle");

  useEffect(() => {
    if (!sessionId || status !== "generating") return;
    const interval = setInterval(async () => {
      const res = await fetch(
        `/api/rendering/status?sessionId=${sessionId}`,
        { headers: { "x-studio-token": studioSecret } }
      );
      const data = await res.json();
      if (data.status !== "generating") {
        clearInterval(interval);
        setStatus(data.status);
      }
    }, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [sessionId, status]);

  return status;
}
```

### Anti-Patterns to Avoid
- **Do NOT use Sanity document actions for the rendering tool**: Document actions are tied to document types. The rendering tool is a standalone workspace, not a document editor.
- **Do NOT build the wizard as separate Sanity documents**: Wizard state is ephemeral (in-memory React state). Only persist to Sanity via API call on Generate.
- **Do NOT reuse the portfolio Lightbox.astro for the portal gallery**: The portfolio lightbox is vanilla JS with no state. The design options lightbox needs React for heart toggle state, comment form, and optimistic updates.
- **Do NOT expose STUDIO_API_SECRET in client-side portal code**: Portal uses cookie-based session auth, not the Studio token. The `/api/rendering/react` endpoint already uses `getSession()`.
- **Do NOT use `import.meta.env.STUDIO_API_SECRET` in Studio tool components**: Studio env vars must be prefixed with `SANITY_STUDIO_`. Use `import.meta.env.SANITY_STUDIO_API_SECRET` (configured as `SANITY_STUDIO_API_SECRET` in `.env`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop file upload | Custom drag event handlers | HTML5 `onDragOver`/`onDrop` with `@vercel/blob/client` `upload()` | Browser API is reliable; upload() handles presigned URLs and progress |
| Studio UI primitives | Custom styled components | `@sanity/ui` (Card, Button, Stack, Dialog, etc.) | Consistent with Studio design language, dark/light mode support |
| Lightbox keyboard/touch navigation | Custom event listeners from scratch | Pattern from existing Lightbox.astro (keyboard + touch swipe logic) | Proven pattern, adapt for React with `useEffect` |
| Usage badge color coding | Manual threshold logic | Simple utility function with 3 thresholds | One function, 3 returns |
| Image type defaults | Complex classification logic | Simple index-based: `index === 0 ? "Floor Plan" : "Existing Space Photo"` | Defaults are overridable by user |

**Key insight:** The Studio tool is complex in terms of UI state (wizard steps, chat thread, polling, promote flow) but all the hard backend work (Gemini integration, Blob storage, Sanity mutations) is already done. Focus on clean React state management, not on reinventing infrastructure.

## Common Pitfalls

### Pitfall 1: Studio Environment Variable Prefix
**What goes wrong:** `import.meta.env.STUDIO_API_SECRET` returns `undefined` in Studio tool components because Sanity Studio bundles only variables prefixed with `SANITY_STUDIO_`.
**Why it happens:** Sanity Studio is a client-side React app. Only env vars with the `SANITY_STUDIO_` prefix are included in the bundle (similar to `VITE_` or `NEXT_PUBLIC_` prefixes).
**How to avoid:** Add `SANITY_STUDIO_API_SECRET` to `.env` alongside `STUDIO_API_SECRET`. API routes continue using `STUDIO_API_SECRET`; Studio tool uses `SANITY_STUDIO_API_SECRET`. Both contain the same value.
**Warning signs:** API calls from Studio return 401 "Invalid studio token".

### Pitfall 2: Blob Image URLs in Studio vs Portal
**What goes wrong:** Rendering images are private Blobs. Studio tool components can't directly use Blob URLs without auth.
**Why it happens:** `@vercel/blob` private files require the `BLOB_READ_WRITE_TOKEN` server-side to generate URLs.
**How to avoid:** For Studio, create a dedicated `/api/rendering/serve-image` endpoint that accepts the `x-studio-token` header and proxies the private Blob. For portal, the existing `/api/blob-serve` endpoint already works (uses portal session auth). Alternatively, in Studio, the tool can use the signed URL returned by `@vercel/blob`'s `getDownloadUrl()` function.
**Warning signs:** Broken images in Studio tool or "Unauthorized" errors loading renders.

### Pitfall 3: Wizard State Loss on Accidental Navigation
**What goes wrong:** User clicks a session in the list while wizard is open, losing all entered data.
**Why it happens:** Stack navigation replaces the current view without checking for unsaved state.
**How to avoid:** Implement the abandon confirmation dialog specified in CONTEXT.md: "Discard this session? Your uploads and settings will be lost." Check if `wizardData` has any non-default values before allowing navigation.
**Warning signs:** User reports about data disappearing.

### Pitfall 4: Race Condition in Promote + Unpromote
**What goes wrong:** Rapidly clicking Promote/Unpromote creates orphaned designOption documents or leaves isPromoted in wrong state.
**Why it happens:** The promote endpoint creates a designOption document AND patches the session. Two async operations can interleave with rapid clicks.
**How to avoid:** Disable the Promote button while the API call is in flight (optimistic UI with loading state). Use a local `promoting` state per rendering card.
**Warning signs:** Multiple designOption documents for the same rendering, or star badge stuck in wrong state.

### Pitfall 5: HEIC Upload Acceptance
**What goes wrong:** HEIC files (iPhone photos) rejected at upload because the accept type is not configured in the blob-upload handler.
**Why it happens:** The existing `blob-upload.ts` `allowedContentTypes` only includes `application/pdf, image/jpeg, image/png, image/webp`. HEIC MIME type (`image/heic`) is missing.
**How to avoid:** Add `image/heic` and `image/heif` to the `allowedContentTypes` in `blob-upload.ts`. Also update the file input `accept` attribute in the upload component to include `.heic,.heif`.
**Warning signs:** "Upload failed" error when selecting iPhone photos.

### Pitfall 6: Polling Memory Leak
**What goes wrong:** Status polling interval continues running after component unmounts (e.g., user navigates away from session).
**Why it happens:** `setInterval` not cleaned up in React `useEffect`.
**How to avoid:** Always return a cleanup function from `useEffect` that calls `clearInterval`. Also clear on status transition to "complete" or "error".
**Warning signs:** Console errors about state updates on unmounted components, excessive API calls.

### Pitfall 7: Stale Session Data After Generate
**What goes wrong:** Chat view doesn't show the new rendering after generation completes because the component is rendering cached data.
**Why it happens:** The tool fetched the session once on mount but doesn't re-fetch after the status endpoint reports "complete".
**How to avoid:** When polling detects status change to "complete", re-fetch the full session data using `RENDERING_SESSION_BY_ID_QUERY` to get the newly appended rendering and conversation entries.
**Warning signs:** User sees "Generating..." forever, or chat shows old data after generation finishes.

### Pitfall 8: Portal Gallery Shows Zero Design Options
**What goes wrong:** Newly promoted design options don't appear in the portal because the page was statically rendered or the GROQ query doesn't match.
**Why it happens:** The portal project page uses `export const prerender = false` (SSR), so this should work on refresh. But the GROQ query must match the `designOption` schema exactly.
**How to avoid:** Use the existing `DESIGN_OPTIONS_BY_PROJECT_QUERY` from `queries.ts` which is already tested. Conditionally render the section only when `designOptions.length > 0`.
**Warning signs:** Empty gallery section despite promoted options existing in Sanity.

## Code Examples

### Studio Tool Registration
```typescript
// src/sanity/components/rendering/RenderingToolPlugin.ts
import { SparklesIcon } from "@sanity/icons";
import { RenderingTool } from "./RenderingTool";

export const renderingTool = () => ({
  name: "rendering",
  title: "Rendering",
  icon: SparklesIcon,
  component: RenderingTool,
});
```

### Tool Integration in Config
```typescript
// sanity.config.ts (modified)
import { renderingTool } from "./src/sanity/components/rendering/RenderingToolPlugin";

export default defineConfig({
  // ...existing config...
  plugins: [structureTool({ ... })],
  tools: [renderingTool()],
  // ...rest unchanged...
});
```

### Main Tool Component with Internal Router
```typescript
// src/sanity/components/rendering/RenderingTool.tsx
import { useState, useReducer } from "react";
import { useCurrentUser } from "sanity";
import { Card, Tab, TabList } from "@sanity/ui";

type View = "sessions" | "session-detail" | "wizard" | "design-options";

export function RenderingTool() {
  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"sessions" | "design-options">("sessions");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  if (!currentUser) return null; // Loading state

  return (
    <Card height="fill" overflow="auto">
      {!activeSessionId && !showWizard && (
        <>
          <TabList space={1}>
            <Tab label="Sessions" selected={activeTab === "sessions"} onClick={() => setActiveTab("sessions")} />
            <Tab label="Design Options" selected={activeTab === "design-options"} onClick={() => setActiveTab("design-options")} />
          </TabList>
          {activeTab === "sessions" && <SessionList ... />}
          {activeTab === "design-options" && <DesignOptionsTab ... />}
        </>
      )}
      {showWizard && <WizardContainer ... />}
      {activeSessionId && <ChatView sessionId={activeSessionId} ... />}
    </Card>
  );
}
```

### Multi-File Upload with Drag-and-Drop
```typescript
// src/sanity/components/rendering/Wizard/StepUpload.tsx
import { useState, useCallback, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { Card, Stack, Text, Button, Spinner } from "@sanity/ui";
import { UploadIcon } from "@sanity/icons";

interface UploadedImage {
  blobPathname: string;
  fileName: string;
  uploading: boolean;
  error?: string;
}

function StepUpload({ images, onImagesChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    // Add placeholders with uploading state
    const placeholders = fileArray.map((f) => ({
      blobPathname: "",
      fileName: f.name,
      uploading: true,
    }));
    onImagesChange([...images, ...placeholders]);

    // Upload each file
    for (let i = 0; i < fileArray.length; i++) {
      try {
        const blob = await upload(fileArray[i].name, fileArray[i], {
          access: "private",
          handleUploadUrl: "/api/blob-upload",
        });
        // Update placeholder with real pathname
        onImagesChange((prev) =>
          prev.map((img, idx) =>
            idx === images.length + i
              ? { ...img, blobPathname: blob.pathname, uploading: false }
              : img
          )
        );
      } catch (err) {
        // Mark as error
        onImagesChange((prev) =>
          prev.map((img, idx) =>
            idx === images.length + i
              ? { ...img, uploading: false, error: "Upload failed" }
              : img
          )
        );
      }
    }
  }, [images, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? "#C4836A" : "#B8B0A4"}`,
        borderRadius: 8,
        padding: 32,
        textAlign: "center",
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        style={{ display: "none" }}
      />
      <UploadIcon style={{ fontSize: 32 }} />
      <Text>Drag & drop files or click to browse</Text>
      <Text size={1} muted>JPG, PNG, WebP, HEIC, PDF -- up to 20MB each</Text>
    </div>
  );
}
```

### Portal Design Options Gallery (Astro)
```astro
<!-- src/components/portal/DesignOptionsSection.astro -->
---
interface DesignOption {
  _id: string;
  blobPathname: string;
  caption: string;
  reactions: Array<{ clientId: string; type: string; text?: string; createdAt: string }>;
}
interface Props {
  options: DesignOption[];
  clientId: string;
  projectId: string;
  isCommercial?: boolean;
}
const { options, clientId, projectId, isCommercial } = Astro.props;
const favoriteCountMap = options.map(opt => ({
  ...opt,
  favoriteCount: (opt.reactions || []).filter(r => r.type === "favorite").length,
  commentCount: (opt.reactions || []).filter(r => r.type === "comment").length,
  isFavorited: (opt.reactions || []).some(r => r.type === "favorite" && r.clientId === clientId),
}));
---

<section class="py-12 border-t border-stone-light/20">
  <div class="border border-stone-light/20 bg-cream-dark px-5 py-3 text-center mb-6">
    <p class="text-xs text-stone font-body tracking-wide">
      {isCommercial
        ? "These design concepts are confidential to your building project. Please do not share."
        : "These design concepts are confidential. Please do not share."}
    </p>
  </div>

  <h2 class="font-heading text-xl font-light text-charcoal mb-6">Design Options</h2>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {favoriteCountMap.map((opt, index) => (
      <DesignOptionCard option={opt} index={index} />
    ))}
  </div>

  <DesignOptionLightbox
    client:load
    options={favoriteCountMap}
    clientId={clientId}
    projectId={projectId}
  />
</section>
```

### Portal Lightbox React Island (Heart + Comments)
```typescript
// src/components/portal/DesignOptionLightbox.tsx
import { useState, useCallback } from "react";

interface Props {
  options: DesignOption[];
  clientId: string;
  projectId: string;
}

export default function DesignOptionLightbox({ options, clientId, projectId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = useCallback(async (optionId: string, isFavorited: boolean) => {
    // Optimistic update
    setLocalFavorites((prev) => ({ ...prev, [optionId]: !isFavorited }));
    // API call in background
    await fetch("/api/rendering/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        designOptionId: optionId,
        type: isFavorited ? "unfavorite" : "favorite",
      }),
    });
  }, []);

  // ... keyboard nav, touch swipe, comment form
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sanity Studio V2 plugins (part system) | V3 `tools` array + `definePlugin` | Sanity Studio v3 (2023) | Tools are simple factory functions, not class-based plugins |
| Sanity custom input components only | Full custom tools as React apps in Studio | Sanity Studio v3 | Can build entire app-like experiences inside Studio |
| `@vercel/blob` server-only uploads | Client-side uploads via `upload()` with `handleUploadUrl` | @vercel/blob v0.19+ | Direct browser-to-Blob uploads with presigned URLs |
| Astro SSR-only interactivity | React islands via `client:load` directive | Astro v2+ (2023) | Selective hydration for interactive components |

**Deprecated/outdated:**
- Sanity Studio v2 part system: replaced by v3 plugins/tools array. All project code uses v3 patterns.
- `@sanity/desk-tool`: renamed to `structureTool` from `sanity/structure` in Studio v3.

## Open Questions

1. **Blob Image Serving in Studio Tool**
   - What we know: Rendering images are stored as private Blobs. The portal uses `/api/blob-serve` with session auth. Studio uses a different auth model (STUDIO_API_SECRET).
   - What's unclear: Whether Studio tool components can directly construct Blob URLs using the read-write token, or need a dedicated serve endpoint.
   - Recommendation: Create a Studio-specific helper that calls `/api/blob-serve` with the studio token in the header, or add a `source=studio` parameter to blob-serve that accepts `x-studio-token`. Simplest approach: add studio token support to the existing `blob-serve.ts`.

2. **SANITY_STUDIO_ Environment Variable Prefix**
   - What we know: Client-side Studio code only sees env vars prefixed with `SANITY_STUDIO_`. The current `STUDIO_API_SECRET` is used server-side only.
   - What's unclear: Whether the Astro/Vite build correctly handles the Sanity Studio prefix or if there's a special Vite config needed.
   - Recommendation: Add `SANITY_STUDIO_API_SECRET` to `.env` (same value as `STUDIO_API_SECRET`). Verify at runtime that the Studio component can read it.

3. **Session Deletion**
   - What we know: CONTEXT.md marks session deletion as Claude's discretion.
   - What's unclear: Whether Liz needs to delete sessions or if browsing history is always valuable.
   - Recommendation: Do NOT implement session deletion in V1. Sessions are lightweight and browsing history is valuable. If needed later, it's a simple addition.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/sanity/components/rendering/ src/components/portal/DesignOption` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RNDR-04 | Promote rendering creates designOption, shows star badge | unit | `npx vitest run src/sanity/components/rendering/PromoteDialog.test.ts -x` | No -- Wave 0 |
| RNDR-04 | Unpromote removes designOption, clears star | unit | `npx vitest run src/sanity/components/rendering/PromoteDialog.test.ts -x` | No -- Wave 0 |
| RNDR-04 | Usage badge shows correct color for threshold | unit | `npx vitest run src/sanity/components/rendering/UsageBadge.test.ts -x` | No -- Wave 0 |
| RNDR-05 | Gallery section renders with correct grid | unit | `npx vitest run src/components/portal/DesignOptionsSection.test.ts -x` | No -- Wave 0 |
| RNDR-05 | Heart toggle sends correct API call | unit | `npx vitest run src/components/portal/DesignOptionLightbox.test.ts -x` | No -- Wave 0 |
| RNDR-05 | Comment submit sends correct API call | unit | `npx vitest run src/components/portal/DesignOptionLightbox.test.ts -x` | No -- Wave 0 |
| RNDR-05 | Gallery hidden when 0 design options | unit | `npx vitest run src/components/portal/DesignOptionsSection.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run` (full suite, fast -- ~5s)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/sanity/components/rendering/UsageBadge.test.ts` -- covers RNDR-04 usage badge
- [ ] `src/components/portal/DesignOptionsSection.test.ts` -- covers RNDR-05 gallery rendering (note: testing Astro components is complex; may test utility functions instead)
- [ ] Update `blob-upload.ts` allowedContentTypes to include `image/heic, image/heif` -- prerequisite for HEIC upload support

## Sources

### Primary (HIGH confidence)
- [Sanity Tool API Reference](https://www.sanity.io/docs/tool-api-reference) -- Tool type definition, registration pattern, component props
- [Sanity Studio React Hooks](https://www.sanity.io/docs/studio-react-hooks) -- useCurrentUser, useClient, useSchema hooks
- [Sanity Custom Studio Tool](https://www.sanity.io/docs/studio/custom-studio-tool) -- Basic tool configuration example
- [Sanity Plugins API Reference](https://www.sanity.io/docs/studio/plugins-api-reference) -- definePlugin, tools property
- Codebase: `sanity.config.ts`, `BlobFileInput.tsx`, `blob-upload.ts`, `blob-serve.ts` -- Existing patterns verified by reading source
- Codebase: All 6 rendering API routes (`generate.ts`, `refine.ts`, `status.ts`, `usage.ts`, `promote.ts`, `react.ts`) -- Complete backend contract verified
- Codebase: `renderingSession.ts`, `designOption.ts`, `renderingUsage.ts` schemas -- Schema structure verified
- Codebase: `queries.ts` -- All GROQ queries for Phase 10 already defined and exported
- Codebase: `@sanity/icons` package -- 236 icons verified locally, SparklesIcon, ImageIcon, StarFilledIcon, HeartIcon all available

### Secondary (MEDIUM confidence)
- [Sanity Icons Browser](https://icons.sanity.build/all) -- Complete icon catalog
- [Vercel Blob Client Upload](https://vercel.com/docs/vercel-blob/client-upload) -- Client-side upload pattern with handleUploadUrl
- `@sanity/ui` v3.1.13 verified locally -- Card, Button, Stack, Dialog, Tab, TabList, Spinner, TextInput, TextArea, Select, Badge, Flex, Grid components available

### Tertiary (LOW confidence)
- SANITY_STUDIO_ env var prefix requirement -- Based on general knowledge of Vite bundling conventions. Needs runtime verification.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, versions verified from package.json
- Architecture: HIGH -- tool registration pattern verified from official docs + codebase patterns. All backend APIs verified by reading source code.
- Pitfalls: HIGH -- env var prefix, Blob serving, polling cleanup are well-understood patterns. HEIC gap identified from reading blob-upload.ts.

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (30 days -- stable domain, no fast-moving dependencies)

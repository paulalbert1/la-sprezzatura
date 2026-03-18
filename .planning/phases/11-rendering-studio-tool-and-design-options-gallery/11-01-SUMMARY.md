---
phase: 11-rendering-studio-tool-and-design-options-gallery
plan: 01
subsystem: ui
tags: [sanity-studio, react, typescript, heic, blob-auth, vitest]

# Dependency graph
requires:
  - phase: 10-ai-rendering-engine
    provides: "Sanity schemas (renderingSession, designOption), GROQ queries, STUDIO_API_SECRET auth pattern, rendering API routes"
provides:
  - "Shared TypeScript interfaces for rendering tool and portal (types.ts)"
  - "Sanity Studio tool shell with Sessions/Design Options tabs (RenderingTool.tsx)"
  - "ToolContext with useReducer state management for child components"
  - "UsageBadge component with 3-tier color coding"
  - "RenderingToolPlugin factory function registered in sanity.config.ts"
  - "HEIC/HEIF upload support in blob-upload"
  - "Dual-auth blob-serve (portal session + studio token)"
  - "SANITY_STUDIO_API_SECRET env var for Vite client-side bundling"
  - "Wave 0 test stubs (31 todos across 4 files) for Nyquist compliance"
affects: [11-02, 11-03, 11-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["useReducer + createContext for Sanity Studio tool state", "SANITY_STUDIO_ prefix for client-side env vars in Vite", "dual-auth blob serving (session cookie OR x-studio-token header)", "Wave 0 it.todo stubs for deferred test implementation"]

key-files:
  created:
    - src/sanity/components/rendering/types.ts
    - src/sanity/components/rendering/UsageBadge.tsx
    - src/sanity/components/rendering/RenderingToolPlugin.ts
    - src/sanity/components/rendering/RenderingTool.tsx
    - src/sanity/components/rendering/PromoteDialog.test.ts
    - src/sanity/components/rendering/UsageBadge.test.ts
    - src/components/portal/DesignOptionsSection.test.ts
    - src/components/portal/DesignOptionLightbox.test.ts
  modified:
    - sanity.config.ts
    - src/pages/api/blob-upload.ts
    - src/pages/api/blob-serve.ts
    - .env.example

key-decisions:
  - "SANITY_STUDIO_API_SECRET duplicated from STUDIO_API_SECRET -- Vite only bundles SANITY_STUDIO_ prefixed vars to client-side Studio code"
  - "ToolContext exported as createContext for child component consumption via useToolContext() hook"
  - "Tab bar hidden during wizard and session-detail views per UI spec"
  - "blob-serve dual auth: portal session cookie OR x-studio-token header matching STUDIO_API_SECRET"

patterns-established:
  - "useReducer+createContext: RenderingTool manages tool state via ToolContext, child components use useToolContext()"
  - "Studio env vars: prefix with SANITY_STUDIO_ for Vite client-side bundling"
  - "Dual-auth blob serving: session cookie for portal, x-studio-token for Studio"

requirements-completed: [RNDR-04]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 11 Plan 01: Foundation Summary

**Wave 0 test stubs (31 todos), shared TypeScript types, Sanity Studio tool shell with Sessions/Design Options tabs, UsageBadge, HEIC upload, and dual-auth blob serving**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T05:02:30Z
- **Completed:** 2026-03-18T05:06:50Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- 31 Wave 0 test stubs across 4 files for Nyquist compliance (PromoteDialog, UsageBadge, DesignOptionsSection, DesignOptionLightbox)
- Shared types.ts with 15 interfaces/types covering rendering sessions, design options, wizard state, and tool actions
- RenderingTool.tsx: full tool shell with tab routing, ToolContext, usage badge, and placeholder views for Plans 02-04
- Infrastructure: HEIC/HEIF upload support, dual-auth blob serving, SANITY_STUDIO_ env var

## Task Commits

Each task was committed atomically:

1. **Task 0: Create Wave 0 test stubs** - `c625c43` (test)
2. **Task 1: Types, UsageBadge, tool plugin, infrastructure** - `e37a916` (feat)
3. **Task 2: RenderingTool component and sanity.config.ts** - `ba36c48` (feat)

## Files Created/Modified
- `src/sanity/components/rendering/types.ts` - 15 shared interfaces, helper functions (getStudioHeaders, getImageServeUrl, isWizardDirty)
- `src/sanity/components/rendering/UsageBadge.tsx` - Color-coded usage badge (green <80%, amber 80-95%, red >=95%)
- `src/sanity/components/rendering/RenderingToolPlugin.ts` - Tool factory function with SparklesIcon
- `src/sanity/components/rendering/RenderingTool.tsx` - Main tool component with tab routing, ToolContext, useReducer state
- `src/sanity/components/rendering/PromoteDialog.test.ts` - 7 todo test stubs
- `src/sanity/components/rendering/UsageBadge.test.ts` - 6 todo test stubs
- `src/components/portal/DesignOptionsSection.test.ts` - 7 todo test stubs
- `src/components/portal/DesignOptionLightbox.test.ts` - 11 todo test stubs
- `sanity.config.ts` - Added renderingTool() to tools array
- `src/pages/api/blob-upload.ts` - Added image/heic and image/heif to allowed content types
- `src/pages/api/blob-serve.ts` - Added x-studio-token auth path alongside session auth
- `.env.example` - Added STUDIO_API_SECRET and SANITY_STUDIO_API_SECRET entries

## Decisions Made
- SANITY_STUDIO_API_SECRET duplicated from STUDIO_API_SECRET because Vite only bundles variables prefixed with SANITY_STUDIO_ to client-side Studio code
- ToolContext exported via createContext so SessionList, WizardContainer, ChatView (Plans 02-03) can import useToolContext()
- Tab bar hidden during wizard and session-detail views per UI spec
- blob-serve accepts dual auth: portal session cookie (existing) OR x-studio-token header (new) matching STUDIO_API_SECRET

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added STUDIO_API_SECRET to .env alongside SANITY_STUDIO_API_SECRET**
- **Found during:** Task 1 (.env update)
- **Issue:** Plan assumed STUDIO_API_SECRET already existed in .env, but it was not present (likely set only in Vercel env vars)
- **Fix:** Added both STUDIO_API_SECRET and SANITY_STUDIO_API_SECRET with placeholder values to .env
- **Files modified:** .env
- **Verification:** grep confirms both vars present
- **Committed in:** not committed (.env is gitignored)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for local dev to have both env vars. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. SANITY_STUDIO_API_SECRET was added to .env.example for documentation. The .env file uses placeholder values that should be set to the same value as the Vercel STUDIO_API_SECRET.

## Next Phase Readiness
- Tool shell is registered and renders in Sanity Studio sidebar
- ToolContext and types.ts provide the contract for Plans 02 (Wizard+SessionList), 03 (ChatView+PromoteDialog), and 04 (PortalGallery)
- Wave 0 test stubs are in place for all 4 validation test files
- HEIC upload and dual-auth blob serving are ready for rendering image workflows

## Self-Check: PASSED

All 9 created files verified present. All 3 task commits (c625c43, e37a916, ba36c48) verified in git log.

---
*Phase: 11-rendering-studio-tool-and-design-options-gallery*
*Plan: 01*
*Completed: 2026-03-18*

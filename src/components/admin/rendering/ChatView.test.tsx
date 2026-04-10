import { describe, it } from "vitest";
// RNDR-03: Chat refinement view (admin)
// Source of truth: src/sanity/components/rendering/ChatView.tsx
// Port action: verbatim logic port (D-13) — replace useClient() and useToolContext()
// with fetch calls to /api/rendering/status and studioToken prop. Layout shell and
// colors swapped to Tailwind + luxury admin tokens per 33-UI-SPEC.md section 4.
describe("ChatView (admin)", () => {
  it.todo("mounts with initialSession prop and does not re-fetch on mount");
  it.todo("polls GET /api/rendering/status every 2s while session.status === 'generating'");
  it.todo("handleRefine POSTs /api/rendering/refine with {sessionId, refinementText, sanityUserId} and x-studio-token header");
  it.todo("send button is disabled while isRefining is true");
  it.todo("optimistic user message appears in the thread immediately after Send");
  it.todo("Promote button in the chat header opens the placeholder drawer state (Plan 06 replaces the drawer)");
  it.todo("uses side-by-side 65/35 flex layout at >=900px viewport width");
  it.todo("collapses to stacked layout at <900px viewport width (media query match)");
  it.todo("ThumbnailStrip only renders when session.renderings.length > 1");
  it.todo("no useClient / useCurrentUser / useToolContext imports (Studio hooks removed)");
});

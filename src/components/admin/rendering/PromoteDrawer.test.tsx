import { describe, it } from "vitest";
// RNDR-04: Promote to Design Options (admin)
// Source of truth: src/sanity/components/rendering/PromoteDialog.tsx
// Port action: verbatim logic port (D-13) — replace the Sanity client hook and
// the tool-context hook with explicit props (studioToken, sanityUserId).
// Replace the @sanity/ui Dialog modal shell with the Phase 32 parchment
// right-side drawer pattern per 33-UI-SPEC.md section 8 (D-18).
describe("PromoteDrawer (admin)", () => {
  it.todo(
    "POSTs /api/rendering/promote with {sessionId, renderingIndex, projectId, caption, sanityUserId} and x-studio-token header on Publish click (RNDR-04)",
  );
  it.todo(
    "calls onSuccess and onClose after the promote request returns 2xx (drawer closes, parent shows toast)",
  );
  it.todo(
    "shows red 'Could not publish. Please try again.' error banner inside the drawer body when fetch fails; drawer stays open",
  );
  it.todo(
    "renders the variant thumbnail strip only when session.renderings.length > 1 (D-19)",
  );
  it.todo(
    "closes via X icon click, Escape key press, and overlay click (three dismissal paths)",
  );
  it.todo(
    "Publish button is solid bg-[#9A7B4B] text-white (not outlined) per D-18",
  );
  it.todo(
    "reads studioToken from props and does not access import.meta.env (T-33-01 mitigation)",
  );
});

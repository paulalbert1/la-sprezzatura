import { describe, it } from "vitest";
// RNDR-04: Promote to Design Options — promote.ts creates designOption doc
// Existing: PromoteDialog.test.ts in Studio is the behavioral reference
describe("POST /api/rendering/promote", () => {
  it.todo("returns 401 when x-studio-token header is missing or invalid");
  it.todo("returns 400 when sessionId, renderingIndex, or projectId is missing");
  it.todo("creates a designOption document in Sanity with correct fields (project, blobPathname, caption, sourceSession, sourceRenderingIndex, promotedBy)");
  it.todo("patches renderingSession: renderings[renderingIndex].isPromoted = true");
  it.todo("returns { success: true, designOptionId }");
});

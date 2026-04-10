import { describe, it } from "vitest";
// RNDR-03: Chat refinement API — refine.ts passes conversation history to Gemini
// Existing: generate.test.ts is the structural reference
describe("POST /api/rendering/refine", () => {
  it.todo("returns 401 when x-studio-token header is missing or invalid");
  it.todo("returns 400 when sessionId or refinementText is missing from body");
  it.todo("calls refineRendering() with full conversation history array from session");
  it.todo("appends new rendering output to session.renderings[]");
  it.todo("appends user refinement and model response to session.conversation[]");
  it.todo("returns 202 immediately and processes via waitUntil");
});

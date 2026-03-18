import { describe, it } from "vitest";

describe("PromoteDialog", () => {
  it.todo("renders promote dialog with caption input for project-linked sessions");
  it.todo("shows project picker for scratchpad sessions");
  it.todo("disables Promote button when no project selected for scratchpad");
  it.todo("calls /api/rendering/promote with correct payload on promote");
  it.todo("calls /api/rendering/promote with unpromote: true on unpromote");
  it.todo("closes dialog and calls onPromoted callback on success");
  it.todo("shows error message on API failure");
});

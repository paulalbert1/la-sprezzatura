import { describe, it } from "vitest";

describe("UsageBadge", () => {
  it.todo("renders green badge when usage < 80%");
  it.todo("renders amber badge when usage >= 80% and < 95%");
  it.todo("renders red/critical badge when usage >= 95%");
  it.todo("displays count/limit format like '5/20 this month'");
  it.todo("handles zero limit without division error");
  it.todo("renders compact variant with smaller font size");
});

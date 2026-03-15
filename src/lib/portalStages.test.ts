import { describe, it, expect } from "vitest";
import { STAGES, STAGE_META, type StageKey, type StageMeta } from "./portalStages";

describe("portalStages", () => {
  const expectedOrder: StageKey[] = [
    "discovery",
    "concept",
    "design-development",
    "procurement",
    "installation",
    "closeout",
  ];

  it("STAGES has exactly 6 entries", () => {
    expect(STAGES).toHaveLength(6);
  });

  it("STAGES are in the correct order", () => {
    const values = STAGES.map((s) => s.value);
    expect(values).toEqual(expectedOrder);
  });

  it("each StageMeta has a non-empty value, title, and description", () => {
    for (const stage of STAGES) {
      expect(stage.value).toBeTruthy();
      expect(typeof stage.value).toBe("string");
      expect(stage.title).toBeTruthy();
      expect(typeof stage.title).toBe("string");
      expect(stage.description).toBeTruthy();
      expect(typeof stage.description).toBe("string");
    }
  });

  it("STAGE_META maps each StageKey to the corresponding StageMeta", () => {
    for (const stage of STAGES) {
      const meta = STAGE_META[stage.value];
      expect(meta).toBeDefined();
      expect(meta.value).toBe(stage.value);
      expect(meta.title).toBe(stage.title);
      expect(meta.description).toBe(stage.description);
    }
  });

  it("STAGE_META has exactly 6 entries", () => {
    expect(Object.keys(STAGE_META)).toHaveLength(6);
  });
});

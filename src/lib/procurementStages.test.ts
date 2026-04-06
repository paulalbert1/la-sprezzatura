import { describe, it, expect } from "vitest";
import {
  PROCUREMENT_STAGES,
  PROCUREMENT_STAGE_META,
  getProcurementTone,
  getProcurementOptionsList,
} from "./procurementStages";
import type { ProcurementStageKey, SanityTone } from "./procurementStages";

describe("procurementStages", () => {
  describe("PROCUREMENT_STAGES", () => {
    it("has exactly 6 entries", () => {
      expect(PROCUREMENT_STAGES).toHaveLength(6);
    });

    it("first entry is not-yet-ordered (chronological order)", () => {
      expect(PROCUREMENT_STAGES[0].value).toBe("not-yet-ordered");
    });

    it("last entry is installed (chronological order)", () => {
      expect(PROCUREMENT_STAGES[5].value).toBe("installed");
    });

    it("each stage has a non-empty title and a valid SanityTone", () => {
      const validTones: SanityTone[] = [
        "default",
        "primary",
        "positive",
        "caution",
        "critical",
      ];
      for (const stage of PROCUREMENT_STAGES) {
        expect(stage.title).toBeTruthy();
        expect(validTones).toContain(stage.tone);
      }
    });
  });

  describe("PROCUREMENT_STAGE_META", () => {
    it("maps delivered to tone positive", () => {
      expect(PROCUREMENT_STAGE_META["delivered"].tone).toBe("positive");
    });
  });

  describe("getProcurementTone", () => {
    it("returns positive for delivered", () => {
      expect(getProcurementTone("delivered")).toBe("positive");
    });

    it("returns default for unknown values (fallback)", () => {
      expect(getProcurementTone("bogus")).toBe("default");
    });
  });

  describe("getProcurementOptionsList", () => {
    it("returns 6 items", () => {
      expect(getProcurementOptionsList()).toHaveLength(6);
    });

    it("first item has value not-yet-ordered", () => {
      expect(getProcurementOptionsList()[0].value).toBe("not-yet-ordered");
    });

    it("first item has title Not Yet Ordered", () => {
      expect(getProcurementOptionsList()[0].title).toBe("Not Yet Ordered");
    });
  });
});

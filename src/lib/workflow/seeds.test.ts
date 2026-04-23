import { describe, it, expect } from "vitest";
import { ALL_SEEDS, SEED_FULL_SERVICE_RESIDENTIAL, SEED_DESIGN_CONSULTATION, SEED_STAGING } from "./seeds";
import type { WorkflowTemplate } from "./types";

describe("starter template seeds", () => {
  it("exports exactly three seeds in ALL_SEEDS", () => {
    expect(ALL_SEEDS).toHaveLength(3);
  });

  it("every seed uses contract-default values (spec §9)", () => {
    for (const seed of ALL_SEEDS) {
      expect(seed.defaults.clientApprovalDays).toBe(10);
      expect(seed.defaults.dormancyDays).toBe(60);
      expect(seed.defaults.revisionRounds).toBe(1);
      expect(seed.version).toBe(1);
    }
  });

  it("full-service residential has 6 phases with distinct names", () => {
    expect(SEED_FULL_SERVICE_RESIDENTIAL.phases).toHaveLength(6);
    const names = SEED_FULL_SERVICE_RESIDENTIAL.phases.map((p) => p.name);
    expect(new Set(names).size).toBe(6);
  });

  it("full-service residential has at least one payment gate and one approval gate", () => {
    const all = SEED_FULL_SERVICE_RESIDENTIAL.phases.flatMap((p) => p.milestones);
    expect(all.some((m) => m.gate === "payment")).toBe(true);
    expect(all.some((m) => m.gate === "approval")).toBe(true);
  });

  it("full-service residential has at least one multiInstance milestone with defaults", () => {
    const all = SEED_FULL_SERVICE_RESIDENTIAL.phases.flatMap((p) => p.milestones);
    expect(all.some((m) => m.multiInstance && m.defaultInstances.length >= 1)).toBe(true);
  });

  it("design consultation has 3 phases and 8+ milestones total", () => {
    expect(SEED_DESIGN_CONSULTATION.phases).toHaveLength(3);
    const total = SEED_DESIGN_CONSULTATION.phases.reduce((n, p) => n + p.milestones.length, 0);
    expect(total).toBeGreaterThanOrEqual(8);
  });

  it("staging has 5 phases", () => {
    expect(SEED_STAGING.phases).toHaveLength(5);
  });

  it("milestone ids are unique within each template", () => {
    for (const seed of ALL_SEEDS) {
      const ids = seed.phases.flatMap((p) => p.milestones.map((m) => m.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("every phase/milestone carries a _key for Sanity", () => {
    for (const seed of ALL_SEEDS) {
      for (const p of seed.phases) {
        expect(typeof p._key).toBe("string");
        for (const m of p.milestones) {
          expect(typeof m._key).toBe("string");
        }
      }
    }
  });
});

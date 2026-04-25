import { describe, it, expect } from "vitest";
import {
  canTransition, getAvailableTransitions, computeDerivedStatus,
  isBlocked, isPhaseStartable, detectDormancy, isApprovalOverdue,
  computeWarnings, computeMetrics, instantiateFromTemplate,
} from "./engine";
import {
  buildWorkflow, buildPhaseInstance, buildMilestoneInstance,
  buildTemplate, buildPhaseTemplate, buildMilestoneTemplate,
  buildKoenigExample,
} from "./__fixtures__/workflows";

describe("canTransition — hard prereq enforcement", () => {
  it("blocks not_started → in_progress when a hard prereq is incomplete", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [
          buildMilestoneInstance({ id: "a", status: "in_progress" }),
          buildMilestoneInstance({ id: "b", hardPrereqs: ["a"] }),
        ],
      })],
    });
    const r = canTransition(w, "p1", "b", "in_progress");
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/needs.*completed/i);
  });

  it("allows not_started → in_progress when hard prereqs are complete", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [
          buildMilestoneInstance({ id: "a", status: "complete" }),
          buildMilestoneInstance({ id: "b", hardPrereqs: ["a"] }),
        ],
      })],
    });
    expect(canTransition(w, "p1", "b", "in_progress").allowed).toBe(true);
  });

  it("skipped counts as prereq-satisfying (A1)", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [
          buildMilestoneInstance({ id: "a", optional: true, status: "skipped" }),
          buildMilestoneInstance({ id: "b", hardPrereqs: ["a"] }),
        ],
      })],
    });
    expect(canTransition(w, "p1", "b", "in_progress").allowed).toBe(true);
  });
});

describe("canTransition — gate enforcement", () => {
  it("blocks in_progress → complete when payment gate has no linkedPaymentId", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [buildMilestoneInstance({ id: "m", status: "in_progress", gate: "payment" })],
      })],
    });
    const r = canTransition(w, "p1", "m", "complete");
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/payment/i);
  });

  it("allows in_progress → complete when payment gate is cleared (linkedPaymentId present)", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [buildMilestoneInstance({ id: "m", status: "in_progress", gate: "payment", linkedPaymentId: "pay-123" })],
      })],
    });
    expect(canTransition(w, "p1", "m", "complete").allowed).toBe(true);
  });

  it("allows approval short-circuit awaiting_client → complete when approvalReceivedAt set", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [buildMilestoneInstance({ id: "m", status: "awaiting_client", gate: "approval", approvalReceivedAt: new Date().toISOString() })],
      })],
    });
    expect(canTransition(w, "p1", "m", "complete").allowed).toBe(true);
  });
});

describe("computeDerivedStatus — multi-instance aggregation (spec §3.3)", () => {
  it("returns complete only when every instance is complete", () => {
    expect(computeDerivedStatus([
      { _key: "1", name: "a", status: "complete", fromTemplate: true },
      { _key: "2", name: "b", status: "complete", fromTemplate: true },
    ])).toBe("complete");
  });
  it("returns in_progress when any instance is in_progress and none awaiting", () => {
    expect(computeDerivedStatus([
      { _key: "1", name: "a", status: "complete", fromTemplate: true },
      { _key: "2", name: "b", status: "in_progress", fromTemplate: true },
    ])).toBe("in_progress");
  });
  it("returns awaiting_client when any instance is awaiting_client", () => {
    expect(computeDerivedStatus([
      { _key: "1", name: "a", status: "awaiting_client", fromTemplate: true },
      { _key: "2", name: "b", status: "in_progress", fromTemplate: true },
    ])).toBe("awaiting_client");
  });
  it("returns not_started when every instance is not_started", () => {
    expect(computeDerivedStatus([
      { _key: "1", name: "a", status: "not_started", fromTemplate: true },
      { _key: "2", name: "b", status: "not_started", fromTemplate: true },
    ])).toBe("not_started");
  });
  it("ignores skipped instances like complete for aggregation", () => {
    expect(computeDerivedStatus([
      { _key: "1", name: "a", status: "skipped", fromTemplate: true },
      { _key: "2", name: "b", status: "complete", fromTemplate: true },
    ])).toBe("complete");
  });
});

describe("isPhaseStartable — canOverlapWith (Pitfall 5)", () => {
  it("phase 4 is startable while phase 3 in_progress IF phase 3 declares overlap", () => {
    const w = buildKoenigExample();
    expect(isPhaseStartable(w, "project-management")).toBe(true);
  });
  it("a sequential phase is NOT startable until previous phases complete", () => {
    const w = buildWorkflow({
      phases: [
        buildPhaseInstance({ id: "a", order: 0, milestones: [buildMilestoneInstance({ id: "a1", status: "in_progress" })] }),
        buildPhaseInstance({ id: "b", order: 1, execution: "sequential", milestones: [] }),
      ],
    });
    expect(isPhaseStartable(w, "b")).toBe(false);
  });
});

describe("canTransition — optional skip (Pitfall 6)", () => {
  it("allows skip on optional milestone when no downstream is in_progress or later", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [
          buildMilestoneInstance({ id: "a", optional: true }),
          buildMilestoneInstance({ id: "b", hardPrereqs: ["a"], status: "not_started" }),
        ],
      })],
    });
    expect(canTransition(w, "p1", "a", "skipped").allowed).toBe(true);
  });
  it("blocks skip when a downstream milestone is already in_progress", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [
          buildMilestoneInstance({ id: "a", optional: true }),
          buildMilestoneInstance({ id: "b", hardPrereqs: ["a"], status: "in_progress" }),
        ],
      })],
    });
    const r = canTransition(w, "p1", "a", "skipped");
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/downstream/i);
  });
  it("blocks skip on a non-optional milestone", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [buildMilestoneInstance({ id: "a", optional: false })],
      })],
    });
    expect(canTransition(w, "p1", "a", "skipped").allowed).toBe(false);
  });
});

describe("detectDormancy", () => {
  it("flags dormant when lastActivityAt older than dormancyDays calendar days", () => {
    const old = new Date("2026-01-01T00:00:00Z").toISOString();
    const w = buildWorkflow({ lastActivityAt: old, defaults: { clientApprovalDays: 10, dormancyDays: 60, revisionRounds: 1 } });
    const now = new Date("2026-04-20T00:00:00Z");
    const r = detectDormancy(w, now);
    expect(r.dormant).toBe(true);
    expect(r.daysSinceActivity).toBeGreaterThanOrEqual(60);
  });
  it("does not flag dormant before threshold", () => {
    const recent = new Date("2026-04-15T00:00:00Z").toISOString();
    const w = buildWorkflow({ lastActivityAt: recent });
    const now = new Date("2026-04-20T00:00:00Z");
    expect(detectDormancy(w, now).dormant).toBe(false);
  });
});

describe("isApprovalOverdue (Pitfall 4)", () => {
  it("counts business days — not calendar days", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [buildMilestoneInstance({ id: "m", status: "awaiting_client", gate: "approval", startedAt: "2026-04-17T00:00:00Z" })],
      })],
    });
    // Fri → Mon = 1 biz day, NOT 3 calendar days
    const r = isApprovalOverdue(w, "p1", "m", new Date("2026-04-20T12:00:00Z"));
    expect(r.businessDaysWaiting).toBe(1);
  });
  it("flags severelyOverdue when > 2× clientApprovalDays business days", () => {
    const startedAt = "2026-03-01T00:00:00Z"; // plenty of biz days earlier
    const w = buildWorkflow({
      defaults: { clientApprovalDays: 5, dormancyDays: 60, revisionRounds: 1 },
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [buildMilestoneInstance({ id: "m", status: "awaiting_client", gate: "approval", startedAt })],
      })],
    });
    const r = isApprovalOverdue(w, "p1", "m", new Date("2026-04-20T00:00:00Z"));
    expect(r.overdue).toBe(true);
    expect(r.severelyOverdue).toBe(true);
  });
});

describe("computeMetrics", () => {
  it("returns zero-state for empty workflow", () => {
    const w = buildWorkflow();
    expect(computeMetrics(w)).toEqual({ complete: 0, inProgress: 0, awaitingClient: 0, blocked: 0, progressPct: 0 });
  });
  it("counts statuses across all phases; awaitingClient includes awaiting_payment", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [
          buildMilestoneInstance({ id: "a", status: "complete" }),
          buildMilestoneInstance({ id: "b", status: "in_progress" }),
          buildMilestoneInstance({ id: "c", status: "awaiting_client" }),
          buildMilestoneInstance({ id: "d", status: "awaiting_payment" }),
          buildMilestoneInstance({ id: "e", status: "not_started", hardPrereqs: ["b"] }),
        ],
      })],
    });
    const m = computeMetrics(w);
    expect(m.complete).toBe(1);
    expect(m.inProgress).toBe(1);
    expect(m.awaitingClient).toBe(2);
    expect(m.blocked).toBe(1);
    expect(m.progressPct).toBeGreaterThanOrEqual(0);
  });
});

describe("computeWarnings", () => {
  it("emits a dormant warning when workflow status is dormant", () => {
    const w = buildWorkflow({ status: "dormant", lastActivityAt: new Date("2026-01-01").toISOString() });
    const ws = computeWarnings(w, new Date("2026-04-20"));
    expect(ws.some((x) => x.kind === "dormant")).toBe(true);
  });
});

describe("instantiateFromTemplate", () => {
  it("snapshots phases/milestones and pre-populates defaultInstances with fromTemplate: true", () => {
    const template = buildTemplate({
      phases: [buildPhaseTemplate({
        id: "p1",
        milestones: [buildMilestoneTemplate({
          id: "m1",
          multiInstance: true,
          defaultInstances: [{ _key: "x", name: "ABC Carpet" }, { _key: "y", name: "Mike's Electric" }],
        })],
      })],
    });
    const instance = instantiateFromTemplate(template);
    expect(instance.templateId).toBe(template._id);
    expect(instance.templateVersion).toBe(1);
    expect(instance.status).toBe("active");
    expect(instance.phases).toHaveLength(1);
    const ms = instance.phases[0].milestones[0];
    expect(ms.status).toBe("not_started");
    expect(ms.instances).toHaveLength(2);
    expect(ms.instances?.every((i) => i.fromTemplate === true)).toBe(true);
    expect(ms.instances?.every((i) => i.status === "not_started")).toBe(true);
  });
});

describe("isBlocked", () => {
  it("returns blocked=true when hard prereqs unmet", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [
          buildMilestoneInstance({ id: "a", status: "in_progress" }),
          buildMilestoneInstance({ id: "b", hardPrereqs: ["a"] }),
        ],
      })],
    });
    const r = isBlocked(w, "p1", "b");
    expect(r.blocked).toBe(true);
  });
});

describe("getAvailableTransitions", () => {
  it("only surfaces skipped as an option when the milestone is optional", () => {
    const w = buildWorkflow({
      phases: [buildPhaseInstance({
        id: "p1",
        milestones: [buildMilestoneInstance({ id: "m", optional: false })],
      })],
    });
    const opts = getAvailableTransitions(w, "p1", "m");
    const skipped = opts.find((o) => o.status === "skipped");
    expect(skipped === undefined || skipped.allowed === false).toBe(true);
  });
});

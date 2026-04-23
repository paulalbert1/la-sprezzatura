import type {
  ContractorInstance,
  MilestoneInstance,
  MilestoneTemplate,
  PhaseInstance,
  PhaseTemplate,
  ProjectWorkflow,
  WorkflowTemplate,
} from "../types";

const K = () => Math.random().toString(36).slice(2, 10);

export function buildMilestoneTemplate(overrides: Partial<MilestoneTemplate> = {}): MilestoneTemplate {
  return {
    _key: K(),
    id: overrides.id ?? "ms-" + K(),
    name: "Milestone",
    assignee: "designer",
    gate: null,
    optional: false,
    multiInstance: false,
    hardPrereqs: [],
    softPrereqs: [],
    defaultInstances: [],
    ...overrides,
  };
}

export function buildPhaseTemplate(overrides: Partial<PhaseTemplate> = {}): PhaseTemplate {
  return {
    _key: K(),
    id: overrides.id ?? "phase-" + K(),
    name: "Phase",
    order: 0,
    execution: "sequential",
    canOverlapWith: [],
    milestones: [],
    ...overrides,
  };
}

export function buildTemplate(overrides: Partial<WorkflowTemplate> = {}): WorkflowTemplate {
  return {
    _id: "wt-" + K(),
    _type: "workflowTemplate",
    name: "Test template",
    version: 1,
    defaults: { clientApprovalDays: 10, dormancyDays: 60, revisionRounds: 1 },
    phases: [],
    ...overrides,
  };
}

export function buildMilestoneInstance(overrides: Partial<MilestoneInstance> = {}): MilestoneInstance {
  return {
    _key: K(),
    id: overrides.id ?? "ms-" + K(),
    name: "Milestone",
    assignee: "designer",
    gate: null,
    optional: false,
    multiInstance: false,
    hardPrereqs: [],
    softPrereqs: [],
    status: "not_started",
    ...overrides,
  };
}

export function buildPhaseInstance(overrides: Partial<PhaseInstance> = {}): PhaseInstance {
  return {
    _key: K(),
    id: overrides.id ?? "phase-" + K(),
    name: "Phase",
    order: 0,
    execution: "sequential",
    canOverlapWith: [],
    milestones: [],
    ...overrides,
  };
}

export function buildWorkflow(overrides: Partial<ProjectWorkflow> = {}): ProjectWorkflow {
  const now = new Date().toISOString();
  return {
    _id: "pw-" + K(),
    _type: "projectWorkflow",
    project: { _type: "reference", _ref: "proj-abc" },
    templateId: "wt-abc",
    templateVersion: 1,
    status: "active",
    defaults: { clientApprovalDays: 10, dormancyDays: 60, revisionRounds: 1 },
    phases: [],
    createdAt: now,
    lastActivityAt: now,
    ...overrides,
  };
}

export function buildKoenigExample(): ProjectWorkflow {
  // Mirrors spec §5 at just enough fidelity to drive Pitfall-5 overlap tests.
  const onboarding = buildPhaseInstance({
    id: "onboarding", name: "Onboarding", order: 0,
    milestones: [
      buildMilestoneInstance({ id: "agreement", name: "Agreement", status: "complete", gate: "signature" }),
      buildMilestoneInstance({ id: "retainer-paid", name: "Retainer paid", status: "complete", gate: "payment", hardPrereqs: ["agreement"] }),
    ],
  });
  const design = buildPhaseInstance({ id: "design", name: "Design development", order: 1, milestones: [] });
  const tradeCoord = buildPhaseInstance({
    id: "trade-coord", name: "Trade coordination", order: 2,
    execution: "parallel",
    canOverlapWith: ["project-management"],
    milestones: [
      buildMilestoneInstance({ id: "site-measuring", name: "Site measuring", status: "complete", multiInstance: true }),
      buildMilestoneInstance({ id: "trade-contract", name: "Trade contract", gate: "approval", assignee: "client" }),
    ],
  });
  const projectMgmt = buildPhaseInstance({
    id: "project-management", name: "Project management & procurement", order: 3,
    execution: "parallel",
    milestones: [
      buildMilestoneInstance({ id: "merch-payment", name: "Merchandise payment", gate: "payment", status: "awaiting_payment", startedAt: "2026-04-10T00:00:00Z" }),
      buildMilestoneInstance({ id: "ordering", name: "Ordering", hardPrereqs: ["merch-payment"] }),
    ],
  });
  return buildWorkflow({ phases: [onboarding, design, tradeCoord, projectMgmt] });
}

import type {
  ContractorInstance,
  MilestoneInstance,
  MilestoneStatus,
  PhaseInstance,
  ProjectWorkflow,
  TransitionResult,
  Warning,
  WorkflowMetrics,
  WorkflowTemplate,
} from "./types";
import { businessDaysBetween } from "./businessDays";

// ===== Internal helpers =====

const GATES_REQUIRING_CLEAR: Record<string, (m: MilestoneInstance) => boolean> = {
  payment: (m) => Boolean(m.linkedPaymentId),
  approval: (m) => Boolean(m.approvalReceivedAt),
  signature: (m) => Boolean(m.signedAt),
  delivery: (m) => Boolean(m.deliveredAt),
};

// Human-readable reasons surfaced when a gate blocks a "Complete" transition.
const GATE_REASONS: Record<string, string> = {
  payment: "Record payment first",
  approval: "Record client approval first",
  signature: "Record client signature first",
  delivery: "Record delivery first",
};

// Custom labels for the Complete option when the admin clicks through a gate.
// Surfaces the otherwise-hidden gate event as an explicit step in the popover.
const GATE_AUTO_LABELS: Record<string, string> = {
  payment: "Mark paid & complete",
  approval: "Mark approved & complete",
  signature: "Mark signed & complete",
  delivery: "Mark delivered & complete",
};

const GATE_AUTO_HINTS: Record<string, string> = {
  payment: "Records payment now",
  approval: "Records approval now",
  signature: "Records signature now",
  delivery: "Records delivery now",
};

// Labels surfaced when reverting a complete milestone. The popover prefixes
// each with "Revert to " so the click reads as a destructive op, not a routine
// status pick.
const REVERT_LABELS: Record<string, string> = {
  not_started: "not started",
  in_progress: "in progress",
  awaiting_client: "awaiting client",
  awaiting_payment: "awaiting payment",
  skipped: "skipped",
};

function findMilestone(
  workflow: ProjectWorkflow,
  phaseId: string,
  milestoneId: string,
): { phase: PhaseInstance; milestone: MilestoneInstance } | null {
  const phase = workflow.phases.find((p) => p.id === phaseId);
  if (!phase) return null;
  const milestone = phase.milestones.find((m) => m.id === milestoneId);
  if (!milestone) return null;
  return { phase, milestone };
}

/**
 * Returns true if the prereq milestone is satisfied (complete or skipped).
 * spec §3.6 + Assumption A1: skipped satisfies hard prereqs.
 */
function isPrereqSatisfied(workflow: ProjectWorkflow, prereqId: string): boolean {
  for (const p of workflow.phases) {
    const m = p.milestones.find((x) => x.id === prereqId);
    if (m) return m.status === "complete" || m.status === "skipped";
  }
  return true; // unknown prereq id is treated as a no-op
}

/**
 * Returns true if any downstream milestone (one that lists milestoneId as a
 * hard prereq) has already progressed beyond not_started or skipped.
 * Used by the optional-skip guard (Pitfall 6).
 */
function hasDownstreamStarted(workflow: ProjectWorkflow, milestoneId: string): boolean {
  for (const p of workflow.phases) {
    for (const m of p.milestones) {
      if (
        m.hardPrereqs.includes(milestoneId) &&
        m.status !== "not_started" &&
        m.status !== "skipped"
      ) {
        return true;
      }
    }
  }
  return false;
}

// ===== Exported engine functions =====

/**
 * Can this phase start based on previous phases + overlap rules (spec §3.2)?
 * A phase is startable when all earlier phases (by order) are either:
 *  1. Fully complete (all milestones complete or skipped), OR
 *  2. Declaring canOverlapWith containing this phase's id.
 */
export function isPhaseStartable(workflow: ProjectWorkflow, phaseId: string): boolean {
  const phase = workflow.phases.find((p) => p.id === phaseId);
  if (!phase) return false;
  const earlier = workflow.phases.filter((p) => p.order < phase.order);
  return earlier.every((p) => {
    const allDone = p.milestones.every((m) => m.status === "complete" || m.status === "skipped");
    if (allDone) return true;
    return p.canOverlapWith.includes(phaseId);
  });
}

/**
 * Is a milestone currently blocked by unmet hard prereqs or a non-startable phase?
 */
function findMilestoneById(
  workflow: ProjectWorkflow,
  milestoneId: string,
): { name: string } | null {
  for (const p of workflow.phases) {
    const m = p.milestones.find((x) => x.id === milestoneId);
    if (m) return { name: m.name };
  }
  return null;
}

export function isBlocked(
  workflow: ProjectWorkflow,
  phaseId: string,
  milestoneId: string,
): { blocked: boolean; reason?: string; prereqName?: string } {
  const found = findMilestone(workflow, phaseId, milestoneId);
  if (!found) return { blocked: true, reason: "Milestone not found" };
  const { milestone } = found;
  // Already-finished milestones can't be "blocked" — they're done. This avoids
  // the StatusCircle rendering complete rows as gray when an earlier phase
  // still has unfinished work that would otherwise mark this phase non-startable.
  if (milestone.status === "complete" || milestone.status === "skipped") {
    return { blocked: false };
  }
  for (const prereqId of milestone.hardPrereqs) {
    if (!isPrereqSatisfied(workflow, prereqId)) {
      const prereq = findMilestoneById(workflow, prereqId);
      return {
        blocked: true,
        reason: prereq
          ? `Needs ${prereq.name} to be completed`
          : `Needs prereq ${prereqId} to be completed`,
        prereqName: prereq?.name,
      };
    }
  }
  if (!isPhaseStartable(workflow, phaseId)) {
    return { blocked: true, reason: "Earlier phase not finished" };
  }
  return { blocked: false };
}

/**
 * Find the first not_started, not-blocked milestone the user can act on.
 * Returns identifying keys + display name, or null if nothing is actionable
 * (everything is blocked, complete, or in-flight).
 *
 * Used by the Schedule view to surface a "Next up" cue.
 */
export function getNextActionableMilestone(
  workflow: ProjectWorkflow,
): { phaseId: string; milestoneId: string; name: string } | null {
  for (const p of workflow.phases) {
    for (const m of p.milestones) {
      if (m.status !== "not_started") continue;
      if (isBlocked(workflow, p.id, m.id).blocked) continue;
      return { phaseId: p.id, milestoneId: m.id, name: m.name };
    }
  }
  return null;
}

/**
 * Can a single milestone move to targetStatus right now?
 * Enforces: hard prereqs, gate clearance, optional-skip protection, phase startability.
 */
export function canTransition(
  workflow: ProjectWorkflow,
  phaseId: string,
  milestoneId: string,
  target: MilestoneStatus,
  _instanceId?: string,
  _now: Date = new Date(),
): TransitionResult {
  const found = findMilestone(workflow, phaseId, milestoneId);
  if (!found) return { allowed: false, reason: "Milestone not found" };
  const { milestone } = found;
  const current = milestone.status;

  // --- Skipped transition (Pitfall 6) ---
  if (target === "skipped") {
    if (!milestone.optional) {
      return { allowed: false, reason: "Milestone is not optional" };
    }
    if (hasDownstreamStarted(workflow, milestoneId)) {
      return { allowed: false, reason: "A downstream milestone has already started" };
    }
    return { allowed: true };
  }

  // --- in_progress transition ---
  if (target === "in_progress") {
    const blocked = isBlocked(workflow, phaseId, milestoneId);
    if (blocked.blocked) {
      return { allowed: false, reason: blocked.reason ?? "Blocked by prereqs" };
    }
    return { allowed: true };
  }

  // --- awaiting_client / awaiting_payment ---
  if (target === "awaiting_client" || target === "awaiting_payment") {
    if (current === "in_progress") return { allowed: true };
    return { allowed: false, reason: `Cannot move from ${current} to ${target}` };
  }

  // --- complete ---
  if (target === "complete") {
    if (milestone.gate) {
      const gateFn = GATES_REQUIRING_CLEAR[milestone.gate];
      if (gateFn && !gateFn(milestone)) {
        return { allowed: false, reason: GATE_REASONS[milestone.gate] ?? `Needs ${milestone.gate} first` };
      }
    }
    if (
      current === "in_progress" ||
      current === "awaiting_client" ||
      current === "awaiting_payment"
    ) {
      return { allowed: true };
    }
    return { allowed: false, reason: "Start it first" };
  }

  // --- not_started (revert) ---
  if (target === "not_started") {
    if (current === "complete" || current === "skipped") {
      if (hasDownstreamStarted(workflow, milestoneId)) {
        return { allowed: false, reason: "A downstream milestone depends on this" };
      }
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Unknown target status" };
}

const ALL_STATUSES: MilestoneStatus[] = [
  "not_started",
  "in_progress",
  "awaiting_client",
  "awaiting_payment",
  "complete",
  "skipped",
];

/**
 * Which MilestoneStatus values are valid next steps for a given milestone?
 * Suppresses "skipped" from the menu when the milestone is not optional.
 */
export function getAvailableTransitions(
  workflow: ProjectWorkflow,
  phaseId: string,
  milestoneId: string,
  instanceId?: string,
  now: Date = new Date(),
): Array<AdminTransition> {
  const found = findMilestone(workflow, phaseId, milestoneId);
  if (!found) return [];
  const results: Array<AdminTransition> = [];
  for (const s of ALL_STATUSES) {
    // Suppress "skipped" from the menu entirely when not optional — spec §3.6
    if (s === "skipped" && !found.milestone.optional) continue;
    const r = canTransition(workflow, phaseId, milestoneId, s, instanceId, now);
    results.push({ status: s, allowed: r.allowed, reason: r.reason });
  }
  return results;
}

export interface AdminTransition {
  status: MilestoneStatus;
  allowed: boolean;
  reason?: string;
  // Custom popover label, e.g. "Mark signed & complete" for gated complete.
  label?: string;
  // The gate field this transition will auto-record when applied.
  // The API endpoint reads this to set signedAt/approvalReceivedAt/etc.
  autoClearGate?: "payment" | "approval" | "signature" | "delivery";
}

/**
 * Admin-mode transitions: like getAvailableTransitions, but surfaces
 * gate-blocked Complete as an explicit "Mark X & complete" action.
 * The API endpoint records the gate timestamp when this transition is applied.
 *
 * Use this in admin contexts (Schedule view) where the admin is the source
 * of truth for gate events. Use getAvailableTransitions for portal/client UIs
 * where gates must be cleared by external action.
 */
export function getAdminTransitions(
  workflow: ProjectWorkflow,
  phaseId: string,
  milestoneId: string,
  instanceId?: string,
  now: Date = new Date(),
): Array<AdminTransition> {
  const base = getAvailableTransitions(workflow, phaseId, milestoneId, instanceId, now);
  const found = findMilestone(workflow, phaseId, milestoneId);
  if (!found) return base;
  const milestone = found.milestone;
  const gate = milestone.gate;

  // Allow one-click Complete from not_started or in_progress as long as the
  // milestone isn't structurally blocked (prereqs / phase-startable). The
  // server applies all required side effects atomically (startedAt + gate +
  // completedAt). Sub-rows aren't handled here — they don't carry gates.
  if (instanceId) return base;
  const blocked = isBlocked(workflow, phaseId, milestoneId);
  if (blocked.blocked) return base;

  const upgraded = base.map((t) => {
    // When the milestone is currently complete, frame transitions away from
    // it as REVERTS — they remove the completion record and may cascade.
    // Adding the explicit "Revert to …" label + warning subtitle gives the
    // admin pause before clicking what looks like a normal status pick.
    if (
      milestone.status === "complete" &&
      t.allowed &&
      t.status !== "complete"
    ) {
      return {
        ...t,
        label: `Revert to ${REVERT_LABELS[t.status] ?? t.status}`,
        reason: "Removes completion record",
      };
    }
    if (t.status !== "complete") return t;
    // Don't decorate the row when the milestone is already complete — the
    // action label / hint only applies when transitioning TO complete.
    if (milestone.status === "complete") return t;
    if (t.allowed && !gate) return t; // already allowed, no gate, no override needed

    // Build the labeled one-click variant
    const label = gate ? GATE_AUTO_LABELS[gate] : "Mark complete";
    const reason = gate ? GATE_AUTO_HINTS[gate] : undefined;
    return {
      status: "complete",
      allowed: true,
      reason,
      label,
      autoClearGate: gate ?? undefined,
    };
  });

  // Drop only structurally-impossible options where the engine emitted an
  // internal "Cannot move from X to Y" enum-dump. Keep all other disabled
  // rows — reasons like "A downstream milestone depends on this" are valid
  // user-facing explanations that help the admin understand why a revert
  // is blocked.
  return upgraded.filter((t) => {
    if (t.allowed) return true;
    if (t.status === milestone.status) return true; // keep current state visible
    if (!t.reason) return true;
    if (t.reason.toLowerCase().startsWith("cannot move from")) return false;
    return true;
  });
}

/**
 * Compute parent milestone status from sub-row instances (spec §3.3).
 * Priority order: awaiting_client > awaiting_payment > in_progress > not_started > complete.
 * Skipped instances are treated as complete for aggregation purposes.
 */
export function computeDerivedStatus(instances: ContractorInstance[]): MilestoneStatus {
  if (instances.length === 0) return "not_started";
  const nonSkipped = instances.filter((i) => i.status !== "skipped");
  if (nonSkipped.length === 0) return "complete"; // all skipped → treated as complete
  if (nonSkipped.every((i) => i.status === "complete")) return "complete";
  if (nonSkipped.some((i) => i.status === "awaiting_client")) return "awaiting_client";
  if (nonSkipped.some((i) => i.status === "awaiting_payment")) return "awaiting_payment";
  if (nonSkipped.some((i) => i.status === "in_progress")) return "in_progress";
  return "not_started";
}

/**
 * Should the workflow status flip to "dormant" right now?
 * Uses calendar-day math (spec §9: dormancyDays is calendar days — Pitfall 4).
 */
export function detectDormancy(
  workflow: ProjectWorkflow,
  now: Date = new Date(),
): { dormant: boolean; daysSinceActivity: number } {
  const last = new Date(workflow.lastActivityAt).getTime();
  const days = Math.floor((now.getTime() - last) / 86_400_000);
  return { dormant: days >= workflow.defaults.dormancyDays, daysSinceActivity: days };
}

/**
 * Is a given milestone in awaiting_client beyond clientApprovalDays business days?
 * Uses business-day math (spec §3.5 + Pitfall 4).
 */
export function isApprovalOverdue(
  workflow: ProjectWorkflow,
  phaseId: string,
  milestoneId: string,
  now: Date = new Date(),
): { overdue: boolean; severelyOverdue: boolean; businessDaysWaiting: number } {
  const found = findMilestone(workflow, phaseId, milestoneId);
  if (!found || !found.milestone.startedAt) {
    return { overdue: false, severelyOverdue: false, businessDaysWaiting: 0 };
  }
  const waiting = businessDaysBetween(new Date(found.milestone.startedAt), now);
  const threshold = workflow.defaults.clientApprovalDays;
  return {
    businessDaysWaiting: waiting,
    overdue: waiting > threshold,
    severelyOverdue: waiting > threshold * 2,
  };
}

/**
 * Compute the 4 metric counts (complete / in_progress / awaiting_client / blocked).
 * awaitingClient includes awaiting_payment per UI-SPEC metrics row.
 */
export function computeMetrics(workflow: ProjectWorkflow): WorkflowMetrics {
  let complete = 0;
  let inProgress = 0;
  let awaitingClient = 0;
  let blocked = 0;
  let total = 0;

  for (const p of workflow.phases) {
    for (const m of p.milestones) {
      total += 1;
      if (m.status === "complete" || m.status === "skipped") {
        complete += 1;
      } else if (m.status === "in_progress") {
        inProgress += 1;
      } else if (m.status === "awaiting_client" || m.status === "awaiting_payment") {
        awaitingClient += 1;
      } else if (m.status === "not_started") {
        if (isBlocked(workflow, p.id, m.id).blocked) {
          blocked += 1;
        } else {
          // Actionable but not yet started — counts toward Active so the
          // metric reflects "things you can move forward right now", not
          // strictly "currently in_progress status".
          inProgress += 1;
        }
      }
    }
  }

  const progressPct = total === 0 ? 0 : Math.round((complete / total) * 100);
  return { complete, inProgress, awaitingClient, blocked, progressPct };
}

const DORMANCY_APPROACH_RATIO = 0.75;

/**
 * Compute all tracker warnings for a workflow (called at SSR).
 */
export function computeWarnings(workflow: ProjectWorkflow, now: Date = new Date()): Warning[] {
  const out: Warning[] = [];

  if (workflow.status === "dormant") {
    const { daysSinceActivity } = detectDormancy(workflow, now);
    out.push({
      kind: "dormant",
      severity: "error",
      message: `Project is dormant — no activity for ${daysSinceActivity} days. Reactivate from the header menu.`,
    });
    return out;
  }

  // Approaching dormancy warning
  const { daysSinceActivity } = detectDormancy(workflow, now);
  if (daysSinceActivity >= Math.floor(workflow.defaults.dormancyDays * DORMANCY_APPROACH_RATIO)) {
    out.push({
      kind: "dormancy",
      severity: "warning",
      message: `Approaching dormancy — ${daysSinceActivity} days since last activity (threshold: ${workflow.defaults.dormancyDays})`,
    });
  }

  // Approval overdue per milestone in awaiting_client
  for (const p of workflow.phases) {
    for (const m of p.milestones) {
      if (m.status === "awaiting_client") {
        const r = isApprovalOverdue(workflow, p.id, m.id, now);
        if (r.severelyOverdue) {
          out.push({
            kind: "approval_severely_overdue",
            severity: "error",
            phaseId: p.id,
            milestoneId: m.id,
            message: `${m.name}: awaiting client for ${r.businessDaysWaiting} business days — escalate`,
          });
        } else if (r.overdue) {
          out.push({
            kind: "approval_overdue",
            severity: "warning",
            phaseId: p.id,
            milestoneId: m.id,
            message: `${m.name}: awaiting client for ${r.businessDaysWaiting} business days`,
          });
        }
      }
    }
  }

  return out;
}

/**
 * Clone a WorkflowTemplate into a ProjectWorkflow instance.
 * Snapshots all phases/milestones at current template version.
 * Pre-populates ContractorInstance[] from defaultInstances for multiInstance milestones.
 * spec §8 + D-11.
 */
export function instantiateFromTemplate(
  template: WorkflowTemplate,
  now: Date = new Date(),
): Omit<ProjectWorkflow, "_id" | "project"> {
  const uuid = () => crypto.randomUUID();
  return {
    _type: "projectWorkflow",
    templateId: template._id,
    templateVersion: template.version,
    status: "active",
    defaults: { ...template.defaults },
    createdAt: now.toISOString(),
    lastActivityAt: now.toISOString(),
    phases: template.phases.map((p) => ({
      _key: uuid(),
      id: p.id,
      name: p.name,
      order: p.order,
      execution: p.execution,
      canOverlapWith: [...p.canOverlapWith],
      milestones: p.milestones.map((m) => ({
        _key: uuid(),
        id: m.id,
        name: m.name,
        assignee: m.assignee,
        gate: m.gate,
        optional: m.optional,
        multiInstance: m.multiInstance,
        hardPrereqs: [...m.hardPrereqs],
        softPrereqs: [...m.softPrereqs],
        status: "not_started" as const,
        ...(m.multiInstance
          ? {
              instances: m.defaultInstances.map((di) => ({
                _key: uuid(),
                name: di.name,
                status: "not_started" as const,
                fromTemplate: true,
              })),
            }
          : {}),
      })),
    })),
  };
}

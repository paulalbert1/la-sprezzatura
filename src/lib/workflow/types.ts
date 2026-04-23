// Workflow engine type surface.
// Source: workflow-engine-spec.md §2 + .planning/phases/44-workflow-engine/44-RESEARCH.md Pattern 1
// No runtime code. No default export. No `any`.

export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_client"
  | "awaiting_payment"
  | "complete"
  | "skipped";

export type GateType = "payment" | "approval" | "signature" | "delivery";

export type AssigneeType = "designer" | "client" | "vendor" | "trade";

export type PhaseExecution = "sequential" | "parallel";

export type ProjectWorkflowStatus = "active" | "dormant" | "complete" | "terminated";

// ===== Template shape =====

export interface MilestoneTemplate {
  _key: string;
  id: string;                 // stable id used by prereqs
  name: string;
  assignee: AssigneeType;
  gate: GateType | null;
  optional: boolean;
  multiInstance: boolean;
  hardPrereqs: string[];      // MilestoneTemplate.id values
  softPrereqs: string[];
  defaultInstances: Array<{ _key: string; name: string }>;
}

export interface PhaseTemplate {
  _key: string;
  id: string;
  name: string;
  order: number;
  execution: PhaseExecution;
  canOverlapWith: string[];   // PhaseTemplate.id values
  milestones: MilestoneTemplate[];
}

export interface WorkflowTemplateDefaults {
  clientApprovalDays: number;
  dormancyDays: number;
  revisionRounds: number;
}

export interface WorkflowTemplate {
  _id: string;
  _type: "workflowTemplate";
  name: string;
  version: number;            // auto-incremented server-side on save
  defaults: WorkflowTemplateDefaults;
  phases: PhaseTemplate[];
  createdAt?: string;
  updatedAt?: string;
}

// ===== Instance shape =====

export interface ContractorInstance {
  _key: string;
  name: string;
  status: MilestoneStatus;
  fromTemplate: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface MilestoneInstance {
  _key: string;
  id: string;                 // matches MilestoneTemplate.id
  name: string;               // denormalized at snapshot time
  assignee: AssigneeType;
  gate: GateType | null;
  optional: boolean;
  multiInstance: boolean;
  hardPrereqs: string[];
  softPrereqs: string[];
  status: MilestoneStatus;
  startedAt?: string;
  completedAt?: string;
  linkedPaymentId?: string;   // clears payment gate
  approvalReceivedAt?: string;
  signedAt?: string;
  deliveredAt?: string;
  instances?: ContractorInstance[]; // present when multiInstance
}

export interface PhaseInstance {
  _key: string;
  id: string;
  name: string;
  order: number;
  execution: PhaseExecution;
  canOverlapWith: string[];
  milestones: MilestoneInstance[];
}

export interface ProjectWorkflow {
  _id: string;
  _type: "projectWorkflow";
  project: { _type: "reference"; _ref: string };
  templateId: string;         // plain string — NOT a reference (Pitfall 3)
  templateVersion: number;    // snapshot of template.version at instantiation
  status: ProjectWorkflowStatus;
  defaults: WorkflowTemplateDefaults; // snapshotted from template.defaults
  phases: PhaseInstance[];
  createdAt: string;
  lastActivityAt: string;
  terminatedAt?: string;
  completedAt?: string;
}

// ===== Derived shapes consumed by engine + UI =====

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

export interface WorkflowMetrics {
  complete: number;
  inProgress: number;
  awaitingClient: number;     // includes awaiting_payment per UI-SPEC metrics row
  blocked: number;
  progressPct: number;        // 0-100 integer
}

export type WarningKind =
  | "dormancy"
  | "approval_overdue"
  | "approval_severely_overdue"
  | "uneven_multi_instance"
  | "dormant";

export type WarningSeverity = "info" | "warning" | "error";

export interface Warning {
  kind: WarningKind;
  severity: WarningSeverity;
  message: string;
  phaseId?: string;
  milestoneId?: string;
}

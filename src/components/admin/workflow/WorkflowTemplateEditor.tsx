import { useReducer, useCallback, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  X,
  Loader2,
  Plus,
} from "lucide-react";
import AdminModal from "../ui/AdminModal";
import ToastContainer, { useToast } from "../ui/ToastContainer";
import { moveItem } from "../../../lib/workflow/arrayUtils";
import type {
  WorkflowTemplate,
  PhaseTemplate,
  MilestoneTemplate,
  WorkflowTemplateDefaults,
  AssigneeType,
  GateType,
  PhaseExecution,
} from "../../../lib/workflow/types";

// Phase 44 Plan 08 / Plan 10 — WorkflowTemplateEditor
// Full-screen single-column editor for a workflowTemplate document.
// Supports: inline-edit name/phases/milestones, add/delete/reorder, cycle
// detection on save, PATCH/DELETE/duplicate API calls.

// ===== COPY STRINGS =====
const COPY = {
  defaultsTitle: "DEFAULTS",
  clientApprovalLabel: "Client approval window (business days)",
  dormancyLabel: "Dormancy threshold (calendar days)",
  revisionLabel: "Revision rounds included",
  defaultsHelper:
    "Inherited from your design services agreement. Defaults: 10 / 60 / 1. Overrides apply only to projects instantiated from this template after saving.",
  phasesTitle: "PHASES",
  addPhase: "+ Add phase",
  addMilestone: "+ Add milestone",
  phaseNamePlaceholder: "Phase name",
  milestoneNamePlaceholder: "Milestone name",
  executionLabel: "EXECUTION",
  overlapLabel: "CAN OVERLAP WITH",
  milestonesLabel: "MILESTONES",
  assigneeLabel: "ASSIGNEE",
  gateLabel: "GATE",
  optionalLabel: "Optional (can be skipped)",
  multiInstanceLabel: "Multi-instance (spawns per-contractor sub-rows)",
  prereqsLabel: "PREREQUISITES",
  prereqsHelper:
    "Milestones that must complete before this can start. Hard prereqs block; soft prereqs warn.",
  hardPrereqsLabel: "Hard prereqs",
  softPrereqsLabel: "Soft prereqs",
  defaultInstancesLabel: "DEFAULT INSTANCES",
  defaultInstancesHelper:
    "Pre-populated contractors or vendors for projects using this template. You can delete or add entries per project.",
  defaultInstancePlaceholder: "Contractor or vendor name (e.g., ABC Carpet)",
  saveBtn: "Save template",
  savingBtn: "Saving…",
  savedBtn: "Saved ✓",
  backBtn: "Back to Settings",
  duplicateBtn: "Duplicate as new template",
  deleteBtn: "Delete template",
  deleteModalTitle: "Delete template?",
  deleteModalConfirm: "Delete template",
  deleteModalCancel: "Keep template",
  discardTitle: "Discard changes?",
  discardBody:
    "You have unsaved edits to this template. Discard them and return to Settings?",
  discardConfirm: "Discard changes",
  discardCancel: "Keep editing",
  removeMilestonesFirst: "Remove all milestones first.",
  deletePhaseConfirm: "Delete phase?",
  deleteMilestoneConfirm: "Delete milestone?",
  emptyStateHelper:
    "Start by naming your template, then add phases below. Each phase contains one or more milestones. Gates (payment, approval, signature, delivery) are hard blocks the engine enforces before a milestone can advance.",
};

// ===== CYCLE DETECTION =====
function detectCycle(phases: PhaseTemplate[]): string | null {
  const ms = new Map<string, MilestoneTemplate>();
  for (const p of phases) {
    for (const m of p.milestones) {
      ms.set(m.id, m);
    }
  }
  function visit(id: string, stack: Set<string>): boolean {
    if (stack.has(id)) return true;
    stack.add(id);
    const cur = ms.get(id);
    if (cur) {
      for (const pre of cur.hardPrereqs) {
        if (visit(pre, stack)) return true;
      }
    }
    stack.delete(id);
    return false;
  }
  for (const [id] of ms) {
    if (visit(id, new Set())) return id;
  }
  return null;
}

// ===== HELPERS =====
function slugId(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 20) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

function newMilestone(name = "New milestone"): MilestoneTemplate {
  return {
    _key: crypto.randomUUID(),
    id: slugId(name),
    name,
    assignee: "designer",
    gate: null,
    optional: false,
    multiInstance: false,
    hardPrereqs: [],
    softPrereqs: [],
    defaultInstances: [],
  };
}

function newPhase(name = "New phase", order: number): PhaseTemplate {
  return {
    _key: crypto.randomUUID(),
    id: slugId(name),
    name,
    order,
    execution: "sequential",
    canOverlapWith: [],
    milestones: [],
  };
}

// ===== REDUCER =====
type Action =
  | { type: "RENAME_TEMPLATE"; name: string }
  | { type: "UPDATE_DEFAULTS"; key: keyof WorkflowTemplateDefaults; value: number }
  | { type: "ADD_PHASE" }
  | { type: "DELETE_PHASE"; phaseIdx: number }
  | { type: "MOVE_PHASE"; phaseIdx: number; dir: "up" | "down" }
  | { type: "RENAME_PHASE"; phaseIdx: number; name: string }
  | { type: "SET_PHASE_EXECUTION"; phaseIdx: number; execution: PhaseExecution }
  | { type: "TOGGLE_PHASE_OVERLAP"; phaseIdx: number; targetId: string }
  | { type: "ADD_MILESTONE"; phaseIdx: number }
  | { type: "DELETE_MILESTONE"; phaseIdx: number; milestoneIdx: number }
  | { type: "MOVE_MILESTONE"; phaseIdx: number; milestoneIdx: number; dir: "up" | "down" }
  | { type: "UPDATE_MILESTONE"; phaseIdx: number; milestoneIdx: number; field: string; value: unknown }
  | { type: "TOGGLE_HARD_PREREQ"; phaseIdx: number; milestoneIdx: number; prereqId: string }
  | { type: "TOGGLE_SOFT_PREREQ"; phaseIdx: number; milestoneIdx: number; prereqId: string }
  | { type: "ADD_DEFAULT_INSTANCE"; phaseIdx: number; milestoneIdx: number; name: string }
  | { type: "DELETE_DEFAULT_INSTANCE"; phaseIdx: number; milestoneIdx: number; instanceKey: string };

function reducer(state: WorkflowTemplate, action: Action): WorkflowTemplate {
  switch (action.type) {
    case "RENAME_TEMPLATE":
      return { ...state, name: action.name };
    case "UPDATE_DEFAULTS":
      return { ...state, defaults: { ...state.defaults, [action.key]: action.value } };
    case "ADD_PHASE": {
      const next = [...state.phases, newPhase("New phase", state.phases.length)];
      return { ...state, phases: next };
    }
    case "DELETE_PHASE": {
      const next = state.phases.filter((_, i) => i !== action.phaseIdx);
      return { ...state, phases: next };
    }
    case "MOVE_PHASE":
      return { ...state, phases: moveItem(state.phases, action.phaseIdx, action.dir) };
    case "RENAME_PHASE": {
      const next = state.phases.map((p, i) =>
        i === action.phaseIdx ? { ...p, name: action.name } : p,
      );
      return { ...state, phases: next };
    }
    case "SET_PHASE_EXECUTION": {
      const next = state.phases.map((p, i) =>
        i === action.phaseIdx ? { ...p, execution: action.execution } : p,
      );
      return { ...state, phases: next };
    }
    case "TOGGLE_PHASE_OVERLAP": {
      const next = state.phases.map((p, i) => {
        if (i !== action.phaseIdx) return p;
        const has = p.canOverlapWith.includes(action.targetId);
        return {
          ...p,
          canOverlapWith: has
            ? p.canOverlapWith.filter((id) => id !== action.targetId)
            : [...p.canOverlapWith, action.targetId],
        };
      });
      return { ...state, phases: next };
    }
    case "ADD_MILESTONE": {
      const next = state.phases.map((p, i) => {
        if (i !== action.phaseIdx) return p;
        return { ...p, milestones: [...p.milestones, newMilestone()] };
      });
      return { ...state, phases: next };
    }
    case "DELETE_MILESTONE": {
      const next = state.phases.map((p, i) => {
        if (i !== action.phaseIdx) return p;
        return { ...p, milestones: p.milestones.filter((_, j) => j !== action.milestoneIdx) };
      });
      return { ...state, phases: next };
    }
    case "MOVE_MILESTONE": {
      const next = state.phases.map((p, i) => {
        if (i !== action.phaseIdx) return p;
        return { ...p, milestones: moveItem(p.milestones, action.milestoneIdx, action.dir) };
      });
      return { ...state, phases: next };
    }
    case "UPDATE_MILESTONE": {
      const next = state.phases.map((p, i) => {
        if (i !== action.phaseIdx) return p;
        const milestones = p.milestones.map((m, j) =>
          j === action.milestoneIdx ? { ...m, [action.field]: action.value } : m,
        );
        return { ...p, milestones };
      });
      return { ...state, phases: next };
    }
    case "TOGGLE_HARD_PREREQ": {
      const next = state.phases.map((p, i) => {
        if (i !== action.phaseIdx) return p;
        const milestones = p.milestones.map((m, j) => {
          if (j !== action.milestoneIdx) return m;
          const has = m.hardPrereqs.includes(action.prereqId);
          return {
            ...m,
            hardPrereqs: has
              ? m.hardPrereqs.filter((id) => id !== action.prereqId)
              : [...m.hardPrereqs, action.prereqId],
          };
        });
        return { ...p, milestones };
      });
      return { ...state, phases: next };
    }
    case "TOGGLE_SOFT_PREREQ": {
      const next = state.phases.map((p, i) => {
        if (i !== action.phaseIdx) return p;
        const milestones = p.milestones.map((m, j) => {
          if (j !== action.milestoneIdx) return m;
          const has = m.softPrereqs.includes(action.prereqId);
          return {
            ...m,
            softPrereqs: has
              ? m.softPrereqs.filter((id) => id !== action.prereqId)
              : [...m.softPrereqs, action.prereqId],
          };
        });
        return { ...p, milestones };
      });
      return { ...state, phases: next };
    }
    case "ADD_DEFAULT_INSTANCE": {
      const next = state.phases.map((p, i) => {
        if (i !== action.phaseIdx) return p;
        const milestones = p.milestones.map((m, j) => {
          if (j !== action.milestoneIdx) return m;
          return {
            ...m,
            defaultInstances: [
              ...m.defaultInstances,
              { _key: crypto.randomUUID(), name: action.name },
            ],
          };
        });
        return { ...p, milestones };
      });
      return { ...state, phases: next };
    }
    case "DELETE_DEFAULT_INSTANCE": {
      const next = state.phases.map((p, i) => {
        if (i !== action.phaseIdx) return p;
        const milestones = p.milestones.map((m, j) => {
          if (j !== action.milestoneIdx) return m;
          return {
            ...m,
            defaultInstances: m.defaultInstances.filter(
              (inst) => inst._key !== action.instanceKey,
            ),
          };
        });
        return { ...p, milestones };
      });
      return { ...state, phases: next };
    }
    default:
      return state;
  }
}

// ===== SUBCOMPONENTS =====

function FieldLabel({ children }: { children: string }) {
  return (
    <span
      className="block uppercase"
      style={{
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: "#6B5E52",
        lineHeight: 1.4,
        marginBottom: "6px",
      }}
    >
      {children}
    </span>
  );
}

function InlineEditText({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    onChange(draft.trim() || value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        className="luxury-input"
        value={draft}
        placeholder={placeholder}
        style={{ ...style, display: "block" }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setDraft(value);
          setEditing(true);
        }
      }}
      style={{
        cursor: "text",
        color: value ? "#2C2520" : "#9E8E80",
        ...style,
      }}
    >
      {value || placeholder || "—"}
    </span>
  );
}

// All milestones across all phases as flat list for prereq pickers
function allMilestones(phases: PhaseTemplate[]): Array<{ id: string; name: string }> {
  return phases.flatMap((p) =>
    p.milestones.map((m) => ({ id: m.id, name: m.name })),
  );
}

function MilestoneRow({
  milestone,
  milestoneIdx,
  phaseIdx,
  allMs,
  isFirst,
  isLast,
  dispatch,
}: {
  milestone: MilestoneTemplate;
  milestoneIdx: number;
  phaseIdx: number;
  allMs: Array<{ id: string; name: string }>;
  isFirst: boolean;
  isLast: boolean;
  dispatch: React.Dispatch<Action>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");

  const others = allMs.filter((m) => m.id !== milestone.id);

  return (
    <div
      style={{
        borderBottom: isLast ? "none" : "0.5px solid #E8DDD0",
        padding: "12px 0",
      }}
    >
      {/* Row top: name + reorder + delete */}
      <div className="flex items-center gap-2" style={{ marginBottom: "8px" }}>
        <div style={{ flex: 1 }}>
          <InlineEditText
            value={milestone.name}
            placeholder={COPY.milestoneNamePlaceholder}
            style={{ fontSize: "13px" }}
            onChange={(v) =>
              dispatch({ type: "UPDATE_MILESTONE", phaseIdx, milestoneIdx, field: "name", value: v })
            }
          />
        </div>
        <button
          type="button"
          disabled={isFirst}
          aria-label="Move milestone up"
          onClick={() => dispatch({ type: "MOVE_MILESTONE", phaseIdx, milestoneIdx, dir: "up" })}
          style={{
            padding: "2px 4px",
            background: "none",
            border: "none",
            cursor: isFirst ? "not-allowed" : "pointer",
            color: isFirst ? "#D4C8B8" : "#6B5E52",
          }}
        >
          <ArrowUp size={13} />
        </button>
        <button
          type="button"
          disabled={isLast}
          aria-label="Move milestone down"
          onClick={() => dispatch({ type: "MOVE_MILESTONE", phaseIdx, milestoneIdx, dir: "down" })}
          style={{
            padding: "2px 4px",
            background: "none",
            border: "none",
            cursor: isLast ? "not-allowed" : "pointer",
            color: isLast ? "#D4C8B8" : "#6B5E52",
          }}
        >
          <ArrowDown size={13} />
        </button>
        {confirmDelete ? (
          <span className="flex items-center gap-1" style={{ fontSize: "11px", color: "#9B3A2A" }}>
            {COPY.deleteMilestoneConfirm}
            <button
              type="button"
              onClick={() => dispatch({ type: "DELETE_MILESTONE", phaseIdx, milestoneIdx })}
              aria-label="Confirm delete milestone"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9B3A2A" }}
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              aria-label="Cancel delete milestone"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6B5E52" }}
            >
              <X size={13} />
            </button>
          </span>
        ) : (
          <button
            type="button"
            aria-label="Delete milestone"
            onClick={() => setConfirmDelete(true)}
            style={{ padding: "2px 4px", background: "none", border: "none", cursor: "pointer", color: "#9E8E80" }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Fields grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        {/* Assignee */}
        <div>
          <FieldLabel>{COPY.assigneeLabel}</FieldLabel>
          <select
            className="luxury-input"
            value={milestone.assignee}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_MILESTONE",
                phaseIdx,
                milestoneIdx,
                field: "assignee",
                value: e.target.value as AssigneeType,
              })
            }
            style={{ fontSize: "13px", width: "100%" }}
          >
            <option value="designer">Designer</option>
            <option value="client">Client</option>
            <option value="vendor">Vendor</option>
            <option value="trade">Trade</option>
          </select>
        </div>

        {/* Gate */}
        <div>
          <FieldLabel>{COPY.gateLabel}</FieldLabel>
          <select
            className="luxury-input"
            value={milestone.gate ?? ""}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_MILESTONE",
                phaseIdx,
                milestoneIdx,
                field: "gate",
                value: (e.target.value as GateType) || null,
              })
            }
            style={{ fontSize: "13px", width: "100%" }}
          >
            <option value="">— none —</option>
            <option value="payment">Payment</option>
            <option value="approval">Approval</option>
            <option value="signature">Signature</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-4" style={{ marginBottom: "8px" }}>
        <label className="flex items-center gap-2" style={{ fontSize: "13px", color: "#2C2520", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={milestone.optional}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_MILESTONE",
                phaseIdx,
                milestoneIdx,
                field: "optional",
                value: e.target.checked,
              })
            }
          />
          {COPY.optionalLabel}
        </label>
        <label className="flex items-center gap-2" style={{ fontSize: "13px", color: "#2C2520", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={milestone.multiInstance}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_MILESTONE",
                phaseIdx,
                milestoneIdx,
                field: "multiInstance",
                value: e.target.checked,
              })
            }
          />
          {COPY.multiInstanceLabel}
        </label>
      </div>

      {/* Prerequisites */}
      {others.length > 0 && (
        <div style={{ marginBottom: "8px" }}>
          <FieldLabel>{COPY.prereqsLabel}</FieldLabel>
          <p style={{ fontSize: "11px", color: "#6B5E52", marginBottom: "6px" }}>{COPY.prereqsHelper}</p>
          <div className="flex flex-wrap gap-2">
            {/* Hard prereqs */}
            <div>
              <span style={{ fontSize: "11px", color: "#6B5E52", display: "block", marginBottom: "4px" }}>
                {COPY.hardPrereqsLabel}
              </span>
              <div className="flex flex-wrap gap-1">
                {others.map((o) => {
                  const active = milestone.hardPrereqs.includes(o.id);
                  return (
                    <button
                      key={`hard-${o.id}`}
                      type="button"
                      onClick={() => dispatch({ type: "TOGGLE_HARD_PREREQ", phaseIdx, milestoneIdx, prereqId: o.id })}
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "7px",
                        border: `0.5px solid ${active ? "#9A7B4B" : "#E8DDD0"}`,
                        backgroundColor: active ? "#F5EDD8" : "#FFFEFB",
                        color: active ? "#9A7B4B" : "#6B5E52",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {o.name}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Soft prereqs */}
            <div>
              <span style={{ fontSize: "11px", color: "#6B5E52", display: "block", marginBottom: "4px" }}>
                {COPY.softPrereqsLabel}
              </span>
              <div className="flex flex-wrap gap-1">
                {others.map((o) => {
                  const active = milestone.softPrereqs.includes(o.id);
                  return (
                    <button
                      key={`soft-${o.id}`}
                      type="button"
                      onClick={() => dispatch({ type: "TOGGLE_SOFT_PREREQ", phaseIdx, milestoneIdx, prereqId: o.id })}
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "7px",
                        border: `0.5px solid ${active ? "#6B5E52" : "#E8DDD0"}`,
                        backgroundColor: active ? "#F3EDE3" : "#FFFEFB",
                        color: active ? "#6B5E52" : "#9E8E80",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {o.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Default instances (multiInstance only) */}
      {milestone.multiInstance && (
        <div>
          <FieldLabel>{COPY.defaultInstancesLabel}</FieldLabel>
          <p style={{ fontSize: "11px", color: "#6B5E52", marginBottom: "6px" }}>{COPY.defaultInstancesHelper}</p>
          {milestone.defaultInstances.map((inst) => (
            <div key={inst._key} className="flex items-center gap-2" style={{ marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", color: "#2C2520", flex: 1 }}>{inst.name}</span>
              <button
                type="button"
                aria-label={`Remove ${inst.name}`}
                onClick={() =>
                  dispatch({
                    type: "DELETE_DEFAULT_INSTANCE",
                    phaseIdx,
                    milestoneIdx,
                    instanceKey: inst._key,
                  })
                }
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9E8E80" }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2" style={{ marginTop: "4px" }}>
            <input
              className="luxury-input"
              value={newInstanceName}
              placeholder={COPY.defaultInstancePlaceholder}
              onChange={(e) => setNewInstanceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newInstanceName.trim()) {
                  dispatch({
                    type: "ADD_DEFAULT_INSTANCE",
                    phaseIdx,
                    milestoneIdx,
                    name: newInstanceName.trim(),
                  });
                  setNewInstanceName("");
                }
                if (e.key === "Escape") setNewInstanceName("");
              }}
              style={{ fontSize: "13px", flex: 1 }}
            />
            <button
              type="button"
              onClick={() => {
                if (newInstanceName.trim()) {
                  dispatch({
                    type: "ADD_DEFAULT_INSTANCE",
                    phaseIdx,
                    milestoneIdx,
                    name: newInstanceName.trim(),
                  });
                  setNewInstanceName("");
                }
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9A7B4B" }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseCard({
  phase,
  phaseIdx,
  allPhases,
  allMs,
  isFirst,
  isLast,
  dispatch,
}: {
  phase: PhaseTemplate;
  phaseIdx: number;
  allPhases: PhaseTemplate[];
  allMs: Array<{ id: string; name: string }>;
  isFirst: boolean;
  isLast: boolean;
  dispatch: React.Dispatch<Action>;
}) {
  const [confirmDeletePhase, setConfirmDeletePhase] = useState(false);
  const otherPhases = allPhases.filter((_, i) => i !== phaseIdx);

  return (
    <div
      style={{
        border: "0.5px solid #E8DDD0",
        borderRadius: "10px",
        padding: "16px",
        marginBottom: "16px",
        backgroundColor: "#FFFEFB",
      }}
    >
      {/* Phase header: name + execution + reorder + delete */}
      <div className="flex items-center gap-2" style={{ marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <InlineEditText
            value={phase.name}
            placeholder={COPY.phaseNamePlaceholder}
            style={{ fontSize: "13px", fontWeight: 600 }}
            onChange={(v) => dispatch({ type: "RENAME_PHASE", phaseIdx, name: v })}
          />
        </div>
        <button
          type="button"
          disabled={isFirst}
          aria-label="Move phase up"
          onClick={() => dispatch({ type: "MOVE_PHASE", phaseIdx, dir: "up" })}
          style={{
            padding: "2px 4px",
            background: "none",
            border: "none",
            cursor: isFirst ? "not-allowed" : "pointer",
            color: isFirst ? "#D4C8B8" : "#6B5E52",
          }}
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          disabled={isLast}
          aria-label="Move phase down"
          onClick={() => dispatch({ type: "MOVE_PHASE", phaseIdx, dir: "down" })}
          style={{
            padding: "2px 4px",
            background: "none",
            border: "none",
            cursor: isLast ? "not-allowed" : "pointer",
            color: isLast ? "#D4C8B8" : "#6B5E52",
          }}
        >
          <ArrowDown size={14} />
        </button>
        {phase.milestones.length > 0 ? (
          <span
            title={COPY.removeMilestonesFirst}
            style={{ display: "inline-flex" }}
          >
            <button
              type="button"
              disabled
              aria-label="Delete phase"
              style={{ padding: "2px 4px", background: "none", border: "none", cursor: "not-allowed", color: "#D4C8B8" }}
            >
              <Trash2 size={14} />
            </button>
          </span>
        ) : confirmDeletePhase ? (
          <span className="flex items-center gap-1" style={{ fontSize: "11px", color: "#9B3A2A" }}>
            {COPY.deletePhaseConfirm}
            <button
              type="button"
              onClick={() => dispatch({ type: "DELETE_PHASE", phaseIdx })}
              aria-label="Confirm delete phase"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9B3A2A" }}
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeletePhase(false)}
              aria-label="Cancel delete phase"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6B5E52" }}
            >
              <X size={13} />
            </button>
          </span>
        ) : (
          <button
            type="button"
            aria-label="Delete phase"
            onClick={() => setConfirmDeletePhase(true)}
            style={{ padding: "2px 4px", background: "none", border: "none", cursor: "pointer", color: "#9E8E80" }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Execution toggle */}
      <div style={{ marginBottom: "12px" }}>
        <FieldLabel>{COPY.executionLabel}</FieldLabel>
        <div className="flex gap-2">
          {(["sequential", "parallel"] as PhaseExecution[]).map((exec) => (
            <button
              key={exec}
              type="button"
              onClick={() => dispatch({ type: "SET_PHASE_EXECUTION", phaseIdx, execution: exec })}
              style={{
                fontSize: "11px",
                padding: "4px 12px",
                borderRadius: "7px",
                border: `0.5px solid ${phase.execution === exec ? "#9A7B4B" : "#E8DDD0"}`,
                backgroundColor: phase.execution === exec ? "#F5EDD8" : "#FFFEFB",
                color: phase.execution === exec ? "#9A7B4B" : "#6B5E52",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontWeight: phase.execution === exec ? 600 : 400,
              }}
            >
              {exec === "sequential" ? "Sequential" : "Parallel"}
            </button>
          ))}
        </div>
      </div>

      {/* Can overlap with */}
      {otherPhases.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <FieldLabel>{COPY.overlapLabel}</FieldLabel>
          <div className="flex flex-wrap gap-1">
            {otherPhases.map((op) => {
              const active = phase.canOverlapWith.includes(op.id);
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => dispatch({ type: "TOGGLE_PHASE_OVERLAP", phaseIdx, targetId: op.id })}
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "7px",
                    border: `0.5px solid ${active ? "#9A7B4B" : "#E8DDD0"}`,
                    backgroundColor: active ? "#F5EDD8" : "#FFFEFB",
                    color: active ? "#9A7B4B" : "#6B5E52",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {op.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div>
        <FieldLabel>{COPY.milestonesLabel}</FieldLabel>
        {phase.milestones.map((m, mIdx) => (
          <MilestoneRow
            key={m._key}
            milestone={m}
            milestoneIdx={mIdx}
            phaseIdx={phaseIdx}
            allMs={allMs}
            isFirst={mIdx === 0}
            isLast={mIdx === phase.milestones.length - 1}
            dispatch={dispatch}
          />
        ))}
        <button
          type="button"
          onClick={() => dispatch({ type: "ADD_MILESTONE", phaseIdx })}
          style={{
            marginTop: "8px",
            fontSize: "13px",
            color: "#6B5E52",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          {COPY.addMilestone}
        </button>
      </div>
    </div>
  );
}

// ===== MAIN EDITOR =====

interface Props {
  template: WorkflowTemplate;
  inUseCount: number;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function WorkflowTemplateEditorInner({ template, inUseCount }: Props) {
  const [state, dispatch] = useReducer(reducer, template);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const { show } = useToast();

  const isDirty = JSON.stringify(state) !== JSON.stringify(template);
  const msAll = allMilestones(state.phases);

  const handleSave = useCallback(async () => {
    // Cycle detection
    const cycleId = detectCycle(state.phases);
    if (cycleId) {
      const name = msAll.find((m) => m.id === cycleId)?.name ?? cycleId;
      setCycleError(`Circular dependency detected on milestone: "${name}". Remove the cycle before saving.`);
      return;
    }
    setCycleError(null);
    setSaveError(null);
    setSaveState("saving");
    try {
      const res = await fetch(`/api/admin/workflow-templates/${template._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          phases: state.phases,
          defaults: state.defaults,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "Unknown error");
        throw new Error(msg);
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      setSaveError(`Could not save template — ${err instanceof Error ? err.message : "try again"}`);
      setSaveState("error");
    }
  }, [state, template._id, msAll]);

  const handleDelete = useCallback(async () => {
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/workflow-templates/${template._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      window.location.href = "/admin/settings";
    } catch {
      show({ variant: "error", title: "Could not delete template — try again", duration: 4000 });
    } finally {
      setDeleteBusy(false);
      setShowDeleteModal(false);
    }
  }, [template._id, show]);

  const handleDuplicate = useCallback(async () => {
    setDuplicateBusy(true);
    try {
      const res = await fetch(`/api/admin/workflow-templates/${template._id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Duplicate failed");
      const data = await res.json() as { template?: { _id: string } };
      if (data.template?._id) {
        window.location.href = `/admin/settings/workflow-templates/${data.template._id}`;
      }
    } catch {
      show({ variant: "error", title: "Could not duplicate template — try again", duration: 4000 });
    } finally {
      setDuplicateBusy(false);
    }
  }, [template._id, show]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      window.location.href = "/admin/settings";
    }
  }, [isDirty]);

  const saveBtnLabel =
    saveState === "saving"
      ? COPY.savingBtn
      : saveState === "saved"
        ? COPY.savedBtn
        : COPY.saveBtn;

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
      {/* Template name + version */}
      <div className="flex items-center gap-3" style={{ marginBottom: "32px" }}>
        <InlineEditText
          value={state.name}
          placeholder="Template name"
          style={{ fontSize: "15px", fontWeight: 600 }}
          onChange={(v) => dispatch({ type: "RENAME_TEMPLATE", name: v })}
        />
        <span
          style={{
            fontSize: "11px",
            color: "#9E8E80",
            backgroundColor: "#F3EDE3",
            borderRadius: "7px",
            padding: "2px 8px",
          }}
        >
          v{template.version}
        </span>
      </div>

      {/* Empty state helper */}
      {state.phases.length === 0 && (
        <p
          style={{
            fontSize: "13px",
            color: "#6B5E52",
            marginBottom: "24px",
            padding: "12px 16px",
            backgroundColor: "#F3EDE3",
            borderRadius: "10px",
            border: "0.5px solid #E8DDD0",
          }}
        >
          {COPY.emptyStateHelper}
        </p>
      )}

      {/* DEFAULTS section */}
      <div style={{ marginBottom: "32px" }}>
        <FieldLabel>{COPY.defaultsTitle}</FieldLabel>
        <div
          style={{
            border: "0.5px solid #E8DDD0",
            borderRadius: "10px",
            padding: "16px",
            backgroundColor: "#FFFEFB",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              marginBottom: "12px",
            }}
          >
            <div>
              <label style={{ fontSize: "13px", color: "#6B5E52", display: "block", marginBottom: "4px" }}>
                {COPY.clientApprovalLabel}
              </label>
              <input
                type="number"
                className="luxury-input"
                min={1}
                value={state.defaults.clientApprovalDays}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_DEFAULTS",
                    key: "clientApprovalDays",
                    value: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                style={{ fontSize: "13px", width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#6B5E52", display: "block", marginBottom: "4px" }}>
                {COPY.dormancyLabel}
              </label>
              <input
                type="number"
                className="luxury-input"
                min={1}
                value={state.defaults.dormancyDays}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_DEFAULTS",
                    key: "dormancyDays",
                    value: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                style={{ fontSize: "13px", width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#6B5E52", display: "block", marginBottom: "4px" }}>
                {COPY.revisionLabel}
              </label>
              <input
                type="number"
                className="luxury-input"
                min={0}
                value={state.defaults.revisionRounds}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_DEFAULTS",
                    key: "revisionRounds",
                    value: Math.max(0, parseInt(e.target.value) || 0),
                  })
                }
                style={{ fontSize: "13px", width: "100%" }}
              />
            </div>
          </div>
          <p style={{ fontSize: "11px", color: "#9E8E80" }}>{COPY.defaultsHelper}</p>
        </div>
      </div>

      {/* PHASES section */}
      <div style={{ marginBottom: "32px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
          <FieldLabel>{COPY.phasesTitle}</FieldLabel>
        </div>

        {state.phases.map((phase, phaseIdx) => (
          <PhaseCard
            key={phase._key}
            phase={phase}
            phaseIdx={phaseIdx}
            allPhases={state.phases}
            allMs={msAll}
            isFirst={phaseIdx === 0}
            isLast={phaseIdx === state.phases.length - 1}
            dispatch={dispatch}
          />
        ))}

        <button
          type="button"
          onClick={() => dispatch({ type: "ADD_PHASE" })}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "13px",
            color: "#6B5E52",
            backgroundColor: "#FFFEFB",
            border: "0.5px solid #E8DDD0",
            borderRadius: "6px",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          {COPY.addPhase}
        </button>
      </div>

      {/* Cycle + save errors */}
      {cycleError && (
        <p
          style={{
            fontSize: "13px",
            color: "#9B3A2A",
            backgroundColor: "#FBEEE8",
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "16px",
          }}
          role="alert"
        >
          {cycleError}
        </p>
      )}
      {saveState === "error" && saveError && (
        <p
          style={{
            fontSize: "13px",
            color: "#9B3A2A",
            backgroundColor: "#FBEEE8",
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "16px",
          }}
          role="alert"
        >
          {saveError}
        </p>
      )}

      {/* Sticky footer action bar */}
      <div
        className="sticky bottom-0 flex items-center justify-between"
        style={{
          backgroundColor: "#FFFEFB",
          borderTop: "0.5px solid #E8DDD0",
          padding: "16px 0",
          marginTop: "32px",
        }}
      >
        {/* Left: Delete */}
        {inUseCount > 0 ? (
          <span
            title={`This template is used by ${inUseCount} project${inUseCount !== 1 ? "s" : ""} — delete them first, or duplicate this template and edit the copy instead.`}
          >
            <button
              type="button"
              disabled
              style={{
                fontSize: "13px",
                color: "#D4C8B8",
                background: "none",
                border: "none",
                cursor: "not-allowed",
                fontFamily: "var(--font-sans)",
              }}
            >
              {COPY.deleteBtn}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            style={{
              fontSize: "13px",
              color: "#9B3A2A",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {COPY.deleteBtn}
          </button>
        )}

        {/* Right: Back + Duplicate + Save */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            style={{
              fontSize: "13px",
              color: "#2C2520",
              backgroundColor: "#FFFEFB",
              border: "0.5px solid #D4C8B8",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {COPY.backBtn}
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicateBusy}
            style={{
              fontSize: "13px",
              color: "#2C2520",
              backgroundColor: "#FFFEFB",
              border: "0.5px solid #D4C8B8",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: duplicateBusy ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
              opacity: duplicateBusy ? 0.6 : 1,
            }}
          >
            {COPY.duplicateBtn}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saveState === "saving"}
            className="inline-flex items-center gap-2"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#FFFEFB",
              backgroundColor:
                !isDirty || saveState === "saving" ? "#C4A97A" : "#9A7B4B",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: !isDirty || saveState === "saving" ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {saveState === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saveBtnLabel}
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      <AdminModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={COPY.deleteModalTitle}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              style={{
                fontSize: "13px",
                color: "#2C2520",
                backgroundColor: "#FFFEFB",
                border: "0.5px solid #D4C8B8",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {COPY.deleteModalCancel}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteBusy}
              className="inline-flex items-center gap-2"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#FFFEFB",
                backgroundColor: deleteBusy ? "#C4A97A" : "#9B3A2A",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: deleteBusy ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {deleteBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {COPY.deleteModalConfirm}
            </button>
          </>
        }
      >
        <p style={{ fontSize: "13px", color: "#6B5E52" }}>
          &ldquo;{template.name}&rdquo; will be permanently removed. This cannot be undone. Projects already
          instantiated from this template will continue to function — their workflow data is
          snapshot-versioned and not affected.
        </p>
      </AdminModal>

      {/* Discard changes confirm modal */}
      <AdminModal
        open={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title={COPY.discardTitle}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDiscardModal(false)}
              style={{
                fontSize: "13px",
                color: "#2C2520",
                backgroundColor: "#FFFEFB",
                border: "0.5px solid #D4C8B8",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {COPY.discardCancel}
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/admin/settings";
              }}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#FFFEFB",
                backgroundColor: "#9B3A2A",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {COPY.discardConfirm}
            </button>
          </>
        }
      >
        <p style={{ fontSize: "13px", color: "#6B5E52" }}>{COPY.discardBody}</p>
      </AdminModal>
    </div>
  );
}

export default function WorkflowTemplateEditor(props: Props) {
  return (
    <ToastContainer>
      <WorkflowTemplateEditorInner {...props} />
    </ToastContainer>
  );
}

import { useReducer, useCallback, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
  Plus,
  X,
  ChevronRight,
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

// Phase 44 — WorkflowTemplateEditor (redesigned per workflow_template_redesign.html)
// Collapsed-first accordion: milestones show as scannable rows, click to open
// inline edit panel. Assignee color dots + badge pills (gate/multi/optional/defaults).

// ===== CONSTANTS =====

const ASSIGNEE_COLORS: Record<AssigneeType, string> = {
  designer: "#534AB7",
  client: "#D85A30",
  vendor: "#1D9E75",
  trade: "#888780",
};

// ===== COPY STRINGS =====
const COPY = {
  saveBtn: "Save template",
  savingBtn: "Saving…",
  savedBtn: "Saved ✓",
  backBtn: "Back to Settings",
  duplicateBtn: "Duplicate as new",
  deleteBtn: "Delete template",
  deleteModalTitle: "Delete template?",
  deleteModalConfirm: "Delete template",
  deleteModalCancel: "Keep template",
  discardTitle: "Discard changes?",
  discardBody: "You have unsaved edits to this template. Discard them and return to Settings?",
  discardConfirm: "Discard changes",
  discardCancel: "Keep editing",
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
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20) +
    "-" + Math.random().toString(36).slice(2, 6)
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

function allMilestones(phases: PhaseTemplate[]): Array<{ id: string; name: string }> {
  return phases.flatMap((p) => p.milestones.map((m) => ({ id: m.id, name: m.name })));
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
      return { ...state, phases: [...state.phases, newPhase("New phase", state.phases.length)] };
    }
    case "DELETE_PHASE":
      return { ...state, phases: state.phases.filter((_, i) => i !== action.phaseIdx) };
    case "MOVE_PHASE":
      return { ...state, phases: moveItem(state.phases, action.phaseIdx, action.dir) };
    case "RENAME_PHASE":
      return { ...state, phases: state.phases.map((p, i) => i === action.phaseIdx ? { ...p, name: action.name } : p) };
    case "SET_PHASE_EXECUTION":
      return { ...state, phases: state.phases.map((p, i) => i === action.phaseIdx ? { ...p, execution: action.execution } : p) };
    case "TOGGLE_PHASE_OVERLAP":
      return {
        ...state, phases: state.phases.map((p, i) => {
          if (i !== action.phaseIdx) return p;
          const has = p.canOverlapWith.includes(action.targetId);
          return { ...p, canOverlapWith: has ? p.canOverlapWith.filter((id) => id !== action.targetId) : [...p.canOverlapWith, action.targetId] };
        }),
      };
    case "ADD_MILESTONE":
      return { ...state, phases: state.phases.map((p, i) => i !== action.phaseIdx ? p : { ...p, milestones: [...p.milestones, newMilestone()] }) };
    case "DELETE_MILESTONE":
      return { ...state, phases: state.phases.map((p, i) => i !== action.phaseIdx ? p : { ...p, milestones: p.milestones.filter((_, j) => j !== action.milestoneIdx) }) };
    case "MOVE_MILESTONE":
      return { ...state, phases: state.phases.map((p, i) => i !== action.phaseIdx ? p : { ...p, milestones: moveItem(p.milestones, action.milestoneIdx, action.dir) }) };
    case "UPDATE_MILESTONE":
      return {
        ...state, phases: state.phases.map((p, i) => {
          if (i !== action.phaseIdx) return p;
          return { ...p, milestones: p.milestones.map((m, j) => j === action.milestoneIdx ? { ...m, [action.field]: action.value } : m) };
        }),
      };
    case "TOGGLE_HARD_PREREQ":
      return {
        ...state, phases: state.phases.map((p, i) => {
          if (i !== action.phaseIdx) return p;
          return {
            ...p, milestones: p.milestones.map((m, j) => {
              if (j !== action.milestoneIdx) return m;
              const has = m.hardPrereqs.includes(action.prereqId);
              return { ...m, hardPrereqs: has ? m.hardPrereqs.filter((id) => id !== action.prereqId) : [...m.hardPrereqs, action.prereqId] };
            }),
          };
        }),
      };
    case "TOGGLE_SOFT_PREREQ":
      return {
        ...state, phases: state.phases.map((p, i) => {
          if (i !== action.phaseIdx) return p;
          return {
            ...p, milestones: p.milestones.map((m, j) => {
              if (j !== action.milestoneIdx) return m;
              const has = m.softPrereqs.includes(action.prereqId);
              return { ...m, softPrereqs: has ? m.softPrereqs.filter((id) => id !== action.prereqId) : [...m.softPrereqs, action.prereqId] };
            }),
          };
        }),
      };
    case "ADD_DEFAULT_INSTANCE":
      return {
        ...state, phases: state.phases.map((p, i) => {
          if (i !== action.phaseIdx) return p;
          return { ...p, milestones: p.milestones.map((m, j) => j !== action.milestoneIdx ? m : { ...m, defaultInstances: [...m.defaultInstances, { _key: crypto.randomUUID(), name: action.name }] }) };
        }),
      };
    case "DELETE_DEFAULT_INSTANCE":
      return {
        ...state, phases: state.phases.map((p, i) => {
          if (i !== action.phaseIdx) return p;
          return { ...p, milestones: p.milestones.map((m, j) => j !== action.milestoneIdx ? m : { ...m, defaultInstances: m.defaultInstances.filter((inst) => inst._key !== action.instanceKey) }) };
        }),
      };
    default:
      return state;
  }
}

// ===== DEFAULTS SECTION =====

function DefaultsSection({
  defaults,
  dispatch,
}: {
  defaults: WorkflowTemplateDefaults;
  dispatch: React.Dispatch<Action>;
}) {
  const cards = [
    { key: "clientApprovalDays" as const, label: "Client approval window", value: defaults.clientApprovalDays, unit: "biz days", min: 1 },
    { key: "dormancyDays" as const, label: "Dormancy threshold", value: defaults.dormancyDays, unit: "cal days", min: 1 },
    { key: "revisionRounds" as const, label: "Revision rounds", value: defaults.revisionRounds, unit: "included", min: 0 },
  ];
  return (
    <div style={{ margin: "16px 0 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "8px" }}>
        {cards.map((c) => (
          <div key={c.key} style={{ background: "#F3EDE3", borderRadius: "8px", padding: "10px 12px" }}>
            <div style={{ fontSize: "11px", color: "#9E8E80", marginBottom: "4px" }}>{c.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <input
                type="number"
                min={c.min}
                value={c.value}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_DEFAULTS",
                    key: c.key,
                    value: Math.max(c.min, parseInt(e.target.value) || c.min),
                  })
                }
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  border: "none",
                  background: "none",
                  width: "44px",
                  outline: "none",
                  color: "#2C2520",
                  fontFamily: "var(--font-sans)",
                }}
              />
              <span style={{ fontSize: "12px", color: "#9E8E80", fontWeight: 400 }}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "11px", color: "#9E8E80" }}>
        Inherited from your design services agreement. Overrides apply only to projects created from this template.
      </p>
    </div>
  );
}

// ===== MILESTONE EDITOR ROW =====

function MilestoneEditorRow({
  milestone,
  milestoneIdx,
  phaseIdx,
  allMs,
  isFirst,
  isLast,
  isEdit,
  onToggleEdit,
  dispatch,
}: {
  milestone: MilestoneTemplate;
  milestoneIdx: number;
  phaseIdx: number;
  allMs: Array<{ id: string; name: string }>;
  isFirst: boolean;
  isLast: boolean;
  isEdit: boolean;
  onToggleEdit: () => void;
  dispatch: React.Dispatch<Action>;
}) {
  const [hovered, setHovered] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const others = allMs.filter((m) => m.id !== milestone.id);

  return (
    <div>
      {/* Scannable row */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Edit milestone: ${milestone.name}`}
        onClick={onToggleEdit}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggleEdit(); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 0",
          borderBottom: isLast && !isEdit ? "none" : "0.5px solid #E8DDD0",
          cursor: "pointer",
          background: hovered && !isEdit ? "#F9F6F2" : "transparent",
          margin: hovered && !isEdit ? "0 -12px" : "0",
          paddingLeft: hovered && !isEdit ? "12px" : "0",
          paddingRight: hovered && !isEdit ? "12px" : "0",
          borderRadius: hovered && !isEdit ? "6px" : "0",
          transition: "background .1s",
        }}
      >
        {/* Grip handle — only in DOM when hovered so it doesn't push content right */}
        {hovered && (
          <span
            aria-hidden
            style={{
              color: "#9E8E80",
              fontSize: "11px",
              cursor: "grab",
              letterSpacing: "-1px",
              flexShrink: 0,
              userSelect: "none",
            }}
          >
            ⠿⠿
          </span>
        )}

        {/* Assignee dot */}
        <div
          aria-label={`Assignee: ${milestone.assignee}`}
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: ASSIGNEE_COLORS[milestone.assignee],
            flexShrink: 0,
          }}
        />

        {/* Name */}
        <span
          style={{
            flex: 1,
            fontSize: "13px",
            color: "#2C2520",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {milestone.name || "Unnamed milestone"}
        </span>

        {/* Badges */}
        <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
          {milestone.gate && (
            <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "5px", background: "#FAEEDA", color: "#633806" }}>
              {milestone.gate}
            </span>
          )}
          {milestone.multiInstance && (
            <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "5px", background: "#EEEDFE", color: "#3C3489" }}>
              multi
            </span>
          )}
          {milestone.optional && (
            <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "5px", background: "#F3EDE3", color: "#6B5E52" }}>
              optional
            </span>
          )}
          {milestone.defaultInstances.length > 0 && (
            <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "5px", background: "#E1F5EE", color: "#085041" }}>
              {milestone.defaultInstances.length} defaults
            </span>
          )}
        </div>

        {/* Delete X — visible on hover */}
        <button
          type="button"
          aria-label={`Delete milestone: ${milestone.name}`}
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: "DELETE_MILESTONE", phaseIdx, milestoneIdx });
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9E8E80",
            padding: 0,
            width: "14px",
            height: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: hovered ? 1 : 0,
            transition: "opacity .1s",
          }}
        >
          <X size={11} />
        </button>
      </div>

      {/* Inline edit panel */}
      {isEdit && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#F3EDE3",
            borderRadius: "8px",
            padding: "10px 12px",
            margin: "4px 0 6px",
            borderBottom: isLast ? "none" : "0.5px solid #E8DDD0",
          }}
        >
          {/* Name + Assignee + Gate */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "#6B5E52", display: "block", marginBottom: "3px" }}>Name</label>
              <input
                className="luxury-input"
                value={milestone.name}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_MILESTONE", phaseIdx, milestoneIdx, field: "name", value: e.target.value })
                }
                style={{ fontSize: "12px", width: "100%" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#6B5E52", display: "block", marginBottom: "3px" }}>Assignee</label>
                <select
                  className="luxury-input"
                  value={milestone.assignee}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_MILESTONE", phaseIdx, milestoneIdx, field: "assignee", value: e.target.value as AssigneeType })
                  }
                  style={{ fontSize: "11px", width: "100%" }}
                >
                  <option value="designer">Designer</option>
                  <option value="client">Client</option>
                  <option value="vendor">Vendor</option>
                  <option value="trade">Trade</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#6B5E52", display: "block", marginBottom: "3px" }}>Gate</label>
                <select
                  className="luxury-input"
                  value={milestone.gate ?? ""}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_MILESTONE", phaseIdx, milestoneIdx, field: "gate", value: (e.target.value as GateType) || null })
                  }
                  style={{ fontSize: "11px", width: "100%" }}
                >
                  <option value="">None</option>
                  <option value="payment">Payment</option>
                  <option value="approval">Approval</option>
                  <option value="signature">Signature</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div style={{ display: "flex", gap: "12px", paddingTop: "8px", borderTop: "0.5px solid #D4C8B8" }}>
            <label style={{ fontSize: "11px", color: "#6B5E52", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={milestone.optional}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_MILESTONE", phaseIdx, milestoneIdx, field: "optional", value: e.target.checked })
                }
              />
              Optional
            </label>
            <label style={{ fontSize: "11px", color: "#6B5E52", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={milestone.multiInstance}
                onChange={(e) =>
                  dispatch({ type: "UPDATE_MILESTONE", phaseIdx, milestoneIdx, field: "multiInstance", value: e.target.checked })
                }
              />
              Multi-instance
            </label>
          </div>

          {/* Prerequisites */}
          {others.length > 0 && (
            <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "0.5px solid #D4C8B8" }}>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#6B5E52", marginBottom: "4px" }}>Hard prereqs</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                    {others.map((o) => {
                      const active = milestone.hardPrereqs.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => dispatch({ type: "TOGGLE_HARD_PREREQ", phaseIdx, milestoneIdx, prereqId: o.id })}
                          style={{
                            fontSize: "10px",
                            padding: "1px 7px",
                            borderRadius: "5px",
                            border: `0.5px solid ${active ? "#9A7B4B" : "#E8DDD0"}`,
                            background: active ? "#F5EDD8" : "#FFFEFB",
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
                <div>
                  <div style={{ fontSize: "11px", color: "#6B5E52", marginBottom: "4px" }}>Soft prereqs</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                    {others.map((o) => {
                      const active = milestone.softPrereqs.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => dispatch({ type: "TOGGLE_SOFT_PREREQ", phaseIdx, milestoneIdx, prereqId: o.id })}
                          style={{
                            fontSize: "10px",
                            padding: "1px 7px",
                            borderRadius: "5px",
                            border: `0.5px solid ${active ? "#6B5E52" : "#E8DDD0"}`,
                            background: active ? "#F3EDE3" : "#FFFEFB",
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

          {/* Default instances (multi-instance only) */}
          {milestone.multiInstance && (
            <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "0.5px solid #D4C8B8" }}>
              <div style={{ fontSize: "11px", color: "#6B5E52", marginBottom: "4px" }}>
                Default instances <span style={{ color: "#9E8E80" }}>(pre-populated on new projects)</span>
              </div>
              {milestone.defaultInstances.map((inst) => (
                <div key={inst._key} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "2px 0", fontSize: "11px" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#1D9E75", flexShrink: 0 }} />
                  <span style={{ flex: 1, color: "#2C2520" }}>{inst.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${inst.name}`}
                    onClick={() => dispatch({ type: "DELETE_DEFAULT_INSTANCE", phaseIdx, milestoneIdx, instanceKey: inst._key })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9E8E80", padding: 0 }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <input
                  className="luxury-input"
                  placeholder="Add default contractor or vendor…"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newInstanceName.trim()) {
                      dispatch({ type: "ADD_DEFAULT_INSTANCE", phaseIdx, milestoneIdx, name: newInstanceName.trim() });
                      setNewInstanceName("");
                    }
                    if (e.key === "Escape") setNewInstanceName("");
                  }}
                  style={{ fontSize: "11px", flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newInstanceName.trim()) {
                      dispatch({ type: "ADD_DEFAULT_INSTANCE", phaseIdx, milestoneIdx, name: newInstanceName.trim() });
                      setNewInstanceName("");
                    }
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9A7B4B" }}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Move up / down — tucked into edit panel */}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px", paddingTop: "8px", borderTop: "0.5px solid #D4C8B8", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={isFirst}
              aria-label="Move milestone up"
              onClick={() => dispatch({ type: "MOVE_MILESTONE", phaseIdx, milestoneIdx, dir: "up" })}
              style={{ background: "none", border: "none", cursor: isFirst ? "not-allowed" : "pointer", color: isFirst ? "#D4C8B8" : "#6B5E52", fontSize: "11px", padding: "2px 8px", fontFamily: "var(--font-sans)" }}
            >
              <ArrowUp size={11} style={{ display: "inline", verticalAlign: "middle" }} /> Move up
            </button>
            <button
              type="button"
              disabled={isLast}
              aria-label="Move milestone down"
              onClick={() => dispatch({ type: "MOVE_MILESTONE", phaseIdx, milestoneIdx, dir: "down" })}
              style={{ background: "none", border: "none", cursor: isLast ? "not-allowed" : "pointer", color: isLast ? "#D4C8B8" : "#6B5E52", fontSize: "11px", padding: "2px 8px", fontFamily: "var(--font-sans)" }}
            >
              <ArrowDown size={11} style={{ display: "inline", verticalAlign: "middle" }} /> Move down
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== PHASE ACCORDION ITEM =====

function PhaseAccordionItem({
  phase,
  phaseIdx,
  allPhases,
  allMs,
  isFirst,
  isLast,
  isOpen,
  onToggle,
  editMsKey,
  onToggleMs,
  dispatch,
}: {
  phase: PhaseTemplate;
  phaseIdx: number;
  allPhases: PhaseTemplate[];
  allMs: Array<{ id: string; name: string }>;
  isFirst: boolean;
  isLast: boolean;
  isOpen: boolean;
  onToggle: () => void;
  editMsKey: string | null;
  onToggleMs: (phaseIdx: number, milestoneIdx: number) => void;
  dispatch: React.Dispatch<Action>;
}) {
  const otherPhases = allPhases.filter((_, i) => i !== phaseIdx);
  const hasOverlap = phase.canOverlapWith.length > 0;

  return (
    <div
      style={{
        border: `0.5px solid ${isOpen ? "#D4C8B8" : "#E8DDD0"}`,
        borderRadius: "10px",
        marginBottom: "6px",
        background: "#FFFEFB",
        overflow: "hidden",
        transition: "border-color .15s",
      }}
    >
      {/* Accordion header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "Collapse" : "Expand"} phase: ${phase.name}`}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Number bubble */}
        <div
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#F3EDE3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 500,
            color: "#6B5E52",
            flexShrink: 0,
          }}
        >
          {phaseIdx + 1}
        </div>

        {/* Phase name — input when open, text when closed */}
        {isOpen ? (
          <input
            value={phase.name}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => dispatch({ type: "RENAME_PHASE", phaseIdx, name: e.target.value })}
            aria-label="Phase name"
            style={{
              flex: 1,
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              background: "none",
              outline: "none",
              color: "#2C2520",
              fontFamily: "var(--font-sans)",
            }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: "14px", fontWeight: 500, color: phase.name ? "#2C2520" : "#9E8E80", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {phase.name || "Unnamed phase"}
          </span>
        )}

        {/* Pills */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
          {phase.canOverlapWith.map((targetId) => {
            const targetIdx = allPhases.findIndex((p) => p.id === targetId);
            return (
              <span key={targetId} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "6px", background: "#EEEDFE", color: "#3C3489", whiteSpace: "nowrap" }}>
                ↔ {targetIdx >= 0 ? targetIdx + 1 : targetId}
              </span>
            );
          })}
          <span
            style={{
              fontSize: "10px",
              padding: "2px 7px",
              borderRadius: "6px",
              background: phase.execution === "parallel" ? "#EAF3DE" : "#F3EDE3",
              color: phase.execution === "parallel" ? "#27500A" : "#6B5E52",
              whiteSpace: "nowrap",
            }}
          >
            {phase.execution === "parallel" ? "parallel" : "sequential"}
          </span>
          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "6px", background: "#F3EDE3", color: "#6B5E52", minWidth: "18px", textAlign: "center" }}>
            {phase.milestones.length}
          </span>
        </div>

        {/* Phase controls (up/down/delete) — shown when open */}
        {isOpen && (
          <span
            style={{ display: "flex", alignItems: "center", gap: "2px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={isFirst}
              aria-label="Move phase up"
              onClick={() => dispatch({ type: "MOVE_PHASE", phaseIdx, dir: "up" })}
              style={{ background: "none", border: "none", cursor: isFirst ? "not-allowed" : "pointer", color: isFirst ? "#D4C8B8" : "#9E8E80", padding: "2px" }}
            >
              <ArrowUp size={12} />
            </button>
            <button
              type="button"
              disabled={isLast}
              aria-label="Move phase down"
              onClick={() => dispatch({ type: "MOVE_PHASE", phaseIdx, dir: "down" })}
              style={{ background: "none", border: "none", cursor: isLast ? "not-allowed" : "pointer", color: isLast ? "#D4C8B8" : "#9E8E80", padding: "2px" }}
            >
              <ArrowDown size={12} />
            </button>
            <button
              type="button"
              disabled={phase.milestones.length > 0}
              aria-label={phase.milestones.length > 0 ? "Remove all milestones to delete phase" : "Delete phase"}
              title={phase.milestones.length > 0 ? "Remove all milestones first" : undefined}
              onClick={() => { if (phase.milestones.length === 0) dispatch({ type: "DELETE_PHASE", phaseIdx }); }}
              style={{ background: "none", border: "none", cursor: phase.milestones.length > 0 ? "not-allowed" : "pointer", color: phase.milestones.length > 0 ? "#D4C8B8" : "#9B3A2A", padding: "2px" }}
            >
              <Trash2 size={12} />
            </button>
          </span>
        )}

        {/* Chevron */}
        <ChevronRight
          size={14}
          style={{
            color: "#9E8E80",
            transform: isOpen ? "rotate(90deg)" : "none",
            transition: "transform .15s",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Expanded body */}
      {isOpen && (
        <div>
          {/* Config strip */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              padding: "8px 12px",
              borderTop: "0.5px solid #E8DDD0",
              background: "#F3EDE3",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "11px", color: "#6B5E52" }}>Execution</span>
            <div style={{ display: "inline-flex", borderRadius: "6px", overflow: "hidden", border: "0.5px solid #D4C8B8" }}>
              {(["sequential", "parallel"] as PhaseExecution[]).map((exec) => (
                <button
                  key={exec}
                  type="button"
                  onClick={() => dispatch({ type: "SET_PHASE_EXECUTION", phaseIdx, execution: exec })}
                  style={{
                    fontSize: "11px",
                    padding: "3px 10px",
                    cursor: "pointer",
                    background: phase.execution === exec ? "#2C2520" : "#FFFEFB",
                    color: phase.execution === exec ? "#FFFEFB" : "#6B5E52",
                    border: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {exec === "sequential" ? "Sequential" : "Parallel"}
                </button>
              ))}
            </div>

            {otherPhases.length > 0 && (
              <>
                <span style={{ fontSize: "11px", color: "#6B5E52", marginLeft: "4px" }}>Overlaps with</span>
                <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                  {otherPhases.map((op) => {
                    const active = phase.canOverlapWith.includes(op.id);
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => dispatch({ type: "TOGGLE_PHASE_OVERLAP", phaseIdx, targetId: op.id })}
                        style={{
                          fontSize: "10px",
                          padding: "2px 7px",
                          borderRadius: "5px",
                          background: active ? "#EEEDFE" : "#FFFEFB",
                          color: active ? "#3C3489" : "#9E8E80",
                          border: `0.5px solid ${active ? "#C5C2F0" : "#E8DDD0"}`,
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {op.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Milestone list */}
          <div style={{ padding: "4px 12px 8px" }}>
            {phase.milestones.map((m, mIdx) => (
              <MilestoneEditorRow
                key={m._key}
                milestone={m}
                milestoneIdx={mIdx}
                phaseIdx={phaseIdx}
                allMs={allMs}
                isFirst={mIdx === 0}
                isLast={mIdx === phase.milestones.length - 1}
                isEdit={editMsKey === `${phaseIdx}-${mIdx}`}
                onToggleEdit={() => onToggleMs(phaseIdx, mIdx)}
                dispatch={dispatch}
              />
            ))}

            {/* Add milestone */}
            <button
              type="button"
              onClick={() => dispatch({ type: "ADD_MILESTONE", phaseIdx })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                padding: "6px",
                fontSize: "12px",
                color: "#9E8E80",
                cursor: "pointer",
                borderRadius: "6px",
                margin: "2px 0",
                background: "none",
                border: "none",
                width: "100%",
                fontFamily: "var(--font-sans)",
              }}
            >
              + Add milestone
            </button>
          </div>
        </div>
      )}
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

  // Accordion state — one phase open at a time
  const [openPhaseIdx, setOpenPhaseIdx] = useState<number | null>(null);
  // One milestone edit panel open at a time across all phases; key: "phaseIdx-milestoneIdx"
  const [editMsKey, setEditMsKey] = useState<string | null>(null);

  const { show } = useToast();
  const isDirty = JSON.stringify(state) !== JSON.stringify(template);
  const msAll = allMilestones(state.phases);

  const togglePhase = useCallback((pi: number) => {
    setOpenPhaseIdx((prev) => (prev === pi ? null : pi));
    setEditMsKey(null);
  }, []);

  const toggleMs = useCallback((pi: number, mi: number) => {
    const k = `${pi}-${mi}`;
    setEditMsKey((prev) => (prev === k ? null : k));
  }, []);

  const handleSave = useCallback(async () => {
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
        body: JSON.stringify({ name: state.name, phases: state.phases, defaults: state.defaults }),
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
      const res = await fetch(`/api/admin/workflow-templates/${template._id}`, { method: "DELETE" });
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
      const res = await fetch(`/api/admin/workflow-templates/${template._id}/duplicate`, { method: "POST" });
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
    saveState === "saving" ? COPY.savingBtn : saveState === "saved" ? COPY.savedBtn : COPY.saveBtn;

  return (
    <div style={{ maxWidth: "680px", padding: "0.5rem 0" }}>

      {/* Template name + version pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <input
          value={state.name}
          placeholder="Template name"
          onChange={(e) => dispatch({ type: "RENAME_TEMPLATE", name: e.target.value })}
          aria-label="Template name"
          style={{
            fontSize: "20px",
            fontWeight: 500,
            border: "none",
            background: "none",
            outline: "none",
            color: "#2C2520",
            flex: 1,
            fontFamily: "var(--font-sans)",
          }}
        />
        <span
          style={{
            fontSize: "11px",
            color: "#9E8E80",
            background: "#F3EDE3",
            padding: "1px 6px",
            borderRadius: "4px",
            flexShrink: 0,
          }}
        >
          v{template.version}
        </span>
      </div>

      {/* Defaults: 3 metric cards */}
      <DefaultsSection defaults={state.defaults} dispatch={dispatch} />

      {/* Empty state */}
      {state.phases.length === 0 && (
        <p style={{ fontSize: "13px", color: "#6B5E52", marginBottom: "16px", padding: "12px 16px", backgroundColor: "#F3EDE3", borderRadius: "10px", border: "0.5px solid #E8DDD0" }}>
          Start by naming your template, then add phases below. Each phase contains one or more milestones. Gates (payment, approval, signature, delivery) are hard blocks the engine enforces before a milestone can advance.
        </p>
      )}

      {/* PHASES */}
      <div style={{ fontSize: "11px", color: "#9E8E80", textTransform: "uppercase", letterSpacing: "0.5px", margin: "20px 0 8px" }}>
        Phases
      </div>

      <div>
        {state.phases.map((phase, phaseIdx) => (
          <PhaseAccordionItem
            key={phase._key}
            phase={phase}
            phaseIdx={phaseIdx}
            allPhases={state.phases}
            allMs={msAll}
            isFirst={phaseIdx === 0}
            isLast={phaseIdx === state.phases.length - 1}
            isOpen={openPhaseIdx === phaseIdx}
            onToggle={() => togglePhase(phaseIdx)}
            editMsKey={editMsKey}
            onToggleMs={toggleMs}
            dispatch={dispatch}
          />
        ))}
      </div>

      {/* Add phase */}
      <button
        type="button"
        onClick={() => {
          dispatch({ type: "ADD_PHASE" });
          setOpenPhaseIdx(state.phases.length);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          padding: "10px",
          fontSize: "13px",
          color: "#9E8E80",
          cursor: "pointer",
          borderRadius: "10px",
          border: "0.5px dashed #D4C8B8",
          marginTop: "6px",
          background: "none",
          width: "100%",
          fontFamily: "var(--font-sans)",
        }}
      >
        + Add phase
      </button>

      {/* Errors */}
      {cycleError && (
        <p style={{ fontSize: "13px", color: "#9B3A2A", backgroundColor: "#FBEEE8", borderRadius: "8px", padding: "8px 12px", marginTop: "16px" }} role="alert">
          {cycleError}
        </p>
      )}
      {saveState === "error" && saveError && (
        <p style={{ fontSize: "13px", color: "#9B3A2A", backgroundColor: "#FBEEE8", borderRadius: "8px", padding: "8px 12px", marginTop: "16px" }} role="alert">
          {saveError}
        </p>
      )}

      {/* Footer */}
      <div
        className="sticky bottom-0"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FFFEFB",
          borderTop: "0.5px solid #E8DDD0",
          padding: "16px 0",
          marginTop: "20px",
        }}
      >
        {/* Left: Delete */}
        {inUseCount > 0 ? (
          <span title={`Used by ${inUseCount} project${inUseCount !== 1 ? "s" : ""} — delete them first, or duplicate and edit the copy.`}>
            <button
              type="button"
              disabled
              style={{ fontSize: "13px", color: "#D4C8B8", background: "none", border: "none", cursor: "not-allowed", fontFamily: "var(--font-sans)" }}
            >
              {COPY.deleteBtn}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            style={{ fontSize: "13px", color: "#9B3A2A", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            {COPY.deleteBtn}
          </button>
        )}

        {/* Right: Back + Duplicate + Save */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={handleBack}
            style={{ fontSize: "12px", color: "#2C2520", backgroundColor: "#FFFEFB", border: "0.5px solid #D4C8B8", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            {COPY.backBtn}
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicateBusy}
            style={{ fontSize: "12px", color: "#2C2520", backgroundColor: "#FFFEFB", border: "0.5px solid #D4C8B8", padding: "6px 14px", borderRadius: "6px", cursor: duplicateBusy ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", opacity: duplicateBusy ? 0.6 : 1 }}
          >
            {COPY.duplicateBtn}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saveState === "saving"}
            className="inline-flex items-center gap-2"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#FFFEFB",
              backgroundColor: !isDirty || saveState === "saving" ? "#C4A97A" : "#854F0B",
              border: "none",
              padding: "6px 14px",
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

      {/* Delete modal */}
      <AdminModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={COPY.deleteModalTitle}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              style={{ fontSize: "13px", color: "#2C2520", backgroundColor: "#FFFEFB", border: "0.5px solid #D4C8B8", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
            >
              {COPY.deleteModalCancel}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteBusy}
              className="inline-flex items-center gap-2"
              style={{ fontSize: "13px", fontWeight: 600, color: "#FFFEFB", backgroundColor: deleteBusy ? "#C4A97A" : "#9B3A2A", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: deleteBusy ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}
            >
              {deleteBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {COPY.deleteModalConfirm}
            </button>
          </>
        }
      >
        <p style={{ fontSize: "13px", color: "#6B5E52" }}>
          &ldquo;{template.name}&rdquo; will be permanently removed. Projects already instantiated from this template will continue to function — their workflow data is snapshot-versioned and not affected.
        </p>
      </AdminModal>

      {/* Discard modal */}
      <AdminModal
        open={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title={COPY.discardTitle}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDiscardModal(false)}
              style={{ fontSize: "13px", color: "#2C2520", backgroundColor: "#FFFEFB", border: "0.5px solid #D4C8B8", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
            >
              {COPY.discardCancel}
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = "/admin/settings"; }}
              style={{ fontSize: "13px", fontWeight: 600, color: "#FFFEFB", backgroundColor: "#9B3A2A", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
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

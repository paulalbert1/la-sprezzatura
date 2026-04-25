// Phase 44 Plan 07 Task 3 — WorkflowTracker (island root)
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Surface 3
//   .planning/phases/44-workflow-engine/44-07-PLAN.md § Task 3
//
// Top-level React island that composes Header + Warnings + Metrics + PhaseAccordions.
// Orchestrates all API calls (milestone-status, instance CRUD, lifecycle actions).
// Optimistic-with-rollback pattern: snap → apply locally → POST → replace or rollback.
// Wraps inner component in <ToastContainer> per per-island provider pattern.

import { useState, useCallback, useMemo, useEffect } from "react";
import ToastContainer, { useToast } from "../ui/ToastContainer";
import AdminModal from "../ui/AdminModal";
import WorkflowHeader from "./WorkflowHeader";
import WorkflowWarnings from "./WorkflowWarnings";
import WorkflowMetrics from "./WorkflowMetrics";
import PhaseAccordion from "./PhaseAccordion";
import StatusPickerPopover from "./StatusPickerPopover";
import type {
  MilestoneStatus,
  ProjectWorkflow,
  Warning,
  WorkflowMetrics as WM,
  PhaseInstance,
} from "../../../lib/workflow/types";
import {
  computeMetrics,
  isBlocked,
  getAdminTransitions,
  getNextActionableMilestone,
  type AdminTransition,
} from "../../../lib/workflow/engine";

export interface WorkflowTrackerProps {
  projectId: string;
  projectTitle: string;
  clientInitials: string;
  workflow: ProjectWorkflow;
  templateName: string;
  warnings: Warning[];
  metrics: WM;
  templates: Array<{ _id: string; name: string }>;
  // Server-precomputed engine outputs
  transitionsById: Record<string, Array<AdminTransition>>;
  // Key format: `${phaseId}:${milestoneId}` for milestone
  // `${phaseId}:${milestoneId}:${instanceKey}` for sub-row
  blockedById: Record<string, { blocked: boolean; reason?: string }>;
  gateSubMessageById?: Record<string, string>;
  overdueReasonById?: Record<string, string>;
  nextActionable?: { phaseId: string; milestoneId: string; name: string } | null;
}

interface PickerContext {
  anchor: HTMLElement;
  phaseId: string;
  milestoneId: string;
  instanceKey?: string;
}

// Derive a phase status from milestone statuses + whether this phase contains
// the next actionable milestone. The `up_next` value differentiates a phase
// that is ready to start from one that is genuinely waiting on earlier work.
function derivePhaseStatus(
  phase: PhaseInstance,
  nextActionablePhaseId?: string,
): "complete" | "in_progress" | "up_next" | "upcoming" {
  const ms = phase.milestones;
  if (ms.length === 0) return "upcoming";
  if (ms.every((m) => m.status === "complete" || m.status === "skipped")) {
    return "complete";
  }
  if (
    ms.some(
      (m) =>
        m.status === "in_progress" ||
        m.status === "awaiting_client" ||
        m.status === "awaiting_payment",
    )
  ) {
    return "in_progress";
  }
  if (nextActionablePhaseId === phase.id) return "up_next";
  return "upcoming";
}

function Inner(props: WorkflowTrackerProps) {
  const [wf, setWf] = useState<ProjectWorkflow>(props.workflow);
  const [picker, setPicker] = useState<PickerContext | null>(null);
  // When the user picks a revert (currently complete → not_started/in_progress/etc.),
  // hold the pending pick here and show a confirmation modal before applying.
  const [pendingRevert, setPendingRevert] = useState<{
    phaseId: string;
    milestoneId: string;
    instanceKey?: string;
    target: MilestoneStatus;
    milestoneName: string;
  } | null>(null);
  const { show } = useToast();

  // Resolve URL hash to a phase id so we can auto-expand the phase containing
  // the targeted milestone when arriving via deep link from the project card.
  const hashPhaseId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;
    const phase = wf.phases.find((p) =>
      p.milestones.some((m) => m.id === hash),
    );
    return phase?.id ?? null;
  }, [wf.phases]);

  // After mount, scroll the targeted milestone into view (the phase will already
  // be open from defaultOpen logic, so the anchor target is in the DOM).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, []);

  const handleStatusClick = useCallback(
    (
      phaseId: string,
      milestoneId: string,
      instanceKey: string | undefined,
      anchor: HTMLElement,
    ) => {
      setPicker({ anchor, phaseId, milestoneId, instanceKey });
    },
    [],
  );

  async function applyTransition(
    phaseId: string,
    milestoneId: string,
    instanceKey: string | undefined,
    target: MilestoneStatus,
  ) {
    const snap = wf;
    try {
      const res = await fetch(
        `/api/admin/projects/${props.projectId}/workflow/milestone-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phaseId,
            milestoneId,
            target,
            instanceKey,
          }),
        },
      );
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Transition failed" }));
        throw new Error(data.error ?? "Transition failed");
      }
      const data = await res.json();
      if (data.workflow) {
        setWf(data.workflow);
      }
    } catch (err) {
      setWf(snap);
      show({ variant: "error", title: (err as Error).message });
    }
  }

  async function handlePick(target: MilestoneStatus) {
    if (!picker) return;
    const { phaseId, milestoneId, instanceKey } = picker;
    setPicker(null);

    // Intercept reverts: when the milestone is currently complete and the
    // user picks any non-complete target, route through the confirmation
    // modal first. Skipped is also a complete-equivalent end-state.
    const milestone = wf.phases
      .find((p) => p.id === phaseId)
      ?.milestones.find((m) => m.id === milestoneId);
    const isRevertingFromComplete =
      !instanceKey &&
      milestone?.status === "complete" &&
      target !== "complete";
    if (isRevertingFromComplete && milestone) {
      setPendingRevert({
        phaseId,
        milestoneId,
        instanceKey,
        target,
        milestoneName: milestone.name,
      });
      return;
    }

    await applyTransition(phaseId, milestoneId, instanceKey, target);
  }

  async function confirmRevert() {
    if (!pendingRevert) return;
    const { phaseId, milestoneId, instanceKey, target } = pendingRevert;
    setPendingRevert(null);
    await applyTransition(phaseId, milestoneId, instanceKey, target);
  }

  async function handleAddInstance(
    phaseId: string,
    milestoneId: string,
    name: string,
  ) {
    const snap = wf;
    try {
      const res = await fetch(
        `/api/admin/projects/${props.projectId}/workflow/instance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phaseId, milestoneId, name }),
        },
      );
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Could not add contractor" }));
        throw new Error(data.error ?? "Could not add contractor");
      }
      const data = await res.json();
      if (data.workflow) {
        setWf(data.workflow);
      }
    } catch (err) {
      setWf(snap);
      show({ variant: "error", title: (err as Error).message });
    }
  }

  async function handleRemoveInstance(
    phaseId: string,
    milestoneId: string,
    instanceKey: string,
  ) {
    const snap = wf;
    try {
      const res = await fetch(
        `/api/admin/projects/${props.projectId}/workflow/instance`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phaseId, milestoneId, instanceKey }),
        },
      );
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Could not remove contractor" }));
        throw new Error(data.error ?? "Could not remove contractor");
      }
      const data = await res.json();
      if (data.workflow) {
        setWf(data.workflow);
      }
    } catch (err) {
      setWf(snap);
      show({ variant: "error", title: (err as Error).message });
    }
  }

  // Derive engine outputs from the live workflow state. SSR props are used as
  // initial values via useState seed; these recompute on every status change so
  // metrics, transitions, and the next-up cue stay in sync after optimistic
  // updates and API responses.
  const liveMetrics = useMemo(() => computeMetrics(wf), [wf]);
  const liveNextActionable = useMemo(() => getNextActionableMilestone(wf), [wf]);
  const liveBlocked = useCallback(
    (pid: string, mid: string) => isBlocked(wf, pid, mid),
    [wf],
  );

  // Resolve picker transitions and current milestone
  const transitions = picker
    ? getAdminTransitions(wf, picker.phaseId, picker.milestoneId, picker.instanceKey)
    : [];

  const currentMs = picker
    ? wf.phases
        .find((p) => p.id === picker.phaseId)
        ?.milestones.find((m) => m.id === picker.milestoneId)
    : null;

  return (
    <>
      <WorkflowHeader
        workflow={wf}
        projectTitle={props.projectTitle}
        clientInitials={props.clientInitials}
        templateName={props.templateName}
        onChangeTemplate={() => {
          // Lifecycle action: confirmation → PATCH changeTemplate
          // Placeholder — full lifecycle modal handled via AdminModal
          show({
            variant: "error",
            title: "Change template via the template settings page.",
          });
        }}
        onTerminate={() => {
          // Lifecycle action: confirmation → PATCH/DELETE
          show({
            variant: "error",
            title:
              "Terminate workflow: confirm via the settings page for now.",
          });
        }}
        onReactivate={async () => {
          try {
            const res = await fetch(
              `/api/admin/projects/${props.projectId}/workflow`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reactivate" }),
              },
            );
            if (!res.ok) {
              const data = await res
                .json()
                .catch(() => ({ error: "Could not reactivate" }));
              throw new Error(data.error ?? "Could not reactivate");
            }
            window.location.reload();
          } catch (err) {
            show({ variant: "error", title: (err as Error).message });
          }
        }}
      />

      <WorkflowWarnings warnings={props.warnings} />

      <WorkflowMetrics metrics={liveMetrics} />

      {wf.phases.map((phase, idx) => {
        const phaseStatus = derivePhaseStatus(phase, liveNextActionable?.phaseId);
        const defaultOpen =
          phaseStatus === "in_progress" ||
          phaseStatus === "up_next" ||
          phase.id === hashPhaseId ||
          (idx === 0 && phaseStatus !== "complete");
        const isNextUpMilestone = (mid: string) =>
          liveNextActionable?.phaseId === phase.id &&
          liveNextActionable?.milestoneId === mid;
        return (
          <PhaseAccordion
            key={phase._key}
            phase={phase}
            phaseStatus={phaseStatus}
            isParallel={phase.canOverlapWith.length > 0}
            defaultOpen={defaultOpen}
            isBlocked={liveBlocked}
            gateSubMessageFor={(pid, mid) =>
              props.gateSubMessageById?.[`${pid}:${mid}`]
            }
            overdueReasonFor={(pid, mid) =>
              props.overdueReasonById?.[`${pid}:${mid}`]
            }
            isNextUp={isNextUpMilestone}
            onStatusClick={handleStatusClick}
            onAddInstance={handleAddInstance}
            onRemoveInstance={handleRemoveInstance}
          />
        );
      })}

      <StatusPickerPopover
        anchorEl={picker?.anchor ?? null}
        transitions={transitions}
        currentStatus={currentMs?.status ?? "not_started"}
        optionalSkip={Boolean(currentMs?.optional)}
        onPick={handlePick}
        onClose={() => setPicker(null)}
      />

      <AdminModal
        open={pendingRevert !== null}
        onClose={() => setPendingRevert(null)}
        title="Revert completed milestone?"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPendingRevert(null)}
              className="px-4 py-2 rounded-lg text-sm text-[#6B5E52] hover:bg-[#F3EDE3] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRevert}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#9B3A2A] text-white hover:bg-[#7E2F22] transition-colors"
            >
              Revert
            </button>
          </div>
        }
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "#2C2520",
            lineHeight: 1.5,
          }}
        >
          {pendingRevert ? (
            <>
              Revert <strong>{pendingRevert.milestoneName}</strong> to{" "}
              {pendingRevert.target.replace(/_/g, " ")}? The completion record
              will be removed and any downstream work that depends on this
              milestone may need to be re-checked.
            </>
          ) : null}
        </p>
      </AdminModal>
    </>
  );
}

export default function WorkflowTracker(props: WorkflowTrackerProps) {
  return (
    <ToastContainer>
      <Inner {...props} />
    </ToastContainer>
  );
}

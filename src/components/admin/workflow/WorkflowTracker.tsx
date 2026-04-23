// Phase 44 Plan 07 Task 3 — WorkflowTracker (island root)
// Source of truth:
//   .planning/phases/44-workflow-engine/44-UI-SPEC.md § Surface 3
//   .planning/phases/44-workflow-engine/44-07-PLAN.md § Task 3
//
// Top-level React island that composes Header + Warnings + Metrics + PhaseAccordions.
// Orchestrates all API calls (milestone-status, instance CRUD, lifecycle actions).
// Optimistic-with-rollback pattern: snap → apply locally → POST → replace or rollback.
// Wraps inner component in <ToastContainer> per per-island provider pattern.

import { useState, useCallback } from "react";
import ToastContainer, { useToast } from "../ui/ToastContainer";
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
  transitionsById: Record<
    string,
    Array<{ status: MilestoneStatus; allowed: boolean; reason?: string }>
  >;
  // Key format: `${phaseId}:${milestoneId}` for milestone
  // `${phaseId}:${milestoneId}:${instanceKey}` for sub-row
  blockedById: Record<string, { blocked: boolean; reason?: string }>;
  gateSubMessageById?: Record<string, string>;
  overdueReasonById?: Record<string, string>;
}

interface PickerContext {
  anchor: HTMLElement;
  phaseId: string;
  milestoneId: string;
  instanceKey?: string;
}

// Derive a simple phase status from milestone statuses
function derivePhaseStatus(
  phase: PhaseInstance,
): "complete" | "in_progress" | "upcoming" {
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
  return "upcoming";
}

function Inner(props: WorkflowTrackerProps) {
  const [wf, setWf] = useState<ProjectWorkflow>(props.workflow);
  const [picker, setPicker] = useState<PickerContext | null>(null);
  const { show } = useToast();

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

  async function handlePick(target: MilestoneStatus) {
    if (!picker) return;
    const snap = wf;
    setPicker(null);
    try {
      const res = await fetch(
        `/api/admin/projects/${props.projectId}/workflow/milestone-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phaseId: picker.phaseId,
            milestoneId: picker.milestoneId,
            target,
            instanceKey: picker.instanceKey,
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

  // Resolve picker transitions and current milestone
  const transitionKey = picker
    ? `${picker.phaseId}:${picker.milestoneId}${picker.instanceKey ? ":" + picker.instanceKey : ""}`
    : "";
  const transitions = picker
    ? (props.transitionsById[transitionKey] ?? [])
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

      <WorkflowMetrics metrics={props.metrics} />

      {wf.phases.map((phase, idx) => {
        const phaseStatus = derivePhaseStatus(phase);
        const defaultOpen =
          phaseStatus === "in_progress" ||
          (idx === 0 && phaseStatus !== "complete");
        return (
          <PhaseAccordion
            key={phase._key}
            phase={phase}
            phaseStatus={phaseStatus}
            isParallel={phase.canOverlapWith.length > 0}
            defaultOpen={defaultOpen}
            isBlocked={(pid, mid) =>
              props.blockedById[`${pid}:${mid}`] ?? { blocked: false }
            }
            gateSubMessageFor={(pid, mid) =>
              props.gateSubMessageById?.[`${pid}:${mid}`]
            }
            overdueReasonFor={(pid, mid) =>
              props.overdueReasonById?.[`${pid}:${mid}`]
            }
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

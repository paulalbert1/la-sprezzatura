import { useState } from "react";
import { Send, RotateCcw, Check } from "lucide-react";
import ToastContainer, { useToast } from "./ui/ToastContainer";
import WorkOrderComposeModal from "./WorkOrderComposeModal";

// Phase 39 Plan 03 Task 2 — ContractorChipSendAction
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-03-PLAN.md § Task 2
//   .planning/phases/39-work-order-documents-panels/39-UI-SPEC.md § Surface 1
//   .planning/phases/39-work-order-documents-panels/39-CONTEXT.md D-03
//
// Hover-reveal send/resend action mounted inside each contractor chip on the
// project detail Contractors card. Two visual states:
//
//   1. Unsent  (latestWorkOrder is null or lastSentAt is null):
//      • Paper-plane icon (Send) revealed on chip hover / focus-within
//      • Click → opens WorkOrderComposeModal pre-bound to (project, contractor)
//
//   2. Sent    (latestWorkOrder.lastSentAt is set):
//      • "Sent {date}" link to /admin/projects/{projectId}/work-orders/{id}
//      • RotateCcw icon revealed on chip hover / focus-within
//      • Click on icon → reopens compose modal (Plan 04 may swap for a direct
//        resend endpoint; Plan 03 keeps both states opening the modal).
//
// Local ToastContainer provider wraps the island so the modal's useToast
// call resolves — React context does not cross Astro island boundaries.

export interface ContractorChipSendActionProps {
  projectId: string;
  project: {
    _id: string;
    title?: string;
    procurementItems?: Array<{
      _key: string;
      itemName: string;
      roomOrLocation?: string;
      orderStatus?: string;
    }>;
    projectAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
    } | null;
  };
  contractor: {
    _id: string;
    _key: string;
    name: string;
    email: string;
    trades?: string[];
  };
  latestWorkOrder: { _id: string; lastSentAt: string | null } | null;
  defaultFromDisplayName?: string;
}

function formatSentLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "today";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ContractorChipSendActionInner({
  projectId,
  project,
  contractor,
  latestWorkOrder,
  defaultFromDisplayName,
}: ContractorChipSendActionProps) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [optimisticLatest, setOptimisticLatest] = useState<{
    _id: string;
    lastSentAt: string;
  } | null>(null);

  const effectiveLatest =
    optimisticLatest ??
    (latestWorkOrder?.lastSentAt
      ? { _id: latestWorkOrder._id, lastSentAt: latestWorkOrder.lastSentAt }
      : null);
  const isSent = effectiveLatest !== null;

  // Phase 39 Plan 04 Task 4 — RotateCcw click in sent state fires direct
  // resend (no modal). Send (unsent) click still opens the compose modal.
  async function handleResend() {
    if (!effectiveLatest || isResending) return;
    setIsResending(true);
    try {
      const res = await fetch(
        `/api/admin/work-orders/${effectiveLatest._id}/send`,
        { method: "POST" },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Resend failed");
      }
      setOptimisticLatest({
        _id: effectiveLatest._id,
        lastSentAt: new Date().toISOString(),
      });
      show({
        variant: "success",
        title: `Work order resent to ${contractor.name}`,
        duration: 3000,
      });
    } catch (err) {
      show({
        variant: "error",
        title: (err as Error).message || "Resend failed",
        duration: 4000,
      });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 ml-1 group">
      {isSent && (
        <a
          href={`/admin/projects/${projectId}/work-orders/${effectiveLatest._id}`}
          onClick={(e) => {
            // UI-SPEC Surface 1: prevent ContactCardWrapper chip-level handler
            // from firing when the sent-link is activated.
            e.stopPropagation();
          }}
          data-testid={`chip-sent-link-${contractor._key}`}
          className="inline-flex items-center gap-0.5 text-[11.5px] text-[#9E8E80] hover:text-[#9A7B4B] hover:underline"
        >
          <Check size={9} className="inline mr-0.5" strokeWidth={1.5} />
          Sent {formatSentLabel(effectiveLatest.lastSentAt)}
        </a>
      )}
      <button
        type="button"
        // aria-label literals "Send work order to ..." / "Resend work order to ..."
        aria-label={isSent ? `Resend work order to ${contractor.name}` : `Send work order to ${contractor.name}`}
        title={isSent ? "Resend work order" : "Send work order"}
        disabled={isResending}
        data-testid={`chip-action-${contractor._key}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isSent) {
            void handleResend();
          } else {
            setOpen(true);
          }
        }}
        className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 focus:opacity-100 transition-opacity duration-150 text-[#9A7B4B] hover:bg-[#F5EDD8] rounded-[6px] p-1 disabled:opacity-50"
      >
        {isSent ? (
          <RotateCcw size={13} strokeWidth={1.3} />
        ) : (
          <Send size={13} strokeWidth={1.3} />
        )}
      </button>

      <WorkOrderComposeModal
        open={open}
        projectId={projectId}
        project={project}
        contractor={contractor}
        defaultFromDisplayName={defaultFromDisplayName}
        onClose={() => setOpen(false)}
        onSent={(result) => {
          setOptimisticLatest({
            _id: result.workOrderId,
            lastSentAt: new Date().toISOString(),
          });
        }}
      />
    </span>
  );
}

export default function ContractorChipSendAction(
  props: ContractorChipSendActionProps,
) {
  // React context does not cross Astro island boundaries — mount a local
  // ToastContainer provider so the embedded modal's useToast() resolves.
  // Matches ClientChipWithRegenerate.tsx (Phase 34 D-22).
  return (
    <ToastContainer>
      <ContractorChipSendActionInner {...props} />
    </ToastContainer>
  );
}

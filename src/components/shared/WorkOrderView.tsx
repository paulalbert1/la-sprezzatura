import { useState } from "react";

// Phase 39 Plan 04 Task 3 — Shared Work Order render component
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-04-PLAN.md § Task 3
//   .planning/phases/39-work-order-documents-panels/39-UI-SPEC.md § Surface 3
//
// Renders a persisted work order. Mode prop controls header affordances:
//   admin  → Edit / Delete / Send again buttons
//   portal → Read-only with "Back to all work orders" link
//
// React default escaping handles user strings (specialInstructions,
// customFields[].value, project.title); never use a raw-HTML React prop
// here (T-39-04-03).

export interface WorkOrderViewProps {
  workOrder: {
    _id: string;
    project: {
      _id: string;
      title: string;
      projectAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
      } | null;
      procurementItems?: Array<{
        _key: string;
        itemName: string;
        roomOrLocation?: string;
        quantity?: number;
        unit?: string;
      }>;
    };
    contractor: { _id: string; name: string; email: string };
    selectedItemKeys: string[];
    specialInstructions: string;
    customFields: Array<{ key: string; value: string; preset: boolean }>;
    lastSentAt: string | null;
  };
  mode: "admin" | "portal";
}

function formatSentLabel(iso: string | null): string {
  if (!iso) return "Not yet sent";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not yet sent";
  return `Sent ${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

export default function WorkOrderView({ workOrder, mode }: WorkOrderViewProps) {
  const canEdit = mode === "admin";
  const [isResending, setIsResending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve items from selectedItemKeys against project.procurementItems.
  // Missing keys render as muted "Item removed from project" rows.
  const items = workOrder.selectedItemKeys.map((key) => {
    const item = workOrder.project.procurementItems?.find(
      (p) => p._key === key,
    );
    if (item) {
      return { _key: key, itemName: item.itemName, roomOrLocation: item.roomOrLocation, quantity: item.quantity, unit: item.unit, present: true as const };
    }
    return { _key: key, itemName: "Item removed from project", present: false as const };
  });

  // Sort customFields: presets first (preserve order), ad-hoc after.
  const sortedFields = [
    ...workOrder.customFields.filter((f) => f.preset),
    ...workOrder.customFields.filter((f) => !f.preset),
  ];

  async function handleResend() {
    if (isResending) return;
    setIsResending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrder._id}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Resend failed");
      }
      // No toast here — page-level component. Reload to reflect lastSentAt.
      window.location.reload();
    } catch (err) {
      setError((err as Error).message || "Resend failed");
    } finally {
      setIsResending(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    if (!window.confirm(`Delete this work order? This cannot be undone.`)) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrder._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      window.location.href = `/admin/projects/${workOrder.project._id}`;
    } catch (err) {
      setError((err as Error).message || "Delete failed");
      setIsDeleting(false);
    }
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-8">
      {mode === "portal" && (
        <a
          href="/workorder/dashboard"
          className="inline-flex items-center gap-1 text-[11.5px] text-[#9E8E80] hover:text-[#9A7B4B] uppercase tracking-[0.14em] mb-6"
        >
          ← Back to all work orders
        </a>
      )}

      <header className="border-b-[0.5px] border-[#E8DDD0] pb-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#9E8E80] mb-1">
              Work Order
            </p>
            <h1 className="font-[Georgia,serif] text-[26px] font-semibold text-[#2C2520] mb-2 leading-tight">
              {workOrder.project.title}
            </h1>
            <p className="text-[12px] text-[#6B5E52]">
              For {workOrder.contractor.name} · {workOrder.contractor.email}
            </p>
            <p className="text-[11.5px] text-[#9E8E80] mt-1">
              {formatSentLabel(workOrder.lastSentAt)}
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                title="Edit flow lands in a future phase."
                className="text-[11.5px] uppercase tracking-[0.14em] text-[#9E8E80] cursor-not-allowed px-3 py-1.5 border-[0.5px] border-[#E8DDD0] rounded-[4px] opacity-60"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-[11.5px] uppercase tracking-[0.14em] text-[#9A7B4B] hover:bg-[#F5EDD8] px-3 py-1.5 border-[0.5px] border-[#E8D5A8] rounded-[4px] disabled:opacity-50"
              >
                {isResending ? "Sending…" : "Send again"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-[11.5px] uppercase tracking-[0.14em] text-[#9B3A2A] hover:bg-[#FBE9E5] px-3 py-1.5 border-[0.5px] border-[#E5BFB6] rounded-[4px] disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>
        {error && (
          <div
            role="alert"
            className="mt-3 bg-[#FBE9E5] border border-[#E5BFB6] text-[#9B3A2A] text-[11.5px] rounded-[6px] px-3 py-2"
          >
            {error}
          </div>
        )}
      </header>

      {/* ITEMS */}
      <section className="mb-8">
        <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#9E8E80] mb-3">
          Items
        </h2>
        {items.length === 0 ? (
          <p className="text-[12px] text-[#9E8E80]">No items selected.</p>
        ) : (
          <ul className="bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-[6px] divide-y divide-[#E8DDD0]">
            {items.map((item) => (
              <li
                key={item._key}
                className={
                  item.present
                    ? "px-4 py-3 text-[13px] text-[#2C2520]"
                    : "px-4 py-3 text-[13px] text-[#9E8E80] italic"
                }
              >
                <div>{item.itemName}</div>
                {item.present && item.roomOrLocation && (
                  <div className="text-[11.5px] text-[#9E8E80] mt-0.5">
                    {item.roomOrLocation}
                    {item.quantity && (
                      <>
                        {" · "}
                        {item.quantity}
                        {item.unit ? ` ${item.unit}` : ""}
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* FIELDS */}
      {sortedFields.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#9E8E80] mb-3">
            Fields
          </h2>
          <dl className="bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-[6px] divide-y divide-[#E8DDD0]">
            {sortedFields.map((field, idx) => (
              <div
                key={`${field.key}-${idx}`}
                className="px-4 py-3 grid grid-cols-[160px_1fr] gap-3"
              >
                <dt className="text-[11.5px] uppercase tracking-[0.04em] text-[#9E8E80]">
                  {field.key}
                </dt>
                <dd className="text-[13px] text-[#2C2520]">{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* SPECIAL INSTRUCTIONS */}
      <section className="mb-8">
        <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#9E8E80] mb-3">
          Special Instructions
        </h2>
        <p className="bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-[6px] px-4 py-3 text-[13px] text-[#2C2520] whitespace-pre-wrap">
          {workOrder.specialInstructions}
        </p>
      </section>
    </article>
  );
}

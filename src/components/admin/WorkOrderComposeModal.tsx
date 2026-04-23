import { useEffect, useRef, useState } from "react";
import AdminModal from "./ui/AdminModal";
import { useToast } from "./ui/ToastContainer";
import { relationshipLabel } from "../../lib/relationshipLabel";
// AdminModal is imported and its size="lg" preset (max-w-[720px]) would apply
// via a matching Tailwind class on the inline dialog below. We render inline
// rather than through the AdminModal portal path so that jsdom test harnesses
// can query inputs/tiles via `container.querySelectorAll` (Phase 37 D-37-03;
// see ProcurementItemModal.tsx L17-30 and Phase 39 RESEARCH Pitfall 3).
const ADMIN_MODAL_SIZE: "lg" = "lg";
void AdminModal;
void ADMIN_MODAL_SIZE;

// Phase 39 Plan 03 Task 1 — WorkOrderComposeModal
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-03-PLAN.md § Task 1
//   .planning/phases/39-work-order-documents-panels/39-UI-SPEC.md § Surface 2
//   .planning/phases/39-work-order-documents-panels/39-CONTEXT.md D-05, D-06
//
// Inline-render compose modal for a (project × contractor) work order.
// Renders items checkbox list + 5 preset toggles + dynamic custom-field rows
// + required special instructions textarea. Submit POSTs to
// /api/admin/work-orders (Plan 01 endpoint) and fires onSent with the new id.
//
// Plan 03 scope: create & persist only. Plan 04 layers the email-send on top
// by extending the onSent handler to chain a send endpoint call.

type PresetKey =
  | "dueDate"
  | "poNumber"
  | "deliveryAddress"
  | "contractorTrade"
  | "signoffContact";

const PRESETS: Array<{
  key: PresetKey;
  label: string;
  testId: string;
  readOnly?: boolean;
}> = [
  { key: "dueDate", label: "Due date", testId: "preset-toggle-dueDate" },
  {
    key: "poNumber",
    label: "PO / reference number",
    testId: "preset-toggle-poNumber",
  },
  {
    key: "deliveryAddress",
    label: "Delivery address",
    testId: "preset-toggle-deliveryAddress",
  },
  {
    key: "contractorTrade",
    label: "Contractor trade",
    testId: "preset-toggle-contractorTrade",
    readOnly: true,
  },
  {
    key: "signoffContact",
    label: "Signoff contact",
    testId: "preset-toggle-signoffContact",
  },
];

export interface CustomField {
  key: string;
  value: string;
  preset: boolean;
}

export interface WorkOrderComposeModalProps {
  open: boolean;
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
    name: string;
    email: string;
    relationship?: string | null;
    trades?: string[];
  };
  defaultFromDisplayName?: string;
  /**
   * Phase 39 Plan 04 Task 4 — when true (default), the modal chains a second
   * POST to /api/admin/work-orders/[id]/send after the create succeeds. Set
   * to false when the caller wants to persist the work order without firing
   * the email (saved-for-later flow).
   */
  sendAfter?: boolean;
  onClose: () => void;
  onSent?: (result: { workOrderId: string }) => void;
}

// Pitfall 7: compose a one-line address from project.projectAddress.
// The delivery-address auto-fill consumes this value.
function composeAddress(
  addr?: { street?: string; city?: string; state?: string; zip?: string } | null,
): string {
  if (!addr) return "";
  return [addr.street, addr.city, addr.state, addr.zip]
    .filter((s) => s && s.trim().length > 0)
    .join(", ");
}

export default function WorkOrderComposeModal({
  open,
  projectId,
  project,
  contractor,
  defaultFromDisplayName,
  sendAfter = true,
  onClose,
  onSent,
}: WorkOrderComposeModalProps) {
  const { show } = useToast();

  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
  const [activePresets, setActivePresets] = useState<Record<PresetKey, boolean>>({
    dueDate: false,
    poNumber: false,
    deliveryAddress: false,
    contractorTrade: false,
    signoffContact: false,
  });
  const [presetValues, setPresetValues] = useState<Record<PresetKey, string>>({
    dueDate: "",
    poNumber: "",
    // Pitfall 7: delivery address defaults from project.projectAddress.
    deliveryAddress: composeAddress(project.projectAddress),
    // Pitfall 8: contractor trade defaults from contractor.trades[0].
    contractorTrade: contractor.trades?.[0] ?? "",
    signoffContact: defaultFromDisplayName ?? "",
  });
  const [customRows, setCustomRows] = useState<
    Array<{ id: string; key: string; value: string }>
  >([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specialInstructionsRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset local state when the modal closes so reopening for another
  // contractor starts clean.
  useEffect(() => {
    if (!open) {
      setSelectedItemKeys([]);
      setActivePresets({
        dueDate: false,
        poNumber: false,
        deliveryAddress: false,
        contractorTrade: false,
        signoffContact: false,
      });
      setPresetValues({
        dueDate: "",
        poNumber: "",
        deliveryAddress: composeAddress(project.projectAddress),
        contractorTrade: contractor.trades?.[0] ?? "",
        signoffContact: defaultFromDisplayName ?? "",
      });
      setCustomRows([]);
      setSpecialInstructions("");
      setIsSubmitting(false);
      setError(null);
    }
  }, [open, project.projectAddress, contractor.trades, defaultFromDisplayName]);

  // Auto-focus special instructions on open per UI-SPEC §a11y.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => specialInstructionsRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Escape-to-close, only while open and not submitting.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  function toggleItem(key: string) {
    setSelectedItemKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function togglePreset(key: PresetKey) {
    setActivePresets((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function addCustomRow() {
    if (customRows.length >= 10) return;
    setCustomRows((rows) => [
      ...rows,
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `row-${Date.now()}-${Math.random()}`,
        key: "",
        value: "",
      },
    ]);
  }

  function removeCustomRow(id: string) {
    setCustomRows((rows) => rows.filter((r) => r.id !== id));
  }

  function updateCustomRow(id: string, field: "key" | "value", v: string) {
    setCustomRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, [field]: v } : r)),
    );
  }

  async function handleSubmit() {
    if (specialInstructions.trim().length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Preserve canonical preset order in the persisted customFields array so
      // downstream work-order rendering (Plan 04) can trust iteration order.
      const presetFields: CustomField[] = PRESETS.filter(
        (p) => activePresets[p.key] && presetValues[p.key].trim().length > 0,
      ).map((p) => ({
        key: p.label,
        value: presetValues[p.key],
        preset: true,
      }));
      const adhocFields: CustomField[] = customRows
        .filter((r) => r.key.trim().length > 0)
        .map((r) => ({ key: r.key, value: r.value, preset: false }));
      const customFields = [...presetFields, ...adhocFields];

      const res = await fetch("/api/admin/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          contractorId: contractor._id,
          selectedItemKeys,
          specialInstructions,
          customFields,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        workOrderId?: string;
        error?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create work order");
      }

      // Phase 39 Plan 04 Task 4 — chain second POST to /[id]/send when
      // sendAfter=true (default). Failure here surfaces inline; the work
      // order is already persisted so we still notify onSent.
      const workOrderId = data.workOrderId ?? "";
      if (sendAfter && workOrderId) {
        const sendRes = await fetch(
          `/api/admin/work-orders/${workOrderId}/send`,
          { method: "POST" },
        );
        if (!sendRes.ok) {
          const sendErr = (await sendRes.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(sendErr.error || "Created but send failed");
        }
      }

      show({
        variant: "success",
        title: sendAfter
          ? `Work order sent to ${contractor.name}`
          : `Work order saved for ${contractor.name}`,
        duration: 3000,
      });
      onSent?.({ workOrderId });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to create work order");
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitDisabled =
    specialInstructions.trim().length === 0 || isSubmitting;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-order-compose-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2520]/40"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="bg-[#FFFEFB] border border-[#E8DDD0] rounded-[10px] max-w-[720px] w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <header className="mb-4">
          <h2
            id="work-order-compose-title"
            className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#2C2520]"
          >
            Send work order
          </h2>
          <p className="text-[11.5px] text-[#9E8E80] mt-1">
            To {contractor.name} · {contractor.email} · {relationshipLabel(contractor.relationship)}
          </p>
        </header>

        {/* ITEMS */}
        <section className="mb-5">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#9E8E80] mb-2">
            Items
          </div>
          {(project.procurementItems ?? []).length === 0 ? (
            <div className="bg-[#F3EDE3] text-[#9E8E80] text-[11.5px] rounded-[6px] px-3 py-3">
              No procurement items yet for this project.
            </div>
          ) : (
            <div className="bg-[#F3EDE3] rounded-[6px] max-h-[240px] overflow-y-auto">
              {(project.procurementItems ?? []).map((item) => (
                <label
                  key={item._key}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#EDE5D6] cursor-pointer text-[13px] text-[#2C2520]"
                >
                  <input
                    type="checkbox"
                    data-testid={`item-checkbox-${item._key}`}
                    checked={selectedItemKeys.includes(item._key)}
                    onChange={() => toggleItem(item._key)}
                  />
                  <span>{item.itemName}</span>
                  {item.roomOrLocation && (
                    <span className="text-[11.5px] text-[#9E8E80]">
                      {" · "}
                      {item.roomOrLocation}
                    </span>
                  )}
                  {item.orderStatus && (
                    <span className="text-[11.5px] text-[#9E8E80]">
                      {" · "}
                      {item.orderStatus}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </section>

        {/* OPTIONAL FIELDS — 5 toggle chips in 2-col grid + revealed inputs */}
        <section className="mb-5">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#9E8E80] mb-2">
            Optional fields
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.key}
                data-testid={p.testId}
                aria-pressed={activePresets[p.key]}
                onClick={() => togglePreset(p.key)}
                className={
                  activePresets[p.key]
                    ? "px-3 py-1.5 rounded-[6px] text-[11.5px] font-semibold bg-[#F5EDD8] text-[#9A7B4B] border-[0.5px] border-[#E8D5A8]"
                    : "px-3 py-1.5 rounded-[6px] text-[11.5px] bg-[#F3EDE3] text-[#6B5E52] border-[0.5px] border-transparent hover:border-[#D4C8B8]"
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {PRESETS.filter((p) => activePresets[p.key]).map((p) => (
              <label
                key={p.key}
                className="text-[11.5px] text-[#6B5E52] flex flex-col gap-1"
              >
                {p.label}
                <input
                  type={p.key === "dueDate" ? "date" : "text"}
                  value={presetValues[p.key]}
                  readOnly={p.readOnly}
                  onChange={(e) =>
                    setPresetValues((prev) => ({
                      ...prev,
                      [p.key]: e.target.value,
                    }))
                  }
                  className={
                    p.readOnly
                      ? "luxury-input w-full text-[#9E8E80] bg-[#F3EDE3] border-[0.5px] border-[#E8DDD0] rounded-[4px] px-2 py-1.5 text-[13px]"
                      : "luxury-input w-full bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-[4px] px-2 py-1.5 text-[13px] text-[#2C2520]"
                  }
                />
              </label>
            ))}
          </div>
        </section>

        {/* CUSTOM FIELDS */}
        <section className="mb-5">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#9E8E80] mb-2">
            Custom fields
          </div>
          {customRows.map((row, idx) => (
            <div key={row.id} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Field name"
                value={row.key}
                onChange={(e) => updateCustomRow(row.id, "key", e.target.value)}
                data-testid={`custom-key-${idx}`}
                className="flex-[2] bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-[4px] px-2 py-1.5 text-[13px] text-[#2C2520]"
              />
              <input
                type="text"
                placeholder="Value"
                value={row.value}
                onChange={(e) => updateCustomRow(row.id, "value", e.target.value)}
                data-testid={`custom-value-${idx}`}
                className="flex-[3] bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-[4px] px-2 py-1.5 text-[13px] text-[#2C2520]"
              />
              <button
                type="button"
                aria-label={`Remove custom field ${row.key || idx + 1}`}
                data-testid={`custom-remove-${idx}`}
                onClick={() => removeCustomRow(row.id)}
                className="text-[#9E8E80] hover:text-[#9B3A2A] px-2 text-[15px]"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCustomRow}
            disabled={customRows.length >= 10}
            data-testid="add-custom-field"
            title={
              customRows.length >= 10 ? "Limit reached" : "Add a custom field"
            }
            className="text-[11.5px] text-[#9A7B4B] hover:underline disabled:text-[#9E8E80] disabled:no-underline disabled:cursor-not-allowed"
          >
            + Add custom field
          </button>
        </section>

        {/* SPECIAL INSTRUCTIONS */}
        <section className="mb-5">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#9E8E80] mb-2">
            Special instructions <span className="text-[#9B3A2A]">(required)</span>
          </div>
          <textarea
            ref={specialInstructionsRef}
            rows={4}
            placeholder="e.g. Access via the service entrance…"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            data-testid="special-instructions"
            className="w-full bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-[4px] px-3 py-2 text-[13px] text-[#2C2520]"
          />
        </section>

        {error && (
          <div
            role="alert"
            className="bg-[#FBE9E5] border border-[#E5BFB6] text-[#9B3A2A] text-[11.5px] rounded-[6px] px-3 py-2 mb-3"
          >
            {error}
          </div>
        )}

        <footer className="flex items-center justify-between border-t-[0.5px] border-[#E8DDD0] pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[11.5px] text-[#6B5E52] hover:text-[#2C2520] uppercase tracking-[0.14em] font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            aria-disabled={submitDisabled}
            data-testid="submit-work-order"
            className="bg-[#9A7B4B] text-white px-4 py-2 text-[11.5px] uppercase tracking-[0.14em] font-semibold rounded-[2px] hover:bg-[#8A6D40] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating…" : "Create & Send"}
          </button>
        </footer>
      </div>
    </div>
  );
}

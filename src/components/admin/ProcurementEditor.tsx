import { useState, useEffect, useRef, useCallback } from "react";
import { PROCUREMENT_STAGES } from "../../lib/procurementStages";
import { isOverdue } from "../../lib/isOverdue";
import { getCarrierFromUrl } from "../../lib/carrierFromUrl";
import { getTrackingInfo } from "../../lib/trackingUrl";
import { formatCurrency } from "../../lib/formatCurrency";
import { format } from "date-fns";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  MoreVertical,
  Upload,
  FileText,
  ExternalLink,
  Package,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProcurementItem {
  _key: string;
  name: string;
  manufacturer?: string;
  status: string;
  quantity?: number;
  retailPrice?: number;
  clientCost?: number;
  orderDate?: string;
  expectedDeliveryDate?: string;
  installDate?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  files?: Array<{ _key: string; label: string; file: string }>;
  notes?: string;
}

interface Props {
  items: ProcurementItem[];
  projectId: string;
  projectTitle: string;
}

// ---------------------------------------------------------------------------
// Constants (matching portal ProcurementTable.astro -- D-02)
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  "not-yet-ordered": "bg-stone-light/20 text-stone",
  ordered: "bg-amber-50 text-amber-700",
  "in-transit": "bg-terracotta/10 text-terracotta",
  warehouse: "bg-blue-50 text-blue-700",
  delivered: "bg-emerald-50 text-emerald-700",
  installed: "bg-emerald-100 text-emerald-800",
};

const STATUS_PRIORITY: Record<string, number> = {
  "not-yet-ordered": 0,
  ordered: 1,
  "in-transit": 2,
  warehouse: 3,
  delivered: 4,
  installed: 5,
};

const CARRIER_COLORS: Record<string, string> = {
  fedex: "text-terracotta",
  ups: "text-amber-700",
  usps: "text-blue-700",
  dhl: "text-red-600",
  unknown: "text-stone",
};

const inputClasses =
  "w-full px-4 py-3 bg-cream-dark border border-stone-light/30 rounded-lg text-sm font-body text-charcoal focus:border-terracotta focus:outline-none transition-colors";
const selectClasses = inputClasses + " appearance-none";
const labelClasses =
  "text-xs uppercase tracking-widest text-stone font-body mb-2 block";

// Derive labels from PROCUREMENT_STAGES (single source of truth)
const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  PROCUREMENT_STAGES.map((s) => [s.value, s.title]),
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProcurementEditor({
  items: initialItems,
  projectId,
  projectTitle,
}: Props) {
  // State
  const [items, setItems] = useState<ProcurementItem[]>(initialItems);
  const [statusDropdownKey, setStatusDropdownKey] = useState<string | null>(
    null,
  );
  const [overflowMenuKey, setOverflowMenuKey] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcurementItem | null>(null);
  const [confirmRemoveItem, setConfirmRemoveItem] =
    useState<ProcurementItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Sort items by status pipeline order (ascending)
  const sortedItems = [...items].sort(
    (a, b) =>
      (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99),
  );

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Close dropdowns/menus on document click
  useEffect(() => {
    function handleClick() {
      setStatusDropdownKey(null);
      setOverflowMenuKey(null);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Escape key handler: panel > dialog > dropdown priority
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (panelOpen) {
        closePanel();
      } else if (confirmRemoveItem) {
        setConfirmRemoveItem(null);
      } else if (statusDropdownKey || overflowMenuKey) {
        setStatusDropdownKey(null);
        setOverflowMenuKey(null);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [panelOpen, confirmRemoveItem, statusDropdownKey, overflowMenuKey]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  // 1. Status change (D-01/D-03) -- optimistic update
  const handleStatusChange = useCallback(
    async (itemKey: string, newStatus: string) => {
      const prevItems = [...items];
      setItems((prev) =>
        prev.map((it) =>
          it._key === itemKey ? { ...it, status: newStatus } : it,
        ),
      );
      setStatusDropdownKey(null);

      try {
        const res = await fetch("/api/admin/update-procurement-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, itemKey, status: newStatus }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setItems(prevItems);
        setMessage({
          type: "error",
          text: "Status update failed. Please try again.",
        });
      }
    },
    [items, projectId],
  );

  // 2. Open add panel (D-07)
  function openAddPanel() {
    setEditingItem(null);
    setFormData({ status: "not-yet-ordered" });
    setPanelOpen(true);
  }

  // 3. Open edit panel (D-07)
  function openEditPanel(item: ProcurementItem) {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      manufacturer: item.manufacturer || "",
      status: item.status || "not-yet-ordered",
      quantity: item.quantity || "",
      retailPrice: item.retailPrice ? item.retailPrice / 100 : "",
      clientCost: item.clientCost ? item.clientCost / 100 : "",
      orderDate: item.orderDate || "",
      expectedDeliveryDate: item.expectedDeliveryDate || "",
      installDate: item.installDate || "",
      trackingNumber: item.trackingNumber || "",
      trackingUrl: item.trackingUrl || "",
      files: item.files ? [...item.files] : [],
      notes: item.notes || "",
    });
    setPanelOpen(true);
    setOverflowMenuKey(null);
  }

  // 4. Close panel
  function closePanel() {
    setPanelOpen(false);
    setEditingItem(null);
    setFormData({});
  }

  // 5. Save item (D-08/D-10) -- add or edit
  async function handleSaveItem() {
    setSaving(true);
    setMessage(null);

    const toCents = (value: any): number | null => {
      if (value === "" || value === undefined || value === null) return null;
      const parsed = parseFloat(String(value));
      if (isNaN(parsed)) return null;
      return Math.round(parsed * 100);
    };

    const fields: Record<string, any> = {
      name: formData.name || "",
      manufacturer: formData.manufacturer || "",
      status: formData.status || "not-yet-ordered",
      quantity: formData.quantity ? Number(formData.quantity) : null,
      retailPrice: toCents(formData.retailPrice),
      clientCost: toCents(formData.clientCost),
      orderDate: formData.orderDate || null,
      expectedDeliveryDate: formData.expectedDeliveryDate || null,
      installDate: formData.installDate || null,
      trackingNumber: formData.trackingNumber || "",
      trackingUrl: formData.trackingUrl || "",
      notes: formData.notes || "",
    };

    try {
      const body: Record<string, any> = { projectId, fields };
      if (editingItem) {
        body.action = "edit";
        body.itemKey = editingItem._key;
      } else {
        body.action = "add";
      }

      const res = await fetch("/api/admin/update-procurement-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      const result = await res.json();

      if (editingItem) {
        setItems((prev) =>
          prev.map((it) =>
            it._key === editingItem._key
              ? { ...it, ...fields, files: formData.files || it.files }
              : it,
          ),
        );
        setMessage({ type: "success", text: "Changes saved" });
      } else {
        const newItem: ProcurementItem = {
          _key: result.item?._key || result._key || Date.now().toString(),
          ...fields,
          files: [],
        };
        setItems((prev) => [...prev, newItem]);
        setMessage({ type: "success", text: "Item added" });
      }
      closePanel();
    } catch {
      setMessage({
        type: "error",
        text: "Unable to save. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  // 6. Remove item (D-09)
  async function handleRemoveItem(item: ProcurementItem) {
    try {
      const res = await fetch("/api/admin/update-procurement-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          action: "remove",
          itemKey: item._key,
        }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((it) => it._key !== item._key));
      setMessage({ type: "success", text: "Item removed" });
    } catch {
      setMessage({
        type: "error",
        text: "Unable to save. Please try again.",
      });
    }
    setConfirmRemoveItem(null);
  }

  // 7. File upload (D-11/D-12)
  async function handleFileUpload(files: FileList) {
    if (!editingItem) return;
    setUploadingFile(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", projectId);
      fd.append("itemKey", editingItem._key);

      try {
        const res = await fetch("/api/admin/upload-procurement-file", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error();
        const result = await res.json();
        setFormData((prev) => ({
          ...prev,
          files: [
            ...(prev.files || []),
            { _key: result.fileKey, label: "", file: result.url },
          ],
        }));
      } catch {
        setMessage({
          type: "error",
          text: "File upload failed. Please try again.",
        });
      }
    }
    setUploadingFile(false);
  }

  // 8. File delete (D-13)
  async function handleFileDelete(fileKey: string, blobUrl: string) {
    if (!editingItem) return;
    try {
      const res = await fetch("/api/admin/upload-procurement-file", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          itemKey: editingItem._key,
          fileKey,
          blobUrl,
        }),
      });
      if (!res.ok) throw new Error();
      setFormData((prev) => ({
        ...prev,
        files: (prev.files || []).filter(
          (f: { _key: string }) => f._key !== fileKey,
        ),
      }));
    } catch {
      setMessage({
        type: "error",
        text: "File upload failed. Please try again.",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function updateFormField(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function renderCarrierCell(item: ProcurementItem) {
    // Priority 1: trackingUrl set
    if (item.trackingUrl) {
      const carrier = getCarrierFromUrl(item.trackingUrl);
      if (carrier) {
        const colorClass = CARRIER_COLORS[carrier.carrier] || "text-stone";
        const IconComponent =
          carrier.carrier === "unknown" ? ExternalLink : Package;
        return (
          <a
            href={item.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={carrier.label}
          >
            <IconComponent size={16} className={colorClass} />
          </a>
        );
      }
    }

    // Priority 2: no trackingUrl but trackingNumber
    if (!item.trackingUrl && item.trackingNumber) {
      const info = getTrackingInfo(item.trackingNumber);
      if (info.url) {
        const colorClass = CARRIER_COLORS[info.carrier] || "text-stone";
        return (
          <a
            href={info.url}
            target="_blank"
            rel="noopener noreferrer"
            title={info.carrier.toUpperCase()}
          >
            <Package size={16} className={colorClass} />
          </a>
        );
      }
      // Priority 3: trackingNumber only, no URL generated
      return (
        <span className="text-xs text-stone font-mono">
          {item.trackingNumber.slice(0, 12)}
          {item.trackingNumber.length > 12 ? "\u2026" : ""}
        </span>
      );
    }

    // Priority 4: neither
    return <span className="text-stone-light">{"\u2014"}</span>;
  }

  function formatDeliveryDate(date: string | undefined) {
    if (!date) return "\u2014";
    try {
      return format(new Date(date + "T00:00:00"), "MMM d");
    } catch {
      return "\u2014";
    }
  }

  // ---------------------------------------------------------------------------
  // Drop zone handlers
  // ---------------------------------------------------------------------------

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    dropZoneRef.current?.classList.add(
      "border-terracotta",
      "bg-terracotta/5",
    );
    dropZoneRef.current?.classList.remove("border-stone-light/30");
  }

  function handleDragLeave() {
    dropZoneRef.current?.classList.remove(
      "border-terracotta",
      "bg-terracotta/5",
    );
    dropZoneRef.current?.classList.add("border-stone-light/30");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleDragLeave();
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }

  function handleDropZoneClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".pdf,.jpg,.jpeg,.png,.webp";
    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        handleFileUpload(input.files);
      }
    };
    input.click();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Message bar (top of table area, only when panel is closed) */}
      {!panelOpen && message && (
        <p
          className={
            message.type === "success"
              ? "text-sm text-emerald-700 font-body mb-4"
              : "text-sm text-red-600 font-body mb-4"
          }
        >
          {message.text}
        </p>
      )}

      {/* Header with Add Item button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-normal text-charcoal">
          Procurement
        </h2>
        <button
          type="button"
          onClick={openAddPanel}
          className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 rounded-lg hover:bg-terracotta-light transition-colors inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Table or empty state */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm font-semibold font-body text-charcoal">
            No procurement items yet
          </p>
          <p className="text-sm text-stone font-body mt-2">
            Add your first item to start tracking procurement for this project.
          </p>
          <button
            type="button"
            onClick={openAddPanel}
            className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 rounded-lg hover:bg-terracotta-light transition-colors inline-flex items-center gap-2 mt-6"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      ) : (
        <div className="w-full">
          {/* Table header */}
          <div className="flex items-center border-b-2 border-stone-light/30 pb-3">
            <div className="flex-1 text-left text-xs uppercase tracking-widest text-stone font-normal font-body">
              Item
            </div>
            <div className="w-[140px] text-center text-xs uppercase tracking-widest text-stone font-normal font-body">
              Status
            </div>
            <div className="w-[120px] text-right text-xs uppercase tracking-widest text-stone font-normal font-body">
              Delivery
            </div>
            <div className="w-20 text-center text-xs uppercase tracking-widest text-stone font-normal font-body">
              Carrier
            </div>
            <div className="w-12 text-center text-xs uppercase tracking-widest text-stone font-normal font-body">
              {/* Actions header -- no label */}
            </div>
          </div>

          {/* Table rows */}
          {sortedItems.map((item, index) => (
            <div
              key={item._key}
              className={`flex items-center py-3 border-b border-stone-light/10 ${index % 2 === 1 ? "bg-cream-dark/50" : ""}`}
            >
              {/* Item name + manufacturer */}
              <div className="flex-1 pr-3">
                <span className="font-semibold text-sm text-charcoal font-body">
                  {item.name}
                </span>
                {(item.manufacturer || item.quantity) && (
                  <span className="block text-xs text-stone mt-0.5 font-body">
                    {item.manufacturer || ""}
                    {item.manufacturer && item.quantity
                      ? ` \u00B7 Qty ${item.quantity}`
                      : item.quantity
                        ? `Qty ${item.quantity}`
                        : ""}
                  </span>
                )}
              </div>

              {/* Status badge with dropdown (D-01) */}
              <div
                className="w-[140px] text-center relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusDropdownKey(
                      statusDropdownKey === item._key ? null : item._key,
                    );
                    setOverflowMenuKey(null);
                  }}
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs tracking-wide whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity font-body ${STATUS_STYLES[item.status] || "bg-stone-light/20 text-stone"}`}
                >
                  {STATUS_LABELS[item.status] || item.status}
                </button>

                {/* Status dropdown */}
                {statusDropdownKey === item._key && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border border-stone-light/30 z-30 py-1 min-w-[180px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {PROCUREMENT_STAGES.map((stage) => (
                      <button
                        key={stage.value}
                        type="button"
                        onClick={() =>
                          handleStatusChange(item._key, stage.value)
                        }
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-body cursor-pointer hover:bg-cream-dark transition-colors text-left ${item.status === stage.value ? "bg-cream-dark font-semibold" : ""}`}
                      >
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs tracking-wide whitespace-nowrap ${STATUS_STYLES[stage.value] || ""}`}
                        >
                          {stage.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Expected delivery date (D-05) */}
              <div className="w-[120px] text-right text-sm font-body">
                <span
                  className={
                    isOverdue(item.expectedDeliveryDate, item.status)
                      ? "text-red-600"
                      : "text-charcoal"
                  }
                >
                  {formatDeliveryDate(item.expectedDeliveryDate)}
                </span>
              </div>

              {/* Carrier (D-06) */}
              <div className="w-20 text-center flex items-center justify-center">
                {renderCarrierCell(item)}
              </div>

              {/* Actions overflow menu */}
              <div
                className="w-12 text-center relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Item actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOverflowMenuKey(
                      overflowMenuKey === item._key ? null : item._key,
                    );
                    setStatusDropdownKey(null);
                  }}
                  className="text-stone hover:text-charcoal cursor-pointer transition-colors"
                >
                  <MoreVertical size={16} />
                </button>

                {/* Overflow menu */}
                {overflowMenuKey === item._key && (
                  <div
                    className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-stone-light/30 py-1 z-30 min-w-[140px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openEditPanel(item)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-charcoal hover:bg-cream-dark cursor-pointer transition-colors font-body"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmRemoveItem(item);
                        setOverflowMenuKey(null);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors font-body"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Slide-out panel (D-07 / D-08) */}
      {/* ------------------------------------------------------------------- */}

      {/* Backdrop */}
      {panelOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={closePanel}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-cream border-l border-stone-light/30 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${panelOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-light/30">
          <h3 className="text-lg font-semibold font-body text-charcoal">
            {editingItem
              ? `Edit ${editingItem.name}`
              : "Add Procurement Item"}
          </h3>
          <button
            type="button"
            onClick={closePanel}
            className="text-stone hover:text-charcoal transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            {/* Message inside panel */}
            {panelOpen && message && (
              <p
                className={
                  message.type === "success"
                    ? "text-sm text-emerald-700 font-body"
                    : "text-sm text-red-600 font-body"
                }
              >
                {message.text}
              </p>
            )}

            {/* Name (required) */}
            <div>
              <label htmlFor="proc-name" className={labelClasses}>
                Name
              </label>
              <input
                id="proc-name"
                type="text"
                value={formData.name || ""}
                onChange={(e) => updateFormField("name", e.target.value)}
                aria-required="true"
                className={inputClasses}
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label htmlFor="proc-manufacturer" className={labelClasses}>
                Manufacturer
              </label>
              <input
                id="proc-manufacturer"
                type="text"
                value={formData.manufacturer || ""}
                onChange={(e) =>
                  updateFormField("manufacturer", e.target.value)
                }
                className={inputClasses}
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="proc-status" className={labelClasses}>
                Status
              </label>
              <select
                id="proc-status"
                value={formData.status || "not-yet-ordered"}
                onChange={(e) => updateFormField("status", e.target.value)}
                className={selectClasses}
              >
                {PROCUREMENT_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="proc-quantity" className={labelClasses}>
                Quantity
              </label>
              <input
                id="proc-quantity"
                type="number"
                min="1"
                step="1"
                value={formData.quantity ?? ""}
                onChange={(e) => updateFormField("quantity", e.target.value)}
                className={inputClasses}
              />
            </div>

            {/* Retail Price */}
            <div>
              <label htmlFor="proc-retail-price" className={labelClasses}>
                Retail Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone font-body">
                  $
                </span>
                <input
                  id="proc-retail-price"
                  type="number"
                  step="0.01"
                  value={formData.retailPrice ?? ""}
                  onChange={(e) =>
                    updateFormField("retailPrice", e.target.value)
                  }
                  className={inputClasses + " pl-8"}
                />
              </div>
            </div>

            {/* Client Cost */}
            <div>
              <label htmlFor="proc-client-cost" className={labelClasses}>
                Client Cost
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone font-body">
                  $
                </span>
                <input
                  id="proc-client-cost"
                  type="number"
                  step="0.01"
                  value={formData.clientCost ?? ""}
                  onChange={(e) =>
                    updateFormField("clientCost", e.target.value)
                  }
                  className={inputClasses + " pl-8"}
                />
              </div>
            </div>

            {/* Order Date */}
            <div>
              <label htmlFor="proc-order-date" className={labelClasses}>
                Order Date
              </label>
              <input
                id="proc-order-date"
                type="date"
                value={formData.orderDate || ""}
                onChange={(e) => updateFormField("orderDate", e.target.value)}
                className={inputClasses}
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label
                htmlFor="proc-expected-delivery"
                className={labelClasses}
              >
                Expected Delivery Date
              </label>
              <input
                id="proc-expected-delivery"
                type="date"
                value={formData.expectedDeliveryDate || ""}
                onChange={(e) =>
                  updateFormField("expectedDeliveryDate", e.target.value)
                }
                className={inputClasses}
              />
            </div>

            {/* Install Date */}
            <div>
              <label htmlFor="proc-install-date" className={labelClasses}>
                Install Date
              </label>
              <input
                id="proc-install-date"
                type="date"
                value={formData.installDate || ""}
                onChange={(e) =>
                  updateFormField("installDate", e.target.value)
                }
                className={inputClasses}
              />
            </div>

            {/* Tracking Number */}
            <div>
              <label htmlFor="proc-tracking-number" className={labelClasses}>
                Tracking Number
              </label>
              <input
                id="proc-tracking-number"
                type="text"
                value={formData.trackingNumber || ""}
                onChange={(e) =>
                  updateFormField("trackingNumber", e.target.value)
                }
                className={inputClasses + " font-mono"}
              />
            </div>

            {/* Tracking URL */}
            <div>
              <label htmlFor="proc-tracking-url" className={labelClasses}>
                Tracking URL
              </label>
              <input
                id="proc-tracking-url"
                type="url"
                placeholder="https://www.fedex.com/..."
                value={formData.trackingUrl || ""}
                onChange={(e) =>
                  updateFormField("trackingUrl", e.target.value)
                }
                className={inputClasses}
              />
            </div>

            {/* Files (D-11/D-12) */}
            <div>
              <label className={labelClasses}>Files</label>

              {editingItem ? (
                <>
                  {/* Existing files list */}
                  {(formData.files || []).map(
                    (f: { _key: string; label: string; file: string }) => {
                      const isImage = /\.(jpg|jpeg|png|webp)$/i.test(
                        f.file || "",
                      );
                      return (
                        <div
                          key={f._key}
                          className="flex items-center gap-3 py-2"
                        >
                          {isImage ? (
                            <img
                              src={f.file}
                              alt=""
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <FileText
                              size={24}
                              className="text-stone flex-shrink-0"
                            />
                          )}
                          <input
                            type="text"
                            value={f.label}
                            placeholder="Add label..."
                            onChange={(e) => {
                              const updated = (formData.files || []).map(
                                (
                                  ff: {
                                    _key: string;
                                    label: string;
                                    file: string;
                                  },
                                ) =>
                                  ff._key === f._key
                                    ? { ...ff, label: e.target.value }
                                    : ff,
                              );
                              updateFormField("files", updated);
                            }}
                            className="text-sm font-body border-none bg-transparent text-charcoal placeholder:text-stone-light focus:outline-none flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleFileDelete(f._key, f.file)}
                            className="text-stone hover:text-red-600 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    },
                  )}

                  {/* Upload progress bar */}
                  {uploadingFile && (
                    <div className="h-[3px] bg-stone-light/20 rounded overflow-hidden mt-2">
                      <div className="h-full bg-terracotta animate-pulse w-full" />
                    </div>
                  )}

                  {/* Drop zone */}
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleDropZoneClick}
                    className="border-2 border-dashed border-stone-light/30 rounded-lg p-6 text-center cursor-pointer hover:border-stone-light/60 transition-colors mt-2"
                  >
                    <Upload
                      size={24}
                      className="text-stone-light mx-auto mb-2"
                    />
                    <p className="text-sm text-stone font-body">
                      Drop files here or click to browse
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-stone-light font-body">
                  Save the item first to upload files
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="proc-notes" className={labelClasses}>
                Notes
              </label>
              <textarea
                id="proc-notes"
                rows={3}
                value={formData.notes || ""}
                onChange={(e) => updateFormField("notes", e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        {/* Panel footer */}
        <div className="px-6 py-4 border-t border-stone-light/30 flex items-center gap-4">
          <button
            type="button"
            onClick={handleSaveItem}
            disabled={saving}
            className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 rounded-lg hover:bg-terracotta-light transition-colors disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingItem
                ? "Save Changes"
                : "Add Item"}
          </button>
          <button
            type="button"
            onClick={closePanel}
            className="text-sm text-stone hover:text-charcoal transition-colors font-body ml-auto cursor-pointer"
          >
            Discard Changes
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Confirmation dialog (D-09) */}
      {/* ------------------------------------------------------------------- */}

      {confirmRemoveItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setConfirmRemoveItem(null)}
          />
          {/* Dialog container */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-auto">
              <h4 className="text-sm font-semibold font-body text-charcoal">
                Remove {confirmRemoveItem.name}?
              </h4>
              <p className="text-sm text-stone font-body mt-2">
                This item and its files will be permanently removed.
              </p>
              <div className="flex items-center gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmRemoveItem(null)}
                  className="text-sm text-stone hover:text-charcoal font-body transition-colors cursor-pointer"
                >
                  Keep Item
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(confirmRemoveItem)}
                  className="bg-red-600 text-white text-xs uppercase tracking-widest font-body px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Check,
  ChevronDown,
} from "lucide-react";
import { isProcurementOverdue, getNetPrice } from "../../lib/dashboardUtils";
import { formatCurrency } from "../../lib/formatCurrency";
import { getTrackingInfo } from "../../lib/trackingUrl";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

interface ProcurementItem {
  _key: string;
  name: string;
  status: string;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  installDate: string | null;
  clientCost: number | null;
  retailPrice: number | null;
  trackingNumber: string | null;
  vendor: string | null;
  notes: string | null;
  carrierETA: string | null;
  carrierName: string | null;
  trackingUrl: string | null;
  lastSyncAt: string | null;
  syncSource: string | null;
}

interface Props {
  items: ProcurementItem[];
  projectId: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-stone-light/20 text-stone",
  ordered: "bg-amber-50 text-amber-700",
  warehouse: "bg-blue-50 text-blue-700",
  "in-transit": "bg-terracotta/10 text-terracotta",
  delivered: "bg-emerald-50 text-emerald-700",
  installed: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  ordered: "Ordered",
  warehouse: "Warehouse",
  "in-transit": "In Transit",
  delivered: "Delivered",
  installed: "Installed",
};

const STATUS_ORDER = [
  "pending",
  "ordered",
  "warehouse",
  "in-transit",
  "delivered",
  "installed",
];

export default function ProcurementEditor({ items, projectId }: Props) {
  const [localItems, setLocalItems] = useState<ProcurementItem[]>(items);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [creatingNew, setCreatingNew] = useState(false);
  const [newItemForm, setNewItemForm] = useState<Record<string, string>>({
    name: "",
  });
  const [statusDropdownKey, setStatusDropdownKey] = useState<string | null>(
    null,
  );
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [savingRow, setSavingRow] = useState(false);
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close status dropdown on click outside
  useEffect(() => {
    if (!statusDropdownKey) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setStatusDropdownKey(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusDropdownKey]);

  // Close status dropdown on Escape; cancel edit on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (statusDropdownKey) {
          setStatusDropdownKey(null);
        } else if (editingKey) {
          cancelEdit();
        } else if (creatingNew) {
          setCreatingNew(false);
          setNewItemForm({ name: "" });
          setValidationError(null);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [statusDropdownKey, editingKey, creatingNew]);

  // Auto-dismiss error after 3000ms
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  function showError(msg: string) {
    setError(msg);
  }

  async function handleStatusChange(key: string, newStatus: string) {
    const item = localItems.find((i) => i._key === key);
    if (!item) return;

    const prevStatus = item.status;
    const prevSyncSource = item.syncSource;

    // Optimistic update
    setLocalItems((prev) =>
      prev.map((i) =>
        i._key === key ? { ...i, status: newStatus, syncSource: null } : i,
      ),
    );
    setSavingStatus(key);
    setStatusDropdownKey(null);

    try {
      const res = await fetch("/api/admin/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-status",
          projectId,
          itemKey: key,
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      setLocalItems((prev) =>
        prev.map((i) =>
          i._key === key
            ? { ...i, status: prevStatus, syncSource: prevSyncSource }
            : i,
        ),
      );
      showError("Could not save changes. Please try again.");
    } finally {
      setSavingStatus(null);
    }
  }

  async function handleSaveEdit() {
    if (!editingKey) return;
    const name = (editForm.name || "").trim();
    if (!name) {
      setValidationError("Item name is required");
      return;
    }

    setSavingRow(true);
    setValidationError(null);

    const payload: Record<string, unknown> = {
      action: "update",
      projectId,
      itemKey: editingKey,
      name,
      vendor: editForm.vendor || null,
      orderDate: editForm.orderDate || null,
      expectedDeliveryDate: editForm.expectedDeliveryDate || null,
      installDate: editForm.installDate || null,
      trackingNumber: editForm.trackingNumber || null,
      notes: editForm.notes || null,
    };

    // Convert dollar amounts to cents
    if (editForm.clientCost) {
      payload.clientCost = Math.round(parseFloat(editForm.clientCost) * 100);
    } else {
      payload.clientCost = null;
    }
    if (editForm.retailPrice) {
      payload.retailPrice = Math.round(parseFloat(editForm.retailPrice) * 100);
    } else {
      payload.retailPrice = null;
    }

    try {
      const res = await fetch("/api/admin/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();

      // Update localItems with new values
      setLocalItems((prev) =>
        prev.map((i) =>
          i._key === editingKey
            ? {
                ...i,
                name,
                vendor: (editForm.vendor || null) as string | null,
                orderDate: (editForm.orderDate || null) as string | null,
                expectedDeliveryDate: (editForm.expectedDeliveryDate ||
                  null) as string | null,
                installDate: (editForm.installDate || null) as string | null,
                trackingNumber: (editForm.trackingNumber || null) as
                  | string
                  | null,
                notes: (editForm.notes || null) as string | null,
                clientCost: editForm.clientCost
                  ? Math.round(parseFloat(editForm.clientCost) * 100)
                  : null,
                retailPrice: editForm.retailPrice
                  ? Math.round(parseFloat(editForm.retailPrice) * 100)
                  : null,
              }
            : i,
        ),
      );
      setEditingKey(null);
      setEditForm({});
    } catch {
      showError("Could not save changes. Please try again.");
    } finally {
      setSavingRow(false);
    }
  }

  async function handleCreate() {
    const name = (newItemForm.name || "").trim();
    if (!name) {
      setValidationError("Item name is required");
      return;
    }

    setSavingRow(true);
    setValidationError(null);

    const payload: Record<string, unknown> = {
      action: "create",
      projectId,
      name,
      vendor: newItemForm.vendor || null,
      orderDate: newItemForm.orderDate || null,
      expectedDeliveryDate: newItemForm.expectedDeliveryDate || null,
      installDate: newItemForm.installDate || null,
      trackingNumber: newItemForm.trackingNumber || null,
      notes: newItemForm.notes || null,
    };

    if (newItemForm.clientCost) {
      payload.clientCost = Math.round(parseFloat(newItemForm.clientCost) * 100);
    }
    if (newItemForm.retailPrice) {
      payload.retailPrice = Math.round(
        parseFloat(newItemForm.retailPrice) * 100,
      );
    }

    try {
      const res = await fetch("/api/admin/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();

      const newItem: ProcurementItem = {
        _key: result.itemKey,
        name,
        status: "pending",
        orderDate: (newItemForm.orderDate as string) || null,
        expectedDeliveryDate:
          (newItemForm.expectedDeliveryDate as string) || null,
        installDate: (newItemForm.installDate as string) || null,
        clientCost: newItemForm.clientCost
          ? Math.round(parseFloat(newItemForm.clientCost) * 100)
          : null,
        retailPrice: newItemForm.retailPrice
          ? Math.round(parseFloat(newItemForm.retailPrice) * 100)
          : null,
        trackingNumber: (newItemForm.trackingNumber as string) || null,
        vendor: (newItemForm.vendor as string) || null,
        notes: (newItemForm.notes as string) || null,
        carrierETA: null,
        carrierName: null,
        trackingUrl: null,
        lastSyncAt: null,
        syncSource: null,
      };

      setLocalItems((prev) => [...prev, newItem]);
      setNewItemForm({ name: "" });
      setCreatingNew(false);
    } catch {
      showError("Could not add item. Please try again.");
    } finally {
      setSavingRow(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingKey(deleteTarget.key);

    try {
      const res = await fetch("/api/admin/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          projectId,
          itemKey: deleteTarget.key,
          itemName: deleteTarget.name,
        }),
      });
      if (!res.ok) throw new Error();

      setLocalItems((prev) =>
        prev.filter((i) => i._key !== deleteTarget.key),
      );
    } catch {
      showError("Could not delete item. Please try again.");
    } finally {
      setDeleteTarget(null);
      setDeletingKey(null);
    }
  }

  async function handleForceRefresh(key: string, trackingNumber: string) {
    setRefreshingKey(key);

    try {
      const res = await fetch("/api/admin/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "force-refresh",
          projectId,
          itemKey: key,
          trackingNumber,
        }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();

      if (result.success && result.data) {
        setLocalItems((prev) =>
          prev.map((i) =>
            i._key === key
              ? {
                  ...i,
                  ...(result.data.status && { status: result.data.status }),
                  carrierETA: result.data.carrierETA ?? i.carrierETA,
                  carrierName: result.data.carrierName ?? i.carrierName,
                  trackingUrl: result.data.trackingUrl ?? i.trackingUrl,
                  lastSyncAt:
                    result.data.lastSyncAt ?? new Date().toISOString(),
                  syncSource: "manual",
                }
              : i,
          ),
        );
      }
    } catch {
      showError("Could not refresh tracking. Please try again.");
    } finally {
      setRefreshingKey(null);
    }
  }

  function startEdit(item: ProcurementItem) {
    setCreatingNew(false);
    setValidationError(null);
    setEditingKey(item._key);
    setEditForm({
      name: item.name,
      vendor: item.vendor || "",
      orderDate: item.orderDate || "",
      expectedDeliveryDate: item.expectedDeliveryDate || "",
      installDate: item.installDate || "",
      clientCost: item.clientCost != null ? (item.clientCost / 100).toFixed(2) : "",
      retailPrice:
        item.retailPrice != null ? (item.retailPrice / 100).toFixed(2) : "",
      trackingNumber: item.trackingNumber || "",
      notes: item.notes || "",
    });
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditForm({});
    setValidationError(null);
  }

  function truncateTracking(num: string): string {
    return num.length > 12 ? num.slice(0, 12) + "..." : num;
  }

  function renderTrackingLink(item: ProcurementItem) {
    if (item.trackingUrl) {
      return (
        <a
          href={item.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-terracotta hover:text-terracotta-light text-xs underline"
        >
          {item.carrierName || truncateTracking(item.trackingNumber || "")}
        </a>
      );
    }
    if (item.trackingNumber) {
      const info = getTrackingInfo(item.trackingNumber);
      if (info.url) {
        return (
          <a
            href={info.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracotta hover:text-terracotta-light text-xs underline"
          >
            {info.carrier !== "unknown"
              ? info.carrier.toUpperCase()
              : truncateTracking(item.trackingNumber)}
          </a>
        );
      }
      return (
        <span className="text-xs text-stone">
          {truncateTracking(item.trackingNumber)}
        </span>
      );
    }
    return <span className="text-stone-light">{"\u2014"}</span>;
  }

  function renderNetPrice(item: ProcurementItem) {
    const net = getNetPrice(item.clientCost, item.retailPrice);
    if (net === null) return <span className="text-stone-light">{"\u2014"}</span>;
    if (net === 0)
      return (
        <span title="Client cost exceeds retail price">
          {formatCurrency(0)}
        </span>
      );
    return <span>{formatCurrency(net)}</span>;
  }

  function renderStatusDropdown(item: ProcurementItem) {
    const isOpen = statusDropdownKey === item._key;
    const isSaving = savingStatus === item._key;

    return (
      <div className="relative" ref={isOpen ? dropdownRef : undefined}>
        <button
          type="button"
          onClick={() =>
            setStatusDropdownKey(isOpen ? null : item._key)
          }
          className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-opacity ${
            STATUS_STYLES[item.status] || "bg-stone-light/20 text-stone"
          } ${isSaving ? "opacity-50" : ""}`}
          disabled={isSaving}
        >
          {STATUS_LABELS[item.status] || item.status}
          <ChevronDown className="w-3 h-3" />
        </button>
        {isOpen && (
          <div
            className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-stone-light/20 py-1 z-10 min-w-[140px]"
            role="listbox"
          >
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={item.status === s}
                onClick={() => handleStatusChange(item._key, s)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-cream/50 ${
                  STATUS_STYLES[s] || ""
                }`}
              >
                {item.status === s && <Check className="w-3.5 h-3.5" />}
                <span className={item.status !== s ? "ml-[22px]" : ""}>
                  {STATUS_LABELS[s]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderSyncIndicator(item: ProcurementItem) {
    if (!item.syncSource || !item.lastSyncAt) return null;
    return (
      <div className="text-[11px] text-stone-light font-body flex items-center gap-1 mt-0.5">
        <RefreshCw className="w-3 h-3" />
        Synced{" "}
        {formatDistanceToNow(parseISO(item.lastSyncAt), { addSuffix: true })}
      </div>
    );
  }

  function renderReadRow(item: ProcurementItem) {
    const overdue = isProcurementOverdue(item);
    const canRefresh =
      item.trackingNumber &&
      ["ordered", "warehouse", "in-transit"].includes(item.status);

    return (
      <tr
        key={item._key}
        className="border-b border-stone-light/10 last:border-b-0"
      >
        {/* Item name */}
        <td className="px-3 py-3">
          <span
            className={`text-sm font-body ${overdue ? "text-red-600" : "text-charcoal"}`}
          >
            {item.name}
          </span>
        </td>
        {/* Vendor */}
        <td className="px-3 py-3 hidden md:table-cell">
          <span className="text-xs font-body text-stone">
            {item.vendor || "\u2014"}
          </span>
        </td>
        {/* Status */}
        <td className="px-3 py-3 text-center">
          {renderStatusDropdown(item)}
          {renderSyncIndicator(item)}
        </td>
        {/* Expected Delivery */}
        <td className="px-3 py-3 text-right">
          <span
            className={`text-xs font-body ${overdue ? "text-red-600 font-medium" : "text-stone"}`}
          >
            {item.expectedDeliveryDate
              ? format(parseISO(item.expectedDeliveryDate), "MMM d")
              : "\u2014"}
          </span>
        </td>
        {/* Carrier ETA */}
        <td className="px-3 py-3 text-right hidden md:table-cell">
          <span className="text-xs font-body text-stone">
            {item.carrierETA
              ? format(parseISO(item.carrierETA), "MMM d")
              : "\u2014"}
          </span>
        </td>
        {/* Cost */}
        <td className="px-3 py-3 text-right">
          <span className="text-xs font-body text-charcoal tabular-nums">
            {item.clientCost != null ? formatCurrency(item.clientCost) : "\u2014"}
          </span>
        </td>
        {/* Net */}
        <td className="px-3 py-3 text-right hidden md:table-cell">
          <span className="text-xs font-body text-charcoal tabular-nums">
            {renderNetPrice(item)}
          </span>
        </td>
        {/* Track */}
        <td className="px-3 py-3 text-center hidden md:table-cell">
          {renderTrackingLink(item)}
        </td>
        {/* Actions */}
        <td className="px-3 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => startEdit(item)}
              aria-label="Edit item"
              className="text-stone-light hover:text-charcoal transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({ key: item._key, name: item.name })
              }
              aria-label="Delete item"
              className="text-stone-light hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {canRefresh && (
              <>
                {refreshingKey === item._key ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-terracotta" />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleForceRefresh(item._key, item.trackingNumber!)
                    }
                    aria-label="Refresh tracking"
                    className="text-stone-light hover:text-terracotta transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    );
  }

  function renderEditRow(item: ProcurementItem) {
    return (
      <>
        <tr
          key={item._key + "-edit"}
          className="border-b border-stone-light/10"
        >
          {/* Item name */}
          <td className="px-3 py-3">
            <input
              type="text"
              value={editForm.name || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, name: e.target.value }))
              }
              className="text-sm font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-full"
            />
            {validationError && !(editForm.name || "").trim() && (
              <span className="text-xs text-red-600">{validationError}</span>
            )}
          </td>
          {/* Vendor */}
          <td className="px-3 py-3 hidden md:table-cell">
            <input
              type="text"
              value={editForm.vendor || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, vendor: e.target.value }))
              }
              className="text-sm font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-full"
            />
          </td>
          {/* Status -- still shows dropdown in edit mode */}
          <td className="px-3 py-3 text-center">
            {renderStatusDropdown(item)}
          </td>
          {/* Expected Delivery */}
          <td className="px-3 py-3 text-right">
            <input
              type="date"
              value={editForm.expectedDeliveryDate || ""}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  expectedDeliveryDate: e.target.value,
                }))
              }
              className="text-xs font-body text-stone bg-transparent border border-stone-light/20 rounded-md px-2 py-1"
            />
          </td>
          {/* Carrier ETA (read-only in edit mode -- comes from Ship24) */}
          <td className="px-3 py-3 text-right hidden md:table-cell">
            <span className="text-xs font-body text-stone">
              {item.carrierETA
                ? format(parseISO(item.carrierETA), "MMM d")
                : "\u2014"}
            </span>
          </td>
          {/* Cost */}
          <td className="px-3 py-3 text-right">
            <input
              type="number"
              step="0.01"
              min="0"
              value={editForm.clientCost || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, clientCost: e.target.value }))
              }
              placeholder="0.00"
              className="text-xs font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-20 text-right"
            />
          </td>
          {/* Net (read-only -- computed) */}
          <td className="px-3 py-3 text-right hidden md:table-cell">
            <span className="text-xs font-body text-charcoal tabular-nums">
              {renderNetPrice(item)}
            </span>
          </td>
          {/* Tracking */}
          <td className="px-3 py-3 text-center hidden md:table-cell">
            <input
              type="text"
              value={editForm.trackingNumber || ""}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  trackingNumber: e.target.value,
                }))
              }
              placeholder="Tracking #"
              className="text-xs font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-full"
            />
          </td>
          {/* Actions */}
          <td className="px-3 py-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingRow}
                className="text-xs font-semibold text-terracotta hover:text-terracotta-light whitespace-nowrap"
              >
                {savingRow && (
                  <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                )}
                Save Changes
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs text-stone hover:text-charcoal whitespace-nowrap"
              >
                Discard Changes
              </button>
            </div>
          </td>
        </tr>
        {/* Notes row spanning all columns */}
        <tr key={item._key + "-notes"}>
          <td colSpan={9} className="px-5 py-2">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="date"
                  value={editForm.orderDate || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, orderDate: e.target.value }))
                  }
                  className="text-xs font-body text-stone bg-transparent border border-stone-light/20 rounded-md px-2 py-1 mr-2"
                  title="Order date"
                />
                <input
                  type="date"
                  value={editForm.installDate || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      installDate: e.target.value,
                    }))
                  }
                  className="text-xs font-body text-stone bg-transparent border border-stone-light/20 rounded-md px-2 py-1 mr-2"
                  title="Install date"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.retailPrice || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      retailPrice: e.target.value,
                    }))
                  }
                  placeholder="Retail $"
                  className="text-xs font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-20 text-right"
                  title="Retail price"
                />
              </div>
            </div>
            <textarea
              value={editForm.notes || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Internal notes..."
              className="w-full text-sm font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-3 py-2 min-h-[60px] mt-2"
            />
          </td>
        </tr>
      </>
    );
  }

  function renderNewItemRow() {
    if (!creatingNew) {
      return (
        <tr
          className="bg-cream/50 cursor-pointer"
          onClick={() => {
            setCreatingNew(true);
            cancelEdit();
          }}
        >
          <td colSpan={9} className="px-5 py-3">
            <div className="flex items-center gap-2 text-stone-light">
              <Plus className="w-3.5 h-3.5" />
              <span className="text-sm font-body">Add item...</span>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <>
        <tr className="bg-cream/50 border-b border-stone-light/10">
          {/* Item name */}
          <td className="px-3 py-3">
            <input
              type="text"
              value={newItemForm.name || ""}
              onChange={(e) =>
                setNewItemForm((f) => ({ ...f, name: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="Item name"
              autoFocus
              className="text-sm font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-full"
            />
            {validationError && !(newItemForm.name || "").trim() && (
              <span className="text-xs text-red-600">{validationError}</span>
            )}
          </td>
          {/* Vendor */}
          <td className="px-3 py-3 hidden md:table-cell">
            <input
              type="text"
              value={newItemForm.vendor || ""}
              onChange={(e) =>
                setNewItemForm((f) => ({ ...f, vendor: e.target.value }))
              }
              placeholder="Vendor"
              className="text-sm font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-full"
            />
          </td>
          {/* Status (default Pending) */}
          <td className="px-3 py-3 text-center">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-light/20 text-stone">
              Pending
            </span>
          </td>
          {/* Expected Delivery */}
          <td className="px-3 py-3 text-right">
            <input
              type="date"
              value={newItemForm.expectedDeliveryDate || ""}
              onChange={(e) =>
                setNewItemForm((f) => ({
                  ...f,
                  expectedDeliveryDate: e.target.value,
                }))
              }
              className="text-xs font-body text-stone bg-transparent border border-stone-light/20 rounded-md px-2 py-1"
            />
          </td>
          {/* Carrier ETA */}
          <td className="px-3 py-3 text-right hidden md:table-cell">
            <span className="text-stone-light">{"\u2014"}</span>
          </td>
          {/* Cost */}
          <td className="px-3 py-3 text-right">
            <input
              type="number"
              step="0.01"
              min="0"
              value={newItemForm.clientCost || ""}
              onChange={(e) =>
                setNewItemForm((f) => ({
                  ...f,
                  clientCost: e.target.value,
                }))
              }
              placeholder="0.00"
              className="text-xs font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-20 text-right"
            />
          </td>
          {/* Net */}
          <td className="px-3 py-3 text-right hidden md:table-cell">
            <span className="text-stone-light">{"\u2014"}</span>
          </td>
          {/* Track */}
          <td className="px-3 py-3 text-center hidden md:table-cell">
            <input
              type="text"
              value={newItemForm.trackingNumber || ""}
              onChange={(e) =>
                setNewItemForm((f) => ({
                  ...f,
                  trackingNumber: e.target.value,
                }))
              }
              placeholder="Tracking #"
              className="text-xs font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-full"
            />
          </td>
          {/* Actions */}
          <td className="px-3 py-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleCreate}
                disabled={savingRow}
                className="text-xs font-semibold text-terracotta hover:text-terracotta-light whitespace-nowrap"
              >
                {savingRow && (
                  <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                )}
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatingNew(false);
                  setNewItemForm({ name: "" });
                  setValidationError(null);
                }}
                className="text-xs text-stone hover:text-charcoal whitespace-nowrap"
              >
                Discard Changes
              </button>
            </div>
          </td>
        </tr>
        {/* Extra fields row for new item */}
        <tr className="bg-cream/50">
          <td colSpan={9} className="px-5 py-2">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="date"
                  value={newItemForm.orderDate || ""}
                  onChange={(e) =>
                    setNewItemForm((f) => ({
                      ...f,
                      orderDate: e.target.value,
                    }))
                  }
                  className="text-xs font-body text-stone bg-transparent border border-stone-light/20 rounded-md px-2 py-1 mr-2"
                  title="Order date"
                />
                <input
                  type="date"
                  value={newItemForm.installDate || ""}
                  onChange={(e) =>
                    setNewItemForm((f) => ({
                      ...f,
                      installDate: e.target.value,
                    }))
                  }
                  className="text-xs font-body text-stone bg-transparent border border-stone-light/20 rounded-md px-2 py-1 mr-2"
                  title="Install date"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItemForm.retailPrice || ""}
                  onChange={(e) =>
                    setNewItemForm((f) => ({
                      ...f,
                      retailPrice: e.target.value,
                    }))
                  }
                  placeholder="Retail $"
                  className="text-xs font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-2 py-1 w-20 text-right"
                  title="Retail price"
                />
              </div>
            </div>
            <textarea
              value={newItemForm.notes || ""}
              onChange={(e) =>
                setNewItemForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Internal notes..."
              className="w-full text-sm font-body text-charcoal bg-transparent border border-stone-light/20 rounded-md px-3 py-2 min-h-[60px] mt-2"
            />
          </td>
        </tr>
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-stone-light/20 overflow-hidden">
        {localItems.length === 0 && !creatingNew && (
          <div>
            <p className="text-sm text-stone text-center py-6">
              No procurement items yet
            </p>
            <p className="text-xs text-stone-light text-center pb-4">
              Use the row below to add items as they are ordered for this
              project.
            </p>
          </div>
        )}

        <table className="w-full">
          {(localItems.length > 0 || creatingNew) && (
            <thead>
              <tr className="border-b border-stone-light/20">
                <th className="text-xs uppercase tracking-widest text-stone font-normal text-left px-3 py-2">
                  Item
                </th>
                <th className="text-xs uppercase tracking-widest text-stone font-normal text-left px-3 py-2 hidden md:table-cell">
                  Vendor
                </th>
                <th className="text-xs uppercase tracking-widest text-stone font-normal text-center px-3 py-2">
                  Status
                </th>
                <th className="text-xs uppercase tracking-widest text-stone font-normal text-right px-3 py-2">
                  Expected
                </th>
                <th className="text-xs uppercase tracking-widest text-stone font-normal text-right px-3 py-2 hidden md:table-cell">
                  Carrier ETA
                </th>
                <th className="text-xs uppercase tracking-widest text-stone font-normal text-right px-3 py-2">
                  Cost
                </th>
                <th className="text-xs uppercase tracking-widest text-stone font-normal text-right px-3 py-2 hidden md:table-cell">
                  Net
                </th>
                <th className="text-xs uppercase tracking-widest text-stone font-normal text-center px-3 py-2 hidden md:table-cell">
                  Track
                </th>
                <th className="text-xs uppercase tracking-widest text-stone font-normal text-center px-3 py-2">
                  {/* Actions -- no header text */}
                </th>
              </tr>
            </thead>
          )}
          <tbody>
            {localItems.map((item) =>
              editingKey === item._key
                ? renderEditRow(item)
                : renderReadRow(item),
            )}
            {renderNewItemRow()}
          </tbody>
        </table>

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 font-body">
            {error}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        entityType="procurement-item"
        entityName={deleteTarget?.name || ""}
        isLoading={!!deletingKey}
      />
    </>
  );
}

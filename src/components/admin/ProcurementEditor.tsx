import { useState, useRef, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
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
  retrievedStatus: string | null;
}

interface Props {
  items: ProcurementItem[];
  projectId: string;
}

// Luxury status pills -- border-outlined on tinted backgrounds
const STATUS_PILL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: { bg: "#F3EFE9", text: "#6B5E52", border: "#E0D5C5" },
  warehouse: { bg: "#F3EDE3", text: "#6B5E52", border: "#D4C8B8" },
  "in-transit": { bg: "#FBF2E2", text: "#8A5E1A", border: "#E8CFA0" },
  ordered: { bg: "#E8F0F9", text: "#2A5485", border: "#B0CAE8" },
  pending: { bg: "#FDEEE6", text: "#9B3A2A", border: "#F2C9B8" },
  delivered: { bg: "#EDF5E8", text: "#3A6620", border: "#C4DBA8" },
  installed: { bg: "#EDF5E8", text: "#3A6620", border: "#A8C98C" },
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-stone-light/20 text-stone",
  warehouse: "bg-blue-50 text-blue-700",
  "in-transit": "bg-terracotta/10 text-terracotta",
  ordered: "bg-amber-50 text-amber-700",
  pending: "bg-red-50 text-red-700",
  delivered: "bg-emerald-50 text-emerald-700",
  installed: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  warehouse: "Warehouse",
  "in-transit": "In Transit",
  ordered: "Ordered",
  pending: "Pending order",
  delivered: "Delivered",
  installed: "Installed",
};

// Display/sort order per product spec.
const STATUS_ORDER = [
  "scheduled",
  "warehouse",
  "in-transit",
  "ordered",
  "pending",
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
      carrierName: editForm.carrierName || null,
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
      carrierName: item.carrierName || "",
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
          className="text-[11.5px] underline hover:opacity-70" style={{ color: "#9A7B4B", fontFamily: "var(--font-sans)" }}
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
            className="text-[11.5px] underline hover:opacity-70" style={{ color: "#9A7B4B", fontFamily: "var(--font-sans)" }}
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
    const pill = STATUS_PILL_STYLES[item.status] || STATUS_PILL_STYLES.pending;

    return (
      <div className="relative" ref={isOpen ? dropdownRef : undefined}>
        <button
          type="button"
          onClick={() =>
            setStatusDropdownKey(isOpen ? null : item._key)
          }
          className={`inline-flex items-center gap-1 cursor-pointer transition-opacity ${isSaving ? "opacity-50" : ""}`}
          style={{
            padding: "3px 9px",
            borderRadius: "20px",
            fontSize: "10.5px",
            fontWeight: 500,
            letterSpacing: "0.04em",
            backgroundColor: pill.bg,
            color: pill.text,
            border: `0.5px solid ${pill.border}`,
            fontFamily: "var(--font-sans)",
          }}
          disabled={isSaving}
        >
          {STATUS_LABELS[item.status] || item.status}
          <ChevronDown className="w-3 h-3" />
        </button>
        {isOpen && (
          <div
            className="absolute left-0 top-full mt-1 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
            style={{ backgroundColor: "#FFFEFB", border: "0.5px solid #E8DDD0" }}
            role="listbox"
          >
            {STATUS_ORDER.map((s) => {
              const sPill = STATUS_PILL_STYLES[s];
              return (
                <button
                  key={s}
                  type="button"
                  role="option"
                  aria-selected={item.status === s}
                  onClick={() => handleStatusChange(item._key, s)}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#FAF7F2]"
                  style={{
                    fontSize: "11.5px",
                    color: sPill.text,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {item.status === s && <Check className="w-3.5 h-3.5" />}
                  <span className={item.status !== s ? "ml-[22px]" : ""}>
                    {STATUS_LABELS[s]}
                  </span>
                </button>
              );
            })}
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
        Synced {format(parseISO(item.lastSyncAt), "MMM d")}
      </div>
    );
  }

  function renderReadRow(item: ProcurementItem) {
    const overdue = isProcurementOverdue(item);
    const canRefresh =
      item.trackingNumber &&
      ["ordered", "warehouse", "in-transit"].includes(item.status);

    const rowLabelColor = overdue ? "#9B3A2A" : "#2C2520";
    const rowDateColor = overdue ? "#9B3A2A" : "#6B5E52";
    return (
      <tr
        key={item._key}
        className="hover:bg-[#FAF7F2]"
        style={{ borderBottom: "0.5px solid #E8DDD0" }}
      >
        {/* Item + Vendor */}
        <td style={{ padding: "12px 16px" }}>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "12.5px",
              fontWeight: 500,
              color: rowLabelColor,
            }}
          >
            {item.name}
          </div>
          {item.vendor && (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11.5px",
                color: "#9E8E80",
                marginTop: "2px",
              }}
            >
              {item.vendor}
            </div>
          )}
          {item.notes && (
            <div
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11.5px",
                color: "#9E8E80",
                fontStyle: "italic",
                marginTop: "3px",
              }}
            >
              <span
                className="shrink-0 rounded-full"
                style={{
                  width: "5px",
                  height: "5px",
                  backgroundColor: "#9A7B4B",
                  opacity: 0.7,
                }}
              />
              {item.notes.length > 60 ? item.notes.slice(0, 60) + "…" : item.notes}
            </div>
          )}
        </td>
        {/* Status */}
        <td style={{ padding: "12px 16px" }}>
          {renderStatusDropdown(item)}
          {renderSyncIndicator(item)}
        </td>
        {/* Delivery: Expected + Carrier ETA */}
        <td style={{ padding: "12px 16px" }}>
          <div
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              color: rowDateColor,
              fontWeight: overdue ? 500 : 400,
            }}
          >
            {item.expectedDeliveryDate
              ? format(parseISO(item.expectedDeliveryDate), "MMM d")
              : "\u2014"}
          </div>
          {item.carrierETA && (
            <div
              className="tabular-nums"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                color: "#9E8E80",
                marginTop: "2px",
              }}
            >
              ETA {format(parseISO(item.carrierETA), "MMM d")}
            </div>
          )}
        </td>
        {/* Profit: retail - client cost */}
        <td style={{ padding: "12px 16px" }}>
          <div
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "12.5px",
              fontWeight: 500,
              color: "#2C2520",
            }}
          >
            {renderNetPrice(item)}
          </div>
        </td>
        {/* Track */}
        <td className="hidden sm:table-cell" style={{ padding: "12px 16px" }}>
          {renderTrackingLink(item)}
        </td>
        {/* Actions */}
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          <div className="flex items-center justify-center gap-0.5">
            <button
              type="button"
              onClick={() => startEdit(item)}
              aria-label="Edit item"
              className="p-2 rounded-md text-stone-light hover:text-charcoal hover:bg-stone-light/10 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({ key: item._key, name: item.name })
              }
              aria-label="Delete item"
              className="p-2 rounded-md text-stone-light hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {canRefresh && (
              <>
                {refreshingKey === item._key ? (
                  <div className="p-2"><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#9A7B4B" }} /></div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleForceRefresh(item._key, item.trackingNumber!)
                    }
                    aria-label="Refresh tracking"
                    className="p-2 rounded-md hover:bg-[#F5EDD8] transition-colors"
                    style={{ color: "#9E8E80" }}
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
    const inputClass = "luxury-input w-full";
    const drawerLabelStyle = {
      fontFamily: "var(--font-sans)",
      fontSize: "11px",
      fontWeight: 500,
      color: "#9E8E80",
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      marginBottom: "4px",
      display: "block",
    };

    // Computed net price for the read-only drawer display
    const costNum = parseFloat(editForm.clientCost || "0");
    const retailNum = parseFloat(editForm.retailPrice || "0");
    const netDisplay =
      editForm.clientCost && editForm.retailPrice
        ? Math.max(0, retailNum - costNum).toFixed(2)
        : "";

    return (
      <tr key={item._key + "-edit"} style={{ backgroundColor: "#F5EDD8" }}>
        <td colSpan={6} style={{ padding: "16px 18px 18px" }}>
          {/* Row 1: Item, Vendor, Order Date */}
          <div
            className="grid gap-[10px] mb-[12px]"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <div>
              <div style={drawerLabelStyle}>Item</div>
              <input
                type="text"
                value={editForm.name || ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                className="luxury-input w-full"
              />
              {validationError && !(editForm.name || "").trim() && (
                <span
                  className="text-[11px]"
                  style={{
                    color: "#9B3A2A",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {validationError}
                </span>
              )}
            </div>
            <div>
              <div style={drawerLabelStyle}>Vendor</div>
              <input
                type="text"
                value={editForm.vendor || ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, vendor: e.target.value }))
                }
                placeholder="Vendor"
                className="luxury-input w-full"
              />
            </div>
            <div>
              <div style={drawerLabelStyle}>Order Date</div>
              <input
                type="date"
                value={editForm.orderDate || ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, orderDate: e.target.value }))
                }
                className="luxury-input w-full"
              />
            </div>
          </div>

          {/* Row 2: Carrier, Tracking, Retrieved Status, Expected Install Date */}
          <div
            className="grid gap-[10px] mb-[12px]"
            style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
          >
            <div>
              <div style={drawerLabelStyle}>Carrier</div>
              <input
                type="text"
                list={`carrier-suggestions-${item._key}`}
                value={editForm.carrierName || ""}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    carrierName: e.target.value,
                  }))
                }
                placeholder="FedEx, UPS, USPS, custom..."
                className="luxury-input w-full"
              />
              <datalist id={`carrier-suggestions-${item._key}`}>
                <option value="FedEx" />
                <option value="UPS" />
                <option value="USPS" />
                <option value="DHL" />
                <option value="OnTrac" />
                <option value="Bill of Lading" />
              </datalist>
            </div>
            <div>
              <div style={drawerLabelStyle}>Tracking</div>
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
                className="luxury-input w-full"
              />
            </div>
            <div>
              <div style={drawerLabelStyle}>Retrieved Status</div>
              <input
                type="text"
                value={item.retrievedStatus || ""}
                readOnly
                placeholder="—"
                className="luxury-input w-full"
                style={{ color: "#6B5E52", cursor: "default" }}
                title="Read-only. Populated by tracking sync (FedEx/UPS/USPS/Ship24)."
              />
            </div>
            <div>
              <div style={drawerLabelStyle}>Expected Install Date</div>
              <input
                type="date"
                value={
                  editForm.installDate || editForm.expectedDeliveryDate || ""
                }
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    installDate: e.target.value,
                  }))
                }
                className="luxury-input w-full"
              />
            </div>
          </div>

          {/* Row 3: Client Cost, Trade Price, Profit */}
          <div
            className="grid gap-[10px] mb-[12px]"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <div>
              <div style={drawerLabelStyle}>Client Cost</div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editForm.clientCost || ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, clientCost: e.target.value }))
                }
                placeholder="0.00"
                className="luxury-input w-full tabular-nums"
                style={{ textAlign: "right" }}
              />
            </div>
            <div>
              <div style={drawerLabelStyle}>Trade Price</div>
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
                placeholder="0.00"
                className="luxury-input w-full tabular-nums"
                style={{ textAlign: "right" }}
              />
            </div>
            <div>
              <div style={drawerLabelStyle}>Profit</div>
              <input
                type="text"
                value={netDisplay}
                readOnly
                placeholder="—"
                className="luxury-input w-full tabular-nums"
                style={{
                  textAlign: "right",
                  color: "#6B5E52",
                  cursor: "default",
                }}
                title="Auto-computed: Trade Price − Client Cost"
              />
            </div>
          </div>

          {/* Row 4: Additional Notes */}
          <div className="mb-[14px]">
            <div style={drawerLabelStyle}>Additional Notes</div>
            <textarea
              value={editForm.notes || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Internal notes..."
              className="luxury-input w-full"
              style={{
                minHeight: "58px",
                lineHeight: 1.55,
                resize: "vertical",
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                fontSize: "12.5px",
                color: "#6B5E52",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                padding: "6px 12px",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={savingRow}
              style={{
                padding: "7px 18px",
                backgroundColor: "#9A7B4B",
                color: "#FAF5EC",
                border: "none",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-sans)",
                cursor: savingRow ? "not-allowed" : "pointer",
                opacity: savingRow ? 0.7 : 1,
              }}
            >
              {savingRow && (
                <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              )}
              Save
            </button>
          </div>
        </td>
      </tr>
    );
  }

  function renderNewItemRow() {
    if (!creatingNew) {
      return (
        <tr
          className="cursor-pointer hover:text-[#9A7B4B]"
          onClick={() => {
            setCreatingNew(true);
            cancelEdit();
          }}
          style={{ borderTop: "0.5px solid #E8DDD0" }}
        >
          <td colSpan={6} style={{ padding: "11px 16px" }}>
            <div
              className="flex items-center gap-[6px]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                color: "#9E8E80",
                letterSpacing: "0.03em",
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add item</span>
            </div>
          </td>
        </tr>
      );
    }

    const drawerLabelStyle = {
      fontFamily: "var(--font-sans)",
      fontSize: "11px",
      fontWeight: 500,
      color: "#9E8E80",
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      marginBottom: "4px",
      display: "block",
    };

    const newCost = parseFloat(newItemForm.clientCost || "0");
    const newRetail = parseFloat(newItemForm.retailPrice || "0");
    const newNetDisplay =
      newItemForm.clientCost && newItemForm.retailPrice
        ? Math.max(0, newRetail - newCost).toFixed(2)
        : "";

    return (
      <>
        {/* Main new-item row -- gold-light tint */}
        <tr
          style={{
            backgroundColor: "#F5EDD8",
            borderBottom: "0.5px solid #E8D5A8",
          }}
        >
          {/* Item + Vendor */}
          <td style={{ padding: "10px 14px" }}>
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
              className="luxury-input w-full"
            />
            {validationError && !(newItemForm.name || "").trim() && (
              <span className="text-[11px]" style={{ color: "#9B3A2A", fontFamily: "var(--font-sans)" }}>
                {validationError}
              </span>
            )}
            <input
              type="text"
              value={newItemForm.vendor || ""}
              onChange={(e) =>
                setNewItemForm((f) => ({ ...f, vendor: e.target.value }))
              }
              placeholder="Vendor"
              className="luxury-input w-full"
              style={{ marginTop: "5px" }}
            />
          </td>
          {/* Status (default Pending) */}
          <td style={{ padding: "10px 14px" }}>
            <span
              className="inline-flex items-center"
              style={{
                padding: "3px 9px",
                borderRadius: "20px",
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                backgroundColor: "#F3EDE3",
                color: "#9E8E80",
                border: "0.5px solid #E8DDD0",
                fontFamily: "var(--font-sans)",
              }}
            >
              Pending
            </span>
          </td>
          {/* Delivery */}
          <td style={{ padding: "10px 14px" }}>
            <input
              type="date"
              value={newItemForm.expectedDeliveryDate || ""}
              onChange={(e) =>
                setNewItemForm((f) => ({
                  ...f,
                  expectedDeliveryDate: e.target.value,
                }))
              }
              className="luxury-input w-full"
            />
          </td>
          {/* Price */}
          <td style={{ padding: "10px 14px" }}>
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
              placeholder="Cost"
              className="luxury-input w-full tabular-nums"
              style={{ textAlign: "right" }}
            />
          </td>
          {/* Track */}
          <td className="hidden sm:table-cell" style={{ padding: "10px 14px" }}>
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
              className="luxury-input w-full"
            />
          </td>
          {/* Actions */}
          <td style={{ padding: "10px 14px" }}>
            <button
              type="button"
              onClick={handleCreate}
              disabled={savingRow}
              className="block w-full hover:bg-[#7A5E32] transition-colors"
              style={{
                padding: "6px 0",
                backgroundColor: "#9A7B4B",
                color: "#FAF5EC",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-sans)",
                marginBottom: "5px",
                opacity: savingRow ? 0.7 : 1,
              }}
            >
              {savingRow && (
                <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              )}
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatingNew(false);
                setNewItemForm({ name: "" });
                setValidationError(null);
              }}
              className="block w-full text-center hover:text-[#6B5E52] transition-colors"
              style={{
                fontSize: "11.5px",
                color: "#9E8E80",
                padding: "2px 0",
                letterSpacing: "0.02em",
                fontFamily: "var(--font-sans)",
              }}
            >
              Cancel
            </button>
          </td>
        </tr>

        {/* Edit drawer for new item -- parchment bg */}
        <tr style={{ backgroundColor: "#F3EDE3" }}>
          <td colSpan={6} style={{ padding: "14px 14px 16px" }}>
            <div
              className="grid gap-[10px] mb-[14px]"
              style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
            >
              <div>
                <div style={drawerLabelStyle}>Order Date</div>
                <input
                  type="date"
                  value={newItemForm.orderDate || ""}
                  onChange={(e) =>
                    setNewItemForm((f) => ({
                      ...f,
                      orderDate: e.target.value,
                    }))
                  }
                  className="luxury-input w-full"
                />
              </div>
              <div>
                <div style={drawerLabelStyle}>Install Date</div>
                <input
                  type="date"
                  value={newItemForm.installDate || ""}
                  onChange={(e) =>
                    setNewItemForm((f) => ({
                      ...f,
                      installDate: e.target.value,
                    }))
                  }
                  className="luxury-input w-full"
                />
              </div>
              <div>
                <div style={drawerLabelStyle}>Retail Price</div>
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
                  placeholder="0.00"
                  className="luxury-input w-full tabular-nums"
                  style={{ textAlign: "right" }}
                />
              </div>
              <div>
                <div style={drawerLabelStyle}>Net Price</div>
                <input
                  type="text"
                  value={newNetDisplay}
                  readOnly
                  placeholder="—"
                  className="luxury-input w-full tabular-nums"
                  style={{
                    textAlign: "right",
                    color: "#6B5E52",
                    cursor: "default",
                  }}
                />
              </div>
            </div>
            <div>
              <div style={drawerLabelStyle}>Notes</div>
              <textarea
                value={newItemForm.notes || ""}
                onChange={(e) =>
                  setNewItemForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Internal notes..."
                className="luxury-input w-full"
                style={{
                  minHeight: "58px",
                  lineHeight: 1.55,
                  resize: "vertical",
                }}
              />
            </div>
          </td>
        </tr>
      </>
    );
  }

  return (
    <>
      <div
        className="rounded-[10px] overflow-hidden"
        style={{ backgroundColor: "#FFFEFB", border: "0.5px solid #E8DDD0" }}
      >
        {localItems.length === 0 && !creatingNew && (
          <div className="py-8 px-5 text-center">
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12.5px", color: "#9E8E80" }}>
              No procurement items yet
            </p>
            <p className="mt-1" style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#9E8E80" }}>
              Use the row below to add items as they are ordered for this
              project.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          {(localItems.length > 0 || creatingNew) && (
            <thead>
              <tr style={{ backgroundColor: "#F3EDE3", borderBottom: "0.5px solid #D4C8B8" }}>
                <th
                  className="text-left"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "10.5px",
                    fontWeight: 500,
                    color: "#9E8E80",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "11px 16px",
                  }}
                >
                  Item
                </th>
                <th
                  className="text-left"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "10.5px",
                    fontWeight: 500,
                    color: "#9E8E80",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "11px 16px",
                  }}
                >
                  Status
                </th>
                <th
                  className="text-left"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "10.5px",
                    fontWeight: 500,
                    color: "#9E8E80",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "11px 16px",
                  }}
                >
                  Delivery
                </th>
                <th
                  className="text-left"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "10.5px",
                    fontWeight: 500,
                    color: "#9E8E80",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "11px 16px",
                  }}
                >
                  Profit
                </th>
                <th
                  className="text-left hidden sm:table-cell"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "10.5px",
                    fontWeight: 500,
                    color: "#9E8E80",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "11px 16px",
                  }}
                >
                  Tracking
                </th>
                <th style={{ padding: "11px 16px", width: "80px" }}>
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
        </div>

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

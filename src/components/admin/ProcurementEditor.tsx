import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import {
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Check,
  ChevronDown,
} from "lucide-react";
import { isProcurementOverdue } from "../../lib/dashboardUtils";
import { getTrackingInfo } from "../../lib/trackingUrl";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import ProcurementItemModal, {
  type ProcurementItemModalItem,
  type ProcurementItemPayload,
} from "./ProcurementItemModal";

interface ProcurementItem {
  _key: string;
  name: string;
  status: string;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  installDate: string | null;
  trackingNumber: string | null;
  vendor: string | null;
  manufacturer?: string | null;
  qty?: number | null;
  notes: string | null;
  carrierETA: string | null;
  carrierName: string | null;
  trackingUrl: string | null;
  lastSyncAt: string | null;
  syncSource: string | null;
  retrievedStatus: string | null;
  productUrl?: string | null;
  itemUrl?: string | null;
  images?: Array<{
    _key: string;
    _type?: string;
    asset?: { _ref: string; _type: "reference" } | { url?: string; _ref?: string };
    url?: string;
    isPrimary?: boolean;
    caption?: string | null;
  }>;
}

interface Props {
  items: ProcurementItem[];
  projectId: string;
  // Phase 37: tests inject a spy to assert row-click dispatch.
  onOpenModal?: (event: {
    mode?: "view" | "edit" | "create";
    _key?: string;
    item?: ProcurementItem | null;
  }) => void;
}

// Luxury status pills — border-outlined on tinted backgrounds
const STATUS_PILL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: { bg: "#F3EFE9", text: "#6B5E52", border: "#E0D5C5" },
  warehouse: { bg: "#F3EDE3", text: "#6B5E52", border: "#D4C8B8" },
  "in-transit": { bg: "#FBF2E2", text: "#8A5E1A", border: "#E8CFA0" },
  ordered: { bg: "#E8F0F9", text: "#2A5485", border: "#B0CAE8" },
  pending: { bg: "#FDEEE6", text: "#9B3A2A", border: "#F2C9B8" },
  delivered: { bg: "#EDF5E8", text: "#3A6620", border: "#C4DBA8" },
  installed: { bg: "#EDF5E8", text: "#3A6620", border: "#A8C98C" },
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

export default function ProcurementEditor({ items, projectId, onOpenModal }: Props) {
  const [localItems, setLocalItems] = useState<ProcurementItem[]>(items);
  const [statusDropdownKey, setStatusDropdownKey] = useState<string | null>(
    null,
  );
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Phase 37 modal state
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "view" | "edit" | "create";
    item: ProcurementItem | null;
  }>({ open: false, mode: "view", item: null });

  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [dropdownAnchorRect, setDropdownAnchorRect] = useState<DOMRect | null>(
    null,
  );

  // Close status dropdown on click outside (must check both trigger and
  // portaled menu since the menu is no longer a DOM-child of the trigger).
  useEffect(() => {
    if (!statusDropdownKey) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownMenuRef.current?.contains(target) ||
        dropdownTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setStatusDropdownKey(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusDropdownKey]);

  // Close status dropdown on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && statusDropdownKey) {
        setStatusDropdownKey(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [statusDropdownKey]);

  // Auto-dismiss error after 3000ms
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  function showError(msg: string) {
    setError(msg);
  }

  const handleRowClick = useCallback(
    (item: ProcurementItem) => {
      setModalState({ open: true, mode: "view", item });
      onOpenModal?.({ mode: "view", _key: item._key, item });
    },
    [onOpenModal],
  );

  const handleAddItemClick = useCallback(() => {
    setModalState({ open: true, mode: "create", item: null });
    onOpenModal?.({ mode: "create", item: null });
  }, [onOpenModal]);

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

  // --- Modal save / delete handlers ---
  const handleModalSave = useCallback(
    async (payload: ProcurementItemPayload) => {
      const isCreate = modalState.mode === "create";
      const action = isCreate ? "create" : "update";
      const body: Record<string, unknown> = {
        action,
        projectId,
        name: payload.name,
        vendor: payload.vendor ?? null,
        manufacturer: payload.manufacturer ?? null,
        qty: payload.qty ?? null,
        orderDate: payload.orderDate || undefined,
        expectedDeliveryDate: payload.expectedDeliveryDate || undefined,
        installDate: payload.installDate || undefined,
        trackingNumber: payload.trackingNumber ?? null,
        carrierName: payload.carrierName ?? null,
        notes: payload.notes ?? null,
        itemUrl: payload.productUrl ?? payload.itemUrl ?? null,
        images: payload.images ?? [],
      };
      if (!isCreate) {
        body.itemKey = payload._key;
      }
      const res = await fetch("/api/admin/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let msg = "Couldn't save — try again.";
        try {
          const data = await res.json();
          if (data?.error) msg = String(data.error);
        } catch {
          /* noop */
        }
        throw new Error(msg);
      }

      if (isCreate) {
        const result = await res.json().catch(() => ({}));
        const newKey = (result?.itemKey as string) || payload._key;
        const newItem: ProcurementItem = {
          _key: newKey,
          name: payload.name || "",
          status: (payload.status as string) || "pending",
          orderDate: payload.orderDate || null,
          expectedDeliveryDate: payload.expectedDeliveryDate || null,
          installDate: payload.installDate || null,
          trackingNumber: payload.trackingNumber || null,
          vendor: payload.vendor || null,
          manufacturer: payload.manufacturer || null,
          qty: payload.qty ?? null,
          notes: payload.notes || null,
          carrierETA: payload.carrierETA || null,
          carrierName: payload.carrierName || null,
          trackingUrl: payload.trackingUrl || null,
          lastSyncAt: null,
          syncSource: null,
          retrievedStatus: null,
          productUrl: payload.productUrl || null,
          itemUrl: payload.itemUrl || null,
          images: payload.images || [],
        };
        setLocalItems((prev) => [...prev, newItem]);
        setModalState((s) => ({ ...s, item: newItem }));
      } else {
        let updatedItem: ProcurementItem | null = null;
        setLocalItems((prev) =>
          prev.map((i) => {
            if (i._key !== payload._key) return i;
            updatedItem = {
              ...i,
              name: payload.name || i.name,
              vendor: payload.vendor ?? i.vendor,
              manufacturer: payload.manufacturer ?? i.manufacturer,
              qty: payload.qty ?? i.qty,
              orderDate: payload.orderDate ?? i.orderDate,
              expectedDeliveryDate:
                payload.expectedDeliveryDate ?? i.expectedDeliveryDate,
              installDate: payload.installDate ?? i.installDate,
              trackingNumber: payload.trackingNumber ?? i.trackingNumber,
              carrierName: payload.carrierName ?? i.carrierName,
              notes: payload.notes ?? i.notes,
              status: payload.status ?? i.status,
              productUrl: payload.productUrl ?? i.productUrl,
              itemUrl: payload.itemUrl ?? i.itemUrl,
              images: payload.images ?? i.images,
            };
            return updatedItem;
          }),
        );
        if (updatedItem) {
          setModalState((s) => ({ ...s, item: updatedItem }));
        }
      }
    },
    [modalState.mode, projectId],
  );

  const handleModalDelete = useCallback(
    async (itemKey: string) => {
      const item = localItems.find((i) => i._key === itemKey);
      const itemName = item?.name || "Unknown";
      const res = await fetch("/api/admin/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          projectId,
          itemKey,
          itemName,
        }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setLocalItems((prev) => prev.filter((i) => i._key !== itemKey));
    },
    [localItems, projectId],
  );

  function truncateTracking(num: string): string {
    return num.length > 12 ? num.slice(0, 12) + "..." : num;
  }

  function renderTrackingLink(item: ProcurementItem) {
    const stop = (e: React.MouseEvent) => e.stopPropagation();
    if (item.trackingUrl) {
      return (
        <a
          href={item.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stop}
          aria-label={`Tracking ${item.trackingNumber || item.carrierName || ""}`}
          className="text-[11.5px] underline hover:opacity-70"
          style={{ color: "#9A7B4B", fontFamily: "var(--font-sans)" }}
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
            onClick={stop}
            className="text-[11.5px] underline hover:opacity-70"
            style={{ color: "#9A7B4B", fontFamily: "var(--font-sans)" }}
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

  function renderStatusDropdown(item: ProcurementItem) {
    const isOpen = statusDropdownKey === item._key;
    const isSaving = savingStatus === item._key;
    const pill = STATUS_PILL_STYLES[item.status] || STATUS_PILL_STYLES.pending;

    return (
      <>
        <button
          type="button"
          ref={isOpen ? dropdownTriggerRef : undefined}
          aria-label={STATUS_LABELS[item.status] || item.status}
          onClick={(e) => {
            e.stopPropagation();
            if (isOpen) {
              setStatusDropdownKey(null);
              setDropdownAnchorRect(null);
            } else {
              setDropdownAnchorRect(
                (e.currentTarget as HTMLButtonElement).getBoundingClientRect(),
              );
              setStatusDropdownKey(item._key);
            }
          }}
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
        {isOpen &&
          dropdownAnchorRect &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={dropdownMenuRef}
              className="rounded-lg shadow-lg py-1 min-w-[140px]"
              style={{
                position: "absolute",
                top: dropdownAnchorRect.bottom + window.scrollY + 4,
                left: dropdownAnchorRect.left + window.scrollX,
                backgroundColor: "#FFFEFB",
                border: "0.5px solid #E8DDD0",
                zIndex: 50,
              }}
              role="listbox"
              onClick={(e) => e.stopPropagation()}
            >
              {STATUS_ORDER.map((s) => {
                const sPill = STATUS_PILL_STYLES[s];
                return (
                  <button
                    key={s}
                    type="button"
                    role="option"
                    aria-selected={item.status === s}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(item._key, s);
                    }}
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
            </div>,
            document.body,
          )}
      </>
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
        data-procurement-row
        role="button"
        tabIndex={0}
        aria-label={`View ${item.name || "item"}`}
        className="cursor-pointer hover:bg-[#FAF7F2]"
        style={{ borderBottom: "0.5px solid #E8DDD0" }}
        onClick={() => handleRowClick(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleRowClick(item);
          }
        }}
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
        {/* Expected install: Expected + Carrier ETA */}
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
        {/* Track */}
        <td className="hidden sm:table-cell" style={{ padding: "12px 16px" }}>
          {renderTrackingLink(item)}
        </td>
        {/* Actions */}
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          <div className="flex items-center justify-center gap-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget({ key: item._key, name: item.name });
              }}
              aria-label="Delete item"
              className="p-2 rounded-md text-stone-light hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {canRefresh && (
              <>
                {refreshingKey === item._key ? (
                  <div className="p-2">
                    <Loader2
                      className="w-3.5 h-3.5 animate-spin"
                      style={{ color: "#9A7B4B" }}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleForceRefresh(item._key, item.trackingNumber!);
                    }}
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

  const modalItem: ProcurementItemModalItem | null = modalState.item
    ? {
        _key: modalState.item._key,
        _type: "procurementItem",
        name: modalState.item.name,
        vendor: modalState.item.vendor,
        manufacturer: modalState.item.manufacturer ?? null,
        qty: modalState.item.qty ?? null,
        status: modalState.item.status,
        orderDate: modalState.item.orderDate,
        expectedDeliveryDate: modalState.item.expectedDeliveryDate,
        installDate: modalState.item.installDate,
        trackingNumber: modalState.item.trackingNumber,
        carrierName: modalState.item.carrierName,
        carrierETA: modalState.item.carrierETA,
        trackingUrl: modalState.item.trackingUrl,
        productUrl: modalState.item.productUrl ?? null,
        itemUrl: modalState.item.itemUrl ?? null,
        notes: modalState.item.notes,
        lastSyncAt: modalState.item.lastSyncAt,
        syncSource: modalState.item.syncSource,
        retrievedStatus: modalState.item.retrievedStatus,
        // Normalize GROQ's flat `assetRef` projection into the nested
        // `asset: { _ref, _type: "reference" }` shape expected by the gallery,
        // the modal payload, and the /api/admin/procurement validator. New
        // uploads from the gallery already produce the nested form.
        images: (modalState.item.images || []).map((img) => {
          const existingRef =
            (img.asset as { _ref?: string } | undefined)?._ref ||
            (img as { assetRef?: string }).assetRef ||
            "";
          return {
            _key: img._key,
            _type: img._type || "image",
            asset: { _type: "reference" as const, _ref: existingRef },
            url: img.url,
            isPrimary: img.isPrimary,
            caption: img.caption ?? null,
          };
        }),
      }
    : null;

  return (
    <>
      {/* Section header with Add item action */}
      <div className="flex items-center justify-between mb-3">
        <h2
          className="font-semibold"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "#2C2520",
            letterSpacing: "0.02em",
          }}
        >
          Procurement
        </h2>
        <button
          type="button"
          onClick={handleAddItemClick}
          aria-label="Add item"
          className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
          style={{ color: "#9A7B4B", fontFamily: "var(--font-sans)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>

      <div
        className="rounded-[10px] overflow-hidden"
        style={{ backgroundColor: "#FFFEFB", border: "0.5px solid #E8DDD0" }}
      >
        {localItems.length === 0 && (
          <div className="py-8 px-5 text-center">
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12.5px",
                color: "#9E8E80",
              }}
            >
              No procurement items yet
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                color: "#9E8E80",
              }}
            >
              Use the + Add item button above to add items as they are ordered
              for this project.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            {localItems.length > 0 && (
              <thead>
                <tr
                  style={{
                    backgroundColor: "#F3EDE3",
                    borderBottom: "0.5px solid #D4C8B8",
                  }}
                >
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
                    EXPECTED INSTALL
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
                  <th style={{ padding: "11px 16px", width: "80px" }}></th>
                </tr>
              </thead>
            )}
            <tbody>
              {localItems.map((item) => renderReadRow(item))}
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

      <ProcurementItemModal
        open={modalState.open}
        mode={modalState.mode}
        item={modalItem}
        onClose={() =>
          setModalState((s) => ({ ...s, open: false, item: null }))
        }
        onModeChange={(mode) =>
          setModalState((s) => ({ ...s, mode }))
        }
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </>
  );
}

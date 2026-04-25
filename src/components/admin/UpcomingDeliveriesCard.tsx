import { useState } from "react";
import { format, parseISO } from "date-fns";

// Phase 35 Plan 02 — UpcomingDeliveriesCard
// Source of truth: .planning/phases/35-dashboard-polish-global-ux-cleanup/35-UI-SPEC.md
// Requirements: DASH-11..15; CONTEXT D-01..D-11
//
// Client-side React island replacing the inline Astro Deliveries card on
// /admin/dashboard. Owns:
//   - Filter state (free-text, case-insensitive substring match over
//     client/item/project/tracking/carrier). Live per-keystroke, no debounce.
//   - Delivered-history disclosure state (Show delivered (N) ↔ Hide delivered).
//   - Carrier-ETA rendering gated on Ship24 carrier ∈ {fedex, ups, usps}.
//   - Row visual order: client name (lead) → item → project; status/ETA right.
// State resets on reload (useState only, no persistence).

export interface DeliveryRow {
  _id: string;
  name: string;
  clientName: string | null;
  projectTitle: string;
  projectId: string;
  expectedDeliveryDate: string | null;
  status: string;
  delivered: boolean;
  trackingNumber?: string | null;
  carrier?: string | null;
}

interface Props {
  deliveries: DeliveryRow[];
}

const DELIVERY_STATUS: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  ordered: {
    label: "Ordered",
    bg: "bg-stone-100",
    text: "text-stone-500",
    dot: "bg-stone-400",
  },
  warehouse: {
    label: "Warehouse",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  "in-transit": {
    label: "In Transit",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
};

// Ship24 carriers we render ETA for (per D-07). Lowercase keys for matching;
// display values are the mixed-case labels in the copywriting contract.
const TRACKED_CARRIERS: Record<string, string> = {
  fedex: "FedEx",
  ups: "UPS",
  usps: "USPS",
};

function formatETADate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), "MMM d");
  } catch {
    return null;
  }
}

function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return parseISO(iso).getTime() < start.getTime();
  } catch {
    return false;
  }
}

export default function UpcomingDeliveriesCard({ deliveries }: Props) {
  const [showDelivered, setShowDelivered] = useState<boolean>(false);

  const deliveredCount = deliveries.filter((d) => d.delivered).length;
  const undeliveredRows = deliveries.filter((d) => !d.delivered);
  const deliveredRows = deliveries.filter((d) => d.delivered);

  const visibleRows = showDelivered
    ? [...undeliveredRows, ...deliveredRows]
    : undeliveredRows;

  const emptyCopy =
    undeliveredRows.length === 0
      ? "All caught up — no undelivered items."
      : null;

  const renderRow = (d: DeliveryRow) => {
    const statusInfo = DELIVERY_STATUS[d.status];
    const carrierKey = (d.carrier ?? "").toLowerCase();
    const carrierLabel = TRACKED_CARRIERS[carrierKey];
    const etaDate = formatETADate(d.expectedDeliveryDate);
    const overdue = !d.delivered && isOverdue(d.expectedDeliveryDate);
    const supportingParts = [d.clientName, d.projectTitle].filter(
      (s): s is string => Boolean(s),
    );

    return (
      <a
        key={d._id}
        href={`/admin/projects/${d.projectId}#procurement`}
        className="flex items-center gap-3 px-5 py-3 hover:bg-cream/50 transition-colors border-b border-stone-light/10 last:border-b-0"
      >
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-charcoal block truncate">
            {d.name}
          </span>
          {supportingParts.length > 0 && (
            <span className="text-[11.5px] text-stone block truncate mt-0.5">
              {supportingParts.join(" · ")}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {etaDate ? (
            <span
              className={`text-[11.5px] font-body ${
                overdue ? "text-red-600 font-semibold" : "text-stone"
              }`}
            >
              {overdue ? "Overdue · " : ""}
              {etaDate}
              {carrierLabel ? ` · ${carrierLabel}` : ""}
            </span>
          ) : null}
          {statusInfo ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.text}`}
            >
              <span className={`w-[5px] h-[5px] rounded-full ${statusInfo.dot}`}></span>
              {statusInfo.label}
            </span>
          ) : null}
        </div>
      </a>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-stone-light/40 overflow-hidden">
      {/* Header — see global.css .card-header for tokens. */}
      <div className="card-header flex items-center justify-between gap-3 px-5 h-[42px]">
        <h2 className="card-header-label">Upcoming Deliveries</h2>
      </div>

      {/* Row list or empty state */}
      {emptyCopy ? (
        <p className="text-sm text-stone text-center py-6">{emptyCopy}</p>
      ) : (
        <div>{visibleRows.map(renderRow)}</div>
      )}

      {/* Reveal link: bottom of card body */}
      {deliveredCount > 0 ? (
        <div className="border-t border-stone-light/10 text-center py-3">
          <button
            type="button"
            onClick={() => setShowDelivered((v) => !v)}
            className="text-[13px] font-body text-stone hover:text-charcoal hover:underline underline-offset-2 cursor-pointer bg-transparent border-0"
          >
            {showDelivered
              ? "Hide delivered"
              : `Show delivered (${deliveredCount})`}
          </button>
        </div>
      ) : null}
    </div>
  );
}

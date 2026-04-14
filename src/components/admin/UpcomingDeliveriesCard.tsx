import { useState } from "react";
import { format, parseISO } from "date-fns";
import CardFilterInput from "./ui/CardFilterInput";

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

function rowMatchesFilter(row: DeliveryRow, needle: string): boolean {
  if (!needle) return true;
  const q = needle.toLowerCase();
  const fields = [
    row.name ?? "",
    row.clientName ?? "",
    row.projectTitle ?? "",
    row.trackingNumber ?? "",
    row.carrier ?? "",
  ];
  return fields.some((f) => f.toLowerCase().includes(q));
}

export default function UpcomingDeliveriesCard({ deliveries }: Props) {
  const [filter, setFilter] = useState<string>("");
  const [showDelivered, setShowDelivered] = useState<boolean>(false);

  const deliveredCount = deliveries.filter((d) => d.delivered).length;
  const undeliveredRows = deliveries.filter((d) => !d.delivered);
  const deliveredRows = deliveries.filter((d) => d.delivered);

  const visibleUndelivered = undeliveredRows.filter((r) =>
    rowMatchesFilter(r, filter),
  );
  const visibleDelivered = showDelivered
    ? deliveredRows.filter((r) => rowMatchesFilter(r, filter))
    : [];

  const visibleRows = [...visibleUndelivered, ...visibleDelivered];

  // Empty states per copywriting contract
  let emptyCopy: string | null = null;
  if (visibleRows.length === 0) {
    if (filter.trim().length > 0) {
      emptyCopy = "No deliveries match your filter.";
    } else if (undeliveredRows.length === 0 && !showDelivered) {
      emptyCopy = "All caught up — no undelivered items.";
    } else if (undeliveredRows.length === 0 && showDelivered) {
      // All outstanding gone and delivered filtered away
      emptyCopy = "All caught up — no undelivered items.";
    }
  }

  const renderRow = (d: DeliveryRow) => {
    const statusInfo = DELIVERY_STATUS[d.status];
    const carrierKey = (d.carrier ?? "").toLowerCase();
    const carrierLabel = TRACKED_CARRIERS[carrierKey];
    const etaDate = formatETADate(d.expectedDeliveryDate);
    const showETA = Boolean(carrierLabel && etaDate);

    return (
      <a
        key={d._id}
        href={`/admin/projects/${d.projectId}#procurement`}
        className="flex items-center gap-3 px-5 py-3 hover:bg-cream/50 transition-colors border-b border-stone-light/10 last:border-b-0"
      >
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-charcoal block truncate">
            {d.clientName ?? ""}
          </span>
          <span className="text-[11px] text-stone-light block truncate">
            {d.name}
          </span>
          <span className="text-[11px] text-stone-light block truncate">
            {d.projectTitle}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {statusInfo ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.text}`}
            >
              <span className={`w-[5px] h-[5px] rounded-full ${statusInfo.dot}`}></span>
              {statusInfo.label}
            </span>
          ) : null}
          {showETA ? (
            <span className="text-[11px] font-body text-stone-light">
              ETA {etaDate} · {carrierLabel}
            </span>
          ) : null}
        </div>
      </a>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-stone-light/40 overflow-hidden">
      {/* Header: title + filter input. Matches the Active Projects card header rhythm per UI-SPEC "Inherited Exceptions". */}
      <div className="px-5 pt-[18px] pb-0">
        <h2
          className="mb-[14px]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "10.5px",
            fontWeight: 500,
            color: "#9E8E80",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Upcoming Deliveries
        </h2>
        <hr
          style={{
            border: "none",
            borderTop: "0.5px solid #E8DDD0",
            margin: 0,
          }}
        />
        <div className="py-3">
          <CardFilterInput
            value={filter}
            onChange={setFilter}
            placeholder="Filter deliveries…"
            ariaLabel="Filter deliveries"
          />
        </div>
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

import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { formatTrade } from "../../lib/trades";
import { formatPhone } from "../../lib/format";
import { relationshipLabel } from "../../lib/relationshipLabel";

interface EntityListPageProps {
  entityType: "client" | "contractor";
  entities: Array<Record<string, any>>;
}

type SortDirection = "asc" | "desc";

const CLIENT_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
];

const CONTRACTOR_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "relationship", label: "Type" },
  { key: "company", label: "Company" },
  { key: "trades", label: "Trade" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
];

export default function EntityListPage({ entityType, entities }: EntityListPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const columns = entityType === "client" ? CLIENT_COLUMNS : CONTRACTOR_COLUMNS;
  // `label` is used for the New-record CTA ("New Contractor / Vendor") — the
  // one place the ambiguous collective label is intentional per UI-SPEC. The
  // form then forces the choice via the Relationship radio group.
  const label = entityType === "client" ? "Client" : "Contractor / Vendor";

  function handleSort(columnKey: string) {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  }

  const filteredAndSorted = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = entities;

    if (query.length >= 1) {
      result = result.filter((entity) => {
        const name = (entity.name || "").toLowerCase();
        const email = (entity.email || "").toLowerCase();
        const phone = (entity.phone || "").toLowerCase();
        const company = (entity.company || "").toLowerCase();
        const city = (entity.address?.city || "").toLowerCase();
        const state = (entity.address?.state || "").toLowerCase();
        const trades = Array.isArray(entity.trades)
          ? [...entity.trades, ...entity.trades.map(formatTrade)]
              .join(" ")
              .toLowerCase()
          : "";
        const relationshipMatch =
          entityType === "contractor" &&
          relationshipLabel((entity as any).relationship)
            .toLowerCase()
            .includes(query);
        return (
          name.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          company.includes(query) ||
          city.includes(query) ||
          state.includes(query) ||
          trades.includes(query) ||
          relationshipMatch
        );
      });
    }

    result = [...result].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

      if (sortColumn === "address") {
        aVal = a.address?.city ?? "";
        bVal = b.address?.city ?? "";
      } else {
        aVal = a[sortColumn];
        bVal = b[sortColumn];
      }

      if (Array.isArray(aVal)) aVal = aVal.join(", ");
      if (Array.isArray(bVal)) bVal = bVal.join(", ");

      const aStr = (aVal || "").toString().toLowerCase();
      const bStr = (bVal || "").toString().toLowerCase();

      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [entities, searchQuery, sortColumn, sortDirection]);

  function formatTrades(trades: string[] | undefined): React.ReactNode {
    if (!trades || trades.length === 0) return <span className="text-stone-light">--</span>;
    const visible = trades.slice(0, 3);
    const remaining = trades.length - 3;
    return (
      <span className="text-stone">
        {visible.map((slug) => formatTrade(slug)).join(", ")}
        {remaining > 0 && <span className="text-stone-light"> +{remaining} more</span>}
      </span>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-light/40 overflow-hidden">
      {/* Header: Search + New button */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-light/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-light" />
          <input
            type="text"
            placeholder={entityType === "contractor" ? "Search trades..." : `Search ${entityType}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm font-body bg-white border border-stone-light/40 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
          />
        </div>
        <a
          href={entityType === "contractor" ? "/admin/trades/new" : `/admin/${entityType}s/new`}
          className="bg-terracotta text-white text-sm font-semibold font-body px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors inline-block"
        >
          New {label}
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((col) => {
                const isActive = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2 border-b border-stone-light/20 bg-cream/50 cursor-pointer select-none ${
                      isActive ? "text-charcoal" : "text-stone"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isActive && (
                        sortDirection === "asc"
                          ? <ChevronUp className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <p className="text-sm text-stone font-body font-semibold">
                    {entityType === "client" ? "No clients yet" : "No trades yet"}
                  </p>
                  <p className="text-sm text-stone font-body mt-1">
                    {entityType === "client"
                      ? "Create your first client record to start tracking contacts and project assignments."
                      : "Add your first contractor or vendor to manage trades, documents, and project assignments."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((entity) => (
                <tr
                  key={entity._id}
                  onClick={() => {
                    window.location.href = entityType === "contractor"
                      ? `/admin/trades/${entity._id}`
                      : `/admin/${entityType}s/${entity._id}`;
                  }}
                  className="text-sm font-body text-charcoal border-b border-stone-light/10 hover:bg-cream/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium text-charcoal">
                    {entity.name || "--"}
                  </td>
                  {entityType === "client" ? (
                    <>
                      <td className="px-5 py-3 text-stone">
                        {entity.address?.city || entity.address?.state ? (
                          <span>
                            {[entity.address?.city, entity.address?.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="text-stone-light">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-stone">{entity.email || "--"}</td>
                      <td className="px-5 py-3 text-stone">{formatPhone(entity.phone) || "--"}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-stone font-body text-sm">
                        {relationshipLabel((entity as any).relationship)}
                      </td>
                      <td className="px-5 py-3 text-stone">
                        {entity.company || "--"}
                      </td>
                      <td className="px-5 py-3">
                        {formatTrades(entity.trades)}
                      </td>
                      <td className="px-5 py-3 text-stone">{entity.email || "--"}</td>
                      <td className="px-5 py-3 text-stone">{formatPhone(entity.phone) || "--"}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Row count for large lists */}
      {filteredAndSorted.length > 50 && (
        <div className="text-xs text-stone-light py-2 text-center border-t border-stone-light/10">
          Showing {filteredAndSorted.length} of {entities.length}
        </div>
      )}
    </div>
  );
}

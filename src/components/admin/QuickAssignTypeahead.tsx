import { useState, useRef, useCallback, useEffect } from "react";
import { formatTrade } from "../../lib/trades";

interface ExistingClient {
  _id: string;
  name: string;
}

interface ExistingContractor {
  _id: string;
  name: string;
  trade?: string;
}

interface SearchResult {
  _id: string;
  name: string;
  email: string;
  trades?: string[];
  entityType: "client" | "contractor";
}

interface QuickAssignTypeaheadProps {
  projectId: string;
  existingClients: ExistingClient[];
  existingContractors: ExistingContractor[];
}

type State =
  | "idle"
  | "searching"
  | "results"
  | "selectingTrade"
  | "assigning"
  | "assigned";

export default function QuickAssignTypeahead({
  projectId,
  existingClients,
  existingContractors,
}: QuickAssignTypeaheadProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [state, setState] = useState<State>("idle");
  const [selectedContractor, setSelectedContractor] =
    useState<SearchResult | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const existingClientIds = new Set(existingClients.map((c) => c._id));
  const existingContractorIds = new Set(
    existingContractors.map((c) => c._id),
  );

  const fetchResults = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 1) {
        setResults([]);
        setState("idle");
        return;
      }

      setState("searching");

      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(searchQuery)}`,
        );
        if (!res.ok) {
          setResults([]);
          setState("results");
          return;
        }

        const data = await res.json();

        // Merge clients and contractors, filter out already-assigned
        const merged: SearchResult[] = [
          ...(data.clients || [])
            .filter((c: SearchResult) => !existingClientIds.has(c._id))
            .map((c: SearchResult) => ({ ...c, entityType: "client" as const })),
          ...(data.contractors || [])
            .filter((c: SearchResult) => !existingContractorIds.has(c._id))
            .map((c: SearchResult) => ({
              ...c,
              entityType: "contractor" as const,
            })),
        ];

        setResults(merged);
        setState("results");
      } catch {
        setResults([]);
        setState("results");
      }
    },
    [existingClientIds, existingContractorIds],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSelectedContractor(null);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.length < 1) {
        setResults([]);
        setState("idle");
        return;
      }

      // 250ms debounce
      debounceRef.current = setTimeout(() => {
        fetchResults(value);
      }, 250);
    },
    [fetchResults],
  );

  const showConfirmation = useCallback((name: string) => {
    setConfirmMessage(`${name} assigned`);
    setState("assigned");
    setQuery("");
    setResults([]);
    setSelectedContractor(null);

    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => {
      setConfirmMessage("");
      setState("idle");
    }, 2000);
  }, []);

  const assignClient = useCallback(
    async (entity: SearchResult) => {
      setState("assigning");
      try {
        const res = await fetch("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "assign-to-project",
            projectId,
            clientId: entity._id,
          }),
        });

        if (!res.ok) throw new Error("Failed to assign");
        showConfirmation(entity.name);
      } catch {
        setState("results");
      }
    },
    [projectId, showConfirmation],
  );

  const assignContractor = useCallback(
    async (entity: SearchResult, trade: string) => {
      setState("assigning");
      try {
        const res = await fetch("/api/admin/contractors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "assign-to-project",
            projectId,
            contractorId: entity._id,
            trade,
          }),
        });

        if (!res.ok) throw new Error("Failed to assign");
        showConfirmation(entity.name);
      } catch {
        setState("results");
      }
    },
    [projectId, showConfirmation],
  );

  const handleSelect = useCallback(
    (entity: SearchResult) => {
      if (entity.entityType === "client") {
        assignClient(entity);
      } else {
        // Contractor -- show trade selection
        setSelectedContractor(entity);
        setState("selectingTrade");
      }
    },
    [assignClient],
  );

  const handleTradeSelect = useCallback(
    (trade: string) => {
      if (!selectedContractor) return;
      assignContractor(selectedContractor, trade);
    },
    [selectedContractor, assignContractor],
  );

  const showDropdown =
    query.length >= 1 &&
    (state === "results" || state === "searching") &&
    !selectedContractor;

  return (
    <div className="relative">
      {/* Input */}
      <input
        ref={inputRef}
        id="quick-assign-input"
        type="text"
        placeholder="Assign a client or contractor..."
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        disabled={state === "assigning"}
        className="w-72 outline-none focus:outline-none"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "12.5px",
          color: "#2C2520",
          backgroundColor: "#FDFBF8",
          border: "0.5px solid #D4C8B8",
          borderRadius: "6px",
          padding: "6px 12px",
        }}
      />

      {/* Dropdown results */}
      {showDropdown && (
        <div className="absolute z-40 bg-white border border-stone-light/30 rounded-lg shadow-md mt-1 w-72 max-h-48 overflow-y-auto">
          {state === "searching" && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-stone font-body">
              Searching...
            </div>
          )}
          {state === "results" && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-stone italic font-body">
              No matches found
            </div>
          )}
          {results.map((entity) => (
            <button
              key={`${entity.entityType}-${entity._id}`}
              type="button"
              onClick={() => handleSelect(entity)}
              className="w-full text-left px-3 py-2 text-sm font-body text-charcoal hover:bg-cream cursor-pointer flex items-center justify-between"
            >
              <span className="truncate">{entity.name}</span>
              <span className="text-[11px] font-semibold uppercase text-stone-light ml-2 shrink-0">
                {entity.entityType === "client" ? "CLIENT" : "CONTRACTOR"}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Trade selection dropdown for contractors */}
      {state === "selectingTrade" && selectedContractor && (
        <div className="absolute z-40 bg-white border border-stone-light/30 rounded-lg shadow-md mt-1 w-72 max-h-48 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold text-stone uppercase tracking-wider border-b border-stone-light/10">
            Assign for which trade?
          </div>
          {(selectedContractor.trades || []).map((trade) => (
            <button
              key={trade}
              type="button"
              onClick={() => handleTradeSelect(trade)}
              className="w-full text-left px-3 py-2 text-sm font-body text-charcoal hover:bg-cream cursor-pointer"
            >
              {formatTrade(trade)}
            </button>
          ))}
          {(!selectedContractor.trades ||
            selectedContractor.trades.length === 0) && (
            <div className="px-3 py-2 text-sm text-stone italic font-body">
              No trades listed
            </div>
          )}
        </div>
      )}

      {/* Confirmation message */}
      {state === "assigned" && confirmMessage && (
        <div className="text-xs text-emerald-600 font-body mt-1">
          {confirmMessage}
        </div>
      )}
    </div>
  );
}

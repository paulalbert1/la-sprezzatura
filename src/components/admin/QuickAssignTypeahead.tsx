import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

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

  const showConfirmation = useCallback(
    (name: string, tradeLabel?: string) => {
      // Phase 35 Plan 04 (DASH-18): when a single-trade bypass fires, the
      // confirmation copy carries the formatted trade label so the user gets
      // immediate feedback about what was assigned. Multi-trade and client
      // assignments fall back to the original "{name} assigned" copy.
      const message = tradeLabel
        ? `Assigned ${name} as ${tradeLabel}.`
        : `${name} assigned`;
      setConfirmMessage(message);
      setState("assigned");
      setQuery("");
      setResults([]);
      setSelectedContractor(null);

      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmMessage("");
        setState("idle");
      }, 2000);
    },
    [],
  );

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
        showConfirmation(entity.name, formatTrade(trade));
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
        return;
      }
      // Contractor branch.
      // Phase 35 Plan 04 (DASH-18 / D-13): when the contractor has exactly
      // one trade, skip the trade-picker step and assign directly. The
      // confirmation surfaces the formatted trade label via showConfirmation.
      if (entity.trades && entity.trades.length === 1) {
        void assignContractor(entity, entity.trades[0]);
        return;
      }
      // 0 trades or 2+ trades: fall through to the picker so the user can
      // either see the existing "No trades listed" fallback or pick one.
      setSelectedContractor(entity);
      setState("selectingTrade");
    },
    [assignClient, assignContractor],
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

  const showTradeDropdown = state === "selectingTrade" && Boolean(selectedContractor);

  // Capture input rect whenever a dropdown surface needs to render. Portaled
  // surfaces are positioned via this rect, so they escape any overflow:hidden
  // ancestor (cards on the project detail page have rounded clipping wrappers).
  useEffect(() => {
    if (showDropdown || showTradeDropdown) {
      setAnchorRect(inputRef.current?.getBoundingClientRect() ?? null);
    } else {
      setAnchorRect(null);
    }
  }, [showDropdown, showTradeDropdown]);

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

      {/* Dropdown results — portaled so it escapes overflow:hidden ancestors. */}
      {showDropdown &&
        anchorRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="bg-white border border-stone-light/30 rounded-lg shadow-md w-72 max-h-48 overflow-y-auto"
            style={{
              position: "absolute",
              top: anchorRect.bottom + window.scrollY + 4,
              left: anchorRect.left + window.scrollX,
              zIndex: 50,
            }}
          >
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
          </div>,
          document.body,
        )}

      {/* Trade selection dropdown — portaled */}
      {showTradeDropdown &&
        selectedContractor &&
        anchorRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="bg-white border border-stone-light/30 rounded-lg shadow-md w-72 max-h-48 overflow-y-auto"
            style={{
              position: "absolute",
              top: anchorRect.bottom + window.scrollY + 4,
              left: anchorRect.left + window.scrollX,
              zIndex: 50,
            }}
          >
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
          </div>,
          document.body,
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

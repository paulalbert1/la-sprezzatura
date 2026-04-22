import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";

// Phase 40 — VEND-03 — Trades catalog CRUD component
// Source of truth: .planning/phases/40-contractor-vendor-rename-trades-crud-1099-support/40-UI-SPEC.md

export interface TradesCatalogSectionProps {
  trades: string[];
  onChange: (next: string[]) => void;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label
      className="block mb-1 uppercase"
      style={{
        fontSize: "11.5px",
        letterSpacing: "0.04em",
        fontWeight: 600,
        color: "#6B5E52",
      }}
    >
      {children}
    </label>
  );
}

export default function TradesCatalogSection({ trades, onChange }: TradesCatalogSectionProps) {
  const [newTrade, setNewTrade] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  function handleAdd() {
    const trimmed = newTrade.trim();
    if (!trimmed) return;
    const isDuplicate = trades.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setAddError("A trade with that name already exists.");
      return;
    }
    onChange([...trades, trimmed]);
    setNewTrade("");
    setAddError(null);
  }

  function handleRenameStart(idx: number) {
    setRenamingIdx(idx);
    setRenameValue(trades[idx]);
  }

  function handleRenameSave(idx: number) {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    const next = [...trades];
    next[idx] = trimmed;
    onChange(next);
    setRenamingIdx(null);
  }

  function handleDelete(idx: number) {
    const next = trades.filter((_, i) => i !== idx);
    onChange(next);
    setConfirmDeleteIdx(null);
  }

  return (
    <div className="flex flex-col" style={{ gap: "20px" }}>
      <div>
        <FieldLabel>Trades Catalog</FieldLabel>
        <p style={{ fontSize: "11.5px", color: "#9E8E80", marginBottom: "12px" }}>
          Trades shown as pills on contractor records and in the trade picker. Renaming a trade replaces the stored value everywhere — the new name will appear on all contractor records that had the old trade.
        </p>

        {trades.length === 0 ? (
          <div className="py-4 px-4 border border-stone-light/20 rounded-lg bg-cream/30 text-center mb-3">
            <p className="text-sm font-semibold font-body text-stone">No trades yet</p>
            <p className="text-sm font-body text-stone mt-1">
              Add your first trade below to populate the contractor edit form.
            </p>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: "6px", marginBottom: "12px" }}>
            {trades.map((trade, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-stone-light/20 bg-white"
              >
                {renamingIdx === idx ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); handleRenameSave(idx); }
                        if (e.key === "Escape") setRenamingIdx(null);
                      }}
                      placeholder="Trade name"
                      aria-label="Rename trade"
                      className="text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-md px-2 py-1 flex-1 focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleRenameSave(idx)}
                      aria-label="Save trade name"
                      className="text-stone hover:text-terracotta transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingIdx(null)}
                      aria-label="Cancel rename"
                      className="text-stone hover:text-charcoal transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-body text-charcoal">{trade}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRenameStart(idx)}
                        aria-label="Rename trade"
                        className="text-stone-light hover:text-stone transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIdx(idx)}
                        aria-label="Delete trade"
                        className="text-stone-light hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add-trade input */}
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={newTrade}
              onChange={(e) => { setNewTrade(e.target.value); setAddError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              placeholder="e.g. General contractor"
              className={`text-sm font-body text-charcoal bg-white border rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none ${addError ? "border-red-400 ring-1 ring-red-400" : "border-stone-light/40"}`}
            />
            {addError && (
              <p className="text-xs text-red-600 mt-1">{addError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="text-sm font-semibold text-white bg-terracotta hover:bg-terracotta/90 px-4 py-2 rounded-lg transition-colors font-body whitespace-nowrap"
          >
            Add trade
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteIdx !== null && (
        <div className="fixed inset-0 bg-charcoal/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold font-body text-charcoal">Delete trade?</h3>
              <button
                type="button"
                onClick={() => setConfirmDeleteIdx(null)}
                className="text-stone hover:text-charcoal"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-stone font-body mb-6">
              Contractors currently assigned to &ldquo;{trades[confirmDeleteIdx]}&rdquo; will keep this trade on their record. It will no longer appear in the trade picker.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteIdx(null)}
                className="text-sm text-stone hover:text-charcoal px-4 py-2 rounded-lg border border-stone-light/40 font-body"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteIdx)}
                className="text-sm font-semibold text-white bg-destructive hover:bg-destructive/90 px-4 py-2 rounded-lg font-body"
              >
                Delete trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";

// Phase 43 Plan 03 — TRAD-08 — Checklist config CRUD section
// Source of truth:
//   .planning/phases/43-document-checklists-settings-config-and-completeness/43-UI-SPEC.md § Settings Config Interaction
//   .planning/phases/43-document-checklists-settings-config-and-completeness/43-PATTERNS.md § ChecklistConfigSection
//
// Direct structural template: src/components/admin/TradesCatalogSection.tsx
// Deltas from the template:
//   - Adds `inUseTypes: Set<string>` prop that drives a delete guard (D-15).
//   - Variant prop switches FieldLabel + helper copy between contractor/vendor.
//   - Disabled delete button is wrapped in a <span> carrying the D-15 tooltip
//     via `title` (Pitfall 5: Firefox suppresses tooltips on disabled buttons).

export interface ChecklistConfigSectionProps {
  items: string[];
  inUseTypes: Set<string>;
  onChange: (next: string[]) => void;
  variant?: "contractor" | "vendor";
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

export default function ChecklistConfigSection({
  items,
  inUseTypes,
  onChange,
  variant = "contractor",
}: ChecklistConfigSectionProps) {
  const [newItem, setNewItem] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  const fieldLabel =
    variant === "vendor" ? "Vendor Checklist Items" : "Contractor Checklist Items";
  const label = variant === "vendor" ? "Vendor" : "Contractor";
  const helperCopy = `Required documents for each ${label} record. Renaming an item replaces the stored type on all records that used the old name. An item with any uploaded document cannot be deleted.`;
  const emptyHeading = "No checklist items yet";
  const emptyBody = `Add your first checklist item below to populate the ${label} document list.`;
  const tooltipInUse =
    "This type has documents — remove documents from all trades first.";

  function handleAdd() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    const isDuplicate = items.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) {
      setAddError("A checklist item with that name already exists.");
      return;
    }
    onChange([...items, trimmed]);
    setNewItem("");
    setAddError(null);
  }

  function handleRenameStart(idx: number) {
    setRenamingIdx(idx);
    setRenameValue(items[idx]);
  }

  function handleRenameSave(idx: number) {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    const next = [...items];
    next[idx] = trimmed;
    onChange(next);
    setRenamingIdx(null);
  }

  function handleDelete(idx: number) {
    const next = items.filter((_, i) => i !== idx);
    onChange(next);
    setConfirmDeleteIdx(null);
  }

  return (
    <div className="flex flex-col" style={{ gap: "20px" }}>
      <div>
        <FieldLabel>{fieldLabel}</FieldLabel>
        <p
          className="font-body"
          style={{
            fontSize: "11.5px",
            color: "#6B5E52",
            lineHeight: 1.4,
            marginBottom: "12px",
          }}
        >
          {helperCopy}
        </p>

        {items.length === 0 ? (
          <div className="py-4 px-4 border border-stone-light/20 rounded-lg bg-cream/30 text-center mb-3">
            <p className="text-sm font-semibold font-body text-stone">
              {emptyHeading}
            </p>
            <p className="text-sm font-body text-stone mt-1">{emptyBody}</p>
          </div>
        ) : (
          <div
            className="flex flex-col"
            style={{ gap: "6px", marginBottom: "12px" }}
          >
            {items.map((item, idx) => {
              const isInUse = inUseTypes.has(item);
              return (
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
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleRenameSave(idx);
                          }
                          if (e.key === "Escape") setRenamingIdx(null);
                        }}
                        placeholder="Checklist item name"
                        aria-label="Rename checklist item"
                        className="text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-md px-2 py-1 flex-1 focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameSave(idx)}
                        aria-label="Save checklist item name"
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
                      <span className="text-sm font-body text-charcoal">
                        {item}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRenameStart(idx)}
                          aria-label={`Rename ${item}`}
                          className="text-stone-light hover:text-stone transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {/* Pitfall 5: tooltip on wrapper span (not on disabled button). */}
                        <span
                          title={isInUse ? tooltipInUse : undefined}
                          style={{ display: "inline-flex" }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (!isInUse) setConfirmDeleteIdx(idx);
                            }}
                            disabled={isInUse}
                            aria-disabled={isInUse}
                            aria-label={`Delete ${item}`}
                            className={`transition-colors ${
                              isInUse
                                ? "text-stone-light/40 cursor-not-allowed"
                                : "text-stone-light hover:text-destructive"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add-item input */}
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={newItem}
              onChange={(e) => {
                setNewItem(e.target.value);
                setAddError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="New checklist item (e.g., W-9)"
              className={`text-sm font-body text-charcoal bg-white border rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none ${
                addError ? "border-red-400 ring-1 ring-red-400" : "border-stone-light/40"
              }`}
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
            Add item
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteIdx !== null && (
        <div className="fixed inset-0 bg-charcoal/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold font-body text-charcoal">
                Delete checklist item?
              </h3>
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
              &ldquo;{items[confirmDeleteIdx]}&rdquo; will be removed from the
              checklist. Any existing documents stored under this name will move
              to &ldquo;Other documents&rdquo; on each record.
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
                Delete checklist item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

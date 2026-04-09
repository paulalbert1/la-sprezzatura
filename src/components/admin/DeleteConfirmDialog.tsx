import { X, Loader2, AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityType: "client" | "contractor" | "document";
  entityName: string;
  isBlocked?: boolean;
  refCount?: number;
  isLoading?: boolean;
}

const ENTITY_LABELS: Record<string, string> = {
  client: "Client",
  contractor: "Contractor",
  document: "Document",
};

export default function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  entityType,
  entityName,
  isBlocked = false,
  refCount = 0,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  if (!open) return null;

  const entityLabel = ENTITY_LABELS[entityType] || entityType;

  const heading =
    entityType === "document"
      ? "Delete Document"
      : `Delete ${entityLabel}`;

  const bodyText =
    entityType === "document"
      ? `Remove ${entityName}? This cannot be undone.`
      : `Are you sure you want to delete ${entityName}? This action cannot be undone.`;

  const blockedEntity = entityType === "client" ? "client" : "contractor";
  const blockedText = `This ${blockedEntity} is linked to ${refCount} project(s) and cannot be deleted. Remove all project assignments first.`;

  return (
    <div className="fixed inset-0 bg-charcoal/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold font-body text-charcoal">
            {heading}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone hover:text-charcoal"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isBlocked ? (
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-stone font-body">{blockedText}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone font-body mb-6">{bodyText}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          {isBlocked ? (
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-charcoal px-4 py-2 rounded-lg border border-stone-light/40 hover:bg-cream font-body"
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-stone hover:text-charcoal px-4 py-2 rounded-lg border border-stone-light/40 font-body"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg inline-flex items-center gap-2 font-body disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useMemo } from "react";
import { Check, Upload, Trash2, Loader2 } from "lucide-react";
import { relationshipLabel } from "../../lib/relationshipLabel";

export interface DocEntry {
  _key: string;
  fileName: string;
  fileType: string;
  url: string;
  uploadedAt: string;
  docType?: string;
}

export interface TradeChecklistProps {
  contractorId: string;
  checklistItems: string[];
  initialDocuments: DocEntry[];
  relationship?: string | null;
  onDocumentsChange?: (docs: DocEntry[]) => void;
}

/**
 * TradeChecklist — Phase 43 TRAD-06
 *
 * Replaces the flat Documents section in EntityDetailForm with a
 * relationship-scoped checklist. Each checklistItems entry renders one row.
 * Documents whose docType matches a checklist item label (exact string
 * equality, D-08) populate that row; first match wins (D-03). Non-matching
 * documents render under an "Other documents" subheading (D-04).
 *
 * Upload is initiated from a specific row and sends docType = itemLabel
 * (D-06) to the existing /api/admin/contractors upload-doc action.
 *
 * Security:
 * - docType is rendered as JSX text only (React auto-escapes) per T-43-05.
 * - Client re-validates MIME + size before POST (T-43-06 belt-and-suspenders).
 */
export default function TradeChecklist({
  contractorId,
  checklistItems,
  initialDocuments,
  relationship,
  onDocumentsChange,
}: TradeChecklistProps) {
  const [documents, setDocuments] = useState<DocEntry[]>(initialDocuments ?? []);
  const [uploadingForLabel, setUploadingForLabel] = useState<string | null>(null);
  const [deletingDocKey, setDeletingDocKey] = useState<string | null>(null);
  const [errorForLabel, setErrorForLabel] = useState<{
    label: string | null;
    message: string;
  } | null>(null);
  const [deleteErrorKey, setDeleteErrorKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeLabelRef = useRef<string | null>(null);

  const label = relationshipLabel(relationship ?? null);

  const { matched, others } = useMemo(() => {
    const matched = new Map<string, DocEntry>();
    const others: DocEntry[] = [];
    for (const doc of documents) {
      const hit = checklistItems.find((item) => item === doc.docType);
      if (hit && !matched.has(hit)) {
        matched.set(hit, doc);
      } else {
        others.push(doc);
      }
    }
    return { matched, others };
  }, [documents, checklistItems]);

  function triggerUploadForLabel(itemLabel: string) {
    activeLabelRef.current = itemLabel;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const itemLabel = activeLabelRef.current;
    if (!file || !itemLabel) return;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setErrorForLabel({
        label: itemLabel,
        message: "File must be PDF, JPEG, or PNG under 10MB",
      });
      setTimeout(() => setErrorForLabel(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = "";
      activeLabelRef.current = null;
      return;
    }
    setUploadingForLabel(itemLabel);
    setErrorForLabel(null);
    const formData = new FormData();
    formData.append("action", "upload-doc");
    formData.append("_id", contractorId);
    formData.append("file", file);
    formData.append("docType", itemLabel); // D-06: label string, not slug
    try {
      const res = await fetch(`/api/admin/contractors`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("try again");
      const result = await res.json();
      if (result.document) {
        const next = [...documents, result.document as DocEntry];
        setDocuments(next);
        onDocumentsChange?.(next);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "try again";
      setErrorForLabel({
        label: itemLabel,
        message: `Upload failed — ${message}`,
      });
    } finally {
      setUploadingForLabel(null);
      activeLabelRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(key: string) {
    setDeletingDocKey(key);
    setDeleteErrorKey(null);
    try {
      const res = await fetch(`/api/admin/contractors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-doc",
          _id: contractorId,
          docKey: key,
        }),
      });
      if (!res.ok) throw new Error("Could not delete — try again");
      const next = documents.filter((d) => d._key !== key);
      setDocuments(next);
      onDocumentsChange?.(next);
    } catch {
      setDeleteErrorKey(key);
    } finally {
      setDeletingDocKey(null);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold font-body text-charcoal">Documents</h3>
      <p
        className="text-xs font-body text-stone-light"
        style={{ fontSize: "11.5px" }}
      >
        Required documents for this {label}. Upload from each row to link a
        file to a checklist item.
      </p>

      {checklistItems.length === 0 ? (
        <p
          className="text-xs font-body text-stone-light mt-2"
          style={{ fontSize: "11.5px" }}
        >
          No checklist items configured. Add items in Settings → {label}{" "}
          Checklist to require documents for this {label}.
        </p>
      ) : (
        <div className="flex flex-col mt-3" style={{ gap: "6px" }}>
          {checklistItems.map((item) => {
            const doc = matched.get(item);
            const isUploading = uploadingForLabel === item;
            const rowError =
              errorForLabel?.label === item ? errorForLabel.message : null;
            return (
              <div key={item}>
                <div className="flex items-center gap-2 px-3 py-2 bg-cream/50 rounded-lg">
                  <span
                    className="inline-flex items-center justify-center"
                    style={{ width: 20, height: 20, flexShrink: 0 }}
                  >
                    {doc ? (
                      <Check
                        className="w-3.5 h-3.5 text-stone-mid"
                        aria-label="Uploaded"
                      />
                    ) : (
                      <span
                        className="border border-stone-light/40 rounded-sm"
                        style={{ width: 14, height: 14 }}
                        aria-label="Missing"
                      />
                    )}
                  </span>
                  <span
                    className="text-sm font-body text-charcoal truncate"
                    style={{ flex: "0 1 40%" }}
                    title={item}
                  >
                    {item}
                  </span>
                  <span
                    className="text-sm font-body truncate flex-1"
                    style={{ color: doc ? "#2C2520" : "#9E8E80" }}
                    title={doc?.fileName ?? "missing"}
                  >
                    {doc ? doc.fileName : "— missing"}
                  </span>
                  <div className="flex items-center gap-2">
                    {doc ? (
                      <>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-terracotta hover:underline font-body"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc._key)}
                          disabled={deletingDocKey === doc._key}
                          aria-label={`Delete ${doc.fileName}`}
                          className="text-stone-light hover:text-red-500 transition-colors"
                        >
                          {deletingDocKey === doc._key ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => triggerUploadForLabel(item)}
                        disabled={isUploading}
                        className="text-sm text-terracotta border border-terracotta/30 rounded-lg px-3 py-1.5 hover:bg-terracotta/5 transition-colors inline-flex items-center gap-1.5 font-body"
                      >
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        {isUploading ? "Uploading…" : "Upload"}
                      </button>
                    )}
                  </div>
                </div>
                {rowError && (
                  <p
                    className="text-destructive mt-1"
                    style={{ fontSize: "11.5px" }}
                  >
                    {rowError}
                  </p>
                )}
                {deleteErrorKey && doc && deleteErrorKey === doc._key && (
                  <p
                    className="text-destructive mt-1"
                    style={{ fontSize: "11.5px" }}
                  >
                    Could not delete — try again
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {others.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h4
            className="uppercase"
            style={{
              fontSize: "11.5px",
              letterSpacing: "0.04em",
              fontWeight: 600,
              color: "#6B5E52",
            }}
          >
            Other documents
          </h4>
          <p
            className="font-body mt-1"
            style={{ fontSize: "11.5px", color: "#6B5E52" }}
          >
            Uploaded documents that don't match a checklist item. Re-upload
            from a row above to link them, or keep here for reference.
          </p>
          <div className="flex flex-col mt-2" style={{ gap: "6px" }}>
            {others.map((doc) => (
              <div key={doc._key}>
                <div className="flex items-center gap-2 px-3 py-2 bg-cream/50 rounded-lg">
                  <span
                    className="text-sm font-body text-charcoal truncate flex-1"
                    title={doc.fileName}
                  >
                    {doc.fileName}
                  </span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-terracotta hover:underline font-body"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc._key)}
                    disabled={deletingDocKey === doc._key}
                    aria-label={`Delete ${doc.fileName}`}
                    className="text-stone-light hover:text-red-500 transition-colors"
                  >
                    {deletingDocKey === doc._key ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {deleteErrorKey && deleteErrorKey === doc._key && (
                  <p
                    className="text-destructive mt-1"
                    style={{ fontSize: "11.5px" }}
                  >
                    Could not delete — try again
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpeg,.jpg,.png"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

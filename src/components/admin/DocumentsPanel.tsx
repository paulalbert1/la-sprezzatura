import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import UploadDocumentModal from "./UploadDocumentModal";
import ToastContainer, { useToast } from "./ui/ToastContainer";
import {
  formatBytes,
  fileTypeFromAsset,
} from "../../lib/workOrder/documentHelpers";

// Phase 39 Plan 02 Task 2 — DocumentsPanel (admin project detail)
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-02-PLAN.md § Task 2
//   .planning/phases/39-work-order-documents-panels/39-UI-SPEC.md § Surface 6
//
// Lists project documents categorized as Contracts / Drawings / Selections /
// Presentations with a filter tab row, a "+ Upload" CTA (hosting
// UploadDocumentModal), and per-row trash (hosting DeleteConfirmDialog).
// Renders as a React island (client:load). Optimistically prepends newly
// uploaded docs and removes deleted docs before server confirmation; errors
// surface via toast.

export type DocumentCategory =
  | "Contracts"
  | "Drawings"
  | "Selections"
  | "Presentations";

export interface ProjectDocument {
  _key: string;
  label: string;
  category: DocumentCategory;
  shareableWithClient?: boolean;
  uploadedAt: string;
  uploadedByName: string;
  url: string;
  size: number;
  originalFilename: string;
  mimeType: string;
}

interface DocumentsPanelProps {
  projectId: string;
  initialDocuments: ProjectDocument[];
}

type FilterValue = "all" | DocumentCategory;

// Display mapping: schema enum stores plural ("Contracts", "Drawings", ...)
// for back-compat with existing data; UI shows singular per operator
// preference. Centralizing this mapping keeps display consistent across
// tabs, pills, and the empty-state copy without a schema migration.
const CATEGORY_DISPLAY: Record<DocumentCategory, string> = {
  Contracts: "Contract",
  Drawings: "Drawing",
  Selections: "Selection",
  Presentations: "Presentation",
};

const TABS: ReadonlyArray<{ value: FilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "Contracts", label: "Contract" },
  { value: "Drawings", label: "Drawing" },
  { value: "Selections", label: "Selection" },
  { value: "Presentations", label: "Presentation" },
];

const CATEGORY_SINGULAR: Record<DocumentCategory, string> = {
  Contracts: "contract",
  Drawings: "drawing",
  Selections: "selection",
  Presentations: "presentation",
};

// File-type badge Tailwind arbitrary-value classes per UI-SPEC §File-type badge.
function badgeClasses(type: "PDF" | "JPG" | "PNG" | "FILE"): string {
  switch (type) {
    case "PDF":
      return "bg-[#FBEEE8] text-[#9B3A2A]";
    case "JPG":
      return "bg-[#EDF5E8] text-[#6B7A3A]";
    case "PNG":
      return "bg-[#E8E8F0] text-[#5A5E7A]";
    default:
      return "bg-[#F3EDE3] text-[#6B5E52]";
  }
}

function DocumentsPanelInner({
  projectId,
  initialDocuments,
}: DocumentsPanelProps) {
  const { show } = useToast();
  const [documents, setDocuments] = useState<ProjectDocument[]>(
    initialDocuments ?? [],
  );
  const [activeCategory, setActiveCategory] = useState<FilterValue>("all");
  const [uploadOpen, setUploadOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<
    { docKey: string; label: string } | null
  >(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>("");

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) => activeCategory === "all" || d.category === activeCategory,
      ),
    [documents, activeCategory],
  );

  async function handleToggleShareable(doc: ProjectDocument) {
    const next = !doc.shareableWithClient;
    // Optimistic update -- pill flips immediately; revert on failure.
    setDocuments((docs) =>
      docs.map((d) =>
        d._key === doc._key ? { ...d, shareableWithClient: next } : d,
      ),
    );
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/documents/${doc._key}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shareableWithClient: next }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Toggle failed");
      }
    } catch (err) {
      // Revert
      setDocuments((docs) =>
        docs.map((d) =>
          d._key === doc._key
            ? { ...d, shareableWithClient: doc.shareableWithClient }
            : d,
        ),
      );
      show({
        variant: "error",
        title: (err as Error).message || "Could not change share state",
        duration: 5000,
      });
    }
  }

  async function handleSaveLabel(doc: ProjectDocument, nextLabel: string) {
    const trimmed = nextLabel.trim();
    setEditingKey(null);
    setEditingLabel("");
    if (!trimmed || trimmed === doc.label) return;
    const previous = doc.label;
    // Optimistic update.
    setDocuments((docs) =>
      docs.map((d) => (d._key === doc._key ? { ...d, label: trimmed } : d)),
    );
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/documents/${doc._key}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: trimmed }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Rename failed");
      }
    } catch (err) {
      // Revert
      setDocuments((docs) =>
        docs.map((d) =>
          d._key === doc._key ? { ...d, label: previous } : d,
        ),
      );
      show({
        variant: "error",
        title: (err as Error).message || "Rename failed",
        duration: 5000,
      });
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/documents/${deleteTarget.docKey}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Delete failed");
      }
      setDocuments((docs) =>
        docs.filter((d) => d._key !== deleteTarget.docKey),
      );
      show({
        variant: "success",
        title: `Deleted ${deleteTarget.label}`,
        duration: 3000,
      });
      setDeleteTarget(null);
    } catch (err) {
      show({
        variant: "error",
        title: (err as Error).message || "Delete failed",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const hasDocsAtAll = documents.length > 0;
  const showEmptyAll = !hasDocsAtAll;
  const showEmptyFiltered = hasDocsAtAll && filtered.length === 0;

  return (
    <>
      <section className="bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-[10px] overflow-hidden mt-[14px] mb-[14px]">
        <header className="card-header flex items-center justify-between gap-3 px-5 h-[42px]">
          <h2 className="card-header-label">Documents</h2>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="card-header-btn"
          >
            <Plus size={12} />
            Upload
          </button>
        </header>
        <div className="px-5 pt-4 pb-5">

        <div className="flex gap-1 mb-4">
          {TABS.map((tab) => {
            const isActive = activeCategory === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                data-tab={tab.value}
                data-active={isActive ? "true" : "false"}
                onClick={() => setActiveCategory(tab.value)}
                className={
                  "px-2.5 py-1 rounded-[7px] transition-all duration-150 text-[11.5px] " +
                  (isActive
                    ? "bg-[#F5EDD8] text-[#9A7B4B] border-[0.5px] border-[#E8D5A8] font-medium"
                    : "text-[#6B5E52] hover:bg-[#F3EDE3] border-[0.5px] border-transparent font-normal")
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {showEmptyAll && (
          <div className="py-10 text-center">
            <p className="text-[12.5px] text-[#9E8E80] max-w-[420px] mx-auto">
              No documents yet — use{" "}
              <span className="text-[#9A7B4B]">+ Upload</span> above to add
              contracts, drawings, selections, and presentations.
            </p>
          </div>
        )}

        {showEmptyFiltered && activeCategory !== "all" && (
          <div className="py-10 text-center">
            <p className="text-[12.5px] text-[#9E8E80] max-w-[420px] mx-auto">
              No {CATEGORY_DISPLAY[activeCategory].toLowerCase()}s yet.{" "}
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className="text-[#9A7B4B] hover:text-[#8A6D40] focus:outline-none"
              >
                Show all
              </button>
            </p>
          </div>
        )}

        {!showEmptyAll && !showEmptyFiltered && (
          <div>
            {filtered.map((doc) => {
              const type = fileTypeFromAsset(doc.originalFilename, doc.mimeType);
              let dateLabel = "";
              try {
                dateLabel = format(parseISO(doc.uploadedAt), "MMM d");
              } catch {
                dateLabel = "";
              }
              return (
                <div
                  key={doc._key}
                  data-doc-row={doc._key}
                  className="flex items-center gap-3 px-4 py-3 border-b-[0.5px] border-[#E8DDD0] last:border-0"
                >
                  <div
                    data-file-badge={type}
                    className={
                      "w-8 h-8 rounded-[6px] flex items-center justify-center text-[11.5px] font-semibold tracking-[0.04em] " +
                      badgeClasses(type)
                    }
                  >
                    {type}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingKey === doc._key ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        onBlur={() => handleSaveLabel(doc, editingLabel)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          } else if (e.key === "Escape") {
                            setEditingKey(null);
                            setEditingLabel("");
                          }
                        }}
                        className="block w-full text-[14px] text-[#2C2520] bg-transparent border-b border-[#9A7B4B] outline-none py-0"
                      />
                    ) : (
                      <button
                        type="button"
                        title="Click to rename"
                        onClick={() => {
                          setEditingKey(doc._key);
                          setEditingLabel(doc.label);
                        }}
                        className="block text-left w-full text-[14px] text-[#2C2520] hover:text-[#9A7B4B] truncate"
                      >
                        {doc.label}
                      </button>
                    )}
                    <div className="text-[11.5px] text-[#9E8E80]">
                      {formatBytes(doc.size)}
                      {dateLabel ? ` · ${dateLabel}` : ""}
                      {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
                      {" · "}
                      <a
                        data-doc-link={doc._key}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#9A7B4B] hover:underline"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={
                      doc.shareableWithClient
                        ? "Hide from client portal"
                        : "Share with client portal"
                    }
                    title={
                      doc.shareableWithClient
                        ? "Visible on client portal — click to hide"
                        : "Hidden from client portal — click to share"
                    }
                    onClick={() => handleToggleShareable(doc)}
                    className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-body px-2 py-1 rounded-md border transition-colors ${
                      doc.shareableWithClient
                        ? "border-[#A8C98C] bg-[#EDF5E8] text-[#3A6620] hover:bg-[#DDE9D2]"
                        : "border-[#E8DDD0] bg-[#FBF8F3] text-[#9E8E80] hover:bg-[#F3EDE3]"
                    }`}
                  >
                    {doc.shareableWithClient ? (
                      <Eye size={12} aria-hidden="true" />
                    ) : (
                      <EyeOff size={12} aria-hidden="true" />
                    )}
                    {doc.shareableWithClient ? "Shared" : "Hidden"}
                  </button>
                  <span className="text-[11.5px] font-semibold tracking-[0.04em] text-[#6B5E52] bg-[#F3EDE3] px-2 py-0.5 rounded-full">
                    {CATEGORY_DISPLAY[doc.category]}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete ${doc.label}`}
                    data-delete-row={doc._key}
                    onClick={() =>
                      setDeleteTarget({ docKey: doc._key, label: doc.label })
                    }
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[#9E8E80] hover:text-[#9B3A2A] hover:bg-[#F3EDE3]"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </section>

      <UploadDocumentModal
        open={uploadOpen}
        projectId={projectId}
        onClose={() => setUploadOpen(false)}
        onUploaded={(entry) =>
          setDocuments((docs) => [entry as ProjectDocument, ...docs])
        }
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        entityType="document"
        entityName={deleteTarget?.label ?? ""}
        isLoading={isDeleting}
      />
    </>
  );
}

// React context doesn't cross Astro island boundaries — wrap the inner
// component in a local ToastContainer so useToast() resolves. Mirrors the
// ProjectArchiveMenu pattern from Phase 36.
export default function DocumentsPanel(props: DocumentsPanelProps) {
  return (
    <ToastContainer>
      <DocumentsPanelInner {...props} />
    </ToastContainer>
  );
}

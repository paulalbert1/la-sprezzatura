import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
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

const TABS: ReadonlyArray<{ value: FilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "Contracts", label: "Contracts" },
  { value: "Drawings", label: "Drawings" },
  { value: "Selections", label: "Selections" },
  { value: "Presentations", label: "Presentations" },
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

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) => activeCategory === "all" || d.category === activeCategory,
      ),
    [documents, activeCategory],
  );

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
      <section className="bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-[10px] p-5 mt-8 mb-8">
        <header className="flex justify-between items-center mb-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#9E8E80]">
            Documents
          </h2>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="bg-[#9A7B4B] text-white px-3 py-1.5 text-[13px] rounded-[2px] uppercase tracking-[0.14em] font-semibold hover:bg-[#8A6D40] flex items-center gap-1"
          >
            <Plus size={14} />
            Upload
          </button>
        </header>

        <div className="flex gap-1 my-4">
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
                  "px-2 py-1 rounded-[4px] transition-all duration-150 text-[11.5px] " +
                  (isActive
                    ? "bg-[#F5EDD8] text-[#9A7B4B] border-[0.5px] border-[#E8D5A8] font-semibold"
                    : "text-[#6B5E52] hover:bg-[#F3EDE3] border-[0.5px] border-transparent font-normal")
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {showEmptyAll && (
          <div className="py-12 text-center">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#9E8E80] mb-2">
              No documents yet
            </h3>
            <p className="text-[14px] text-[#6B5E52] mb-4 max-w-[420px] mx-auto">
              Upload contracts, drawings, selections, and presentations so your
              whole team has the latest files.
            </p>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="bg-[#9A7B4B] text-white px-3 py-1.5 text-[13px] rounded-[2px] uppercase tracking-[0.14em] font-semibold hover:bg-[#8A6D40]"
            >
              Upload document
            </button>
          </div>
        )}

        {showEmptyFiltered && activeCategory !== "all" && (
          <div className="py-12 text-center">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#9E8E80] mb-2">
              No {activeCategory.toLowerCase()} yet
            </h3>
            <p className="text-[14px] text-[#6B5E52] mb-4 max-w-[420px] mx-auto">
              Upload your first {CATEGORY_SINGULAR[activeCategory]} or switch
              to a different category.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className="px-3 py-1.5 text-[13px] text-[#6B5E52] hover:bg-[#F3EDE3] rounded-[2px] uppercase tracking-[0.14em] font-semibold"
            >
              All
            </button>
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
                    <a
                      data-doc-link={doc._key}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] text-[#2C2520] hover:text-[#9A7B4B] hover:underline truncate block"
                    >
                      {doc.label}
                    </a>
                    <div className="text-[11.5px] text-[#9E8E80]">
                      {formatBytes(doc.size)}
                      {dateLabel ? ` · ${dateLabel}` : ""}
                      {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
                    </div>
                  </div>
                  <span className="text-[11.5px] font-semibold tracking-[0.04em] text-[#6B5E52] bg-[#F3EDE3] px-2 py-0.5 rounded-full">
                    {doc.category}
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

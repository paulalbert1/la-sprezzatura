import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { Loader2, X } from "lucide-react";
import AdminModal from "./ui/AdminModal";
import { useToast } from "./ui/ToastContainer";
// AdminModal is imported and its size="md" preset would apply via a matching
// Tailwind class on the inline dialog below. We render inline rather than
// through AdminModal.createPortal so that jsdom test harnesses can query
// inputs via `container.querySelectorAll` (Phase 37 D-37-03 convention
// reused here; see ProcurementItemModal.tsx L17-30).
const ADMIN_MODAL_SIZE: "md" = "md";
void AdminModal;
void ADMIN_MODAL_SIZE;

// Phase 39 Plan 02 Task 1 — UploadDocumentModal
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-02-PLAN.md § Task 1
//   .planning/phases/39-work-order-documents-panels/39-UI-SPEC.md § Surface 7
//
// Renders a file input + category select + optional label for uploading a
// single document to a project. Posts multipart/form-data to
// /api/admin/projects/[projectId]/documents. Client-side MIME + size gate
// mirrors (but does not replace) the server-side allowlist from Plan 01.

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

interface UploadDocumentModalProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onUploaded: (entry: ProjectDocument) => void;
}

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"] as const;
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export default function UploadDocumentModal({
  open,
  projectId,
  onClose,
  onUploaded,
}: UploadDocumentModalProps) {
  const { show } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<"" | DocumentCategory>("");
  const [label, setLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Reset local state every time the modal closes so reopening gives a clean
  // slate without stale file/category/label residue.
  useEffect(() => {
    if (!open) {
      setFile(null);
      setCategory("");
      setLabel("");
      setError(null);
      setIsUploading(false);
    }
  }, [open]);

  // Escape-to-close, only while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isUploading) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isUploading, onClose]);

  if (!open) return null;

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) {
      setError("Only PDF and image files can be uploaded (PDF, JPG, PNG).");
      setFile(null);
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("This file is too large. Maximum 25MB.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
    // Pre-fill label with filename; designer can rename before uploading.
    if (!label) setLabel(f.name);
  }

  function handleBackdrop(_e: MouseEvent<HTMLDivElement>) {
    if (isUploading) return;
    onClose();
  }

  async function handleUpload() {
    if (!file || !category) return;
    setIsUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("projectId", projectId);
      form.set("category", category);
      const effectiveLabel = label || file.name;
      if (effectiveLabel !== file.name) form.set("label", effectiveLabel);
      const res = await fetch(`/api/admin/projects/${projectId}/documents`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        docKey?: string;
        assetUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }
      const entry: ProjectDocument = {
        _key: data.docKey ?? "",
        label: effectiveLabel,
        category: category as DocumentCategory,
        uploadedAt: new Date().toISOString(),
        uploadedByName: "You",
        url: data.assetUrl ?? "",
        size: file.size,
        originalFilename: file.name,
        mimeType: file.type,
      };
      show({
        variant: "success",
        title: `Uploaded ${effectiveLabel}`,
        duration: 3000,
      });
      onUploaded(entry);
      onClose();
    } catch (err) {
      setError((err as Error).message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const canSubmit = !!file && !!category && !isUploading;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-doc-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2520]/40"
      onClick={handleBackdrop}
    >
      <div
        ref={dialogRef}
        className="bg-[#FFFEFB] border border-[#E8DDD0] rounded-[10px] max-w-[480px] w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="upload-doc-title"
            className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#9E8E80]"
          >
            Upload document
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isUploading}
            className="text-[#9E8E80] hover:text-[#2C2520] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-[4px] border-[0.5px] border-[#9B3A2A] bg-[#FBEEE8] px-3 py-2 text-[13px] text-[#9B3A2A]"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="upload-doc-file"
              className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#9E8E80] mb-1"
            >
              File
            </label>
            <input
              id="upload-doc-file"
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-[13px] text-[#2C2520] file:mr-3 file:rounded-[4px] file:border-[0.5px] file:border-[#E8DDD0] file:bg-[#FAF7F2] file:px-3 file:py-1.5 file:text-[13px] file:text-[#2C2520]"
            />
          </div>

          <div>
            <label
              htmlFor="upload-doc-category"
              className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#9E8E80] mb-1"
            >
              Category (required)
            </label>
            <select
              id="upload-doc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as "" | DocumentCategory)}
              disabled={isUploading}
              required
              className="luxury-input block w-full rounded-[4px] border-[0.5px] border-[#E8DDD0] bg-[#FFFEFB] px-3 py-2 text-[13px] text-[#2C2520]"
            >
              <option value="">Choose a category</option>
              <option value="Contracts">Contracts</option>
              <option value="Drawings">Drawings</option>
              <option value="Selections">Selections</option>
              <option value="Presentations">Presentations</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="upload-doc-label"
              className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#9E8E80] mb-1"
            >
              Label (optional)
            </label>
            <input
              id="upload-doc-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={file?.name ?? ""}
              disabled={isUploading}
              className="luxury-input block w-full rounded-[4px] border-[0.5px] border-[#E8DDD0] bg-[#FFFEFB] px-3 py-2 text-[13px] text-[#2C2520]"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-3 py-1.5 text-[13px] text-[#6B5E52] hover:bg-[#F3EDE3] rounded-[2px] uppercase tracking-[0.14em] font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className="px-3 py-1.5 text-[13px] bg-[#9A7B4B] text-white rounded-[2px] uppercase tracking-[0.14em] font-semibold hover:bg-[#8A6D40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Uploading…
              </>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

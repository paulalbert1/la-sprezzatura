import { useRef, useCallback, useState, useEffect } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, X, Loader2, AlertCircle, FileText } from "lucide-react";
import type { WizardImage } from "../../../lib/rendering/types";

/**
 * Step 2 of the rendering wizard: file upload with instant previews, multi-upload,
 * and filename truncation.
 *
 * Port notes (D-13 verbatim-port rule from 33-CONTEXT.md):
 *   - runWithConcurrency pool:    ported from Studio StepUpload.tsx lines 19-38
 *   - Memory cleanup useEffect:   ported from lines 49-56 (revoke all localPreviewUrls on unmount)
 *   - uploadFile hybrid pattern:  ported from lines 59-78 (server PUT <4.5MB, client upload >4.5MB)
 *   - handleFiles placeholders:   ported from lines 80-153 (synchronous createObjectURL before await)
 *   - retryUpload:                ported from lines 156-204
 *   - Multi-file input (RNDR-09): ported from lines 273-279 (type="file" multiple)
 *   - Filename truncation (RNDR-08): ported from lines 427-443 (overflow/ellipsis/maxWidth:120 + title)
 *
 * Only colors, layout primitives, and icons were swapped:
 *   - @sanity/ui Stack/Card/Grid/Text/Spinner  -->  Tailwind div + flex/grid
 *   - @sanity/icons UploadIcon/CloseIcon/...   -->  lucide-react Upload/X/Loader2/AlertCircle/FileText
 *   - Beige admin luxury tokens per 33-UI-SPEC.md section "Step 2: Upload"
 *
 * No env-var reads — uploadFile calls /api/blob-upload same-origin and
 * @vercel/blob/client upload() uses the same handleUploadUrl token flow as Studio.
 * T-33-01 mitigation is therefore preserved at the StepUpload boundary.
 */

// ---------------------------------------------------------------------------
// Public constants (exposed for tests and for WizardContainer inspection)
// ---------------------------------------------------------------------------

/**
 * Accepted file types for the multi-upload input (RNDR-09).
 * Matches Studio's ACCEPTED_TYPES constant but scoped to images per the admin
 * UI-SPEC (Plan 33-04 drops PDF from the UI-level accept list per UI-SPEC line 294,
 * though the handler still tolerates PDFs as a PDF-safe no-preview path).
 */
export const ACCEPTED_FILE_TYPES =
  "image/png,image/jpeg,image/webp,image/heic";

/** Studio's 20MB per-file ceiling — Studio StepUpload.tsx line 14. */
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** Vercel Functions request body limit — anything larger goes via client upload. */
const SERVER_UPLOAD_LIMIT = 4.5 * 1024 * 1024;

/**
 * Upload concurrency pool size (RNDR-09).
 * Ported verbatim from Studio StepUpload.tsx line 17.
 */
export const UPLOAD_CONCURRENCY_LIMIT = 3;

/**
 * Filename truncation style object (RNDR-08).
 * Ported verbatim from Studio StepUpload.tsx lines 427-443 filename wrapper div.
 * Long filenames render truncated with ellipsis and are revealed as a native
 * tooltip via the accompanying title={img.fileName} attribute at the call site.
 */
export const FILENAME_TRUNCATE_STYLE: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: 120,
  fontSize: "11.5px",
  color: "#9E8E80",
  textAlign: "center",
  margin: "4px auto 0",
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing without a DOM)
// ---------------------------------------------------------------------------

/**
 * Concurrency pool: runs up to `limit` tasks in parallel and returns results in
 * input order. Ported verbatim from Studio StepUpload.tsx lines 19-38.
 */
export async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const currentIndex = index++;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    () => runNext(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * Build WizardImage placeholders for a batch of selected files.
 *
 * Synchronously creates `localPreviewUrl` via URL.createObjectURL for every
 * non-PDF file BEFORE any async upload starts (RNDR-07). This is the key
 * contract that the instant-preview UX depends on: the caller sets the
 * resulting array into state immediately, so the thumbnail grid renders
 * previews the moment the user drops files — there is no waiting for the
 * blob upload to complete.
 *
 * Ported from Studio StepUpload.tsx lines 85-101. The `Floor Plan` /
 * `Existing Space Photo` auto-classification for the first image of a fresh
 * session is preserved verbatim from Studio lines 93-96.
 */
export function buildPlaceholderImages(
  files: FileList | File[],
  currentCount: number,
): WizardImage[] {
  const fileArray = Array.from(files);
  return fileArray.map((f, i) => {
    const idx = currentCount + i;
    const isPdf = f.type === "application/pdf";
    return {
      blobPathname: "",
      fileName: f.name,
      file: f,
      imageType:
        idx === 0 && currentCount === 0 ? "Floor Plan" : "Existing Space Photo",
      location: "",
      notes: "",
      copyExact: idx === 0 && currentCount === 0,
      uploading: true,
      error: undefined,
      // RNDR-07: synchronous preview URL — created before any await
      localPreviewUrl: isPdf ? undefined : URL.createObjectURL(f),
    };
  });
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

interface StepUploadProps {
  images: WizardImage[];
  /**
   * Matches StepClassify/WizardContainer.updateImages signature so the parent
   * can pass its updateImages callback directly without an adapter.
   */
  onChange: (
    imagesOrUpdater: WizardImage[] | ((prev: WizardImage[]) => WizardImage[]),
  ) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StepUpload({ images, onChange }: StepUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Mutable ref to track latest images state across async upload iterations.
  // Ports Studio lines 45-46 — the ref is required because each awaited upload
  // needs to splice into the most-recent images array, not the closure copy.
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // -------------------------------------------------------------------------
  // RNDR-07 Memory Management Contract: revoke all object URLs on unmount
  // Ported from Studio StepUpload.tsx lines 49-56.
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.localPreviewUrl) {
          URL.revokeObjectURL(img.localPreviewUrl);
        }
      });
    };
  }, []);

  // -------------------------------------------------------------------------
  // Hybrid upload: server PUT <4.5MB, client upload >4.5MB
  // Ported from Studio StepUpload.tsx lines 59-78.
  // -------------------------------------------------------------------------
  const uploadFile = useCallback(
    async (file: File): Promise<{ pathname: string }> => {
      if (file.size <= SERVER_UPLOAD_LIMIT) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/blob-upload", {
          method: "PUT",
          body: formData,
        });
        if (!res.ok) {
          const errData = await res
            .json()
            .catch(() => ({ error: "Upload failed" }));
          throw new Error(errData.error || "Upload failed");
        }
        return res.json();
      }
      // Files > 4.5MB: direct client upload to Vercel Blob with server-issued token
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
      });
      return { pathname: blob.pathname };
    },
    [],
  );

  // -------------------------------------------------------------------------
  // handleFiles: accepts FileList | File[] from drop or <input>.
  // RNDR-09: multi-upload support via Array.from(files) + concurrency pool.
  // Ported from Studio StepUpload.tsx lines 80-154.
  // -------------------------------------------------------------------------
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const currentCount = imagesRef.current.length;

      // Synchronous preview creation — see buildPlaceholderImages for the
      // RNDR-07 contract: localPreviewUrl is set before any async operation.
      const placeholders = buildPlaceholderImages(fileArray, currentCount);

      // Publish placeholders immediately so the thumbnail grid renders
      // previews before any upload starts.
      const initial = [...imagesRef.current, ...placeholders];
      onChange(initial);

      // Build upload tasks for the concurrency pool (RNDR-09: limit=3)
      const uploadTasks = fileArray.map((file, i) => {
        const placeholderIndex = currentCount + i;

        return async () => {
          if (file.size > MAX_FILE_SIZE) {
            const latest = [...imagesRef.current];
            latest[placeholderIndex] = {
              ...latest[placeholderIndex],
              uploading: false,
              error: "File exceeds 20MB limit",
            };
            onChange(latest);
            return;
          }

          try {
            const result = await uploadFile(file);
            const latest = [...imagesRef.current];
            // RNDR-07 memory management: revoke the preview URL as soon as the
            // uploaded blob is available — the img src will flip to the blob
            // serve URL and the object URL is no longer needed.
            if (latest[placeholderIndex].localPreviewUrl) {
              URL.revokeObjectURL(latest[placeholderIndex].localPreviewUrl!);
            }
            latest[placeholderIndex] = {
              ...latest[placeholderIndex],
              blobPathname: result.pathname,
              uploading: false,
              error: undefined,
              file: undefined,
              localPreviewUrl: undefined,
            };
            onChange(latest);
          } catch {
            const latest = [...imagesRef.current];
            latest[placeholderIndex] = {
              ...latest[placeholderIndex],
              uploading: false,
              error: "Upload failed",
            };
            onChange(latest);
          }
        };
      });

      await runWithConcurrency(uploadTasks, UPLOAD_CONCURRENCY_LIMIT);
    },
    [onChange, uploadFile],
  );

  // -------------------------------------------------------------------------
  // Retry one failed upload — ported from Studio lines 156-204.
  // -------------------------------------------------------------------------
  const retryUpload = useCallback(
    async (index: number) => {
      const img = imagesRef.current[index];
      if (!img?.file) return;

      const isPdf = img.file.type === "application/pdf";
      const newPreviewUrl = isPdf ? undefined : URL.createObjectURL(img.file);

      const latest = [...imagesRef.current];
      if (latest[index].localPreviewUrl) {
        URL.revokeObjectURL(latest[index].localPreviewUrl!);
      }
      latest[index] = {
        ...latest[index],
        uploading: true,
        error: undefined,
        localPreviewUrl: newPreviewUrl,
      };
      onChange(latest);

      try {
        const result = await uploadFile(img.file);
        const updated = [...imagesRef.current];
        if (updated[index].localPreviewUrl) {
          URL.revokeObjectURL(updated[index].localPreviewUrl!);
        }
        updated[index] = {
          ...updated[index],
          blobPathname: result.pathname,
          uploading: false,
          error: undefined,
          file: undefined,
          localPreviewUrl: undefined,
        };
        onChange(updated);
      } catch {
        const updated = [...imagesRef.current];
        updated[index] = {
          ...updated[index],
          uploading: false,
          error: "Upload failed",
        };
        onChange(updated);
      }
    },
    [onChange, uploadFile],
  );

  // -------------------------------------------------------------------------
  // Drag & drop handlers
  // -------------------------------------------------------------------------
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // Reset input so the same file can be re-selected after removal
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFiles],
  );

  // -------------------------------------------------------------------------
  // Remove image — also revokes its preview URL (RNDR-07 memory cleanup)
  // -------------------------------------------------------------------------
  const removeImage = useCallback(
    (index: number) => {
      const img = images[index];
      if (img?.localPreviewUrl) {
        URL.revokeObjectURL(img.localPreviewUrl);
      }
      onChange(images.filter((_, i) => i !== index));
    },
    [images, onChange],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone — UI-SPEC § "Step 2: Upload" */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors"
        style={{
          border: `1.5px dashed ${isDragOver ? "#9A7B4B" : "#D4C8B8"}`,
          background: isDragOver ? "#F5EDD8" : "#F3EDE3",
          height: 160,
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload images — click or drop files here"
      >
        <Upload
          className="w-8 h-8 mb-2"
          style={{ color: "#9E8E80" }}
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-[#2C2520]">
          Drop images here
        </p>
        <p className="text-[11.5px] text-[#6B5E52]">
          or click to select files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Soft hint at 7+ images — ported from Studio lines 283-290 */}
      {images.length >= 7 && (
        <div
          className="rounded-lg px-4 py-3 text-[11.5px]"
          style={{
            background: "#FBF2E2",
            color: "#8A5E1A",
            border: "1px solid #E8D5A8",
          }}
          role="status"
        >
          Lots of references! The AI works best with 3-6 focused images.
        </div>
      )}

      {/* Thumbnail grid — UI-SPEC § "Step 2: Upload" */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, idx) => {
            const previewSrc = img.blobPathname
              ? `/api/blob-serve?path=${encodeURIComponent(img.blobPathname)}`
              : (img.localPreviewUrl ?? null);

            return (
              <div
                key={`${img.fileName}-${idx}`}
                className="relative group flex flex-col items-center"
              >
                <div
                  className="relative"
                  style={{ width: 120, height: 120 }}
                >
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt={img.fileName}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "0.5px solid #E8DDD0",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 6,
                        border: "0.5px solid #E8DDD0",
                        background: "#F3EDE3",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      {img.uploading ? (
                        <Loader2
                          className="w-5 h-5 animate-spin"
                          style={{ color: "#9A7B4B" }}
                          aria-hidden="true"
                        />
                      ) : (
                        <FileText
                          className="w-6 h-6"
                          style={{ color: "#9E8E80" }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  )}

                  {/* Uploading spinner overlay on top of image preview */}
                  {img.uploading && previewSrc && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: "rgba(255, 254, 251, 0.60)",
                        borderRadius: 6,
                      }}
                      role="status"
                      aria-label={`Uploading ${img.fileName}`}
                    >
                      <Loader2
                        className="w-5 h-5 animate-spin"
                        style={{ color: "#9A7B4B" }}
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  {/* Error overlay with retry button */}
                  {img.error && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2"
                      style={{
                        background: previewSrc
                          ? "rgba(255, 254, 251, 0.88)"
                          : "transparent",
                        borderRadius: 6,
                      }}
                    >
                      <AlertCircle
                        className="w-5 h-5"
                        style={{ color: "#9B3A2A" }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-[10.5px] text-center"
                        style={{ color: "#9B3A2A" }}
                      >
                        {img.error}
                      </span>
                      {img.file && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            retryUpload(idx);
                          }}
                          className="text-[10.5px] px-2 py-0.5 rounded border transition-colors"
                          style={{
                            borderColor: "#9B3A2A",
                            color: "#9B3A2A",
                            background: "transparent",
                          }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  )}

                  {/* Remove button — hover-only, top-right corner */}
                  {!img.uploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      aria-label="Remove image"
                      className="absolute top-1 right-1 hidden group-hover:flex w-5 h-5 rounded-full items-center justify-center"
                      style={{
                        background: "rgba(44, 37, 32, 0.70)",
                        color: "#FFFFFF",
                        border: "none",
                        padding: 0,
                      }}
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Filename strip — RNDR-08 truncation + title tooltip */}
                <div
                  title={img.fileName}
                  style={FILENAME_TRUNCATE_STYLE}
                >
                  {img.fileName}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

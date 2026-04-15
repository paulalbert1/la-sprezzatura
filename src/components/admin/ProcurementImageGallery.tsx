import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import {
  GripVertical,
  Loader2,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { generatePortalToken } from "../../lib/generateToken";

// Phase 37 Plan 03 — ProcurementImageGallery
// Source of truth:
//   - .planning/phases/37-procurement-privacy-modal-editor/37-UI-SPEC.md § Image gallery
//   - .planning/phases/37-procurement-privacy-modal-editor/37-RESEARCH.md §5–§6 (@dnd-kit + multi-file drop)
//
// Behavior contract:
//   - Grid of 112×112 thumbnails + drop-zone tile; empty state shows dropzone alone
//   - @dnd-kit drag-reorder via rectSortingStrategy (2/3-col grid compatible)
//   - Primary-star toggle: click flips isPrimary on clicked tile to true, all
//     others to false. Click on the current primary is a no-op.
//   - Auto-promotion on delete: deleting the primary promotes images[0] of
//     the surviving array to primary.
//   - Parallel multi-file upload via Promise.allSettled; each file shows an
//     in-flight tile with spinner. Failures transition to error tile with
//     retry-on-click. First image added to a previously empty gallery is the
//     primary; subsequent batch images are not.
//   - Per-image caption input below tile (blur-writes).
//
// Threat model: T-37-13 (one-primary invariant enforced on toggle and delete);
// T-37-14 (captions are React text nodes only, never innerHTML);
// T-37-15 (error logs never print the full file or asset URL);
// T-37-16 (20-image cap, server-side 4.5 MB enforcement + client-side matching).

export interface ProcurementImage {
  _key: string;
  _type?: string;
  asset?:
    | { _ref: string; _type: "reference" }
    | { url?: string; _ref?: string };
  url?: string;
  isPrimary?: boolean;
  caption?: string | null;
}

export interface ProcurementImageGalleryProps {
  images: ProcurementImage[];
  onChange: (next: ProcurementImage[]) => void;
  disabled?: boolean;
  maxImages?: number;
  onDragEnd?: (event: { active: { id: string }; over: { id: string } | null }) => void;
}

const MAX_BYTES = 4_500_000;
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;
const DEFAULT_MAX_IMAGES = 20;

type InFlightUpload = {
  tempKey: string;
  fileName: string;
  status: "uploading" | "error";
  errorMessage?: string;
  retry?: () => void;
};

function imageUrl(img: ProcurementImage): string | undefined {
  if (img.url) return img.url;
  const assetAny = img.asset as { url?: string } | undefined;
  return assetAny?.url;
}

interface SortableTileProps {
  image: ProcurementImage;
  index: number;
  disabled: boolean;
  onStarClick: (image: ProcurementImage) => void;
  onDeleteClick: (image: ProcurementImage) => void;
  onCaptionBlur: (imageKey: string, caption: string) => void;
}

function SortableTile({
  image,
  index,
  disabled,
  onStarClick,
  onDeleteClick,
  onCaptionBlur,
}: SortableTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image._key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  const url = imageUrl(image);
  const isPrimary = !!image.isPrimary;

  // Local uncontrolled caption state so typing does not re-render siblings.
  const [captionDraft, setCaptionDraft] = useState<string>(image.caption ?? "");
  useEffect(() => {
    setCaptionDraft(image.caption ?? "");
  }, [image.caption, image._key]);

  return (
    <div style={style} ref={setNodeRef} data-image-tile data-image-key={image._key}>
      <div
        className="relative w-28 h-28 rounded-md border border-stone-light/40 overflow-hidden bg-white"
        style={{ width: "112px", height: "112px" }}
      >
        {url ? (
          <img
            src={url}
            alt={image.caption || ""}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-stone-light/10" />
        )}

        {/* Drag handle */}
        <button
          type="button"
          data-image-drag-handle
          aria-label={`Reorder image ${index + 1}`}
          className="absolute top-1 left-1 w-6 h-6 rounded bg-white/80 hover:bg-white flex items-center justify-center cursor-grab active:cursor-grabbing"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5 text-stone" />
        </button>

        {/* Star / primary toggle */}
        <button
          type="button"
          data-image-star
          aria-label={isPrimary ? "Primary image" : "Set as primary"}
          aria-pressed={isPrimary}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onStarClick(image);
          }}
          className={`absolute top-1 right-1 w-6 h-6 rounded bg-white/80 hover:bg-white flex items-center justify-center ${
            isPrimary
              ? "fill-terracotta text-terracotta"
              : "text-stone-light hover:text-terracotta"
          }`}
        >
          <Star
            className="w-3.5 h-3.5"
            fill={isPrimary ? "currentColor" : "none"}
          />
        </button>

        {/* Delete */}
        <button
          type="button"
          data-image-delete
          aria-label="Remove image"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(image);
          }}
          className="absolute bottom-1 right-1 w-6 h-6 rounded bg-white/80 hover:bg-white flex items-center justify-center text-stone-light hover:text-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Caption (below tile) */}
      <input
        type="text"
        value={captionDraft}
        onChange={(e) => setCaptionDraft(e.target.value)}
        onBlur={() => {
          if ((image.caption ?? "") !== captionDraft) {
            onCaptionBlur(image._key, captionDraft);
          }
        }}
        placeholder="Caption (internal)"
        disabled={disabled}
        className="mt-1 text-xs px-2 py-1 rounded border border-stone-light/40 focus:ring-1 focus:ring-terracotta focus:border-terracotta"
        style={{ width: "112px" }}
        aria-label={`Caption for image ${index + 1}`}
      />
    </div>
  );
}

interface UploadingTileProps {
  entry: InFlightUpload;
  onDismiss: (tempKey: string) => void;
}

function UploadingTile({ entry, onDismiss }: UploadingTileProps) {
  const isError = entry.status === "error";
  return (
    <div data-image-uploading-tile data-temp-key={entry.tempKey}>
      <div
        className={`relative w-28 h-28 rounded-md overflow-hidden ${
          isError
            ? "border-2 border-red-500 bg-red-50"
            : "border border-stone-light/40 bg-white"
        }`}
        style={{ width: "112px", height: "112px" }}
      >
        <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-1">
          {isError ? (
            <>
              <X className="w-5 h-5 text-red-600" />
              <span className="text-[11px] text-red-600">
                {entry.errorMessage || "Upload failed"}
              </span>
              {entry.retry ? (
                <button
                  type="button"
                  onClick={entry.retry}
                  className="text-[11px] text-terracotta hover:text-terracotta-light underline"
                >
                  Retry
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Dismiss failed upload"
                onClick={() => onDismiss(entry.tempKey)}
                className="absolute top-1 right-1 w-5 h-5 rounded bg-white/80 hover:bg-white flex items-center justify-center text-stone-light hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-terracotta" />
              <span className="text-[11px] text-stone">Uploading…</span>
            </>
          )}
        </div>
      </div>
      <div
        className="mt-1 text-[11px] text-stone-light truncate"
        style={{ width: "112px" }}
      >
        {entry.fileName}
      </div>
    </div>
  );
}

interface DropZoneTileProps {
  onFiles: (files: File[]) => void;
  disabled: boolean;
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
}

function DropZoneTile({
  onFiles,
  disabled,
  isDragOver,
  setIsDragOver,
}: DropZoneTileProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFiles(Array.from(files));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: ReactDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };
  const handleDragEnter = (e: ReactDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: ReactDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: ReactDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) onFiles(Array.from(files));
  };

  return (
    <label
      data-image-dropzone
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-md cursor-pointer select-none ${
        isDragOver
          ? "border-2 border-terracotta text-terracotta bg-terracotta/5"
          : "border-2 border-dashed border-stone-light/60 text-stone-light"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      style={{ width: "112px", height: "112px" }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
        multiple
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        data-image-file-input
      />
      <Upload className="w-5 h-5" />
      <span className="mt-1 text-[11px]">
        {isDragOver ? "Drop to upload" : "Add"}
      </span>
    </label>
  );
}

export default function ProcurementImageGallery({
  images,
  onChange,
  disabled = false,
  maxImages = DEFAULT_MAX_IMAGES,
  onDragEnd: onDragEndProp,
}: ProcurementImageGalleryProps) {
  const [inFlight, setInFlight] = useState<Record<string, InFlightUpload>>({});
  const [inlineErrors, setInlineErrors] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Always create a fresh AbortController once on mount; abort on unmount.
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Auto-dismiss inline errors after 5s.
  useEffect(() => {
    if (inlineErrors.length === 0) return;
    const timer = setTimeout(() => setInlineErrors([]), 5000);
    return () => clearTimeout(timer);
  }, [inlineErrors]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (onDragEndProp) {
        onDragEndProp({
          active: { id: String(active.id) },
          over: over ? { id: String(over.id) } : null,
        });
      }
      if (!over || active.id === over.id) return;
      const oldIndex = images.findIndex((i) => i._key === active.id);
      const newIndex = images.findIndex((i) => i._key === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      onChange(arrayMove(images, oldIndex, newIndex));
    },
    [images, onChange, onDragEndProp],
  );

  const handleStarClick = useCallback(
    (image: ProcurementImage) => {
      if (image.isPrimary) return; // no-op on current primary
      onChange(
        images.map((i) => ({ ...i, isPrimary: i._key === image._key })),
      );
    },
    [images, onChange],
  );

  const handleDeleteClick = useCallback(
    (image: ProcurementImage) => {
      const wasPrimary = !!image.isPrimary;
      const remaining = images.filter((i) => i._key !== image._key);
      if (wasPrimary && remaining.length > 0) {
        // auto-promote first remaining
        const promoted = remaining.map((i, idx) => ({
          ...i,
          isPrimary: idx === 0,
        }));
        onChange(promoted);
      } else {
        onChange(remaining);
      }
    },
    [images, onChange],
  );

  const handleCaptionBlur = useCallback(
    (imageKey: string, caption: string) => {
      onChange(
        images.map((i) =>
          i._key === imageKey ? { ...i, caption: caption || null } : i,
        ),
      );
    },
    [images, onChange],
  );

  const uploadOne = useCallback(
    async (
      file: File,
      tempKey: string,
      wasEmptyAtBatchStart: boolean,
    ): Promise<ProcurementImage | null> => {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload-sanity-image", {
          method: "POST",
          body: fd,
          signal: abortRef.current?.signal,
        });
        if (!res.ok) {
          let errMsg = "Upload failed";
          try {
            const err = await res.json();
            if (err?.error) errMsg = String(err.error);
          } catch {
            /* noop */
          }
          throw new Error(errMsg);
        }
        const data = await res.json();
        // Support both upload response shapes (Path A returns `asset`, plan
        // docs show `assetRef`+`url`). Prefer `asset._id` + `asset.url`.
        const assetId: string | undefined =
          data?.asset?._id ?? data?.assetRef ?? data?._id;
        const assetUrl: string | undefined = data?.asset?.url ?? data?.url;
        if (!assetId || typeof assetId !== "string") {
          throw new Error("Invalid upload response");
        }
        const newImage: ProcurementImage = {
          _key: generatePortalToken(8),
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
          url: assetUrl,
          isPrimary: wasEmptyAtBatchStart,
          caption: null,
        };
        setAnnouncements((prev) => [
          ...prev,
          `Image ${file.name} uploaded.`,
        ]);
        return newImage;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return null;
        const message =
          err instanceof Error ? err.message : "Upload failed";
        // T-37-15: do not log file object or URL; only status message.
        console.warn("[ProcurementImageGallery] upload error:", message);
        setInFlight((prev) => {
          const existing = prev[tempKey];
          if (!existing) return prev;
          return {
            ...prev,
            [tempKey]: {
              ...existing,
              status: "error",
              errorMessage: message,
            },
          };
        });
        setAnnouncements((prev) => [
          ...prev,
          `Upload of ${file.name} failed.`,
        ]);
        throw err;
      }
    },
    [],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (disabled) return;
      if (files.length === 0) return;

      // Capacity guard (T-37-16)
      const currentCount = images.length + Object.keys(inFlight).length;
      const availableSlots = Math.max(0, maxImages - currentCount);
      if (availableSlots <= 0) {
        setInlineErrors((prev) => [
          ...prev,
          `Maximum of ${maxImages} images per item.`,
        ]);
        return;
      }

      const validFiles: File[] = [];
      const newErrors: string[] = [];
      for (const file of files) {
        if (validFiles.length >= availableSlots) {
          newErrors.push(
            `${file.name}: skipped (max ${maxImages} images).`,
          );
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
          newErrors.push(`${file.name}: unsupported file type (PNG or JPG).`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          newErrors.push(`${file.name}: exceeds 4.5 MB limit.`);
          continue;
        }
        validFiles.push(file);
      }
      if (newErrors.length > 0) {
        setInlineErrors((prev) => [...prev, ...newErrors]);
      }
      if (validFiles.length === 0) return;

      const wasEmptyAtBatchStart = images.length === 0;

      // Assign temp keys and mark in-flight
      const uploads = validFiles.map((file) => ({
        file,
        tempKey: generatePortalToken(8),
      }));
      setInFlight((prev) => {
        const next = { ...prev };
        for (const u of uploads) {
          next[u.tempKey] = {
            tempKey: u.tempKey,
            fileName: u.file.name,
            status: "uploading",
          };
        }
        return next;
      });

      // Run uploads in parallel
      const results = await Promise.allSettled(
        uploads.map((u, idx) =>
          uploadOne(u.file, u.tempKey, wasEmptyAtBatchStart && idx === 0),
        ),
      );

      // Collect successes, preserve batch order, dedupe primary
      const successful: ProcurementImage[] = [];
      const succeededKeys: string[] = [];
      results.forEach((r, idx) => {
        if (r.status === "fulfilled" && r.value) {
          successful.push(r.value);
          succeededKeys.push(uploads[idx].tempKey);
        }
      });

      // Remove completed in-flight entries (keep errored ones)
      if (succeededKeys.length > 0) {
        setInFlight((prev) => {
          const next = { ...prev };
          for (const k of succeededKeys) delete next[k];
          return next;
        });
      }

      if (successful.length > 0) {
        // Enforce single-primary invariant: if the gallery already had a primary
        // and we added a batch where the first was flagged primary (because
        // wasEmptyAtBatchStart is only true when images.length === 0), the
        // invariant still holds. If there is ALREADY a primary and this was a
        // subsequent batch, none of the new images are primary — good.
        const hasExistingPrimary = images.some((i) => i.isPrimary);
        const normalized = successful.map((img, idx) => {
          if (hasExistingPrimary) return { ...img, isPrimary: false };
          // gallery was empty at batch start — first succeeded image is primary
          return { ...img, isPrimary: idx === 0 };
        });
        onChange([...images, ...normalized]);
      }
    },
    [disabled, images, inFlight, maxImages, onChange, uploadOne],
  );

  const handleDismissInFlight = useCallback((tempKey: string) => {
    setInFlight((prev) => {
      const next = { ...prev };
      delete next[tempKey];
      return next;
    });
  }, []);

  const imageIds = useMemo(() => images.map((i) => i._key), [images]);
  const inFlightArray = useMemo(() => Object.values(inFlight), [inFlight]);
  const isEmpty = images.length === 0 && inFlightArray.length === 0;

  return (
    <section data-image-gallery>
      <h3 className="text-xs uppercase tracking-widest font-semibold text-stone">
        Images
      </h3>

      {/* Announcements for a11y */}
      <div aria-live="polite" className="sr-only">
        {announcements.slice(-1).join(" ")}
      </div>

      {isEmpty ? (
        <div className="mt-3 flex items-center justify-center">
          <DropZoneTile
            onFiles={handleFiles}
            disabled={disabled}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
          />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={imageIds} strategy={rectSortingStrategy}>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
              {images.map((image, idx) => (
                <SortableTile
                  key={image._key}
                  image={image}
                  index={idx}
                  disabled={disabled}
                  onStarClick={handleStarClick}
                  onDeleteClick={handleDeleteClick}
                  onCaptionBlur={handleCaptionBlur}
                />
              ))}
              {inFlightArray.map((entry) => (
                <UploadingTile
                  key={entry.tempKey}
                  entry={entry}
                  onDismiss={handleDismissInFlight}
                />
              ))}
              {images.length + inFlightArray.length < maxImages ? (
                <DropZoneTile
                  onFiles={handleFiles}
                  disabled={disabled}
                  isDragOver={isDragOver}
                  setIsDragOver={setIsDragOver}
                />
              ) : null}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className="mt-2 text-[11px] text-stone-light">
        PNG or JPG, up to 4.5 MB each
      </p>

      {inlineErrors.length > 0 ? (
        <ul className="mt-1 space-y-0.5">
          {inlineErrors.map((err) => (
            <li key={err} className="text-xs text-red-600">
              {err}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

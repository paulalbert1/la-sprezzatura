import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import { GripVertical, Upload, X } from "lucide-react";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "../ui/ToastContainer";
import { generatePortalToken } from "../../../lib/generateToken";

// Phase 34 Plan 03 — HeroSlideshowEditor
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § 1.3 (Hero Slideshow)
//   - .planning/phases/34-settings-and-studio-retirement/34-03-PLAN.md Task 2
//
// Renders the drag-sortable list of hero slides plus the upload dropzone.
// Uploads go to /api/admin/upload-sanity-image (Path A) so the persisted
// reference is a real Sanity image asset, NOT a Vercel Blob pathname — the
// public homepage renders slideshow images via @sanity/image-url which
// requires asset refs.

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // Vercel Function body cap

export interface HeroSlide {
  _key: string;
  image: {
    _type: "image";
    asset: { _type: "reference"; _ref: string };
  };
  alt: string;
  // Display-only, populated by the GROQ asset-> projection:
  imageUrl?: string;
}

export interface HeroSlideshowEditorHandle {
  getSlides: () => HeroSlide[];
}

export interface HeroSlideshowEditorProps {
  initialSlides: HeroSlide[];
  onDirtyChange?: (dirty: boolean) => void;
  onValidChange?: (valid: boolean) => void;
}

function allAltNonEmpty(slides: HeroSlide[]): boolean {
  return slides.every((s) => s.alt.trim().length > 0);
}

interface SortableRowProps {
  slide: HeroSlide;
  onAltChange: (key: string, alt: string) => void;
  onDelete: (key: string) => void;
}

function SortableSlideRow({
  slide,
  onAltChange,
  onDelete,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide._key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: "#FFFEFB",
    border: isDragging ? "0.5px solid #9A7B4B" : "0.5px solid #E8DDD0",
    borderRadius: "8px",
    padding: "12px",
    boxShadow: isDragging ? "0 8px 24px rgba(44,37,32,0.15)" : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slide-row
      className="flex items-center gap-3"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        data-slide-drag-handle
        className="hero-slide-drag-handle shrink-0 inline-flex items-center justify-center"
        style={{
          color: "#9E8E80",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "grab",
        }}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div
        className="shrink-0 overflow-hidden"
        style={{
          width: "100px",
          height: "68px",
          backgroundColor: "#F3EDE3",
          borderRadius: "4px",
        }}
      >
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt={slide.alt || "Hero slide"}
            className="w-full h-full"
            style={{ objectFit: "cover" }}
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <input
          type="text"
          className="luxury-input w-full"
          placeholder="Describe the image for accessibility"
          value={slide.alt}
          onChange={(e) => onAltChange(slide._key, e.target.value)}
          data-slide-alt-input
          aria-label={`Alt text for slide ${slide._key}`}
        />
        {slide.alt.trim().length === 0 ? (
          <div
            className="mt-1"
            style={{ fontSize: "10.5px", color: "#9B3A2A" }}
          >
            Alt text is required.
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDelete(slide._key)}
        aria-label={`Delete slide ${slide._key}`}
        data-slide-delete-btn
        className="shrink-0 inline-flex items-center justify-center"
        style={{
          color: "#9E8E80",
          background: "transparent",
          border: "none",
          padding: "6px",
          cursor: "pointer",
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const HeroSlideshowEditor = forwardRef<
  HeroSlideshowEditorHandle,
  HeroSlideshowEditorProps
>(function HeroSlideshowEditor(
  { initialSlides, onDirtyChange, onValidChange },
  ref,
) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const { show } = useToast();

  // Mutator helpers all mark dirty + revalidate in one place.
  const updateSlides = useCallback(
    (next: HeroSlide[]) => {
      setSlides(next);
      onDirtyChange?.(true);
      onValidChange?.(allAltNonEmpty(next));
    },
    [onDirtyChange, onValidChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      getSlides: () => slides,
    }),
    [slides],
  );

  // Valid state mirrors alt-text completeness any time slides change.
  useEffect(() => {
    onValidChange?.(allAltNonEmpty(slides));
  }, [slides, onValidChange]);

  // Revoke any dangling blob preview URLs on unmount so the page doesn't leak.
  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = slides.findIndex((s) => s._key === active.id);
      const newIndex = slides.findIndex((s) => s._key === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(slides, oldIndex, newIndex);
      updateSlides(next);
    },
    [slides, updateSlides],
  );

  const handleAltChange = useCallback(
    (key: string, alt: string) => {
      updateSlides(slides.map((s) => (s._key === key ? { ...s, alt } : s)));
    },
    [slides, updateSlides],
  );

  const handleDelete = useCallback(
    (key: string) => {
      const removed = slides.find((s) => s._key === key);
      if (!removed) return;
      updateSlides(slides.filter((s) => s._key !== key));
      show({
        variant: "info",
        title: "Slide removed",
        action: {
          label: "Undo",
          onClick: () => {
            setSlides((prev) => [...prev, removed]);
            onDirtyChange?.(true);
          },
        },
        duration: 5000,
      });
    },
    [slides, updateSlides, show, onDirtyChange],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadError(null);

      if (!file.type.startsWith("image/")) {
        setUploadError("Only images can be uploaded.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          "Image exceeds 4.5MB limit; use a smaller file.",
        );
        return;
      }

      const blobUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(blobUrl);

      try {
        const fd = new FormData();
        fd.append("file", file);
        const response = await fetch("/api/admin/upload-sanity-image", {
          method: "POST",
          body: fd,
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Upload failed");
        }
        const result = (await response.json()) as {
          success: boolean;
          asset: { _id: string; url?: string };
        };
        if (!result.success || !result.asset?._id) {
          throw new Error("Invalid upload response");
        }

        // Guard against a blob pathname accidentally coming back — tests
        // assert the slide is persisted with a Sanity asset ref, not a
        // blob path.
        if (!result.asset._id.startsWith("image-")) {
          throw new Error(
            "Upload returned non-Sanity asset id; refusing to persist.",
          );
        }

        const newSlide: HeroSlide = {
          _key: generatePortalToken(8),
          image: {
            _type: "image",
            asset: { _type: "reference", _ref: result.asset._id },
          },
          alt: "",
          imageUrl: result.asset.url,
        };
        setSlides((prev) => {
          const next = [...prev, newSlide];
          onDirtyChange?.(true);
          onValidChange?.(allAltNonEmpty(next));
          return next;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed";
        setUploadError(message);
      } finally {
        URL.revokeObjectURL(blobUrl);
        blobUrlsRef.current.delete(blobUrl);
      }
    },
    [onDirtyChange, onValidChange],
  );

  const handleFileInput = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
      // Reset the input so the same file can be re-selected if needed.
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadFile],
  );

  const handleDropzoneDrop = useCallback(
    async (e: ReactDragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
    },
    [uploadFile],
  );

  const slideIds = useMemo(() => slides.map((s) => s._key), [slides]);

  return (
    <div className="w-full" data-hero-slideshow-editor>
      {slides.length === 0 ? (
        <div
          data-hero-empty-state
          className="flex flex-col items-center justify-center text-center"
          style={{
            backgroundColor: "#F3EDE3",
            border: "1px dashed #D4C8B8",
            borderRadius: "8px",
            height: "180px",
            color: "#9E8E80",
            fontSize: "13px",
            gap: "8px",
          }}
        >
          <Upload className="w-5 h-5" />
          <span>No slides yet — upload your first hero image</span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slideIds}
            strategy={verticalListSortingStrategy}
          >
            <div
              className="flex flex-col"
              style={{ gap: "8px" }}
              data-slide-list
            >
              {slides.map((slide) => (
                <SortableSlideRow
                  key={slide._key}
                  slide={slide}
                  onAltChange={handleAltChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload dropzone */}
      <div
        data-hero-upload-dropzone
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDropzoneDrop}
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center text-center mt-4 cursor-pointer"
        style={{
          backgroundColor: isDragOver ? "#F5EDD8" : "#F3EDE3",
          border: isDragOver
            ? "1px dashed #9A7B4B"
            : "1px dashed #D4C8B8",
          borderRadius: "8px",
          height: "160px",
          color: "#9E8E80",
          fontSize: "13px",
          gap: "8px",
          transition: "background-color 150ms, border-color 150ms",
        }}
      >
        <Upload className="w-5 h-5" />
        <span>Drop images here or click to select files</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
          data-hero-file-input
        />
      </div>

      {uploadError ? (
        <div
          className="mt-2"
          style={{ fontSize: "11.5px", color: "#9B3A2A" }}
          data-hero-upload-error
        >
          {uploadError}
        </div>
      ) : null}

      {/* Drag handle hover uses gold accent — declared via CSS so the test
          can observe the rule in the stylesheet even though JSDOM doesn't
          evaluate :hover pseudos. */}
      <style>{`
        .hero-slide-drag-handle:hover { color: #9A7B4B; }
      `}</style>
    </div>
  );
});

export default HeroSlideshowEditor;

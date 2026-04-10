import type { WizardImage } from "../../../lib/rendering/types";

interface StepClassifyProps {
  images: WizardImage[];
  onChange: (
    imagesOrUpdater: WizardImage[] | ((prev: WizardImage[]) => WizardImage[]),
  ) => void;
}

const IMAGE_TYPES = [
  "Mood/Inspiration",
  "Floor plan",
  "Elevation",
  "Existing condition",
  "Material sample",
  "Furniture",
  "Other",
] as const;

/**
 * Step 3 of the rendering wizard: per-image classification cards.
 *
 * RNDR-08 regression preserved (D-13 verbatim-port rule): the filename container
 * uses { overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }
 * with `title={img.fileName}` so long filenames are truncated at the layout width
 * and revealed as a tooltip on hover.
 *
 * Ported from src/sanity/components/rendering/Wizard/StepClassify.tsx lines 105-117
 * (filename truncation CSS) and lines 119-153 (imageType dropdown). The Studio
 * version used @sanity/ui Stack/Card/Flex; this admin version uses Tailwind +
 * .luxury-input. If the session has zero images, the parent WizardContainer
 * already guards the step (isClassifyDisabled), so this component can assume at
 * least one image when rendered.
 */
export function StepClassify({ images, onChange }: StepClassifyProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center">
        <p className="text-sm text-[#6B5E52]">
          No images uploaded. You can skip this step.
        </p>
      </div>
    );
  }

  const updateImage = (index: number, update: Partial<WizardImage>) => {
    onChange(images.map((img, i) => (i === index ? { ...img, ...update } : img)));
  };

  return (
    <div className="flex flex-col gap-4">
      {images.map((img, idx) => {
        const thumbSrc =
          img.localPreviewUrl ??
          (img.blobPathname
            ? `/api/blob-serve?path=${encodeURIComponent(img.blobPathname)}`
            : "");

        return (
          <div
            key={`${img.fileName}-${idx}`}
            className="flex gap-4 bg-[#FFFEFB] border-[0.5px] border-[#E8DDD0] rounded-lg p-4"
          >
            {/* Left: 96px thumbnail */}
            <div className="flex-shrink-0">
              {thumbSrc ? (
                <img
                  src={thumbSrc}
                  alt={img.fileName}
                  className="w-24 h-24 rounded-md object-cover border-[0.5px] border-[#E8DDD0]"
                />
              ) : (
                <div className="w-24 h-24 rounded-md bg-[#F3EDE3] border-[0.5px] border-[#E8DDD0] flex items-center justify-center">
                  <span className="text-[11.5px] text-[#9E8E80]">
                    {img.error || "..."}
                  </span>
                </div>
              )}
            </div>

            {/* Right: fields column */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {/* Filename header with CSS truncation (RNDR-08) */}
              <div
                title={img.fileName}
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 120,
                  fontSize: "11.5px",
                  color: "#9E8E80",
                }}
              >
                {img.fileName}
              </div>

              {/* Image type dropdown */}
              <div>
                <label
                  htmlFor={`wizard-image-type-${idx}`}
                  className="block text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#6B5E52] mb-1"
                >
                  Image type
                </label>
                <select
                  id={`wizard-image-type-${idx}`}
                  className="luxury-input w-full"
                  value={img.imageType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const update: Partial<WizardImage> = { imageType: newType };
                    if (newType === "Floor plan") {
                      update.copyExact = true;
                    } else if (img.imageType === "Floor plan") {
                      update.copyExact = false;
                    }
                    updateImage(idx, update);
                  }}
                >
                  <option value="">Select a type...</option>
                  {IMAGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes (optional) */}
              <div>
                <label
                  htmlFor={`wizard-image-notes-${idx}`}
                  className="block text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#6B5E52] mb-1"
                >
                  Notes
                </label>
                <textarea
                  id={`wizard-image-notes-${idx}`}
                  className="luxury-input w-full"
                  rows={2}
                  placeholder="Optional notes"
                  value={img.notes}
                  onChange={(e) => updateImage(idx, { notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

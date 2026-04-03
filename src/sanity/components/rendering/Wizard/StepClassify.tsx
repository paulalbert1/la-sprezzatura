import { Card, Flex, Stack, Text } from "@sanity/ui";
import type { WizardImage } from "../types";
import { getImageServeUrl } from "../types";

interface StepClassifyProps {
  images: WizardImage[];
  onImagesChange: (images: WizardImage[]) => void;
}

const IMAGE_TYPES = [
  "Floor Plan",
  "Existing Space Photo",
  "Inspiration Image",
  "Material Sample",
  "Other",
];

export function StepClassify({ images, onImagesChange }: StepClassifyProps) {
  const hasFloorPlan = images.some((img) => img.imageType === "Floor Plan");

  const updateImage = (index: number, update: Partial<WizardImage>) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, ...update } : img,
    );
    onImagesChange(updated);
  };

  if (images.length === 0) {
    return (
      <Card padding={4}>
        <Text size={1} muted align="center">
          No images uploaded. You can skip this step.
        </Text>
      </Card>
    );
  }

  return (
    <Stack space={4} style={{ maxWidth: 800, margin: "0 auto" }}>
      {images.map((img, idx) => (
        <Card key={`${img.fileName}-${idx}`} padding={4} radius={2} border>
          <Flex gap={4}>
            {/* Left: thumbnail */}
            <div style={{ flexShrink: 0 }}>
              {img.blobPathname ? (
                <img
                  src={getImageServeUrl(img.blobPathname, "studio")}
                  alt={img.fileName}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: "#eee",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text size={0} muted>
                    {img.error || "..."}
                  </Text>
                </div>
              )}
            </div>

            {/* Right: classification fields */}
            <Stack space={3} style={{ flex: 1, minWidth: 0 }}>
              {/* Filename header with CSS truncation */}
              <div
                title={img.fileName}
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <Text size={1} weight="semibold">
                  {img.fileName}
                </Text>
              </div>

              {/* Image type dropdown */}
              <Stack space={1}>
                <Text size={1} weight="semibold">
                  Type
                </Text>
                <select
                  value={img.imageType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const update: Partial<WizardImage> = { imageType: newType };
                    // Auto-set copyExact for Floor Plan
                    if (newType === "Floor Plan") {
                      update.copyExact = true;
                    } else if (img.imageType === "Floor Plan") {
                      update.copyExact = false;
                    }
                    updateImage(idx, update);
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: "1px solid var(--card-border-color, #ccc)",
                    background: "var(--card-bg-color, #fff)",
                    color: "var(--card-fg-color, #333)",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                >
                  {IMAGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Stack>

              {/* Location / Placement */}
              <Stack space={1}>
                <Text size={1} weight="semibold">
                  Location / Placement
                </Text>
                <input
                  type="text"
                  value={img.location}
                  onChange={(e) => updateImage(idx, { location: e.target.value })}
                  placeholder="e.g., Living room north wall"
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: "1px solid var(--card-border-color, #ccc)",
                    background: "var(--card-bg-color, #fff)",
                    color: "var(--card-fg-color, #333)",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </Stack>

              {/* Copy exact checkbox */}
              <Flex align="center" gap={2}>
                <input
                  type="checkbox"
                  checked={img.copyExact}
                  onChange={(e) => updateImage(idx, { copyExact: e.target.checked })}
                  id={`copy-exact-${idx}`}
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor={`copy-exact-${idx}`}>
                  <Text size={1}>Copy exact (reproduce faithfully)</Text>
                </label>
              </Flex>

              {/* Notes */}
              <Stack space={1}>
                <Text size={1} weight="semibold">
                  Notes
                </Text>
                <input
                  type="text"
                  value={img.notes}
                  onChange={(e) => updateImage(idx, { notes: e.target.value })}
                  placeholder="Optional notes for the AI"
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: "1px solid var(--card-border-color, #ccc)",
                    background: "var(--card-bg-color, #fff)",
                    color: "var(--card-fg-color, #333)",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </Stack>
            </Stack>
          </Flex>
        </Card>
      ))}

      {/* Soft warning if no floor plan */}
      {!hasFloorPlan && (
        <Card tone="caution" padding={3}>
          <Text size={1}>
            Results may be less spatially accurate without a floor plan.
          </Text>
        </Card>
      )}
    </Stack>
  );
}

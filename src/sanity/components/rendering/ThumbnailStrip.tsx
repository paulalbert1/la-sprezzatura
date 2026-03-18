import { Flex } from "@sanity/ui";
import { WarningOutlineIcon, StarFilledIcon } from "@sanity/icons";
import { getImageServeUrl } from "./types";
import type { RenderingOutput } from "./types";

interface ThumbnailStripProps {
  renderings: RenderingOutput[];
  activeIndex: number | null;
  onSelect: (index: number) => void;
}

export function ThumbnailStrip({
  renderings,
  activeIndex,
  onSelect,
}: ThumbnailStripProps) {
  if (renderings.length === 0) return null;

  return (
    <Flex
      gap={2}
      padding={3}
      style={{
        overflowX: "auto",
        borderBottom: "1px solid var(--card-border-color)",
      }}
    >
      {renderings.map((rendering, index) => {
        const isActive = activeIndex === index;
        const isError = rendering.status === "error";
        const isPromoted = rendering.isPromoted;

        return (
          <button
            key={rendering._key}
            onClick={() => onSelect(index)}
            style={{
              position: "relative",
              width: 48,
              height: 48,
              flexShrink: 0,
              padding: 0,
              border: isActive
                ? "2px solid var(--card-focus-ring-color)"
                : "2px solid transparent",
              borderRadius: 4,
              cursor: "pointer",
              background: "var(--card-bg-color)",
              overflow: "hidden",
            }}
            title={
              isError
                ? "Failed rendering"
                : `Rendering ${index + 1}${isPromoted ? " (promoted)" : ""}`
            }
          >
            {isError || !rendering.blobPathname ? (
              <Flex
                align="center"
                justify="center"
                style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--card-muted-bg-color)",
                }}
              >
                <WarningOutlineIcon
                  style={{ fontSize: 20, color: "var(--card-badge-critical-dot-color)" }}
                />
              </Flex>
            ) : (
              <img
                src={getImageServeUrl(rendering.blobPathname, "studio")}
                alt={`Rendering ${index + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
              />
            )}
            {/* Promoted badge */}
            {isPromoted && !isError && (
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  fontSize: 12,
                  lineHeight: 1,
                  color: "#D97706",
                }}
              >
                <StarFilledIcon />
              </span>
            )}
            {/* Error badge */}
            {isError && (
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--card-badge-critical-dot-color, #f03e2f)",
                }}
              />
            )}
          </button>
        );
      })}
    </Flex>
  );
}

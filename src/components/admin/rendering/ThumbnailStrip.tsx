import { AlertTriangle, Star } from "lucide-react";
import type { RenderingOutput } from "../../../lib/rendering/types";

interface ThumbnailStripProps {
  renderings: RenderingOutput[];
  activeIndex: number | null;
  onSelect: (index: number) => void;
}

/**
 * Horizontal thumbnail strip for the admin chat view's left pane.
 *
 * Ported from src/sanity/components/rendering/ThumbnailStrip.tsx (D-13 verbatim-port
 * rule): promoted-star overlay, error fallback, and active selection logic come
 * from the Studio source. Only restyled per 33-UI-SPEC.md § 4:
 *   - 64px square buttons with 8px gap
 *   - active border: 1.5px solid #9A7B4B
 *   - inactive border: 0.5px solid #D4C8B8
 *   - promoted star uses lucide-react <Star fill="#D97706" />
 *   - error state uses lucide-react <AlertTriangle />
 *
 * Uses /api/blob-serve?path=... for image src — the admin session cookie
 * authenticates the same-origin request (T-33-02 accepted).
 */
export function ThumbnailStrip({
  renderings,
  activeIndex,
  onSelect,
}: ThumbnailStripProps) {
  if (renderings.length === 0) return null;

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 mt-4"
      role="tablist"
      aria-label="Rendering variants"
    >
      {renderings.map((rendering, index) => {
        const isActive = activeIndex === index;
        const isError = rendering.status === "error";
        const isPromoted = rendering.isPromoted;

        return (
          <button
            key={rendering._key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(index)}
            className="flex-shrink-0 rounded-md overflow-hidden relative"
            style={{
              width: 64,
              height: 64,
              padding: 0,
              border: isActive
                ? "1.5px solid #9A7B4B"
                : "0.5px solid #D4C8B8",
              cursor: "pointer",
              background: "#FFFEFB",
            }}
            title={
              isError
                ? "Failed rendering"
                : `Rendering ${index + 1}${isPromoted ? " (promoted)" : ""}`
            }
          >
            {isError || !rendering.blobPathname ? (
              <div
                className="flex items-center justify-center"
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#F3EDE3",
                }}
              >
                <AlertTriangle
                  className="w-5 h-5"
                  style={{ color: "#9B3A2A" }}
                />
              </div>
            ) : (
              <img
                src={`/api/blob-serve?path=${encodeURIComponent(rendering.blobPathname)}`}
                alt={`Rendering ${index + 1}`}
                className="w-full h-full object-cover"
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
                  lineHeight: 1,
                }}
                aria-label="Promoted"
              >
                <Star
                  className="w-3 h-3"
                  style={{ color: "#D97706", fill: "#D97706" }}
                />
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
                  background: "#9B3A2A",
                }}
                aria-label="Error"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

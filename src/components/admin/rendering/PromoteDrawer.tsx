import { useState, useEffect, useCallback } from "react";
import { Loader2, X } from "lucide-react";
import type { RenderingSession } from "../../../lib/rendering/types";

/**
 * PromoteDrawer — right-side parchment slide-in drawer for the promote-to-Design-Options workflow.
 *
 * Port notes (D-13 verbatim-port rule from 33-06-PLAN.md):
 *   - Promote request flow, success/error handling, selected-variant state, and
 *     caption field are ported verbatim from
 *     src/sanity/components/rendering/PromoteDialog.tsx (lines 30-101).
 *   - Only layout shell and styling differ:
 *       * @sanity/ui Dialog/Stack/Flex/Button/TextInput -> Tailwind flex divs + native textarea
 *       * @sanity/icons -> lucide-react (X, Loader2)
 *       * Modal dialog -> right-side slide-in drawer per 33-UI-SPEC.md section 8 (D-18)
 *   - Studio-specific hooks fully removed:
 *       * Sanity client hook -> not needed (admin fetches project list server-side)
 *       * Tool-context hook  -> props (sanityUserId, studioToken)
 *   - studioToken arrives as a prop from ChatView (which received it from the
 *     Astro shell) so the secret never lands in the client bundle via module
 *     evaluation (T-33-01 mitigation — zero environment-object reads here).
 *   - Scratchpad project-picker branch from the Studio source is intentionally
 *     NOT ported. Admin session creation always requires a project (Plan 03
 *     Wizard enforces this at /admin/rendering/new), so session.project is
 *     always present when this drawer renders. If scratchpad support is ever
 *     added to admin, the project picker can be restored here.
 */

interface PromoteDrawerProps {
  session: RenderingSession;
  activeRenderingIndex: number;
  sanityUserId: string;
  studioToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromoteDrawer({
  session,
  activeRenderingIndex,
  sanityUserId,
  studioToken,
  onClose,
  onSuccess,
}: PromoteDrawerProps) {
  const [selectedIndex, setSelectedIndex] = useState(activeRenderingIndex);
  const [caption, setCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape key dismissal (third dismissal path alongside X icon and overlay click).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPublishing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, isPublishing]);

  const handlePublish = useCallback(async () => {
    const rendering = session.renderings?.[selectedIndex];
    if (!rendering) return;

    setIsPublishing(true);
    setError(null);

    try {
      const res = await fetch("/api/rendering/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-studio-token": studioToken,
        },
        body: JSON.stringify({
          sessionId: session._id,
          renderingIndex: selectedIndex,
          projectId: session.project?._id ?? "",
          caption,
          sanityUserId,
        }),
      });

      if (!res.ok) {
        setError("Could not publish. Please try again.");
        setIsPublishing(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Could not publish. Please try again.");
      setIsPublishing(false);
    }
  }, [
    session,
    selectedIndex,
    caption,
    sanityUserId,
    studioToken,
    onSuccess,
    onClose,
  ]);

  const selectedRendering = session.renderings?.[selectedIndex];
  const hasMultipleRenderings = (session.renderings?.length ?? 0) > 1;

  return (
    <>
      {/* Overlay — dismiss on click (first dismissal path) */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(44, 37, 32, 0.30)",
          backdropFilter: "blur(2px)",
        }}
        onClick={() => {
          if (!isPublishing) onClose();
        }}
        aria-hidden="true"
      />

      {/* Drawer — right-side slide-in (D-18) */}
      <div
        className="fixed right-0 top-0 h-screen flex flex-col shadow-xl z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promote-drawer-title"
        style={{
          width: "480px",
          background: "#FFFEFB",
          borderLeft: "0.5px solid #E8DDD0",
          transform: "translateX(0)",
          transition: "transform 200ms ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "0.5px solid #E8DDD0" }}
        >
          <p
            id="promote-drawer-title"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#2C2520",
            }}
          >
            Promote to Design Options
          </p>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            disabled={isPublishing}
            className="transition-colors"
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: isPublishing ? "not-allowed" : "pointer",
            }}
          >
            <X
              className="w-5 h-5"
              style={{ color: "#9E8E80" }}
              onMouseEnter={(e) => {
                (e.currentTarget as unknown as HTMLElement).style.color =
                  "#2C2520";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as unknown as HTMLElement).style.color =
                  "#9E8E80";
              }}
            />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Error banner */}
          {error && (
            <div
              className="text-sm px-4 py-3 rounded-lg mb-4"
              style={{
                background: "#FBEEE8",
                color: "#9B3A2A",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Preview band — parchment wrapper around the selected rendering */}
          <div
            className="rounded-xl p-4 mb-6"
            style={{
              background: "#F3EDE3",
              border: "0.5px solid #E8DDD0",
            }}
          >
            {selectedRendering?.blobPathname ? (
              <img
                src={`/api/blob-serve?path=${encodeURIComponent(
                  selectedRendering.blobPathname,
                )}`}
                alt="Selected rendering preview"
                className="w-full object-contain rounded-lg block mx-auto"
                style={{ maxHeight: "240px" }}
              />
            ) : (
              <div
                className="w-full flex items-center justify-center text-sm"
                style={{
                  minHeight: "180px",
                  color: "#9E8E80",
                }}
              >
                No preview available
              </div>
            )}
          </div>

          {/* Variant selector — only when more than one rendering exists (D-19) */}
          {hasMultipleRenderings && (
            <div className="mb-6">
              <p
                className="mb-2 uppercase"
                style={{
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "#6B5E52",
                  letterSpacing: "0.04em",
                }}
              >
                Variant
              </p>
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                role="tablist"
                aria-label="Select variant"
              >
                {session.renderings!.map((r, i) => {
                  const isActive = i === selectedIndex;
                  return (
                    <button
                      key={r._key ?? i}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Variant ${i + 1}`}
                      onClick={() => setSelectedIndex(i)}
                      disabled={isPublishing}
                      className="flex-shrink-0 rounded-md overflow-hidden transition-all"
                      style={{
                        width: "64px",
                        height: "64px",
                        border: isActive
                          ? "1.5px solid #9A7B4B"
                          : "0.5px solid #D4C8B8",
                        outline: isActive ? "2px solid #F5EDD8" : "none",
                        outlineOffset: "1px",
                        background: "#FFFEFB",
                        padding: 0,
                        cursor: isPublishing ? "not-allowed" : "pointer",
                      }}
                    >
                      {r.blobPathname && (
                        <img
                          src={`/api/blob-serve?path=${encodeURIComponent(
                            r.blobPathname,
                          )}`}
                          alt={`Rendering ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Caption */}
          <div>
            <label
              htmlFor="promote-caption"
              className="block mb-1 uppercase"
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: "#6B5E52",
                letterSpacing: "0.04em",
              }}
            >
              Caption
            </label>
            <textarea
              id="promote-caption"
              className="luxury-input w-full"
              rows={4}
              placeholder="e.g., Contemporary living room with walnut accents"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isPublishing}
            />
          </div>
        </div>

        {/* Footer — solid gold Publish button (D-18) */}
        <div
          className="px-6 py-4"
          style={{ borderTop: "0.5px solid #E8DDD0" }}
        >
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors bg-[#9A7B4B]"
            style={{
              background: isPublishing ? "#C4A97A" : "#9A7B4B",
              cursor: isPublishing ? "not-allowed" : "pointer",
              border: "none",
            }}
            onMouseEnter={(e) => {
              if (!isPublishing) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#8A6D40";
              }
            }}
            onMouseLeave={(e) => {
              if (!isPublishing) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#9A7B4B";
              }
            }}
          >
            {isPublishing ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </span>
            ) : (
              "Publish to gallery"
            )}
          </button>
        </div>
      </div>
    </>
  );
}

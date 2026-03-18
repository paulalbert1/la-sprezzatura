import { useState, useEffect, useCallback } from "react";
import { Card, Flex, Stack, Text, Button, Spinner } from "@sanity/ui";
import {
  StarIcon,
  StarFilledIcon,
  SearchIcon,
  DownloadIcon,
  WarningOutlineIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@sanity/icons";
import { getImageServeUrl, getStudioHeaders } from "./types";
import type { RenderingOutput } from "./types";
import { useToolContext } from "./RenderingTool";

interface RenderingCardProps {
  rendering: RenderingOutput;
  index: number;
  sessionId: string;
  projectId: string | null;
  allRenderings: RenderingOutput[];
  onPromote: (index: number) => void;
  onSessionRefresh: () => void;
  onRetry?: (index: number) => void;
}

export function RenderingCard({
  rendering,
  index,
  sessionId,
  projectId,
  allRenderings,
  onPromote,
  onSessionRefresh,
  onRetry,
}: RenderingCardProps) {
  const { sanityUserId } = useToolContext();
  const [unpromoting, setUnpromoting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(index);

  // Error rendering variant
  if (rendering.status === "error") {
    return (
      <Card radius={2} border tone="critical" padding={4} style={{ maxWidth: "85%" }}>
        <Flex gap={3} align="center">
          <WarningOutlineIcon style={{ fontSize: 24 }} />
          <Stack space={2} style={{ flex: 1 }}>
            <Text size={1}>
              {rendering.errorMessage ||
                "Generation failed. Tap to retry -- you will not be charged for the failed attempt."}
            </Text>
            <Button
              text="Retry"
              mode="ghost"
              tone="primary"
              fontSize={1}
              onClick={() => onRetry?.(index)}
            />
          </Stack>
        </Flex>
      </Card>
    );
  }

  const imageUrl = getImageServeUrl(rendering.blobPathname, "studio");
  const latencyS = (rendering.latencyMs / 1000).toFixed(1);
  const costDollars = (rendering.costEstimate / 100).toFixed(2);
  const modelShortName = rendering.modelId
    ? rendering.modelId.split("/").pop()?.replace(/-/g, " ") || rendering.modelId
    : "unknown";

  async function handleUnpromote() {
    setUnpromoting(true);
    try {
      const res = await fetch("/api/rendering/promote", {
        method: "POST",
        headers: getStudioHeaders(),
        body: JSON.stringify({
          sessionId,
          renderingIndex: index,
          unpromote: true,
          sanityUserId,
        }),
      });
      if (res.ok) {
        onSessionRefresh();
      }
    } catch {
      // Silently fail
    } finally {
      setUnpromoting(false);
    }
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `rendering-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function openLightbox() {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  return (
    <>
      <Card radius={2} overflow="hidden" border style={{ maxWidth: "85%" }}>
        {/* Image */}
        <img
          src={imageUrl}
          alt={`Rendering ${index + 1}`}
          style={{ width: "100%", display: "block", cursor: "pointer" }}
          loading={index === allRenderings.length - 1 ? "eager" : "lazy"}
          onClick={openLightbox}
        />

        {/* Action buttons */}
        <Flex align="center" gap={2} padding={3}>
          {rendering.isPromoted ? (
            <Flex align="center" gap={1}>
              <StarFilledIcon style={{ color: "#D97706" }} />
              <Text size={0}>Promoted</Text>
              <Button
                text="Edit Caption"
                mode="ghost"
                fontSize={0}
                onClick={() => onPromote(index)}
              />
              <Button
                text="Unpromote"
                mode="ghost"
                fontSize={0}
                tone="critical"
                onClick={handleUnpromote}
                disabled={unpromoting}
              />
              {unpromoting && <Spinner muted />}
            </Flex>
          ) : (
            <Button
              icon={StarIcon}
              text="Promote"
              mode="ghost"
              fontSize={1}
              onClick={() => onPromote(index)}
            />
          )}

          <Flex style={{ flex: 1 }} />

          <Button
            icon={SearchIcon}
            mode="ghost"
            title="Full size"
            onClick={openLightbox}
          />
          <Button
            icon={DownloadIcon}
            mode="ghost"
            title="Download"
            onClick={handleDownload}
          />
        </Flex>

        {/* View prompt -- expandable */}
        <details style={{ padding: "0 12px 8px" }}>
          <summary style={{ cursor: "pointer" }}>
            <Text size={0} muted style={{ display: "inline" }}>
              View prompt
            </Text>
          </summary>
          <div style={{ padding: "8px 0 12px" }}>
            <Text size={0} muted style={{ whiteSpace: "pre-wrap" }}>
              {rendering.prompt}
            </Text>
          </div>
        </details>

        {/* Metadata footer */}
        <Flex padding={2} paddingX={3} justify="flex-end">
          <Text size={0} muted>
            {latencyS}s &middot; ${costDollars} &middot; {modelShortName}
          </Text>
        </Flex>
      </Card>

      {/* Studio Lightbox */}
      {lightboxOpen && (
        <StudioLightbox
          renderings={allRenderings}
          currentIndex={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// -- Studio Lightbox (Full-Size View) --

interface StudioLightboxProps {
  renderings: RenderingOutput[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

function StudioLightbox({
  renderings,
  currentIndex,
  onIndexChange,
  onClose,
}: StudioLightboxProps) {
  // Filter to only successful renderings for navigation
  const successRenderings = renderings
    .map((r, i) => ({ ...r, originalIndex: i }))
    .filter((r) => r.status === "complete" && r.blobPathname);

  const currentSuccessIdx = successRenderings.findIndex(
    (r) => r.originalIndex === currentIndex,
  );
  const effectiveIdx = currentSuccessIdx >= 0 ? currentSuccessIdx : 0;

  const current = successRenderings[effectiveIdx];
  const hasPrev = effectiveIdx > 0;
  const hasNext = effectiveIdx < successRenderings.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) {
      onIndexChange(successRenderings[effectiveIdx - 1].originalIndex);
    }
  }, [hasPrev, effectiveIdx, successRenderings, onIndexChange]);

  const goNext = useCallback(() => {
    if (hasNext) {
      onIndexChange(successRenderings[effectiveIdx + 1].originalIndex);
    }
  }, [hasNext, effectiveIdx, successRenderings, onIndexChange]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goPrev, goNext]);

  if (!current) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Dark backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.9)",
        }}
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 51,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.8)",
          fontSize: 24,
        }}
        aria-label="Close lightbox"
      >
        <CloseIcon />
      </button>

      {/* Navigation arrows */}
      {hasPrev && (
        <button
          onClick={goPrev}
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 51,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.7)",
            fontSize: 32,
          }}
          aria-label="Previous rendering"
        >
          <ChevronLeftIcon />
        </button>
      )}
      {hasNext && (
        <button
          onClick={goNext}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 51,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.7)",
            fontSize: 32,
          }}
          aria-label="Next rendering"
        >
          <ChevronRightIcon />
        </button>
      )}

      {/* Image */}
      <img
        src={getImageServeUrl(current.blobPathname, "studio")}
        alt={`Rendering ${effectiveIdx + 1}`}
        style={{
          maxWidth: "90vw",
          maxHeight: "85vh",
          objectFit: "contain",
          position: "relative",
          zIndex: 51,
        }}
      />

      {/* Counter */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 51,
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          letterSpacing: "0.1em",
        }}
      >
        {effectiveIdx + 1} / {successRenderings.length}
      </div>
    </div>
  );
}

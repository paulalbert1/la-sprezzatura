import { useState, useEffect, useRef, useCallback } from "react";
import { useClient } from "sanity";
import { Card, Flex, Stack, Text, Button, TextInput, Spinner } from "@sanity/ui";
import {
  ArrowLeftIcon,
  SparklesIcon,
  CloseIcon,
  UploadIcon,
} from "@sanity/icons";

// @sanity/icons has no PaperclipIcon -- UploadIcon is the closest match
const PaperclipIcon = UploadIcon;
import { UsageBadge } from "./UsageBadge";
import { ChatMessage } from "./ChatMessage";
import { RenderingCard } from "./RenderingCard";
import { ThumbnailStrip } from "./ThumbnailStrip";
import { PromoteDialog } from "./PromoteDialog";
import { useToolContext } from "./RenderingTool";
import { getStudioHeaders, getImageServeUrl } from "./types";
import type {
  RenderingSession,
  RenderingOutput,
  WizardImage,
} from "./types";
import { RENDERING_SESSION_BY_ID_QUERY } from "../../../sanity/queries";

interface ChatViewProps {
  sessionId: string;
}

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/heic";
const IMAGE_TYPE_OPTIONS = [
  "Mood / Inspiration",
  "Floor plan",
  "Elevation / Section",
  "Existing condition",
  "Material / Finish sample",
  "Furniture / Fixture",
  "Other",
];

export function ChatView({ sessionId }: ChatViewProps) {
  const { state, dispatch, usage, refreshUsage, sanityUserId } =
    useToolContext();
  const client = useClient({ apiVersion: "2024-01-01" });
  const threadRef = useRef<HTMLDivElement>(null);

  // State
  const [session, setSession] = useState<RenderingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementText, setRefinementText] = useState("");
  const [attachedImages, setAttachedImages] = useState<WizardImage[]>([]);
  const [activeThumbIndex, setActiveThumbIndex] = useState<number | null>(null);

  // Promote dialog state
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteIndex, setPromoteIndex] = useState<number>(0);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    try {
      const data = await client.fetch(RENDERING_SESSION_BY_ID_QUERY, {
        sessionId,
      });
      setSession(data);
      if (data?.renderings?.length) {
        setActiveThumbIndex(data.renderings.length - 1);
      }
    } catch (err) {
      console.error("[ChatView] Failed to fetch session:", err);
    } finally {
      setLoading(false);
    }
  }, [client, sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Poll for status when generating
  useEffect(() => {
    if (!session || session.status !== "generating") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/rendering/status?sessionId=${encodeURIComponent(sessionId)}`,
          { headers: getStudioHeaders() },
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "complete" || data.status === "error") {
          clearInterval(interval);
          setIsRefining(false);
          await fetchSession();
          refreshUsage();
        }
      } catch {
        // Silently retry
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session?.status, sessionId, fetchSession, refreshUsage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [session?.conversation?.length, session?.renderings?.length, isRefining]);

  // Refine handler
  async function handleRefine() {
    if ((!refinementText.trim() && attachedImages.length === 0) || isRefining) return;
    if (usage && usage.count >= usage.limit) return;

    setIsRefining(true);
    const text = refinementText.trim();
    setRefinementText("");

    try {
      const newImages = attachedImages.map((img) => ({
        blobPathname: img.blobPathname,
        imageType: img.imageType,
        location: img.location,
        notes: img.notes,
        copyExact: img.copyExact,
      }));
      setAttachedImages([]);

      const res = await fetch("/api/rendering/refine", {
        method: "POST",
        headers: getStudioHeaders(),
        body: JSON.stringify({
          sessionId,
          refinementText: text,
          newImages: newImages.length > 0 ? newImages : undefined,
          sanityUserId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        console.error("[ChatView] Refine failed:", err);
        setIsRefining(false);
        return;
      }

      // Session status is now "generating" -- polling handles the rest
      // Update local session status immediately for skeleton display
      setSession((prev) =>
        prev ? { ...prev, status: "generating" } : prev,
      );
    } catch (err) {
      console.error("[ChatView] Refine error:", err);
      setIsRefining(false);
    }
  }

  // Image upload handler
  async function handleImageAttach() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = IMAGE_ACCEPT;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const newImage: WizardImage = {
        blobPathname: "",
        fileName: file.name,
        imageType: "Mood / Inspiration",
        location: "",
        notes: "",
        copyExact: false,
        uploading: true,
      };
      setAttachedImages((prev) => [...prev, newImage]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/rendering/upload", {
          method: "POST",
          headers: { "x-studio-token": getStudioHeaders()["x-studio-token"] },
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        setAttachedImages((prev) =>
          prev.map((img) =>
            img.fileName === file.name && img.uploading
              ? { ...img, blobPathname: data.pathname, uploading: false }
              : img,
          ),
        );
      } catch {
        setAttachedImages((prev) =>
          prev.map((img) =>
            img.fileName === file.name && img.uploading
              ? { ...img, uploading: false, error: "Upload failed" }
              : img,
          ),
        );
      }
    };
    input.click();
  }

  function handlePromote(renderingIndex: number) {
    setPromoteIndex(renderingIndex);
    setPromoteDialogOpen(true);
  }

  function handleRetry(renderingIndex: number) {
    // Re-send the last user message as a refinement
    if (!session) return;
    const lastUserEntry = [...(session.conversation || [])]
      .reverse()
      .find((e) => e.role === "user");
    if (lastUserEntry) {
      setRefinementText(lastUserEntry.text);
    }
  }

  // Build chronological thread from conversation + renderings
  function buildThread() {
    if (!session) return [];

    const entries: Array<{
      type: "user" | "model-text" | "rendering" | "skeleton";
      text?: string;
      images?: string[];
      rendering?: RenderingOutput;
      renderingIndex?: number;
      timestamp: string;
    }> = [];

    // Walk conversation entries and pair with renderings
    let renderingIdx = 0;
    for (const conv of session.conversation || []) {
      if (conv.role === "user") {
        entries.push({
          type: "user",
          text: conv.text,
          images: conv.image ? [conv.image] : undefined,
          timestamp: conv.timestamp,
        });
      } else if (conv.role === "model") {
        // Model text response
        if (conv.text) {
          entries.push({
            type: "model-text",
            text: conv.text,
            timestamp: conv.timestamp,
          });
        }
        // Associated rendering
        if (renderingIdx < (session.renderings || []).length) {
          const r = session.renderings[renderingIdx];
          entries.push({
            type: "rendering",
            rendering: r,
            renderingIndex: renderingIdx,
            timestamp: r.generatedAt || conv.timestamp,
          });
          renderingIdx++;
        }
      }
    }

    // Any renderings without conversation entries (initial generation)
    while (renderingIdx < (session.renderings || []).length) {
      const r = session.renderings[renderingIdx];
      entries.push({
        type: "rendering",
        rendering: r,
        renderingIndex: renderingIdx,
        timestamp: r.generatedAt,
      });
      renderingIdx++;
    }

    return entries;
  }

  if (loading) {
    return (
      <Card
        height="fill"
        display="flex"
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Spinner muted />
      </Card>
    );
  }

  if (!session) {
    return (
      <Card padding={4}>
        <Text size={2}>Session not found.</Text>
        <Button
          text="Back"
          mode="ghost"
          onClick={() => dispatch({ type: "BACK_TO_LIST" })}
          style={{ marginTop: 16 }}
        />
      </Card>
    );
  }

  const thread = buildThread();
  const projectId = session.project?._id || null;
  const usageLimitReached = usage ? usage.count >= usage.limit : false;
  const canRefine =
    (refinementText.trim() !== "" || attachedImages.length > 0) &&
    !isRefining &&
    !usageLimitReached;

  return (
    <>
      <Card
        height="fill"
        display="flex"
        style={{ flexDirection: "column" }}
      >
        {/* Header bar */}
        <Flex
          align="center"
          padding={3}
          style={{ borderBottom: "1px solid var(--card-border-color)" }}
        >
          <Button
            icon={ArrowLeftIcon}
            mode="ghost"
            aria-label="Back to sessions"
            onClick={() => dispatch({ type: "BACK_TO_LIST" })}
          />
          <Stack
            space={1}
            style={{ flex: 1, paddingLeft: 12, paddingRight: 12 }}
          >
            <Text size={2} weight="semibold">
              {session.sessionTitle}
            </Text>
            <Text size={1} muted>
              {session.project?.title || "Scratchpad"}
            </Text>
          </Stack>
          {usage && <UsageBadge count={usage.count} limit={usage.limit} compact />}
        </Flex>

        {/* Thumbnail strip */}
        <ThumbnailStrip
          renderings={session.renderings || []}
          activeIndex={activeThumbIndex}
          onSelect={setActiveThumbIndex}
        />

        {/* Chat thread */}
        <div
          ref={threadRef}
          style={{ flex: 1, overflowY: "auto", padding: 16 }}
        >
          <Stack space={4}>
            {thread.map((entry, i) => {
              if (entry.type === "user") {
                return (
                  <ChatMessage
                    key={`user-${i}`}
                    role="user"
                    text={entry.text || ""}
                    images={entry.images}
                  />
                );
              }
              if (entry.type === "model-text") {
                return (
                  <ChatMessage
                    key={`model-${i}`}
                    role="model"
                    text={entry.text || ""}
                  />
                );
              }
              if (entry.type === "rendering" && entry.rendering) {
                return (
                  <Flex key={`render-${i}`} justify="flex-start">
                    <RenderingCard
                      rendering={entry.rendering}
                      index={entry.renderingIndex!}
                      sessionId={sessionId}
                      projectId={projectId}
                      allRenderings={session.renderings || []}
                      onPromote={handlePromote}
                      onSessionRefresh={fetchSession}
                      onRetry={handleRetry}
                    />
                  </Flex>
                );
              }
              return null;
            })}

            {/* Generating skeleton */}
            {(isRefining || session.status === "generating") && (
              <Flex justify="flex-start">
                <Card
                  padding={4}
                  radius={2}
                  tone="default"
                  style={{ maxWidth: "85%" }}
                >
                  <div
                    style={{
                      height: 200,
                      background: "var(--card-muted-bg-color)",
                      borderRadius: 4,
                      animation: "pulse 2s ease-in-out infinite",
                    }}
                  />
                  <Text size={1} muted style={{ marginTop: 8 }}>
                    Generating...
                  </Text>
                </Card>
              </Flex>
            )}
          </Stack>
        </div>

        {/* Attached images preview */}
        {attachedImages.length > 0 && (
          <Flex
            gap={2}
            padding={3}
            style={{ borderTop: "1px solid var(--card-border-color)" }}
          >
            {attachedImages.map((img, idx) => (
              <Card key={idx} padding={3} radius={2} border>
                <Flex gap={3}>
                  {img.blobPathname ? (
                    <img
                      src={getImageServeUrl(img.blobPathname, "studio")}
                      alt={img.fileName}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: "var(--card-muted-bg-color)",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {img.uploading ? <Spinner muted /> : null}
                    </div>
                  )}
                  <Stack space={2} style={{ flex: 1 }}>
                    <select
                      value={img.imageType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAttachedImages((prev) =>
                          prev.map((im, j) =>
                            j === idx ? { ...im, imageType: val } : im,
                          ),
                        );
                      }}
                      style={{ fontSize: 12 }}
                    >
                      {IMAGE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Placement / location"
                      value={img.location}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAttachedImages((prev) =>
                          prev.map((im, j) =>
                            j === idx ? { ...im, location: val } : im,
                          ),
                        );
                      }}
                      style={{ fontSize: 12, padding: "2px 4px" }}
                    />
                  </Stack>
                  <Button
                    icon={CloseIcon}
                    mode="ghost"
                    onClick={() =>
                      setAttachedImages((prev) =>
                        prev.filter((_, j) => j !== idx),
                      )
                    }
                  />
                </Flex>
              </Card>
            ))}
          </Flex>
        )}

        {/* Input bar */}
        <Flex
          align="center"
          gap={2}
          padding={3}
          style={{ borderTop: "1px solid var(--card-border-color)" }}
        >
          <Button
            icon={PaperclipIcon}
            mode="ghost"
            title="Attach image"
            onClick={handleImageAttach}
          />
          <div style={{ flex: 1 }}>
            <TextInput
              placeholder="Describe refinements..."
              value={refinementText}
              onChange={(e) =>
                setRefinementText(
                  (e.target as HTMLInputElement).value,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && canRefine) {
                  e.preventDefault();
                  handleRefine();
                }
              }}
              disabled={isRefining}
            />
          </div>
          <Button
            icon={SparklesIcon}
            tone="primary"
            title="Refine"
            onClick={handleRefine}
            disabled={!canRefine}
          />
        </Flex>
      </Card>

      {/* Promote Dialog */}
      {session.renderings?.[promoteIndex] && (
        <PromoteDialog
          isOpen={promoteDialogOpen}
          onClose={() => setPromoteDialogOpen(false)}
          rendering={session.renderings[promoteIndex]}
          renderingIndex={promoteIndex}
          sessionId={sessionId}
          projectId={projectId}
          onPromoted={() => {
            setPromoteDialogOpen(false);
            fetchSession();
          }}
        />
      )}

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}

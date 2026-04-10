import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Loader2, Send, Share, Sparkles } from "lucide-react";
import type {
  ConversationEntry,
  RenderingOutput,
  RenderingSession,
} from "../../../lib/rendering/types";
import { ChatMessage } from "./ChatMessage";
import { ThumbnailStrip } from "./ThumbnailStrip";
import PromoteDrawer from "./PromoteDrawer";

interface ChatViewProps {
  sessionId: string;
  sanityUserId: string;
  studioToken: string;
  initialSession?: RenderingSession | null;
}

/**
 * Chat refinement view for /admin/rendering/[sessionId].
 *
 * Port notes (D-13 verbatim-port rule from 33-05-PLAN.md):
 *   - State shape, buildThread walk, polling loop, handleRefine flow, and
 *     optimistic message handling are all ported verbatim from
 *     src/sanity/components/rendering/ChatView.tsx (lines 42-317).
 *   - Only layout shell and styling differ:
 *       * @sanity/ui Card/Flex/Stack/Text/Button -> Tailwind flex divs
 *       * @sanity/icons -> lucide-react
 *       * 65/35 side-by-side layout with 899px stacked fallback (D-11, D-12)
 *   - Studio-specific hooks fully removed:
 *       * Sanity client hook -> fetch /api/rendering/status (initial + polling)
 *       * Tool-context hook  -> props (sanityUserId, studioToken)
 *   - studioToken arrives as a prop from the Astro shell so the secret never
 *     lands in the client bundle via module evaluation (T-33-01 mitigation).
 *   - Promote button is rendered in the chat header (D-14). Plan 33-06 wires
 *     the real PromoteDrawer component (right-side parchment slide-in) behind
 *     the showPromoteDrawer flag, plus a success toast that auto-dismisses
 *     after 3s when onSuccess fires.
 */
export default function ChatView({
  sessionId,
  sanityUserId,
  studioToken,
  initialSession,
}: ChatViewProps) {
  const [session, setSession] = useState<RenderingSession | null>(
    initialSession ?? null,
  );
  const [loading, setLoading] = useState(!initialSession);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementText, setRefinementText] = useState("");
  const [activeThumbIndex, setActiveThumbIndex] = useState<number>(
    initialSession && initialSession.renderings?.length
      ? initialSession.renderings.length - 1
      : 0,
  );
  const [showPromoteDrawer, setShowPromoteDrawer] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  // Auto-dismiss the success toast 3s after it appears (UI-SPEC § 8 "Success").
  useEffect(() => {
    if (!showSuccessToast) return;
    const t = setTimeout(() => setShowSuccessToast(false), 3000);
    return () => clearTimeout(t);
  }, [showSuccessToast]);

  const threadRef = useRef<HTMLDivElement>(null);

  // Media query for 900px stacked breakpoint (D-12)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 899px)");
    setIsNarrow(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Session fetch (replaces the Studio Sanity-client hook per Risk 5).
  // Only runs when no initialSession was provided (SSR path pre-fetched via GROQ).
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/rendering/status?sessionId=${encodeURIComponent(sessionId)}`,
        { headers: { "x-studio-token": studioToken } },
      );
      if (!res.ok) {
        setError("Could not load session.");
        return;
      }
      const data: RenderingSession = await res.json();
      setSession(data);
      if (data?.renderings?.length) {
        setActiveThumbIndex(data.renderings.length - 1);
      }
    } catch {
      setError("Could not load session.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, studioToken]);

  useEffect(() => {
    if (initialSession) {
      setLoading(false);
      return;
    }
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for status while generating (ported from Studio ChatView lines 82-106).
  useEffect(() => {
    if (!session || session.status !== "generating") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/rendering/status?sessionId=${encodeURIComponent(sessionId)}`,
          { headers: { "x-studio-token": studioToken } },
        );
        if (!res.ok) return;
        const data: RenderingSession = await res.json();
        setSession(data);
        if (data.status === "complete" || data.status === "error") {
          clearInterval(interval);
          setIsRefining(false);
          if (data.renderings?.length) {
            setActiveThumbIndex(data.renderings.length - 1);
          }
        }
      } catch {
        // Silently retry on transient errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session?.status, sessionId, studioToken]);

  // Auto-scroll thread to bottom when new entries arrive (Studio parity line 109-113).
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [session?.conversation?.length, session?.renderings?.length, isRefining]);

  // Refine handler (ported from Studio ChatView lines 116-161).
  async function handleRefine() {
    if (!refinementText.trim() || isRefining) return;

    setIsRefining(true);
    setError(null);
    const text = refinementText.trim();

    // Optimistic append of user message + flip status to generating (Studio parity)
    const optimisticEntry: ConversationEntry = {
      _key: `optimistic-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setSession((prev) =>
      prev
        ? {
            ...prev,
            conversation: [...(prev.conversation ?? []), optimisticEntry],
            status: "generating",
          }
        : prev,
    );
    setRefinementText("");

    try {
      const res = await fetch("/api/rendering/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-studio-token": studioToken,
        },
        body: JSON.stringify({
          sessionId,
          refinementText: text,
          sanityUserId,
        }),
      });

      if (!res.ok) {
        setError("Could not send refinement. Try again.");
        setIsRefining(false);
        // Roll back optimistic status flip
        setSession((prev) =>
          prev
            ? {
                ...prev,
                status: prev.renderings?.length ? "complete" : "idle",
              }
            : prev,
        );
        return;
      }
      // Session status is now "generating" on the server; polling effect takes over.
    } catch {
      setError("Could not send refinement. Try again.");
      setIsRefining(false);
    }
  }

  // Build chronological thread from conversation + renderings
  // (ported from Studio ChatView buildThread lines 230-288 — logic identical,
  // only the rendering entries are handled differently because admin's left pane
  // shows the active rendering image, so we do NOT inject RenderingCard entries).
  function buildThread(): Array<{
    key: string;
    role: "user" | "model" | "system";
    text: string;
    timestamp: string;
  }> {
    if (!session) return [];
    const entries: Array<{
      key: string;
      role: "user" | "model" | "system";
      text: string;
      timestamp: string;
    }> = [];

    (session.conversation ?? []).forEach((conv, i) => {
      if (conv.role === "user") {
        entries.push({
          key: conv._key ?? `user-${i}`,
          role: "user",
          text: conv.text ?? "",
          timestamp: conv.timestamp,
        });
      } else if (conv.role === "model" && conv.text) {
        entries.push({
          key: conv._key ?? `model-${i}`,
          role: "model",
          text: conv.text,
          timestamp: conv.timestamp,
        });
      }
    });

    return entries;
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          height: "calc(100vh - 200px)",
          background: "#FFFEFB",
        }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#9A7B4B" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-sm" style={{ color: "#6B5E52" }}>
          Session not found.
        </p>
        <a
          href="/admin/rendering"
          className="text-sm font-semibold inline-flex items-center gap-1.5"
          style={{ color: "#9A7B4B" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to sessions
        </a>
      </div>
    );
  }

  const thread = buildThread();
  const activeRendering: RenderingOutput | undefined =
    session.renderings?.[activeThumbIndex];
  const hasMultipleRenderings = (session.renderings?.length ?? 0) > 1;
  const canRefine = refinementText.trim() !== "" && !isRefining;

  // Stacked layout at <900px (D-12): body becomes flex-col, panes get fixed heights.
  const bodyClass = isNarrow
    ? "flex flex-col flex-1 overflow-hidden min-h-0"
    : "flex flex-1 overflow-hidden min-h-0";

  const leftPaneStyle: React.CSSProperties = isNarrow
    ? {
        flex: "1 1 100%",
        maxHeight: "50vh",
        background: "#FFFEFB",
      }
    : {
        flex: "65 65 0%",
        background: "#FFFEFB",
      };

  const rightPaneStyle: React.CSSProperties = isNarrow
    ? {
        flex: "1 1 100%",
        height: "40vh",
        minWidth: 0,
        background: "#F3EDE3",
        borderTop: isNarrow ? "0.5px solid #E8DDD0" : undefined,
      }
    : {
        flex: "35 35 320px",
        minWidth: "320px",
        background: "#F3EDE3",
        borderLeft: "0.5px solid #E8DDD0",
      };

  return (
    <>
      <div className="flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
        {/* Chat header (UI-SPEC section 4: 56px tall, 0.5px bottom border, px-6 py-3) */}
        <div
          className="flex items-center justify-between px-6 py-3 flex-shrink-0"
          style={{
            height: "56px",
            background: "#FFFEFB",
            borderBottom: "0.5px solid #E8DDD0",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="/admin/rendering"
              aria-label="Back to sessions"
              className="flex-shrink-0"
              style={{ color: "#6B5E52" }}
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="min-w-0">
              <p
                className="truncate"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2C2520",
                }}
              >
                {session.sessionTitle}
              </p>
              <p
                className="truncate"
                style={{
                  fontSize: "11.5px",
                  fontWeight: 400,
                  color: "#6B5E52",
                }}
              >
                {session.project?.title || "Scratchpad"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowPromoteDrawer(true)}
              className="inline-flex items-center gap-1.5 rounded-lg transition-colors"
              style={{
                border: "1px solid #9A7B4B",
                color: "#9A7B4B",
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 16px",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F5EDD8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Share className="w-4 h-4" />
              Promote
            </button>
          </div>
        </div>

        {/* Body: side-by-side at >=900px, stacked at <900px (D-11, D-12) */}
        <div className={bodyClass}>
          {/* Left pane — rendering image + thumbnail strip */}
          <div
            className="flex flex-col p-6 overflow-y-auto"
            style={leftPaneStyle}
          >
            {activeRendering && activeRendering.blobPathname ? (
              <img
                src={`/api/blob-serve?path=${encodeURIComponent(activeRendering.blobPathname)}`}
                alt="Current rendering"
                className="w-full object-contain rounded-xl"
                style={{
                  maxHeight: isNarrow ? "calc(50vh - 100px)" : "calc(100vh - 280px)",
                  border: "0.5px solid #E8DDD0",
                }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  minHeight: "240px",
                  background: "#F3EDE3",
                  border: "0.5px solid #E8DDD0",
                  color: "#9E8E80",
                  fontSize: "13px",
                }}
              >
                {session.status === "generating" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2
                      className="w-5 h-5 animate-spin"
                      style={{ color: "#9A7B4B" }}
                    />
                    Generating rendering...
                  </span>
                ) : (
                  <span>No rendering available.</span>
                )}
              </div>
            )}
            {hasMultipleRenderings && (
              <ThumbnailStrip
                renderings={session.renderings}
                activeIndex={activeThumbIndex}
                onSelect={setActiveThumbIndex}
              />
            )}
          </div>

          {/* Right pane — conversation thread + input area */}
          <div className="flex flex-col" style={rightPaneStyle}>
            {/* Message thread */}
            <div
              ref={threadRef}
              className="flex-1 overflow-y-auto flex flex-col gap-4 p-5"
            >
              {thread.length === 0 && (
                <p
                  className="text-center mt-8"
                  style={{
                    fontSize: "13px",
                    color: "#6B5E52",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Ask for adjustments to refine this rendering. Try
                  &ldquo;make it warmer&rdquo; or &ldquo;swap the rug for wool&rdquo;.
                </p>
              )}
              {thread.map((entry) => (
                <ChatMessage
                  key={entry.key}
                  role={entry.role}
                  text={entry.text}
                  timestamp={entry.timestamp}
                />
              ))}
              {/* Generating skeleton while session.status === 'generating' or isRefining */}
              {(isRefining || session.status === "generating") && (
                <div className="flex flex-col items-start">
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background: "#F3EDE3",
                      border: "0.5px solid #D4C8B8",
                      maxWidth: "85%",
                      color: "#6B5E52",
                      fontSize: "13px",
                      fontFamily: "var(--font-sans)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      style={{ color: "#9A7B4B" }}
                    />
                    Refining rendering...
                  </div>
                </div>
              )}
              {error && (
                <div
                  className="rounded-lg px-4 py-2 flex items-center justify-between gap-2"
                  style={{
                    background: "#FBEEE8",
                    color: "#9B3A2A",
                    fontSize: "13px",
                    border: "0.5px solid #E8C9C1",
                  }}
                >
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="underline"
                    style={{ fontSize: "11.5px", fontWeight: 600 }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Input area — pinned to bottom of right pane */}
            <div
              className="p-4 flex-shrink-0"
              style={{
                borderTop: "0.5px solid #E8DDD0",
                background: "#FFFEFB",
              }}
            >
              <textarea
                className="luxury-input w-full"
                placeholder="Describe the adjustment..."
                rows={2}
                style={{
                  minHeight: "40px",
                  maxHeight: "120px",
                  resize: "vertical",
                }}
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                disabled={isRefining}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRefine();
                  }
                }}
                aria-label="Refinement prompt"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleRefine}
                  disabled={!canRefine}
                  className="inline-flex items-center gap-1.5 rounded-lg transition-colors"
                  style={{
                    background: canRefine ? "#9A7B4B" : "#D4C8B8",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                    padding: "8px 16px",
                    cursor: canRefine ? "pointer" : "not-allowed",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (canRefine)
                      e.currentTarget.style.background = "#8A6D40";
                  }}
                  onMouseLeave={(e) => {
                    if (canRefine)
                      e.currentTarget.style.background = "#9A7B4B";
                  }}
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Send refinement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PromoteDrawer — right-side parchment slide-in drawer (Plan 33-06, D-18). */}
      {showPromoteDrawer && session && (
        <PromoteDrawer
          session={session}
          activeRenderingIndex={activeThumbIndex}
          sanityUserId={sanityUserId}
          studioToken={studioToken}
          onClose={() => setShowPromoteDrawer(false)}
          onSuccess={() => {
            setShowPromoteDrawer(false);
            setShowSuccessToast(true);
            // Re-fetch session so the promoted flag on the rendering flips in
            // the ThumbnailStrip without a full page reload.
            fetchSession();
          }}
        />
      )}

      {/* Success toast — auto-dismiss 3s after onSuccess (UI-SPEC § 8). */}
      {showSuccessToast && (
        <div
          className="fixed bottom-6 right-6 rounded-lg px-4 py-2 z-50 uppercase shadow-md"
          role="status"
          aria-live="polite"
          style={{
            background: "#F5EDD8",
            color: "#9A7B4B",
            fontSize: "11.5px",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          Published to Design Options
        </div>
      )}
    </>
  );
}

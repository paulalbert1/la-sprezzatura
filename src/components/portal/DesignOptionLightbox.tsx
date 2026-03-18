import { useState, useEffect, useRef, useCallback } from "react";

interface DesignOption {
  _id: string;
  blobPathname: string;
  caption: string;
  favoriteCount: number;
  commentCount: number;
  isFavorited: boolean;
  reactions: Array<{
    _key: string;
    clientId: string;
    type: string;
    text?: string;
    createdAt: string;
  }>;
}

interface Props {
  options: DesignOption[];
  clientId: string;
  projectId: string;
}

/** Simple relative time: "Just now", "2m ago", "1h ago", "3d ago" */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  return `${diffMo}mo ago`;
}

/** Check if user prefers reduced motion */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function DesignOptionLightbox({
  options,
  clientId,
  projectId,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>(
    {},
  );
  const [localComments, setLocalComments] = useState<
    Record<
      string,
      Array<{ clientName: string; text: string; createdAt: string }>
    >
  >({});
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [heartAnimating, setHeartAnimating] = useState<string | null>(null);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);

  const currentOption = options[currentIndex];

  const close = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
  }, []);

  // Listen for open-design-lightbox custom event from DesignOptionCard
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCurrentIndex(customEvent.detail.index);
      setIsOpen(true);
      document.body.style.overflow = "hidden";
    };
    window.addEventListener("open-design-lightbox", handler);
    return () => {
      window.removeEventListener("open-design-lightbox", handler);
      document.body.style.overflow = "";
    };
  }, []);

  // Focus close button when lightbox opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft" && currentIndex > 0)
        setCurrentIndex((i) => i - 1);
      if (e.key === "ArrowRight" && currentIndex < options.length - 1)
        setCurrentIndex((i) => i + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, currentIndex, options.length, close]);

  // Prefetch adjacent images
  useEffect(() => {
    if (!isOpen) return;
    [currentIndex - 1, currentIndex + 1].forEach((i) => {
      if (i >= 0 && i < options.length) {
        const img = new Image();
        img.src = `/api/blob-serve?path=${encodeURIComponent(options[i].blobPathname)}`;
      }
    });
  }, [isOpen, currentIndex, options]);

  // Touch swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0 && currentIndex < options.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (delta < 0 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }
  };

  // Heart toggle with optimistic UI
  const toggleFavorite = async (
    optionId: string,
    currentlyFavorited: boolean,
  ) => {
    // Optimistic update
    setLocalFavorites((prev) => ({ ...prev, [optionId]: !currentlyFavorited }));

    // Animate heart on favorite (not unfavorite)
    if (!currentlyFavorited && !prefersReducedMotion()) {
      setHeartAnimating(optionId);
      setTimeout(() => setHeartAnimating(null), 300);
    }

    try {
      await fetch("/api/rendering/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designOptionId: optionId,
          type: currentlyFavorited ? "unfavorite" : "favorite",
        }),
      });
    } catch {
      // Revert on failure (silent -- no toast)
      setLocalFavorites((prev) => ({
        ...prev,
        [optionId]: currentlyFavorited,
      }));
    }
  };

  // Comment submission
  const submitComment = async () => {
    if (!commentText.trim() || isSubmitting || !currentOption) return;
    setIsSubmitting(true);
    setCommentError(null);

    try {
      const res = await fetch("/api/rendering/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designOptionId: currentOption._id,
          type: "comment",
          text: commentText.trim(),
        }),
      });

      if (!res.ok) throw new Error();

      // Optimistic append
      setLocalComments((prev) => ({
        ...prev,
        [currentOption._id]: [
          ...(prev[currentOption._id] || []),
          {
            clientName: "You",
            text: commentText.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setCommentText("");
    } catch {
      setCommentError("Failed to post comment. Try again.");
      setTimeout(() => setCommentError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentOption) return null;

  // Determine favorite state: local override > server state
  const isFavorited =
    localFavorites[currentOption._id] !== undefined
      ? localFavorites[currentOption._id]
      : currentOption.isFavorited;

  // Adjusted favorite count: total server count +/- local change
  const serverFavCount = currentOption.favoriteCount;
  const adjustedFavoriteCount = (() => {
    if (localFavorites[currentOption._id] === undefined) return serverFavCount;
    const wasOriginallyFavorited = currentOption.isFavorited;
    const isNowFavorited = localFavorites[currentOption._id];
    if (wasOriginallyFavorited && !isNowFavorited)
      return serverFavCount - 1;
    if (!wasOriginallyFavorited && isNowFavorited)
      return serverFavCount + 1;
    return serverFavCount;
  })();

  // Combine server comments with local optimistic comments
  const serverComments = (currentOption.reactions || [])
    .filter((r) => r.type === "comment")
    .map((r) => ({
      clientName: r.clientId === clientId ? "You" : "Client",
      text: r.text || "",
      createdAt: r.createdAt,
    }));
  const optimisticComments = localComments[currentOption._id] || [];
  const allComments = [...serverComments, ...optimisticComments];

  const reducedMotion = prefersReducedMotion();
  const isAnimating = heartAnimating === currentOption._id;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? "visible" : "hidden",
        transition: reducedMotion
          ? "none"
          : "opacity 0.25s ease, visibility 0.25s ease",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Design option lightbox"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dark backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/90"
        onClick={close}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 md:p-8">
        {/* Close button */}
        <button
          ref={closeButtonRef}
          className="absolute top-4 right-4 text-white/80 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center z-10"
          onClick={close}
          aria-label="Close"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <line
              x1="6"
              y1="6"
              x2="26"
              y2="26"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="26"
              y1="6"
              x2="6"
              y2="26"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Prev arrow */}
        {currentIndex > 0 && (
          <button
            className="absolute left-3 md:left-6 text-white/70 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center z-10"
            onClick={() => setCurrentIndex((i) => i - 1)}
            aria-label="Previous"
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <polyline
                points="25,8 13,20 25,32"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Main image */}
        <div className="max-w-5xl max-h-[65vh] w-full flex items-center justify-center">
          <img
            className="max-w-full max-h-[65vh] object-contain"
            src={`/api/blob-serve?path=${encodeURIComponent(currentOption.blobPathname)}`}
            alt={currentOption.caption || "Design option"}
          />
        </div>

        {/* Next arrow */}
        {currentIndex < options.length - 1 && (
          <button
            className="absolute right-3 md:right-6 text-white/70 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center z-10"
            onClick={() => setCurrentIndex((i) => i + 1)}
            aria-label="Next"
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <polyline
                points="15,8 27,20 15,32"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Below image: interactive panel */}
        <div className="w-full max-w-5xl mt-4">
          {/* Caption + heart row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/80 font-body">
              {currentOption.caption || "Untitled"}
            </p>
            <button
              className="flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center"
              onClick={() =>
                toggleFavorite(currentOption._id, isFavorited)
              }
              aria-label={
                isFavorited
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              aria-pressed={isFavorited}
            >
              {isFavorited ? (
                // Filled heart: terracotta
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#C4836A"
                  className="w-5 h-5"
                  aria-hidden="true"
                  style={{
                    transform: isAnimating ? "scale(1.2)" : "scale(1)",
                    transition: reducedMotion
                      ? "none"
                      : "transform 0.3s ease-out",
                  }}
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                // Outlined heart: white/60
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="rgba(255,255,255,0.6)"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              )}
              <span className="text-xs text-white/60">
                {adjustedFavoriteCount}
              </span>
            </button>
          </div>

          {/* Comment thread */}
          <div className="max-h-[25vh] overflow-y-auto space-y-3 mb-4">
            {allComments.map((comment, i) => (
              <div key={i} className="text-sm font-body">
                <span className="text-white/90 font-medium">
                  {comment.clientName}
                </span>
                <span className="text-white/40 mx-1">&middot;</span>
                <span className="text-white/40 text-xs">
                  {relativeTime(comment.createdAt)}
                </span>
                <p className="text-white/70 mt-1">{comment.text}</p>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div className="flex gap-2">
            <input
              ref={commentInputRef}
              className="flex-1 bg-white/10 text-white text-sm px-4 py-3 font-body border border-white/20 focus:border-white/40 focus:outline-none placeholder-white/30"
              placeholder="Leave a comment..."
              maxLength={500}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              aria-label="Leave a comment"
            />
            <button
              className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 hover:bg-terracotta-light transition-colors min-h-[44px] disabled:opacity-50"
              onClick={submitComment}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>

          {commentError && (
            <p className="text-xs text-red-400 mt-1" role="alert">
              {commentError}
            </p>
          )}
        </div>

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-body tracking-widest">
          {currentIndex + 1} / {options.length}
        </div>
      </div>
    </div>
  );
}

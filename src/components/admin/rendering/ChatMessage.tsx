import type { ReactNode } from "react";

interface ChatMessageProps {
  role: "user" | "model" | "system";
  text: string;
  timestamp?: string;
  images?: string[]; // blobPathnames for user messages with attached images
}

/**
 * Chat message bubble for the admin /admin/rendering/[sessionId] view.
 *
 * Ported from src/sanity/components/rendering/ChatMessage.tsx (D-13 verbatim-port
 * rule): the simple markdown renderer and the user-images rendering come straight
 * from the Studio source. Only the container primitives were swapped: @sanity/ui
 * Flex/Card/Stack/Text -> Tailwind flex divs + inline styles matching the luxury
 * admin tokens (33-UI-SPEC.md section 4 "Message bubbles").
 *
 * Role variants (33-UI-SPEC.md section 4):
 *   user   -> self-end  bubble, bg #FFFEFB, border 0.5px #E8DDD0
 *   model  -> self-start bubble, bg #F3EDE3, border 0.5px #D4C8B8
 *   system -> transparent centered text in #9E8E80, no border
 *
 * Optional timestamp is rendered below the bubble in 11.5px / 400 / #9E8E80.
 */
export function ChatMessage({
  role,
  text,
  timestamp,
  images,
}: ChatMessageProps) {
  // System messages: transparent centered text, no bubble
  if (role === "system") {
    if (!text) return null;
    return (
      <p
        className="text-center"
        style={{
          fontSize: "11.5px",
          color: "#9E8E80",
          margin: "8px 0",
          fontFamily: "var(--font-sans)",
        }}
      >
        {text}
      </p>
    );
  }

  const isUser = role === "user";
  // Model bubbles still hide when empty (Studio parity: model text and model rendering
  // are separate entries in the thread; RenderingCard renders the image elsewhere).
  if (!isUser && !text) return null;

  const bubbleStyle: React.CSSProperties = isUser
    ? {
        background: "#FFFEFB",
        border: "0.5px solid #E8DDD0",
        alignSelf: "flex-end",
      }
    : {
        background: "#F3EDE3",
        border: "0.5px solid #D4C8B8",
        alignSelf: "flex-start",
      };

  return (
    <div
      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className="rounded-lg px-4 py-3"
        style={{
          ...bubbleStyle,
          maxWidth: "85%",
          color: "#2C2520",
          fontSize: "14px",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.5,
        }}
      >
        <div>{renderSimpleMarkdown(text)}</div>
        {isUser && images && images.length > 0 && (
          <div className="flex gap-2" style={{ marginTop: 8 }}>
            {images.map((bp, i) => (
              <img
                key={i}
                src={`/api/blob-serve?path=${encodeURIComponent(bp)}`}
                alt="Attached"
                style={{
                  width: 48,
                  height: 48,
                  objectFit: "cover",
                  borderRadius: 4,
                }}
              />
            ))}
          </div>
        )}
      </div>
      {timestamp && (
        <span
          style={{
            fontSize: "11.5px",
            color: "#9E8E80",
            marginTop: "4px",
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
          }}
        >
          {formatTimestamp(timestamp)}
        </span>
      )}
    </div>
  );
}

/**
 * Render simple markdown: **bold**, and lines starting with * or - as bullets.
 * Ported verbatim from Studio ChatMessage.tsx lines 14-59 (logic identical,
 * primitives swapped for Tailwind divs).
 */
function renderSimpleMarkdown(text: string): ReactNode[] {
  const lines = text.split(/\n|(?:\s\*\s)/);
  const elements: ReactNode[] = [];
  const boldPattern = /\*\*(.+?)\*\*/g;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    const isBullet = line.startsWith("* ") || line.startsWith("- ");
    if (isBullet) line = line.slice(2);

    const parts: ReactNode[] = [];
    let lastIndex = 0;
    boldPattern.lastIndex = 0;
    let match = boldPattern.exec(line);
    while (match !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={`b-${i}-${match.index}`}>{match[1]}</strong>,
      );
      lastIndex = match.index + match[0].length;
      match = boldPattern.exec(line);
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    elements.push(
      <div
        key={i}
        style={{
          marginBottom: 6,
          paddingLeft: isBullet ? 16 : 0,
          textIndent: isBullet ? -8 : 0,
        }}
      >
        {isBullet && "• "}
        {parts}
      </div>,
    );
  }

  return elements;
}

/**
 * Format an ISO timestamp as a localized short time string.
 * Falls back to the raw string if parsing fails.
 */
function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

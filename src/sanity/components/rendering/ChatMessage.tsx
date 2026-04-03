import { Flex, Card, Stack, Text } from "@sanity/ui";
import { getImageServeUrl } from "./types";

interface ChatMessageProps {
  role: "user" | "model";
  text: string;
  images?: string[]; // blobPathnames for user messages with attached images
}

/**
 * Render simple markdown: **bold**, and lines starting with * as bullets.
 * Returns an array of React nodes.
 */
function renderSimpleMarkdown(text: string) {
  const lines = text.split(/\n|(?:\s\*\s)/);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    const isBullet = line.startsWith("* ") || line.startsWith("- ");
    if (isBullet) line = line.slice(2);

    // Parse **bold** spans
    const parts: React.ReactNode[] = [];
    const boldPattern = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = boldPattern.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={`b-${i}-${match.index}`}>{match[1]}</strong>,
      );
      lastIndex = match.index + match[0].length;
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

export function ChatMessage({ role, text, images }: ChatMessageProps) {
  if (role === "user") {
    return (
      <Flex justify="flex-end">
        <Card
          padding={3}
          radius={2}
          tone="primary"
          style={{ maxWidth: "75%" }}
        >
          <Text size={2}>{text}</Text>
          {images && images.length > 0 && (
            <Flex gap={2} style={{ marginTop: 8 }}>
              {images.map((bp, i) => (
                <img
                  key={i}
                  src={getImageServeUrl(bp, "studio")}
                  alt="Attached"
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              ))}
            </Flex>
          )}
        </Card>
      </Flex>
    );
  }

  // Model response -- only the text portion
  // RenderingCard is rendered separately by ChatView
  if (!text) return null;

  return (
    <Flex justify="flex-start">
      <Stack space={3} style={{ maxWidth: "85%" }}>
        <Card padding={3} radius={2} tone="default">
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {renderSimpleMarkdown(text)}
          </div>
        </Card>
      </Stack>
    </Flex>
  );
}

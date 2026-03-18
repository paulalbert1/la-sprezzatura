import { Flex, Card, Stack, Text } from "@sanity/ui";
import { getImageServeUrl } from "./types";

interface ChatMessageProps {
  role: "user" | "model";
  text: string;
  images?: string[]; // blobPathnames for user messages with attached images
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
          <Text size={1}>{text}</Text>
        </Card>
      </Stack>
    </Flex>
  );
}

import { Card, Flex, Stack, Text } from "@sanity/ui";
import type { SessionListItem } from "./types";

interface SessionCardProps {
  session: SessionListItem;
  onClick: () => void;
}

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  const isScratchpad = !session.project;

  return (
    <Card
      padding={4}
      radius={2}
      shadow={1}
      border
      style={{
        borderStyle: isScratchpad ? "dashed" : "solid",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <Flex align="center" justify="space-between">
        <Stack space={2}>
          <Text size={2} weight="semibold">
            {session.sessionTitle}
          </Text>
          <Text
            size={1}
            muted
            style={isScratchpad ? { fontStyle: "italic" } : undefined}
          >
            {session.project?.title || "Scratchpad"}
          </Text>
          <Text size={0} muted>
            {session.renderingCount} rendering{session.renderingCount !== 1 ? "s" : ""}
          </Text>
        </Stack>
        <Text size={0} muted>
          {relativeTime(session.createdAt)}
        </Text>
      </Flex>
    </Card>
  );
}

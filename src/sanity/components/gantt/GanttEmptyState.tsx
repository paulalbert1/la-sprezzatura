/**
 * GanttEmptyState -- Empty state when no schedule data exists on the project.
 *
 * Centered card with CalendarIcon, heading, and body text.
 * Per UI-SPEC: Card padding={5} tone="transparent", centered Stack space={3}.
 */

import { Card, Flex, Stack, Text } from "@sanity/ui";
import { CalendarIcon } from "@sanity/icons";

export function GanttEmptyState() {
  return (
    <Card padding={5} tone="transparent">
      <Flex align="center" justify="center" style={{ minHeight: 300 }}>
        <Stack space={3} style={{ textAlign: "center" }}>
          <Flex justify="center">
            <CalendarIcon
              style={{
                fontSize: 48,
                opacity: 0.3,
              }}
            />
          </Flex>
          <Text size={2} weight="semibold">
            No schedule data yet
          </Text>
          <Text size={1} muted>
            Add contractors, milestones, procurement items, or schedule events to
            see them on the timeline.
          </Text>
        </Stack>
      </Flex>
    </Card>
  );
}

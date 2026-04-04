import { Card, Flex, Stack, Text, Spinner } from "@sanity/ui";

/**
 * GanttScheduleView - Document view shell for the Schedule tab.
 *
 * This component is registered as a document view via structure.ts and receives
 * Sanity's document view props (document, documentId, schemaType).
 *
 * Per D-06: The Schedule tab content is visible when:
 *   engagementType === "full-interior-design" OR isCommercial === true
 *
 * For non-qualifying projects, a muted message is shown.
 * For qualifying projects, a loading placeholder is shown (replaced by full Gantt in Plan 3).
 */

interface GanttScheduleViewProps {
  document: {
    draft: Record<string, unknown> | null;
    published: Record<string, unknown> | null;
    displayed: Record<string, unknown>;
  };
  documentId: string;
  schemaType: { name: string };
}

export function GanttScheduleView(props: GanttScheduleViewProps) {
  const { document } = props;
  const displayed = document.displayed;

  const engagementType = displayed?.engagementType as string | undefined;
  const isCommercial = displayed?.isCommercial as boolean | undefined;

  // Per D-06: visible for Full Interior Design or any Commercial project
  const isScheduleEnabled =
    engagementType === "full-interior-design" || isCommercial === true;

  if (!isScheduleEnabled) {
    return (
      <Card padding={5}>
        <Flex align="center" justify="center" style={{ minHeight: 300 }}>
          <Stack space={3} style={{ textAlign: "center" }}>
            <Text size={2} muted>
              Schedule view is available for Full Interior Design and Commercial
              projects.
            </Text>
          </Stack>
        </Flex>
      </Card>
    );
  }

  // Qualifying project: show loading placeholder (Plan 3 replaces this with full Gantt)
  return (
    <Card padding={5}>
      <Flex align="center" justify="center" style={{ minHeight: 400 }}>
        <Stack space={3} style={{ textAlign: "center" }}>
          <Flex justify="center">
            <Spinner muted />
          </Flex>
          <Text size={1} muted>
            Loading schedule...
          </Text>
        </Stack>
      </Flex>
    </Card>
  );
}

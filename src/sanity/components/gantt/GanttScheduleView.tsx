import { lazy, Suspense } from "react";
import { Card, Flex, Stack, Text, Spinner } from "@sanity/ui";
import { useGanttData } from "./hooks/useGanttData";
import { GanttLegend } from "./GanttLegend";
import { GanttEmptyState } from "./GanttEmptyState";

// Lazy-load GanttChart to prevent CSS imports from crashing the
// Studio structure module at load time.
const GanttChart = lazy(() =>
  import("./GanttChart").then((m) => ({ default: m.GanttChart })),
);

/**
 * GanttScheduleView - Document view for the Schedule tab.
 *
 * Per D-06: visible for Full Interior Design or Commercial projects.
 * Uses Frappe Gantt with its built-in Day/Week/Month selector.
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
  const { document, documentId } = props;
  const displayed = document.displayed;

  const engagementType = displayed?.engagementType as string | undefined;
  const isCommercial = displayed?.isCommercial as boolean | undefined;
  const rev = displayed?._rev as string | undefined;

  const isScheduleEnabled =
    engagementType === "full-interior-design" || isCommercial === true;

  const { tasks, links, contractors, loading, error } = useGanttData(
    documentId,
    rev,
  );

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

  if (loading) {
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

  if (error) {
    return (
      <Card padding={5}>
        <Flex align="center" justify="center" style={{ minHeight: 400 }}>
          <Stack space={3} style={{ textAlign: "center" }}>
            <Text size={2} muted>
              Could not load schedule data. Try switching to the form tab and
              back.
            </Text>
          </Stack>
        </Flex>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card padding={4}>
        <GanttEmptyState />
      </Card>
    );
  }

  return (
    <Card padding={4}>
      <Stack space={3}>
        <Flex align="center" justify="flex-end" padding={3}>
          <GanttLegend contractors={contractors} />
        </Flex>
        <Suspense fallback={<Flex justify="center" padding={4}><Spinner muted /></Flex>}>
          <GanttChart tasks={tasks} links={links} />
        </Suspense>
      </Stack>
    </Card>
  );
}

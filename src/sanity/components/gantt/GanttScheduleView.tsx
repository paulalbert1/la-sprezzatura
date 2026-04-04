import { useState, lazy, Suspense } from "react";
import { Card, Flex, Stack, Text, Spinner } from "@sanity/ui";
import { useGanttData } from "./hooks/useGanttData";
import { ScaleToggle } from "./ScaleToggle";
import { GanttLegend } from "./GanttLegend";
import { GanttEmptyState } from "./GanttEmptyState";
import type { GanttScale } from "./lib/ganttTypes";

// Lazy-load GanttChart to prevent SVAR's CSS/browser-API imports from
// crashing the Studio structure module at load time.
const GanttChart = lazy(() =>
  import("./GanttChart").then((m) => ({ default: m.GanttChart })),
);

/**
 * GanttScheduleView - Document view for the Schedule tab.
 *
 * Registered as a document view via structure.ts. Receives Sanity's document
 * view props (document, documentId, schemaType).
 *
 * Per D-06: The Schedule tab content is visible when:
 *   engagementType === "full-interior-design" OR isCommercial === true
 *
 * For non-qualifying projects, a muted message is shown.
 * For qualifying projects, renders the full Gantt timeline with toolbar.
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

/**
 * Scale configurations per Research Pattern 6.
 * SVAR uses strftime-style format strings.
 */
const WEEK_SCALES: GanttScale[] = [
  { unit: "month", step: 1, format: "%F %Y" },
  { unit: "day", step: 1, format: "%j" },
];

const MONTH_SCALES: GanttScale[] = [
  { unit: "year", step: 1, format: "%Y" },
  { unit: "month", step: 1, format: "%F" },
];

export function GanttScheduleView(props: GanttScheduleViewProps) {
  const { document, documentId } = props;
  const displayed = document.displayed;

  const engagementType = displayed?.engagementType as string | undefined;
  const isCommercial = displayed?.isCommercial as boolean | undefined;
  const rev = displayed?._rev as string | undefined;

  // Per D-06: visible for Full Interior Design or any Commercial project
  const isScheduleEnabled =
    engagementType === "full-interior-design" || isCommercial === true;

  const [view, setView] = useState<"week" | "month">("week");

  // Always call hooks (React rules), but skip rendering for non-qualifying projects
  const { tasks, contractors, loading, error } = useGanttData(
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

  // Check if there are data tasks beyond the 4 summary rows
  const hasDataTasks = tasks.length > 4;

  if (!hasDataTasks) {
    return (
      <Card padding={4}>
        <GanttEmptyState />
      </Card>
    );
  }

  const scales = view === "week" ? WEEK_SCALES : MONTH_SCALES;
  const cellWidth = view === "week" ? 60 : 40;

  return (
    <Card padding={4}>
      <Stack space={3}>
        <Flex align="center" justify="space-between" padding={3}>
          <ScaleToggle view={view} onViewChange={setView} />
          <GanttLegend contractors={contractors} />
        </Flex>
        <Suspense fallback={<Flex justify="center" padding={4}><Spinner muted /></Flex>}>
          <GanttChart tasks={tasks} scales={scales} cellWidth={cellWidth} />
        </Suspense>
      </Stack>
    </Card>
  );
}

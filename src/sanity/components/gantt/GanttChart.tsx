/**
 * GanttChart -- SVAR Gantt wrapper with Willow theme, readonly mode, CSS scoping.
 *
 * Renders the SVAR React Gantt inside a .gantt-container div for CSS isolation (Pitfall 3).
 * Uses the Willow theme with fonts={false} to inherit Sanity Studio's Inter font.
 * Per-contractor colors are applied via a custom taskTemplate that reads _colorIndex.
 * Today marker uses the SVAR markers prop with IMarker interface.
 */

import { Gantt, Willow } from "@svar-ui/react-gantt";
import type { ITask } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import "./gantt.css";

import { getContractorColor, CATEGORY_COLORS, getProcurementStatusColor } from "./lib/ganttColors";
import type { GanttTask, GanttLink, GanttScale } from "./lib/ganttTypes";

interface GanttChartProps {
  tasks: GanttTask[];
  links: GanttLink[];
  scales: GanttScale[];
  cellWidth?: number;
}

/**
 * Custom task bar template for per-contractor color assignment.
 * Renders colored overlay inside the SVAR task bar, reading custom fields
 * from the task data object (_colorIndex, _category, _status, _completed).
 *
 * Per D-12 spike resolution: taskTemplate renders INSIDE the bar element.
 * We use a full-width, full-height div with absolute positioning and the
 * contractor color as background, plus the task text overlaid.
 */
function TaskTemplate({ data }: { data: ITask }) {
  const task = data as unknown as GanttTask;

  let backgroundColor: string;
  let opacity = 1;

  if (task._category === "contractor" && task._colorIndex !== undefined) {
    backgroundColor = getContractorColor(task._colorIndex);
  } else if (task._category === "procurement" && task._status) {
    backgroundColor = getProcurementStatusColor(task._status);
  } else if (task._category === "milestone") {
    backgroundColor = task._completed ? CATEGORY_COLORS.completed : CATEGORY_COLORS.milestones;
    opacity = task._completed ? 0.5 : 1;
  } else if (task._category) {
    backgroundColor = CATEGORY_COLORS[task._category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.events;
  } else {
    backgroundColor = CATEGORY_COLORS.events;
  }

  // For milestones (diamond markers), SVAR renders the diamond shape.
  // No text overlay needed — the left panel already shows the name.
  if (task.type === "milestone") {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          opacity,
        }}
      />
    );
  }

  // For task bars (contractors, multi-day events): render colored background.
  // No text overlay — the left panel already shows names, and bar text clips.
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        backgroundColor,
        borderRadius: 4,
        opacity,
      }}
    />
  );
}

export function GanttChart({ tasks, links, scales, cellWidth = 60 }: GanttChartProps) {
  // Today marker via SVAR markers prop
  const todayMarkers = [
    {
      start: new Date(),
      text: "Today",
      css: "gantt-today-marker",
    },
  ];

  // SVAR only works reliably with numeric IDs — convert string IDs to numbers.
  // Build a stable mapping from our string IDs to sequential numeric IDs.
  const idMap = new Map<string, number>();
  tasks.forEach((t, i) => idMap.set(t.id, i + 1));

  const svarTasks = tasks.map((t) => ({
    ...t,
    id: idMap.get(t.id) || 0,
    // SVAR expects end to always be a Date (not null)
    end: t.end || t.start,
    // Root tasks (parent: null) use 0; child tasks use mapped numeric parent
    parent: t.parent ? (idMap.get(t.parent) || 0) : 0,
    // SVAR crashes if leaf tasks have open: true (tries to expand nonexistent children).
    // Only summary rows should be expandable.
    open: t.type === "summary" ? t.open : undefined,
  }));

  // Compute tight date bounds from actual task data (skip summary rows).
  // Add 1 week padding before and 2 weeks after for breathing room.
  const dataTasks = tasks.filter((t) => t.type !== "summary");
  let rangeStart: Date | undefined;
  let rangeEnd: Date | undefined;
  if (dataTasks.length > 0) {
    const starts = dataTasks.map((t) => t.start.getTime());
    const ends = dataTasks.map((t) => (t.end || t.start).getTime());
    const earliest = new Date(Math.min(...starts));
    const latest = new Date(Math.max(...ends));
    rangeStart = new Date(earliest);
    rangeStart.setDate(rangeStart.getDate() - 7);
    rangeEnd = new Date(latest);
    rangeEnd.setDate(rangeEnd.getDate() + 14);
  }

  return (
    <div className="gantt-container">
      <Willow fonts={false}>
        <Gantt
          tasks={svarTasks}
          scales={scales}
          start={rangeStart}
          end={rangeEnd}
          readonly={true}
          cellHeight={38}
          cellWidth={cellWidth}
          columns={[{ id: "text", header: "Item", width: 280 }]}
          links={links.map((l, i) => ({
            id: i + 1,
            source: idMap.get(l.source) || 0,
            target: idMap.get(l.target) || 0,
            type: l.type,
          }))}
          markers={todayMarkers}
          taskTemplate={TaskTemplate}
        />
      </Willow>
    </div>
  );
}

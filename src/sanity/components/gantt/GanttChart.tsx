/**
 * GanttChart -- SVAR Gantt wrapper with custom L-shaped dependency arrows.
 *
 * Renders SVAR React Gantt in readonly mode with Willow theme.
 * SVAR's built-in link rendering is disabled — we draw our own clean
 * L-shaped arrows (vertical then horizontal) as an SVG overlay.
 */

import { useRef, useEffect, useState, useMemo } from "react";
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

const CELL_HEIGHT = 38;
const LEFT_COL_WIDTH = 280;
const SCALE_HEADER_HEIGHT = 62; // approximate height of the two-row scale header
const ARROW_SIZE = 5;

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

  if (task.type === "milestone") {
    return <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity }} />;
  }

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", backgroundColor, borderRadius: 4, opacity }} />
  );
}

/**
 * Convert a date to an X pixel position within the timeline area.
 */
function dateToX(date: Date, rangeStart: Date, rangeEnd: Date, timelineWidth: number): number {
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  const dateMs = date.getTime() - rangeStart.getTime();
  return LEFT_COL_WIDTH + (dateMs / totalMs) * timelineWidth;
}

/**
 * Render custom L-shaped dependency arrows as SVG paths.
 * Each arrow: vertical from source row to target row, then horizontal to target.
 */
function DependencyArrows({
  tasks,
  links,
  rangeStart,
  rangeEnd,
  containerWidth,
}: {
  tasks: GanttTask[];
  links: GanttLink[];
  rangeStart: Date;
  rangeEnd: Date;
  containerWidth: number;
}) {
  const timelineWidth = containerWidth - LEFT_COL_WIDTH;
  if (timelineWidth <= 0 || links.length === 0) return null;

  // Build index map: task id → row index
  const taskIndex = new Map<string, number>();
  tasks.forEach((t, i) => taskIndex.set(t.id, i));

  const paths: React.ReactNode[] = [];

  for (const link of links) {
    const srcIdx = taskIndex.get(link.source);
    const tgtIdx = taskIndex.get(link.target);
    if (srcIdx === undefined || tgtIdx === undefined) continue;

    const srcTask = tasks[srcIdx];
    const tgtTask = tasks[tgtIdx];

    // Source: end of the bar (or the milestone point)
    const srcEndDate = srcTask.end || srcTask.start;
    const srcX = dateToX(srcEndDate, rangeStart, rangeEnd, timelineWidth);
    const srcY = SCALE_HEADER_HEIGHT + srcIdx * CELL_HEIGHT + CELL_HEIGHT / 2;

    // Target: start of the bar
    const tgtX = dateToX(tgtTask.start, rangeStart, rangeEnd, timelineWidth);
    const tgtY = SCALE_HEADER_HEIGHT + tgtIdx * CELL_HEIGHT + CELL_HEIGHT / 2;

    // L-shape: go down (or up) from source, then right to target
    // If target is below source: down then right
    // If target is above source: up then right
    const midX = srcX + 8; // small horizontal offset from source end

    const pathD = srcY === tgtY
      // Same row: just a horizontal line
      ? `M ${srcX} ${srcY} L ${tgtX} ${tgtY}`
      // Different rows: vertical then horizontal (L-shape)
      : `M ${srcX} ${srcY} L ${midX} ${srcY} L ${midX} ${tgtY} L ${tgtX} ${tgtY}`;

    // Arrowhead pointing right at target
    const arrowD = `M ${tgtX} ${tgtY} L ${tgtX - ARROW_SIZE} ${tgtY - ARROW_SIZE} L ${tgtX - ARROW_SIZE} ${tgtY + ARROW_SIZE} Z`;

    paths.push(
      <g key={link.id} opacity={0.4}>
        <path d={pathD} fill="none" stroke="#78716C" strokeWidth={1.5} />
        <path d={arrowD} fill="#78716C" />
      </g>,
    );
  }

  const totalHeight = SCALE_HEADER_HEIGHT + tasks.length * CELL_HEIGHT;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: containerWidth,
        height: totalHeight,
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      {paths}
    </svg>
  );
}

export function GanttChart({ tasks, links, scales, cellWidth = 60 }: GanttChartProps) {
  const todayMarkers = [{ start: new Date(), text: "Today", css: "gantt-today-marker" }];

  const idMap = new Map<string, number>();
  tasks.forEach((t, i) => idMap.set(t.id, i + 1));

  const svarTasks = tasks.map((t) => ({
    ...t,
    id: idMap.get(t.id) || 0,
    end: t.end || t.start,
    parent: t.parent ? (idMap.get(t.parent) || 0) : 0,
    open: t.type === "summary" ? t.open : undefined,
  }));

  // Date range with padding
  const dataTasks = tasks.filter((t) => t.type !== "summary");
  let rangeStart: Date | undefined;
  let rangeEnd: Date | undefined;
  if (dataTasks.length > 0) {
    const starts = dataTasks.map((t) => t.start.getTime());
    const ends = dataTasks.map((t) => (t.end || t.start).getTime());
    rangeStart = new Date(Math.min(...starts));
    rangeStart.setDate(rangeStart.getDate() - 7);
    rangeEnd = new Date(Math.max(...ends));
    rangeEnd.setDate(rangeEnd.getDate() + 14);
  }

  // Measure container width for arrow positioning
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    const timer = setTimeout(measure, 300);
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [tasks.length]);

  // Today line X position
  const todayLeft = useMemo(() => {
    if (!rangeStart || !rangeEnd || containerWidth === 0) return null;
    const totalMs = rangeEnd.getTime() - rangeStart.getTime();
    const nowMs = Date.now() - rangeStart.getTime();
    if (nowMs <= 0 || nowMs >= totalMs) return null;
    return LEFT_COL_WIDTH + (nowMs / totalMs) * (containerWidth - LEFT_COL_WIDTH);
  }, [rangeStart, rangeEnd, containerWidth]);

  return (
    <div className="gantt-container" ref={containerRef} style={{ position: "relative" }}>
      {/* Today line */}
      {todayLeft !== null && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: todayLeft,
            width: 2,
            height: "100%",
            backgroundColor: "#EF4444",
            opacity: 0.7,
            zIndex: 5,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Custom L-shaped dependency arrows */}
      {rangeStart && rangeEnd && containerWidth > 0 && (
        <DependencyArrows
          tasks={tasks}
          links={links}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          containerWidth={containerWidth}
        />
      )}

      <Willow fonts={false}>
        <Gantt
          tasks={svarTasks}
          scales={scales}
          start={rangeStart}
          end={rangeEnd}
          readonly={true}
          cellHeight={CELL_HEIGHT}
          cellWidth={cellWidth}
          columns={[{ id: "text", header: "Item", width: LEFT_COL_WIDTH }]}
          links={[]}
          markers={todayMarkers}
          taskTemplate={TaskTemplate}
        />
      </Willow>
    </div>
  );
}

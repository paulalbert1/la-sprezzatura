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
 * Measure actual bar/diamond positions from the DOM after SVAR renders.
 * Returns a map from row index to { left, right, centerY } in container-relative coords.
 */
function measureBarPositions(container: HTMLElement): Map<number, { left: number; right: number; centerY: number }> {
  const positions = new Map<number, { left: number; right: number; centerY: number }>();
  const containerRect = container.getBoundingClientRect();

  // Find all task rows — SVAR renders bars/diamonds inside row containers
  // Each row has a consistent height (CELL_HEIGHT). We look for the actual
  // bar or diamond elements and measure their bounding rects.
  const rows = container.querySelectorAll('[class*="wx-row"], [class*="wx-bar"], tr');

  // Alternative: find all visual elements (colored bars and diamonds)
  // that are positioned in the timeline area (right of LEFT_COL_WIDTH)
  const barElements: HTMLElement[] = [];
  container.querySelectorAll('div, rect, polygon').forEach((el) => {
    const rect = (el as HTMLElement).getBoundingClientRect();
    const relLeft = rect.left - containerRect.left;
    // Must be in the timeline area, not the left panel
    if (relLeft >= LEFT_COL_WIDTH - 20 && rect.width > 0 && rect.height > 4 && rect.height < CELL_HEIGHT) {
      barElements.push(el as HTMLElement);
    }
  });

  // Group bars by their vertical center (row)
  // Sort by Y position, then assign to row indices
  barElements.sort((a, b) => {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    return aRect.top - bRect.top;
  });

  // Deduplicate by row: group elements within the same CELL_HEIGHT band
  let currentRow = -1;
  let lastY = -999;

  for (const el of barElements) {
    const rect = el.getBoundingClientRect();
    const relLeft = rect.left - containerRect.left;
    const relRight = rect.right - containerRect.left;
    const centerY = rect.top - containerRect.top + rect.height / 2;

    if (Math.abs(centerY - lastY) > CELL_HEIGHT * 0.5) {
      currentRow++;
      lastY = centerY;
    }

    const existing = positions.get(currentRow);
    if (!existing) {
      positions.set(currentRow, { left: relLeft, right: relRight, centerY });
    } else {
      // Expand the range if multiple elements in the same row
      existing.left = Math.min(existing.left, relLeft);
      existing.right = Math.max(existing.right, relRight);
    }
  }

  return positions;
}

/**
 * Render custom L-shaped dependency arrows as SVG paths.
 * Measures actual bar positions from the DOM for accurate alignment.
 */
function DependencyArrows({
  tasks,
  links,
  containerRef,
  containerWidth,
  renderKey,
}: {
  tasks: GanttTask[];
  links: GanttLink[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  containerWidth: number;
  renderKey: number;
}) {
  const [paths, setPaths] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    if (!containerRef.current || links.length === 0 || containerWidth === 0) {
      setPaths([]);
      return;
    }

    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const positions = measureBarPositions(containerRef.current);
      if (positions.size === 0) { setPaths([]); return; }

      // Build index map: task id → row index
      const taskIndex = new Map<string, number>();
      tasks.forEach((t, i) => taskIndex.set(t.id, i));

      const newPaths: React.ReactNode[] = [];

      for (const link of links) {
        const srcIdx = taskIndex.get(link.source);
        const tgtIdx = taskIndex.get(link.target);
        if (srcIdx === undefined || tgtIdx === undefined) continue;

        const srcPos = positions.get(srcIdx);
        const tgtPos = positions.get(tgtIdx);
        if (!srcPos || !tgtPos) continue;

        // Source: right edge of the bar
        const srcX = srcPos.right;
        const srcY = srcPos.centerY;

        // Target: left edge of the bar
        const tgtX = tgtPos.left;
        const tgtY = tgtPos.centerY;

        // L-shape: short horizontal from source, then vertical, then horizontal to target
        const gapX = srcX + 6;

        const pathD = `M ${srcX} ${srcY} L ${gapX} ${srcY} L ${gapX} ${tgtY} L ${tgtX} ${tgtY}`;

        const arrowD = `M ${tgtX} ${tgtY} L ${tgtX - ARROW_SIZE} ${tgtY - ARROW_SIZE} L ${tgtX - ARROW_SIZE} ${tgtY + ARROW_SIZE} Z`;

        newPaths.push(
          <g key={link.id} opacity={0.35}>
            <path d={pathD} fill="none" stroke="#78716C" strokeWidth={1.5} />
            <path d={arrowD} fill="#78716C" />
          </g>,
        );
      }

      setPaths(newPaths);
    }, 600); // wait for SVAR to finish rendering

    return () => clearTimeout(timer);
  }, [tasks, links, containerRef, containerWidth, renderKey]);

  if (paths.length === 0) return null;

  const totalHeight = containerRef.current?.scrollHeight || 800;

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

      {/* Custom L-shaped dependency arrows — measured from actual DOM positions */}
      <DependencyArrows
        tasks={tasks}
        links={links}
        containerRef={containerRef}
        containerWidth={containerWidth}
        renderKey={containerWidth + tasks.length}
      />

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

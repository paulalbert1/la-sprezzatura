/**
 * GanttChart — Frappe Gantt wrapper for Sanity Studio.
 *
 * Replaces SVAR React Gantt with Frappe Gantt for better dependency
 * arrow rendering, simpler CSS styling, and cleaner API.
 * Uses useRef + useEffect to mount the vanilla JS Frappe Gantt instance.
 */

import { useRef, useEffect } from "react";
// @ts-expect-error — Frappe Gantt has no TypeScript declarations
import Gantt from "frappe-gantt";
import "./frappe-gantt.css";
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
 * Convert our GanttTask + GanttLink arrays to Frappe Gantt's task format.
 * Frappe uses: { id, name, start, end, progress, dependencies, custom_class }
 * Dependencies are a comma-separated string of task IDs.
 */
function toFrappeTasks(tasks: GanttTask[], links: GanttLink[]) {
  // Build dependency map: target → [source1, source2, ...]
  const depMap = new Map<string, string[]>();
  for (const link of links) {
    const deps = depMap.get(link.target) || [];
    deps.push(link.source);
    depMap.set(link.target, deps);
  }

  return tasks.map((task) => {
    // Determine custom CSS class for per-category/contractor coloring
    let customClass = `gantt-cat-${task._category}`;
    if (task._category === "contractor" && task._colorIndex !== undefined) {
      customClass = `gantt-contractor-${task._colorIndex % 10}`;
    }
    if (task._category === "milestone" && task._completed) {
      customClass = "gantt-completed";
    }
    if (task._category === "procurement" && task._status) {
      customClass = `gantt-procurement-${task._status}`;
    }

    const end = task.end || task.start;
    const startStr = formatDate(task.start);
    let endStr = formatDate(end);
    // Frappe needs end to be at least 1 day after start to render a visible bar
    if (startStr === endStr) {
      const nextDay = new Date(end);
      nextDay.setDate(nextDay.getDate() + 1);
      endStr = formatDate(nextDay);
    }

    const deps = depMap.get(task.id);

    return {
      id: task.id,
      name: task.text,
      start: startStr,
      end: endStr,
      progress: task.progress || 0,
      dependencies: deps ? deps.join(", ") : "",
      custom_class: customClass,
    };
  });
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function GanttChart({ tasks, links, scales, cellWidth = 60 }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<InstanceType<typeof Gantt> | null>(null);

  // Determine view mode from scales
  const viewMode = scales.some((s) => s.unit === "day") ? "Week" : "Month";

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    const frappeTasks = toFrappeTasks(tasks, links);

    // Clear previous instance safely
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    try {
      ganttRef.current = new Gantt(containerRef.current, frappeTasks, {
        view_mode: viewMode,
        view_mode_select: false,
        readonly: true,
        readonly_progress: true,
        bar_height: 24,
        bar_corner_radius: 4,
        padding: 14,
        column_width: cellWidth,
        arrow_curve: 4,
        today_button: false,
        scroll_to: "today",
        lines: "both",
        popup_on: "hover",
        popup: (ctx: {
          task: { name: string; _start: Date; _end: Date; progress: number; dependencies?: string };
          set_title: (h: string) => void;
          set_subtitle: (h: string) => void;
          set_details: (h: string) => void;
        }) => {
          const { task } = ctx;
          ctx.set_title(task.name);

          const startStr = task._start?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) || "";
          const endStr = task._end?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) || "";
          ctx.set_subtitle(`${startStr} — ${endStr}`);

          // Show dependencies in the popup
          if (task.dependencies) {
            const depIds = task.dependencies.split(",").map((s: string) => s.trim()).filter(Boolean);
            const depNames = depIds.map((id: string) => {
              const depTask = tasks.find((t) => t.id === id);
              return depTask?.text || id;
            });
            const depText = document.createElement("div");
            depText.textContent = `Depends on: ${depNames.join(", ")}`;
            ctx.set_details(depText.textContent);
          } else {
            ctx.set_details("");
          }
        },
      });
    } catch (err) {
      console.error("[GanttChart] Frappe Gantt init error:", err);
    }

    return () => {
      ganttRef.current = null;
    };
  }, [tasks, links, viewMode, cellWidth]);

  return <div className="gantt-container" ref={containerRef} />;
}

/**
 * GanttChart — Frappe Gantt wrapper for Sanity Studio.
 *
 * Vanilla JS Frappe Gantt mounted via useRef + useEffect.
 * Day view by default, with Frappe's built-in view selector.
 */

import { useRef, useEffect } from "react";
// @ts-expect-error — Frappe Gantt has no TypeScript declarations
import Gantt from "frappe-gantt";
import "./frappe-gantt.css";
import "./gantt.css";

import type { GanttTask, GanttLink } from "./lib/ganttTypes";

interface GanttChartProps {
  tasks: GanttTask[];
  links: GanttLink[];
}

/**
 * Convert our GanttTask + GanttLink arrays to Frappe Gantt's task format.
 */
function toFrappeTasks(tasks: GanttTask[], links: GanttLink[]) {
  // Build dependency map: target → [source1, source2, ...]
  const depMap = new Map<string, string[]>();
  for (const link of links) {
    const deps = depMap.get(link.target) || [];
    deps.push(link.source);
    depMap.set(link.target, deps);
  }

  // Build set of task IDs involved in conflicts
  const conflictTargets = new Set<string>();
  for (const link of links) {
    if (link.conflict) conflictTargets.add(link.target);
  }

  return tasks.map((task) => {
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
    // Mark conflicting tasks — Frappe's classList.add() doesn't allow spaces,
    // so conflict replaces the category class
    if (conflictTargets.has(task.id)) {
      customClass = "gantt-conflict";
    }

    const end = task.end || task.start;
    const startStr = formatDate(task.start);
    let endStr = formatDate(end);
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

export function GanttChart({ tasks, links }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<InstanceType<typeof Gantt> | null>(null);

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    const frappeTasks = toFrappeTasks(tasks, links);

    // Clear previous instance
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    try {
      ganttRef.current = new Gantt(containerRef.current, frappeTasks, {
        view_mode: "Day",
        view_mode_select: false,       // Locked to Day — Week/Month views collapse bars unreadably
        readonly: true,
        readonly_progress: true,
        bar_height: 28,
        bar_corner_radius: 4,
        padding: 16,
        column_width: 45,
        arrow_curve: 5,
        today_button: true,
        scroll_to: "start",
        infinite_padding: false,
        auto_move_label: true,
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

          const startStr = task._start?.toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }) || "";
          const endStr = task._end?.toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }) || "";
          ctx.set_subtitle(`${startStr} — ${endStr}`);

          if (task.dependencies) {
            const depIds = task.dependencies.split(",").map((s: string) => s.trim()).filter(Boolean);
            const depNames = depIds.map((id: string) => {
              const depTask = tasks.find((t) => t.id === id);
              return depTask?.text || id;
            });
            ctx.set_details(`Depends on: ${depNames.join(", ")}`);
          } else {
            ctx.set_details("");
          }
        },
      });
    // Force container height to match SVG after Frappe renders
    // Frappe sets height via --gv-grid-height CSS var which collapses to 86px
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const svg = containerRef.current.querySelector('svg.gantt');
      if (svg) {
        const svgHeight = svg.getAttribute('height');
        if (svgHeight) {
          containerRef.current.style.height = `${parseInt(svgHeight) + 80}px`;
        }
      }
    });

    } catch (err) {
      console.error("[GanttChart] Frappe Gantt init error:", err);
    }

    return () => {
      ganttRef.current = null;
    };
  }, [tasks, links]);

  return <div className="gantt-container" ref={containerRef} />;
}

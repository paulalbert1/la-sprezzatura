/**
 * ScheduleEditor -- React island wrapping an interactive Frappe Gantt chart
 * with click-to-edit popovers, drag-and-drop date saves, and custom event CRUD.
 *
 * Mounts via `client:load` on the schedule.astro SSR page.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { X, Plus, Calendar, Trash2, ChevronDown } from "lucide-react";

// @ts-expect-error -- Frappe Gantt has no TypeScript declarations
import Gantt from "frappe-gantt";
import "../../lib/gantt/frappe-gantt.css";
import "../../lib/gantt/gantt.css";

import { transformProjectToGanttTasks } from "../../lib/gantt/ganttTransforms";
import type { GanttTask, GanttLink } from "../../lib/gantt/ganttTypes";
import {
  CONTRACTOR_PALETTE,
  CATEGORY_COLORS,
  getContractorColor,
} from "../../lib/gantt/ganttColors";
import { serializeSanityDate } from "../../lib/gantt/ganttDates";

// -- Shared CSS class constants (matching dialog mockup) --
const inputClasses =
  "w-full px-3 py-2 bg-white border border-[#d6d0c4] rounded-lg text-sm font-body text-charcoal focus:border-[#8a847c] focus:outline-none transition-colors";
const selectClasses = inputClasses + " appearance-none";
const labelClasses =
  "text-xs text-[#6b6560] font-body mb-1.5 block";
const btnClasses =
  "px-5 py-2 rounded-lg border border-[#d6d0c4] bg-white text-sm text-[#6b6560] font-body";
const btnDeleteClasses =
  "px-5 py-2 rounded-lg border border-[#e8c4c4] bg-[#fdf5f5] text-sm font-medium text-[#a33030] font-body";

// -- Valid custom event categories (matches schema in project.ts) --
const EVENT_CATEGORIES = [
  { value: "walkthrough", label: "Walkthrough" },
  { value: "inspection", label: "Inspection" },
  { value: "punch-list", label: "Punch List" },
  { value: "move", label: "Move" },
  { value: "permit", label: "Permit" },
  { value: "delivery-window", label: "Delivery Window" },
  { value: "presentation", label: "Presentation" },
  { value: "deadline", label: "Deadline" },
  { value: "access", label: "Access" },
  { value: "other", label: "Other" },
] as const;

// -- Types --

interface ScheduleEditorProps {
  scheduleData: {
    _id: string;
    title: string;
    engagementType?: string;
    isCommercial?: boolean;
    contractors: any[];
    milestones: any[];
    procurementItems: any[];
    customEvents: any[];
    scheduleDependencies: any[];
  };
  projectId: string;
  allContractors?: Array<{ _id: string; name: string; company?: string; trades?: string[] }>;
}

type PopoverState = {
  type: "edit" | "create";
  taskId?: string;
  category?: string;
  _key?: string;
  position: { top: number; left: number };
  fields: Record<string, any>;
} | null;

type ConfirmDeleteState = {
  key: string;
  name: string;
  category: string;
} | null;

// -- Frappe Gantt helper functions (copied from base GanttChart) --

function toFrappeTasks(tasks: GanttTask[], links: GanttLink[]) {
  const depMap = new Map<string, string[]>();
  for (const link of links) {
    const deps = depMap.get(link.target) || [];
    deps.push(link.source);
    depMap.set(link.target, deps);
  }

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
      customClass = "gantt-milestone-completed";
    }
    if (task._category === "procurement" && task._status) {
      customClass = `gantt-procurement-${task._status}`;
    }
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

// -- AdminGanttChart sub-component (inline, not exported) --

interface AdminGanttChartProps {
  tasks: GanttTask[];
  links: GanttLink[];
  onTaskClick?: (task: any) => void;
  onDateChange?: (task: any, newStart: Date, newEnd: Date) => void;
  onEmptyClick?: (dateStr: string) => void;
}

function AdminGanttChart({
  tasks,
  links,
  onTaskClick,
  onDateChange,
  onEmptyClick,
}: AdminGanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<InstanceType<typeof Gantt> | null>(null);
  const lastDragRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    const frappeTasks = toFrappeTasks(tasks, links);

    // Clear previous instance
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      ganttRef.current = new Gantt(containerRef.current, frappeTasks, {
        view_mode: "Day",
        view_mode_select: false,
        readonly: false,
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
          task: {
            name: string;
            _start: Date;
            _end: Date;
            progress: number;
            dependencies?: string;
          };
          set_title: (h: string) => void;
          set_subtitle: (h: string) => void;
          set_details: (h: string) => void;
        }) => {
          const { task } = ctx;
          ctx.set_title(task.name);

          const startStr =
            task._start?.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) || "";
          const endStr =
            task._end?.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) || "";
          ctx.set_subtitle(`${startStr} — ${endStr}`);

          if (task.dependencies) {
            const depIds = task.dependencies
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
            const depNames = depIds.map((id: string) => {
              const depTask = tasks.find((t) => t.id === id);
              return depTask?.text || id;
            });
            ctx.set_details(`Depends on: ${depNames.join(", ")}`);
          } else {
            ctx.set_details("");
          }
        },
        on_click: (task: any) => {
          if (lastDragRef.current === task.id) {
            lastDragRef.current = null;
            return;
          }
          onTaskClick?.(task);
        },
        on_date_change: (task: any, newStart: Date, newEnd: Date) => {
          lastDragRef.current = task.id;
          onDateChange?.(task, newStart, newEnd);
        },
        on_date_click: (dateStr: string) => {
          onEmptyClick?.(dateStr);
        },
      });

      // Post-process: fix milestone diamonds and container height
      resizeTimer = setTimeout(() => {
        if (!containerRef.current) return;

        // Transform milestone bars into true diamonds via SVG attributes
        const milestoneWrappers = containerRef.current.querySelectorAll(
          ".bar-wrapper.gantt-cat-milestone, .bar-wrapper.gantt-milestone-completed",
        );
        for (const wrapper of milestoneWrappers) {
          const bar = wrapper.querySelector(".bar") as SVGRectElement | null;
          if (!bar) continue;
          const x = parseFloat(bar.getAttribute("x") || "0");
          const w = parseFloat(bar.getAttribute("width") || "0");
          const h = parseFloat(bar.getAttribute("height") || "28");
          // Center a square diamond within the bar's area
          const size = Math.min(h, 18);
          const cx = x + w / 2;
          const cy = parseFloat(bar.getAttribute("y") || "0") + h / 2;
          bar.setAttribute("width", String(size));
          bar.setAttribute("height", String(size));
          bar.setAttribute("x", String(cx - size / 2));
          bar.setAttribute("y", String(cy - size / 2));
          bar.setAttribute("rx", "2");
          bar.setAttribute("ry", "2");
          bar.style.transform = "rotate(45deg)";
          bar.style.transformOrigin = "center";
          bar.style.transformBox = "fill-box";
        }

        // Fix container height
        const svg = containerRef.current.querySelector("svg.gantt");
        if (svg) {
          const svgHeight = svg.getAttribute("height");
          if (svgHeight) {
            const h = `${parseInt(svgHeight) + 80}px`;
            containerRef.current.style.setProperty("--gv-grid-height", h);
            containerRef.current.style.height = h;
          }
        }
      }, 200);
    } catch (err) {
      console.error("[AdminGanttChart] Frappe Gantt init error:", err);
    }

    return () => {
      clearTimeout(resizeTimer);
      ganttRef.current = null;
    };
  }, [tasks, links]);

  return <div className="gantt-container" ref={containerRef} />;
}

// -- Main ScheduleEditor component --

export default function ScheduleEditor({
  scheduleData,
  projectId,
  allContractors = [],
}: ScheduleEditorProps) {
  const [data, setData] = useState(scheduleData);
  const [popover, setPopover] = useState<PopoverState>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  // Close add menu on outside click
  useEffect(() => {
    if (!addMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [addMenuOpen]);

  // Derive Gantt tasks and links from data, filtering completed milestones
  const { tasks, links } = useMemo(() => {
    const result = transformProjectToGanttTasks(data);
    const allTasks = result.tasks || result;
    const allLinks = result.links || [];
    const filteredTasks = showCompleted
      ? allTasks
      : allTasks.filter((t: any) => !(t._category === "milestone" && t._completed));
    const taskIds = new Set(filteredTasks.map((t: any) => t.id));
    const filteredLinks = allLinks.filter(
      (l: any) => taskIds.has(l.source) && taskIds.has(l.target),
    );
    return { tasks: filteredTasks, links: filteredLinks };
  }, [data, showCompleted]);

  // Close popover on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopover(null);
        setConfirmDelete(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // -- Popover positioning logic --

  const handleTaskClick = (frappeTask: any) => {
    const taskId = frappeTask.id;
    const [category, _key] = taskId.split(":");

    // Find the bar element in the Gantt SVG
    const barEl = ganttContainerRef.current?.querySelector(
      `[data-id="${taskId}"] .bar-wrapper rect, .bar-wrapper[data-id="${taskId}"] rect, [data-id="${taskId}"] rect`,
    );
    const containerEl = ganttContainerRef.current;

    let position = { top: 200, left: 100 };
    if (barEl && containerEl) {
      const barRect = barEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();

      position = {
        top: barRect.bottom - containerRect.top + containerEl.scrollTop + 8,
        left: barRect.left - containerRect.left + containerEl.scrollLeft,
      };
    }

    // Pre-fill fields based on category
    let fields: Record<string, any> = {};

    if (category === "contractor") {
      const item = data.contractors?.find((c: any) => c._key === _key);
      if (item) {
        fields = {
          name: item.contractor?.name || "Unknown",
          startDate: item.startDate || "",
          endDate: item.endDate || "",
        };
      }
    } else if (category === "milestone") {
      const item = data.milestones?.find((m: any) => m._key === _key);
      if (item) {
        fields = {
          name: item.name || "Untitled Milestone",
          date: item.date || "",
          completed: item.completed ?? false,
        };
      }
    } else if (category === "event") {
      const item = data.customEvents?.find((e: any) => e._key === _key);
      if (item) {
        fields = {
          name: item.name || "",
          category: item.category || "other",
          date: item.date || "",
          endDate: item.endDate || "",
          notes: item.notes || "",
        };
      }
    } else if (category === "procurement") {
      const item = data.procurementItems?.find((p: any) => p._key === _key);
      fields = { name: item?.name || "Procurement Item" };
    }

    setNameError(false);
    setPopover({ type: "edit", taskId, category, _key, position, fields });
  };

  // -- Drag-and-drop handler (D-10) --

  const handleDateChange = async (
    frappeTask: any,
    newStart: Date,
    newEnd: Date,
  ) => {
    const taskId = frappeTask.id;
    const startDate = serializeSanityDate(newStart);
    const endDate = serializeSanityDate(newEnd);

    try {
      const res = await fetch("/api/admin/schedule-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, taskId, startDate, endDate }),
      });
      if (!res.ok) {
        const d = await res.json();
        console.error("Failed to save date:", d.error);
      }

      // Update local data state for consistency
      const [category, _key] = taskId.split(":");
      setData((prev) => {
        const next = { ...prev };
        if (category === "contractor") {
          next.contractors = prev.contractors.map((c: any) =>
            c._key === _key ? { ...c, startDate, endDate } : c,
          );
        } else if (category === "milestone") {
          next.milestones = prev.milestones.map((m: any) =>
            m._key === _key ? { ...m, date: startDate } : m,
          );
        } else if (category === "event") {
          next.customEvents = prev.customEvents.map((e: any) =>
            e._key === _key ? { ...e, date: startDate, endDate } : e,
          );
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to save schedule date:", err);
    }
  };

  // -- Empty space click handler (D-14) --

  const handleEmptyClick = (dateStr: string) => {
    // Position popover near center of visible viewport, not container
    const position = {
      top: window.innerHeight / 3,
      left: window.innerWidth / 3,
    };
    setNameError(false);
    setPopover({
      type: "create",
      category: "event",
      position,
      fields: {
        name: "",
        category: "other",
        date: dateStr,
        endDate: "",
        notes: "",
      },
    });
  };

  // -- Popover save handler (click-to-edit) (D-09) --

  const handlePopoverSave = async () => {
    if (!popover) return;
    setSaving(true);
    setError(null);

    try {
      if (
        popover.category === "contractor" ||
        popover.category === "milestone"
      ) {
        const body: Record<string, any> = {
          projectId,
          taskId: `${popover.category}:${popover._key}`,
          startDate:
            popover.category === "contractor"
              ? popover.fields.startDate
              : popover.fields.date,
          endDate:
            popover.category === "contractor"
              ? popover.fields.endDate
              : undefined,
        };
        if (popover.category === "milestone") {
          body.isComplete = popover.fields.completed;
        }

        const res = await fetch("/api/admin/schedule-date", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Failed to save");
        }

        // Update local state
        setData((prev) => {
          const next = { ...prev };
          if (popover.category === "contractor") {
            next.contractors = prev.contractors.map((c: any) =>
              c._key === popover._key
                ? {
                    ...c,
                    startDate: popover.fields.startDate,
                    endDate: popover.fields.endDate,
                  }
                : c,
            );
          } else if (popover.category === "milestone") {
            next.milestones = prev.milestones.map((m: any) =>
              m._key === popover._key
                ? {
                    ...m,
                    date: popover.fields.date,
                    completed: popover.fields.completed,
                  }
                : m,
            );
          }
          return next;
        });
      } else if (popover.category === "event" && popover.type === "edit") {
        const res = await fetch("/api/admin/schedule-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            projectId,
            eventKey: popover._key,
            fields: {
              name: popover.fields.name,
              category: popover.fields.category,
              date: popover.fields.date,
              endDate: popover.fields.endDate || null,
              notes: popover.fields.notes || "",
            },
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Failed to save");
        }

        // Update local state
        setData((prev) => ({
          ...prev,
          customEvents: prev.customEvents.map((e: any) =>
            e._key === popover._key
              ? {
                  ...e,
                  name: popover.fields.name,
                  category: popover.fields.category,
                  date: popover.fields.date,
                  endDate: popover.fields.endDate || null,
                  notes: popover.fields.notes || "",
                }
              : e,
          ),
        }));
      }

      setPopover(null);
    } catch (err: any) {
      setError(err.message || "Could not save changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // -- Create event handler (D-14) --

  const handleCreateEvent = async () => {
    if (!popover || popover.type !== "create") return;

    if (!popover.fields.name?.trim()) {
      setNameError(true);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/schedule-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          projectId,
          fields: {
            name: popover.fields.name.trim(),
            category: popover.fields.category || "other",
            date: popover.fields.date,
            endDate: popover.fields.endDate || null,
            notes: popover.fields.notes || "",
          },
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create event");
      }

      const result = await res.json();

      // Add event to local data
      setData((prev) => ({
        ...prev,
        customEvents: [
          ...prev.customEvents,
          {
            _key: result.eventKey,
            _type: "scheduleEvent",
            name: popover.fields.name.trim(),
            category: popover.fields.category || "other",
            date: popover.fields.date,
            endDate: popover.fields.endDate || null,
            notes: popover.fields.notes || "",
          },
        ],
      }));

      setPopover(null);
    } catch (err: any) {
      setError(err.message || "Could not save changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // -- Delete handler (events and milestones) --

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    setError(null);

    try {
      if (confirmDelete.category === "event") {
        const res = await fetch("/api/admin/schedule-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete",
            projectId,
            eventKey: confirmDelete.key,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Failed to delete event");
        }
        setData((prev) => ({
          ...prev,
          customEvents: prev.customEvents.filter(
            (e: any) => e._key !== confirmDelete.key,
          ),
        }));
      } else if (confirmDelete.category === "milestone") {
        const res = await fetch("/api/admin/schedule-date", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete",
            projectId,
            taskId: `milestone:${confirmDelete.key}`,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Failed to delete milestone");
        }
        setData((prev) => ({
          ...prev,
          milestones: prev.milestones.filter(
            (m: any) => m._key !== confirmDelete.key,
          ),
        }));
      }

      setConfirmDelete(null);
      setPopover(null);
    } catch (err: any) {
      setError(err.message || "Could not save changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // -- Update popover field helper --

  const updateField = (fieldName: string, value: any) => {
    if (!popover) return;
    setPopover({
      ...popover,
      fields: { ...popover.fields, [fieldName]: value },
    });
    if (fieldName === "name" && value?.trim()) {
      setNameError(false);
    }
  };

  // -- Dependency management --

  const handleAddDependency = async (targetTaskId: string, sourceTaskId: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/schedule-dependency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          projectId,
          source: sourceTaskId,
          target: targetTaskId,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add dependency");
      }
      const result = await res.json();
      setData((prev) => ({
        ...prev,
        scheduleDependencies: [
          ...(prev.scheduleDependencies || []),
          { _key: result.depKey, source: sourceTaskId, target: targetTaskId, linkType: "e2s" },
        ],
      }));
    } catch (err: any) {
      setError(err.message || "Failed to add dependency");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDependency = async (depKey: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/schedule-dependency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", projectId, depKey }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to remove dependency");
      }
      setData((prev) => ({
        ...prev,
        scheduleDependencies: (prev.scheduleDependencies || []).filter(
          (dep: any) => dep._key !== depKey,
        ),
      }));
    } catch (err: any) {
      setError(err.message || "Failed to remove dependency");
    } finally {
      setSaving(false);
    }
  };

  // -- Add contractor to schedule --

  const handleAddContractor = async (contractorId: string) => {
    setSaving(true);
    setError(null);
    try {
      const today = serializeSanityDate(new Date());
      const res = await fetch("/api/admin/schedule-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addContractor",
          projectId,
          contractorId,
          startDate: today,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add contractor");
      }
      const result = await res.json();
      const contractor = allContractors.find((c) => c._id === contractorId);
      if (contractor) {
        setData((prev) => ({
          ...prev,
          contractors: [
            ...prev.contractors,
            {
              _key: result.assignmentKey || Date.now().toString(36),
              contractor: { _id: contractor._id, name: contractor.name, company: contractor.company || "", trades: contractor.trades || [] },
              startDate: today,
              endDate: null,
            },
          ],
        }));
      }
      setPopover(null);
      setAddMenuOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to add contractor");
    } finally {
      setSaving(false);
    }
  };

  // -- Dependency UI helper: get dependencies for a task --

  const getDependenciesForTask = (taskId: string) => {
    return (data.scheduleDependencies || []).filter(
      (dep: any) => dep.target === taskId,
    );
  };

  const getAvailableDependencySources = (taskId: string) => {
    const existingSourceIds = new Set(
      getDependenciesForTask(taskId).map((d: any) => d.source),
    );
    return tasks.filter(
      (t: any) => t.id !== taskId && !existingSourceIds.has(t.id),
    );
  };

  // -- Calculate fixed popover position for portal --

  // All popovers render viewport-centered — simpler and always visible
  const getPopoverScreenPos = () => ({
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  });

  // -- Dependency section for edit popovers --

  const renderDependencySection = (taskId: string) => {
    const deps = getDependenciesForTask(taskId);
    const availableSources = getAvailableDependencySources(taskId);

    return (
      <div className="border-t border-stone-light/20 pt-3 mt-3">
        <label className={labelClasses}>Depends on</label>
        {deps.length > 0 && (
          <div className="space-y-1 mb-2">
            {deps.map((dep: any) => {
              const srcTask = tasks.find((t: any) => t.id === dep.source);
              return (
                <div key={dep._key} className="flex items-center justify-between text-xs font-body text-charcoal bg-cream-dark rounded px-2 py-1">
                  <span>{srcTask?.text || dep.source}</span>
                  <button
                    onClick={() => handleRemoveDependency(dep._key)}
                    className="text-stone-light hover:text-red-600 transition-colors ml-2"
                    aria-label="Remove dependency"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {availableSources.length > 0 && (
          <select
            className={selectClasses + " text-xs py-2"}
            value=""
            onChange={(e) => {
              if (e.target.value) {
                handleAddDependency(taskId, e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="">Add dependency...</option>
            {availableSources.map((t: any) => (
              <option key={t.id} value={t.id}>{t.text}</option>
            ))}
          </select>
        )}
      </div>
    );
  };

  // -- Render popover content based on category --

  const renderPopoverContent = () => {
    if (!popover) return null;

    // Add contractor picker
    if (popover.category === "add-contractor") {
      const alreadyAssigned = new Set(
        (data.contractors || []).map((c: any) => c.contractor?._id).filter(Boolean),
      );
      const available = allContractors.filter((c) => !alreadyAssigned.has(c._id));

      return (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-body text-charcoal">Add Contractor</h3>
            <button onClick={() => setPopover(null)} className="text-stone-light hover:text-charcoal transition-colors" aria-label="Close"><X size={16} /></button>
          </div>
          {available.length === 0 ? (
            <p className="text-sm text-stone font-body">All contractors are already assigned.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={labelClasses}>Contractor</label>
                <select
                  className={selectClasses}
                  value={popover.fields.contractorId || ""}
                  onChange={(e) => updateField("contractorId", e.target.value)}
                >
                  <option value="">Select...</option>
                  {available.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}{c.company ? ` (${c.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-xs text-red-600 font-body">{error}</p>}
              <button
                onClick={() => {
                  if (popover.fields.contractorId) handleAddContractor(popover.fields.contractorId);
                }}
                disabled={saving || !popover.fields.contractorId}
                className={`text-xs text-stone font-body px-3 py-1.5 border border-stone-light/20 rounded-md hover:bg-stone-light/10 transition-colors ${saving || !popover.fields.contractorId ? "opacity-50" : ""}`}
              >
                {saving ? "Adding..." : "Add to Schedule"}
              </button>
            </div>
          )}
        </>
      );
    }

    // Create milestone
    if (popover.category === "milestone" && popover.type === "create") {
      return (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-body text-charcoal">New Milestone</h3>
            <button onClick={() => setPopover(null)} className="text-stone-light hover:text-charcoal transition-colors" aria-label="Close"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClasses}>Name *</label>
              <input
                type="text"
                className={`${inputClasses} ${nameError ? "border-red-400" : ""}`}
                value={popover.fields.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Milestone name"
                autoFocus
              />
            </div>
            <div>
              <label className={labelClasses}>Date</label>
              <input type="date" className={inputClasses} value={popover.fields.date || ""} onChange={(e) => updateField("date", e.target.value)} />
            </div>
            {error && <p className="text-xs text-red-600 font-body">{error}</p>}
            <button
              onClick={async () => {
                if (!popover.fields.name?.trim()) { setNameError(true); return; }
                setSaving(true); setError(null);
                try {
                  const res = await fetch("/api/admin/schedule-date", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "createMilestone",
                      projectId,
                      name: popover.fields.name.trim(),
                      startDate: popover.fields.date,
                    }),
                  });
                  if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
                  const result = await res.json();
                  setData((prev) => ({
                    ...prev,
                    milestones: [...prev.milestones, { _key: result.milestoneKey || Date.now().toString(36), name: popover.fields.name.trim(), date: popover.fields.date, completed: false }],
                  }));
                  setPopover(null);
                } catch (err: any) {
                  setError(err.message || "Failed to create milestone");
                } finally { setSaving(false); }
              }}
              disabled={saving}
              className={`${btnClasses} ${saving ? "opacity-50" : ""}`}
            >
              {saving ? "Creating..." : "Create Milestone"}
            </button>
          </div>
        </>
      );
    }

    // Procurement: read-only
    if (popover.category === "procurement") {
      return (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-body text-charcoal">
              Procurement: {popover.fields.name}
            </h3>
            <button
              onClick={() => setPopover(null)}
              className="text-stone-light hover:text-charcoal transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-stone font-body">
            Procurement dates are managed in the Procurement editor.
          </p>
          <a
            href={`/admin/projects/${projectId}/procurement`}
            className="text-sm text-terracotta hover:text-terracotta-light font-body transition-colors inline-block mt-3"
          >
            Go to Procurement
          </a>
        </>
      );
    }

    // Contractor: startDate, endDate
    if (popover.category === "contractor") {
      const taskId = `contractor:${popover._key}`;
      return (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-body text-charcoal">
              Edit Contractor: {popover.fields.name}
            </h3>
            <button
              onClick={() => setPopover(null)}
              className="text-stone-light hover:text-charcoal transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClasses}>Start Date</label>
              <input
                type="date"
                className={inputClasses}
                value={popover.fields.startDate || ""}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClasses}>End Date</label>
              <input
                type="date"
                className={inputClasses}
                value={popover.fields.endDate || ""}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 font-body">{error}</p>
            )}
            <button
              onClick={handlePopoverSave}
              disabled={saving}
              className={`${btnClasses} ${saving ? "opacity-50" : ""}`}
            >
              {saving ? "Saving..." : "Save Dates"}
            </button>
            {renderDependencySection(taskId)}
          </div>
        </>
      );
    }

    // Milestone: date, completed toggle
    if (popover.category === "milestone") {
      const taskId = `milestone:${popover._key}`;
      return (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold font-body text-charcoal">
              {popover.fields.name}
            </h3>
            <button
              onClick={() => setPopover(null)}
              className="text-stone-light hover:text-charcoal transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Date</label>
              <input
                type="date"
                className={inputClasses}
                value={popover.fields.date || ""}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="milestone-completed"
                className="w-4 h-4 rounded border border-[#d6d0c4] accent-charcoal"
                checked={popover.fields.completed || false}
                onChange={(e) => updateField("completed", e.target.checked)}
              />
              <label
                htmlFor="milestone-completed"
                className="text-sm font-body text-[#6b6560]"
              >
                Completed
              </label>
            </div>
            {renderDependencySection(taskId)}
            {error && (
              <p className="text-xs text-red-600 font-body">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setConfirmDelete({
                    key: popover._key!,
                    name: popover.fields.name,
                    category: "milestone",
                  })
                }
                className={btnDeleteClasses}
              >
                Delete
              </button>
              <button
                onClick={handlePopoverSave}
                disabled={saving}
                className={`px-5 py-2 rounded-lg border border-[#d6d0c4] bg-white text-sm text-[#6b6560] font-body ${saving ? "opacity-50" : ""}`}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </>
      );
    }

    // Custom Event: edit or create
    const isCreate = popover.type === "create";
    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold font-body text-charcoal">
            {isCreate
              ? "New Event"
              : `Edit Event: ${popover.fields.name}`}
          </h3>
          <button
            onClick={() => setPopover(null)}
            className="text-stone-light hover:text-charcoal transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelClasses}>
              Name {isCreate && "*"}
            </label>
            <input
              type="text"
              className={`${inputClasses} ${nameError ? "border-red-400" : ""}`}
              value={popover.fields.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Event name"
              autoFocus={isCreate}
            />
          </div>
          <div>
            <label className={labelClasses}>Category</label>
            <select
              className={selectClasses}
              value={popover.fields.category || "other"}
              onChange={(e) => updateField("category", e.target.value)}
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Start Date</label>
            <input
              type="date"
              className={inputClasses}
              value={popover.fields.date || ""}
              onChange={(e) => updateField("date", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClasses}>End Date (optional)</label>
            <input
              type="date"
              className={inputClasses}
              value={popover.fields.endDate || ""}
              onChange={(e) => updateField("endDate", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClasses}>Notes</label>
            <textarea
              className={inputClasses + " min-h-[60px] resize-y"}
              value={popover.fields.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optional notes"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 font-body">{error}</p>
          )}
          {isCreate ? (
            <button
              onClick={handleCreateEvent}
              disabled={saving}
              className={`${btnClasses} ${saving ? "opacity-50" : ""}`}
            >
              {saving ? "Creating..." : "Create Event"}
            </button>
          ) : (
            <>
              <button
                onClick={handlePopoverSave}
                disabled={saving}
                className={`${btnClasses} ${saving ? "opacity-50" : ""}`}
              >
                {saving ? "Saving..." : "Save Dates"}
              </button>
              <button
                onClick={() =>
                  setConfirmDelete({
                    key: popover._key!,
                    name: popover.fields.name,
                    category: "event",
                  })
                }
                className={`${btnDeleteClasses} mt-3`}
              >
                Delete Event
              </button>
              {renderDependencySection(`event:${popover._key}`)}
            </>
          )}
        </div>
      </>
    );
  };

  // -- Legend (two-row card) --

  const renderLegend = () => (
    <div className="flex items-center gap-3 text-xs text-[#8a847c] font-body">
      <span className="flex items-center gap-1">
        <svg width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" rx="1" fill="#1a1a1a" transform="rotate(45 4 4)" /></svg>
        Milestone
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#85B7EB" }} />
        Event
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#FAC775" }} />
        Procurement
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: "#D3D1C7" }} />
        Completed
      </span>
    </div>
  );

  // -- + Add dropdown renderer --

  const renderAddMenu = () => (
    <div ref={addMenuRef} className="relative shrink-0">
      <button
        className="border border-[#d6d0c4] bg-[#f3f1ed] text-xs font-medium font-body text-[#2c2a27] px-3.5 py-1.5 rounded-lg hover:bg-[#eae6df] transition-colors inline-flex items-center gap-1.5"
        onClick={() => setAddMenuOpen((v) => !v)}
      >
        <Plus size={14} /> Add <ChevronDown size={12} />
      </button>
      {addMenuOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-stone-light/20 rounded-lg shadow-lg z-20 py-1">
          {allContractors.length > 0 && (
            <button
              className="w-full text-left px-4 py-2.5 hover:bg-stone-light/5 transition-colors"
              onClick={() => {
                setAddMenuOpen(false);
                setPopover({
                  type: "create",
                  category: "add-contractor",
                  position: { top: window.innerHeight / 3, left: window.innerWidth / 3 },
                  fields: { contractorId: "" },
                });
              }}
            >
              <span className="text-sm font-body text-charcoal block">Contractor</span>
              <span className="text-xs font-body text-stone">Assign a contractor to the timeline</span>
            </button>
          )}
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-stone-light/5 transition-colors"
            onClick={() => {
              setAddMenuOpen(false);
              const today = serializeSanityDate(new Date());
              if (today) handleEmptyClick(today);
            }}
          >
            <span className="text-sm font-body text-charcoal block">Event</span>
            <span className="text-xs font-body text-stone">Add a walkthrough, inspection, etc.</span>
          </button>
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-stone-light/5 transition-colors"
            onClick={() => {
              setAddMenuOpen(false);
              setPopover({
                type: "create",
                category: "milestone",
                position: { top: window.innerHeight / 3, left: window.innerWidth / 3 },
                fields: { name: "", date: serializeSanityDate(new Date()) || "", completed: false },
              });
            }}
          >
            <span className="text-sm font-body text-charcoal block">Milestone</span>
            <span className="text-xs font-body text-stone">Add a project milestone marker</span>
          </button>
        </div>
      )}
    </div>
  );

  // -- Empty state --

  if (tasks.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div />
          {renderAddMenu()}
        </div>
        <div className="text-center py-12">
          <p className="text-sm font-semibold font-body text-charcoal">
            No schedule data yet
          </p>
          <p className="text-sm text-stone font-body mt-2">
            Add contractors, milestones, or events in the project editor to see
            them on the timeline.
          </p>
        </div>
      </div>
    );
  }

  // -- Main render --

  const popoverScreenPos = getPopoverScreenPos();

  return (
    <div>
      {/* Legend + Show completed + Add dropdown — single row */}
      <div className="flex items-center justify-between mb-4">
        {renderLegend()}
        <div className="flex items-center gap-4 shrink-0">
          <label className="flex items-center gap-2 text-xs text-[#a09a92] font-body cursor-pointer">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded border border-stone-light/30 accent-charcoal"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            Show completed
          </label>
          {renderAddMenu()}
        </div>
      </div>

      {/* Gantt chart container (relative for positioning reference) */}
      <div ref={ganttContainerRef} className="relative">
        <AdminGanttChart
          tasks={tasks}
          links={links}
          onTaskClick={handleTaskClick}
          onDateChange={handleDateChange}
          onEmptyClick={handleEmptyClick}
        />
      </div>

      {/* Popover (portaled to body for z-index safety) */}
      {popover &&
        createPortal(
          <>
            {/* Backdrop to dismiss popover on outside click */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setPopover(null)}
            />
            {/* Popover card */}
            <div
              className="bg-white rounded-[14px] border border-[#d6d0c4] p-6 z-40"
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 360,
              }}
            >
              {renderPopoverContent()}
            </div>
          </>,
          document.body,
        )}

      {/* Delete confirmation dialog */}
      {confirmDelete &&
        createPortal(
          <>
            <div className="fixed inset-0 bg-black/8 z-50" onClick={() => setConfirmDelete(null)} />
            <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-[14px] border border-[#d6d0c4] p-6 w-[360px] pointer-events-auto">
                <h3 className="text-base font-semibold font-body text-charcoal mb-2">
                  Delete {confirmDelete.name}?
                </h3>
                <p className="text-sm text-[#6b6560] font-body leading-relaxed mb-5">
                  {confirmDelete.category === "milestone"
                    ? "This milestone will be permanently removed from the schedule."
                    : "This event will be permanently removed from the schedule."}
                </p>
                {error && (
                  <p className="text-xs text-red-600 font-body mb-3">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-5 py-2 rounded-lg border border-[#d6d0c4] bg-white text-sm text-[#6b6560] font-body"
                  >
                    {confirmDelete.category === "milestone" ? "Keep Milestone" : "Keep Event"}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className={`px-5 py-2 rounded-lg border border-[#e8c4c4] bg-[#fdf5f5] text-sm font-medium text-[#a33030] font-body ${saving ? "opacity-50" : ""}`}
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

/**
 * ScheduleEditor -- React island wrapping an interactive Frappe Gantt chart
 * with click-to-edit popovers, drag-and-drop date saves, and custom event CRUD.
 *
 * Mounts via `client:load` on the schedule.astro SSR page.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { X, Plus, Calendar, Trash2 } from "lucide-react";

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

// -- Shared CSS class constants (per UI-SPEC) --
const inputClasses =
  "w-full px-4 py-3 bg-cream-dark border border-stone-light/30 rounded-lg text-sm font-body text-charcoal focus:border-terracotta focus:outline-none transition-colors";
const selectClasses = inputClasses + " appearance-none";
const labelClasses =
  "text-xs uppercase tracking-widest text-stone font-body mb-2 block";
const ctaClasses =
  "bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 rounded-lg hover:bg-terracotta-light transition-colors inline-flex items-center gap-2";

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
      customClass = "gantt-completed";
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

      // Force container to match SVG height
      resizeTimer = setTimeout(() => {
        if (!containerRef.current) return;
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
  const [contractorPopover, setContractorPopover] = useState<{
    open: boolean;
    position: { top: number; left: number };
    contractorId: string;
    startDate: string;
    endDate: string;
  } | null>(null);
  const addContractorBtnRef = useRef<HTMLButtonElement>(null);
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  // Derive Gantt tasks and links from data, filtering completed milestones
  const { tasks, links } = useMemo(() => {
    const result = transformProjectToGanttTasks(data);
    const filteredTasks = showCompleted
      ? result.tasks
      : result.tasks.filter((t) => !(t._category === "milestone" && t._completed));
    const taskIds = new Set(filteredTasks.map((t) => t.id));
    const filteredLinks = result.links.filter(
      (l) => taskIds.has(l.source) && taskIds.has(l.target),
    );
    return { tasks: filteredTasks, links: filteredLinks };
  }, [data, showCompleted]);

  // Close popover on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopover(null);
        setConfirmDelete(null);
        setContractorPopover(null);
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

  // -- Dependency handlers --

  const handleAddDependency = async (target: string, source: string) => {
    try {
      const res = await fetch("/api/admin/schedule-dependency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", projectId, source, target }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setData((prev) => ({
        ...prev,
        scheduleDependencies: [
          ...(prev.scheduleDependencies || []),
          { _key: result.depKey, source, target, linkType: "e2s" },
        ],
      }));
    } catch (err: any) {
      setError(err.message || "Failed to add dependency");
    }
  };

  const handleRemoveDependency = async (depKey: string) => {
    try {
      const res = await fetch("/api/admin/schedule-dependency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", projectId, depKey }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setData((prev) => ({
        ...prev,
        scheduleDependencies: (prev.scheduleDependencies || []).filter(
          (d: any) => d._key !== depKey,
        ),
      }));
    } catch (err: any) {
      setError(err.message || "Failed to remove dependency");
    }
  };

  // -- Add Contractor handler --

  const handleAddContractor = async () => {
    if (!contractorPopover || !contractorPopover.contractorId) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/schedule-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-contractor",
          projectId,
          contractorId: contractorPopover.contractorId,
          startDate: contractorPopover.startDate || null,
          endDate: contractorPopover.endDate || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add contractor");

      // Find the contractor info from allContractors
      const contractorInfo = allContractors.find(
        (c) => c._id === contractorPopover.contractorId,
      );

      setData((prev) => ({
        ...prev,
        contractors: [
          ...prev.contractors,
          {
            _key: result.entryKey,
            contractor: {
              _id: contractorPopover.contractorId,
              name: contractorInfo?.name || "Unknown",
              company: contractorInfo?.company || "",
              trades: contractorInfo?.trades || [],
            },
            startDate: contractorPopover.startDate || null,
            endDate: contractorPopover.endDate || null,
          },
        ],
      }));

      setContractorPopover(null);
    } catch (err: any) {
      setError(err.message || "Failed to add contractor");
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

  // -- Calculate fixed popover position for portal --

  const getPopoverScreenPos = () => {
    if (!popover) return { top: 0, left: 0 };

    // "create" popovers from Add Event button use viewport coordinates directly
    if (popover.type === "create") return popover.position;

    // "edit" popovers are positioned relative to the Gantt container
    const containerEl = ganttContainerRef.current;
    if (!containerEl) return popover.position;

    const containerRect = containerEl.getBoundingClientRect();
    return {
      top: containerRect.top + popover.position.top - containerEl.scrollTop,
      left: containerRect.left + popover.position.left - containerEl.scrollLeft,
    };
  };

  // -- Render popover content based on category --

  const renderPopoverContent = () => {
    if (!popover) return null;

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
            {/* Depends on */}
            {popover.type === "edit" && (
              <div>
                <label className={labelClasses}>Depends on</label>
                {(data.scheduleDependencies || [])
                  .filter((d: any) => d.target === popover.taskId)
                  .map((dep: any) => {
                    const sourceTask = tasks.find((t) => t.id === dep.source);
                    return (
                      <div key={dep._key} className="flex items-center justify-between text-xs font-body py-1">
                        <span className="text-charcoal">{sourceTask?.text || dep.source}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDependency(dep._key);
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                <select
                  className="w-full mt-1 px-2 py-1.5 bg-cream-dark border border-stone-light/30 rounded-md text-xs font-body text-charcoal focus:border-terracotta focus:outline-none"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddDependency(popover.taskId!, e.target.value);
                  }}
                >
                  <option value="">Add predecessor...</option>
                  {tasks
                    .filter((t) => t.id !== popover.taskId && t._category !== "procurement")
                    .map((t) => (
                      <option key={t.id} value={t.id}>{t.text}</option>
                    ))}
                </select>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-600 font-body">{error}</p>
            )}
            <button
              onClick={handlePopoverSave}
              disabled={saving}
              className={`text-xs text-stone font-body px-3 py-1.5 border border-stone-light/20 rounded-md hover:bg-stone-light/10 transition-colors ${saving ? "opacity-50" : ""}`}
            >
              {saving ? "Saving..." : "Save Dates"}
            </button>
          </div>
        </>
      );
    }

    // Milestone: date, completed toggle
    if (popover.category === "milestone") {
      return (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-body text-charcoal">
              Edit Milestone: {popover.fields.name}
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
                className="w-5 h-5 rounded border border-stone-light/30 accent-terracotta"
                checked={popover.fields.completed || false}
                onChange={(e) => updateField("completed", e.target.checked)}
              />
              <label
                htmlFor="milestone-completed"
                className="text-sm font-body text-charcoal"
              >
                Completed
              </label>
            </div>
            {/* Depends on */}
            {popover.type === "edit" && (
              <div>
                <label className={labelClasses}>Depends on</label>
                {(data.scheduleDependencies || [])
                  .filter((d: any) => d.target === popover.taskId)
                  .map((dep: any) => {
                    const sourceTask = tasks.find((t) => t.id === dep.source);
                    return (
                      <div key={dep._key} className="flex items-center justify-between text-xs font-body py-1">
                        <span className="text-charcoal">{sourceTask?.text || dep.source}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDependency(dep._key);
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                <select
                  className="w-full mt-1 px-2 py-1.5 bg-cream-dark border border-stone-light/30 rounded-md text-xs font-body text-charcoal focus:border-terracotta focus:outline-none"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddDependency(popover.taskId!, e.target.value);
                  }}
                >
                  <option value="">Add predecessor...</option>
                  {tasks
                    .filter((t) => t.id !== popover.taskId && t._category !== "procurement")
                    .map((t) => (
                      <option key={t.id} value={t.id}>{t.text}</option>
                    ))}
                </select>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-600 font-body">{error}</p>
            )}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePopoverSave}
                disabled={saving}
                className={`text-xs text-stone font-body px-3 py-1.5 border border-stone-light/20 rounded-md hover:bg-stone-light/10 transition-colors ${saving ? "opacity-50" : ""}`}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() =>
                  setConfirmDelete({
                    key: popover._key!,
                    name: popover.fields.name,
                    category: "milestone",
                  })
                }
                className="text-xs text-red-600 hover:text-red-700 font-body transition-colors"
              >
                Delete
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
          {/* Depends on (edit only) */}
          {!isCreate && popover.type === "edit" && (
            <div>
              <label className={labelClasses}>Depends on</label>
              {(data.scheduleDependencies || [])
                .filter((d: any) => d.target === popover.taskId)
                .map((dep: any) => {
                  const sourceTask = tasks.find((t) => t.id === dep.source);
                  return (
                    <div key={dep._key} className="flex items-center justify-between text-xs font-body py-1">
                      <span className="text-charcoal">{sourceTask?.text || dep.source}</span>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDependency(dep._key);
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              <select
                className="w-full mt-1 px-2 py-1.5 bg-cream-dark border border-stone-light/30 rounded-md text-xs font-body text-charcoal focus:border-terracotta focus:outline-none"
                value=""
                onChange={(e) => {
                  if (e.target.value) handleAddDependency(popover.taskId!, e.target.value);
                }}
              >
                <option value="">Add predecessor...</option>
                {tasks
                  .filter((t) => t.id !== popover.taskId && t._category !== "procurement")
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.text}</option>
                  ))}
              </select>
            </div>
          )}
          {error && (
            <p className="text-xs text-red-600 font-body">{error}</p>
          )}
          {isCreate ? (
            <button
              onClick={handleCreateEvent}
              disabled={saving}
              className={`text-xs text-stone font-body px-3 py-1.5 border border-stone-light/20 rounded-md hover:bg-stone-light/10 transition-colors ${saving ? "opacity-50" : ""}`}
            >
              {saving ? "Creating..." : "Create Event"}
            </button>
          ) : (
            <>
              <button
                onClick={handlePopoverSave}
                disabled={saving}
                className={`text-xs text-stone font-body px-3 py-1.5 border border-stone-light/20 rounded-md hover:bg-stone-light/10 transition-colors ${saving ? "opacity-50" : ""}`}
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
                className="text-xs text-red-600 hover:text-red-700 font-body transition-colors mt-3"
              >
                Delete Event
              </button>
            </>
          )}
        </div>
      </>
    );
  };

  // -- Legend --

  const renderLegend = () => {
    const contractors = data.contractors || [];
    return (
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs text-stone font-body">
        {contractors.map((c: any, i: number) => {
          const name = c.contractor?.name || "Unknown";
          const color = getContractorColor(i);
          return (
            <div key={c._key} className="flex items-center">
              <span
                className="w-3 h-3 rounded-full inline-block mr-2"
                style={{ backgroundColor: color }}
              />
              {name}
            </div>
          );
        })}
        <div className="flex items-center">
          <span
            className="w-3 h-3 rounded-full inline-block mr-2"
            style={{ backgroundColor: CATEGORY_COLORS.milestones }}
          />
          Milestones
        </div>
        <div className="flex items-center">
          <span
            className="w-3 h-3 rounded-full inline-block mr-2"
            style={{ backgroundColor: CATEGORY_COLORS.events }}
          />
          Events
        </div>
        <div className="flex items-center">
          <span
            className="w-3 h-3 rounded-full inline-block mr-2"
            style={{ backgroundColor: CATEGORY_COLORS.procurement }}
          />
          Procurement
        </div>
      </div>
    );
  };

  // -- Empty state --

  if (tasks.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div />
          <button
            className={ctaClasses}
            onClick={() =>
              handleEmptyClick(serializeSanityDate(new Date()) || "")
            }
          >
            <Plus size={16} /> Add Event
          </button>
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
      {/* Legend + Add Event button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">{renderLegend()}</div>
        <label className="flex items-center gap-2 text-xs text-stone font-body shrink-0 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border border-stone-light/30 accent-terracotta"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          Show completed
        </label>
        {allContractors.length > 0 && (
          <button
            ref={addContractorBtnRef}
            className="text-xs text-stone font-body px-3 py-1.5 border border-stone-light/20 rounded-md hover:bg-stone-light/10 transition-colors shrink-0 ml-4 inline-flex items-center gap-1"
            onClick={() => {
              const btn = addContractorBtnRef.current;
              const rect = btn?.getBoundingClientRect();
              setContractorPopover({
                open: true,
                position: {
                  top: (rect?.bottom ?? 200) + 8,
                  left: rect?.left ?? 100,
                },
                contractorId: "",
                startDate: "",
                endDate: "",
              });
            }}
          >
            <Plus size={14} /> Add Contractor
          </button>
        )}
        <button
          className={ctaClasses + " shrink-0 ml-4"}
          onClick={() => {
            const today = serializeSanityDate(new Date());
            if (today) handleEmptyClick(today);
          }}
        >
          <Plus size={16} /> Add Event
        </button>
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
              className="bg-white rounded-xl shadow-xl border border-stone-light/20 p-4 z-40"
              style={{
                position: "fixed",
                top: popoverScreenPos.top,
                left: popoverScreenPos.left,
                minWidth: 280,
                maxWidth: 360,
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
            <div className="fixed inset-0 bg-black/30 z-50" />
            <div className="fixed inset-0 z-[60] flex items-center justify-center">
              <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-auto">
                <h3 className="text-sm font-semibold font-body text-charcoal">
                  Delete {confirmDelete.name}?
                </h3>
                <p className="text-sm text-stone font-body mt-2">
                  This event will be permanently removed from the schedule.
                </p>
                {error && (
                  <p className="text-xs text-red-600 font-body mt-2">
                    {error}
                  </p>
                )}
                <div className="flex items-center justify-end gap-4 mt-4">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-sm text-stone hover:text-charcoal font-body transition-colors"
                  >
                    Keep Event
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className={`bg-red-600 text-white text-xs uppercase tracking-widest font-body px-4 py-2 rounded-lg hover:bg-red-700 transition-colors ${saving ? "opacity-50" : ""}`}
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Add Contractor popover */}
      {contractorPopover &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setContractorPopover(null)}
            />
            <div
              className="bg-white rounded-xl shadow-xl border border-stone-light/20 p-4 z-40"
              style={{
                position: "fixed",
                top: contractorPopover.position.top,
                left: contractorPopover.position.left,
                minWidth: 280,
                maxWidth: 360,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold font-body text-charcoal">
                  Add Contractor
                </h3>
                <button
                  onClick={() => setContractorPopover(null)}
                  className="text-stone-light hover:text-charcoal transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelClasses}>Contractor</label>
                  <select
                    className={selectClasses}
                    value={contractorPopover.contractorId}
                    onChange={(e) =>
                      setContractorPopover((prev) =>
                        prev ? { ...prev, contractorId: e.target.value } : prev,
                      )
                    }
                  >
                    <option value="">Select contractor...</option>
                    {allContractors
                      .filter(
                        (c) =>
                          !data.contractors?.some(
                            (assigned: any) =>
                              assigned.contractor?._id === c._id,
                          ),
                      )
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                          {c.company ? ` (${c.company})` : ""}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Start Date</label>
                  <input
                    type="date"
                    className={inputClasses}
                    value={contractorPopover.startDate}
                    onChange={(e) =>
                      setContractorPopover((prev) =>
                        prev ? { ...prev, startDate: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div>
                  <label className={labelClasses}>End Date</label>
                  <input
                    type="date"
                    className={inputClasses}
                    value={contractorPopover.endDate}
                    onChange={(e) =>
                      setContractorPopover((prev) =>
                        prev ? { ...prev, endDate: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-600 font-body">{error}</p>
                )}
                <button
                  onClick={handleAddContractor}
                  disabled={saving || !contractorPopover.contractorId}
                  className={`text-xs text-stone font-body px-3 py-1.5 border border-stone-light/20 rounded-md hover:bg-stone-light/10 transition-colors ${saving || !contractorPopover.contractorId ? "opacity-50" : ""}`}
                >
                  {saving ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

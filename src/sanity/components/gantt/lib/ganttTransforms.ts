/**
 * Pure transform functions: Sanity document data -> SVAR Gantt tasks.
 *
 * No side effects, no hooks, no API calls.
 * Each function converts one Sanity data type into a GanttTask or returns null
 * if the item lacks required date fields.
 */

import { parseSanityDate } from "./ganttDates";
import type {
  GanttTask,
  GanttLink,
  ResolvedContractor,
  SanityProjectData,
} from "./ganttTypes";

/**
 * Create 4 virtual summary rows (swim lane headers) for the Gantt chart.
 * Summary rows are always present, even if their category has no data items.
 * Per D-07: all lanes start expanded (open: true).
 */
export function createSummaryRows(): GanttTask[] {
  const categories = [
    { id: "summary:contractors", text: "Contractors" },
    { id: "summary:milestones", text: "Milestones" },
    { id: "summary:procurement", text: "Procurement" },
    { id: "summary:events", text: "Events" },
  ];

  return categories.map((cat) => ({
    id: cat.id,
    text: cat.text,
    start: new Date(),
    end: null,
    type: "summary" as const,
    parent: null,
    open: true,
    progress: 0,
    _category: cat.id.split(":")[1],
  }));
}

/**
 * Transform a resolved contractor assignment into a Gantt task bar.
 * Returns null if startDate is missing (cannot render a bar without a start).
 */
export function contractorToTask(
  contractor: ResolvedContractor,
  colorIndex: number,
): GanttTask | null {
  const start = parseSanityDate(contractor.startDate);
  if (!start) return null;

  const end = parseSanityDate(contractor.endDate) || start;

  const name = contractor.contractor?.name || "Unknown";
  const company = contractor.contractor?.company || "";
  const text = company ? `${name} (${company})` : name;

  return {
    id: `contractor:${contractor._key}`,
    text,
    start,
    end,
    type: "task",
    parent: "summary:contractors",
    open: true,
    progress: 0,
    _colorIndex: colorIndex,
    _category: "contractor",
  };
}

/**
 * Transform a milestone into a Gantt diamond marker.
 * Returns null if date is missing.
 * Per SCHED-06: completed milestones are marked with _completed: true for dimmed styling.
 */
export function milestoneToTask(
  milestone: { _key: string; name: string; date: string | null; completed: boolean; description?: string },
  _index: number,
): GanttTask | null {
  const start = parseSanityDate(milestone.date);
  if (!start) return null;

  return {
    id: `milestone:${milestone._key}`,
    text: milestone.name || "Untitled Milestone",
    start,
    end: start,
    type: "milestone",
    parent: "summary:milestones",
    open: true,
    progress: 0,
    _category: "milestone",
    _completed: milestone.completed ?? false,
  };
}

/**
 * Transform a procurement item into a Gantt marker at its install date.
 * Returns null if installDate is missing.
 * Per SCHED-07: status is preserved for status-based color styling.
 */
export function procurementToTask(
  item: {
    _key: string;
    name: string;
    status: string;
    installDate: string | null;
    orderDate: string | null;
    expectedDeliveryDate: string | null;
  },
  _index: number,
): GanttTask | null {
  const start = parseSanityDate(item.installDate);
  if (!start) return null;

  return {
    id: `procurement:${item._key}`,
    text: item.name || "Untitled Item",
    start,
    end: start,
    type: "milestone",
    parent: "summary:procurement",
    open: true,
    progress: 0,
    _category: "procurement",
    _status: item.status || "pending",
  };
}

/**
 * Transform a custom schedule event into a Gantt marker (single-day) or bar (multi-day).
 * Returns null if date is missing.
 * Per SCHED-08: events with endDate become bars (type: "task"), without become point markers (type: "milestone").
 */
export function customEventToTask(
  event: {
    _key: string;
    name: string;
    date: string;
    endDate: string | null;
    category: string;
    notes: string | null;
  },
  _index: number,
): GanttTask | null {
  const start = parseSanityDate(event.date);
  if (!start) return null;

  const end = parseSanityDate(event.endDate);
  const isMultiDay = end !== null;

  return {
    id: `event:${event._key}`,
    text: event.name || "Untitled Event",
    start,
    end: end || start,
    type: isMultiDay ? "task" : "milestone",
    parent: "summary:events",
    open: true,
    progress: 0,
    _category: event.category || "other",
  };
}

/**
 * Transform an entire Sanity project document into SVAR Gantt tasks.
 * Returns summary rows followed by all data tasks, with nulls filtered out.
 */
export function transformProjectToGanttTasks(
  data: SanityProjectData,
): GanttTask[] {
  const summaryRows = createSummaryRows();

  const contractorTasks = (data.contractors || [])
    .map((c, i) => contractorToTask(c, i))
    .filter((t): t is GanttTask => t !== null);

  const milestoneTasks = (data.milestones || [])
    .map((m, i) => milestoneToTask(m, i))
    .filter((t): t is GanttTask => t !== null);

  const procurementTasks = (data.procurementItems || [])
    .map((p, i) => procurementToTask(p, i))
    .filter((t): t is GanttTask => t !== null);

  const eventTasks = (data.customEvents || [])
    .map((e, i) => customEventToTask(e, i))
    .filter((t): t is GanttTask => t !== null);

  // Sort each category by start date (earliest first).
  const byDate = (a: GanttTask, b: GanttTask) => a.start.getTime() - b.start.getTime();
  contractorTasks.sort(byDate);
  milestoneTasks.sort(byDate);
  procurementTasks.sort(byDate);
  eventTasks.sort(byDate);

  // SVAR crashes if a summary row has zero children — only include
  // summary rows for categories that have at least one task.
  // Interleave: summary row followed immediately by its sorted children.
  const allTasks = [...contractorTasks, ...milestoneTasks, ...procurementTasks, ...eventTasks];
  const parentIds = new Set(allTasks.map((t) => t.parent));
  const activeSummaries = summaryRows.filter((s) => parentIds.has(s.id));

  const result: GanttTask[] = [];
  for (const summary of activeSummaries) {
    result.push(summary);
    for (const task of allTasks) {
      if (task.parent === summary.id) result.push(task);
    }
  }

  // Transform dependency links
  const taskIds = new Set(result.map((t) => t.id));
  const links: GanttLink[] = (data.scheduleDependencies || [])
    .map((dep) => {
      const sourceId = `${dep.fromCategory}:${dep.fromKey}`;
      const targetId = `${dep.toCategory}:${dep.toKey}`;
      // Only include links where both tasks exist in the chart
      if (!taskIds.has(sourceId) || !taskIds.has(targetId)) return null;
      return {
        id: dep._key,
        source: sourceId,
        target: targetId,
        type: (dep.linkType || "e2s") as GanttLink["type"],
      };
    })
    .filter((l): l is GanttLink => l !== null);

  return { tasks: result, links };
}

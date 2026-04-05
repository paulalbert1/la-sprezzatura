import { describe, it, expect } from "vitest";
import {
  createSummaryRows,
  contractorToTask,
  milestoneToTask,
  procurementToTask,
  customEventToTask,
  transformProjectToGanttTasks,
} from "./ganttTransforms";
import type {
  ResolvedContractor,
  SanityProjectData,
} from "./ganttTypes";

// --- Test fixtures ---

const mockContractor: ResolvedContractor = {
  _key: "c1",
  contractor: {
    _id: "ref1",
    name: "John's Painting",
    company: "JP LLC",
    trades: ["painting"],
  },
  startDate: "2026-05-01",
  endDate: "2026-05-15",
  estimateAmount: null,
  scopeOfWork: null,
  internalNotes: null,
  contractorNotes: null,
  appointments: [],
};

const mockMilestone = {
  _key: "m1",
  name: "Design Approval",
  date: "2026-05-10",
  completed: false,
};

const mockCompletedMilestone = {
  _key: "m2",
  name: "Install Complete",
  date: "2026-06-01",
  completed: true,
};

const mockProcurement = {
  _key: "p1",
  name: "Custom Sofa",
  status: "ordered" as const,
  installDate: "2026-06-15",
  orderDate: null,
  expectedDeliveryDate: null,
};

const mockEvent = {
  _key: "e1",
  name: "Office Walkthrough",
  date: "2026-05-20",
  endDate: null,
  category: "walkthrough",
  notes: null,
};

const mockMultiDayEvent = {
  _key: "e2",
  name: "Move-In Week",
  date: "2026-07-01",
  endDate: "2026-07-05",
  category: "move",
  notes: null,
};

// --- Tests ---

describe("createSummaryRows", () => {
  it("returns 4 summary rows", () => {
    const rows = createSummaryRows();
    expect(rows).toHaveLength(4);
  });

  it("has correct IDs for each summary row", () => {
    const rows = createSummaryRows();
    const ids = rows.map((r) => r.id);
    expect(ids).toEqual([
      "summary:contractors",
      "summary:milestones",
      "summary:procurement",
      "summary:events",
    ]);
  });

  it("all summary rows have type summary, open: true, parent: null", () => {
    const rows = createSummaryRows();
    for (const row of rows) {
      expect(row.type).toBe("summary");
      expect(row.open).toBe(true);
      expect(row.parent).toBeNull();
    }
  });
});

describe("contractorToTask", () => {
  it("returns a GanttTask with correct fields for valid contractor", () => {
    const task = contractorToTask(mockContractor, 0);
    expect(task).not.toBeNull();
    expect(task!.id).toBe("contractor:c1");
    expect(task!.type).toBe("task");
    expect(task!.parent).toBe("summary:contractors");
    expect(task!._colorIndex).toBe(0);
    expect(task!._category).toBe("contractor");
    expect(task!.text).toContain("John's Painting");
    expect(task!.text).toContain("JP LLC");
  });

  it("returns correct start/end dates", () => {
    const task = contractorToTask(mockContractor, 0);
    expect(task!.start).toBeInstanceOf(Date);
    expect(task!.end).toBeInstanceOf(Date);
    expect(task!.start.getFullYear()).toBe(2026);
    expect(task!.start.getMonth()).toBe(4); // May = 4
    expect(task!.start.getDate()).toBe(1);
  });

  it("returns null when startDate is missing", () => {
    const noStart = { ...mockContractor, startDate: null };
    const task = contractorToTask(noStart, 0);
    expect(task).toBeNull();
  });

  it("uses startDate as end if endDate is missing", () => {
    const noEnd = { ...mockContractor, endDate: null };
    const task = contractorToTask(noEnd, 0);
    expect(task).not.toBeNull();
    expect(task!.start.getTime()).toBe(task!.end!.getTime());
  });
});

describe("milestoneToTask", () => {
  it("returns a GanttTask with correct fields for valid milestone", () => {
    const task = milestoneToTask(mockMilestone, 0);
    expect(task).not.toBeNull();
    expect(task!.id).toBe("milestone:m1");
    expect(task!.type).toBe("milestone");
    expect(task!.parent).toBe("summary:milestones");
    expect(task!._completed).toBe(false);
    expect(task!._category).toBe("milestone");
  });

  it("sets _completed: true for completed milestone", () => {
    const task = milestoneToTask(mockCompletedMilestone, 0);
    expect(task).not.toBeNull();
    expect(task!._completed).toBe(true);
  });

  it("returns null when date is missing", () => {
    const noDate = { ...mockMilestone, date: null };
    const task = milestoneToTask(noDate, 0);
    expect(task).toBeNull();
  });
});

describe("procurementToTask", () => {
  it("returns a GanttTask with correct fields for valid procurement item", () => {
    const task = procurementToTask(mockProcurement, 0);
    expect(task).not.toBeNull();
    expect(task!.id).toBe("procurement:p1");
    expect(task!.type).toBe("milestone");
    expect(task!.parent).toBe("summary:procurement");
    expect(task!._status).toBe("ordered");
    expect(task!._category).toBe("procurement");
  });

  it("returns null when installDate is missing", () => {
    const noDate = { ...mockProcurement, installDate: null };
    const task = procurementToTask(noDate, 0);
    expect(task).toBeNull();
  });
});

describe("customEventToTask", () => {
  it("returns type milestone for single-day event (no endDate)", () => {
    const task = customEventToTask(mockEvent, 0);
    expect(task).not.toBeNull();
    expect(task!.id).toBe("event:e1");
    expect(task!.type).toBe("milestone");
    expect(task!.parent).toBe("summary:events");
    expect(task!._category).toBe("walkthrough");
  });

  it("returns type task for multi-day event (with endDate)", () => {
    const task = customEventToTask(mockMultiDayEvent, 0);
    expect(task).not.toBeNull();
    expect(task!.id).toBe("event:e2");
    expect(task!.type).toBe("task");
    expect(task!.parent).toBe("summary:events");
    expect(task!._category).toBe("move");
  });

  it("returns null when date is missing", () => {
    const noDate = { ...mockEvent, date: "" };
    const task = customEventToTask(noDate, 0);
    expect(task).toBeNull();
  });
});

describe("transformProjectToGanttTasks", () => {
  const mockProjectData: SanityProjectData = {
    contractors: [mockContractor],
    milestones: [mockMilestone, mockCompletedMilestone],
    procurementItems: [mockProcurement],
    customEvents: [mockEvent, mockMultiDayEvent],
    scheduleDependencies: [
      { _key: "d1", source: "milestone:m1", target: "contractor:c1", linkType: "e2s" },
    ],
    engagementType: "full-interior-design",
    isCommercial: false,
  };

  it("returns flat chronological list with no summary rows", () => {
    const { tasks } = transformProjectToGanttTasks(mockProjectData);
    expect(tasks.length).toBe(6); // 1 contractor + 2 milestones + 1 procurement + 2 events
    expect(tasks.every((t) => t.type !== "summary")).toBe(true);
    expect(tasks.every((t) => t.parent === null)).toBe(true);
    // Sorted by date
    for (let i = 1; i < tasks.length; i++) {
      expect(tasks[i].start.getTime()).toBeGreaterThanOrEqual(tasks[i - 1].start.getTime());
    }
  });

  it("contains no null entries", () => {
    const { tasks } = transformProjectToGanttTasks(mockProjectData);
    for (const task of tasks) {
      expect(task).not.toBeNull();
      expect(task).not.toBeUndefined();
    }
  });

  it("returns dependency links for valid source/target pairs", () => {
    const { links } = transformProjectToGanttTasks(mockProjectData);
    expect(links).toHaveLength(1);
    expect(links[0].source).toBe("milestone:m1");
    expect(links[0].target).toBe("contractor:c1");
    expect(links[0].type).toBe("e2s");
    // m1 is May 10, c1 starts May 1 — predecessor ends after successor starts
    expect(links[0].conflict).toBe(true);
  });

  it("detects conflicts when predecessor ends after successor starts", () => {
    // milestone m1 is May 10, contractor c1 starts May 1 — conflict!
    const conflictData: SanityProjectData = {
      ...mockProjectData,
      scheduleDependencies: [
        { _key: "d1", source: "contractor:c1", target: "milestone:m1", linkType: "e2s" },
      ],
    };
    const { links, conflicts } = transformProjectToGanttTasks(conflictData);
    // contractor c1 ends May 15, milestone m1 starts May 10 → 5 day overlap
    expect(links[0].conflict).toBe(true);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].overlapDays).toBe(5);
    expect(conflicts[0].sourceName).toContain("JP");
    expect(conflicts[0].targetName).toBe("Design Approval");
  });

  it("filters out links with missing source or target tasks", () => {
    const badLinkData: SanityProjectData = {
      ...mockProjectData,
      scheduleDependencies: [
        { _key: "d1", source: "milestone:nonexistent", target: "contractor:c1", linkType: "e2s" },
      ],
    };
    const { links } = transformProjectToGanttTasks(badLinkData);
    expect(links).toHaveLength(0);
  });

  it("returns no tasks with empty arrays (SVAR crashes on empty summary rows)", () => {
    const emptyData: SanityProjectData = {
      contractors: [],
      milestones: [],
      procurementItems: [],
      customEvents: [],
      scheduleDependencies: [],
      engagementType: "full-interior-design",
      isCommercial: false,
    };
    const { tasks } = transformProjectToGanttTasks(emptyData);
    expect(tasks).toHaveLength(0);
  });

  it("returns only data tasks for partial data (no summary rows)", () => {
    const partialData: SanityProjectData = {
      contractors: [mockContractor],
      milestones: [],
      procurementItems: [],
      customEvents: [],
      scheduleDependencies: [],
      engagementType: "full-interior-design",
      isCommercial: false,
    };
    const { tasks } = transformProjectToGanttTasks(partialData);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("contractor:c1");
  });

  it("filters out items with missing dates", () => {
    const dataWithBadDates: SanityProjectData = {
      contractors: [{ ...mockContractor, startDate: null }],
      milestones: [{ ...mockMilestone, date: null }],
      procurementItems: [{ ...mockProcurement, installDate: null }],
      customEvents: [{ ...mockEvent, date: "" }],
      scheduleDependencies: [],
      engagementType: "full-interior-design",
      isCommercial: false,
    };
    const { tasks } = transformProjectToGanttTasks(dataWithBadDates);
    expect(tasks).toHaveLength(0);
  });
});

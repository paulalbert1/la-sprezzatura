import { describe, it, expect } from "vitest";

// Test the filter logic directly (extracted as a pure function)
// This will be imported from the component once it exists
import { filterProjects } from "./ProjectList";

describe("ProjectList filter logic", () => {
  const projects = [
    { _id: "1", title: "A", pipelineStage: "discovery", engagementType: "full-interior-design", projectStatus: "active", clientName: "Alice" },
    { _id: "2", title: "B", pipelineStage: "procurement", engagementType: "styling-refreshing", projectStatus: "active", clientName: "Bob" },
    { _id: "3", title: "C", pipelineStage: "procurement", engagementType: "full-interior-design", projectStatus: "completed", clientName: null },
  ];

  it("returns all projects when filter is 'all'", () => {
    expect(filterProjects(projects, "all")).toHaveLength(3);
  });

  it("filters by pipeline stage", () => {
    const result = filterProjects(projects, "procurement");
    expect(result).toHaveLength(2);
    expect(result.every(p => p.pipelineStage === "procurement")).toBe(true);
  });

  it("returns empty array for unmatched stage", () => {
    expect(filterProjects(projects, "closeout")).toHaveLength(0);
  });

  it("handles null pipelineStage without crashing", () => {
    const withNull = [...projects, { _id: "4", title: "D", pipelineStage: null, engagementType: "carpet-curating", projectStatus: "active", clientName: "Dan" }];
    expect(filterProjects(withNull, "all")).toHaveLength(4);
    expect(filterProjects(withNull, "discovery")).toHaveLength(1);
  });
});

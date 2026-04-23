import { describe, it, expect } from "vitest";
import { projectWorkflow } from "./projectWorkflow";

describe("projectWorkflow schema", () => {
  it("is a Sanity document named 'projectWorkflow'", () => {
    expect(projectWorkflow.name).toBe("projectWorkflow");
    expect(projectWorkflow.title).toBe("Project Workflow");
    expect(projectWorkflow.type).toBe("document");
  });

  it("project is a reference to 'project'", () => {
    const fields = projectWorkflow.fields as Array<Record<string, unknown>>;
    const project = fields.find((f) => f.name === "project");
    expect(project).toBeDefined();
    expect(project?.type).toBe("reference");
    const to = (project?.to as Array<{ type: string }>) ?? [];
    expect(to.map((t) => t.type)).toContain("project");
  });

  it("templateId is a plain string (not a reference) per Pitfall 3", () => {
    const fields = projectWorkflow.fields as Array<Record<string, unknown>>;
    const templateId = fields.find((f) => f.name === "templateId");
    expect(templateId).toBeDefined();
    expect(templateId?.type).toBe("string");
    expect(templateId?.type).not.toBe("reference");
  });

  it("status enumerates exactly the four lifecycle values", () => {
    const fields = projectWorkflow.fields as Array<Record<string, unknown>>;
    const status = fields.find((f) => f.name === "status") as { options?: { list?: string[] } };
    expect(status?.options?.list).toEqual(expect.arrayContaining(["active", "dormant", "complete", "terminated"]));
  });
});

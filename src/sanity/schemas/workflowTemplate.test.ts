import { describe, it, expect } from "vitest";
import { workflowTemplate } from "./workflowTemplate";

describe("workflowTemplate schema", () => {
  it("is a Sanity document named 'workflowTemplate'", () => {
    expect(workflowTemplate.name).toBe("workflowTemplate");
    expect(workflowTemplate.title).toBe("Workflow Template");
    expect(workflowTemplate.type).toBe("document");
  });

  it("declares required top-level fields", () => {
    const names = (workflowTemplate.fields as Array<{ name: string }>).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(["name", "version", "defaults", "phases", "createdAt", "updatedAt"]));
  });
});

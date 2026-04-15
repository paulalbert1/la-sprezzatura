import { describe, it, expect } from "vitest";
import { generateClosePdf } from "./generateClosePdf";

describe("generateClosePdf", () => {
  it("returns a non-empty Buffer", async () => {
    const result = await generateClosePdf({
      projectTitle: "Living Room Redesign",
      clientNames: ["Sarah Johnson"],
      milestones: [
        { name: "Discovery Complete", date: "2026-01-15", completed: true },
        { name: "Design Approved", date: "2026-02-01", completed: true },
      ],
      approvedArtifacts: ["Floor Plan", "Design Board"],
    });
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it("buffer starts with PDF magic bytes", async () => {
    const result = await generateClosePdf({
      projectTitle: "Test",
      clientNames: ["Test Client"],
      milestones: [],
      approvedArtifacts: [],
    });
    expect(result.toString("ascii", 0, 5)).toBe("%PDF-");
  });

  it("handles optional personalNote", async () => {
    const result = await generateClosePdf({
      projectTitle: "Test",
      clientNames: ["Test Client"],
      milestones: [],
      approvedArtifacts: [],
      personalNote: "Thank you for trusting us with your home!",
    });
    expect(result.length).toBeGreaterThan(0);
  });
});

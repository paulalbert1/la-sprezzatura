import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  runWithConcurrency,
  buildPlaceholderImages,
  FILENAME_TRUNCATE_STYLE,
  ACCEPTED_FILE_TYPES,
  UPLOAD_CONCURRENCY_LIMIT,
} from "./StepUpload";
import type { WizardImage } from "../../../lib/rendering/types";

// RNDR-07: Image preview — Source: Studio StepUpload.tsx lines 86-100 (localPreviewUrl via URL.createObjectURL)
// RNDR-08: Filename truncation — Source: Studio StepUpload.tsx lines 427-443 (overflow:hidden, textOverflow:ellipsis, maxWidth:120)
// RNDR-09: Multi-upload — Source: Studio StepUpload.tsx (multiple attr + handleFiles + runWithConcurrency, limit=3)

// ---------------------------------------------------------------------------
// Test helpers: mock global URL.createObjectURL / URL.revokeObjectURL
// ---------------------------------------------------------------------------

let createdUrls: string[] = [];
let revokedUrls: string[] = [];
let nextUrlId = 0;

beforeEach(() => {
  createdUrls = [];
  revokedUrls = [];
  nextUrlId = 0;
  // Stub URL.createObjectURL / revokeObjectURL globally so the tests can run in node
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn((_file: unknown) => {
      const url = `blob:mock://preview-${++nextUrlId}`;
      createdUrls.push(url);
      return url;
    }),
    revokeObjectURL: vi.fn((url: string) => {
      revokedUrls.push(url);
    }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeFile(
  name: string,
  type: string = "image/png",
  size: number = 1024,
): File {
  // Minimal File shim — Node 18+ has global File but we set size via the blob bits length
  const bits = new Uint8Array(size);
  return new File([bits], name, { type });
}

// ---------------------------------------------------------------------------
// RNDR-07: image preview
// ---------------------------------------------------------------------------
describe("StepUpload (admin) — preview (RNDR-07)", () => {
  it("creates localPreviewUrl via URL.createObjectURL synchronously before upload starts", () => {
    const files = [makeFile("a.png"), makeFile("b.jpg", "image/jpeg")];
    const placeholders = buildPlaceholderImages(files, 0);

    // Synchronous — no promises, no await
    expect(placeholders).toHaveLength(2);
    expect(placeholders[0].localPreviewUrl).toBe("blob:mock://preview-1");
    expect(placeholders[1].localPreviewUrl).toBe("blob:mock://preview-2");
    expect(createdUrls).toEqual([
      "blob:mock://preview-1",
      "blob:mock://preview-2",
    ]);
  });

  it("does NOT create preview URLs for PDF files (isPdf guard)", () => {
    const files = [
      makeFile("doc.pdf", "application/pdf"),
      makeFile("image.png"),
    ];
    const placeholders = buildPlaceholderImages(files, 0);
    expect(placeholders[0].localPreviewUrl).toBeUndefined();
    expect(placeholders[1].localPreviewUrl).toBe("blob:mock://preview-1");
    expect(createdUrls).toHaveLength(1);
  });

  it("marks every placeholder as uploading=true so the UI can show a spinner", () => {
    const placeholders = buildPlaceholderImages([makeFile("a.png")], 0);
    expect(placeholders[0].uploading).toBe(true);
    expect(placeholders[0].blobPathname).toBe("");
    expect(placeholders[0].error).toBeUndefined();
  });

  it("retains the original File object for retry and auto-selects Floor Plan for first image", () => {
    // Ports Studio lines 93-96: first image gets copyExact=true, imageType='Floor Plan'
    const placeholders = buildPlaceholderImages(
      [makeFile("a.png"), makeFile("b.png")],
      0,
    );
    expect(placeholders[0].imageType).toBe("Floor Plan");
    expect(placeholders[0].copyExact).toBe(true);
    expect(placeholders[0].file).toBeDefined();
    expect(placeholders[1].imageType).toBe("Existing Space Photo");
    expect(placeholders[1].copyExact).toBe(false);
  });

  it("when images already exist, new placeholders use Existing Space Photo (not Floor Plan)", () => {
    // currentCount > 0 — second batch, don't re-flag first as Floor Plan
    const placeholders = buildPlaceholderImages([makeFile("c.png")], 3);
    expect(placeholders[0].imageType).toBe("Existing Space Photo");
    expect(placeholders[0].copyExact).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RNDR-08: filename truncation
// ---------------------------------------------------------------------------
describe("StepUpload (admin) — filename truncation (RNDR-08)", () => {
  it("FILENAME_TRUNCATE_STYLE has overflow:hidden, textOverflow:ellipsis, whiteSpace:nowrap, maxWidth:120", () => {
    expect(FILENAME_TRUNCATE_STYLE.overflow).toBe("hidden");
    expect(FILENAME_TRUNCATE_STYLE.textOverflow).toBe("ellipsis");
    expect(FILENAME_TRUNCATE_STYLE.whiteSpace).toBe("nowrap");
    expect(FILENAME_TRUNCATE_STYLE.maxWidth).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// RNDR-09: multi-upload + concurrency pool
// ---------------------------------------------------------------------------
describe("StepUpload (admin) — multi-upload (RNDR-09)", () => {
  it("ACCEPTED_FILE_TYPES includes image/png, image/jpeg, image/webp, image/heic", () => {
    // Sanity check that the constant wired into <input accept=...> is exposed
    expect(ACCEPTED_FILE_TYPES).toContain("image/png");
    expect(ACCEPTED_FILE_TYPES).toContain("image/jpeg");
    expect(ACCEPTED_FILE_TYPES).toContain("image/webp");
    expect(ACCEPTED_FILE_TYPES).toContain("image/heic");
  });

  it("UPLOAD_CONCURRENCY_LIMIT is 3 (matches Studio runWithConcurrency pool size)", () => {
    expect(UPLOAD_CONCURRENCY_LIMIT).toBe(3);
  });

  it("buildPlaceholderImages accepts an array of 3 files and returns 3 placeholders in order", () => {
    const files = [
      makeFile("one.png"),
      makeFile("two.png"),
      makeFile("three.png"),
    ];
    const placeholders = buildPlaceholderImages(files, 0);
    expect(placeholders).toHaveLength(3);
    expect(placeholders.map((p) => p.fileName)).toEqual([
      "one.png",
      "two.png",
      "three.png",
    ]);
  });

  it("runWithConcurrency processes all tasks and returns results in input order", async () => {
    const calls: number[] = [];
    const tasks = [1, 2, 3, 4, 5].map((n) => async () => {
      calls.push(n);
      // Simulate async work
      await new Promise((r) => setTimeout(r, 1));
      return n * 10;
    });

    const results = await runWithConcurrency(tasks, 3);
    expect(results).toEqual([10, 20, 30, 40, 50]);
    expect(calls.length).toBe(5);
  });

  it("runWithConcurrency caps in-flight tasks at the concurrency limit", async () => {
    let inFlight = 0;
    let peak = 0;
    const tasks = [1, 2, 3, 4, 5, 6, 7, 8].map(() => async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return null;
    });
    await runWithConcurrency(tasks, 3);
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(0);
  });

  it("runWithConcurrency with empty task list returns empty array", async () => {
    const results = await runWithConcurrency([], 3);
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Memory cleanup contract (RNDR-07 unmount path)
// ---------------------------------------------------------------------------
describe("StepUpload (admin) — memory cleanup contract", () => {
  it("placeholder images carry the localPreviewUrl so an unmount effect can revoke them", () => {
    // The effect is inline in the component (useEffect cleanup); this test validates
    // that the data shape supports revocation on unmount — localPreviewUrl must be
    // present as a string field the cleanup effect can iterate over and revoke.
    const images: WizardImage[] = buildPlaceholderImages(
      [makeFile("a.png"), makeFile("b.png")],
      0,
    );
    const revocable = images.filter((img) => img.localPreviewUrl);
    expect(revocable).toHaveLength(2);

    // Simulate the useEffect cleanup that the component runs on unmount
    revocable.forEach((img) => URL.revokeObjectURL(img.localPreviewUrl!));
    expect(revokedUrls).toEqual([
      "blob:mock://preview-1",
      "blob:mock://preview-2",
    ]);
  });
});

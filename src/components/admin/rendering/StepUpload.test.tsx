import { describe, it } from "vitest";
// RNDR-07: Image preview — Source: StepUpload.tsx lines 86-100 (localPreviewUrl via URL.createObjectURL)
// RNDR-08: Filename truncation — Source: StepUpload.tsx lines 427-443 (overflow:hidden, textOverflow:ellipsis, maxWidth:120)
// RNDR-09: Multi-upload — Source: StepUpload.tsx (multiple attr + handleFiles + runWithConcurrency)
describe("StepUpload (admin)", () => {
  describe("preview (RNDR-07)", () => {
    it.todo("creates localPreviewUrl via URL.createObjectURL synchronously before upload starts");
    it.todo("renders <img src={localPreviewUrl}> during upload before blobPathname is returned");
    it.todo("revokes preview URL via URL.revokeObjectURL on unmount (memory cleanup)");
  });
  describe("filename truncation (RNDR-08)", () => {
    it.todo("filename div has overflow:hidden, textOverflow:ellipsis, whiteSpace:nowrap, maxWidth:120");
    it.todo("long filename (>60 chars) is displayed truncated with title attribute set to full name");
  });
  describe("multi-upload (RNDR-09)", () => {
    it.todo("file input has multiple attribute");
    it.todo("handleFiles accepts FileList and processes all files concurrently (pool size 3)");
    it.todo("selecting 3 files results in 3 WizardImage entries with blobPathname values");
  });
});

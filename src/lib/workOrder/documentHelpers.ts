/**
 * Phase 39 Plan 01 Task 3 — Document formatting helpers.
 *
 * Pure functions used by the Documents panel (Plan 02) to render
 * file metadata rows. Kept framework-agnostic for easy testing.
 * Mirrors ArtifactManager.tsx L40-45 formatFileSize convention.
 */

export function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileTypeFromAsset(
  originalFilename: string | undefined,
  mimeType: string | undefined,
): "PDF" | "JPG" | "PNG" | "FILE" {
  const ext = originalFilename?.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf" || mimeType === "application/pdf") return "PDF";
  if (["jpg", "jpeg"].includes(ext) || mimeType === "image/jpeg") return "JPG";
  if (ext === "png" || mimeType === "image/png") return "PNG";
  return "FILE";
}

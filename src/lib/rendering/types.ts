// -- Data types matching Sanity schema shapes --
// Shared rendering types used by both Sanity Studio and the admin tool (/admin/rendering).
// Moved from src/sanity/components/rendering/types.ts in Phase 33 Plan 01 so admin
// components can import without reaching into the Studio tree. The Studio file now
// re-exports from here for backward compatibility.

export interface RenderingImage {
  _key: string;
  blobPathname: string;
  imageType: string;
  location?: string;
  notes?: string;
  copyExact: boolean;
}

export interface RenderingOutput {
  _key: string;
  blobPathname: string;
  prompt: string;
  textResponse: string;
  isPromoted: boolean;
  generatedAt: string;
  status: "generating" | "complete" | "error";
  errorMessage?: string;
  modelId: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costEstimate: number;
  bytesStored: number;
}

export interface RenderingSession {
  _id: string;
  sessionTitle: string;
  project?: { _id: string; title: string } | null;
  aspectRatio: string;
  stylePreset?: string;
  description: string;
  status: "idle" | "generating" | "complete" | "error";
  lastError?: string;
  createdBy: string;
  createdAt: string;
  images: RenderingImage[];
  renderings: RenderingOutput[];
  conversation: ConversationEntry[];
}

export interface ConversationEntry {
  _key: string;
  role: "user" | "model";
  text: string;
  image?: string;
  timestamp: string;
}

export interface SessionListItem {
  _id: string;
  sessionTitle: string;
  project?: { _id: string; title: string } | null;
  status: string;
  createdAt: string;
  renderingCount: number;
}

export interface DesignOptionData {
  _id: string;
  blobPathname: string;
  caption: string;
  sortOrder: number;
  promotedAt: string;
  reactions: Reaction[];
}

export interface Reaction {
  _key: string;
  clientId: string;
  type: "favorite" | "comment";
  text?: string;
  createdAt: string;
}

export interface UsageData {
  sanityUserId: string;
  month: string;
  count: number;
  limit: number;
  remaining: number;
  bytesStored: number;
}

export interface WizardData {
  sessionTitle: string;
  projectId: string | null;
  aspectRatio: "16:9" | "1:1" | "4:3";
  stylePreset: string;
  images: WizardImage[];
  description: string;
}

export interface WizardImage {
  blobPathname: string;
  fileName: string;
  file?: File;        // Retained for retry; cleared after successful upload
  imageType: string;
  location: string;
  notes: string;
  copyExact: boolean;
  uploading: boolean;
  error?: string;
  localPreviewUrl?: string;  // Temporary object URL for instant preview; revoked after upload
}

export interface ProjectOption {
  _id: string;
  title: string;
}

// -- Tool state types --

export type ToolView = "sessions" | "design-options";
export type ActiveView = "list" | "wizard" | "session-detail";

export interface ToolState {
  activeTab: ToolView;
  activeView: ActiveView;
  activeSessionId: string | null;
  wizardData: WizardData;
}

export type ToolAction =
  | { type: "SET_TAB"; tab: ToolView }
  | { type: "OPEN_WIZARD" }
  | { type: "CLOSE_WIZARD" }
  | { type: "OPEN_SESSION"; sessionId: string }
  | { type: "BACK_TO_LIST" }
  | { type: "UPDATE_WIZARD"; data: Partial<WizardData> }
  | { type: "RESET_WIZARD" };

// -- API helper type --

// getStudioToken() is Studio-only -- admin pages pass studioToken as a prop from Astro instead.
// Admin islands receive the token as a string prop from the .astro shell
// (const studioToken = import.meta.env.STUDIO_API_SECRET) so the secret never ships
// in the client bundle via module-level evaluation.
export function getStudioToken(): string {
  return (import.meta as any).env?.SANITY_STUDIO_API_SECRET || "";
}

export function getStudioHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-studio-token": getStudioToken(),
  };
}

export function getImageServeUrl(blobPathname: string, source: "studio" | "portal" = "portal"): string {
  if (source === "studio") {
    const token = getStudioToken();
    return `/api/blob-serve?path=${encodeURIComponent(blobPathname)}&source=studio&token=${encodeURIComponent(token)}`;
  }
  return `/api/blob-serve?path=${encodeURIComponent(blobPathname)}`;
}

export const STYLE_PRESETS = [
  { value: "", label: "Select a style..." },
  { value: "Modern / Contemporary", label: "Modern / Contemporary" },
  { value: "Traditional / Classic", label: "Traditional / Classic" },
  { value: "Transitional", label: "Transitional" },
  { value: "Scandinavian / Minimalist", label: "Scandinavian / Minimalist" },
  { value: "Frank Lloyd Wright", label: "Frank Lloyd Wright" },
  { value: "__other__", label: "Other (custom)" },
] as const;

export const INITIAL_WIZARD_DATA: WizardData = {
  sessionTitle: "",
  projectId: null,
  aspectRatio: "16:9",
  stylePreset: "",
  images: [],
  description: "",
};

export function isWizardDirty(data: WizardData): boolean {
  return (
    data.sessionTitle !== "" ||
    data.projectId !== null ||
    data.aspectRatio !== "16:9" ||
    data.stylePreset !== "" ||
    data.images.length > 0 ||
    data.description !== ""
  );
}

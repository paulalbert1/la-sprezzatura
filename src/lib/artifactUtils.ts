import type { MilestoneNote } from "./milestoneUtils";

export type ArtifactVersion = {
  _key: string;
  file: {
    asset: {
      url: string;
      originalFilename: string;
      mimeType: string;
      size: number;
    };
  };
  uploadedAt: string;
  note?: string;
};

export type DecisionLogEntry = {
  _key: string;
  action:
    | "approved"
    | "changes-requested"
    | "note-added"
    | "version-uploaded"
    | "notification-sent"
    | "tier-selected";
  versionKey?: string;
  clientId?: string;
  clientName?: string;
  feedback?: string;
  timestamp: string;
};

// Phase 9: Investment Summary types
export type InvestmentLineItem = {
  _key: string;
  name: string;
  price: number; // integer cents
};

export type InvestmentTier = {
  _key: string;
  name: string;
  description?: string;
  lineItems: InvestmentLineItem[];
};

export type InvestmentSummary = {
  tiers: InvestmentTier[];
  selectedTierKey?: string;
  eagerness?: number;
  reservations?: string;
};

export type Artifact = {
  _key: string;
  artifactType: string;
  customTypeName?: string;
  currentVersionKey?: string;
  signedFile?: {
    asset?: {
      url: string;
      originalFilename?: string;
    };
  };
  versions: ArtifactVersion[];
  decisionLog: DecisionLogEntry[];
  notes: MilestoneNote[];
  notificationLog?: Array<{
    _key: string;
    sentAt: string;
    recipientEmail: string;
  }>;
  investmentSummary?: InvestmentSummary;
};

export const ARTIFACT_TYPES = [
  "proposal",
  "floor-plan",
  "design-board",
  "contract",
  "warranty",
  "close-document",
] as const;

export const ARTIFACT_LABELS: Record<string, string> = {
  proposal: "Proposal",
  "floor-plan": "Floor Plan",
  "design-board": "Design Concept",
  contract: "Contract",
  warranty: "Warranty",
  "close-document": "Close Document",
};

/**
 * Get a display label for an artifact type.
 * For known types, returns the mapped label.
 * For unknown types, returns the customName if provided, or title-cases the type.
 */
export function getArtifactLabel(type: string, customName?: string): string {
  if (customName) return customName;
  if (ARTIFACT_LABELS[type]) return ARTIFACT_LABELS[type];
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ");
}

/**
 * Get the current version of an artifact.
 * If currentVersionKey is set, returns the matching version.
 * Otherwise returns the last (most recent) version.
 */
export function getCurrentVersion(
  artifact: Artifact,
): ArtifactVersion | undefined {
  if (!artifact.versions || artifact.versions.length === 0) return undefined;

  if (artifact.currentVersionKey) {
    return artifact.versions.find(
      (v) => v._key === artifact.currentVersionKey,
    );
  }

  return artifact.versions[artifact.versions.length - 1];
}

/**
 * Check if a contract artifact has been signed (has a signed file uploaded).
 */
export function isContractSigned(artifact: Artifact): boolean {
  return Boolean(artifact.signedFile?.asset?.url);
}

const BADGE_STYLES: Record<string, string> = {
  contract: "bg-charcoal/10 text-charcoal",
  "close-document": "bg-emerald-50 text-emerald-700",
  warranty: "bg-stone-light/20 text-stone",
  proposal: "bg-terracotta/10 text-terracotta",
  "floor-plan": "bg-blue-50 text-blue-700",
  "design-board": "bg-amber-50 text-amber-700",
};

/**
 * Get Tailwind badge classes for an artifact type.
 */
export function getArtifactBadgeStyle(type: string): string {
  return BADGE_STYLES[type] || "bg-stone-light/20 text-stone";
}

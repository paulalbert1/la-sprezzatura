// src/emails/artifactReady/fixtures.ts
// Phase 48 -- typed fixture exports for ArtifactReady snapshot tests (D-01, D-12).
//
// D-08: NOTIFICATION (no token, no expiry, no link-fallback). Type does NOT
// have an expiresInSeconds field — the prop is intentionally absent.
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-01, D-08, D-09, D-12)
//   .planning/phases/48-smaller-transactional-emails/48-PATTERNS.md (artifactReady/fixtures.ts)

import type { TenantBrand } from "../../lib/email/tenantBrand";
import { LA_SPREZZATURA_TENANT } from "../../lib/email/tenantBrand";

export interface ArtifactReadyEmailInput {
  client: { name?: string; email: string };
  project: { _id: string; title: string };
  /** Resolved label per notify-artifact.ts:40-45 (customTypeName || titleCase(artifactType) || "document"). */
  artifactLabel: string;
  /** Static portal URL — no per-recipient token (D-08). */
  portalHref: string;
  preheader?: string;
  tenant?: TenantBrand;
}

export function baseInput(
  overrides: Partial<ArtifactReadyEmailInput> = {},
): ArtifactReadyEmailInput {
  return {
    client: { name: "Victoria Kimball", email: "victoria@kimball.com" },
    project: { _id: "P1", title: "Kimball Residence" },
    artifactLabel: "Mood Board",
    portalHref: "https://example.com/portal/dashboard",
    tenant: LA_SPREZZATURA_TENANT,
    ...overrides,
  };
}

export const FIXTURES = {
  default: () => baseInput(),
  customArtifactName: () =>
    baseInput({ artifactLabel: "Custom Vendor Spec Sheet" }),
};

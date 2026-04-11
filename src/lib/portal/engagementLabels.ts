// Shared engagement type labels used across portal surfaces.
// Phase 34 Plan 02 — consolidates previously duplicated definitions in
// src/components/portal/ProjectHeader.astro and src/pages/portal/dashboard.astro.
// The client dashboard route (Phase 34 Plan 06 /portal/client/[token].astro)
// imports from here so all three consumers render the same label set.

export const ENGAGEMENT_LABELS: Record<string, string> = {
  "full-interior-design": "Full Interior Design",
  "styling-refreshing": "Styling & Refreshing",
  "carpet-curating": "Carpet Curating",
};

export type EngagementType = keyof typeof ENGAGEMENT_LABELS;

// src/emails/_theme.ts
// Phase 45 -- react-email Tailwind config mirroring src/lib/brand-tokens.ts.
//
// D-06: emails do NOT reference CSS variables -- email clients (notably Outlook
// and most webmail) don't load CSS custom properties. Values are inlined here
// via direct import of the brandTokens literal.
//
// Pitfall 7 (RESEARCH.md): pixelBasedPreset MUST be present so Tailwind emits
// pixel units instead of rem. Outlook desktop ignores rem and balloons type.

import { pixelBasedPreset } from "@react-email/components";
import type { TailwindConfig } from "@react-email/tailwind";
import { brandTokens } from "../lib/brand-tokens";

export const emailTailwindConfig: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: brandTokens.colors,
      fontFamily: {
        heading: brandTokens.fonts.heading.split(",").map((s) => s.trim()),
        body: brandTokens.fonts.body.split(",").map((s) => s.trim()),
      },
      spacing: brandTokens.spacing,
    },
  },
};

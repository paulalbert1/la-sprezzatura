// src/lib/brand-tokens.ts
// Phase 45 -- single typed source of truth for brand tokens consumed by both
// Tailwind (via scripts/generate-theme-css.ts -> src/styles/_generated-theme.css)
// and react-email (via src/emails/_theme.ts mirror).
//
// Decisions: D-05 (TS source of truth), D-06 (email mirror, not CSS vars),
// D-07 (email-relevant subset only -- colors, font families, small spacing scale).
//
// Edit this file -> run `npm run theme:gen` -> commit the regenerated
// src/styles/_generated-theme.css. CI verifies the diff is empty.

// camelCase TS keys -- the generator emits kebab-case CSS var names
// ("creamDark" -> "--color-cream-dark", "sectionSm" -> "--spacing-section-sm").
// Animations, container widths, focus styles, and .luxury-input remain CSS-only
// per D-07 -- they are not portable to email and do not round-trip through TS.
export const brandTokens = {
  colors: {
    // Warm neutrals (mirror src/styles/global.css lines 4-14)
    cream: "#FAF8F5",
    creamDark: "#F5F0EB",
    stone: "#8A8478",
    stoneLight: "#B8B0A4",
    stoneDark: "#6B6358",
    charcoal: "#2C2926",
    charcoalLight: "#4A4540",
    terracotta: "#C4836A",
    terracottaLight: "#D4A08A",
    white: "#FFFFFF",
    // Luxury admin palette (mirror src/styles/global.css lines 17-29)
    ivory: "#FAF7F2",
    surface: "#FFFEFB",
    parchment: "#F3EDE3",
    borderWarm: "#E8DDD0",
    borderMid: "#D4C8B8",
    gold: "#9A7B4B",
    goldLight: "#F5EDD8",
    goldMid: "#E8D5A8",
    textDark: "#2C2520",
    textMid: "#6B5E52",
    textMuted: "#9E8E80",
    destructive: "#9B3A2A",
    destructiveSurface: "#FBEEE8",
  },
  fonts: {
    // Mirror src/styles/global.css lines 32-35; emails use heading + body only,
    // but include serif/sans aliases for parity with portal.
    heading: '"Cormorant Garamond", "Georgia", serif',
    body: '"DM Sans", "system-ui", sans-serif',
    serif: '"Cormorant Garamond", "Georgia", serif',
    sans: '"DM Sans", "system-ui", sans-serif',
  },
  spacing: {
    // Mirror src/styles/global.css lines 38-39; D-07 limits the scope to
    // spacing emails actually use. Other CSS variables stay CSS-only.
    section: "8rem",
    sectionSm: "5rem",
  },
} as const;

export type BrandTokens = typeof brandTokens;

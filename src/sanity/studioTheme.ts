/**
 * Custom Sanity Studio theme matching La Sprezzatura's front-end palette.
 *
 * Palette: cream backgrounds, charcoal text, terracotta accents.
 * Uses buildTheme from @sanity/ui/theme with custom color tokens.
 */

import { buildTheme } from "@sanity/ui/theme";

export const studioTheme = buildTheme({
  // Override the gray palette to use warm cream/stone tones
  palette: {
    black: { hex: "#2C2926" }, // charcoal
    white: { hex: "#FAF8F5" }, // cream

    // Gray → warm stone tones (cream-to-charcoal)
    gray: {
      50: { hex: "#FAF8F5" },   // cream
      100: { hex: "#F5F0EB" },  // cream-dark
      200: { hex: "#E8E2DA" },
      300: { hex: "#D4CCC2" },
      400: { hex: "#B8B0A4" },  // stone-light
      500: { hex: "#8A8478" },  // stone
      600: { hex: "#6B6358" },  // stone-dark
      700: { hex: "#4A4540" },  // charcoal-light
      800: { hex: "#2C2926" },  // charcoal
      900: { hex: "#1A1816" },
      950: { hex: "#0F0E0D" },
    },

    // Orange → terracotta tones (accent color)
    orange: {
      50: { hex: "#FDF5F0" },
      100: { hex: "#FAE8DE" },
      200: { hex: "#F0CDB8" },
      300: { hex: "#E5B192" },
      400: { hex: "#D4A08A" },  // terracotta-light
      500: { hex: "#C4836A" },  // terracotta
      600: { hex: "#A96B52" },
      700: { hex: "#8E5740" },
      800: { hex: "#724530" },
      900: { hex: "#553322" },
      950: { hex: "#3A2318" },
    },

    // Keep other hues close to defaults but warmer
    red: {
      50: { hex: "#FEF2F2" },
      100: { hex: "#FEE2E2" },
      200: { hex: "#FECACA" },
      300: { hex: "#FCA5A5" },
      400: { hex: "#F87171" },
      500: { hex: "#EF4444" },
      600: { hex: "#DC2626" },
      700: { hex: "#B91C1C" },
      800: { hex: "#991B1B" },
      900: { hex: "#7F1D1D" },
      950: { hex: "#450A0A" },
    },

    yellow: {
      50: { hex: "#FEFCE8" },
      100: { hex: "#FEF9C3" },
      200: { hex: "#FEF08A" },
      300: { hex: "#FDE047" },
      400: { hex: "#FACC15" },
      500: { hex: "#EAB308" },
      600: { hex: "#CA8A04" },
      700: { hex: "#A16207" },
      800: { hex: "#854D0E" },
      900: { hex: "#713F12" },
      950: { hex: "#422006" },
    },

    green: {
      50: { hex: "#F0FDF4" },
      100: { hex: "#DCFCE7" },
      200: { hex: "#BBF7D0" },
      300: { hex: "#86EFAC" },
      400: { hex: "#4ADE80" },
      500: { hex: "#22C55E" },
      600: { hex: "#16A34A" },
      700: { hex: "#15803D" },
      800: { hex: "#166534" },
      900: { hex: "#14532D" },
      950: { hex: "#052E16" },
    },

    cyan: {
      50: { hex: "#ECFEFF" },
      100: { hex: "#CFFAFE" },
      200: { hex: "#A5F3FC" },
      300: { hex: "#67E8F9" },
      400: { hex: "#22D3EE" },
      500: { hex: "#06B6D4" },
      600: { hex: "#0891B2" },
      700: { hex: "#0E7490" },
      800: { hex: "#155E75" },
      900: { hex: "#164E63" },
      950: { hex: "#083344" },
    },

    blue: {
      50: { hex: "#EFF6FF" },
      100: { hex: "#DBEAFE" },
      200: { hex: "#BFDBFE" },
      300: { hex: "#93C5FD" },
      400: { hex: "#60A5FA" },
      500: { hex: "#3B82F6" },
      600: { hex: "#2563EB" },
      700: { hex: "#1D4ED8" },
      800: { hex: "#1E40AF" },
      900: { hex: "#1E3A8A" },
      950: { hex: "#172554" },
    },

    purple: {
      50: { hex: "#FAF5FF" },
      100: { hex: "#F3E8FF" },
      200: { hex: "#E9D5FF" },
      300: { hex: "#D8B4FE" },
      400: { hex: "#C084FC" },
      500: { hex: "#A855F7" },
      600: { hex: "#9333EA" },
      700: { hex: "#7E22CE" },
      800: { hex: "#6B21A8" },
      900: { hex: "#581C87" },
      950: { hex: "#3B0764" },
    },

    magenta: {
      50: { hex: "#FDF2F8" },
      100: { hex: "#FCE7F3" },
      200: { hex: "#FBCFE8" },
      300: { hex: "#F9A8D4" },
      400: { hex: "#F472B6" },
      500: { hex: "#EC4899" },
      600: { hex: "#DB2777" },
      700: { hex: "#BE185D" },
      800: { hex: "#9D174D" },
      900: { hex: "#831843" },
      950: { hex: "#500724" },
    },
  },

  color: {
    base: {
      // Default card: cream background, charcoal text
      default: {
        _hue: "gray",
        bg: ["50", "950"],
        fg: ["800", "200"],
        border: ["300", "700"],
        focusRing: ["orange/500", "orange/400"],
        "muted/fg": ["500", "400"],
        "accent/fg": ["orange/600", "orange/400"],
        "link/fg": ["orange/600", "orange/400"],
        "code/bg": ["100", "900"],
        "code/fg": ["700", "300"],
        "skeleton/from": ["100", "900"],
        "skeleton/to": ["200", "800"],
      },
      // Primary tone: terracotta
      primary: {
        _hue: "orange",
      },
      // Positive tone: green
      positive: {
        _hue: "green",
      },
      // Caution tone: yellow/warm
      caution: {
        _hue: "yellow",
      },
      // Critical/danger: red
      critical: {
        _hue: "red",
      },
    },
  },
});

/**
 * Custom Sanity Studio theme — La Sprezzatura.
 *
 * Interior Design palette: warm gray primary, amber/gold accent,
 * warm off-white background, slate text.
 * Source: UI/UX Pro Max "Home Decoration & Interior Design" palette.
 */

import { buildTheme } from "@sanity/ui/theme";

export const studioTheme = buildTheme({
  palette: {
    black: { hex: "#0F172A" },
    white: { hex: "#FAF5F2" },

    // Gray → warm stone tones
    gray: {
      50: { hex: "#FAF5F2" },
      100: { hex: "#F6F6F6" },
      200: { hex: "#EEEDED" },
      300: { hex: "#D6D3D1" },
      400: { hex: "#A8A29E" },
      500: { hex: "#78716C" },
      600: { hex: "#57534E" },
      700: { hex: "#44403C" },
      800: { hex: "#292524" },
      900: { hex: "#1C1917" },
      950: { hex: "#0F172A" },
    },

    // Orange → amber/gold accent
    orange: {
      50: { hex: "#FFFBEB" },
      100: { hex: "#FEF3C7" },
      200: { hex: "#FDE68A" },
      300: { hex: "#FCD34D" },
      400: { hex: "#FBBF24" },
      500: { hex: "#D97706" },
      600: { hex: "#B45309" },
      700: { hex: "#92400E" },
      800: { hex: "#78350F" },
      900: { hex: "#451A03" },
      950: { hex: "#2A1005" },
    },

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
});

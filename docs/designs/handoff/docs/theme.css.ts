// docs/theme.css.ts
//
// Ready-to-paste vanilla-extract theme for vallista-land v2.
// Drop into src/styles/theme.css.ts and import from layouts.
//
// Source of truth: docs/tokens.json. Keep them in sync — if you add a
// token here, add it there too, and update 02-tokens.md.

import { createGlobalTheme, createThemeContract, createTheme } from "@vanilla-extract/css";

// ── Core scale ──────────────────────────────────────────────
//   Raw values. Do not reference these from components; use
//   `vars` (semantic) instead.

export const gray = {
  50:  "#fafbfc",
  100: "#f1f2f6",
  200: "#e6e8ee",
  300: "#d2d6df",
  400: "#9aa1b4",
  500: "#6b7389",
  600: "#3a4255",
  700: "#252c3d",
  800: "#131a2b",
  900: "#0b1220",
};

export const blue  = { 50: "#eff4ff", 500: "#2b6cff", 600: "#1f56d6" };
export const green = { 50: "#e8f6ee", 700: "#2a7f3f" };
export const amber = { 50: "#fff7ed", 700: "#8a6628" };
export const red   = { 50: "#fef2f2", 700: "#b91c1c" };

// ── Semantic contract ───────────────────────────────────────
//   Components consume only these. Light/dark themes implement them.

export const vars = createThemeContract({
  color: {
    bg:          "",
    bgSoft:      "",
    bgOverlay:   "",
    ink:         "",
    ink2:        "",
    ink3:        "",
    ink4:        "",
    line:        "",
    line2:       "",
    accent:      "",
    accentHover: "",
    accentTint:  "",
  },
  focusRing: "",
  radius: { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "", pill: "" },
  space: {
    1: "", 2: "", 3: "", 4: "", 5: "", 6: "",
    8: "", 10: "", 12: "", 16: "", 20: "",
  },
  elevation: { 0: "", 1: "", 2: "", 3: "", 4: "" },
  duration: { fast: "", base: "", slow: "" },
  easing:   { out: "", in: "", inout: "", spring: "" },
  zIndex:   { nav: "", tocRail: "", scrim: "", modal: "", tooltip: "", toast: "" },
  font: { sans: "", mono: "" },
});

// ── Light theme (default) ───────────────────────────────────

export const lightTheme = createTheme(vars, {
  color: {
    bg:          "#ffffff",
    bgSoft:      gray[50],
    bgOverlay:   "rgba(11, 18, 32, 0.35)",
    ink:         gray[900],
    ink2:        gray[600],
    ink3:        gray[500],
    ink4:        gray[400],
    line:        gray[200],
    line2:       gray[100],
    accent:      blue[500],
    accentHover: blue[600],
    accentTint:  blue[50],
  },
  focusRing: "0 0 0 2px #ffffff, 0 0 0 4px rgba(43,108,255,0.55)",
  radius: { 1: "4px", 2: "6px", 3: "8px", 4: "10px", 5: "12px", 6: "14px", pill: "999px" },
  space: {
    1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px",
    8: "32px", 10: "40px", 12: "48px", 16: "64px", 20: "80px",
  },
  elevation: {
    0: "none",
    1: "0 1px 0 rgba(11, 18, 32, 0.04)",
    2: "0 2px 6px rgba(11, 18, 32, 0.06)",
    3: "0 12px 32px rgba(11, 18, 32, 0.10)",
    4: "0 24px 60px rgba(11, 18, 32, 0.20), 0 2px 6px rgba(11, 18, 32, 0.06)",
  },
  duration: { fast: "120ms", base: "180ms", slow: "320ms" },
  easing: {
    out:    "cubic-bezier(0.2, 0.7, 0.3, 1)",
    in:     "cubic-bezier(0.4, 0, 1, 1)",
    inout:  "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  zIndex: {
    nav: "10", tocRail: "20", scrim: "900",
    modal: "1000", tooltip: "1100", toast: "1200",
  },
  font: {
    sans: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
  },
});

// ── Dark theme ──────────────────────────────────────────────
//   Apply this class on <html> when the active theme is dark.
//   BaseLayout toggles it from localStorage + prefers-color-scheme.

export const darkTheme = createTheme(vars, {
  color: {
    bg:          gray[900],
    bgSoft:      gray[800],
    bgOverlay:   "rgba(0, 0, 0, 0.6)",
    ink:         "#ffffff",
    ink2:        "#dbe2ff",
    ink3:        gray[400],
    ink4:        gray[500],
    line:        "#1c2540",
    line2:       "#131c33",
    accent:      blue[500],
    accentHover: blue[600],
    accentTint:  "rgba(43, 108, 255, 0.18)",
  },
  focusRing: "0 0 0 2px #0b1220, 0 0 0 4px rgba(43,108,255,0.65)",
  radius: { 1: "4px", 2: "6px", 3: "8px", 4: "10px", 5: "12px", 6: "14px", pill: "999px" },
  space: {
    1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px",
    8: "32px", 10: "40px", 12: "48px", 16: "64px", 20: "80px",
  },
  elevation: {
    0: "none",
    1: "0 1px 0 rgba(0, 0, 0, 0.20)",
    2: "0 2px 6px rgba(0, 0, 0, 0.30)",
    3: "0 12px 32px rgba(0, 0, 0, 0.45)",
    4: "0 24px 60px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0, 0, 0, 0.30)",
  },
  duration: { fast: "120ms", base: "180ms", slow: "320ms" },
  easing: {
    out:    "cubic-bezier(0.2, 0.7, 0.3, 1)",
    in:     "cubic-bezier(0.4, 0, 1, 1)",
    inout:  "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  zIndex: {
    nav: "10", tocRail: "20", scrim: "900",
    modal: "1000", tooltip: "1100", toast: "1200",
  },
  font: {
    sans: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
  },
});

// ── Root defaults (applied via createGlobalTheme on :root) ──
//   These are the actual DOM-level vars. lightTheme is applied by default;
//   darkTheme is applied conditionally by BaseLayout.

createGlobalTheme(":root", vars, lightTheme as any);

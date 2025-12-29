/**
 * Color tokens for the design system
 * These are the base color values used throughout the design system
 */

// Primary colors - CSS 변수 사용
export const PRIMARY_COLORS = {
  WHITE: 'var(--primary-background, #ffffff)',
  BLACK: 'var(--primary-foreground, #000000)',
  GRAY_50: 'var(--primary-accent-1, #fafafa)',
  GRAY_100: 'var(--primary-accent-2, #eaeaea)',
  GRAY_300: 'var(--primary-accent-3, #999999)',
  GRAY_400: 'var(--primary-accent-4, #888888)',
  GRAY_500: 'var(--primary-accent-5, #666666)',
  GRAY_600: 'var(--primary-accent-4, #444444)',
  GRAY_700: 'var(--primary-accent-3, #333333)',
  GRAY_800: 'var(--primary-accent-2, #111111)'
} as const

// Success colors
export const SUCCESS_COLORS = {
  DEFAULT: 'var(--success-default, #0070f3)',
  LIGHT: '#3291ff',
  DARK: '#0761d1',
  LIGHTER: '#d3e5ff'
} as const

// Error colors
export const ERROR_COLORS = {
  DEFAULT: 'var(--error-default, #e00)',
  LIGHT: '#ff1a1a',
  DARK: '#c50000',
  LIGHTER: '#f7d4d6'
} as const

// Warning colors
export const WARNING_COLORS = {
  DEFAULT: 'var(--warning-default, #f5a623)',
  LIGHT: '#f7b955',
  DARK: '#f49b0b',
  LIGHTER: '#ffefcf'
} as const

// Highlight colors
export const HIGHLIGHT_COLORS = {
  PINK: '#ff0080',
  PURPLE: '#7928ca',
  BLUE: '#0070f3',
  CYAN: '#50e3c2',
  GREEN: '#f81ce5',
  RED: '#ff0000',
  ORANGE: '#f5a623',
  YELLOW: '#f5a623'
} as const

// Violet colors
export const VIOLET_COLORS = {
  DEFAULT: '#7928ca',
  LIGHT: '#8a63d2',
  DARK: '#4c2889',
  LIGHTER: '#d8ccf1'
} as const

// Cyan colors
export const CYAN_COLORS = {
  DEFAULT: '#50e3c2',
  LIGHT: '#79ffe1',
  DARK: '#29bc9b',
  LIGHTER: '#aaffec'
} as const

// Shadow colors
export const SHADOW_COLORS = {
  BLACK_05: 'rgba(0, 0, 0, 0.05)',
  BLACK_06: 'rgba(0, 0, 0, 0.06)',
  BLACK_1: 'rgba(0, 0, 0, 0.1)',
  BLACK_12: 'rgba(0, 0, 0, 0.12)',
  BLACK_25: 'rgba(0, 0, 0, 0.25)',
  WHITE_70: 'hsla(0, 0%, 100%, 0.7)',
  WHITE_80: 'hsla(0, 0%, 100%, 0.8)'
} as const

// Transparent colors
export const TRANSPARENT_COLORS = {
  BLACK_0: 'rgba(0, 0, 0, 0)'
} as const

// Export all color tokens
export const COLOR_TOKENS = {
  PRIMARY: PRIMARY_COLORS,
  SUCCESS: SUCCESS_COLORS,
  ERROR: ERROR_COLORS,
  WARNING: WARNING_COLORS,
  HIGHLIGHT: HIGHLIGHT_COLORS,
  VIOLET: VIOLET_COLORS,
  CYAN: CYAN_COLORS,
  SHADOW: SHADOW_COLORS,
  TRANSPARENT: TRANSPARENT_COLORS
} as const

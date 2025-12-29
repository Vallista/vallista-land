import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base text styles
const textBase = style({
  margin: 0,
  padding: 0,
  boxSizing: 'border-box'
})

// Font size variants
const textSize = styleVariants({
  10: { fontSize: '10px' },
  12: { fontSize: '12px' },
  14: { fontSize: '14px' },
  16: { fontSize: '16px' },
  18: { fontSize: '18px' },
  20: { fontSize: '20px' },
  24: { fontSize: '24px' },
  32: { fontSize: '32px' },
  40: { fontSize: '40px' },
  48: { fontSize: '48px' },
  56: { fontSize: '56px' }
})

// Line height variants
const textLineHeight = styleVariants({
  12: { lineHeight: '12px' },
  16: { lineHeight: '16px' },
  20: { lineHeight: '20px' },
  24: { lineHeight: '24px' },
  32: { lineHeight: '32px' },
  40: { lineHeight: '40px' },
  48: { lineHeight: '48px' },
  56: { lineHeight: '56px' }
})

// Font weight variants
const textWeight = styleVariants({
  100: { fontWeight: 100 },
  200: { fontWeight: 200 },
  300: { fontWeight: 300 },
  400: { fontWeight: 400 },
  500: { fontWeight: 500 },
  600: { fontWeight: 600 },
  700: { fontWeight: 700 },
  800: { fontWeight: 800 },
  900: { fontWeight: 900 }
})

// Text transform variants
const textTransform = styleVariants({
  capitalize: { textTransform: 'capitalize' },
  uppercase: { textTransform: 'uppercase' },
  lowercase: { textTransform: 'lowercase' },
  none: { textTransform: 'none' }
})

// Text align variants
const textAlign = styleVariants({
  center: { textAlign: 'center' },
  left: { textAlign: 'left' },
  right: { textAlign: 'right' },
  justify: { textAlign: 'justify' }
})

// Color variants - CSS 변수 사용
const textColor = styleVariants({
  primary: { color: 'var(--primary-foreground)' },
  secondary: { color: 'var(--primary-accent-5)' },
  success: { color: 'var(--success-default)' },
  error: { color: 'var(--error-default)' },
  warning: { color: 'var(--warning-default)' },
  white: { color: 'var(--primary-background)' }
})

export const text = recipe({
  base: textBase,
  variants: {
    size: textSize,
    lineHeight: textLineHeight,
    weight: textWeight,
    transform: textTransform,
    align: textAlign,
    color: textColor
  },
  defaultVariants: {
    size: 16,
    lineHeight: 24,
    weight: 400,
    align: 'left',
    color: 'primary'
  }
})

export type TextVariants = RecipeVariants<typeof text>

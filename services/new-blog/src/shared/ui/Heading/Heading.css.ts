import { vars } from '@vallista/design-system'
import { style, styleVariants } from '@vanilla-extract/css'

export const heading = style({
  margin: 0,
  padding: 0,
  lineHeight: 1.2
})

export const size = styleVariants({
  xs: { fontSize: vars.fontSizes.xs },
  sm: { fontSize: vars.fontSizes.sm },
  md: { fontSize: vars.fontSizes.base },
  lg: { fontSize: vars.fontSizes.lg },
  xl: { fontSize: vars.fontSizes.xl },
  '2xl': { fontSize: vars.fontSizes['2xl'] },
  '3xl': { fontSize: vars.fontSizes['3xl'] },
  '4xl': { fontSize: vars.fontSizes['4xl'] }
})

export const weight = styleVariants({
  normal: { fontWeight: vars.fontWeights.normal },
  medium: { fontWeight: vars.fontWeights.medium },
  semibold: { fontWeight: vars.fontWeights.semibold },
  bold: { fontWeight: vars.fontWeights.bold }
})

export const color = styleVariants({
  primary: { color: vars.colors.primary },
  text: { color: vars.colors.text }
})

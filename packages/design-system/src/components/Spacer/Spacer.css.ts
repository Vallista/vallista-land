import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base spacer styles
const spacerBase = style({
  display: 'inline-block',
  width: '1px',
  height: '1px'
})

// Inline spacer styles
const spacerInline = style({
  display: 'inline-block'
})

// Block spacer styles
const spacerBlock = style({
  display: 'block'
})

// Size variants
const spacerSize = styleVariants({
  0: { width: '0px', height: '0px' },
  1: { width: '4px', height: '4px' },
  2: { width: '8px', height: '8px' },
  3: { width: '12px', height: '12px' },
  4: { width: '16px', height: '16px' },
  5: { width: '20px', height: '20px' },
  6: { width: '24px', height: '24px' },
  7: { width: '28px', height: '28px' },
  8: { width: '32px', height: '32px' },
  9: { width: '36px', height: '36px' },
  10: { width: '40px', height: '40px' },
  11: { width: '44px', height: '44px' },
  12: { width: '48px', height: '48px' },
  13: { width: '52px', height: '52px' },
  14: { width: '56px', height: '56px' },
  15: { width: '60px', height: '60px' },
  16: { width: '64px', height: '64px' },
  17: { width: '68px', height: '68px' },
  18: { width: '72px', height: '72px' },
  19: { width: '76px', height: '76px' },
  20: { width: '80px', height: '80px' }
})

export const spacer = recipe({
  base: spacerBase,
  variants: {
    size: spacerSize,
    inline: {
      true: spacerInline,
      false: spacerBlock
    }
  },
  defaultVariants: {
    size: 1,
    inline: false
  }
})

export type SpacerVariants = RecipeVariants<typeof spacer>

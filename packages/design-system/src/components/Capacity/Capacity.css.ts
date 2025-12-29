import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base capacity styles
const capacityBase = style({
  display: 'inline-block',
  position: 'relative',
  width: '100%',
  height: '8px',
  backgroundColor: 'var(--primary-accent-1)',
  borderRadius: '4px',
  overflow: 'hidden'
})

// Capacity progress styles
export const capacityProgress = style({
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.3s ease'
})

// Capacity progress color variants
export const capacityProgressColor = styleVariants({
  primary: {
    backgroundColor: 'var(--primary-foreground)'
  },
  success: {
    backgroundColor: 'var(--success-default)'
  },
  warning: {
    backgroundColor: 'var(--warning-default)'
  },
  error: {
    backgroundColor: 'var(--error-default)'
  }
})

// Capacity width variants
const capacityWidth = styleVariants({
  50: { width: '50px' },
  100: { width: '100px' },
  150: { width: '150px' },
  200: { width: '200px' },
  250: { width: '250px' },
  300: { width: '300px' }
})

export const capacity = recipe({
  base: capacityBase,
  variants: {
    width: capacityWidth
  },
  defaultVariants: {
    width: 100
  }
})

export type CapacityVariants = RecipeVariants<typeof capacity>

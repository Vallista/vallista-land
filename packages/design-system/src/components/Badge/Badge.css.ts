import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base badge styles
const badgeBase = style({
  display: 'inline-block',
  verticalAlign: 'middle',
  borderRadius: '16px',
  fontWeight: 500,
  lineHeight: 1,
  cursor: 'inherit',
  fontFeatureSettings: 'tnum',
  fontVariant: 'tabular-nums',
  textTransform: 'capitalize',
  whiteSpace: 'nowrap'
})

// Size variants
const badgeSize = styleVariants({
  small: {
    padding: '3px 7px',
    fontSize: '0.625rem'
  },
  normal: {
    padding: '2px 7px',
    fontSize: '0.875rem'
  },
  large: {
    padding: '3px 10px',
    fontSize: '1rem'
  }
})

// Type variants
const badgeType = styleVariants({
  primary: {
    background: 'var(--primary-accent-1)',
    border: '1px solid var(--primary-accent-3)',
    color: 'var(--primary-foreground)'
  },
  secondary: {
    background: 'var(--primary-accent-5)',
    border: '1px solid var(--primary-accent-5)',
    color: 'var(--primary-background)'
  },
  success: {
    background: 'var(--success-default)',
    border: '1px solid var(--success-default)',
    color: 'var(--primary-background)'
  },
  error: {
    background: 'var(--error-default)',
    border: '1px solid var(--error-default)',
    color: 'var(--primary-background)'
  },
  warning: {
    background: 'var(--warning-default)',
    border: '1px solid var(--warning-default)',
    color: 'var(--primary-background)'
  },
  violet: {
    background: 'var(--primary-accent-5)',
    border: '1px solid var(--primary-accent-5)',
    color: 'var(--primary-background)'
  }
})

// Outline variants
const badgeOutline = styleVariants({
  primary: {
    background: 'var(--primary-background)',
    border: '1px solid var(--primary-foreground)',
    color: 'var(--primary-foreground)'
  },
  secondary: {
    background: 'var(--primary-background)',
    border: '1px solid var(--primary-accent-5)',
    color: 'var(--primary-foreground)'
  },
  success: {
    background: 'var(--primary-background)',
    border: '1px solid var(--success-default)',
    color: 'var(--primary-foreground)'
  },
  error: {
    background: 'var(--primary-background)',
    border: '1px solid var(--error-default)',
    color: 'var(--primary-foreground)'
  },
  warning: {
    background: 'var(--primary-background)',
    border: '1px solid var(--warning-default)',
    color: 'var(--primary-foreground)'
  },
  violet: {
    background: 'var(--primary-background)',
    border: '1px solid var(--primary-accent-5)',
    color: 'var(--primary-foreground)'
  }
})

// Contrast variants
const badgeContrast = styleVariants({
  primary: {
    background: 'var(--primary-foreground)',
    border: '1px solid var(--primary-foreground)',
    color: 'var(--primary-background)'
  },
  secondary: {
    background: 'var(--primary-accent-1)',
    border: '1px solid var(--primary-accent-3)',
    color: 'var(--primary-foreground)'
  },
  success: {
    background: 'var(--success-default)',
    border: '1px solid var(--success-default)',
    color: 'var(--primary-background)'
  },
  error: {
    background: 'var(--error-default)',
    border: '1px solid var(--error-default)',
    color: 'var(--primary-background)'
  },
  warning: {
    background: 'var(--warning-default)',
    border: '1px solid var(--warning-default)',
    color: 'var(--primary-background)'
  },
  violet: {
    background: 'var(--primary-accent-5)',
    border: '1px solid var(--primary-accent-5)',
    color: 'var(--primary-background)'
  }
})

export const badge = recipe({
  base: badgeBase,
  variants: {
    size: badgeSize,
    type: badgeType,
    outline: badgeOutline,
    contrast: badgeContrast
  },
  defaultVariants: {
    size: 'normal',
    type: 'primary'
  }
})

export type BadgeVariants = RecipeVariants<typeof badge>

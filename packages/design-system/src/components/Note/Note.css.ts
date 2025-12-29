import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base note styles
const noteBase = style({
  display: 'flex',
  alignItems: 'center',
  borderRadius: '5px',
  lineHeight: '24px',
  fontSize: '0.875rem',
  wordBreak: 'break-word',
  boxSizing: 'border-box'
})

// Size variants
const noteSize = styleVariants({
  small: {
    padding: '3px 12px',
    minHeight: '32px'
  },
  medium: {
    padding: '7px 12px',
    minHeight: '40px'
  },
  large: {
    padding: '11px 12px',
    minHeight: '48px',
    fontSize: '16px'
  }
})

// Type variants (primary)
const noteTypePrimary = styleVariants({
  primary: {
    background: 'var(--primary-background)',
    border: '1px solid var(--primary-accent-1)',
    color: 'var(--primary-foreground)'
  },
  secondary: {
    background: 'var(--primary-background)',
    border: '1px solid var(--primary-accent-5)',
    color: 'var(--primary-accent-5)'
  },
  success: {
    background: 'var(--primary-background)',
    border: '1px solid var(--success-default)',
    color: 'var(--success-default)'
  },
  error: {
    background: 'var(--primary-background)',
    border: '1px solid var(--error-default)',
    color: 'var(--error-default)'
  },
  warning: {
    background: 'var(--primary-background)',
    border: '1px solid var(--warning-default)',
    color: 'var(--warning-default)'
  }
})

// Fill variants
const noteTypeFill = styleVariants({
  primary: {
    background: 'var(--primary-foreground)',
    border: '1px solid var(--primary-accent-1)',
    color: 'var(--primary-background)'
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
  }
})

// Contrast variants
const noteTypeContrast = styleVariants({
  primary: {
    background: 'var(--primary-foreground)',
    border: '1px solid var(--primary-accent-1)',
    color: 'var(--primary-background)'
  },
  secondary: {
    background: 'var(--primary-accent-1)',
    border: '1px solid var(--primary-accent-5)',
    color: 'var(--primary-accent-3)'
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
  }
})

export const note = recipe({
  base: noteBase,
  variants: {
    size: noteSize,
    type: noteTypePrimary,
    fill: noteTypeFill,
    contrast: noteTypeContrast
  },
  defaultVariants: {
    size: 'medium',
    type: 'primary'
  }
})

export type NoteVariants = RecipeVariants<typeof note>

export const noteText = style({
  fontWeight: 600
})

export const noteContent = style({
  marginLeft: 'auto',
  paddingLeft: '0.75rem'
})

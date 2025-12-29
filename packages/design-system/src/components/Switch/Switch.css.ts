import { style } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base switch container styles
const switchContainerBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  position: 'relative',
  outline: 'none',
  ':focus': {
    outline: 'none'
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  }
})

// Base switch track styles
const switchTrackBase = style({
  position: 'relative',
  display: 'inline-block',
  backgroundColor: 'var(--primary-background)',
  border: '1px solid var(--primary-accent-3)',
  borderRadius: '50px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
  outline: 'none',
  ':focus': {
    outline: 'none'
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  }
})

// Switch track active state
const switchTrackActive = style({
  backgroundColor: 'var(--primary-foreground)',
  borderColor: 'var(--primary-foreground)'
})

// Switch track disabled state
const switchTrackDisabled = style({
  backgroundColor: 'var(--primary-background)',
  borderColor: 'var(--primary-accent-2)',
  cursor: 'not-allowed'
})

// Base switch thumb styles
const switchThumbBase = style({
  position: 'absolute',
  backgroundColor: 'var(--primary-background)',
  borderRadius: '50%',
  transition: 'transform 0.2s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  outline: 'none',
  ':focus': {
    outline: 'none'
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  }
})

// Switch thumb disabled state
const switchThumbDisabled = style({
  backgroundColor: 'var(--primary-accent-2)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
})

// Switch label styles
export const switchLabel = style({
  marginLeft: '8px',
  fontSize: '14px',
  color: 'var(--primary-foreground)',
  cursor: 'pointer',
  userSelect: 'none',
  outline: 'none',
  ':focus': {
    outline: 'none'
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  }
})

export const switchContainer = recipe({
  base: switchContainerBase
})

export const switchTrack = recipe({
  base: switchTrackBase,
  variants: {
    size: {
      small: { width: '32px', height: '20px' },
      medium: { width: '44px', height: '24px' },
      large: { width: '56px', height: '28px' }
    },
    active: {
      true: switchTrackActive,
      false: {}
    },
    disabled: {
      true: switchTrackDisabled,
      false: {}
    }
  },
  defaultVariants: {
    size: 'medium',
    active: false,
    disabled: false
  }
})

export const switchThumb = recipe({
  base: switchThumbBase,
  variants: {
    size: {
      small: { width: '16px', height: '16px', top: '1px', left: '2px' },
      medium: { width: '20px', height: '20px', top: '1px', left: '2px' },
      large: { width: '24px', height: '24px', top: '1px', left: '2px' }
    },
    active: {
      true: { transform: 'translateX(calc(100% - 100%))' },
      false: { transform: 'translateX(0)' }
    },
    disabled: {
      true: switchThumbDisabled,
      false: {}
    }
  },
  compoundVariants: [
    {
      variants: { size: 'small', active: true },
      style: { transform: 'translateX(12px)' }
    },
    {
      variants: { size: 'medium', active: true },
      style: { transform: 'translateX(20px)' }
    },
    {
      variants: { size: 'large', active: true },
      style: { transform: 'translateX(28px)' }
    }
  ],
  defaultVariants: {
    size: 'medium',
    active: false,
    disabled: false
  }
})

export type SwitchContainerVariants = RecipeVariants<typeof switchContainer>
export type SwitchTrackVariants = RecipeVariants<typeof switchTrack>
export type SwitchThumbVariants = RecipeVariants<typeof switchThumb>

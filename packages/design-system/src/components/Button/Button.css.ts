import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

const buttonBase = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition:
    'border-color 0.15s ease, background 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
  maxWidth: '100%',
  padding: '0 12px',
  cursor: 'pointer',
  border: '1px solid transparent',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  textDecoration: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  outline: 'none',
  ':focus': {
    outline: 'none'
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  },
  ':disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
    transform: 'none !important',
    boxShadow: 'none !important'
  }
})

const buttonSize = styleVariants({
  small: {
    height: '32px',
    fontSize: '0.875rem'
  },
  medium: {
    height: '40px',
    fontSize: '1rem'
  },
  large: {
    height: '48px',
    fontSize: '1.125rem'
  }
})

const buttonShape = styleVariants({
  square: {
    borderRadius: '5px'
  },
  circle: {
    borderRadius: '100%'
  }
})

const buttonVariant = styleVariants({
  default: {},
  ghost: {
    backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))'
  },
  shadow: {
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  }
})

const buttonColor = styleVariants({
  primary: {
    color: 'var(--primary-background)',
    backgroundColor: 'var(--primary-foreground)',
    borderColor: 'var(--primary-foreground)',
    selectors: {
      '&:hover:not(:disabled)': {
        color: 'var(--primary-foreground)',
        backgroundColor: 'var(--primary-background)',
        borderColor: 'var(--primary-foreground)'
      },
      '&:active:not(:disabled)': {
        color: 'var(--primary-foreground)',
        backgroundColor: 'var(--primary-accent-2)',
        borderColor: 'var(--primary-foreground)'
      }
    }
  },
  secondary: {
    color: 'var(--primary-foreground)',
    backgroundColor: 'var(--primary-background)',
    borderColor: 'var(--primary-accent-3)',
    selectors: {
      '&:hover:not(:disabled)': {
        color: 'var(--primary-background)',
        backgroundColor: 'var(--primary-foreground)',
        borderColor: 'var(--primary-foreground)'
      },
      '&:active:not(:disabled)': {
        color: 'var(--primary-background)',
        backgroundColor: 'var(--primary-accent-2)',
        borderColor: 'var(--primary-foreground)'
      }
    }
  },
  success: {
    color: 'var(--primary-background)',
    backgroundColor: 'var(--success-default)',
    borderColor: 'var(--success-default)',
    selectors: {
      '&:hover:not(:disabled)': {
        color: 'var(--success-default)',
        backgroundColor: 'var(--primary-background)',
        borderColor: 'var(--success-default)'
      },
      '&:active:not(:disabled)': {
        color: 'var(--success-default)',
        backgroundColor: 'var(--primary-accent-2)',
        borderColor: 'var(--success-default)'
      }
    }
  },
  error: {
    color: 'var(--primary-background)',
    backgroundColor: 'var(--error-default)',
    borderColor: 'var(--error-default)',
    selectors: {
      '&:hover:not(:disabled)': {
        color: 'var(--error-default)',
        backgroundColor: 'var(--primary-background)',
        borderColor: 'var(--error-default)'
      },
      '&:active:not(:disabled)': {
        color: 'var(--error-default)',
        backgroundColor: 'var(--primary-accent-2)',
        borderColor: 'var(--error-default)'
      }
    }
  }
})

const buttonBlock = style({
  width: '100%'
})

const buttonShadow = style({
  selectors: {
    '&:hover:not(:disabled)': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    '&:active:not(:disabled)': {
      transform: 'none',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }
  }
})

const buttonGhost = style({
  border: '1px solid transparent',
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))',
      border: '1px solid transparent'
    },
    '&:active:not(:disabled)': {
      backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7))',
      border: '1px solid transparent'
    }
  }
})

export const button = recipe({
  base: buttonBase,
  variants: {
    size: buttonSize,
    shape: buttonShape,
    variant: buttonVariant,
    color: buttonColor,
    block: {
      true: buttonBlock
    }
  },
  compoundVariants: [
    {
      variants: { variant: 'shadow' },
      style: buttonShadow
    },
    {
      variants: { variant: 'ghost' },
      style: buttonGhost
    }
  ],
  defaultVariants: {
    size: 'medium',
    shape: 'square',
    variant: 'default',
    color: 'primary'
  }
})

export const buttonContent = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%'
})

export const buttonIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
})

export const buttonText = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

export type ButtonVariants = RecipeVariants<typeof button>

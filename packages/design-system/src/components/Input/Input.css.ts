import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base input container styles
const inputContainerBase = style({
  position: 'relative',
  display: 'inline-block',
  width: '100%',
  boxSizing: 'border-box'
})

// Input box styles
const inputBoxBase = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--primary-accent-1)',
  borderRadius: '5px',
  background: 'var(--primary-background)',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  ':focus-within': {
    borderColor: 'var(--primary-accent-5)',
    boxShadow: '0 0 0 2px var(--primary-accent-5)20'
  }
})

// Input inner base styles
const inputInnerBase = style({
  font: 'inherit',
  fontSize: '100%',
  width: '100%',
  minWidth: 0,
  display: 'inline-flex',
  WebkitAppearance: 'none',
  border: 'none',
  borderRadius: '0',
  padding: '0 12px',
  background: 'transparent',
  color: 'var(--primary-foreground)',
  lineHeight: 'normal',
  order: 1,
  outline: 'none',
  transition: 'all 0.15s ease',
  fontFamily: 'inherit',
  ':focus': {
    outline: 'none'
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  },
  selectors: {
    '&::placeholder': {
      color: 'var(--primary-accent-5)',
      opacity: 1,
      fontSize: '14px'
    },
    '&[aria-invalid="true"]': {
      color: 'var(--error-default)'
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.6
    }
  }
})

// Input inner size variants
const inputInnerSize = styleVariants({
  small: {
    height: '28px'
  },
  medium: {
    height: '40px'
  },
  large: {
    height: '48px'
  }
})

export const inputInner = recipe({
  base: inputInnerBase,
  variants: {
    size: inputInnerSize
  },
  defaultVariants: {
    size: 'medium'
  }
})

// Input side styles
const inputSideBase = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--primary-accent-5)',
  fontSize: '14px',
  fontWeight: 500,
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

// Input side size variants
const inputSideSize = styleVariants({
  small: {
    width: '28px',
    height: '28px'
  },
  medium: {
    width: '40px',
    height: '40px'
  },
  large: {
    width: '48px',
    height: '48px'
  }
})

// Input side position variants
const inputSidePosition = styleVariants({
  prefix: {
    order: 0,
    borderTopLeftRadius: '5px',
    borderBottomLeftRadius: '5px'
  },
  suffix: {
    order: 2,
    borderTopRightRadius: '5px',
    borderBottomRightRadius: '5px'
  }
})

// Input side styling variants
const inputSideStyling = styleVariants({
  styled: {
    backgroundColor: 'var(--primary-accent-1)'
  },
  unstyled: {}
})

export const inputSide = recipe({
  base: inputSideBase,
  variants: {
    size: inputSideSize,
    position: inputSidePosition,
    styling: inputSideStyling
  },
  defaultVariants: {
    size: 'medium',
    position: 'prefix',
    styling: 'styled'
  }
})

export const inputContainer = recipe({
  base: inputContainerBase
})

export const inputBox = recipe({
  base: inputBoxBase
})

export type InputSideVariants = RecipeVariants<typeof inputSide>
export type InputContainerVariants = RecipeVariants<typeof inputContainer>
export type InputBoxVariants = RecipeVariants<typeof inputBox>

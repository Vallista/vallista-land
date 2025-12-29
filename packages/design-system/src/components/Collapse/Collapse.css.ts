import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base collapse wrapper styles
const collapseWrapperBase = style({
  width: '100%',
  boxSizing: 'border-box'
})

// Base collapse container styles
const collapseContainerBase = style({
  border: '1px solid var(--primary-accent-1)',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '8px',
  boxSizing: 'border-box'
})

// Card variant styles
const collapseCard = style({
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  border: 'none'
})

// Base header styles
const headerBase = style({
  display: 'flex',
  alignItems: 'center',
  padding: '16px 20px',
  backgroundColor: 'var(--primary-accent-1)',
  cursor: 'pointer',
  border: 'none',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
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

// Header size variants
const headerSize = styleVariants({
  small: {
    padding: '12px 16px'
  },
  medium: {
    padding: '16px 20px'
  },
  large: {
    padding: '20px 24px'
  }
})

// Base header title styles
const headerTitleBase = style({
  margin: 0,
  padding: 0,
  fontWeight: 600,
  color: 'var(--primary-foreground)',
  lineHeight: 1.4,
  fontSize: '16px',
  boxSizing: 'border-box'
})

// Base subtitle styles
const subtitleBase = style({
  fontSize: '14px',
  color: 'var(--primary-accent-5)',
  margin: '4px 0 0 0',
  padding: 0,
  lineHeight: 1.3,
  fontWeight: 400,
  boxSizing: 'border-box'
})

// Base header contents styles
const headerContentsBase = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  boxSizing: 'border-box',
  padding: 0,
  margin: 0
})

// Header title container styles
export const headerTitleContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flex: 1,
  margin: 0,
  padding: 0
})

// Base arrow styles
const arrowBase = style({
  width: '20px',
  height: '20px',
  transition: 'transform 0.2s ease',
  color: 'var(--primary-foreground)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

// Arrow rotation variants
const arrowRotation = styleVariants({
  up: {
    transform: 'rotate(180deg)'
  },
  down: {
    transform: 'rotate(0deg)'
  }
})

// Base contents styles
const contentsBase = style({
  padding: '0 20px',
  backgroundColor: 'var(--primary-background)',
  overflow: 'hidden',
  transition: 'max-height 0.3s ease, padding 0.3s ease',
  boxSizing: 'border-box'
})

// Contents size variants
const contentsSize = styleVariants({
  small: {
    padding: '0 16px'
  },
  medium: {
    padding: '0 20px'
  },
  large: {
    padding: '0 24px'
  }
})

// Contents state variants
const contentsState = styleVariants({
  open: {
    paddingTop: '16px',
    paddingBottom: '16px'
  },
  closed: {
    maxHeight: '0px',
    paddingTop: '0px',
    paddingBottom: '0px'
  }
})

// Contents inner styles
export const contentsInner = style({
  display: 'flex',
  alignItems: 'flex-start',
  minHeight: '100%'
})

export const collapseWrapper = recipe({
  base: collapseWrapperBase
})

export const collapseContainer = recipe({
  base: collapseContainerBase,
  variants: {
    variant: {
      default: {},
      card: collapseCard
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

export const header = recipe({
  base: headerBase,
  variants: {
    size: headerSize
  },
  defaultVariants: {
    size: 'medium'
  }
})

export const headerTitle = recipe({
  base: headerTitleBase
})

export const subtitle = recipe({
  base: subtitleBase
})

export const headerContents = recipe({
  base: headerContentsBase
})

export const arrow = recipe({
  base: arrowBase,
  variants: {
    direction: arrowRotation
  },
  defaultVariants: {
    direction: 'down'
  }
})

export const contents = recipe({
  base: contentsBase,
  variants: {
    size: contentsSize,
    state: contentsState
  },
  defaultVariants: {
    size: 'medium',
    state: 'closed'
  }
})

export type CollapseWrapperVariants = RecipeVariants<typeof collapseWrapper>
export type CollapseContainerVariants = RecipeVariants<typeof collapseContainer>
export type HeaderVariants = RecipeVariants<typeof header>
export type HeaderTitleVariants = RecipeVariants<typeof headerTitle>
export type SubtitleVariants = RecipeVariants<typeof subtitle>
export type HeaderContentsVariants = RecipeVariants<typeof headerContents>
export type ArrowVariants = RecipeVariants<typeof arrow>
export type ContentsVariants = RecipeVariants<typeof contents>

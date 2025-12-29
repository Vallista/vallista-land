import { style } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base tag wrapper styles
const tagWrapperBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  marginBottom: '5px',
  marginTop: '5px',
  marginRight: '0px',
  listStyle: 'none'
})

// Tag content styles
export const tagContent = style({
  backgroundColor: 'var(--primary-accent-1)',
  border: '1px solid var(--primary-accent-1)',
  borderRadius: '5px',
  fontSize: '0.875rem',
  padding: '0 6px',
  alignItems: 'center',
  display: 'flex',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  height: '24px',
  lineHeight: '24px'
})

export const tagContentWithRemove = style({
  borderRight: 'none',
  borderRadius: '5px 0 0 5px'
})

// Tag button styles
const tagButtonBase = style({
  background: 'none',
  border: 'none',
  padding: '0',
  margin: '0',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  transition: 'background-color 0.2s ease',
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
  selectors: {
    '&:hover': {
      backgroundColor: 'var(--primary-accent-1)'
    }
  }
})

// Tag remove button styles
export const tagRemoveButton = style({
  backgroundColor: 'var(--primary-accent-1)',
  borderRadius: '0 5px 5px 0',
  borderRight: '1px solid var(--primary-accent-1)',
  borderTop: '1px solid var(--primary-accent-1)',
  borderBottom: '1px solid var(--primary-accent-1)',
  color: 'var(--primary-accent-5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: 0,
  outline: 'none',
  padding: '0 4px', // 위아래 패딩 제거 (1px → 0)
  height: '24px', // 26px → 24px로 변경
  width: '24px',
  transition: 'background-color 0.2s ease, border 0.2s ease, color 0.2s ease',
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
    '&:hover': {
      backgroundColor: 'var(--error-default)',
      borderColor: 'var(--error-default)',
      color: 'var(--primary-background)'
    }
  }
})

export const tagWrapper = recipe({
  base: tagWrapperBase
})

export const tagButton = recipe({
  base: tagButtonBase
})

export type TagWrapperVariants = RecipeVariants<typeof tagWrapper>
export type TagButtonVariants = RecipeVariants<typeof tagButton>

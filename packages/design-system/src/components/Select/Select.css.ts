import { style } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base select container styles
const selectContainerBase = style({
  position: 'relative',
  display: 'inline-block',
  width: '100%',
  minWidth: '80px',
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

// Base select trigger styles
const selectTriggerBase = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--primary-accent-5)', // 기본 보더 색상을 accent-5로 변경
  borderRadius: '5px',
  backgroundColor: 'var(--primary-background)',
  color: 'var(--primary-foreground)',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'border-color 0.15s ease',
  outline: 'none',
  ':focus': {
    outline: 'none',
    borderColor: 'var(--primary-foreground)' // 포커스 시 더 진한 색상
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  },
  selectors: {
    '&:hover': {
      borderColor: 'var(--primary-foreground)' // 호버 시 더 진한 색상
    }
  }
})

// Select trigger open state
const selectTriggerOpen = style({
  borderColor: 'var(--primary-foreground)', // 열린 상태에서 더 진한 보더
  borderBottomLeftRadius: '0',
  borderBottomRightRadius: '0'
})

// Base select dropdown styles
const selectDropdownBase = style({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  width: '100%', // 명시적으로 width 100% 설정
  backgroundColor: 'var(--primary-background)',
  border: '1px solid var(--primary-accent-5)', // 셀렉트 박스와 동일한 보더 색상
  borderTop: 'none',
  borderRadius: '0 0 5px 5px',
  maxHeight: '200px',
  overflowY: 'auto',
  zIndex: 1000,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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

// Base select option styles
const selectOptionBase = style({
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: '14px',
  color: 'var(--primary-foreground)',
  transition: 'background-color 0.15s ease',
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
    },
    '&[data-selected="true"]': {
      backgroundColor: 'var(--primary-accent-1)',
      fontWeight: 500
    }
  }
})

// Select arrow styles
export const selectArrow = style({
  width: '16px',
  height: '16px',
  transition: 'transform 0.2s ease',
  color: 'var(--primary-accent-5)'
})

// Select arrow open state
export const selectArrowOpen = style({
  transform: 'rotate(180deg)'
})

export const selectContainer = recipe({
  base: selectContainerBase
})

export const selectTrigger = recipe({
  base: selectTriggerBase,
  variants: {
    open: {
      true: selectTriggerOpen,
      false: {}
    }
  },
  defaultVariants: {
    open: false
  }
})

export const selectDropdown = recipe({
  base: selectDropdownBase
})

export const selectOption = recipe({
  base: selectOptionBase
})

export type SelectContainerVariants = RecipeVariants<typeof selectContainer>
export type SelectTriggerVariants = RecipeVariants<typeof selectTrigger>
export type SelectDropdownVariants = RecipeVariants<typeof selectDropdown>
export type SelectOptionVariants = RecipeVariants<typeof selectOption>

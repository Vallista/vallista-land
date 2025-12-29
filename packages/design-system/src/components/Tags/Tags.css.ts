import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

const tagsContainerBase = style({
  display: 'flex',
  flexWrap: 'wrap',
  listStyle: 'none',
  padding: 0,
  margin: 0,
  boxSizing: 'border-box'
})

const gapVariants = styleVariants({
  0: { gap: '0px' },
  1: { gap: '4px' },
  2: { gap: '8px' },
  3: { gap: '12px' },
  4: { gap: '16px' },
  5: { gap: '20px' }
})

const justifyContentVariants = styleVariants({
  'flex-start': { justifyContent: 'flex-start' },
  'flex-end': { justifyContent: 'flex-end' },
  center: { justifyContent: 'center' },
  'space-between': { justifyContent: 'space-between' },
  'space-around': { justifyContent: 'space-around' }
})

const alignItemsVariants = styleVariants({
  'flex-start': { alignItems: 'flex-start' },
  'flex-end': { alignItems: 'flex-end' },
  center: { alignItems: 'center' },
  stretch: { alignItems: 'stretch' },
  baseline: { alignItems: 'baseline' }
})

export const tagsContainer = recipe({
  base: tagsContainerBase,
  variants: {
    gap: gapVariants,
    justifyContent: justifyContentVariants,
    alignItems: alignItemsVariants
  },
  defaultVariants: {
    gap: 0, // 기본 gap을 0으로 변경
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
})

export type TagsContainerVariants = RecipeVariants<typeof tagsContainer>

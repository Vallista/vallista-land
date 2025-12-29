import { style } from '@vanilla-extract/css'
import { DEFINE_ICON_SIZE } from '@/utils/constant'
import { COLOR_TOKENS } from '@vallista/design-system'

export const button = style({
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  height: '18px',
  transition: 'color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)',
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  selectors: {
    '&:hover': {
      color: COLOR_TOKENS.PRIMARY.BLACK
    },
    '& > svg': {
      width: `${DEFINE_ICON_SIZE}px`,
      height: `${DEFINE_ICON_SIZE}px`
    }
  },
  '@media': {
    'screen and (max-width: 1024px)': {
      display: 'none',
      selectors: {
        '& + span': {
          display: 'none'
        }
      }
    }
  }
})

export const buttonActive = style({
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  height: '18px',
  transition: 'color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)',
  color: COLOR_TOKENS.HIGHLIGHT.RED,
  selectors: {
    '& > svg': {
      width: `${DEFINE_ICON_SIZE}px`,
      height: `${DEFINE_ICON_SIZE}px`
    }
  },
  '@media': {
    'screen and (max-width: 1024px)': {
      display: 'none',
      selectors: {
        '& + span': {
          display: 'none'
        }
      }
    }
  }
})

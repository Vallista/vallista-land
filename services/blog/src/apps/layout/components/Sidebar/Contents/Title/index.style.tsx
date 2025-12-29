import { style } from '@vanilla-extract/css'
import { DEFINE_SIDEBAR_HEADER_HEIGHT } from '../../utils'
import { COLOR_TOKENS } from '@vallista/design-system'

export const title = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: `${DEFINE_SIDEBAR_HEADER_HEIGHT}px`,
  fontWeight: 600,
  fontSize: '14px',
  padding: '0 16px 2px',
  color: COLOR_TOKENS.PRIMARY.BLACK,
  selectors: {
    '& > p': {
      paddingTop: '3px'
    }
  }
})

export const titleWrap = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%'
})

export const titleBox = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '6px'
})

export const typeButton = style({
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
    }
  }
})

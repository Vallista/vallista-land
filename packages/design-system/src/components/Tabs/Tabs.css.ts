import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../theme/colorTokens'

export const tabsContainer = style({
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'baseline',
  paddingBottom: '1px',
  overflowX: 'auto',
  boxShadow: `0 -1px 0 ${COLOR_TOKENS.PRIMARY.GRAY_100} inset`,
  gap: '0 !important'
})

export const tabsTab = style({
  cursor: 'pointer',
  padding: '0 0.75rem',
  marginBottom: '-1px',
  borderBottom: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
  outline: 0,
  selectors: {
    '&:first-of-type': {
      paddingLeft: '0.75rem'
    }
  }
})

export const tabsTabDisabled = style({
  cursor: 'not-allowed'
})

export const tabsTabContents = style({
  display: 'flex',
  alignItems: 'center',
  padding: '6px 2px',
  marginBottom: '-1px',
  color: COLOR_TOKENS.PRIMARY.GRAY_400,
  borderBottom: '1px solid transparent'
})

export const tabsTabContentsActive = style({
  borderBottom: `2px solid ${COLOR_TOKENS.PRIMARY.BLACK}`,
  color: COLOR_TOKENS.PRIMARY.BLACK
})

export const tabsIconWrapper = style({
  marginRight: '6px',
  marginBottom: '-3px'
})

export const tabsIcon = style({
  width: '14px !important',
  height: '14px !important'
})

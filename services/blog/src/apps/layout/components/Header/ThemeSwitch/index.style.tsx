import { style } from '@vanilla-extract/css'
import { DEFINE_ICON_SIZE } from '@/utils/constant'
import { COLOR_TOKENS } from '@vallista/design-system'

export const themeToggleContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: COLOR_TOKENS.PRIMARY.BLACK,
  selectors: {
    '& > label': {
      margin: '0 12px'
    },
    '& > svg': {
      width: `${DEFINE_ICON_SIZE}px`,
      height: `${DEFINE_ICON_SIZE}px`
    }
  }
})

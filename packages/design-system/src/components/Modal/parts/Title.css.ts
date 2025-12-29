import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../../theme/colorTokens'

export const modalTitle = style({
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
  color: COLOR_TOKENS.PRIMARY.BLACK,
  lineHeight: 1.4
})

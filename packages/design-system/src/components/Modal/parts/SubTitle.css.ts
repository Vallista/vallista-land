import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../../theme/colorTokens'

export const modalSubTitle = style({
  margin: '8px 0 0 0',
  fontSize: '14px',
  fontWeight: 400,
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  lineHeight: 1.4
})

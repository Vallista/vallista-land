import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../../theme/colorTokens'

export const modalInset = style({
  padding: '24px',
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_50,
  borderTop: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
  borderBottom: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`
})

import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../../theme/colorTokens'

export const modalActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  padding: '24px',
  borderTop: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_50
})

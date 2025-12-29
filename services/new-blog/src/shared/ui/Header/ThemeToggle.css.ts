import { style, globalStyle } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'

export const themeToggleContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: COLOR_TOKENS.PRIMARY.BLACK,
  height: '30px'
})

globalStyle(`${themeToggleContainer} > label`, {
  margin: '0 12px'
})

globalStyle(`${themeToggleContainer} > svg`, {
  width: '16px',
  height: '16px'
})

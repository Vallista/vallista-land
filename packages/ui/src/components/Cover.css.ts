import { style } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const cover = style({
  position: 'relative',
  width: '100%',
  borderRadius: vars.radius['2'],
  overflow: 'hidden',
  backgroundColor: vars.color.accentTint
})

export const svg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  color: vars.color.accent
})

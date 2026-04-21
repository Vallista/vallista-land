import { style } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const toggle = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: vars.radius['2'],
  color: vars.color.ink3,
  cursor: 'pointer',
  transitionProperty: 'background-color, color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&:hover': {
      backgroundColor: vars.color.bgSoft,
      color: vars.color.ink
    }
  }
})

export const iconLight = style({
  selectors: {
    'html.theme-dark &': { display: 'none' }
  }
})

export const iconDark = style({
  display: 'none',
  selectors: {
    'html.theme-dark &': { display: 'block' }
  }
})

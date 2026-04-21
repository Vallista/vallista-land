import { style } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const callout = style({
  margin: '28px 0',
  padding: '18px 22px',
  backgroundColor: vars.color.accentTint,
  borderLeft: `3px solid ${vars.color.accent}`,
  borderTopRightRadius: vars.radius['2'],
  borderBottomRightRadius: vars.radius['2'],
  color: vars.color.ink2,
  fontSize: '15.5px',
  lineHeight: 1.7,
  selectors: {
    '& > strong': {
      color: vars.color.accentHover,
      fontWeight: 600,
      marginRight: '4px'
    }
  }
})

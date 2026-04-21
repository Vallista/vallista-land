import { style } from '@vanilla-extract/css'
import { vars } from '@vallista/ui'

export const row = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '24px'
})

export const link = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  borderRadius: vars.radius['3'],
  border: `1px solid ${vars.color.line}`,
  backgroundColor: vars.color.bg,
  color: vars.color.ink2,
  fontFamily: vars.font.sans,
  fontSize: '13px',
  fontWeight: 500,
  textDecoration: 'none',
  transitionProperty: 'background-color, border-color, color, transform',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&:hover': {
      borderColor: vars.color.ink3,
      color: vars.color.ink,
      backgroundColor: vars.color.bgSoft
    },
    '&:active': { transform: 'translateY(1px)' }
  }
})

export const icon = style({
  display: 'inline-block',
  flexShrink: 0,
  color: 'currentColor'
})

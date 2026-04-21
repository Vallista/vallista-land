import { style } from '@vanilla-extract/css'
import { vars } from '@vallista/ui'

export const widget = style({
  maxWidth: '720px',
  margin: '24px auto 0',
  border: `1px solid ${vars.color.line2}`,
  borderRadius: vars.radius['4'],
  backgroundColor: vars.color.bgSoft,
  overflow: 'hidden'
})

export const summary = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  cursor: 'pointer',
  listStyle: 'none',
  userSelect: 'none',
  selectors: {
    '&::-webkit-details-marker': { display: 'none' }
  }
})

export const summaryLeft = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '10px',
  minWidth: 0
})

export const eyebrow = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.accent
})

export const seriesName = style({
  fontSize: '15px',
  fontWeight: 600,
  color: vars.color.ink,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

export const summaryRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexShrink: 0
})

export const counter = style({
  fontFamily: vars.font.mono,
  fontSize: '12px',
  color: vars.color.ink3
})

export const chevron = style({
  display: 'inline-block',
  width: '14px',
  height: '14px',
  color: vars.color.ink3,
  transitionProperty: 'transform',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out
})

export const chevronOpen = style({
  transform: 'rotate(180deg)'
})

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: '4px 8px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  borderTop: `1px solid ${vars.color.line2}`
})

export const item = style({
  display: 'grid',
  gridTemplateColumns: '40px minmax(0, 1fr) auto',
  gap: '12px',
  alignItems: 'center',
  padding: '8px 10px',
  borderRadius: vars.radius['2'],
  textDecoration: 'none',
  color: vars.color.ink2,
  transitionProperty: 'background-color, color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&:hover': {
      backgroundColor: vars.color.bg,
      color: vars.color.ink
    }
  }
})

export const itemCurrent = style({
  backgroundColor: vars.color.accentTint,
  color: vars.color.accentHover,
  fontWeight: 600,
  selectors: {
    '&:hover': {
      backgroundColor: vars.color.accentTint,
      color: vars.color.accentHover
    }
  }
})

export const itemIndex = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  letterSpacing: '0.04em'
})

export const itemTitle = style({
  fontSize: '14px',
  lineHeight: 1.45,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

export const itemDate = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  textAlign: 'right'
})

import { style, keyframes, globalStyle } from '@vanilla-extract/css'
import { vars } from '@vallista/ui'

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 }
})

const paletteIn = keyframes({
  from: { opacity: 0, transform: 'translate(-50%, -4px) scale(0.96)' },
  to: { opacity: 1, transform: 'translate(-50%, 0) scale(1)' }
})

export const scrim = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: vars.color.bgOverlay,
  zIndex: vars.zIndex.scrim,
  animation: `${fadeIn} ${vars.duration.base} ${vars.easing.out}`
})

export const palette = style({
  position: 'fixed',
  top: '96px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'min(640px, calc(100vw - 32px))',
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius['6'],
  boxShadow: vars.elevation['4'],
  border: `1px solid ${vars.color.line2}`,
  overflow: 'hidden',
  zIndex: vars.zIndex.modal,
  animation: `${paletteIn} ${vars.duration.slow} ${vars.easing.spring}`
})

export const searchRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px 20px',
  borderBottom: `1px solid ${vars.color.line2}`
})

export const searchIcon = style({
  color: vars.color.ink4,
  flexShrink: 0
})

export const searchInput = style({
  flex: 1,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  fontFamily: vars.font.sans,
  fontSize: '16px',
  color: vars.color.ink,
  padding: 0,
  selectors: {
    '&::placeholder': { color: vars.color.ink4 },
    '&:focus-visible': { boxShadow: 'none' }
  }
})

export const esc = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  padding: '3px 6px',
  border: `1px solid ${vars.color.line2}`,
  borderRadius: vars.radius['2'],
  letterSpacing: '0.04em'
})

export const results = style({
  maxHeight: '420px',
  overflowY: 'auto',
  padding: '8px 0'
})

export const groupLabel = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.ink4,
  padding: '12px 20px 6px'
})

export const option = style({
  display: 'block',
  padding: '10px 20px',
  color: vars.color.ink2,
  fontSize: '14px',
  textDecoration: 'none',
  cursor: 'pointer',
  selectors: {
    '&[aria-selected="true"]': {
      backgroundColor: vars.color.accentTint,
      color: vars.color.accentHover
    }
  }
})

export const empty = style({
  padding: '32px 20px',
  textAlign: 'center',
  color: vars.color.ink4,
  fontSize: '13px'
})

// 검색어 하이라이트 — Pagefind의 <mark> 활용
globalStyle(`.${option} mark`, {
  backgroundColor: 'transparent',
  color: vars.color.accent,
  fontWeight: 600
})

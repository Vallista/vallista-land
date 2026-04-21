import { style, keyframes } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-8px)' },
  to: { opacity: 1, transform: 'translateY(0)' }
})

// 상단 바: 960px 이하에서만 표시. 데스크탑에서는 NavRail이 사이드바로.
export const bar = style({
  display: 'none',
  position: 'sticky',
  top: 0,
  zIndex: vars.zIndex.nav,
  backgroundColor: vars.color.bg,
  borderBottom: `1px solid ${vars.color.line2}`,
  padding: '12px 20px',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  '@media': {
    '(max-width: 959px)': {
      display: 'flex'
    }
  }
})

export const barBrand = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: vars.color.ink,
  textDecoration: 'none',
  minWidth: 0
})

export const barMark = style({
  position: 'relative',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  overflow: 'hidden',
  flexShrink: 0,
  backgroundColor: vars.color.bgSoft,
  border: `1px solid ${vars.color.line2}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

export const barMarkImg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  zIndex: 1
})

export const barMarkInitial = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 0,
  fontFamily: vars.font.sans,
  fontSize: '13px',
  fontWeight: 700,
  color: vars.color.ink2
})

export const barTitle = style({
  fontSize: '14.5px',
  fontWeight: 600,
  color: vars.color.ink,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

export const barActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flexShrink: 0
})

export const iconButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: vars.radius['2'],
  color: vars.color.ink2,
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

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: vars.zIndex.modal,
  backgroundColor: vars.color.bg,
  overflowY: 'auto',
  animation: `${slideIn} ${vars.duration.base} ${vars.easing.out}`,
  display: 'none'
})

export const overlayOpen = style({
  display: 'block'
})

export const overlayInner = style({
  minHeight: '100vh',
  padding: '14px 22px 40px',
  display: 'flex',
  flexDirection: 'column'
})

export const overlayHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '2px 0 24px'
})

export const search = style({
  position: 'relative',
  marginBottom: '20px'
})

export const searchInput = style({
  width: '100%',
  padding: '12px 14px 12px 40px',
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius['4'],
  fontFamily: vars.font.sans,
  fontSize: '15px',
  color: vars.color.ink,
  boxSizing: 'border-box',
  selectors: {
    '&::placeholder': { color: vars.color.ink4 },
    '&:focus-visible': {
      outline: 'none',
      borderColor: vars.color.accent,
      boxShadow: '0 0 0 3px rgba(43,108,255,0.18)'
    }
  }
})

export const searchIcon = style({
  position: 'absolute',
  top: '14px',
  left: '14px',
  color: vars.color.ink4,
  pointerEvents: 'none'
})

export const menuNav = style({
  display: 'flex',
  flexDirection: 'column',
  borderTop: `1px solid ${vars.color.line2}`
})

export const menuLink = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '18px 4px',
  borderBottom: `1px solid ${vars.color.line2}`,
  textDecoration: 'none',
  color: vars.color.ink,
  fontSize: '20px',
  fontWeight: 600,
  letterSpacing: '-0.3px',
  selectors: {
    '&[aria-current="page"]': {
      color: vars.color.accent
    }
  }
})

export const menuCount = style({
  fontSize: '12px',
  color: vars.color.ink4,
  fontFamily: vars.font.mono,
  fontWeight: 500
})

export const seriesSection = style({
  marginTop: '28px'
})

export const seriesHead = style({
  fontSize: '11px',
  fontFamily: vars.font.mono,
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: vars.color.ink4,
  marginBottom: '12px'
})

export const seriesChips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
})

export const footerRow = style({
  marginTop: 'auto',
  paddingTop: '28px',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4
})

export const footerLink = style({
  color: vars.color.ink4,
  textDecoration: 'none',
  selectors: {
    '&:hover': { color: vars.color.ink2 }
  }
})

import { style } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const rail = style({
  position: 'sticky',
  top: 0,
  alignSelf: 'start',
  width: '220px',
  height: '100vh',
  padding: '28px 20px',
  borderRight: `1px solid ${vars.color.line2}`,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  '@media': {
    '(max-width: 959px)': {
      display: 'none'
    }
  }
})

export const brand = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textDecoration: 'none',
  color: vars.color.ink
})

export const brandMark = style({
  position: 'relative',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  overflow: 'hidden',
  flexShrink: 0,
  backgroundColor: vars.color.bgSoft,
  border: `1px solid ${vars.color.line2}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

export const brandMarkImg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  zIndex: 1
})

export const brandMarkInitial = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 0,
  fontFamily: vars.font.sans,
  fontSize: '14px',
  fontWeight: 700,
  color: vars.color.ink2,
  backgroundColor: vars.color.bgSoft
})

export const brandText = style({
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.2
})

export const brandName = style({
  fontSize: '13.5px',
  fontWeight: 600,
  color: vars.color.ink
})

export const brandRole = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  letterSpacing: '0.04em'
})

export const groupTitle = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.ink4,
  padding: '0 10px',
  marginBottom: '8px'
})

export const nav = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
})

export const navLink = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '7px 10px',
  borderRadius: vars.radius['2'],
  color: vars.color.ink3,
  fontFamily: vars.font.sans,
  fontSize: '13.5px',
  lineHeight: 1.4,
  fontWeight: 500,
  textDecoration: 'none',
  transitionProperty: 'background-color, color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&:hover': {
      backgroundColor: vars.color.bgSoft,
      color: vars.color.ink2
    },
    '&[aria-current="page"]': {
      backgroundColor: vars.color.bgSoft,
      color: vars.color.ink,
      fontWeight: 600
    }
  }
})

export const navCount = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4
})

export const railFooter = style({
  marginTop: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  paddingTop: '16px',
  borderTop: `1px solid ${vars.color.line2}`,
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  letterSpacing: '0.04em'
})

export const footerLink = style({
  color: vars.color.ink4,
  textDecoration: 'none',
  selectors: {
    '&:hover': { color: vars.color.ink2 }
  }
})

export const seriesSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginTop: '4px'
})

export const seriesTitle = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.ink4,
  padding: '0 10px',
  marginTop: '4px',
  marginBottom: '4px'
})

export const seriesLink = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '5px 10px',
  borderRadius: vars.radius['2'],
  color: vars.color.ink3,
  fontFamily: vars.font.sans,
  fontSize: '12.5px',
  lineHeight: 1.4,
  fontWeight: 500,
  textDecoration: 'none',
  transitionProperty: 'background-color, color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&:hover': {
      backgroundColor: vars.color.bgSoft,
      color: vars.color.ink2
    }
  }
})

export const seriesCount = style({
  fontFamily: vars.font.mono,
  fontSize: '10.5px',
  color: vars.color.ink4
})

import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const toc = style({
  position: 'fixed',
  top: '100px',
  right: '40px',
  width: '220px',
  padding: '0 0 0 14px',
  borderLeft: `1px solid ${vars.color.line2}`,
  zIndex: vars.zIndex.tocRail,
  '@media': {
    '(max-width: 1099px)': {
      display: 'none'
    }
  }
})

export const head = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.ink4,
  marginBottom: '12px'
})

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0
})

export const link = style({
  display: 'block',
  padding: '6px 0 6px 14px',
  marginLeft: '-14px',
  color: vars.color.ink4,
  fontFamily: vars.font.sans,
  fontSize: '12.5px',
  lineHeight: 1.4,
  fontWeight: 400,
  textDecoration: 'none',
  borderLeft: '2px solid transparent',
  selectors: {
    '&.active': {
      color: vars.color.accent,
      fontWeight: 600,
      borderLeftColor: vars.color.accent
    }
  }
})

// depth-3 항목은 class="depth-3"을 부모 li에 달아 구분한다.
globalStyle(`li.depth-3 > .${link}`, {
  paddingLeft: '28px',
  fontSize: '12px'
})

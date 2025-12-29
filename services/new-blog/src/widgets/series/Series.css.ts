import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'

export const wrap = style({
  marginTop: '24px'
})

export const list = style({
  paddingLeft: '1.5rem',
  boxSizing: 'border-box',
  lineHeight: 1.6,
  listStyle: 'decimal'
})

export const item = style({
  selectors: {
    '&:not(:last-child)': {
      marginBottom: '0.5rem'
    },
    '&::marker': {
      fontWeight: 600,
      color: COLOR_TOKENS.HIGHLIGHT.RED
    }
  }
})

export const itemSpan = style({
  cursor: 'pointer',
  borderBottom: `2px solid ${COLOR_TOKENS.HIGHLIGHT.RED}`,
  fontWeight: 600,
  textDecoration: 'none',
  color: COLOR_TOKENS.PRIMARY.BLACK,
  transition: 'all 0.1s ease-out',
  selectors: {
    '&:hover': {
      background: COLOR_TOKENS.HIGHLIGHT.RED,
      borderTop: `2px solid ${COLOR_TOKENS.HIGHLIGHT.RED}`,
      color: COLOR_TOKENS.PRIMARY.WHITE
    }
  }
})

import { globalStyle } from '@vanilla-extract/css'

import { vars } from './theme.css'

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box'
})

globalStyle('html', {
  wordBreak: 'keep-all',
  fontSize: '16px',
  colorScheme: 'light dark',
  WebkitTextSizeAdjust: '100%'
})

globalStyle('body', {
  margin: 0,
  fontFamily: vars.font.sans,
  fontSize: '15px',
  lineHeight: 1.6,
  color: vars.color.ink2,
  backgroundColor: vars.color.bg,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  textWrap: 'pretty'
})

globalStyle('h1, h2, h3, h4, h5, h6', {
  margin: 0,
  color: vars.color.ink,
  fontWeight: 700,
  letterSpacing: '-0.01em'
})

globalStyle('p', { margin: 0 })

globalStyle('a', {
  color: 'inherit',
  textDecoration: 'none'
})

globalStyle('button', {
  fontFamily: 'inherit',
  margin: 0,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'inherit'
})

globalStyle('input, textarea, select', {
  fontFamily: 'inherit',
  fontSize: 'inherit',
  color: 'inherit'
})

globalStyle('hr', {
  border: 'none',
  borderTop: `1px solid ${vars.color.line2}`,
  margin: 0
})

globalStyle('img, svg', {
  display: 'block',
  maxWidth: '100%'
})

globalStyle('code, pre, kbd', {
  fontFamily: vars.font.mono
})

globalStyle(':focus-visible', {
  outline: 'none',
  boxShadow: vars.focusRing,
  borderRadius: vars.radius['2']
})

globalStyle('::selection', {
  backgroundColor: vars.color.accentTint,
  color: vars.color.ink
})

// prefers-reduced-motion: 모든 전환 0.01ms로 축소 (handoff 하드룰 #8)
globalStyle('*, *::before, *::after', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
      scrollBehavior: 'auto'
    }
  }
})

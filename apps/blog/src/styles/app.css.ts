import { globalStyle } from '@vanilla-extract/css'
import { vars, lightTheme, darkTheme } from '@vallista/ui'

globalStyle('html', {
  colorScheme: 'light'
})

globalStyle(`html.${lightTheme}`, {
  backgroundColor: vars.color.bg
})

globalStyle(`html.${darkTheme}`, {
  colorScheme: 'dark',
  backgroundColor: vars.color.bg
})

globalStyle('main', {
  minHeight: '100vh'
})

globalStyle('.layout', {
  display: 'grid',
  gridTemplateColumns: '220px minmax(0, 1fr)',
  minHeight: '100vh',
  '@media': {
    '(max-width: 959px)': {
      gridTemplateColumns: '1fr'
    }
  }
})

globalStyle('.layout__main', {
  minWidth: 0,
  padding: '64px 48px 120px',
  '@media': {
    '(max-width: 959px)': {
      padding: '48px 20px 80px'
    }
  }
})

globalStyle('.skip-link', {
  position: 'absolute',
  left: '-9999px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  padding: '8px 14px',
  backgroundColor: vars.color.ink,
  color: vars.color.bg,
  borderRadius: vars.radius['2']
})

globalStyle('.skip-link:focus-visible', {
  left: '16px',
  top: '16px',
  width: 'auto',
  height: 'auto',
  zIndex: vars.zIndex.toast
})

globalStyle('.eyebrow', {
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.ink4,
  marginBottom: '8px'
})

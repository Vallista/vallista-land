import { globalStyle } from '@vanilla-extract/css'
import { vars, lightTheme, darkTheme } from '@vallista/ui'

// 인라인 스타일에서 쓸 수 있도록 사람이 읽는 이름으로 CSS 변수 alias 노출.
globalStyle(':root', {
  vars: {
    '--ink': vars.color.ink,
    '--ink2': vars.color.ink2,
    '--ink3': vars.color.ink3,
    '--ink4': vars.color.ink4,
    '--bg': vars.color.bg,
    '--bg-soft': vars.color.bgSoft,
    '--line': vars.color.line,
    '--line2': vars.color.line2,
    '--accent': vars.color.accent,
    '--accent-hover': vars.color.accentHover,
    '--accent-tint': vars.color.accentTint
  }
})

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


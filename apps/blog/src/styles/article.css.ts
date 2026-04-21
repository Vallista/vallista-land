import { style, globalStyle } from '@vanilla-extract/css'
import { vars } from '@vallista/ui'

export const progress = style({
  position: 'fixed',
  top: 0,
  left: 0,
  height: '2px',
  width: 0,
  backgroundColor: vars.color.accent,
  zIndex: vars.zIndex.nav
})

export const header = style({
  maxWidth: '720px',
  margin: '0 auto',
  padding: '48px 0 32px'
})

export const chipRow = style({
  display: 'flex',
  gap: '8px',
  marginBottom: '12px',
  flexWrap: 'wrap'
})

export const h1 = style({
  fontSize: '44px',
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '-0.8px',
  color: vars.color.ink,
  margin: '0 0 16px'
})

export const dek = style({
  fontSize: '18px',
  lineHeight: 1.55,
  color: vars.color.ink2,
  margin: '0 0 20px'
})

export const byline = style({
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  fontFamily: vars.font.mono,
  fontSize: '11px',
  letterSpacing: '0.04em',
  color: vars.color.ink4
})

export const prose = style({
  maxWidth: '720px',
  margin: '0 auto',
  padding: '24px 0 120px',
  fontSize: '17px',
  lineHeight: 1.85,
  letterSpacing: '-0.005em',
  color: vars.color.ink2
})

// 프로즈 내부 요소 (MDX 결과) — globalStyle로 스코프.
globalStyle(`.${prose} h2`, {
  fontSize: '26px',
  lineHeight: 1.25,
  letterSpacing: '-0.3px',
  color: vars.color.ink,
  margin: '56px 0 16px',
  fontWeight: 700
})

globalStyle(`.${prose} h3`, {
  fontSize: '19px',
  lineHeight: 1.3,
  letterSpacing: '-0.2px',
  color: vars.color.ink,
  margin: '40px 0 12px',
  fontWeight: 600
})

globalStyle(`.${prose} p`, {
  margin: '0 0 20px'
})

globalStyle(`.${prose} a`, {
  color: vars.color.accent,
  borderBottom: `1px solid ${vars.color.accent}`,
  transition: `background ${vars.duration.fast} ${vars.easing.out}`
})

globalStyle(`.${prose} a:hover`, {
  backgroundColor: vars.color.accentTint
})

globalStyle(`.${prose} ul, .${prose} ol`, {
  margin: '0 0 24px',
  paddingLeft: '24px'
})

globalStyle(`.${prose} li`, {
  margin: '4px 0'
})

globalStyle(`.${prose} blockquote`, {
  borderLeft: `3px solid ${vars.color.line}`,
  padding: '4px 0 4px 20px',
  margin: '24px 0',
  color: vars.color.ink3
})

globalStyle(`.${prose} code`, {
  fontFamily: vars.font.mono,
  fontSize: '0.88em',
  padding: '2px 6px',
  borderRadius: vars.radius['1'],
  backgroundColor: vars.color.bgSoft,
  color: vars.color.ink
})

globalStyle(`.${prose} pre`, {
  margin: '24px 0',
  padding: '16px 18px',
  borderRadius: vars.radius['4'],
  border: `1px solid ${vars.color.line2}`,
  backgroundColor: vars.color.bgSoft,
  overflowX: 'auto',
  fontSize: '13px',
  lineHeight: 1.75
})

globalStyle(`.${prose} pre code`, {
  padding: 0,
  background: 'none',
  fontSize: 'inherit'
})

globalStyle(`.${prose} img`, {
  margin: '24px 0',
  borderRadius: vars.radius['3'],
  maxWidth: '100%'
})

globalStyle(`.${prose} hr`, {
  margin: '48px 0',
  borderTop: `1px solid ${vars.color.line2}`
})

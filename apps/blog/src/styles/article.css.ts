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
  maxWidth: '760px',
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
  maxWidth: '760px',
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

globalStyle(`.${prose} hr`, {
  margin: '48px 0',
  borderTop: `1px solid ${vars.color.line2}`
})

// ─── Image cards (next/image 스타일) ─────────────────────────
// 본문 이미지를 일관된 높이 + 회색 placeholder + fade-in 로 렌더.
// remark-article-assets 가 <figure class="img-card"> 래퍼로 감싸준다.
globalStyle(`.${prose} .img-card`, {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '32px 0',
  padding: '12px',
  minHeight: '280px',
  maxHeight: '520px',
  backgroundColor: vars.color.bgSoft,
  border: `1px solid ${vars.color.line2}`,
  borderRadius: vars.radius['4'],
  overflow: 'hidden'
})

globalStyle(`.${prose} .img-card img`, {
  display: 'block',
  margin: 0,
  width: 'auto',
  maxWidth: '100%',
  maxHeight: '460px',
  height: 'auto',
  objectFit: 'contain',
  borderRadius: vars.radius['2'],
  opacity: 0,
  transitionProperty: 'opacity',
  transitionDuration: vars.duration.slow,
  transitionTimingFunction: vars.easing.out
})

globalStyle(`.${prose} .img-card.is-loaded img`, {
  opacity: 1
})

globalStyle(`.${prose} .img-card.is-error`, {
  minHeight: '120px'
})

globalStyle(`.${prose} .img-card.is-error::after`, {
  content: '"이미지를 불러올 수 없습니다"',
  fontFamily: vars.font.mono,
  fontSize: '12px',
  color: vars.color.ink4
})

globalStyle(`.${prose} .img-card__caption`, {
  margin: '10px 8px 0',
  fontFamily: vars.font.sans,
  fontSize: '13px',
  lineHeight: 1.5,
  color: vars.color.ink4,
  textAlign: 'center'
})

// 카드 밖 '직접 img' (혹시 wrapper 없이 남는 경우) 폴백.
globalStyle(`.${prose} > img`, {
  display: 'block',
  margin: '24px auto',
  borderRadius: vars.radius['3'],
  maxWidth: '100%',
  maxHeight: '480px'
})

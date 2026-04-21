import { style } from '@vanilla-extract/css'
import { vars } from '@vallista/ui'

export const wrap = style({
  maxWidth: '880px',
  margin: '0 auto',
  padding: '16px 0 120px'
})

export const name = style({
  fontSize: '48px',
  fontWeight: 700,
  letterSpacing: '-1px',
  lineHeight: 1.1,
  color: vars.color.ink,
  margin: '0 0 8px',
  '@media': {
    '(max-width: 720px)': { fontSize: '32px' }
  }
})

export const role = style({
  fontSize: '20px',
  fontWeight: 500,
  color: vars.color.ink2,
  margin: '0 0 28px',
  '@media': {
    '(max-width: 720px)': { fontSize: '16px' }
  }
})

export const bio = style({
  fontSize: '16px',
  lineHeight: 1.85,
  color: vars.color.ink2,
  margin: '0 0 12px'
})

export const sectionTitle = style({
  fontSize: '26px',
  fontWeight: 700,
  color: vars.color.ink,
  margin: '64px 0 24px',
  paddingBottom: '12px',
  borderBottom: `1px solid ${vars.color.line}`,
  letterSpacing: '-0.3px'
})

export const career = style({
  display: 'grid',
  gridTemplateColumns: '200px minmax(0, 1fr)',
  gap: '24px',
  padding: '24px 0',
  borderBottom: `1px solid ${vars.color.line2}`,
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
      gap: '8px'
    }
  }
})

export const careerMeta = style({
  fontFamily: vars.font.mono,
  fontSize: '12px',
  color: vars.color.ink4,
  letterSpacing: '0.04em',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
})

export const careerBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
})

export const careerTitle = style({
  fontSize: '18px',
  fontWeight: 600,
  color: vars.color.ink,
  margin: 0
})

export const careerDept = style({
  fontSize: '13px',
  color: vars.color.ink3,
  margin: 0
})

export const careerDescList = style({
  listStyle: 'none',
  margin: '8px 0 0',
  padding: 0,
  color: vars.color.ink2,
  fontSize: '14px',
  lineHeight: 1.7
})

export const careerDescItem = style({
  position: 'relative',
  paddingLeft: '14px',
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '2px',
      top: '11px',
      width: '4px',
      height: '4px',
      backgroundColor: vars.color.ink4,
      borderRadius: '50%'
    }
  }
})

export const project = style({
  marginTop: '16px',
  padding: '16px',
  borderRadius: vars.radius['3'],
  backgroundColor: vars.color.bgSoft,
  border: `1px solid ${vars.color.line2}`
})

export const projectTitle = style({
  fontSize: '15px',
  fontWeight: 600,
  color: vars.color.ink,
  margin: '0 0 4px'
})

export const projectDate = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  margin: '0 0 8px'
})

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
})

export const listItem = style({
  position: 'relative',
  paddingLeft: '14px',
  fontSize: '15px',
  lineHeight: 1.6,
  color: vars.color.ink2,
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '2px',
      top: '10px',
      width: '4px',
      height: '4px',
      backgroundColor: vars.color.ink4,
      borderRadius: '50%'
    }
  }
})

export const listLink = style({
  color: vars.color.ink2,
  borderBottom: `1px solid ${vars.color.line}`,
  transition: `color ${vars.duration.fast} ${vars.easing.out}, border-color ${vars.duration.fast} ${vars.easing.out}`,
  selectors: {
    '&:hover': {
      color: vars.color.accent,
      borderColor: vars.color.accent
    }
  }
})

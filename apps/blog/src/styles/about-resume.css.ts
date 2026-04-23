import { style, globalStyle } from '@vanilla-extract/css'
import { vars } from '@vallista/ui'

// ── Page wrap ───────────────────────────────────────────────
export const wrap = style({
  maxWidth: '880px',
  margin: '0 auto',
  padding: '32px 0 80px'
})

// ── Eyebrow(reused) + display hero ──────────────────────────
export const hero = style({
  marginBottom: '32px'
})

export const displayH1 = style({
  fontFamily: vars.font.sans,
  fontSize: '48px',
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: '-1px',
  color: vars.color.ink,
  margin: '0 0 16px',
  '@media': {
    '(max-width: 720px)': { fontSize: '38px' }
  }
})

export const displayAccent = style({ color: vars.color.accent })

export const lede = style({
  fontSize: '18px',
  lineHeight: 1.7,
  color: vars.color.ink2,
  margin: '0 0 24px',
  maxWidth: '720px'
})

export const ledeStrong = style({ color: vars.color.ink, fontWeight: 600 })

// ── Tabs ────────────────────────────────────────────────────
export const tabs = style({
  display: 'flex',
  gap: '4px',
  borderBottom: `1px solid ${vars.color.line2}`,
  marginBottom: '40px'
})

export const tab = style({
  padding: '10px 16px',
  background: 'transparent',
  border: 'none',
  fontFamily: vars.font.sans,
  fontSize: '14px',
  fontWeight: 500,
  color: vars.color.ink3,
  cursor: 'pointer',
  borderBottom: '2px solid transparent',
  transitionProperty: 'color, border-color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&:hover': { color: vars.color.ink },
    '&[aria-selected="true"]': {
      color: vars.color.ink,
      fontWeight: 600,
      borderBottomColor: vars.color.accent
    }
  }
})

// ── Identity row: avatar + who + links ──────────────────────
export const identity = style({
  display: 'grid',
  gridTemplateColumns: '72px 1fr auto',
  gap: '20px',
  alignItems: 'center',
  padding: '24px 0',
  borderTop: `1px solid ${vars.color.line2}`,
  borderBottom: `1px solid ${vars.color.line2}`,
  marginBottom: '48px',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '56px 1fr',
      gap: '16px'
    }
  }
})

export const avatar = style({
  position: 'relative',
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  overflow: 'hidden',
  backgroundColor: vars.color.bgSoft,
  border: `1px solid ${vars.color.line2}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '@media': {
    '(max-width: 720px)': { width: '56px', height: '56px' }
  }
})

export const avatarImg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  zIndex: 1
})

export const avatarInitial = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 0,
  fontFamily: vars.font.sans,
  fontSize: '22px',
  fontWeight: 700,
  color: vars.color.ink2
})

export const who = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  minWidth: 0
})

export const whoName = style({
  fontSize: '17px',
  fontWeight: 600,
  color: vars.color.ink,
  letterSpacing: '-0.2px'
})

export const whoRole = style({
  fontFamily: vars.font.mono,
  fontSize: '12px',
  color: vars.color.ink3,
  letterSpacing: '0.02em'
})

export const links = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  '@media': {
    '(max-width: 720px)': { gridColumn: '1 / -1', marginTop: '4px' }
  }
})

// ── Section head ────────────────────────────────────────────
export const section = style({ marginTop: '64px' })

export const sectionHead = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBottom: '32px',
  gap: '32px'
})

export const sectionTitle = style({
  fontSize: '26px',
  fontWeight: 700,
  letterSpacing: '-0.3px',
  lineHeight: 1.25,
  color: vars.color.ink,
  margin: 0
})

export const sectionMeta = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  letterSpacing: '0.04em'
})

// ── Prose ───────────────────────────────────────────────────
export const prose = style({ maxWidth: '720px' })

globalStyle(`.${prose} p`, {
  fontSize: '17px',
  lineHeight: 1.85,
  letterSpacing: '-0.005em',
  margin: '0 0 20px',
  color: vars.color.ink2
})

globalStyle(`.${prose} p strong`, {
  color: vars.color.ink,
  fontWeight: 600
})

export const flowLine = style({
  display: 'inline-flex',
  flexWrap: 'wrap',
  gap: '10px',
  alignItems: 'center',
  margin: '0 0 24px',
  padding: '10px 14px',
  backgroundColor: vars.color.bgSoft,
  border: `1px solid ${vars.color.line2}`,
  borderRadius: vars.radius.pill,
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink3,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  width: 'fit-content',
  maxWidth: '100%',
  '@media': {
    '(max-width: 720px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '14px 16px',
      borderRadius: '14px',
      width: '100%'
    }
  }
})

export const flowSep = style({
  color: vars.color.ink4,
  '@media': {
    '(max-width: 720px)': {
      display: 'inline-block',
      transform: 'rotate(90deg)',
      lineHeight: 1
    }
  }
})
export const flowCur = style({ color: vars.color.accent, fontWeight: 600 })

export const pull = style({
  margin: '40px 0',
  padding: '4px 0 4px 24px',
  borderLeft: `2px solid ${vars.color.accent}`,
  fontSize: '19px',
  lineHeight: 1.55,
  color: vars.color.ink,
  fontWeight: 500,
  letterSpacing: '-0.2px'
})

export const proseSub = style({
  fontSize: '20px',
  fontWeight: 600,
  letterSpacing: '-0.3px',
  color: vars.color.ink,
  margin: '48px 0 16px',
  lineHeight: 1.3
})

// ── Metrics ─────────────────────────────────────────────────
export const metrics = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  borderTop: `1px solid ${vars.color.line2}`,
  borderBottom: `1px solid ${vars.color.line2}`,
  '@media': {
    '(max-width: 720px)': { gridTemplateColumns: 'repeat(2, 1fr)' }
  }
})

export const metric = style({
  padding: '24px 16px',
  textAlign: 'center',
  borderRight: `1px solid ${vars.color.line2}`,
  selectors: {
    '&:last-child': { borderRight: 'none' }
  },
  '@media': {
    '(max-width: 720px)': {
      selectors: {
        '&:nth-child(2)': { borderRight: 'none' },
        '&:nth-child(1), &:nth-child(2)': {
          borderBottom: `1px solid ${vars.color.line2}`
        }
      }
    }
  }
})

export const metricN = style({
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '-0.5px',
  lineHeight: 1.2,
  color: vars.color.ink,
  fontVariantNumeric: 'tabular-nums'
})

export const metricU = style({
  fontSize: '16px',
  fontWeight: 500,
  color: vars.color.ink3,
  marginLeft: '2px'
})

export const metricL = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.ink4,
  marginTop: '4px'
})

// ── Two-col lists (Now, Skills) ─────────────────────────────
export const twoCol = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '40px',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
      gap: '32px'
    }
  }
})

export const col = style({})

export const colHead = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.ink4,
  margin: '0 0 16px',
  paddingBottom: '12px',
  borderBottom: `1px solid ${vars.color.line2}`
})

export const colList = style({
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
})

export const colItem = style({
  fontSize: '14px',
  color: vars.color.ink2,
  display: 'grid',
  gridTemplateColumns: '14px 1fr auto',
  gap: '8px',
  alignItems: 'baseline',
  lineHeight: 1.55,
  selectors: {
    '&::before': {
      content: '"·"',
      color: vars.color.ink4,
      fontFamily: vars.font.mono
    }
  }
})

export const colKbd = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  letterSpacing: '0.04em'
})

// ── Writing list ────────────────────────────────────────────
export const writingRow = style({
  display: 'grid',
  gridTemplateColumns: '70px 1fr auto',
  gap: '20px',
  alignItems: 'baseline',
  padding: '16px 0',
  borderBottom: `1px solid ${vars.color.line2}`,
  textDecoration: 'none'
})

export const writingDate = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4
})

export const writingTitle = style({
  fontSize: '15.5px',
  fontWeight: 500,
  color: vars.color.ink,
  letterSpacing: '-0.1px',
  lineHeight: 1.4,
  transitionProperty: 'color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    [`${writingRow}:hover &`]: {
      color: vars.color.accent
    }
  }
})

export const writingTag = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink3
})

// ── Timeline (career) ───────────────────────────────────────
export const timeline = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column'
})

export const tItem = style({
  display: 'grid',
  gridTemplateColumns: '80px 12px 1fr',
  gap: '20px',
  padding: '24px 0',
  borderBottom: `1px solid ${vars.color.line2}`,
  selectors: {
    '&:last-child': { borderBottom: 'none' }
  },
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '60px 12px 1fr',
      gap: '12px'
    }
  }
})

export const tDate = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  paddingTop: '4px',
  lineHeight: 1.4
})

export const tDateYear = style({
  display: 'block',
  color: vars.color.ink,
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '0.02em',
  marginBottom: '2px'
})

export const tDot = style({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: vars.color.bg,
  border: `1.5px solid ${vars.color.ink4}`,
  margin: '8px auto 0',
  position: 'relative'
})

export const tDotNow = style({
  backgroundColor: vars.color.accent,
  borderColor: vars.color.accent
})

export const tBody = style({})

export const tOrg = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  color: vars.color.accent,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '4px'
})

export const tTitle = style({
  fontSize: '19px',
  fontWeight: 600,
  letterSpacing: '-0.2px',
  lineHeight: 1.3,
  color: vars.color.ink,
  margin: '0 0 12px'
})

export const tDesc = style({
  fontSize: '14px',
  lineHeight: 1.65,
  color: vars.color.ink2,
  margin: '0 0 12px',
  maxWidth: '640px'
})

export const chipRow = style({
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap'
})

// ── Works cards ─────────────────────────────────────────────
export const works = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '24px',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr'
    }
  }
})

export const workCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '20px',
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.line2}`,
  borderRadius: vars.radius['5'],
  boxShadow: vars.elevation['1'],
  textDecoration: 'none',
  color: 'inherit',
  transitionProperty: 'border-color, box-shadow, transform',
  transitionDuration: vars.duration.base,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&:hover': {
      borderColor: vars.color.line,
      boxShadow: vars.elevation['2'],
      transform: 'translateY(-1px)'
    }
  }
})

export const workMeta = style({
  display: 'flex',
  gap: '10px',
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4
})

export const workTitle = style({
  fontSize: '17px',
  fontWeight: 600,
  letterSpacing: '-0.2px',
  color: vars.color.ink,
  margin: 0
})

export const workDesc = style({
  fontSize: '13.5px',
  lineHeight: 1.6,
  color: vars.color.ink3,
  margin: 0
})

export const workFoot = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  paddingTop: '8px'
})

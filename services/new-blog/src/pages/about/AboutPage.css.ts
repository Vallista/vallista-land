import { style } from '@vanilla-extract/css'

const TOP_PADDING = 100

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: `calc(100vh - ${TOP_PADDING}px)`,
  boxSizing: 'border-box',
  '@media': {
    'screen and (max-width: 1024px)': {
      padding: '0 10px'
    }
  }
})

export const wrapper = style({
  paddingTop: `${TOP_PADDING}px`,
  maxWidth: '800px',
  width: '100%'
})

export const title = style({
  marginBottom: '32px'
})

export const subTitle = style({
  lineHeight: 1.6
})

export const container = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 24px',
  boxSizing: 'border-box',
  '@media': {
    'screen and (max-width: 1024px)': {
      padding: '0 16px'
    }
  }
})

export const textSpan = style({
  fontSize: '48px',
  fontWeight: 800,
  lineHeight: 1.2,
  display: 'block',
  marginBottom: '8px',
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '32px',
      lineHeight: '40px'
    }
  }
})

export const textH1 = style({
  fontSize: '48px',
  fontWeight: 800,
  lineHeight: '56px',
  margin: 0,
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '32px',
      lineHeight: '40px'
    }
  }
})

export const textHighlight = style({
  color: '#ff4757'
})

export const textP = style({
  fontSize: '20px',
  fontWeight: 400,
  lineHeight: '32px',
  margin: 0,
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '16px',
      lineHeight: '24px'
    }
  }
})

export const textBold = style({
  fontWeight: 700,
  fontSize: '20px',
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '16px',
      lineHeight: '24px'
    }
  }
})

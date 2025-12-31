import { COLOR_TOKENS } from '@vallista/design-system'
import { style, globalStyle } from '@vanilla-extract/css'

const DEFINE_CONTENTS_HEADER_ICON = 32

export const wrap = style({
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  padding: `40px 0 0`,
  fontSize: '16px'
})

export const titleIcon = style({
  width: `${DEFINE_CONTENTS_HEADER_ICON}px`,
  height: `${DEFINE_CONTENTS_HEADER_ICON}px`,
  marginBottom: '32px',
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  '@media': {
    'screen and (max-width: 1024px)': {
      width: `${DEFINE_CONTENTS_HEADER_ICON / 1.5}px`,
      height: `${DEFINE_CONTENTS_HEADER_ICON / 1.5}px`
    }
  }
})

export const titleWrap = style({
  marginBottom: '6px',
  '@media': {
    'screen and (max-width: 1024px)': {
      maxHeight: '120px', // title 최대 높이를 120px로 제한
      overflow: 'hidden'
    }
  }
})

// titleWrap 하위의 p 태그 기본 스타일
globalStyle(`${titleWrap} p`, {
  '@media': {
    'screen and (max-width: 1024px)': {
      margin: 0,
      padding: 0,
      lineHeight: 1.2
    }
  }
})

export const dateWrap = style({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '16px'
})

export const date = style({
  fontSize: '0.875em',
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  fontWeight: 500,
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '0.75em'
    }
  }
})

export const tagWrap = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '24px'
})

export const description = style({
  marginBottom: '32px',
  fontSize: '1.125em',
  lineHeight: 1.6,
  color: COLOR_TOKENS.PRIMARY.GRAY_600,
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '1em',
      marginBottom: '24px'
    }
  }
})

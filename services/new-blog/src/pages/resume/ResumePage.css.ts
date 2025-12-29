import { style, globalStyle } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'
import { DEFINE_HEADER_HEIGHT } from '@/shared/constants/layout'

export const container = style({
  boxSizing: 'border-box',
  padding: `${DEFINE_HEADER_HEIGHT + 100}px 32px 0`,
  margin: '0 auto',
  width: '800px',
  '@media': {
    'screen and (max-width: 1024px)': {
      width: '100%'
    }
  }
})

globalStyle(`${container} > *`, {
  marginBottom: '32px'
})

export const wrapper = style({
  marginLeft: 'auto',
  marginRight: 'auto'
})

export const box = style({})

export const header = style({
  //   padding: '2rem 0'
})

export const title = style({
  maxWidth: '550px'
})

export const subTitle = style({
  maxWidth: '550px'
})

// 미디어 쿼리 내부의 복잡한 선택자는 globalStyle로 처리
globalStyle(`${subTitle} > div:last-of-type`, {
  '@media': {
    'screen and (max-width: 1024px)': {
      flexDirection: 'column'
    }
  }
})

globalStyle(`${subTitle} > div:last-of-type > *`, {
  '@media': {
    'screen and (max-width: 1024px)': {
      marginLeft: 0,
      marginBottom: '1rem'
    }
  }
})

export const contents = style({
  marginLeft: 'auto',
  marginRight: 'auto'
})

globalStyle(`${contents} ul`, {
  listStyle: 'disc',
  paddingLeft: '1.2rem'
})

globalStyle(`${contents} li`, {
  marginBottom: '0.5rem',
  padding: '0.2rem 0',
  lineHeight: 1.4
})

globalStyle(`${contents} li::marker`, {
  color: COLOR_TOKENS.HIGHLIGHT.RED
})

export const twoColumn = style({
  display: 'flex',
  marginBottom: '2rem',
  '@media': {
    'screen and (max-width: 1024px)': {
      flexDirection: 'column'
    }
  }
})

globalStyle(`${twoColumn} > div:first-of-type`, {
  height: 'auto',
  boxSizing: 'border-box',
  flex: 3,
  paddingRight: '2rem'
})

globalStyle(`${twoColumn} > div:first-of-type > div`, {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  position: 'sticky',
  top: '85px'
})

globalStyle(`${twoColumn} > div:first-of-type > div > div:last-of-type`, {
  color: COLOR_TOKENS.PRIMARY.GRAY_500
})

globalStyle(`${twoColumn} > div:first-of-type > div > div:last-of-type > p`, {
  marginBottom: '0.5rem !important'
})

globalStyle(`${twoColumn} > div:last-of-type`, {
  flex: 7,
  '@media': {
    'screen and (max-width: 1024px)': {
      paddingLeft: '1rem',
      borderLeft: `3px solid ${COLOR_TOKENS.HIGHLIGHT.RED}`
    }
  }
})

export const subTitleText = style({
  color: COLOR_TOKENS.PRIMARY.GRAY_500
})

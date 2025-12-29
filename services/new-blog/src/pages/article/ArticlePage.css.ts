import { DEFINE_CONTENTS_PADDING } from '@/shared/constants/layout'
import { COLOR_TOKENS } from '@vallista/design-system'
import { keyframes, style } from '@vanilla-extract/css'

const fadeInForArticlePageThumbnail = keyframes({
  '0%': {
    opacity: 0
  },
  '100%': {
    opacity: 1
  }
})

export const wrapper = style({
  alignItems: 'center !important'
})

export const article = style({
  width: '800px',
  padding: `0 ${DEFINE_CONTENTS_PADDING}px`,
  boxSizing: 'border-box',
  '@media': {
    'screen and (max-width: 1025px)': {
      width: '100%'
    }
  }
})

export const errorContainer = style({
  textAlign: 'center',
  padding: '4rem'
})

export const thumbnailContainer = style({
  marginBottom: '2rem',
  textAlign: 'center',
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto 2rem',
  // 레이아웃 시프트 방지: aspect-ratio로 공간 미리 확보
  aspectRatio: '2 / 1', // 800px:400px = 2:1
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_50 // 로딩 중 배경색
})

export const thumbnailImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  borderRadius: '8px',
  display: 'block',
  opacity: 0,
  transition: 'opacity 0.3s ease-in-out'
})

export const thumbnailImageLoaded = style({
  opacity: 1,
  animation: `${fadeInForArticlePageThumbnail} 0.2s ease-in-out`
})

export const contentContainer = style({
  marginBottom: '4rem'
})

export const commentsContainer = style({
  marginBottom: '4rem'
})

export const relatedSection = style({
  marginBottom: '4rem'
})

export const relatedArticlesGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
})

import { DEFINE_CONTENTS_PADDING } from '@/shared/constants/layout'
import { style } from '@vanilla-extract/css'

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
  textAlign: 'center'
})

export const thumbnailImage = style({
  width: '100%',
  maxWidth: '800px',
  maxHeight: '400px',
  objectFit: 'cover',
  borderRadius: '8px'
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

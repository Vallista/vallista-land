import { DEFINE_HEADER_HEIGHT } from '@/shared/constants/layout'
import { style } from '@vanilla-extract/css'

export const root = style({
  width: '800px',
  padding: `${DEFINE_HEADER_HEIGHT}px 0 0`,
  margin: '0 auto',
  '@media': {
    'screen and (max-width: 1024px)': {
      width: 'auto',
      // padding: '80px 0 60px 0'
      padding: '20px 0 60px 0'
    }
  }
})

export const loadingContainer = style({
  textAlign: 'center',
  padding: '2rem'
})

export const articlesGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
})

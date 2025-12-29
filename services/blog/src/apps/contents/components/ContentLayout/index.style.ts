import { style } from '@vanilla-extract/css'

export const loading = (articleHeight: number, seriesHeight: number) =>
  style({
    height: `calc(100vh - ${articleHeight + seriesHeight}px)`,

    '@media': {
      'screen and (max-width: 1024px)': {
        height: `calc((var(--vh, 1vh) * 100) - ${articleHeight + seriesHeight}px)`
      }
    }
  })

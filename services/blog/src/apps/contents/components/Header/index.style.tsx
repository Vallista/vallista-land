import { style } from '@vanilla-extract/css'
import { DEFINE_CONTENTS_HEADER_PADDING_TOP, DEFINE_CONTENTS_WIDTH, DEFINE_CONTENTS_PADDING } from '@/utils/constant'
import { DEFINE_HEADER_HEIGHT } from '../../../layout/components/Header/utils'
import { COLOR_TOKENS } from '@vallista/design-system'

const DEFINE_CONTENTS_HEADER_ICON = 32

const skeletonStyle = {
  background: `linear-gradient(90deg, ${COLOR_TOKENS.PRIMARY.GRAY_300} 25%, ${COLOR_TOKENS.PRIMARY.GRAY_400} 50%, ${COLOR_TOKENS.PRIMARY.GRAY_300} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'loading 1.5s infinite'
}

export const titleSkeleton = style({
  height: '2.5em',
  marginBottom: '16px',
  borderRadius: '4px',
  ...skeletonStyle,
  '@media': {
    'screen and (max-width: 1024px)': {
      height: '0.75em'
    }
  }
})

export const titleIconSkeleton = style({
  width: `${DEFINE_CONTENTS_HEADER_ICON}px`,
  height: `${DEFINE_CONTENTS_HEADER_ICON}px`,
  marginBottom: '8px',
  borderRadius: '4px',
  ...skeletonStyle,
  '@media': {
    'screen and (max-width: 1024px)': {
      width: `${DEFINE_CONTENTS_HEADER_ICON / 1.5}px`,
      height: `${DEFINE_CONTENTS_HEADER_ICON / 1.5}px`
    }
  }
})

export const dateSkeleton = style({
  height: '0.875em',
  width: '100px',
  borderRadius: '4px',
  ...skeletonStyle,
  '@media': {
    'screen and (max-width: 1024px)': {
      height: '0.75em'
    }
  }
})

export const wrap = style({
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: `${DEFINE_CONTENTS_WIDTH}px`,
  padding: `calc(${DEFINE_HEADER_HEIGHT}px + ${DEFINE_CONTENTS_PADDING}px + ${DEFINE_CONTENTS_HEADER_PADDING_TOP}px) 16px 0`,
  fontSize: '16px',
  '@media': {
    'screen and (min-width: 1025px)': {
      width: `${DEFINE_CONTENTS_WIDTH}px`,
      padding: `calc(${DEFINE_HEADER_HEIGHT}px + ${DEFINE_CONTENTS_PADDING}px + ${DEFINE_CONTENTS_HEADER_PADDING_TOP}px) ${DEFINE_CONTENTS_PADDING}px 0`
    }
  }
})

export const titleIcon = style({
  width: `${DEFINE_CONTENTS_HEADER_ICON}px`,
  height: `${DEFINE_CONTENTS_HEADER_ICON}px`,
  marginBottom: '8px',
  '@media': {
    'screen and (max-width: 1024px)': {
      width: `${DEFINE_CONTENTS_HEADER_ICON / 1.5}px`,
      height: `${DEFINE_CONTENTS_HEADER_ICON / 1.5}px`,
      selectors: {
        '& svg': {
          width: `${DEFINE_CONTENTS_HEADER_ICON / 1.5}px`,
          height: `${DEFINE_CONTENTS_HEADER_ICON / 1.5}px`
        }
      }
    }
  }
})

export const title = style({
  fontSize: '2.5em',
  fontWeight: 800,
  lineHeight: 1.3,
  letterSpacing: '-1px',
  marginBottom: '16px',
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '2em',
      marginBottom: '8px'
    }
  }
})

export const dateWrap = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end'
})

export const date = style({
  fontSize: '0.875em',
  color: COLOR_TOKENS.PRIMARY.GRAY_700,
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '0.75em'
    }
  }
})

export const tagWrap = style({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  margin: '12px 0 0',
  '@media': {
    'screen and (max-width: 1024px)': {
      margin: '8px 0 0'
    }
  }
})

export const tag = style({
  fontSize: '0.875em',
  fontWeight: 300,
  color: COLOR_TOKENS.HIGHLIGHT.RED,
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_100,
  padding: '4px 8px',
  borderRadius: '4px',
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '0.75em'
    }
  }
})

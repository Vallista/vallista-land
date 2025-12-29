import { style } from '@vanilla-extract/css'
import { DEFINE_CONTENTS_MIN_WIDTH, DEFINE_CONTENTS_PADDING, DEFINE_CONTENTS_WIDTH } from '@/utils/constant'
import { COLOR_TOKENS } from '@vallista/design-system'

export const wrap = style({
  minWidth: `${DEFINE_CONTENTS_MIN_WIDTH}px`
})

export const footerBox = style({
  '@media': {
    'screen and (min-width: 1025px)': {
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'center',
      borderTop: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
      selectors: {
        '& > footer': {
          width: `${DEFINE_CONTENTS_WIDTH}px`,
          boxSizing: 'border-box',
          padding: `${DEFINE_CONTENTS_PADDING}px ${DEFINE_CONTENTS_PADDING}px ${DEFINE_CONTENTS_PADDING / 2}px ${DEFINE_CONTENTS_PADDING}px`,
          borderTop: 'none'
        }
      }
    }
  }
})

export const footerAllRightReserve = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '60px',
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  selectors: {
    '& a': {
      color: COLOR_TOKENS.PRIMARY.BLACK,
      textDecoration: 'none'
    }
  }
})

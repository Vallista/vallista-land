import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'

export const wrapper = style({
  marginLeft: 'auto',
  marginRight: 'auto',
  maxWidth: '900px',
  padding: '2rem'
})

export const box = style({})

export const header = style({
  padding: '2rem 0'
})

export const title = style({
  maxWidth: '550px'
})

export const subTitle = style({
  maxWidth: '550px',
  '@media': {
    'screen and (max-width: 1024px)': {
      selectors: {
        '& > div:last-of-type': {
          flexDirection: 'column'
        },
        '& > div:last-of-type > *': {
          marginLeft: 0,
          marginBottom: '1rem'
        }
      }
    }
  }
})

export const contents = style({
  marginLeft: 'auto',
  marginRight: 'auto',
  maxWidth: '900px',
  padding: '2rem',
  selectors: {
    '& ul': {
      listStyle: 'disc',
      paddingLeft: '1.2rem'
    },
    '& li': {
      marginBottom: '0.5rem',
      padding: '0.2rem 0',
      lineHeight: 1.4
    },
    '& li::marker': {
      color: COLOR_TOKENS.HIGHLIGHT.RED
    }
  }
})

export const twoColumn = style({
  display: 'flex',
  marginBottom: '2rem',
  selectors: {
    '& > div:first-of-type': {
      height: 'auto',
      boxSizing: 'border-box',
      flex: 3,
      paddingRight: '2rem'
    },
    '& > div:first-of-type > div': {
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      position: 'sticky',
      top: '85px'
    },
    '& > div:first-of-type > div > div:last-of-type': {
      color: COLOR_TOKENS.PRIMARY.GRAY_500
    },
    '& > div:first-of-type > div > div:last-of-type > p': {
      marginBottom: '0.5rem !important'
    },
    '& > div:last-of-type': {
      flex: 7
    }
  },
  '@media': {
    'screen and (max-width: 1024px)': {
      flexDirection: 'column',
      selectors: {
        '& > div:last-of-type': {
          paddingLeft: '1rem',
          borderLeft: `3px solid ${COLOR_TOKENS.HIGHLIGHT.RED}`
        }
      }
    }
  }
})

export const subTitleText = style({
  color: COLOR_TOKENS.PRIMARY.GRAY_500
})

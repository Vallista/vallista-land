import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'

export const menu = style({
  position: 'relative',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '6px 0',
  transition: 'border 0.2s ease',
  gap: '6px',
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  selectors: {
    '& > div': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '6px',
      color: COLOR_TOKENS.PRIMARY.GRAY_500
    },
    '& > svg': {
      width: '20px',
      height: '20px'
    },
    '& > span': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      display: 'block',
      flex: 1
    }
  },
  '@media': {
    'screen and (min-width: 1025px)': {
      selectors: {
        '&:hover': {
          backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_100
        }
      }
    }
  }
})

export const menuActive = style({
  position: 'relative',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '6px 0 6px 12px',
  transition: 'border 0.2s ease',
  gap: '6px',
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  borderLeft: `6px solid ${COLOR_TOKENS.HIGHLIGHT.RED}`,
  selectors: {
    '& > div': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '6px',
      color: COLOR_TOKENS.PRIMARY.GRAY_500
    },
    '& > svg': {
      width: '20px',
      height: '20px'
    },
    '& > span': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      display: 'block',
      flex: 1
    }
  },
  '@media': {
    'screen and (min-width: 1025px)': {
      selectors: {
        '&:hover': {
          backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_100
        }
      }
    }
  }
})

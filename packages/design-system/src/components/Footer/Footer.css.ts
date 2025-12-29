import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../theme/colorTokens'

export const footerContainer = style({
  fontSize: '0.875rem',
  borderTop: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
  padding: 'calc(1.5 * 1rem) 1rem 1rem'
})

export const footerNav = style({
  maxWidth: '1024px',
  margin: '0 auto',
  display: 'flex',
  flexWrap: 'nowrap',
  justifyContent: 'space-between',
  '@media': {
    'screen and (max-width: 1024px)': {
      flexDirection: 'column'
    }
  }
})

export const footerGroupContainer = style({
  selectors: {
    '&:not(:last-of-type)': {
      marginRight: '1rem'
    }
  },
  '@media': {
    'screen and (max-width: 1024px)': {
      marginRight: '0 !important',
      borderBottom: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`
    }
  }
})

export const footerGroupList = style({
  listStyleType: 'none',
  margin: 0,
  padding: 0,
  '@media': {
    'screen and (max-width: 1024px)': {
      display: 'block',
      paddingLeft: '12px',
      paddingBottom: '12px'
    }
  }
})

export const footerGroupTitleInput = style({
  border: 0,
  padding: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(100%)',
  height: '1px',
  width: '1px',
  margin: '-1px',
  overflow: 'hidden',
  position: 'absolute',
  appearance: 'none',
  whiteSpace: 'nowrap',
  wordWrap: 'normal'
})

export const footerGroupTitleLabel = style({})

export const footerGroupTitle = style({
  fontWeight: 400,
  fontSize: '0.875rem',
  margin: '0.75rem 0',
  '@media': {
    'screen and (max-width: 1024px)': {
      selectors: {
        '&::after': {
          content: "'+'",
          float: 'right',
          transition: 'transform 0.15s ease'
        }
      }
    }
  }
})

export const footerLinkContainer = style({
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  padding: '0.5rem 0'
})

export const footerLink = style({
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  transition: 'color 0.1s ease',
  textDecoration: 'none',
  cursor: 'pointer',
  outline: 'none',
  WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
  selectors: {
    '&:hover': {
      color: COLOR_TOKENS.PRIMARY.BLACK
    }
  }
})

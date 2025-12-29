import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../theme/colorTokens'

export const imageContainer = style({
  display: 'block',
  textAlign: 'center'
})

export const imageMain = style({
  margin: '0 auto',
  maxWidth: '100%'
})

export const imageWrapper = style({
  display: 'flex',
  justifyContent: 'center',
  position: 'relative'
})

export const imageImg = style({
  height: '100%',
  left: 0,
  position: 'absolute',
  top: 0,
  width: '100%'
})

export const imageCaption = style({
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  fontSize: '0.875rem',
  textAlign: 'center'
})

// 새로운 스타일 추가
export const imageHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '8px',
  padding: '8px 12px',
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_50,
  borderRadius: '6px',
  border: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`
})

export const imageTitle = style({
  fontSize: '0.875rem',
  fontWeight: '500',
  color: COLOR_TOKENS.PRIMARY.GRAY_700,
  margin: 0,
  flex: 1
})

export const imageCloseButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: 'transparent',
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  marginLeft: '8px',
  selectors: {
    '&:hover': {
      backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_100,
      color: COLOR_TOKENS.PRIMARY.GRAY_700
    },
    '&:active': {
      backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_300
    }
  }
})

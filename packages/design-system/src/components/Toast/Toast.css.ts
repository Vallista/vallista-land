import { style, styleVariants } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../theme/colorTokens'

export const toastContainer = style({
  position: 'relative',
  borderRadius: '5px',
  padding: '12px 24px',
  transition: 'opacity 0.4s ease, transform 0.4s ease',
  boxSizing: 'border-box',
  opacity: 1,
  transform: 'translate3d(0, 0, 0)',
  boxShadow: `0 1px 2px 0 ${COLOR_TOKENS.SHADOW.BLACK_05}`,
  zIndex: 1000,
  willChange: 'transform, opacity',
  '@media': {
    '(max-width: 440px)': {
      width: '100%'
    }
  }
})

export const toastContainerType = styleVariants({
  primary: {
    background: COLOR_TOKENS.PRIMARY.WHITE,
    color: COLOR_TOKENS.PRIMARY.BLACK,
    border: '1px solid var(--primary-accent-3)' // 기본 보더
  },
  success: {
    background: COLOR_TOKENS.SUCCESS.DEFAULT,
    color: COLOR_TOKENS.PRIMARY.WHITE,
    border: '1px solid var(--success-default)' // 성공 색상 보더
  },
  error: {
    background: COLOR_TOKENS.ERROR.DEFAULT,
    color: COLOR_TOKENS.PRIMARY.WHITE,
    border: '1px solid var(--error-default)' // 에러 색상 보더
  }
})

export const toastContainerDestroy = style({
  opacity: '0 !important'
})

export const toastWrapper = style({
  maxWidth: '100%',
  width: '420px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.875rem'
})

export const toastMessage = style({
  marginTop: '-1px',
  width: '100%',
  height: '100%',
  wordBreak: 'break-word'
})

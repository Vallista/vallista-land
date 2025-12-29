import { style, styleVariants } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../theme/colorTokens'

export const toggleLabel = style({
  display: 'inline-flex',
  position: 'relative',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  userSelect: 'none'
})

export const toggleInput = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
  opacity: 0,
  outline: 'none'
})

export const toggleWrapper = style({
  display: 'inline-block',
  transition: 'background 0.15s cubic-bezier(0, 0, 0.2, 1)',
  borderRadius: '14px',
  cursor: 'pointer',
  position: 'relative',
  boxSizing: 'border-box'
})

export const toggleWrapperSize = styleVariants({
  small: {
    width: '28px',
    height: '14px'
  },
  medium: {
    width: '34px',
    height: '18px'
  },
  large: {
    width: '40px',
    height: '24px'
  }
})

export const toggleWrapperColor = styleVariants({
  blue: {
    background: COLOR_TOKENS.SUCCESS.DEFAULT,
    border: `1px solid ${COLOR_TOKENS.SUCCESS.DEFAULT}`
  },
  pink: {
    background: COLOR_TOKENS.HIGHLIGHT.PINK,
    border: `1px solid ${COLOR_TOKENS.HIGHLIGHT.PINK}`
  },
  off: {
    background: COLOR_TOKENS.PRIMARY.GRAY_100,
    border: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`
  }
})

export const toggleWrapperDisabled = style({
  background: COLOR_TOKENS.PRIMARY.GRAY_50,
  borderColor: COLOR_TOKENS.PRIMARY.GRAY_100,
  cursor: 'not-allowed'
})

export const toggleCircle = style({
  position: 'absolute',
  left: 0,
  top: '50%',
  transition: 'transform 0.15s cubic-bezier(0, 0, 0.2, 1)',
  background: COLOR_TOKENS.PRIMARY.WHITE,
  cursor: 'pointer',
  borderRadius: '50%',
  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 20%), 0 1px 3px 0 rgb(0 0 0 / 10%)',
  border: '1px solid transparent'
})

export const toggleCircleSize = styleVariants({
  small: {
    width: '12px',
    height: '12px'
  },
  medium: {
    width: '16px',
    height: '16px'
  },
  large: {
    width: '22px',
    height: '22px'
  }
})

export const toggleCirclePosition = styleVariants({
  small: {
    transform: 'translate(1px, -50%)'
  },
  medium: {
    transform: 'translate(1px, -50%)'
  },
  large: {
    transform: 'translate(1px, -50%)'
  }
})

export const toggleCirclePositionActive = styleVariants({
  small: {
    transform: 'translate(15px, -50%)'
  },
  medium: {
    transform: 'translate(17px, -50%)'
  },
  large: {
    transform: 'translate(17px, -50%)'
  }
})

export const toggleCircleDisabled = style({
  background: COLOR_TOKENS.PRIMARY.GRAY_100,
  cursor: 'not-allowed'
})

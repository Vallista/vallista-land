import { style } from '@vanilla-extract/css'
import { DEFINE_ICON_SIZE } from '@/utils/constant'
import { COLOR_TOKENS } from '@vallista/design-system'

export const button = style({
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  height: '18px',
  transition: 'color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)',
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  width: `${DEFINE_ICON_SIZE}px`,
  selectors: {
    '&:hover': {
      color: COLOR_TOKENS.PRIMARY.BLACK
    }
  }
})

export const buttonActive = style({
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  height: '18px',
  transition: 'color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)',
  color: COLOR_TOKENS.HIGHLIGHT.RED,
  width: `${DEFINE_ICON_SIZE}px`
})

export const environmentContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start'
})

export const selectGaugeWrapper = style({
  position: 'relative',
  width: '100%',
  height: '10px',
  borderRadius: '5px',
  margin: '0.5rem 0',
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_100
})

export const selectGauge = style({
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '10px',
  transform: 'translate(-50%, -50%)',
  cursor: 'pointer',
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_800,
  selectors: {
    '&:first-of-type': {
      left: '1.5%'
    },
    '&:last-of-type': {
      right: '95%'
    },
    '&::after': {
      content: 'attr(data-value)',
      position: 'absolute',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      top: '30px'
    }
  }
})

export const selectGaugeSelected = style({
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '10px',
  transform: 'translate(-50%, -50%)',
  cursor: 'pointer',
  backgroundColor: COLOR_TOKENS.HIGHLIGHT.RED,
  selectors: {
    '&:first-of-type': {
      left: '1.5%'
    },
    '&:last-of-type': {
      right: '95%'
    },
    '&::after': {
      content: 'attr(data-value)',
      position: 'absolute',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      top: '30px'
    }
  }
})

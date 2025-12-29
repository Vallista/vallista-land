import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../theme/colorTokens'

export const showMoreContainer = style({
  display: 'flex',
  width: 'calc(100% - 40px)',
  marginTop: '1.125rem',
  marginLeft: '1.125rem',
  boxAlign: 'center',
  alignItems: 'center',
  minHeight: '30px',
  gap: '0 !important'
})

export const showMoreButton = style({
  border: 0,
  padding: '5px 15px',
  borderRadius: '100px',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  outline: 0,
  cursor: 'pointer',
  fontSize: '12px',
  textTransform: 'uppercase',
  color: COLOR_TOKENS.PRIMARY.GRAY_500,
  height: '28px',
  backgroundColor: COLOR_TOKENS.PRIMARY.WHITE,
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  maxWidth: '100%',
  selectors: {
    '&:hover': {
      color: COLOR_TOKENS.PRIMARY.BLACK,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }
  }
})

export const showMoreLine = style({
  WebkitBoxFlex: 1,
  flexGrow: 1,
  height: '1px',
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_100
})

export const showMoreSvg = style({
  marginLeft: '6px',
  transition: 'transform 0.2s ease-in-out'
})

export const showMoreSvgExpanded = style({
  transform: 'rotate(180deg)'
})

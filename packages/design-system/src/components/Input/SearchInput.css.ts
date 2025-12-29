import { style } from '@vanilla-extract/css'

export const searchInputRemoveText = style({
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  transition: 'opacity 0.15s ease',
  ':hover': {
    opacity: 0.8
  }
})

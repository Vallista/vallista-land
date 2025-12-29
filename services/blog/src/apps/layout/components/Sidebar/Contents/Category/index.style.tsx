import { style } from '@vanilla-extract/css'

export const listStyle = style({
  display: 'flex',
  flexDirection: 'column',
  margin: '12px 0 0',
  width: '100%',

  selectors: {
    '&:first-of-type': {
      marginTop: 0
    }
  }
})

export const listHeader = style({
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  fontSize: '14px',
  padding: 0,
  margin: '0 0 6px 0',
  height: '30px',
  gap: '6px',

  '@media': {
    'screen and (min-width: 1025px)': {
      backgroundColor: 'none'
    }
  }
})

export const listFoldIcon = style({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'flex-end',
  width: '20px',

  selectors: {
    '& > div > svg': {
      position: 'relative'
    }
  }
})

export const listFoldIconUnfolded = style({
  selectors: {
    '& > div > svg': {
      position: 'relative',
      top: '-2px',
      left: '-2px'
    }
  }
})

export const listBody = style({
  overflowY: 'hidden',
  willChange: 'height',
  transition: 'height 0.2s ease',
  height: 'auto',

  selectors: {
    '& > a': {
      paddingLeft: '12px'
    }
  }
})

export const listBodyFolded = style({
  overflowY: 'hidden',
  willChange: 'height',
  transition: 'height 0.2s ease',
  height: 0,

  selectors: {
    '& > a': {
      paddingLeft: '12px'
    }
  }
})

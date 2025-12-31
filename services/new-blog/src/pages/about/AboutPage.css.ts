import { style } from '@vanilla-extract/css'

import { responsive } from '@shared/styles/breakpoints'

// ============================================================================
// Constants
// ============================================================================
const TOP_PADDING = 20

// ============================================================================
// About Page Header
// ============================================================================
const desktopHeaderStyles = {
  display: 'flex' as const,
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  minHeight: `calc(100vh - ${TOP_PADDING}px)`,
  boxSizing: 'border-box' as const
}

export const header = style({
  ...desktopHeaderStyles,
  ...responsive({
    mobile: {
      padding: '0 10px'
    }
  })
})

// ============================================================================
// About Page Wrapper
// ============================================================================
export const wrapper = style({
  paddingTop: `${TOP_PADDING}px`,
  maxWidth: '800px',
  width: '100%'
})

// ============================================================================
// About Page Title
// ============================================================================
export const title = style({
  marginBottom: '32px'
})

// ============================================================================
// About Page Subtitle
// ============================================================================
export const subTitle = style({
  lineHeight: 1.6
})

// ============================================================================
// About Page Container
// ============================================================================
const desktopContainerStyles = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 24px',
  boxSizing: 'border-box' as const
}

export const container = style({
  ...desktopContainerStyles,
  ...responsive({
    mobile: {
      padding: '0 16px'
    }
  })
})

// ============================================================================
// Typography Styles
// ============================================================================
const desktopTextSpanStyles = {
  fontSize: '48px',
  fontWeight: 800,
  lineHeight: 1.2,
  display: 'block' as const,
  marginBottom: '8px'
}

export const textSpan = style({
  ...desktopTextSpanStyles,
  ...responsive({
    mobile: {
      fontSize: '32px',
      lineHeight: '40px'
    }
  })
})

const desktopTextH1Styles = {
  fontSize: '48px',
  fontWeight: 800,
  lineHeight: '56px',
  margin: 0
}

export const textH1 = style({
  ...desktopTextH1Styles,
  ...responsive({
    mobile: {
      fontSize: '32px',
      lineHeight: '40px'
    }
  })
})

export const textHighlight = style({
  color: '#ff4757'
})

const desktopTextPStyles = {
  fontSize: '20px',
  fontWeight: 400,
  lineHeight: '32px',
  margin: 0
}

export const textP = style({
  ...desktopTextPStyles,
  ...responsive({
    mobile: {
      fontSize: '16px',
      lineHeight: '24px'
    }
  })
})

const desktopTextBoldStyles = {
  fontWeight: 700,
  fontSize: '20px'
}

export const textBold = style({
  ...desktopTextBoldStyles,
  ...responsive({
    mobile: {
      fontSize: '16px',
      lineHeight: '24px'
    }
  })
})

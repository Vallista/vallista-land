import { createSprinkles, defineProperties } from '@vanilla-extract/sprinkles'

const space = {
  '0': '0',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '28px',
  '8': '32px',
  '9': '36px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '32': '128px',
  '40': '160px',
  '48': '192px',
  '56': '224px',
  '64': '256px'
}

const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem'
}

const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900'
}

const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2'
}

const borderWidths = {
  '0': '0',
  '1': '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px'
}

const borderRadii = {
  '0': '0',
  '1': '2px',
  '2': '4px',
  '3': '6px',
  '4': '8px',
  '5': '10px',
  '6': '12px',
  '8': '16px',
  '10': '20px',
  '12': '24px',
  '16': '32px',
  '20': '40px',
  '24': '48px',
  '32': '64px',
  '40': '80px',
  '48': '96px',
  full: '9999px'
}

const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
}

const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': 'screen and (min-width: 768px)' },
    desktop: { '@media': 'screen and (min-width: 1024px)' }
  },
  defaultCondition: 'mobile',
  properties: {
    display: ['none', 'block', 'flex', 'inline-flex', 'grid', 'inline-grid'],
    flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
    justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
    gap: space,
    paddingTop: space,
    paddingBottom: space,
    paddingLeft: space,
    paddingRight: space,
    marginTop: space,
    marginBottom: space,
    marginLeft: space,
    marginRight: space,
    width: {
      '0': '0',
      auto: 'auto',
      full: '100%',
      screen: '100vw',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content'
    },
    height: {
      '0': '0',
      auto: 'auto',
      full: '100%',
      screen: '100vh',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content'
    },
    fontSize: fontSizes,
    fontWeight: fontWeights,
    lineHeight: lineHeights,
    textAlign: ['left', 'center', 'right', 'justify'],
    borderWidth: borderWidths,
    borderRadius: borderRadii,
    boxShadow: shadows,
    position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    top: space,
    right: space,
    bottom: space,
    left: space,
    zIndex: {
      '0': '0',
      '10': '10',
      '20': '20',
      '30': '30',
      '40': '40',
      '50': '50',
      auto: 'auto'
    },
    overflow: ['visible', 'hidden', 'scroll', 'auto'],
    overflowX: ['visible', 'hidden', 'scroll', 'auto'],
    overflowY: ['visible', 'hidden', 'scroll', 'auto']
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    margin: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
    marginX: ['marginLeft', 'marginRight'],
    marginY: ['marginTop', 'marginBottom']
  }
})

const colorProperties = defineProperties({
  conditions: {
    lightMode: {},
    darkMode: { selector: '[data-theme="dark"] &' }
  },
  defaultCondition: 'lightMode',
  properties: {
    color: {
      inherit: 'inherit',
      current: 'currentColor',
      transparent: 'transparent'
    },
    backgroundColor: {
      inherit: 'inherit',
      current: 'currentColor',
      transparent: 'transparent'
    },
    borderColor: {
      inherit: 'inherit',
      current: 'currentColor',
      transparent: 'transparent'
    }
  }
})

export const sprinkles = createSprinkles(responsiveProperties, colorProperties)

export type Sprinkles = Parameters<typeof sprinkles>[0]

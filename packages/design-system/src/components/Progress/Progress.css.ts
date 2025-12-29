import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'
import { COLOR_TOKENS } from '../../theme/colorTokens'

// Base progress styles
const progressBase = style({
  appearance: 'none',
  border: 'none',
  width: '100%',
  height: '12px',
  display: 'block',
  verticalAlign: 'unset',
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_100,
  borderRadius: '6px',
  overflow: 'hidden',
  selectors: {
    '&::-webkit-progress-bar': {
      backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_100,
      borderRadius: '6px'
    },
    '&::-webkit-progress-value': {
      backgroundColor: COLOR_TOKENS.PRIMARY.BLACK,
      borderRadius: '6px',
      transition: 'width 0.15s ease'
    },
    '&::-moz-progress-bar': {
      backgroundColor: COLOR_TOKENS.PRIMARY.BLACK,
      borderRadius: '6px',
      transition: 'width 0.15s ease'
    }
  }
})

// Progress type variants
const progressType = styleVariants({
  primary: {
    selectors: {
      '&::-webkit-progress-value': {
        background: COLOR_TOKENS.PRIMARY.BLACK,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      },
      '&::-moz-progress-bar': {
        background: COLOR_TOKENS.PRIMARY.BLACK,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      }
    }
  },
  secondary: {
    selectors: {
      '&::-webkit-progress-value': {
        background: COLOR_TOKENS.PRIMARY.GRAY_500,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      },
      '&::-moz-progress-bar': {
        background: COLOR_TOKENS.PRIMARY.GRAY_500,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      }
    }
  },
  success: {
    selectors: {
      '&::-webkit-progress-value': {
        background: COLOR_TOKENS.SUCCESS.DEFAULT,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      },
      '&::-moz-progress-bar': {
        background: COLOR_TOKENS.SUCCESS.DEFAULT,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      }
    }
  },
  error: {
    selectors: {
      '&::-webkit-progress-value': {
        background: COLOR_TOKENS.ERROR.DEFAULT,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      },
      '&::-moz-progress-bar': {
        background: COLOR_TOKENS.ERROR.DEFAULT,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      }
    }
  },
  warning: {
    selectors: {
      '&::-webkit-progress-value': {
        background: COLOR_TOKENS.WARNING.DEFAULT,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      },
      '&::-moz-progress-bar': {
        background: COLOR_TOKENS.WARNING.DEFAULT,
        borderRadius: '6px',
        transition: 'width 0.15s ease'
      }
    }
  }
})

// Custom color progress styles
const customColorProgress = style({
  selectors: {
    '&::-webkit-progress-value': {
      background: 'var(--progress-color)',
      borderRadius: '6px',
      transition: 'width 0.15s ease'
    },
    '&::-moz-progress-bar': {
      background: 'var(--progress-color)',
      borderRadius: '6px',
      transition: 'width 0.15s ease'
    }
  }
})

export const progress = recipe({
  base: progressBase,
  variants: {
    type: progressType
  },
  defaultVariants: {
    type: 'primary'
  }
})

export const customProgress = recipe({
  base: [progressBase, customColorProgress],
  variants: {
    type: progressType
  },
  defaultVariants: {
    type: 'primary'
  }
})

export type ProgressVariants = RecipeVariants<typeof progress>

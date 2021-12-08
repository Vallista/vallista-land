import { Theme } from '@emotion/react'
import React from 'react'

type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'alert' | 'violet'
interface ButtonStateColor {
  foreground: string
  background: string
  border: string
}
export interface ButtonStateColors {
  normal: ButtonStateColor
  hover: ButtonStateColor
  active: ButtonStateColor
}
interface ButtonColorSets {
  [key: string]: ButtonStateColors
}
type ButtonColorSet = (theme: Theme) => ButtonColorSets
type ButtonVariant = 'ghost' | 'shadow' | 'default'

export interface ButtonProps extends ButtonStateColors {
  width: number
  align: 'grow' | 'start'
  variant: ButtonVariant
  shape: 'square' | 'circle'
  size: 'small' | 'medium' | 'large'
  type: 'submit' | 'reset' | 'button'
  prefix: React.ReactNode
  suffix: React.ReactNode
  color: ButtonColor
  loading: boolean
  disabled: boolean
  block: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

export type ReturningUseButton<T extends Partial<ButtonProps> = Partial<ButtonProps>> = T & ButtonStateColors

const defaultVariantColorSets: ButtonColorSet = (theme) => {
  return {
    primary: {
      normal: {
        foreground: theme.colors.PRIMARY.BACKGROUND,
        background: theme.colors.PRIMARY.FOREGROUND,
        border: theme.colors.PRIMARY.FOREGROUND
      },
      hover: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.PRIMARY.FOREGROUND
      },
      active: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.PRIMARY.ACCENT_2,
        border: theme.colors.PRIMARY.FOREGROUND
      }
    },
    secondary: {
      normal: {
        foreground: theme.colors.PRIMARY.ACCENT_5,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.PRIMARY.ACCENT_2
      },
      hover: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.PRIMARY.FOREGROUND
      },
      active: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.PRIMARY.ACCENT_2,
        border: theme.colors.PRIMARY.FOREGROUND
      }
    },
    success: {
      normal: {
        foreground: theme.colors.PRIMARY.BACKGROUND,
        background: theme.colors.SUCCESS.DEFAULT,
        border: theme.colors.SUCCESS.DEFAULT
      },
      hover: {
        foreground: theme.colors.SUCCESS.DEFAULT,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.SUCCESS.DEFAULT
      },
      active: {
        foreground: theme.colors.SUCCESS.DEFAULT,
        background: theme.colors.PRIMARY.ACCENT_2,
        border: theme.colors.SUCCESS.DEFAULT
      }
    },
    error: {
      normal: {
        foreground: theme.colors.PRIMARY.BACKGROUND,
        background: theme.colors.ERROR.DEFAULT,
        border: theme.colors.ERROR.DEFAULT
      },
      hover: {
        foreground: theme.colors.ERROR.DEFAULT,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.ERROR.DEFAULT
      },
      active: {
        foreground: theme.colors.ERROR.DEFAULT,
        background: theme.colors.PRIMARY.ACCENT_2,
        border: theme.colors.ERROR.DEFAULT
      }
    },
    warning: {
      normal: {
        foreground: theme.colors.PRIMARY.BACKGROUND,
        background: theme.colors.WARNING.DEFAULT,
        border: theme.colors.WARNING.DEFAULT
      },
      hover: {
        foreground: theme.colors.WARNING.DEFAULT,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.WARNING.DEFAULT
      },
      active: {
        foreground: theme.colors.WARNING.DEFAULT,
        background: theme.colors.PRIMARY.ACCENT_2,
        border: theme.colors.WARNING.DEFAULT
      }
    },
    alert: {
      normal: {
        foreground: theme.colors.PRIMARY.BACKGROUND,
        background: theme.colors.HIGHLIGHT.PINK,
        border: theme.colors.HIGHLIGHT.PINK
      },
      hover: {
        foreground: theme.colors.HIGHLIGHT.PINK,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.HIGHLIGHT.PINK
      },
      active: {
        foreground: theme.colors.HIGHLIGHT.PINK,
        background: theme.colors.PRIMARY.ACCENT_2,
        border: theme.colors.HIGHLIGHT.PINK
      }
    },
    violet: {
      normal: {
        foreground: theme.colors.PRIMARY.BACKGROUND,
        background: theme.colors.VIOLET.DEFAULT,
        border: theme.colors.VIOLET.DEFAULT
      },
      hover: {
        foreground: theme.colors.VIOLET.DEFAULT,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.VIOLET.DEFAULT
      },
      active: {
        foreground: theme.colors.VIOLET.DEFAULT,
        background: theme.colors.PRIMARY.ACCENT_2,
        border: theme.colors.VIOLET.DEFAULT
      }
    }
  }
}

const shadowVariantColorSets: ButtonColorSet = (theme) => {
  return {
    primary: {
      normal: {
        foreground: theme.colors.PRIMARY.BACKGROUND,
        background: theme.colors.PRIMARY.FOREGROUND,
        border: theme.colors.PRIMARY.FOREGROUND
      },
      hover: {
        foreground: theme.colors.PRIMARY.BACKGROUND,
        background: theme.colors.PRIMARY.FOREGROUND,
        border: theme.colors.PRIMARY.FOREGROUND
      },
      active: {
        foreground: theme.colors.PRIMARY.BACKGROUND,
        background: theme.colors.PRIMARY.FOREGROUND,
        border: theme.colors.PRIMARY.FOREGROUND
      }
    },
    secondary: {
      normal: {
        foreground: theme.colors.PRIMARY.ACCENT_5,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.PRIMARY.BACKGROUND
      },
      hover: {
        foreground: theme.colors.PRIMARY.ACCENT_5,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.PRIMARY.BACKGROUND
      },
      active: {
        foreground: theme.colors.PRIMARY.ACCENT_5,
        background: theme.colors.PRIMARY.BACKGROUND,
        border: theme.colors.PRIMARY.BACKGROUND
      }
    },
    success: {
      normal: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.SUCCESS.DEFAULT,
        border: theme.colors.SUCCESS.DEFAULT
      },
      hover: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.SUCCESS.DEFAULT,
        border: theme.colors.SUCCESS.DEFAULT
      },
      active: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.SUCCESS.DEFAULT,
        border: theme.colors.SUCCESS.DEFAULT
      }
    },
    error: {
      normal: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.ERROR.DEFAULT,
        border: theme.colors.ERROR.DEFAULT
      },
      hover: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.ERROR.DEFAULT,
        border: theme.colors.ERROR.DEFAULT
      },
      active: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.ERROR.DEFAULT,
        border: theme.colors.ERROR.DEFAULT
      }
    },
    warning: {
      normal: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.WARNING.DEFAULT,
        border: theme.colors.WARNING.DEFAULT
      },
      hover: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.WARNING.DEFAULT,
        border: theme.colors.WARNING.DEFAULT
      },
      active: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.WARNING.DEFAULT,
        border: theme.colors.WARNING.DEFAULT
      }
    },
    alert: {
      normal: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.HIGHLIGHT.PINK,
        border: theme.colors.HIGHLIGHT.PINK
      },
      hover: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.HIGHLIGHT.PINK,
        border: theme.colors.HIGHLIGHT.PINK
      },
      active: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.HIGHLIGHT.PINK,
        border: theme.colors.HIGHLIGHT.PINK
      }
    },
    violet: {
      normal: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.VIOLET.DEFAULT,
        border: theme.colors.VIOLET.DEFAULT
      },
      hover: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.VIOLET.DEFAULT,
        border: theme.colors.VIOLET.DEFAULT
      },
      active: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.VIOLET.DEFAULT,
        border: theme.colors.VIOLET.DEFAULT
      }
    }
  }
}

const ghostVariantColorSets: ButtonColorSet = (theme) => {
  return {
    primary: {
      normal: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: 'none',
        border: 'transparent'
      },
      hover: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.PRIMARY.ACCENT_4,
        border: 'transparent'
      },
      active: {
        foreground: theme.colors.PRIMARY.FOREGROUND,
        background: theme.colors.PRIMARY.ACCENT_4,
        border: 'transparent'
      }
    },
    secondary: {
      normal: {
        foreground: theme.colors.PRIMARY.ACCENT_5,
        background: 'none',
        border: 'transparent'
      },
      hover: {
        foreground: theme.colors.PRIMARY.ACCENT_5,
        background: theme.colors.PRIMARY.ACCENT_4,
        border: 'transparent'
      },
      active: {
        foreground: theme.colors.PRIMARY.ACCENT_5,
        background: theme.colors.PRIMARY.ACCENT_4,
        border: 'transparent'
      }
    },
    success: {
      normal: {
        foreground: theme.colors.SUCCESS.DEFAULT,
        background: 'none',
        border: 'transparent'
      },
      hover: {
        foreground: theme.colors.SUCCESS.DEFAULT,
        background: theme.colors.SUCCESS.DEFAULT,
        border: 'transparent'
      },
      active: {
        foreground: theme.colors.SUCCESS.DEFAULT,
        background: theme.colors.SUCCESS.DEFAULT,
        border: 'transparent'
      }
    },
    error: {
      normal: {
        foreground: theme.colors.ERROR.DEFAULT,
        background: 'none',
        border: 'transparent'
      },
      hover: {
        foreground: theme.colors.ERROR.DEFAULT,
        background: theme.colors.ERROR.DEFAULT,
        border: 'transparent'
      },
      active: {
        foreground: theme.colors.ERROR.DEFAULT,
        background: theme.colors.ERROR.DEFAULT,
        border: 'transparent'
      }
    },
    warning: {
      normal: {
        foreground: theme.colors.WARNING.DEFAULT,
        background: 'none',
        border: 'transparent'
      },
      hover: {
        foreground: theme.colors.WARNING.DEFAULT,
        background: theme.colors.WARNING.DEFAULT,
        border: 'transparent'
      },
      active: {
        foreground: theme.colors.WARNING.DEFAULT,
        background: theme.colors.WARNING.DEFAULT,
        border: 'transparent'
      }
    },
    alert: {
      normal: {
        foreground: theme.colors.HIGHLIGHT.PINK,
        background: 'none',
        border: 'transparent'
      },
      hover: {
        foreground: theme.colors.HIGHLIGHT.PINK,
        background: theme.colors.HIGHLIGHT.PINK,
        border: 'transparent'
      },
      active: {
        foreground: theme.colors.HIGHLIGHT.PINK,
        background: theme.colors.HIGHLIGHT.PINK,
        border: 'transparent'
      }
    },
    violet: {
      normal: {
        foreground: theme.colors.VIOLET.DEFAULT,
        background: 'none',
        border: 'transparent'
      },
      hover: {
        foreground: theme.colors.VIOLET.DEFAULT,
        background: theme.colors.VIOLET.DEFAULT,
        border: 'transparent'
      },
      active: {
        foreground: theme.colors.VIOLET.DEFAULT,
        background: theme.colors.VIOLET.DEFAULT,
        border: 'transparent'
      }
    }
  }
}

const colorVariantSets = {
  default: defaultVariantColorSets,
  ghost: ghostVariantColorSets,
  shadow: shadowVariantColorSets
}

export const createColorSets = (variant: ButtonVariant, theme: Theme, color: ButtonColor): ButtonStateColors => {
  return colorVariantSets[variant](theme)[color]
}

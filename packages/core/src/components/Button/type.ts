import React from 'react'

import { Colors } from '../ThemeProvider/type'

export interface ButtonProps {
  width: number
  align: 'grow' | 'start'
  variant: 'ghost' | 'shadow' | 'default'
  shape: 'square' | 'circle'
  size: 'small' | 'medium' | 'large'
  prefix: React.ReactNode
  suffix: React.ReactNode
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'alert' | 'violet'
  normal: { foreground: string; background: string; border: string }
  hover: { foreground: string; background: string; border: string }
  active: { foreground: string; background: string; border: string }
  loading: boolean
  disabled: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

export type ReturningUseButton<T extends Partial<ButtonProps> = Partial<ButtonProps>> = T & {
  // Element: React.ElementType
}

const defaultVariantColorSets = {
  primary: {
    normal: {
      foreground: Colors.PRIMARY.BACKGROUND,
      background: Colors.PRIMARY.FOREGROUND,
      border: Colors.PRIMARY.FOREGROUND
    },
    hover: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.PRIMARY.FOREGROUND
    },
    active: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.PRIMARY.ACCENT_2,
      border: Colors.PRIMARY.FOREGROUND
    }
  },
  secondary: {
    normal: {
      foreground: Colors.PRIMARY.ACCENT_5,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.PRIMARY.ACCENT_2
    },
    hover: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.PRIMARY.FOREGROUND
    },
    active: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.PRIMARY.ACCENT_2,
      border: Colors.PRIMARY.FOREGROUND
    }
  },
  success: {
    normal: {
      foreground: Colors.PRIMARY.BACKGROUND,
      background: Colors.SUCCESS.DEFAULT,
      border: Colors.SUCCESS.DEFAULT
    },
    hover: {
      foreground: Colors.SUCCESS.DEFAULT,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.SUCCESS.DEFAULT
    },
    active: {
      foreground: Colors.SUCCESS.DEFAULT,
      background: Colors.PRIMARY.ACCENT_2,
      border: Colors.SUCCESS.DEFAULT
    }
  },
  error: {
    normal: {
      foreground: Colors.PRIMARY.BACKGROUND,
      background: Colors.ERROR.DEFAULT,
      border: Colors.ERROR.DEFAULT
    },
    hover: {
      foreground: Colors.ERROR.DEFAULT,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.ERROR.DEFAULT
    },
    active: {
      foreground: Colors.ERROR.DEFAULT,
      background: Colors.PRIMARY.ACCENT_2,
      border: Colors.ERROR.DEFAULT
    }
  },
  warning: {
    normal: {
      foreground: Colors.PRIMARY.BACKGROUND,
      background: Colors.WARNING.DEFAULT,
      border: Colors.WARNING.DEFAULT
    },
    hover: {
      foreground: Colors.WARNING.DEFAULT,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.WARNING.DEFAULT
    },
    active: {
      foreground: Colors.WARNING.DEFAULT,
      background: Colors.PRIMARY.ACCENT_2,
      border: Colors.WARNING.DEFAULT
    }
  },
  alert: {
    normal: {
      foreground: Colors.PRIMARY.BACKGROUND,
      background: Colors.HIGHLIGHT.PINK,
      border: Colors.HIGHLIGHT.PINK
    },
    hover: {
      foreground: Colors.HIGHLIGHT.PINK,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.HIGHLIGHT.PINK
    },
    active: {
      foreground: Colors.HIGHLIGHT.PINK,
      background: Colors.PRIMARY.ACCENT_2,
      border: Colors.HIGHLIGHT.PINK
    }
  },
  violet: {
    normal: {
      foreground: Colors.PRIMARY.BACKGROUND,
      background: Colors.VIOLET.DEFAULT,
      border: Colors.VIOLET.DEFAULT
    },
    hover: {
      foreground: Colors.VIOLET.DEFAULT,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.VIOLET.DEFAULT
    },
    active: {
      foreground: Colors.VIOLET.DEFAULT,
      background: Colors.PRIMARY.ACCENT_2,
      border: Colors.VIOLET.DEFAULT
    }
  }
}

const shadowVariantColorSets = {
  primary: {
    normal: {
      foreground: Colors.PRIMARY.BACKGROUND,
      background: Colors.PRIMARY.FOREGROUND,
      border: Colors.PRIMARY.FOREGROUND
    },
    hover: {
      foreground: Colors.PRIMARY.BACKGROUND,
      background: Colors.PRIMARY.FOREGROUND,
      border: Colors.PRIMARY.FOREGROUND
    },
    active: {
      foreground: Colors.PRIMARY.BACKGROUND,
      background: Colors.PRIMARY.FOREGROUND,
      border: Colors.PRIMARY.FOREGROUND
    }
  },
  secondary: {
    normal: {
      foreground: Colors.PRIMARY.ACCENT_5,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.PRIMARY.BACKGROUND
    },
    hover: {
      foreground: Colors.PRIMARY.ACCENT_5,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.PRIMARY.BACKGROUND
    },
    active: {
      foreground: Colors.PRIMARY.ACCENT_5,
      background: Colors.PRIMARY.BACKGROUND,
      border: Colors.PRIMARY.BACKGROUND
    }
  },
  success: {
    normal: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.SUCCESS.DEFAULT,
      border: Colors.SUCCESS.DEFAULT
    },
    hover: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.SUCCESS.DEFAULT,
      border: Colors.SUCCESS.DEFAULT
    },
    active: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.SUCCESS.DEFAULT,
      border: Colors.SUCCESS.DEFAULT
    }
  },
  error: {
    normal: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.ERROR.DEFAULT,
      border: Colors.ERROR.DEFAULT
    },
    hover: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.ERROR.DEFAULT,
      border: Colors.ERROR.DEFAULT
    },
    active: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.ERROR.DEFAULT,
      border: Colors.ERROR.DEFAULT
    }
  },
  warning: {
    normal: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.WARNING.DEFAULT,
      border: Colors.WARNING.DEFAULT
    },
    hover: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.WARNING.DEFAULT,
      border: Colors.WARNING.DEFAULT
    },
    active: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.WARNING.DEFAULT,
      border: Colors.WARNING.DEFAULT
    }
  },
  alert: {
    normal: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.HIGHLIGHT.PINK,
      border: Colors.HIGHLIGHT.PINK
    },
    hover: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.HIGHLIGHT.PINK,
      border: Colors.HIGHLIGHT.PINK
    },
    active: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.HIGHLIGHT.PINK,
      border: Colors.HIGHLIGHT.PINK
    }
  },
  violet: {
    normal: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.VIOLET.DEFAULT,
      border: Colors.VIOLET.DEFAULT
    },
    hover: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.VIOLET.DEFAULT,
      border: Colors.VIOLET.DEFAULT
    },
    active: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.VIOLET.DEFAULT,
      border: Colors.VIOLET.DEFAULT
    }
  }
}

const ghostVariantColorSets = {
  primary: {
    normal: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: 'none',
      border: 'transparent'
    },
    hover: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.PRIMARY.ACCENT_4,
      border: 'transparent'
    },
    active: {
      foreground: Colors.PRIMARY.FOREGROUND,
      background: Colors.PRIMARY.ACCENT_4,
      border: 'transparent'
    }
  },
  secondary: {
    normal: {
      foreground: Colors.PRIMARY.ACCENT_5,
      background: 'none',
      border: 'transparent'
    },
    hover: {
      foreground: Colors.PRIMARY.ACCENT_5,
      background: Colors.PRIMARY.ACCENT_4,
      border: 'transparent'
    },
    active: {
      foreground: Colors.PRIMARY.ACCENT_5,
      background: Colors.PRIMARY.ACCENT_4,
      border: 'transparent'
    }
  },
  success: {
    normal: {
      foreground: Colors.SUCCESS.DEFAULT,
      background: 'none',
      border: 'transparent'
    },
    hover: {
      foreground: Colors.SUCCESS.DEFAULT,
      background: Colors.SUCCESS.DEFAULT,
      border: 'transparent'
    },
    active: {
      foreground: Colors.SUCCESS.DEFAULT,
      background: Colors.SUCCESS.DEFAULT,
      border: 'transparent'
    }
  },
  error: {
    normal: {
      foreground: Colors.ERROR.DEFAULT,
      background: 'none',
      border: 'transparent'
    },
    hover: {
      foreground: Colors.ERROR.DEFAULT,
      background: Colors.ERROR.DEFAULT,
      border: 'transparent'
    },
    active: {
      foreground: Colors.ERROR.DEFAULT,
      background: Colors.ERROR.DEFAULT,
      border: 'transparent'
    }
  },
  warning: {
    normal: {
      foreground: Colors.WARNING.DEFAULT,
      background: 'none',
      border: 'transparent'
    },
    hover: {
      foreground: Colors.WARNING.DEFAULT,
      background: Colors.WARNING.DEFAULT,
      border: 'transparent'
    },
    active: {
      foreground: Colors.WARNING.DEFAULT,
      background: Colors.WARNING.DEFAULT,
      border: 'transparent'
    }
  },
  alert: {
    normal: {
      foreground: Colors.HIGHLIGHT.PINK,
      background: 'none',
      border: 'transparent'
    },
    hover: {
      foreground: Colors.HIGHLIGHT.PINK,
      background: Colors.HIGHLIGHT.PINK,
      border: 'transparent'
    },
    active: {
      foreground: Colors.HIGHLIGHT.PINK,
      background: Colors.HIGHLIGHT.PINK,
      border: 'transparent'
    }
  },
  violet: {
    normal: {
      foreground: Colors.VIOLET.DEFAULT,
      background: 'none',
      border: 'transparent'
    },
    hover: {
      foreground: Colors.VIOLET.DEFAULT,
      background: Colors.VIOLET.DEFAULT,
      border: 'transparent'
    },
    active: {
      foreground: Colors.VIOLET.DEFAULT,
      background: Colors.VIOLET.DEFAULT,
      border: 'transparent'
    }
  }
}

export const colorVariantSets = {
  default: defaultVariantColorSets,
  ghost: ghostVariantColorSets,
  shadow: shadowVariantColorSets
}

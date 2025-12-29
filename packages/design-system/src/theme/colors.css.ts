import { createGlobalTheme, createVar } from '@vanilla-extract/css'
import { COLOR_TOKENS } from './colorTokens'

// Create typed CSS variables
export const primaryAccent1 = createVar()
export const primaryAccent2 = createVar()
export const primaryAccent3 = createVar()
export const primaryAccent4 = createVar()
export const primaryAccent5 = createVar()
export const primaryAccent6 = createVar()
export const primaryAccent7 = createVar()
export const primaryAccent8 = createVar()
export const primaryBackground = createVar()
export const primaryForeground = createVar()

export const successDefault = createVar()
export const successLight = createVar()
export const successDark = createVar()

export const errorDefault = createVar()
export const errorLight = createVar()
export const errorDark = createVar()

export const warningDefault = createVar()
export const warningLight = createVar()
export const warningDark = createVar()

export const highlightPink = createVar()
export const highlightPurple = createVar()
export const highlightBlue = createVar()
export const highlightCyan = createVar()
export const highlightGreen = createVar()
export const highlightRed = createVar()
export const highlightOrange = createVar()
export const highlightYellow = createVar()

export const colors = createGlobalTheme(':root', {
  // Primary colors
  [primaryAccent1]: COLOR_TOKENS.PRIMARY.GRAY_50,
  [primaryAccent2]: COLOR_TOKENS.PRIMARY.GRAY_100,
  [primaryAccent3]: COLOR_TOKENS.PRIMARY.GRAY_300,
  [primaryAccent4]: COLOR_TOKENS.PRIMARY.GRAY_400,
  [primaryAccent5]: COLOR_TOKENS.PRIMARY.GRAY_500,
  [primaryAccent6]: COLOR_TOKENS.PRIMARY.GRAY_600,
  [primaryAccent7]: COLOR_TOKENS.PRIMARY.GRAY_700,
  [primaryAccent8]: COLOR_TOKENS.PRIMARY.GRAY_800,
  [primaryBackground]: COLOR_TOKENS.PRIMARY.WHITE,
  [primaryForeground]: COLOR_TOKENS.PRIMARY.BLACK,

  // Success colors
  [successDefault]: COLOR_TOKENS.SUCCESS.DEFAULT,
  [successLight]: COLOR_TOKENS.SUCCESS.LIGHT,
  [successDark]: COLOR_TOKENS.SUCCESS.DARK,

  // Error colors
  [errorDefault]: COLOR_TOKENS.ERROR.DEFAULT,
  [errorLight]: COLOR_TOKENS.ERROR.LIGHT,
  [errorDark]: COLOR_TOKENS.ERROR.DARK,

  // Warning colors
  [warningDefault]: COLOR_TOKENS.WARNING.DEFAULT,
  [warningLight]: COLOR_TOKENS.WARNING.LIGHT,
  [warningDark]: COLOR_TOKENS.WARNING.DARK,

  // Highlight colors
  [highlightPink]: COLOR_TOKENS.HIGHLIGHT.PINK,
  [highlightPurple]: COLOR_TOKENS.HIGHLIGHT.PURPLE,
  [highlightBlue]: COLOR_TOKENS.HIGHLIGHT.BLUE,
  [highlightCyan]: COLOR_TOKENS.HIGHLIGHT.CYAN,
  [highlightGreen]: COLOR_TOKENS.HIGHLIGHT.GREEN,
  [highlightRed]: COLOR_TOKENS.HIGHLIGHT.RED,
  [highlightOrange]: COLOR_TOKENS.HIGHLIGHT.ORANGE,
  [highlightYellow]: COLOR_TOKENS.HIGHLIGHT.YELLOW
})

// Dark theme colors
export const darkColors = {
  [primaryAccent1]: COLOR_TOKENS.PRIMARY.GRAY_800,
  [primaryAccent2]: COLOR_TOKENS.PRIMARY.GRAY_700,
  [primaryAccent3]: COLOR_TOKENS.PRIMARY.GRAY_600,
  [primaryAccent4]: COLOR_TOKENS.PRIMARY.GRAY_500,
  [primaryAccent5]: COLOR_TOKENS.PRIMARY.GRAY_400,
  [primaryAccent6]: COLOR_TOKENS.PRIMARY.GRAY_300,
  [primaryAccent7]: COLOR_TOKENS.PRIMARY.GRAY_100,
  [primaryAccent8]: COLOR_TOKENS.PRIMARY.GRAY_50,
  [primaryBackground]: COLOR_TOKENS.PRIMARY.BLACK,
  [primaryForeground]: COLOR_TOKENS.PRIMARY.WHITE,

  [successDefault]: COLOR_TOKENS.SUCCESS.LIGHT,
  [successLight]: COLOR_TOKENS.SUCCESS.DEFAULT,
  [successDark]: COLOR_TOKENS.SUCCESS.DARK,

  [errorDefault]: COLOR_TOKENS.ERROR.LIGHT,
  [errorLight]: COLOR_TOKENS.ERROR.DEFAULT,
  [errorDark]: COLOR_TOKENS.ERROR.DARK,

  [warningDefault]: COLOR_TOKENS.WARNING.LIGHT,
  [warningLight]: COLOR_TOKENS.WARNING.DEFAULT,
  [warningDark]: COLOR_TOKENS.WARNING.DARK,

  [highlightPink]: COLOR_TOKENS.HIGHLIGHT.PINK,
  [highlightPurple]: COLOR_TOKENS.HIGHLIGHT.PURPLE,
  [highlightBlue]: COLOR_TOKENS.HIGHLIGHT.BLUE,
  [highlightCyan]: COLOR_TOKENS.HIGHLIGHT.CYAN,
  [highlightGreen]: COLOR_TOKENS.HIGHLIGHT.GREEN,
  [highlightRed]: COLOR_TOKENS.HIGHLIGHT.RED,
  [highlightOrange]: COLOR_TOKENS.HIGHLIGHT.ORANGE,
  [highlightYellow]: COLOR_TOKENS.HIGHLIGHT.YELLOW
}
